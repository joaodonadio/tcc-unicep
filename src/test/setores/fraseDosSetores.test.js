import { describe, expect, it } from 'vitest';
import { fraseDosSetores } from '../../components/setores/fraseDosSetores.js';
import { pct } from '../../lib/formato.js';
import { TEXTOS } from '../../lib/textos.js';

const setor = (nome, media) => ({ setor: nome, media });

describe('fraseDosSetores', () => {
  it('dia de alta geral: não diz "o que mais caiu"', () => {
    const setores = [setor('Energia', 0.03), setor('Saúde', 0.01)];
    const frase = fraseDosSetores(setores, 'd1');
    const esperado = [
      TEXTOS.setores.resumo(TEXTOS.setores.periodosExtenso.d1, 2, 0),
      TEXTOS.setores.resumoMaior('Energia', pct(0.03)),
    ].join(' ');
    expect(frase).toBe(esperado);
    expect(frase).not.toContain(TEXTOS.setores.resumoMenor('Saúde', pct(0.01)));
  });

  it('dia de queda geral: não diz "o que mais subiu"', () => {
    const setores = [setor('Energia', -0.01), setor('Saúde', -0.03)];
    const frase = fraseDosSetores(setores, 'd1');
    const esperado = [
      TEXTOS.setores.resumo(TEXTOS.setores.periodosExtenso.d1, 0, 2),
      TEXTOS.setores.resumoMenor('Saúde', pct(-0.03)),
    ].join(' ');
    expect(frase).toBe(esperado);
    expect(frase).not.toContain(TEXTOS.setores.resumoMaior('Energia', pct(-0.01)));
  });
});
