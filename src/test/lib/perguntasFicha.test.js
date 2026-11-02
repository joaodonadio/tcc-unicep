import { describe, expect, it } from 'vitest';
import { PERGUNTAS, chavesDaPergunta, perguntaDaUrl, vizinhas } from '../../lib/perguntasFicha.js';
import { montarIndicadoresFicha } from '../../lib/fichaIndicadores.js';

const ids = PERGUNTAS.map((p) => p.id);

describe('ordem das perguntas', () => {
  it('segue a ordem da ficha', () => {
    expect(ids).toEqual(['regras', 'divida', 'cara', 'proventos', 'oscila', 'preco', 'noticias']);
  });

  it('toda chave de indicador existe em fichaIndicadores', () => {
    const existentes = new Set(montarIndicadoresFicha({}).map((i) => i.chave));
    const chaves = PERGUNTAS.flatMap((p) => [...(p.simples ?? []), ...(p.tecnico ?? [])]);
    expect(chaves.length).toBeGreaterThan(0);
    for (const chave of chaves) expect(existentes.has(chave)).toBe(true);
  });
});

describe('perguntaDaUrl', () => {
  it('lê ?pergunta= quando válida', () => {
    expect(perguntaDaUrl(new URLSearchParams('pergunta=cara'))).toBe('cara');
  });

  it('pergunta inválida cai em regras', () => {
    expect(perguntaDaUrl(new URLSearchParams('pergunta=inventada'))).toBe('regras');
    expect(perguntaDaUrl(new URLSearchParams('pergunta='))).toBe('regras');
  });

  it('converte as abas antigas de ?aba=', () => {
    expect(perguntaDaUrl(new URLSearchParams('aba=visao'))).toBe('regras');
    expect(perguntaDaUrl(new URLSearchParams('aba=graficos'))).toBe('preco');
    expect(perguntaDaUrl(new URLSearchParams('aba=balancos'))).toBe('divida');
    expect(perguntaDaUrl(new URLSearchParams('aba=proventos'))).toBe('proventos');
    expect(perguntaDaUrl(new URLSearchParams('aba=historico'))).toBe('cara');
  });

  it('?pergunta= tem prioridade sobre ?aba=', () => {
    expect(perguntaDaUrl(new URLSearchParams('pergunta=noticias&aba=visao'))).toBe('noticias');
  });

  it('sem parâmetro ou aba desconhecida cai em regras', () => {
    expect(perguntaDaUrl(new URLSearchParams(''))).toBe('regras');
    expect(perguntaDaUrl(new URLSearchParams('aba=xyz'))).toBe('regras');
    expect(perguntaDaUrl(undefined)).toBe('regras');
  });
});

describe('vizinhas', () => {
  it('devolve anterior e próxima', () => {
    expect(vizinhas('cara')).toEqual({ anterior: 'divida', proxima: 'proventos' });
  });

  it('nas pontas, o lado que não existe é null', () => {
    expect(vizinhas('regras')).toEqual({ anterior: null, proxima: 'divida' });
    expect(vizinhas('noticias')).toEqual({ anterior: 'preco', proxima: null });
  });

  it('id desconhecido não tem vizinhas', () => {
    expect(vizinhas('nada')).toEqual({ anterior: null, proxima: null });
  });
});

describe('chavesDaPergunta', () => {
  it('no nível simples devolve só as chaves simples', () => {
    expect(chavesDaPergunta('divida', 'simples')).toEqual(['dl_ebitda', 'dl_pl']);
  });

  it('no nível técnico soma as chaves técnicas', () => {
    expect(chavesDaPergunta('divida', 'tecnico')).toEqual(['dl_ebitda', 'dl_pl', 'ebitda', 'roe']);
    expect(chavesDaPergunta('oscila', 'tecnico')).toEqual(['volatilidade', 'beta', 'volume_relativo', 'dividend_yield']);
  });

  it('pergunta sem indicadores devolve lista vazia', () => {
    expect(chavesDaPergunta('regras', 'tecnico')).toEqual([]);
    expect(chavesDaPergunta('preco', 'simples')).toEqual([]);
    expect(chavesDaPergunta('inexistente', 'tecnico')).toEqual([]);
  });
});
