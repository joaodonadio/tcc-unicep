// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { numero, pct, quantidade } from '../../lib/formato.js';
import {
  faixaOscilacao,
  largurasComparacao,
  montarIndicadoresFicha,
  montarTabelaRetornos,
  textoTipoAcao,
} from '../../lib/fichaIndicadores.js';
import { TEXTOS } from '../../lib/textos.js';

const registros = JSON.parse(
  readFileSync(path.join(process.cwd(), 'public', 'dados', 'resumo_acao.json'), 'utf8'),
).registros;
const R = registros.find((r) => r.ticker === 'PETR4');

const CHAVES_ORDEM = [
  'pl',
  'pvp',
  'roe',
  'dividend_yield',
  'payout',
  'margem_bruta',
  'margem_liquida',
  'ebitda',
  'dl_ebitda',
  'dl_pl',
  'beta',
  'volatilidade',
  'volume_relativo',
];

describe('indicadores da ficha com dados reais (PETR4)', () => {
  const indicadores = montarIndicadoresFicha(R);
  const porChave = Object.fromEntries(indicadores.map((i) => [i.chave, i]));

  it('monta os 13 indicadores na ordem da lista', () => {
    expect(indicadores).toHaveLength(13);
    expect(indicadores.map((i) => i.chave)).toEqual(CHAVES_ORDEM);
  });

  it('P/L mostra o número da API com a mediana do setor e barrinhas', () => {
    const pl = porChave.pl;
    expect(pl.texto).toBe(numero(R.pl.valor, { casas: 1 }));
    expect(pl.setor_texto).toContain(numero(R.pl.setor.valor, { casas: 1 }));
    expect(pl.barras).not.toBeNull();
    expect(Math.max(pl.barras.acao, pl.barras.setor)).toBe(100);
  });

  it('beta não tem setor nem barrinha e usa o texto pronto da API', () => {
    expect(porChave.beta.setor_texto).toBeNull();
    expect(porChave.beta.barras).toBeNull();
    expect(porChave.beta.texto_api).toBe(R.beta.texto);
  });

  it('volume relativo mostra a quantidade de ações negociadas do dia', () => {
    expect(porChave.volume_relativo.complemento).toMatch(/ de ações negociadas$/);
    expect(porChave.volume_relativo.complemento).toBe(
      `${quantidade(R.volume.total.valor)} de ações negociadas`,
    );
  });
});

describe('complementos de volume e dívida líquida', () => {
  const porChave = (dados) => Object.fromEntries(montarIndicadoresFicha(dados).map((i) => [i.chave, i]));

  it('volume do dia vira "141,3 milhões de ações negociadas"', () => {
    const p = porChave({ volume: { total: { valor: 141338400, status: 'ok' } } });
    expect(p.volume_relativo.complemento).toBe('141,3 milhões de ações negociadas');
  });

  it('dívida líquida em reais vira "dívida líquida de R$ 80,0 bi" no dl_ebitda', () => {
    const p = porChave({
      endividamento: { divida_liquida: { valor: 79970000000, status: 'ok' }, caixa_liquido: { valor: false, status: 'ok' } },
    });
    expect(p.dl_ebitda.complemento).toBe('dívida líquida de R$ 80,0 bi');
    expect(p.dl_pl.complemento).toBeNull();
  });

  it('com caixa líquido, o dl_ebitda mantém só o texto de caixa', () => {
    const p = porChave({
      endividamento: { divida_liquida: { valor: -5000000000, status: 'ok' }, caixa_liquido: { valor: true, status: 'ok' } },
    });
    expect(p.dl_ebitda.complemento).toBe('A empresa tem mais caixa do que dívida (caixa líquido).');
  });

  it('sem valor, volume e dívida ficam sem complemento, nunca com 0', () => {
    const p = porChave({
      volume: { total: { valor: null, status: 'indisponivel' } },
      endividamento: { divida_liquida: { valor: null, status: 'indisponivel' } },
    });
    expect(p.volume_relativo.complemento).toBeNull();
    expect(p.dl_ebitda.complemento).toBeNull();
  });
});

describe('ausência nunca vira zero', () => {
  it('P/L sem valor mostra travessão com o motivo do status', () => {
    const indicadores = montarIndicadoresFicha({
      pl: { valor: null, status: 'lucro_negativo', texto: 'Prejuízo em 12 meses' },
    });
    const pl = indicadores.find((i) => i.chave === 'pl');
    expect(pl.texto).toBe('—');
    expect(pl.motivo).toBe('Prejuízo em 12 meses');
    expect(pl.barras).toBeNull();
    expect(indicadores.some((i) => i.texto === '0')).toBe(false);
  });

  it('caixa líquido ganha o complemento nos dois indicadores de dívida', () => {
    const indicadores = montarIndicadoresFicha({
      endividamento: { caixa_liquido: { valor: true, status: 'ok' } },
    });
    const dlEbitda = indicadores.find((i) => i.chave === 'dl_ebitda');
    const dlPl = indicadores.find((i) => i.chave === 'dl_pl');
    expect(dlEbitda.complemento).toBe('A empresa tem mais caixa do que dívida (caixa líquido).');
    expect(dlPl.complemento).toBe('A empresa tem mais caixa do que dívida (caixa líquido).');
  });

  it('montarIndicadoresFicha(null) devolve lista vazia', () => {
    expect(montarIndicadoresFicha(null)).toEqual([]);
  });
});

describe('largurasComparacao', () => {
  it('compara pela maior magnitude', () => {
    expect(largurasComparacao(2, 4)).toEqual({ acao: 50, setor: 100 });
  });

  it('sem os dois números ou com zero nos dois devolve null', () => {
    expect(largurasComparacao(null, 4)).toBeNull();
    expect(largurasComparacao(0, 0)).toBeNull();
  });
});

describe('montarTabelaRetornos', () => {
  it('tem 4 linhas com 4 células cada e o Ibovespa de 1 ano formatado', () => {
    const tabela = montarTabelaRetornos(R);
    expect(tabela.linhas).toHaveLength(4);
    tabela.linhas.forEach((linha) => expect(linha.celulas).toHaveLength(4));
    const ibovA1 = tabela.linhas[2].celulas[3];
    expect(ibovA1.texto).toBe(pct(R.rentabilidade.ibov.a1.valor));
  });

  it('sem resumo não quebra e mostra travessões', () => {
    const tabela = montarTabelaRetornos(null);
    expect(tabela.linhas).toHaveLength(4);
    tabela.linhas.forEach((linha) => linha.celulas.forEach((c) => expect(c.texto).toBe('—')));
  });
});

describe('tipo da ação no cabeçalho', () => {
  it('ON e PN viram o texto de TEXTOS', () => {
    expect(textoTipoAcao('ON')).toBe(TEXTOS.ficha.tipoAcao.ON);
    expect(textoTipoAcao('PN')).toBe(TEXTOS.ficha.tipoAcao.PN);
  });

  it('outro código, como UNIT, aparece cru', () => {
    expect(textoTipoAcao('UNIT')).toBe('UNIT');
  });

  it('sem tipo, null (nada aparece no cabeçalho)', () => {
    expect(textoTipoAcao(undefined)).toBeNull();
    expect(textoTipoAcao('  ')).toBeNull();
  });
});

describe('faixa de oscilação', () => {
  it('corta em 0,34 e em 0,67', () => {
    expect(faixaOscilacao(0.07)).toBe('baixa');
    expect(faixaOscilacao(0.339)).toBe('baixa');
    expect(faixaOscilacao(0.34)).toBe('moderada');
    expect(faixaOscilacao(0.669)).toBe('moderada');
    expect(faixaOscilacao(0.67)).toBe('alta');
    expect(faixaOscilacao(0.95)).toBe('alta');
  });

  it('sem posição, null (nunca uma faixa inventada)', () => {
    expect(faixaOscilacao(null)).toBeNull();
    expect(faixaOscilacao(undefined)).toBeNull();
  });
});

describe('comparação com o setor e linhas do técnico', () => {
  it('compararComSetor dá situação e diferença com sinal', async () => {
    const { compararComSetor } = await import('../../lib/fichaIndicadores.js');
    expect(compararComSetor(6, 14, 'razao').situacao).toBe('abaixo');
    expect(compararComSetor(0.24, 0.02, 'pontos').diferenca_texto).toBe('+22,0 p.p.');
    expect(compararComSetor(10, 10.2, 'razao').situacao).toBe('emLinha');
    expect(compararComSetor(null, 10, 'razao')).toBeNull();
  });

  it('montarLinhasTecnicas inclui os extras e nunca troca ausência por 0', async () => {
    const { montarLinhasTecnicas } = await import('../../lib/fichaIndicadores.js');
    const linhas = montarLinhasTecnicas(R, ['ebitda', 'dl_ebitda', 'volatilidade', 'volume_relativo']);
    const ids = linhas.map((l) => l.id);
    expect(ids).toEqual([
      'ebitda', 'margem_ebitda', 'dl_ebitda', 'divida_liquida', 'caixa_liquido',
      'volatilidade', 'volatilidade_posicao', 'volume_relativo', 'volume_mediana',
    ]);
    const vazio = montarLinhasTecnicas({}, ['pl']);
    expect(vazio[0].acao).toBe('—');
    expect(vazio[0].diferenca).toBe('—');
  });
});
