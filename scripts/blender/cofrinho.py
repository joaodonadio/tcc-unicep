r"""
Modela o COFRINHO infantil (cerâmica, gordinho) e exporta public/modelos/cofrinho.glb.

Como rodar (sem janela; sempre com --factory-startup), a partir da raiz do projeto:

  & "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python scripts/blender/cofrinho.py -- --previa "<caminho>\previa-cofrinho.png"

Argumentos opcionais depois de "--":
  --saida <arquivo.glb>   padrão: public/modelos/cofrinho.glb do repositório
  --previa <arquivo.png>      renderiza uma prévia 600x600 (Eevee) ANTES de exportar, vista 3/4 frontal
  --previa-lado <arquivo.png> renderiza uma prévia 600x600 de 3/4 traseiro (mostra o rabo e a fenda)

Convenções:
  - Blender usa Z para cima. A frente do cofrinho fica em -Y; o exportador converte
    para Y para cima, então a frente vira +Z no glTF.
  - Corpo oval 2.3 (X) x 2.9 (Y) x 2.1 (Z); base do corpo em z = 0; centro em x = 0.
    Altura total com orelhas ~2.2 (ajustada no site depois).
  - Os nomes dos objetos são o contrato do spec (viram node.name no three.js).
  - Pivôs: Corpo na base; OrelhaE/OrelhaD na base da orelha; Rabo na junção com o corpo;
    OlhoE/OlhoD no centro do olho; demais peças no centro geométrico.
  - E = lado x negativo, D = lado x positivo (no Blender).
  - Transformações aplicadas: a geometria é construída já na posição final, sem escala
    nem rotação residual nos objetos; só a origem é deslocada (origin_set com cursor).
"""

import bpy
import bmesh
import math
import os
import sys
from mathutils import Matrix, Vector


# ----------------------------------------------------------------- argumentos
def _args():
    if "--" in sys.argv:
        return sys.argv[sys.argv.index("--") + 1:]
    return []


def _valor(flag, padrao):
    a = _args()
    if flag in a and a.index(flag) + 1 < len(a):
        return a[a.index(flag) + 1]
    return padrao


RAIZ = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
SAIDA = _valor("--saida", os.path.join(RAIZ, "public", "modelos", "cofrinho.glb"))
PREVIA = _valor("--previa", None)
PREVIA_LADO = _valor("--previa-lado", None)


# ----------------------------------------------------------------- cena limpa
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for me in list(bpy.data.meshes):
    bpy.data.meshes.remove(me)
for ma in list(bpy.data.materials):
    bpy.data.materials.remove(ma)


# ----------------------------------------------------------------- materiais
def hex_linear(h):
    """Converte #rrggbb (sRGB) para a cor linear que o Principled BSDF usa."""
    h = h.lstrip("#")
    canais = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255.0
        canais.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return (canais[0], canais[1], canais[2], 1.0)


def material(nome, cor, rugosidade=0.5, alfa=1.0):
    mat = bpy.data.materials.new(nome)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = hex_linear(cor)
    bsdf.inputs["Roughness"].default_value = rugosidade
    bsdf.inputs["Metallic"].default_value = 0.0
    if alfa < 1.0:
        bsdf.inputs["Alpha"].default_value = alfa
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "BLENDED"
        else:
            mat.blend_method = "BLEND"
    return mat


MAT = {
    "corpo": material("Cofrinho Corpo", "#eaa9c0", 0.5),
    "focinho": material("Cofrinho Focinho", "#d98aa6", 0.5),
    "escuro": material("Cofrinho Escuro", "#1a1815", 0.6),
    "olho": material("Cofrinho Olho", "#1a1815", 0.15),
    "brilho": material("Cofrinho Brilho", "#ffffff", 0.15),
    "bochecha": material("Cofrinho Bochecha", "#d98aa6", 0.5, alfa=0.7),
}


# ----------------------------------------------------------------- geometria
def T(v):
    return Matrix.Translation(tuple(v))


def S(x, y, z):
    return Matrix.Diagonal(Vector((x, y, z, 1.0)))


def RX(a):
    return Matrix.Rotation(a, 4, "X")


def RY(a):
    return Matrix.Rotation(a, 4, "Y")


def aplica(bm, m4):
    bmesh.ops.transform(bm, matrix=m4, verts=bm.verts)


def chanfro(bm, largura, segmentos):
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=largura, segments=segmentos, affect="EDGES")


def cilindro(raio, profundidade, segmentos):
    """Cilindro (ou cone de raio2 igual) com eixo Z, centrado na origem, com tampas."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=segmentos,
                          radius1=raio, radius2=raio, depth=profundidade)
    return bm


def esfera(raio_xyz, centro, u=32, v=16):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=1.0)
    aplica(bm, T(centro) @ S(*raio_xyz))
    return bm


def origem(ob, ponto):
    """Move a origem do objeto para `ponto` (origin_set com o cursor)."""
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.context.scene.cursor.location = Vector(ponto)
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR", center="MEDIAN")
    ob.select_set(False)


def objeto(nome, bm, mats, ponto_origem):
    me = bpy.data.meshes.new(nome)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    for m in mats:
        me.materials.append(m)
    ob = bpy.data.objects.new(nome, me)
    bpy.context.collection.objects.link(ob)
    origem(ob, ponto_origem)
    return ob


def tubo(pontos, raios, segs=8):
    """Tubo ao longo de uma polilinha, com seção circular e tampas nas pontas."""
    bm = bmesh.new()
    aneis = []
    n = len(pontos)
    for i, p in enumerate(pontos):
        a = pontos[max(i - 1, 0)]
        b = pontos[min(i + 1, n - 1)]
        t = (b - a).normalized()
        nrm = t.cross(Vector((1.0, 0.0, 0.0))).normalized()
        bin_ = t.cross(nrm).normalized()
        anel = []
        for k in range(segs):
            ang = 2.0 * math.pi * k / segs
            d = nrm * math.cos(ang) + bin_ * math.sin(ang)
            anel.append(bm.verts.new(p + d * raios[i]))
        aneis.append(anel)
    for i in range(n - 1):
        for k in range(segs):
            k2 = (k + 1) % segs
            bm.faces.new((aneis[i][k], aneis[i][k2], aneis[i + 1][k2], aneis[i + 1][k]))
    bm.faces.new(aneis[0])
    bm.faces.new(aneis[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


# Corpo: elipsoide oval, mais comprido na frente-trás (Y) do que alto (Z).
# Dimensões totais: largura X 2.3, comprimento Y 2.9, altura Z 2.1. Base achatada (x0.9) em z = 0.
ZC = 0.99
SEMI = (1.15, 1.45, 1.1)
FATOR_BASE = 0.9


def superficie(x, z):
    """Ponto da face frontal (y < 0) do corpo em (x, z) e a normal dali."""
    ny = 1.0 - (x / SEMI[0]) ** 2 - ((z - ZC) / SEMI[2]) ** 2
    y = -SEMI[1] * math.sqrt(max(ny, 0.0))
    g = Vector((x / SEMI[0] ** 2, y / SEMI[1] ** 2, (z - ZC) / SEMI[2] ** 2)).normalized()
    return Vector((x, y, z)), g


# ----------------------------------------------------------------- montagem
objs = {}

# Corpo: esfera UV com a metade de baixo achatada, base em z = 0.
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=32, radius=1.0)
for v in bm.verts:
    if v.co.z < 0:
        v.co.z *= FATOR_BASE
aplica(bm, T((0, 0, ZC)) @ S(*SEMI))
objs["Corpo"] = objeto("Corpo", bm, [MAT["corpo"]], (0, 0, 0))

# Focinho: cilindro curto na frente (-Y), um pouco abaixo do meio do corpo, bordas bem arredondadas.
# Feito por revolução de um perfil com cantos arredondados (o bevel de cilindro com 24 lados
# gerava serrilhado nas bordas).
def disco_arredondado(raio, altura, canto, segs=24, arco=6):
    """Disco de bordas arredondadas, eixo Y, centrado na origem."""
    h = altura / 2.0
    perfil = [(0.0, h)]
    for i in range(arco + 1):
        a = (math.pi / 2) * i / arco
        perfil.append((raio - canto + canto * math.sin(a), h - canto + canto * math.cos(a)))
    for i in range(arco + 1):
        a = (math.pi / 2) * i / arco
        perfil.append((raio - canto + canto * math.cos(a), -(h - canto) - canto * math.sin(a)))
    perfil.append((0.0, -h))
    bm = bmesh.new()
    aneis = []
    for r, y in perfil:
        if r == 0.0:
            aneis.append([bm.verts.new((0.0, y, 0.0))])
        else:
            aneis.append([bm.verts.new((r * math.cos(2 * math.pi * k / segs), y,
                                        r * math.sin(2 * math.pi * k / segs))) for k in range(segs)])
    for i in range(len(aneis) - 1):
        p, q = aneis[i], aneis[i + 1]
        if len(p) == 1 and len(q) == 1:
            continue
        if len(p) == 1:
            for k in range(segs):
                bm.faces.new((p[0], q[k], q[(k + 1) % segs]))
        elif len(q) == 1:
            for k in range(segs):
                bm.faces.new((p[k], p[(k + 1) % segs], q[0]))
        else:
            for k in range(segs):
                k2 = (k + 1) % segs
                bm.faces.new((p[k], p[k2], q[k2], q[k]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


FOC_C = (0.0, -1.52, 0.85)
bm = disco_arredondado(0.42, 0.30, 0.12)
aplica(bm, T(FOC_C))
focinho = objeto("Focinho", bm, [MAT["focinho"]], FOC_C)
for p in focinho.data.polygons:
    if abs(p.normal.y) > 0.9:
        p.use_smooth = False
objs["Focinho"] = focinho

# Narinas: ovais escuras, levemente afundadas na face do focinho (y ~ -1.31).
for nome, x in (("NarinaE", -0.13), ("NarinaD", 0.13)):
    c = (x, -1.655, 0.85)
    bm = esfera((0.075, 0.035, 0.055), c, 24, 12)
    objs[nome] = objeto(nome, bm, [MAT["escuro"]], c)

# Olhos (origem no centro) com brilho filho, no alto-frente.
for lado, sinal in (("E", -1.0), ("D", 1.0)):
    p, g = superficie(0.45 * sinal, 1.3)
    c = p + g * 0.02
    bm = esfera((0.17, 0.17, 0.17), c, 32, 16)
    olho = objeto("Olho" + lado, bm, [MAT["olho"]], c)
    objs["Olho" + lado] = olho

    bc = c + Vector((-sinal * 0.05, -0.135, 0.06))
    bm = esfera((0.045, 0.045, 0.045), bc, 16, 8)
    brilho = objeto("Brilho" + lado, bm, [MAT["brilho"]], bc)
    bpy.context.view_layer.update()
    brilho.parent = olho
    brilho.matrix_parent_inverse = olho.matrix_world.inverted()
    objs["Brilho" + lado] = brilho

# Bochechas: calotas achatadas (esfera UV de 32 segmentos, smooth) coladas na superfície,
# com a normal do corpo; o centro fica um pouco dentro do corpo, sem borda dura.
for lado, sinal in (("E", -1.0), ("D", 1.0)):
    p, g = superficie(0.85 * sinal, 1.0)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=1.0)
    rot = Vector((0.0, 0.0, 1.0)).rotation_difference(g).to_matrix().to_4x4()
    aplica(bm, T(p + g * -0.02) @ rot @ S(0.21, 0.21, 0.045))
    nome = "Bochecha" + lado
    objs[nome] = objeto(nome, bm, [MAT["bochecha"]], p + g * -0.02)

def orelha_bm():
    """Orelha fina e triangular: prisma com a base em z = 0 (triângulo no plano XZ, espessura 0.12 em Y).
    Os cantos são arredondados depois (bevel aqui e subdivisão em suavizar_orelha)."""
    tri = [(-0.325, 0.0), (0.325, 0.0), (0.0, 0.63)]
    bm = bmesh.new()
    fr = [bm.verts.new((x, -0.06, z)) for x, z in tri]
    tr = [bm.verts.new((x, 0.06, z)) for x, z in tri]
    bm.faces.new(fr)
    bm.faces.new(list(reversed(tr)))
    for i in range(3):
        j = (i + 1) % 3
        bm.faces.new((fr[i], fr[j], tr[j], tr[i]))
    chanfro(bm, 0.04, 3)
    return bm


def suavizar_orelha(ob):
    """Aplica subdivisão (nível 2) para pontas arredondadas e sem facetas; a face da frente
    (normal -Y) recebe o material da orelha interna (focinho)."""
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    mod = ob.modifiers.new("Suave", "SUBSURF")
    mod.levels = 2
    mod.render_levels = 2
    bpy.ops.object.modifier_apply(modifier=mod.name)
    ob.select_set(False)
    for p in ob.data.polygons:
        p.use_smooth = True
        p.material_index = 1 if p.normal.y < -0.35 else 0


# Orelhas: triângulo fino e arredondado, base no topo da cabeça (x ±0.40), inclinado 30 graus para a frente.
# A face da frente (normal -Y) recebe o material da orelha interna (focinho).
for lado, sinal in (("E", -1.0), ("D", 1.0)):
    base = Vector((0.50 * sinal, -0.2, 1.75))
    bm = orelha_bm()
    aplica(bm, T(base) @ RX(math.radians(30.0)))
    nome = "Orelha" + lado
    ob = objeto(nome, bm, [MAT["corpo"], MAT["focinho"]], base)
    suavizar_orelha(ob)
    objs[nome] = ob

# Rabo: tubo em espiral que sai da parte de trás (+Y), origem na junção com o corpo.
J = Vector((0.0, 1.40, ZC))
pontos = []
raios = []
N_RABO = 90
for i in range(N_RABO + 1):
    s = i / N_RABO
    th = math.pi - s * 2.6 * math.pi
    R = 0.14 - 0.05 * s
    pontos.append(Vector((0.0, J.y + 0.14 + R * math.cos(th), J.z + R * math.sin(th))))
    raios.append(0.05 - 0.02 * s)
bm = tubo(pontos, raios, segs=8)
objs["Rabo"] = objeto("Rabo", bm, [MAT["corpo"]], J)

# Fenda: caixa fina com bevel no topo, atravessando o corpo no eixo X.
# Afundada no topo: centro ~0.03 abaixo da superfície, só ~0.02 aparece no ponto mais alto.
FENDA_C = (0.0, 0.1, 2.067)
bm = bmesh.new()
bmesh.ops.create_cube(bm, size=1.0)
aplica(bm, T(FENDA_C) @ S(0.8, 0.12, 0.08))
chanfro(bm, 0.02, 2)
objs["Fenda"] = objeto("Fenda", bm, [MAT["escuro"]], FENDA_C)


# ----------------------------------------------------------------- relatório
def tris(ob):
    return sum(len(p.vertices) - 2 for p in ob.data.polygons)


def bbox_mundo(ob):
    pts = [ob.matrix_world @ Vector(c) for c in ob.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx


malhas = [o for o in bpy.data.objects if o.type == "MESH"]
bpy.context.view_layer.update()
total_tris = 0
mn_all = Vector((1e9, 1e9, 1e9))
mx_all = Vector((-1e9, -1e9, -1e9))
for ob in malhas:
    t = tris(ob)
    total_tris += t
    mn, mx = bbox_mundo(ob)
    mn_all = Vector((min(mn_all.x, mn.x), min(mn_all.y, mn.y), min(mn_all.z, mn.z)))
    mx_all = Vector((max(mx_all.x, mx.x), max(mx_all.y, mx.y), max(mx_all.z, mx.z)))
    print("PECA %-12s tris=%5d origem=(%.3f, %.3f, %.3f)" % (ob.name, t, *ob.matrix_world.translation))
print("TOTAL tris=%d objetos=%d" % (total_tris, len(malhas)))
print("BBOX total min=(%.3f, %.3f, %.3f) max=(%.3f, %.3f, %.3f)" % (*mn_all, *mx_all))


# ----------------------------------------------------------------- prévia
def previa(caminho, pos, luz_pos):
    scene = bpy.context.scene
    engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
    eevee = next((e for e in engines if e.startswith("BLENDER_EEVEE")), None)
    if eevee:
        scene.render.engine = eevee
    if hasattr(scene, "eevee") and hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 48

    cam_data = bpy.data.cameras.new("PreviaCam")
    cam_data.lens = 55
    cam = bpy.data.objects.new("PreviaCam", cam_data)
    bpy.context.collection.objects.link(cam)
    alvo = Vector((0.0, 0.0, 1.2))
    cam.location = pos
    cam.rotation_euler = (alvo - pos).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam

    luz_data = bpy.data.lights.new("PreviaLuz", "AREA")
    luz_data.energy = 1200
    luz_data.size = 4.0
    luz = bpy.data.objects.new("PreviaLuz", luz_data)
    bpy.context.collection.objects.link(luz)
    luz.location = luz_pos
    luz.rotation_euler = (Vector((0.0, 0.0, 1.2)) - luz.location).to_track_quat("-Z", "Y").to_euler()

    mundo = bpy.data.worlds.new("PreviaMundo")
    mundo.use_nodes = True
    bg = mundo.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = hex_linear("#1f1d1a")
    bg.inputs["Strength"].default_value = 1.0
    scene.world = mundo

    scene.render.resolution_x = 600
    scene.render.resolution_y = 600
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = caminho
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    bpy.ops.render.render(write_still=True)
    print("PREVIA gravada em", caminho, "engine=", scene.render.engine)

    # câmera, luz e mundo da prévia não vão para o arquivo
    for ob in (cam, luz):
        bpy.data.objects.remove(ob, do_unlink=True)
    bpy.data.cameras.remove(cam_data)
    bpy.data.lights.remove(luz_data)
    scene.world = None
    bpy.data.worlds.remove(mundo)


if PREVIA:
    previa(PREVIA, Vector((3.4, -5.4, 3.0)), (3.0, -3.5, 4.5))
if PREVIA_LADO:
    previa(PREVIA_LADO, Vector((-3.6, 5.0, 3.0)), (-3.0, 3.5, 4.5))


# ----------------------------------------------------------------- exportação
os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
bpy.ops.object.select_all(action="DESELECT")
for ob in malhas:
    ob.select_set(True)
bpy.context.view_layer.objects.active = malhas[0]
bpy.ops.export_scene.gltf(
    filepath=SAIDA,
    export_format="GLB",
    export_apply=True,
    export_yup=True,
    use_selection=True,
)
print("EXPORTADO", SAIDA, os.path.getsize(SAIDA), "bytes")
