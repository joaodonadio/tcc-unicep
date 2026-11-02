// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AVISO_FIXO } from '../../lib/textos.js';
import { gerarSugestoes, REGRAS } from '../../lib/sugestoes.js';

/**
 * Confere as sugestões geradas a partir dos JSON reais de public/dados.
 * Se a contagem de uma regra mudar, o motivo está nos dados do pregão,
 * não no código: atualize o número só depois de checar a causa.
 */

/** Código de cada regra usado nas contagens esperadas. */
const CODIGOS = {
  R1: 'volume_incomum',
  R2: 'queda_forte_dia',
  R3: 'alta_forte_dia',
  R4: 'desempenho_6m',
  R5: 'pl_baixo_roe_ok',
  R6: 'dy_alto',
  R7: 'divida_alta',
  R8: 'prejuizo_12m',
  R9: 'queda_forte_mes',
  R10: 'oscila_pouco',
  R11: 'noticias_positivas',
  R12: 'noticias_negativas',
  R13: 'caixa_liquido',
  R14: 'payout_acima_lucro',
};

const ESPERADO = { R1: 9, R2: 11, R3: 1, R4: 26, R5: 13, R6: 22, R7: 21, R8: 8, R9: 2, R10: 8, R11: 4, R12: 16, R13: 8, R14: 7 };

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

const resumos = lerRegistros('resumo_acao.json');
const noticias = lerRegistros('noticias_dia.json');
const acoes = lerRegistros('acoes.json');

const cartoes = gerarSugestoes({ resumos, noticias, acoes });

/** Quantos cartões têm cada regra, pelo id. */
const contagemPorRegra = (cartoesLista) => {
  const contagem = {};
  for (const cartao of cartoesLista) {
    for (const s of cartao.sinais) contagem[s.id] = (contagem[s.id] ?? 0) + 1;
  }
  return contagem;
};

describe('regras reais: contagem de disparos por regra', () => {
  it('os códigos R1 a R14 correspondem às regras existentes', () => {
    const ids = REGRAS.map((r) => r.id).sort();
    expect(ids).toEqual(Object.values(CODIGOS).sort());
  });

  it('cada regra dispara no número de tickers esperado', () => {
    const porRegra = contagemPorRegra(cartoes);
    const real = Object.fromEntries(Object.entries(CODIGOS).map(([codigo, id]) => [codigo, porRegra[id] ?? 0]));
    expect(real).toEqual(ESPERADO);
  });

  it('há 77 cartões com pelo menos um sinal', () => {
    expect(cartoes).toHaveLength(77);
  });
});

describe('regras reais: PETR4', () => {
  it('dispara as regras de desempenho em 6 meses e P/L baixo com ROE', () => {
    const petr4 = cartoes.find((c) => c.ticker === 'PETR4');
    expect(petr4).toBeDefined();
    expect(petr4.sinais.map((s) => s.id).sort()).toEqual(['desempenho_6m', 'pl_baixo_roe_ok']);
  });
});

describe('regras reais: textos sem termos proibidos', () => {
  it('nenhum texto de cartão usa termo proibido (o aviso fixo é excluído)', () => {
    const textos = cartoes.flatMap((cartao) =>
      cartao.sinais.flatMap((s) => [s.titulo, s.simples, s.tecnico, ...s.contra, ...s.limites, ...s.dados.map((d) => d.rotulo)]),
    );
    const sem = textos.map((t) => t.split(AVISO_FIXO).join(''));
    for (const t of sem) {
      expect(t).not.toMatch(PROIBIDOS);
    }
  });
});
