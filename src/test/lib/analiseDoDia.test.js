// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { montarAnaliseDoDia } from '../../lib/analiseDoDia.js';
import { AVISO_FIXO } from '../../lib/textos.js';

/** Termos proibidos, montados em partes para este arquivo não se acusar ao ser varrido. */
const PROIBIDOS = new RegExp(
  [
    ['inv', 'estia'].join(''),
    ['recomen', 'da'].join(''),
    `\\b${['comp', 're'].join('')}\\b`,
    ['oport', 'unidade'].join(''),
    ['melhores', 'ações'].join(' '),
  ].join('|'),
  'i',
);

const lerRegistros = (arquivo) =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'dados', arquivo), 'utf8')).registros;

const acoes = lerRegistros('acoes.json');
const resumos = lerRegistros('resumo_acao.json');
const noticias = lerRegistros('noticias_dia.json');
const mercado = lerRegistros('mercado_dia.json')[0];
const execucao = lerRegistros('execucao.json')[0];
const analise = montarAnaliseDoDia({ acoes, resumos, noticias, mercado, execucao });

describe('análise do dia com dados reais', () => {
  it('conta as 85 ações analisadas', () => {
    expect(analise.estatisticas.ativos_analisados).toBe(85);
  });

  it('gera um cartão por ação com sinal', () => {
    expect(analise.sugestoes).toHaveLength(77);
  });

  it('monta 9 indicadores de mercado, com o Ibovespa caindo 1,2%', () => {
    expect(analise.indicadores).toHaveLength(9);
    expect(analise.indicadores[0].delta).toBe('−1,2%');
    expect(analise.indicadores.map((i) => i.label)).toContain('IFIX');
  });

  it('monta 10 setores', () => {
    expect(analise.setores).toHaveLength(10);
  });

  it('monta 3 leituras', () => {
    expect(analise.leituras).toHaveLength(3);
  });

  it('não contém termos proibidos, exceto dentro do aviso fixo', () => {
    const texto = JSON.stringify(analise).split(AVISO_FIXO).join('');
    expect(texto).not.toMatch(PROIBIDOS);
  });

  it('todo alerta com tipo tem frase e motivo', () => {
    const comTipo = analise.alertas.filter((a) => a.tipo);
    expect(comTipo.length).toBeGreaterThan(0);
    expect(comTipo.every((a) => a.frase && a.motivo)).toBe(true);
  });

  it('toda sugestão traz setor_nome', () => {
    expect(analise.sugestoes.every((s) => 'setor_nome' in s)).toBe(true);
  });

  it('não expõe data 1969 quando a data de publicação está ausente', () => {
    const noticiasSinteticas = [
      {
        ticker: 'PETR4',
        resumo: { quantidade: 1, positivas: 1, neutras: 0, negativas: 0 },
        itens: [
          {
            id: 'sintetica-1',
            titulo: 'Manchete de teste',
            fonte: 'O GLOBO',
            publicado_em: null,
            data_publicacao: '2026-10-22',
            link: 'https://exemplo.com/noticia',
            rotulo: 'positivo',
            destaque: 1,
            prob_positivo: 0.8,
            prob_neutro: 0.1,
            prob_negativo: 0.1,
            janela: 'pregao',
          },
        ],
      },
    ];
    const analiseSintetica = montarAnaliseDoDia({
      acoes,
      resumos,
      noticias: noticiasSinteticas,
      mercado,
      execucao,
    });
    expect(analiseSintetica.noticias_destaque[0].fonte).toBe('O GLOBO · 22/10/2026, sem horário');
    // "1969" aparece dentro de decimais dos dados reais (ex.: 0,1969...), então busca só datas de época
    const dataEpoca = /31\/12\/1969|1969-12-/;
    expect(JSON.stringify(analiseSintetica)).not.toMatch(dataEpoca);
    expect(JSON.stringify(analise)).not.toMatch(dataEpoca);
  });
});
