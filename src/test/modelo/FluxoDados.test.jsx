import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { screen, within } from '@testing-library/react';
import FluxoDados from '../../components/modelo/FluxoDados.jsx';
import Mencoes from '../../components/modelo/Mencoes.jsx';
import { quantidadeCheia } from '../../lib/formato.js';
import { TEXTOS } from '../../lib/textos.js';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';

const execucao = JSON.parse(readFileSync('public/dados/execucao.json', 'utf8')).registros[0];
const total = execucao.pacotes_enviados.reduce((a, p) => a + p.registros, 0);

describe('FluxoDados', () => {
  beforeEach(() => instalarFetchDados());

  it('mostra as quatro etapas com horário e o número de registros vindo de execucao.json', async () => {
    renderizar(<FluxoDados />);
    const lista = screen.getByRole('list', { name: TEXTOS.modelo.fluxo.lista });
    for (const etapa of TEXTOS.modelo.fluxo.etapas) {
      expect(within(lista).getByRole('heading', { level: 3, name: etapa.nome })).toBeInTheDocument();
    }
    expect(within(lista).getByText('08:00')).toBeInTheDocument();
    expect(within(lista).getByText('08:25')).toBeInTheDocument();
    const { vivoRegistros, vivoAcoes } = TEXTOS.modelo.fluxo;
    const tem = (texto) => (_, el) => el?.tagName === 'P' && el.textContent === texto;
    expect(await screen.findByText(tem(`${quantidadeCheia(total)}${vivoRegistros.depois}`))).toBeInTheDocument();
    expect(await screen.findByText(tem(`85${vivoAcoes.depois}`))).toBeInTheDocument();
  });

  it('diz em texto o que entra e o que sai de cada etapa', () => {
    renderizar(<FluxoDados />);
    const { entraRotulo, saiRotulo, etapas } = TEXTOS.modelo.fluxo;
    for (const etapa of etapas) {
      expect(screen.getByText(`${entraRotulo}: ${etapa.entra}. ${saiRotulo}: ${etapa.sai}.`)).toBeInTheDocument();
    }
  });
});

describe('Mencoes', () => {
  it('mostra os três nomes', () => {
    renderizar(<Mencoes />);
    for (const nome of ['João Augusto Donadio', 'Vinícius Nordi Esperança', 'Cristina Ivo de Medeiros']) {
      expect(screen.getByText(nome)).toBeInTheDocument();
    }
  });
});
