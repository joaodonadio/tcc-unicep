import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { GraficoDolar } from '../../components/mercado/GraficoDolar.jsx';
import { GraficoJuros } from '../../components/mercado/GraficoJuros.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { obter } from '../../services/cliente.js';
import { porNivel, TEXTOS } from '../../lib/textos.js';

vi.mock('../../services/cliente.js', () => ({ obter: vi.fn(), FONTE: 'api' }));

// cada teste define as respostas por caminho; caminho sem resposta vira null (sem dado)
let respostas = {};

beforeEach(() => {
  respostas = {};
  obter.mockReset();
  obter.mockImplementation(async (caminho) => respostas[caminho] ?? null);
});

describe('GraficoDolar com a série publicada', () => {
  it('usa series_diarias/USDBRL e pula valores ausentes, com a nota da série', async () => {
    respostas['series_diarias/USDBRL'] = {
      registros: [{ datas: ['2026-11-02', '2026-11-03', '2026-11-04'], valores: { fechamento: [5, null, 5.1] } }],
    };
    renderizar(<GraficoDolar />);

    expect(await screen.findByText(porNivel(TEXTOS.mercado.dolar.notaSerie, 'simples'))).toBeInTheDocument();
    expect(screen.getByRole('img')).toBeInTheDocument();
    expect(screen.queryByText(porNivel(TEXTOS.mercado.dolar.nota, 'simples'))).not.toBeInTheDocument();
    expect(obter).not.toHaveBeenCalledWith('dolar-historico', expect.anything());
    // série publicada pelo pacote: não é conta do site, sem selo
    expect(screen.queryByText(TEXTOS.contas.selo)).not.toBeInTheDocument();
  });

  it('sem a série, cai na rota local das publicações e o selo substitui a nota antiga', async () => {
    respostas['dolar-historico'] = { datas: ['2026-11-02', '2026-11-03'], valores: [5, 5.1] };
    renderizar(<GraficoDolar />);

    // duas consultas em cadeia (série e depois a rota local): folga para a suíte sob carga
    expect(await screen.findByRole('img', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText(porNivel(TEXTOS.mercado.dolar.nota, 'simples'))).not.toBeInTheDocument();
    expect(screen.queryByText(/erro|Erro/)).not.toBeInTheDocument();
    // histórico montado aqui, a partir das publicações: selo 'Calculado no site'
    expect(screen.getByText(TEXTOS.contas.selo)).toBeInTheDocument();
  });
});

describe('GraficoJuros com a série SELIC publicada', () => {
  it('desenha a meta publicada, com as mudanças e sem a estimativa pelo CDI', async () => {
    respostas['series_diarias/SELIC'] = {
      registros: [
        {
          datas: ['2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20', '2026-03-23', '2026-03-24'],
          valores: { indice_retorno_total: [0.15, 0.15, 0.1475, 0.1475, 0.145, 0.145] },
        },
      ],
    };
    const { container } = renderizar(<GraficoJuros />);
    const t = TEXTOS.mercado.juros;

    expect(await screen.findByRole('img', { name: /Meta da Selic ao longo do tempo/ })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /estimada pelo CDI/ })).not.toBeInTheDocument();
    expect(screen.queryByText(TEXTOS.contas.selo)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: t.tituloSeriePublicada.simples })).toBeInTheDocument();
    expect(container.querySelectorAll('.juros-mudanca')).toHaveLength(2);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });
});
