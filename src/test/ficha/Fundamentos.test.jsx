import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Fundamentos } from '../../components/ficha/Fundamentos.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { proximoPagamento } from '../../lib/proventos.js';
import { ROTULO_STATUS, TEXTOS } from '../../lib/textos.js';

const mocks = vi.hoisted(() => ({
  proventos: { data: [], isSuccess: true, isPending: false, isError: false, refetch: () => {} },
}));

vi.mock('../../hooks/useDados.js', () => ({
  useProventos: () => mocks.proventos,
}));

const F = TEXTOS.ficha.fundamentos;

const RESUMO = {
  pl: { valor: 12.345, status: 'ok' },
  pvp: { valor: 1.2, status: 'ok' },
  roe: { valor: 0.215, status: 'ok' },
  dividend_yield: { valor: 0.082, status: 'ok' },
  endividamento: { dl_ebitda: { valor: 1.5, status: 'ok' } },
  balanco_referencia: { data_fim_periodo: '2026-06-30', data_entrega: '2026-07-30', status: 'ok' },
};

const provento = (tipo, data_pagamento, valor) => ({
  ticker: 'PETR4',
  tipo,
  data_com: '2026-10-01',
  data_pagamento,
  valor_por_acao: { valor, status: 'ok' },
});

beforeEach(() => {
  mocks.proventos = { data: [], isSuccess: true, isPending: false, isError: false, refetch: () => {} };
});

describe('bloco Dados fundamentalistas', () => {
  it('mostra os cinco indicadores de leitura rápida, sem o texto "ver a pergunta"', () => {
    renderizar(<Fundamentos ticker="PETR4" resumo={RESUMO} carregando={false} />, { rota: '/acao/PETR4' });

    expect(screen.queryByText(/ver a pergunta/i)).toBeNull();
    const termos = screen.getAllByRole('term').map((t) => t.textContent);
    expect(termos).toEqual(Object.values(F.rotulos));
  });

  it('o número de P/L é um link inteiro para a pergunta Está cara?', () => {
    renderizar(<Fundamentos ticker="PETR4" resumo={RESUMO} carregando={false} />, { rota: '/acao/PETR4' });

    const link = screen.getByRole('link', { name: /^P\/L: 12,3\. Abrir a pergunta sobre P\/L/ });
    expect(link.getAttribute('href')).toBe('/acao/PETR4?pergunta=cara');
    expect(link).toHaveTextContent('12,3');
  });

  it('valor ausente mostra o motivo Indisponível, nunca zero', () => {
    renderizar(<Fundamentos ticker="PETR4" resumo={{}} carregando={false} />, { rota: '/acao/PETR4' });

    expect(screen.getAllByText(ROTULO_STATUS.indisponivel)).toHaveLength(5);
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.queryByText(/^0[,%]/)).toBeNull();
  });

  it('mostra o último balanço compacto, com a entrega só em dia e mês', () => {
    renderizar(<Fundamentos ticker="PETR4" resumo={RESUMO} carregando={false} />, { rota: '/acao/PETR4' });

    expect(screen.getByText('Último balanço: 30/06/2026 (entregue 30/07)')).toBeTruthy();
  });

  it('sem balanço, diz que está indisponível', () => {
    renderizar(<Fundamentos ticker="PETR4" resumo={{}} carregando={false} />, { rota: '/acao/PETR4' });

    expect(screen.getByText('Último balanço: indisponível')).toBeTruthy();
  });

  it('mostra a mediana do setor abaixo do número quando existe', () => {
    const resumo = { ...RESUMO, pl: { valor: 12.345, status: 'ok', setor: { valor: 11.4, status: 'ok' } } };
    renderizar(<Fundamentos ticker="PETR4" resumo={resumo} carregando={false} />, { rota: '/acao/PETR4' });

    expect(screen.getByText(F.setor('11,4'))).toBeTruthy();
  });

  it('próximo provento é o pagamento futuro mais próximo, sem o "a definir"', () => {
    mocks.proventos.data = [
      provento('JCP', '2999-02-10', 0.3),
      provento('DIVIDENDO', '2999-01-10', 1.5),
      provento('DIVIDENDO', '9999-12-31', 2),
      provento('DIVIDENDO', '2000-01-01', 3),
    ];
    renderizar(<Fundamentos ticker="PETR4" resumo={RESUMO} carregando={false} />, { rota: '/acao/PETR4' });

    expect(screen.getByText(/Próximo provento: Dividendo de R\$\s1,50 em 10\/01\/2999$/)).toBeTruthy();
  });

  it('sem provento futuro, diz que nenhum foi anunciado', () => {
    mocks.proventos.data = [provento('DIVIDENDO', '2000-01-01', 1.5)];
    renderizar(<Fundamentos ticker="PETR4" resumo={RESUMO} carregando={false} />, { rota: '/acao/PETR4' });

    expect(screen.getByText(F.semProventoFuturo)).toBeTruthy();
  });
});

describe('proximoPagamento', () => {
  it('ignora datas anteriores a hoje e a data a definir', () => {
    const lista = [provento('DIVIDENDO', '2026-10-01', 1), provento('JCP', '9999-12-31', 2)];
    expect(proximoPagamento(lista, '2026-10-28')).toBeNull();
  });

  it('devolve valor nulo quando o provento não tem valor', () => {
    const lista = [{ ...provento('DIVIDENDO', '2999-01-10', 0), valor_por_acao: { valor: null, status: 'indisponivel' } }];
    expect(proximoPagamento(lista, '2026-10-28')).toEqual({
      tipo_rotulo: 'Dividendo',
      valor_texto: null,
      data_texto: '10/01/2999',
    });
  });
});
