import { describe, expect, it } from 'vitest';
import { TEXTOS, porNivel } from '../../lib/textos.js';

describe('porNivel', () => {
  it('devolve a variação do nível pedido', () => {
    const texto = { simples: 'em palavras do dia a dia', tecnico: 'termo de mercado' };
    expect(porNivel(texto, 'simples')).toBe('em palavras do dia a dia');
    expect(porNivel(texto, 'tecnico')).toBe('termo de mercado');
  });

  it('devolve funções como estão, para o chamador aplicar', () => {
    const texto = { simples: (n) => `são ${n}`, tecnico: (n) => `${n}` };
    expect(porNivel(texto, 'simples')(3)).toBe('são 3');
    expect(porNivel(texto, 'tecnico')(3)).toBe('3');
  });

  it('devolve o próprio valor quando não é um texto por nível', () => {
    expect(porNivel('texto fixo', 'tecnico')).toBe('texto fixo');
    expect(porNivel(['a', 'b'], 'simples')).toEqual(['a', 'b']);
    expect(porNivel({ outra: 1 }, 'simples')).toEqual({ outra: 1 });
    expect(porNivel(undefined, 'simples')).toBeUndefined();
  });

  it('usa a outra variação quando só uma existe', () => {
    expect(porNivel({ simples: 'só simples' }, 'tecnico')).toBe('só simples');
  });

  it('os textos por nível dos títulos são diferentes entre os níveis', () => {
    const titulos = [
      TEXTOS.paginas.noticiasTitulo,
      TEXTOS.proventos.titulo,
      TEXTOS.dados.titulo,
      TEXTOS.hoje.numeros,
      TEXTOS.hoje.ibovespa,
      TEXTOS.comoUsar.titulo,
    ];
    for (const t of titulos) expect(porNivel(t, 'simples')).not.toBe(porNivel(t, 'tecnico'));
  });
});
