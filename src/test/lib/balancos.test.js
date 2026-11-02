// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LINHAS_BALANCO, montarBalancos } from '../../lib/balancos.js';
import { brlCompacto } from '../../lib/formato.js';

const lerRegistros = (arquivo) =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'dados', arquivo), 'utf8')).registros;

const fundamentos = lerRegistros('fundamentos_trimestrais.json');
const doPetr4 = fundamentos.filter((f) => f.ticker === 'PETR4');

const trimestre = (data, valor = 1) => ({
  ticker: 'TESTE3',
  data_fim_periodo: data,
  data_entrega: '2026-01-01',
  receita_trimestre: { valor, status: 'ok' },
});

describe('montarBalancos com dados reais (PETR4)', () => {
  const tabela = montarBalancos(doPetr4);
  const maisRecente = [...doPetr4].sort((a, b) => b.data_fim_periodo.localeCompare(a.data_fim_periodo))[0];

  it('monta 8 colunas em ordem decrescente de data', () => {
    expect(tabela.colunas).toHaveLength(8);
    const datas = tabela.colunas.map((c) => c.data);
    expect([...datas].sort().reverse()).toEqual(datas);
  });

  it('todo rótulo de trimestre tem o formato 1T26', () => {
    for (const coluna of tabela.colunas) {
      expect(coluna.rotulo).toMatch(/^[1-4]T\d{2}$/);
    }
  });

  it('tem uma linha por indicador', () => {
    expect(tabela.linhas).toHaveLength(LINHAS_BALANCO.length);
    expect(tabela.linhas).toHaveLength(14);
  });

  it('dívida líquida / patrimônio fica logo depois de dívida líquida / EBITDA', () => {
    const ids = tabela.linhas.map((l) => l.id);
    expect(ids[ids.indexOf('dl_ebitda') + 1]).toBe('dl_pl');
  });

  it('a primeira célula de receita no trimestre é o valor mais recente formatado', () => {
    const linha = tabela.linhas.find((l) => l.id === 'receita_trimestre');
    expect(linha.celulas[0].texto).toBe(brlCompacto(maisRecente.receita_trimestre.valor));
  });
});

describe('montarBalancos com dados sintéticos', () => {
  it('pega só os 8 trimestres mais recentes de uma lista maior', () => {
    const lista = Array.from({ length: 10 }, (_, i) => {
      const mes = String(i + 1).padStart(2, '0');
      return trimestre(`2024-${mes}-28`, i);
    });
    const tabela = montarBalancos(lista);
    expect(tabela.colunas).toHaveLength(8);
    expect(tabela.colunas[0].data).toBe('2024-10-28');
    expect(tabela.colunas[7].data).toBe('2024-03-28');
  });

  it('valor com status diferente de ok vira "—" com o motivo', () => {
    const tabela = montarBalancos([
      { ...trimestre('2025-06-30'), receita_trimestre: { valor: null, status: 'indisponivel' } },
    ]);
    const linha = tabela.linhas.find((l) => l.id === 'receita_trimestre');
    expect(linha.celulas[0]).toEqual({ texto: '—', motivo: 'Indisponível' });
  });

  it('campo ausente vira "—" sem quebrar', () => {
    const tabela = montarBalancos([{ data_fim_periodo: '2025-06-30' }]);
    const linha = tabela.linhas.find((l) => l.id === 'roe');
    expect(linha.celulas[0].texto).toBe('—');
  });

  it('lista vazia ou ausente gera tabela sem colunas e sem células', () => {
    for (const entrada of [[], undefined]) {
      const tabela = montarBalancos(entrada);
      expect(tabela.colunas).toEqual([]);
      expect(tabela.linhas.every((l) => l.celulas.length === 0)).toBe(true);
    }
  });
});
