import { describe, expect, it } from 'vitest';
import { Box3, Group, LineBasicMaterial, MeshBasicMaterial, Vector3 } from 'three';
import { objetoProcedural } from '../../components/setores/objetosSetor.js';

const materiais = () => ({
  corpo: new MeshBasicMaterial(),
  detalhe: new MeshBasicMaterial(),
  traco: new LineBasicMaterial(),
});

const CHAVES = [
  'consumo-nao-ciclico', 'consumo-ciclico', 'financeiro', 'utilidade-publica', 'bens-industriais',
  'materiais-basicos', 'petroleo', 'saude', 'tecnologia', 'comunicacoes', 'outros',
];

describe('objetoProcedural', () => {
  it.each(CHAVES)('%s cabe na caixa esperada', (chave) => {
    const g = objetoProcedural(chave, materiais(), 0.9);
    g.updateMatrixWorld(true);
    const b = new Box3().setFromObject(g);
    const t = b.getSize(new Vector3());
    const centro = b.getCenter(new Vector3());
    expect(t.x).toBeLessThanOrEqual(0.95);
    expect(t.y).toBeLessThanOrEqual(0.95);
    expect(t.z).toBeLessThanOrEqual(0.95);
    expect(t.y).toBeGreaterThanOrEqual(0.4);
    expect(b.min.y).toBeGreaterThanOrEqual(-0.01);
    expect(b.min.y).toBeLessThanOrEqual(0.02);
    expect(Math.abs(centro.x)).toBeLessThanOrEqual(0.15);
    expect(Math.abs(centro.z)).toBeLessThanOrEqual(0.15);
  });

  it('chave inexistente devolve um Group com filhos', () => {
    const g = objetoProcedural('inexistente', materiais(), 1);
    expect(g).toBeInstanceOf(Group);
    expect(g.children.length).toBeGreaterThan(0);
  });
});
