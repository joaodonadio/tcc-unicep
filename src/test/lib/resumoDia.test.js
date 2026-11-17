// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { montarResumoDoPregao } from '../../lib/resumoDia.js';
import { AVISO_FIXO } from '../../lib/textos.js';

/** Termos proibidos, montados em partes para este arquivo não se acusar ao ser varrido. */
const PROIBIDOS = new RegExp(
  [
    ['inv', 'estia'].join(''),
    ['recomen', 'da'].join(''),
    `\\b${['comp', 're'].join('')}\\b`,
    ['oport', 'unidade'].join(''),
    ['melhores', 'ações'].join(' '),
    ['perguntar', 'ao sistema'].join(' '),
  ].join('|'),
  'i',
);

const lerRegistros = (arquivo) =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'dados', arquivo), 'utf8')).registros;

const mercado = lerRegistros('mercado_dia.json')[0];
const resumos = lerRegistros('resumo_acao.json');
const noticias = lerRegistros('noticias_dia.json');
const acoes = lerRegistros('acoes.json');

const { frases, texto } = montarResumoDoPregao({ mercado, resumos, noticias, acoes });

describe('resumo do pregão com dados reais', () => {
  it('conta quantas ações subiram e caíram', () => {
    expect(texto).toContain('16 subiram');
    expect(texto).toContain('64 caíram');
    expect(texto).toContain('5 ficaram estáveis');
  });

  it('abre com a data do pregão por extenso', () => {
    expect(frases[0]).toBe('Resumo do pregão de quinta-feira, 22 de outubro de 2026.');
  });

  it('não usa termos proibidos', () => {
    expect(texto).not.toMatch(PROIBIDOS);
    expect(texto.split(AVISO_FIXO).join('')).not.toMatch(PROIBIDOS);
  });

  it('expõe fatos com o índice e a amplitude', () => {
    const { fatos } = montarResumoDoPregao({ mercado, resumos, noticias, acoes });
    expect(fatos.ibov.pontos).toBe(204120);
    expect(fatos.amplitude.total).toBe(85);
    expect(fatos.amplitude.subiram + fatos.amplitude.cairam + fatos.amplitude.estaveis).toBe(85);
  });
});

describe('resumo do pregão sem dados', () => {
  it('não transforma ausência em 0', () => {
    const { fatos } = montarResumoDoPregao({});
    expect(fatos.amplitude).toBeNull();
    expect(fatos.ibov.pontos).toBeNull();
    expect(fatos.maior_alta).toBeNull();
    expect(fatos.maior_queda).toBeNull();
  });

  it('juros e seis meses ficam nulos quando não há dados', () => {
    const { fatos } = montarResumoDoPregao({});
    expect(fatos.juros).toEqual({
      cdi_12m: null,
      ipca_12m: null,
      ipca_ate: null,
      selic: { status: 'sem_dado', valor: null, data: null },
      ipca_mensal: null,
      cdi_mensal: null,
    });
    expect(fatos.seis_meses).toEqual({ renda_fixa: null, bolsa: null });
  });
});

describe('juros e seis meses com dados reais', () => {
  it('lê CDI, IPCA e o mês do IPCA do pacote de mercado', () => {
    const { fatos } = montarResumoDoPregao({ mercado, resumos, noticias, acoes });
    expect(fatos.juros.cdi_12m).toBe(mercado.indices.CDI.a1.valor);
    expect(fatos.juros.ipca_12m).toBe(mercado.ipca_12m.valor);
    expect(fatos.juros.ipca_ate).toBe(mercado.ipca_ate.valor);
  });

  it('IPCA mensal do pacote: 12 meses em ordem, terminando no mais recente', () => {
    const meses = Array.from({ length: 13 }, (_, i) => {
      const total = 2025 * 12 + 2 + i; // começa em 2025-03
      const mes_ref = `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
      return { mes_ref, variacao: { valor: 0.001 * (i + 1), status: 'ok' } };
    });
    const embaralhado = [...meses].reverse();
    const { fatos } = montarResumoDoPregao({ mercado: { ...mercado, ipca_mensal: embaralhado }, resumos, noticias, acoes });
    expect(fatos.juros.ipca_mensal.meses).toHaveLength(12);
    expect(fatos.juros.ipca_mensal.meses).toEqual([...meses].slice(1).map((m) => m.mes_ref));
    expect(fatos.juros.ipca_mensal.meses.at(-1)).toBe('2026-03');
    expect(fatos.juros.ipca_mensal.valores.at(-1)).toBeCloseTo(0.013);
  });

  it('renda fixa é o CDI de 6 meses e bolsa é o Ibovespa de 6 meses do primeiro resumo', () => {
    const { fatos } = montarResumoDoPregao({ mercado, resumos, noticias, acoes });
    expect(fatos.seis_meses.renda_fixa).toBe(mercado.indices.CDI.m6.valor);
    expect(fatos.seis_meses.bolsa).toBe(resumos[0].rentabilidade.ibov.m6.valor);
  });
});

describe('variação de ação suspeita (grupamento não ajustado)', () => {
  // RAIZ4: a origem trouxe +8.933% no dia (fechamento de R$ 0,30 para R$ 27,10).
  const suspeita = {
    ...resumos[0],
    ticker: 'RAIZ4',
    cotacao: { ...resumos[0].cotacao, variacao_dia: { valor: 89.33, status: 'ok' } },
  };

  it('não escolhe a suspeita como maior alta e a conta como "mudou de escala", fora do total', () => {
    const { fatos, texto } = montarResumoDoPregao({ mercado, resumos: [...resumos, suspeita], noticias, acoes });
    expect(fatos.maior_alta?.ticker).not.toBe('RAIZ4');
    expect(fatos.maior_alta?.variacao ?? 0).toBeLessThan(1);
    expect(fatos.amplitude.total).toBe(85);
    expect(fatos.amplitude.emRevisao).toBe(1);
    expect(texto).toContain('1 com o preço em outra escala');
    expect(texto).not.toContain('8.933');
    expect(texto).not.toContain('8933');
  });

  it('sem suspeita, a frase de contagem não menciona revisão', () => {
    const { texto, fatos } = montarResumoDoPregao({ mercado, resumos, noticias, acoes });
    expect(texto).not.toContain('outra escala');
    expect(fatos.amplitude.emRevisao).toBe(0);
  });
});

describe('variação do dólar implausível', () => {
  const comDolar = (variacao) => ({
    ...mercado,
    USDBRL: { ...mercado.USDBRL, variacao_dia: { valor: variacao, status: 'ok' } },
  });

  it('variação acima de 5% vira null e marca como suspeita, mantendo o fechamento', () => {
    const { fatos, texto, frases: fr } = montarResumoDoPregao({ mercado: comDolar(0.083), resumos, noticias, acoes });
    expect(fatos.dolar.variacao).toBeNull();
    expect(fatos.dolar.suspeito).toBe(true);
    expect(fatos.dolar.valor).toBe(mercado.USDBRL.fechamento.valor);
    expect(texto).not.toContain('8,3%');
    expect(fr.some((f) => f.startsWith('Câmbio e petróleo') && f.includes('dólar'))).toBe(false);
  });

  it('variação negativa acima do limite também é suspeita', () => {
    const { fatos } = montarResumoDoPregao({ mercado: comDolar(-0.06), resumos, noticias, acoes });
    expect(fatos.dolar.variacao).toBeNull();
    expect(fatos.dolar.suspeito).toBe(true);
  });

  it('variação plausível continua valendo e não é marcada', () => {
    const { fatos, texto } = montarResumoDoPregao({ mercado, resumos, noticias, acoes });
    expect(fatos.dolar.suspeito).toBe(false);
    expect(fatos.dolar.variacao).toBe(mercado.USDBRL.variacao_dia.valor);
    expect(texto).toContain('dólar');
  });
});
