import { describe, expect, it } from 'vitest';
import {
  FILTROS,
  PASSO,
  contarPorFiltro,
  destaquePorSetor,
  motivoDoDestaque,
  filtrarAcoes,
  ordenarAcoes,
  semAcento,
} from '../../lib/listaAcoes.js';

const acao = (ticker, nome, forte, atencao, contexto, variacao_dia) => ({
  ticker,
  nome,
  contagem: { forte, atencao, contexto, total: forte + atencao + contexto },
  variacao_dia,
});

const ACOES = [
  acao('PETR4', 'Petróleo Brasileiro', 1, 0, 0, 0.012),
  acao('VALE3', 'Vale', 0, 1, 2, -0.02),
  acao('ITUB4', 'Itaú Unibanco', 0, 0, 1, 0.005),
  acao('BBAS3', 'Banco do Brasil', 2, 0, 0, null),
  acao('MGLU3', 'Magazine Luiza', 0, 0, 0, 0.03),
];

const tickers = (lista) => lista.map((a) => a.ticker);

describe('constantes da lista', () => {
  it('tem os filtros na ordem da tela e passo de 15', () => {
    expect(FILTROS).toEqual(['todas', 'forte', 'atencao', 'contexto', 'minha']);
    expect(PASSO).toBe(15);
  });
});

describe('semAcento', () => {
  it('tira acento e põe em minúsculas', () => {
    expect(semAcento('Petróleo Ação')).toBe('petroleo acao');
    expect(semAcento(null)).toBe('');
  });
});

describe('filtrarAcoes por tipo', () => {
  it('todas devolve a lista inteira', () => {
    expect(filtrarAcoes(ACOES)).toHaveLength(5);
    expect(filtrarAcoes(ACOES, { filtro: 'todas' })).toHaveLength(5);
  });

  it('forte pega ações com contagem.forte > 0', () => {
    expect(tickers(filtrarAcoes(ACOES, { filtro: 'forte' }))).toEqual(['PETR4', 'BBAS3']);
  });

  it('atencao pega ações com contagem.atencao > 0', () => {
    expect(tickers(filtrarAcoes(ACOES, { filtro: 'atencao' }))).toEqual(['VALE3']);
  });

  it('contexto pega só quem não tem forte nem atenção', () => {
    expect(tickers(filtrarAcoes(ACOES, { filtro: 'contexto' }))).toEqual(['ITUB4']);
  });

  it('minha usa a lista de tickers, sem diferença de caixa', () => {
    expect(tickers(filtrarAcoes(ACOES, { filtro: 'minha', lista: ['vale3', 'MGLU3'] }))).toEqual([
      'VALE3',
      'MGLU3',
    ]);
    expect(filtrarAcoes(ACOES, { filtro: 'minha' })).toEqual([]);
  });

  it('filtro desconhecido vale como todas', () => {
    expect(filtrarAcoes(ACOES, { filtro: 'qualquer' })).toHaveLength(5);
  });

  it('aceita entrada nula', () => {
    expect(filtrarAcoes(null)).toEqual([]);
  });
});

describe('busca', () => {
  it('acha pelo ticker, sem diferença de caixa', () => {
    expect(tickers(filtrarAcoes(ACOES, { busca: 'vale' }))).toEqual(['VALE3']);
  });

  it('acha pelo nome da empresa sem acento', () => {
    expect(tickers(filtrarAcoes(ACOES, { busca: 'itau' }))).toEqual(['ITUB4']);
    expect(tickers(filtrarAcoes(ACOES, { busca: 'PETROLEO' }))).toEqual(['PETR4']);
  });

  it('combina busca com filtro', () => {
    expect(tickers(filtrarAcoes(ACOES, { filtro: 'forte', busca: 'banco' }))).toEqual(['BBAS3']);
  });

  it('busca em branco não restringe', () => {
    expect(filtrarAcoes(ACOES, { busca: '   ' })).toHaveLength(5);
  });
});

describe('ordenarAcoes', () => {
  it('põe mais pontos fortes primeiro e depois a maior variação', () => {
    expect(tickers(ordenarAcoes(ACOES))).toEqual(['BBAS3', 'PETR4', 'MGLU3', 'ITUB4', 'VALE3']);
  });

  it('variação nula vai para o fim do grupo', () => {
    const duas = [acao('A', 'a', 1, 0, 0, null), acao('B', 'b', 1, 0, 0, -0.01)];
    expect(tickers(ordenarAcoes(duas))).toEqual(['B', 'A']);
  });

  it('não muda a entrada', () => {
    const antes = tickers(ACOES);
    ordenarAcoes(ACOES);
    expect(tickers(ACOES)).toEqual(antes);
  });
});

describe('contarPorFiltro', () => {
  it('conta cada filtro com a mesma regra de filtrarAcoes', () => {
    expect(contarPorFiltro(ACOES, ['PETR4'])).toEqual({
      todas: 5,
      forte: 2,
      atencao: 1,
      contexto: 1,
      minha: 1,
    });
  });

  it('lista vazia dá zero em minha, sem inventar contagem', () => {
    expect(contarPorFiltro(ACOES).minha).toBe(0);
    expect(contarPorFiltro([])).toEqual({ todas: 0, forte: 0, atencao: 0, contexto: 0, minha: 0 });
  });
});

describe('destaquePorSetor', () => {
  const com = (ticker, setor, forte, atencao) => ({ ...acao(ticker, ticker, forte, atencao, 0, 0.01), setor_nome: setor });
  const cartao = (ticker, relativo) => ({ ticker, resumo_acao: { volume: { relativo } } });

  it('escolhe uma ação por setor: mais a favor, depois menos atenção', () => {
    const lista = [com('A1', 'Bancos', 1, 0), com('A2', 'Bancos', 2, 3), com('A3', 'Bancos', 2, 1), com('B1', 'Energia', 0, 0)];
    expect(destaquePorSetor(lista, []).map((a) => a.ticker)).toEqual(['A3', 'B1']);
  });

  it('desempata por volume relativo e depois por ticker; volume ausente perde', () => {
    const lista = [com('ZZZ3', 'Bancos', 1, 0), com('AAA3', 'Bancos', 1, 0), com('MMM3', 'Bancos', 1, 0)];
    expect(destaquePorSetor(lista, [cartao('ZZZ3', 2), cartao('AAA3', 1)])[0].ticker).toBe('ZZZ3');
    expect(destaquePorSetor(lista, [])[0].ticker).toBe('AAA3');
    expect(destaquePorSetor(lista, [cartao('MMM3', { valor: 3, status: 'ok' })])[0].ticker).toBe('MMM3');
  });

  it('ignora ações sem setor, anexa a sugestão e não altera a entrada', () => {
    const lista = [com('A1', null, 5, 0), com('B1', 'Energia', 0, 0)];
    const copia = JSON.stringify(lista);
    const r = destaquePorSetor(lista, [cartao('B1', 1)]);
    expect(r).toHaveLength(1);
    expect(r[0].sugestao.ticker).toBe('B1');
    expect(JSON.stringify(lista)).toBe(copia);
    expect(destaquePorSetor(undefined)).toEqual([]);
  });

  it('motivoDoDestaque usa o texto simples do primeiro sinal a favor', () => {
    const s = { sinais: [{ tipo: 'atencao', simples: 'x' }, { tipo: 'forte', simples: 'Paga bem.' }] };
    expect(motivoDoDestaque(s)).toBe('Paga bem.');
    expect(motivoDoDestaque({ sinais: [] })).toBeNull();
    expect(motivoDoDestaque(null)).toBeNull();
  });
});
