import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { CartaoSerie } from '../../components/mercado/CartaoSerie.jsx';
import { GraficoDolar } from '../../components/mercado/GraficoDolar.jsx';
import { GraficoJuros } from '../../components/mercado/GraficoJuros.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { porNivel, TEXTOS } from '../../lib/textos.js';

describe('CartaoSerie: estados sem número', () => {
  it('sem série mostra o texto de vazio, sem gráfico', () => {
    const { container } = renderizar(
      <CartaoSerie titulo="Teste" apoio="apoio" serie={null} vazio="Sem dados aqui." rotuloGrafico="g" />,
    );
    expect(screen.getByText('Sem dados aqui.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\b0,00\b/);
  });

  it('com um só ponto de valor, ainda não desenha: vazio, nunca 0', () => {
    renderizar(
      <CartaoSerie
        titulo="Teste"
        apoio="apoio"
        serie={{ datas: ['2026-10-01', '2026-10-02'], valores: [5, null] }}
        vazio="Poucos pontos."
        rotuloGrafico="g"
      />,
    );
    expect(screen.getByText('Poucos pontos.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('carregando mostra o aviso de leitura, sem texto de vazio', () => {
    renderizar(<CartaoSerie titulo="Teste" apoio="apoio" estado="carregando" vazio="Sem dados." rotuloGrafico="g" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Sem dados.')).not.toBeInTheDocument();
  });

  it('com dois pontos, desenha o gráfico com o rótulo para leitor de tela e a data das pontas', () => {
    renderizar(
      <CartaoSerie
        titulo="Teste"
        apoio="apoio"
        valorAtual="R$ 5,03"
        variacao={{ texto: '+1,0%', sinal: 'up', legenda: 'no período' }}
        serie={{ datas: ['2026-10-01', '2026-10-02'], valores: [5, 5.05] }}
        rotuloGrafico="Teste, de 01/10/2026 a 02/10/2026, terminou em +1,0%."
        vazio="x"
      />,
    );
    expect(screen.getByRole('img', { name: /terminou em \+1,0%/ })).toBeInTheDocument();
    expect(screen.getByText('R$ 5,03')).toBeInTheDocument();
    expect(screen.getByText('+1,0%')).toHaveAttribute('data-sinal', 'up');
    expect(screen.getByText('01/10/2026')).toBeInTheDocument();
    expect(screen.getByText('02/10/2026')).toBeInTheDocument();
  });
});

describe('GraficoDolar e GraficoJuros', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('o dólar sem histórico (modo arquivos) mostra o estado vazio com texto, nunca 0', async () => {
    const { container } = renderizar(<GraficoDolar />);

    expect(await screen.findByText(TEXTOS.mercado.dolar.vazio)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Quanto custa o dólar' })).toBeInTheDocument();
    expect(screen.getByText(porNivel(TEXTOS.mercado.dolar.nota, 'simples'))).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('os juros desenham a Selic ao longo do tempo pela série do CDI, com as mudanças e o CDI de hoje', async () => {
    const { container } = renderizar(<GraficoJuros />);
    const t = TEXTOS.mercado.juros;

    // série do índice do CDI em series_diarias: 15,00% até março, depois cortes de 0,25 até 13,75%
    expect(await screen.findByRole('heading', { level: 2, name: t.tituloSerie.simples })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Selic ao longo do tempo, estimada pelo CDI/ })).toBeInTheDocument();
    expect(screen.getByText('−1,25 ponto')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: t.mudancasTitulo.simples })).toBeInTheDocument();
    const mudancas = container.querySelectorAll('.juros-mudanca');
    expect(mudancas).toHaveLength(5);
    // o índice de 20/03 carrega o CDI de 19/03: a mudança cai em 19/03
    expect(mudancas[0].textContent).toMatch(/caiu de 15,00% para.*14,75%.*19\/03/);
    for (const m of mudancas) expect(m.dataset.sinal).toBe('down');
    // valor de hoje e nota: CDI do dia em mercado_dia (13,65% ao ano + 0,10 = 13,75%)
    expect(screen.getAllByText('13,75%').length).toBeGreaterThan(0);
    expect(screen.getByText(/CDI de hoje: 13,65% ao ano/)).toBeInTheDocument();
    // Selic estimada pelo CDI é conta do site: selo 'Calculado no site'
    expect(screen.getByText(TEXTOS.contas.selo)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/NaN|undefined|32,00/);
  });
});
