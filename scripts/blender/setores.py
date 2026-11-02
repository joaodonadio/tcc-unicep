r"""Gera os 11 modelos 3D dos setores usados na cena do site.

Como rodar (sem janela, sempre com --factory-startup, sem add-ons):

  & "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python scripts/blender/setores.py

Saida: public/modelos/setores/<chave>.glb (a partir da raiz do repositorio).
Para gravar em outra pasta, passe-a depois de "--":

  ... --python scripts/blender/setores.py -- "C:\pasta\de\saida"

Contrato (spec da rodada 3D):
- Cada objeto final tem o nome da peca, que vira node.name no three.js.
- Escala uniforme: a maior dimensao do conjunto vale 1 (caixa 1x1x1), base em z=0, centro em x/y.
- Frente do objeto para -Y no Blender (vira +Z no glTF).
- Origem: na base (padrao), no centro (Fumaca, Onda, Gota, Moeda) ou no topo (Sacola).
  Picareta: origem no fim do cabo, que e a base do objeto.
- Alca e filha de Sacola (pivo no topo), para balancar junto.
- Cores hex do tema convertidas de sRGB para linear, que e o que o Blender usa.
- Metallic 0.7 so em Moeda e Pinos. Emission preta: o site acende em tempo de execucao.
"""

import bpy
import bmesh
import math
import os
import random
import sys
from mathutils import Matrix, Vector

RAIZ = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SAIDA = ARGS[0] if ARGS else os.path.join(RAIZ, "public", "modelos", "setores")

AMBAR = "#e8b84a"
AMBAR_P = "#b98a2e"
GRAFITE = "#5b554c"
GRAFITE_C = "#8a8378"
CREME = "#f3ede4"


def hex_linear(h):
    h = h.lstrip("#")
    cores = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in cores]
    return (lin[0], lin[1], lin[2], 1.0)


_materiais = {}


def material(cor, metal=0.0, rug=0.5):
    chave = (cor, metal, rug)
    if chave not in _materiais:
        m = bpy.data.materials.new(name=f"{cor}_m{metal}_r{rug}")
        m.use_nodes = True
        b = m.node_tree.nodes.get("Principled BSDF")
        b.inputs["Base Color"].default_value = hex_linear(cor)
        b.inputs["Metallic"].default_value = metal
        b.inputs["Roughness"].default_value = rug
        b.inputs["Emission Color"].default_value = (0.0, 0.0, 0.0, 1.0)
        _materiais[chave] = m
    return _materiais[chave]


# ---------------------------------------------------------------- geometria (bmesh)
# Cada construtor recebe um bmesh opcional (bm) e uma matriz opcional (M) e devolve o bmesh.


def _v(p, M):
    return M @ Vector(p) if M is not None else Vector(p)


def _recalc(bm, faces):
    bmesh.ops.recalc_face_normals(bm, faces=faces)


def bm_lathe(perfil, segs=32, M=None, bm=None):
    """Revolucao em torno de Z. perfil = lista de (raio, z). Raio 0 vira vertice do eixo."""
    bm = bm or bmesh.new()
    aneis = []
    for r, z in perfil:
        if r < 1e-6:
            aneis.append([bm.verts.new(_v((0.0, 0.0, z), M))])
        else:
            aneis.append([
                bm.verts.new(_v((r * math.cos(2 * math.pi * j / segs), r * math.sin(2 * math.pi * j / segs), z), M))
                for j in range(segs)
            ])
    novas = []
    for A, B in zip(aneis, aneis[1:]):
        if len(A) == 1 and len(B) == 1:
            continue
        for j in range(segs):
            k = (j + 1) % segs
            if len(A) == 1:
                novas.append(bm.faces.new((A[0], B[j], B[k])))
            elif len(B) == 1:
                novas.append(bm.faces.new((A[j], A[k], B[0])))
            else:
                novas.append(bm.faces.new((A[j], A[k], B[k], B[j])))
    _recalc(bm, novas)
    return bm


def bm_toro(R, r, segs=48, segs_t=12, M=None, bm=None):
    """Toro no plano XY (eixo Z), raio maior R e tubo r."""
    bm = bm or bmesh.new()
    grade = []
    for i in range(segs):
        a = 2 * math.pi * i / segs
        linha = []
        for j in range(segs_t):
            b = 2 * math.pi * j / segs_t
            rho = R + r * math.cos(b)
            linha.append(bm.verts.new(_v((rho * math.cos(a), rho * math.sin(a), r * math.sin(b)), M)))
        grade.append(linha)
    novas = []
    for i in range(segs):
        i2 = (i + 1) % segs
        for j in range(segs_t):
            j2 = (j + 1) % segs_t
            novas.append(bm.faces.new((grade[i][j], grade[i2][j], grade[i2][j2], grade[i][j2])))
    _recalc(bm, novas)
    return bm


def bm_haste(p0, p1, r, segs=8, bm=None):
    """Cilindro reto entre dois pontos (haste de treliça, alça)."""
    a, b = Vector(p0), Vector(p1)
    d = b - a
    L = d.length
    rot = Vector((0, 0, 1)).rotation_difference(d.normalized()).to_matrix().to_4x4()
    M = Matrix.Translation((a + b) / 2) @ rot @ Matrix.Diagonal(Vector((1, 1, L, 1)))
    return bm_lathe([(0, -0.5), (r, -0.5), (r, 0.5), (0, 0.5)], segs, M, bm)


def bm_caixa(c, t, bm=None):
    bm = bm or bmesh.new()
    M = Matrix.Translation(Vector(c)) @ Matrix.Diagonal(Vector((t[0], t[1], t[2], 1.0)))
    bmesh.ops.create_cube(bm, size=1.0, matrix=M)
    return bm


def bm_extrusao_xz(pts, y0, y1, M=None):
    """Poligono no plano XZ (lista de (x, z)) extrudado de y0 a y1."""
    bm = bmesh.new()
    fr = [bm.verts.new(_v((x, y0, z), M)) for x, z in pts]
    tr = [bm.verts.new(_v((x, y1, z), M)) for x, z in pts]
    n = len(pts)
    novas = [bm.faces.new(fr), bm.faces.new(tr[::-1])]
    for i in range(n):
        j = (i + 1) % n
        novas.append(bm.faces.new((fr[i], fr[j], tr[j], tr[i])))
    _recalc(bm, novas)
    return bm


def bm_esfera(c, r, seg=24, bm=None):
    meio = seg // 2
    perfil = [(r * math.sin(math.pi * k / meio), r * math.cos(math.pi * k / meio)) for k in range(meio + 1)]
    return bm_lathe(perfil, seg, Matrix.Translation(Vector(c)), bm)


def bm_icosfera(c, r, sub=1, ruido=0.0, escala=(1.0, 1.0, 1.0), seed=7):
    """Icosfera facetada, deslocada de forma deterministica e escalada por eixo (pedra de minerio)."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    rnd = random.Random(seed)
    cv = Vector(c)
    for v in bm.verts:
        f = 1 + rnd.uniform(-ruido, ruido)
        v.co = Vector((v.co.x * f * escala[0], v.co.y * f * escala[1], v.co.z * f * escala[2])) + cv
    return bm


# ---------------------------------------------------------------- pecas e objetos


def aplicar_modificadores(ob):
    """Aplica todos os modificadores do objeto (equivale a Apply, sem contexto de UI)."""
    if not ob.modifiers:
        return
    dg = bpy.context.evaluated_depsgraph_get()
    ev = ob.evaluated_get(dg)
    nova = bpy.data.meshes.new_from_object(ev, depsgraph=dg)
    velha = ob.data
    for m in list(ob.modifiers):
        ob.modifiers.remove(m)
    ob.data = nova
    bpy.data.meshes.remove(velha)


def P(nome, bm, cor, metal=0.0, rug=0.5, bisel=0.0, suave=True, sub=0):
    """Cria um objeto a partir de um bmesh, com bevel (2 segmentos) e subdivisao opcionais, ja aplicados."""
    me = bpy.data.meshes.new(nome)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(material(cor, metal, rug))
    ob = bpy.data.objects.new(nome, me)
    bpy.context.collection.objects.link(ob)
    if bisel > 0:
        m = ob.modifiers.new("Bisel", "BEVEL")
        m.width = bisel
        m.segments = 2
        m.limit_method = "ANGLE"
        m.angle_limit = math.radians(30)
    if sub > 0:
        m = ob.modifiers.new("Subdivisao", "SUBSURF")
        m.levels = sub
        m.render_levels = sub
    aplicar_modificadores(ob)
    ob.data.name = nome
    if suave:
        for p in ob.data.polygons:
            p.use_smooth = True
    return ob


def unir(nome, partes):
    """Junta pecas num unico objeto (mantem a primeira como ativa)."""
    if len(partes) == 1:
        ob = partes[0]
    else:
        bpy.ops.object.select_all(action="DESELECT")
        for p in partes:
            p.select_set(True)
        bpy.context.view_layer.objects.active = partes[0]
        bpy.ops.object.join()
        ob = partes[0]
    ob.name = nome
    ob.data.name = nome
    return ob


def limpar():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me)
    for ma in list(bpy.data.materials):
        bpy.data.materials.remove(ma)
    _materiais.clear()


def normalizar(objs):
    """Escala uniforme para a maior dimensao valer 1, base em z=0, centro em x/y."""
    mn = Vector((1e9, 1e9, 1e9))
    mx = Vector((-1e9, -1e9, -1e9))
    for ob in objs:
        for v in ob.data.vertices:
            for i in range(3):
                mn[i] = min(mn[i], v.co[i])
                mx[i] = max(mx[i], v.co[i])
    s = 1.0 / max(mx - mn)
    c = (mn + mx) / 2
    M = Matrix.Diagonal(Vector((s, s, s, 1.0))) @ Matrix.Translation(Vector((-c.x, -c.y, -mn.z)))
    for ob in objs:
        ob.data.transform(M)
        ob.data.update()
    return M


def definir_origem(ob, modo):
    """Move a origem para o ponto pedido sem mover a geometria (objeto ainda sem transformacao)."""
    vs = [v.co.copy() for v in ob.data.vertices]
    mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs)))
    mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
    if modo == "centro":
        p = (mn + mx) / 2
    elif modo == "topo":
        p = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mx.z))
    else:
        p = Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
    ob.data.transform(Matrix.Translation(-p))
    ob.data.update()
    ob.location = p


def exportar(objs, caminho):
    bpy.ops.object.select_all(action="DESELECT")
    for ob in objs:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.export_scene.gltf(
        filepath=caminho,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_animations=False,
    )


# ---------------------------------------------------------------- setores
# Cada grupo devolve (objetos_finais, modos_de_origem, pares_pai_filho).


def grupo_bens_industriais():
    objs, modos, pais = [], {}, []
    dentes = [(-1.2, 0.0), (1.2, 0.0), (1.2, 1.0), (1.2, 1.45), (0.4, 1.0), (0.4, 1.45),
              (-0.4, 1.0), (-0.4, 1.45), (-1.2, 1.0)]
    partes = [P("Galpao", bm_extrusao_xz(dentes, -0.7, 0.7), GRAFITE, bisel=0.03)]
    for x in (-0.5, 0.5):
        partes.append(P("Janela", bm_caixa((x, -0.72, 0.45), (0.34, 0.04, 0.3)), CREME, bisel=0.01))
    objs.append(unir("Galpao", partes))

    tirar = Matrix.Translation((-0.8, 0.0, 0.0))
    chamine = P("Chamine", bm_lathe([(0, 0.9), (0.14, 0.9), (0.14, 2.2), (0, 2.2)], 32, tirar), AMBAR, bisel=0.02)
    aro = P("Aro", bm_lathe([(0, 2.1), (0.19, 2.1), (0.19, 2.2), (0, 2.2)], 32, tirar), AMBAR_P, bisel=0.02)
    objs.append(unir("Chamine", [chamine, aro]))

    for i, (c, r) in enumerate([((-0.8, 0.0, 2.5), 0.10), ((-0.62, 0.05, 2.76), 0.13),
                                ((-0.95, -0.04, 3.02), 0.09)], 1):
        nome = f"Fumaca{i}"
        objs.append(P(nome, bm_esfera(c, r), CREME, rug=0.6))
        modos[nome] = "centro"
    return objs, modos, pais


def grupo_comunicacoes():
    objs, modos, pais = [], {}, []

    def cantos(z):
        w = 0.45 - 0.3 * (z / 2.4)
        return [(w, w, z), (-w, w, z), (-w, -w, z), (w, -w, z)]

    niveis = [0.0, 0.6, 1.2, 1.8, 2.4]
    bm = None
    for i in range(4):
        bm = bm_haste(cantos(0.0)[i], cantos(2.4)[i], 0.035, 8, bm)
    for z in niveis[1:]:
        for i in range(4):
            bm = bm_haste(cantos(z)[i], cantos(z)[(i + 1) % 4], 0.025, 8, bm)
    for za, zb in zip(niveis, niveis[1:]):
        for i in range(4):
            j = (i + 1) % 4
            bm = bm_haste(cantos(za)[i], cantos(zb)[j], 0.022, 8, bm)
            bm = bm_haste(cantos(za)[j], cantos(zb)[i], 0.022, 8, bm)
    objs.append(P("Torre", bm, GRAFITE))

    objs.append(P("Ponta", bm_lathe([(0, 2.4), (0.14, 2.4), (0, 2.75)], 24), AMBAR, bisel=0.01))
    for nome, R, z in (("Onda1", 0.42, 2.95), ("Onda2", 0.6, 3.25)):
        objs.append(P(nome, bm_toro(R, 0.03, M=Matrix.Translation((0, 0, z))), AMBAR))
        modos[nome] = "centro"
    return objs, modos, pais


def grupo_materiais_basicos():
    """Aglomerado de minerio (3 pedras facetadas + cristais ambar) e picareta inclinada sobre ele."""
    objs, modos, pais = [], {}, []

    # Pedras: icosferas subdiv 1 (flat), deformadas e escaladas de forma diferente.
    pedras = [
        ((-0.35, 0.0, 0.40), 0.45, (1.15, 0.95, 0.80), 0.10, 3, GRAFITE),
        ((0.08, 0.10, 0.26), 0.31, (1.00, 1.12, 0.86), 0.12, 11, GRAFITE_C),
        ((-0.66, 0.22, 0.20), 0.24, (0.92, 1.00, 0.78), 0.10, 19, GRAFITE),
    ]
    partes = []
    for i, (c, r, esc, ruido, seed, cor) in enumerate(pedras, 1):
        partes.append(P(f"Pedra{i}", bm_icosfera(c, r, sub=1, ruido=ruido, escala=esc, seed=seed),
                        cor, rug=0.5, suave=False))

    # Cristais ambar: prismas hexagonais com ponta piramidal, inclinados 15 a 25 graus.
    cristais = [
        ((-0.35, -0.05, 0.78), 0.075, 0.44, "X", 20),
        ((-0.18, 0.16, 0.66), 0.055, 0.30, "Y", -18),
        ((-0.52, 0.12, 0.66), 0.062, 0.36, "X", -23),
        ((0.10, 0.08, 0.52), 0.045, 0.24, "Y", 15),
    ]
    for i, (b, r, h, eixo, ang) in enumerate(cristais, 1):
        M = Matrix.Translation(Vector(b)) @ Matrix.Rotation(math.radians(ang), 4, eixo)
        partes.append(P(f"Cristal{i}", bm_lathe([(0, 0), (r, 0), (r, h), (0, h + 0.6 * r)], 6, M),
                        AMBAR, rug=0.3, suave=False))
    objs.append(unir("Minerio", partes))

    # Picareta: cabo grosso e cabeca curva com pontas afinando, inclinada 30 graus (para a esquerda).
    # Tudo construido ja com a rotacao e a translacao; a origem fica no fim do cabo (0.6, 0, 0).
    M = Matrix.Translation((0.6, 0.0, 0.0)) @ Matrix.Rotation(math.radians(-30), 4, "Y")
    cabo = P("Cabo", bm_lathe([(0, 0), (0.07, 0), (0.07, 1.7), (0, 1.7)], 16, M), AMBAR_P, rug=0.5, bisel=0.02)
    L = 0.62
    xs = [-L + 2 * L * i / 12 for i in range(13)]
    topo = [(x, 1.80 - 0.25 * (x / L) ** 2) for x in xs]
    fundo = []
    for x in reversed(xs):
        espessura = 0.05 + 0.15 * (1 - (x / L) ** 2)
        fundo.append((x, 1.80 - 0.25 * (x / L) ** 2 - espessura))
    cabeca = P("Cabeca", bm_extrusao_xz(topo + fundo, -0.06, 0.06, M), GRAFITE_C, metal=0.7, rug=0.35, bisel=0.02)
    objs.append(unir("Picareta", [cabo, cabeca]))
    modos["Picareta"] = ("ponto", (0.6, 0.0, 0.0))
    return objs, modos, pais


RAIO = [(0.10, 1.50), (0.45, 1.50), (0.12, 0.92), (0.40, 0.92), (-0.15, 0.00), (-0.02, 0.66), (-0.30, 0.66)]


def grupo_utilidade_publica():
    base = P("Base", bm_lathe([(0, 0), (0.5, 0), (0.5, 0.2), (0, 0.2)], 40), GRAFITE, bisel=0.03)
    raio = P("Raio", bm_extrusao_xz([(x, z + 0.15) for x, z in RAIO], -0.1, 0.1), AMBAR, rug=0.45, bisel=0.03)
    return [base, raio], {}, []


def grupo_consumo_nao_ciclico():
    corpo = P("Corpo", bm_lathe([(0, 0), (0.42, 0), (0.555, 0.7), (0.5, 0.7), (0.38, 0.06), (0, 0.06)], 40),
              AMBAR_P, bisel=0.02)
    faixas = None
    for z in (0.14, 0.28, 0.42, 0.56):
        R = 0.42 + 0.135 * (z / 0.7) + 0.008
        faixas = bm_toro(R, 0.022, 48, 10, Matrix.Translation((0, 0, z)), faixas)
    cesta = unir("Cesta", [corpo, P("Faixas", faixas, GRAFITE)])
    objs = [cesta]
    for i, (c, cor) in enumerate([((-0.2, 0.0, 0.8), AMBAR), ((0.18, 0.0, 0.8), CREME),
                                  ((0.0, 0.0, 0.98), AMBAR_P)], 1):
        bm = bm_esfera(c, 0.16)
        bm = bm_lathe([(0, 0), (0.012, 0), (0.012, 0.07), (0, 0.07)], 8,
                      Matrix.Translation((c[0], c[1], c[2] + 0.12)), bm)
        objs.append(P(f"Fruta{i}", bm, cor, rug=0.4))
    return objs, {}, []


def grupo_consumo_ciclico():
    corpo = P("Corpo", bm_extrusao_xz([(-0.36, 0.0), (0.36, 0.0), (0.44, 0.9), (-0.44, 0.9)], -0.25, 0.25),
              AMBAR, rug=0.5, bisel=0.04)
    etiqueta = P("Etiqueta", bm_caixa((0, -0.255, 0.5), (0.4, 0.02, 0.3)), CREME, bisel=0.01)
    sacola = unir("Sacola", [corpo, etiqueta])

    bm = None
    for y in (-0.14, 0.14):
        pontos = [(0.28 * math.cos(th), y, 0.9 + 0.42 * math.sin(th))
                  for th in [math.pi * (1 - k / 14) for k in range(15)]]
        for p0, p1 in zip(pontos, pontos[1:]):
            bm = bm_haste(p0, p1, 0.03, 8, bm)
    alca = P("Alca", bm, GRAFITE)
    return [sacola, alca], {"Sacola": "topo"}, [(alca, sacola)]


def grupo_financeiro():
    objs, modos, pais = [], {}, []
    degraus = None
    for w, d, z in [(2.0, 1.2, 0.06), (1.7, 1.0, 0.18), (1.4, 0.8, 0.30)]:
        degraus = bm_caixa((0, 0, z), (w, d, 0.12), degraus)
    degraus = P("Degraus", degraus, GRAFITE_C, bisel=0.01)
    corpo = P("Corpo", bm_caixa((0, 0, 0.93), (1.8, 0.7, 1.14)), GRAFITE, bisel=0.02)
    entablamento = P("Entablamento", bm_caixa((0, 0, 1.57), (2.0, 0.9, 0.14)), GRAFITE, bisel=0.02)
    frontao = P("Frontao", bm_extrusao_xz([(-1.0, 1.64), (1.0, 1.64), (0.0, 2.0)], -0.45, 0.45), GRAFITE, bisel=0.02)
    colunas = None
    for x in (-0.66, -0.22, 0.22, 0.66):
        colunas = bm_lathe([(0, 0.36), (0.055, 0.36), (0.055, 1.5), (0, 1.5)], 20,
                           Matrix.Translation((x, -0.36, 0)), colunas)
    colunas = P("Colunas", colunas, CREME, bisel=0.01)
    objs.append(unir("Banco", [degraus, corpo, entablamento, frontao, colunas]))

    moeda_perfil = [(0, -0.03), (0.22, -0.03), (0.23, -0.05), (0.28, -0.05), (0.30, -0.035), (0.30, 0.035),
                    (0.28, 0.05), (0.23, 0.05), (0.22, 0.03), (0, 0.03)]
    M = Matrix.Translation((0, 0, 2.45)) @ Matrix.Rotation(math.radians(90), 4, "X")
    objs.append(P("Moeda", bm_lathe(moeda_perfil, 48, M), AMBAR, metal=0.7, rug=0.45))
    modos["Moeda"] = "centro"
    return objs, modos, pais


def grupo_saude():
    pts = []
    for k in range(120):
        a = 2 * math.pi * k / 120
        pts.append((16 * math.sin(a) ** 3, 13 * math.cos(a) - 5 * math.cos(2 * a) - 2 * math.cos(3 * a) - math.cos(4 * a)))
    zmin = min(z for _, z in pts)
    zmax = max(z for _, z in pts)
    pts = [(x / 32, (z - zmin) / 32) for x, z in pts]
    altura = (zmax - zmin) / 32
    coracao = P("Coracao", bm_extrusao_xz(pts, -0.22, 0.22), AMBAR, rug=0.45, bisel=0.035, sub=1)
    zc = 0.5 * altura
    bm = bm_caixa((0, -0.23, zc), (0.36, 0.05, 0.1))
    bm = bm_caixa((0, -0.23, zc), (0.1, 0.05, 0.36), bm)
    cruz = P("Cruz", bm, CREME, bisel=0.012)
    return [coracao, cruz], {}, []


def gota_perfil():
    """Perfil (raio, z) de uma gota: arco de esfera de -90 a 40 graus, depois curva ate a ponta."""
    pts = []
    for k in range(11):
        th = -math.pi / 2 + math.radians(130) * k / 10
        pts.append((math.cos(th), math.sin(th)))
    p0 = pts[-1]
    c = (0.37, 1.10)
    ponta = (0.0, 1.9)
    for k in range(1, 9):
        t = k / 8
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * ponta[0]
        z = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * ponta[1]
        pts.append((x, z))
    return pts


def grupo_petroleo():
    def raio_barril(z):
        return 0.36 + 0.09 * math.sin(math.pi * z)

    perfil = [(0, 0), (0.33, 0)] + [(raio_barril(z), z) for z in [0.03 + 0.94 * k / 14 for k in range(15)]] \
        + [(0.33, 1.0), (0, 1.0)]
    barril = P("Barril", bm_lathe(perfil, 36), GRAFITE, rug=0.5)
    aros = None
    for z in (0.22, 0.78):
        R = raio_barril(z) + 0.012
        aros = bm_lathe([(0, z - 0.035), (R, z - 0.035), (R, z + 0.035), (0, z + 0.035)], 36, None, aros)
    aros = P("Aros", aros, AMBAR, rug=0.45, bisel=0.01)
    barril = unir("Barril", [barril, aros])

    M = Matrix.Translation((0, 0, 1.55)) @ Matrix.Diagonal(Vector((0.2, 0.2, 0.2, 1.0)))
    gota = P("Gota", bm_lathe(gota_perfil(), 36, M), AMBAR, rug=0.4)
    return [barril, gota], {"Gota": "centro"}, []


def grupo_tecnologia():
    placa = P("Placa", bm_caixa((0, 0, 0.08), (1.2, 1.2, 0.16)), GRAFITE, bisel=0.03)
    nucleo = P("Nucleo", bm_caixa((0, 0, 0.24), (0.62, 0.62, 0.16)), AMBAR, rug=0.45, bisel=0.03)
    pinos = None
    for v in (-0.4, -0.24, -0.08, 0.08, 0.24, 0.4):
        pinos = bm_caixa((0.66, v, 0.08), (0.12, 0.05, 0.05), pinos)
        pinos = bm_caixa((-0.66, v, 0.08), (0.12, 0.05, 0.05), pinos)
        pinos = bm_caixa((v, 0.66, 0.08), (0.05, 0.12, 0.05), pinos)
        pinos = bm_caixa((v, -0.66, 0.08), (0.05, 0.12, 0.05), pinos)
    pinos = P("Pinos", pinos, CREME, metal=0.7, rug=0.45, bisel=0.01)
    return [placa, nucleo, pinos], {}, []


def grupo_outros():
    corpo = P("Corpo", bm_caixa((0, 0, 1.1), (0.9, 0.7, 2.2)), GRAFITE, bisel=0.02)
    parapeito = P("Parapeito", bm_caixa((0, 0, 2.24), (1.0, 0.8, 0.08)), GRAFITE_C, bisel=0.01)
    faixas = None
    for k in range(5):
        faixas = bm_caixa((0, -0.355, 0.35 + 0.37 * k), (0.7, 0.03, 0.14), faixas)
    faixas = P("Faixas", faixas, AMBAR, bisel=0.01)
    return [unir("Predio", [corpo, parapeito, faixas])], {}, []


GRUPOS = [
    ("bens-industriais", grupo_bens_industriais),
    ("comunicacoes", grupo_comunicacoes),
    ("materiais-basicos", grupo_materiais_basicos),
    ("utilidade-publica", grupo_utilidade_publica),
    ("consumo-nao-ciclico", grupo_consumo_nao_ciclico),
    ("consumo-ciclico", grupo_consumo_ciclico),
    ("financeiro", grupo_financeiro),
    ("saude", grupo_saude),
    ("petroleo", grupo_petroleo),
    ("tecnologia", grupo_tecnologia),
    ("outros", grupo_outros),
]


def main():
    os.makedirs(SAIDA, exist_ok=True)
    # Segundo argumento opcional (depois de "--"): gera so o setor com essa chave.
    so = ARGS[1] if len(ARGS) > 1 else None
    for chave, fn in GRUPOS:
        if so and chave != so:
            continue
        limpar()
        objs, modos, pais = fn()
        M = normalizar(objs)
        for ob in objs:
            modo = modos.get(ob.name, "base")
            if isinstance(modo, tuple) and modo[0] == "ponto":
                # Ponto de origem dado antes da normalizacao: aplica a mesma transformacao.
                p = (M @ Vector((*modo[1], 1.0))).to_3d()
                ob.data.transform(Matrix.Translation(-p))
                ob.data.update()
                ob.location = p
            else:
                definir_origem(ob, modo)
        for filho, pai in pais:
            # Pai sem rotacao/escala: a posicao local do filho e a diferenca das origens.
            rel = filho.location - pai.location
            filho.parent = pai
            filho.matrix_parent_inverse = Matrix.Identity(4)
            filho.location = rel
        caminho = os.path.join(SAIDA, chave + ".glb")
        exportar(objs, caminho)
        print(f"[setores] {chave}: {[o.name for o in objs]} -> {caminho}")


main()
