import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import Modelo from '../../pages/Modelo.jsx';
import { TEXTOS } from '../../lib/textos.js';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';

// Top 5 e histórico do modelo chegam por react-query; aqui o hook devolve o valor do teste
const dados = vi.hoisted(() => ({ top: undefined, historico: undefined }));
vi.mock('../../hooks/useDados.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    useExperimentoTop: () => ({ data: dados.top, isError: false }),
    useExperimentoHistorico: () => ({ data: dados.historico, isError: false }),
  };
});

describe('Modelo', () => {
  beforeEach(() => {
    instalarFetchDados();
    dados.top = null;
    dados.historico = null;
  });

  it('tem o h1, a seção O modelo acerta? e não repete o Top 5', () => {
    renderizar(<Modelo />);

    expect(screen.getByRole('heading', { level: 1, name: TEXTOS.paginas.modelo })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: TEXTOS.top5.titulo })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: TEXTOS.acerto.titulo })).toBeInTheDocument();
  });

  it('explica o modelo em cartões e troca o texto pelo nível técnico', () => {
    renderizar(<Modelo />);

    for (const c of TEXTOS.modelo.experimento.cartoes) {
      expect(screen.getByRole('heading', { level: 3, name: c.titulo })).toBeInTheDocument();
    }
    expect(screen.getByRole('list', { name: TEXTOS.modelo.experimento.diagramaRotulo })).toBeInTheDocument();
  });

  it('traz abertura, fluxo, modelo experimental e menções como h2', () => {
    renderizar(<Modelo />);

    for (const nome of [
      TEXTOS.modelo.abertura.titulo,
      TEXTOS.modelo.fluxo.titulo,
      TEXTOS.modelo.experimento.titulo,
      TEXTOS.modelo.mencoes.titulo,
    ]) {
      expect(screen.getByRole('heading', { level: 2, name: nome })).toBeInTheDocument();
    }
    for (const nome of TEXTOS.modelo.mencoes.nomes) expect(screen.getByText(nome)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('sem histórico mostra a espera do acerto', async () => {
    renderizar(<Modelo />);

    expect(
      await screen.findByRole('heading', { level: 3, name: TEXTOS.acerto.esperaTitulo }),
    ).toBeInTheDocument();
  });
});
