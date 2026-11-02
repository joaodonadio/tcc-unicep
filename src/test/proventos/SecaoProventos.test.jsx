import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import SecaoProventos from '../../components/proventos/SecaoProventos.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

// a agenda vem de react-query; aqui a consulta é montada à mão, sem rede
const consulta = vi.hoisted(() => ({ atual: null }));
vi.mock('../../hooks/useAgenda.js', () => ({
  useAgendaProventos: () => consulta.atual,
}));

const HOJE = '2026-10-29';

const futuros = [
  { id: 'a', ticker: 'PETR4', empresa: 'Petrobras', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-10-30', valor_texto: 'R$ 0,50', data_com_texto: '01/10/2026' },
  { id: 'b', ticker: 'VALE3', empresa: 'Vale', tipo: 'JCP', tipo_rotulo: 'JCP', data_pagamento: '2026-11-05', valor_texto: 'R$ 0,30', data_com_texto: '02/10/2026' },
  { id: 'c', ticker: 'ITSA4', empresa: 'Itaú', tipo: 'DIVIDENDO', tipo_rotulo: 'Dividendo', data_pagamento: '2026-11-12', valor_texto: 'R$ 0,40', data_com_texto: '03/10/2026' },
];

function montarConsulta(sobrescrever = {}) {
  return {
    data: { futuros, a_definir: [] },
    hoje: HOJE,
    falhas: [],
    isPending: false,
    isError: false,
    error: null,
    refetch: () => {},
    ...sobrescrever,
  };
}

describe('SecaoProventos', () => {
  beforeEach(() => {
    instalarFetchDados();
    consulta.atual = montarConsulta();
  });

  it('é uma seção com título de nível 2 e os blocos de nível 3', async () => {
    const { container } = renderizar(<SecaoProventos />);

    expect(container.querySelector('section#proventos')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: porNivel(TEXTOS.proventos.titulo, 'simples') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: porNivel(TEXTOS.proventos.graficoTitulo, 'simples') })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: porNivel(TEXTOS.proventos.rankingTitulo, 'simples') })).toBeInTheDocument();
    // a agenda continua com o próprio nome, agora como h3
    expect(screen.getByRole('region', { name: TEXTOS.dia.proventos })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: TEXTOS.dia.proventos })).toBeInTheDocument();
  });

  it('o gráfico rotula cada mês da janela, do primeiro ao último', () => {
    renderizar(<SecaoProventos />);

    for (const mes of ['out/2026', 'nov/2026', 'dez/2026', 'jan/2027', 'fev/2027', 'mar/2027']) {
      expect(screen.getByText(mes)).toBeInTheDocument();
    }
  });

  it('a tabela lista as ações com ticker linkando para a pergunta de proventos e nenhum NaN', async () => {
    const { container } = renderizar(<SecaoProventos />);

    const tabela = await screen.findByRole('table');
    const linhas = within(tabela).getAllByRole('row').slice(1);
    expect(linhas.length).toBeGreaterThan(0);
    expect(linhas.length).toBeLessThanOrEqual(10);

    for (const linha of linhas) {
      const link = within(linha).getByRole('link');
      expect(link).toHaveAttribute('href', expect.stringMatching(/^\/acao\/[A-Z0-9]+\?pergunta=proventos$/));
    }

    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('a barra é escondida de leitor de tela e a nota sobre o dividend yield aparece', async () => {
    const { container } = renderizar(<SecaoProventos />);

    await screen.findByRole('table');
    const barras = container.querySelectorAll('.proventos-barra');
    expect(barras.length).toBeGreaterThan(0);
    for (const barra of barras) {
      expect(barra).toHaveAttribute('aria-hidden', 'true');
    }
    expect(screen.getByText(porNivel(TEXTOS.proventos.dyNota, 'simples'))).toBeInTheDocument();
  });

  it('com a agenda carregando, o gráfico mostra a espera e a seção continua de pé', async () => {
    consulta.atual = montarConsulta({ data: undefined, isPending: true });
    renderizar(<SecaoProventos />);

    expect(screen.getByRole('heading', { level: 2, name: porNivel(TEXTOS.proventos.titulo, 'simples') })).toBeInTheDocument();
    expect(screen.getAllByText(TEXTOS.dia.proventosCarregando).length).toBeGreaterThan(0);
  });
});
