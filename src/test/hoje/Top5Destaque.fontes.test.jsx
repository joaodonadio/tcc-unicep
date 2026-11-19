import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import Top5Destaque from '../../components/hoje/Top5Destaque.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

vi.mock('../../components/modelos3d/Modelo3D.jsx', () => ({ default: () => null }));

// o pacote do modelo: só os códigos e os motivos; preço e números vêm dos dados do dia
const estado = vi.hoisted(() => ({ experimento: { data: null, isPending: false, isError: false } }));
vi.mock('../../hooks/useDados.js', async (original) => ({
  ...(await original()),
  useExperimentoTop: () => ({ ...estado.experimento, refetch: () => {} }),
}));

const T = TEXTOS.top5Hoje;
const doModelo = ['VALE3', 'PETR4', 'ITUB4', 'WEGE3', 'ABEV3'].map((ticker, i) => ({
  posicao: i + 1,
  ticker,
  chance: null,
  motivos: [{ texto: `Motivo do modelo ${i + 1}`, efeito: 'ajudou' }],
}));

describe('Top5Destaque: pelas regras ou pelo modelo', () => {
  beforeEach(() => {
    instalarFetchDados();
    estado.experimento = { data: null, isPending: false, isError: false };
  });

  it('abre pelas regras, com as duas abas e a primeira marcada', async () => {
    renderizar(<Top5Destaque />);
    await screen.findByRole('list', { name: T.listaRotulo });
    expect(screen.getByRole('button', { name: T.fontes.regras })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: T.fontes.modelo })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(T.apoio)).toBeInTheDocument();
  });

  it('pelo modelo mostra a ordem do pacote do experimento', async () => {
    estado.experimento = { data: { itens: doModelo, selo: 'em_avaliacao', avisos: [] }, isPending: false, isError: false };
    renderizar(<Top5Destaque />);
    await screen.findByRole('list', { name: T.listaRotulo });

    fireEvent.click(screen.getByRole('button', { name: T.fontes.modelo }));

    const lista = await screen.findByRole('list', { name: T.listaRotulo });
    const codigos = [...lista.querySelectorAll('.top5-ticker')].map((e) => e.textContent);
    expect(codigos).toEqual(['VALE3', 'PETR4', 'ITUB4', 'WEGE3', 'ABEV3']);
    expect(screen.getByText(T.apoioModelo)).toBeInTheDocument();
    expect(within(lista).getAllByRole('button')[0]).toHaveAttribute('aria-pressed', 'true');
  });

  it('sem o pacote do modelo, avisa e não troca para a lista das regras', async () => {
    renderizar(<Top5Destaque />);
    await screen.findByRole('list', { name: T.listaRotulo });

    fireEvent.click(screen.getByRole('button', { name: T.fontes.modelo }));

    expect(screen.getByText(T.vazioModelo)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: T.listaRotulo })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: T.fontes.regras }));
    expect(await screen.findByRole('list', { name: T.listaRotulo })).toBeInTheDocument();
  });
});
