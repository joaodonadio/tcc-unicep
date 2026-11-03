import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { NumerosDoDia } from '../../components/hoje/NumerosDoDia.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { brl, numero, pct, quantidadeCheia } from '../../lib/formato.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const estado = vi.hoisted(() => ({ series: {} }));

vi.mock('../../hooks/useDados.js', () => ({
  useSerie: (ticker) => ({
    data: estado.series[ticker] ?? null,
    isPending: false,
    isSuccess: true,
    isError: false,
    error: null,
    refetch: () => {},
  }),
}));

// 130 pregões de 100.000 a 112.900 pontos: a janela de 6 meses (127 pontos) pega de 100.300 a 112.900
const FECHAMENTO = Array.from({ length: 130 }, (_, i) => 100000 + i * 100);
const MINIMA = FECHAMENTO[FECHAMENTO.length - 127];
const MAXIMA = FECHAMENTO[FECHAMENTO.length - 1];
const FATOS = { ibov: { pontos: 110000, variacao: 0.01 } };
const porcento = (v) => pct(v, { casas: 2, sinal: false });

/** Série com um ponto no dia 15 de cada mês, de out/2025 em diante; cada mês multiplica o índice por (1 + taxa). */
function serieMensal(taxas) {
  const datas = [];
  const valores = [];
  let v = 100;
  for (let i = 0; i <= taxas.length; i += 1) {
    if (i > 0) v *= 1 + taxas[i - 1];
    datas.push(new Date(Date.UTC(2025, 9 + i, 15)).toISOString().slice(0, 10));
    valores.push(v);
  }
  return { datas, valores: { indice_retorno_total: valores } };
}

/** Cartão pelo rótulo simples. */
const cartao = (texto) => screen.getByText(porNivel(texto, 'simples')).closest('.hoje-numero');
const cartaoIbov = () => cartao(TEXTOS.hoje.ibovespa);

describe('NumerosDoDia: faixa de 6 meses do Ibovespa', () => {
  beforeEach(() => {
    estado.series = {};
  });

  it('com a série, mostra a mínima e a máxima da janela de 6 meses', () => {
    estado.series.IBOV = { valores: { fechamento: FECHAMENTO } };
    renderizar(<NumerosDoDia fatos={FATOS} />);

    const cartaoIbovespa = cartaoIbov();
    const minimo = numero(MINIMA, { casas: 0 });
    const maximo = numero(MAXIMA, { casas: 0 });
    expect(within(cartaoIbovespa).getByText(TEXTOS.hoje.faixaSeisMeses)).toBeInTheDocument();
    expect(within(cartaoIbovespa).getByText(minimo)).toBeInTheDocument();
    expect(within(cartaoIbovespa).getByText(maximo)).toBeInTheDocument();
    expect(within(cartaoIbovespa).getByText(TEXTOS.hoje.faixaSeisMesesDescricao(minimo, maximo))).toBeInTheDocument();
  });

  it('sem a série, a régua não aparece e o cartão segue com o valor', () => {
    renderizar(<NumerosDoDia fatos={FATOS} />);

    const cartaoIbovespa = cartaoIbov();
    expect(within(cartaoIbovespa).getByText(numero(110000, { casas: 0 }))).toBeInTheDocument();
    expect(within(cartaoIbovespa).queryByText(TEXTOS.hoje.faixaSeisMeses)).toBeNull();
    expect(cartaoIbovespa.querySelector('.hoje-faixa')).toBeNull();
  });

  it('série sem variação (máxima igual à mínima) também não mostra a régua', () => {
    estado.series.IBOV = { valores: { fechamento: Array.from({ length: 130 }, () => 110000) } };
    renderizar(<NumerosDoDia fatos={FATOS} />);

    expect(cartaoIbov().querySelector('.hoje-faixa')).toBeNull();
  });
});

describe('NumerosDoDia: detalhes que abrem no cartão', () => {
  beforeEach(() => {
    estado.series = { IBOV: { valores: { fechamento: FECHAMENTO } } };
  });

  const botaoIbov = () =>
    within(cartaoIbov()).getByRole('button', { name: TEXTOS.hoje.detalhes(porNivel(TEXTOS.hoje.ibovespa, 'simples')) });

  it('o botão começa fechado e abre ao clicar (aria-expanded)', () => {
    renderizar(<NumerosDoDia fatos={FATOS} />);
    const botao = botaoIbov();
    expect(botao).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(botao);
    expect(botao).toHaveAttribute('aria-expanded', 'true');
    expect(cartaoIbov()).toHaveAttribute('data-aberto', 'true');
  });

  it('fechado, o painel tem inert e segue no DOM; aberto, perde o inert', () => {
    renderizar(<NumerosDoDia fatos={FATOS} />);
    const botao = botaoIbov();
    const painel = document.getElementById(botao.getAttribute('aria-controls'));
    expect(painel).toHaveAttribute('inert');
    expect(within(painel).getByText(TEXTOS.hoje.faixaSeisMeses)).toBeInTheDocument();
    fireEvent.click(botao);
    expect(painel).not.toHaveAttribute('inert');
  });

  it('altas e quedas: a matriz de pontos descrita fica no pé, o cartão é largo e a legenda vai para o painel', () => {
    const amplitude = { subiram: 48, cairam: 30, estaveis: 7, total: 85 };
    renderizar(<NumerosDoDia fatos={{ ...FATOS, amplitude }} />);
    const rotulo = TEXTOS.hoje.mini.amplitude(quantidadeCheia(48), quantidadeCheia(30), quantidadeCheia(7));
    expect(screen.getByRole('img', { name: rotulo })).toBeInTheDocument();
    const card = cartao(TEXTOS.hoje.amplitude);
    expect(card).toHaveClass('hoje-numero--largo');
    const painel = card.querySelector('.detalhes-painel');
    expect(painel).toHaveAttribute('inert');
    expect(within(painel).getByText(TEXTOS.hoje.legendaAmplitude.subiram, { exact: false })).toBeInTheDocument();
  });
});

describe('NumerosDoDia: só dados da API privada', () => {
  beforeEach(() => {
    estado.series = {};
  });

  it('cinco cartões, sem Selic, e a fonte não cita o Banco Central', () => {
    const { container } = renderizar(<NumerosDoDia fatos={FATOS} dataPregao="2026-10-22" />);
    expect(container.querySelectorAll('.hoje-numero')).toHaveLength(5);
    expect(screen.queryByText(/Selic/)).toBeNull();
    expect(container.querySelector('.hoje-numeros-fonte').textContent).not.toMatch(/Banco Central/);
  });

  it('dólar sem série: inclinação do pregão anterior a hoje, e as notas no painel', () => {
    renderizar(<NumerosDoDia fatos={{ ...FATOS, dolar: { valor: 5.0333, variacao: 0.0026, suspeito: false } }} />);
    const card = cartao(TEXTOS.hoje.dolar);
    const antes = brl(5.0333 / 1.0026);
    expect(within(card).getByText(brl(5.0333))).toBeInTheDocument();
    expect(within(card).getByRole('img', { name: TEXTOS.hoje.mini.dolar(antes, brl(5.0333)) })).toBeInTheDocument();
    const painel = card.querySelector('.detalhes-painel');
    expect(within(painel).getByText(TEXTOS.hoje.dolarPacote)).toBeInTheDocument();
    expect(within(painel).getByText(TEXTOS.hoje.dolarConversao(numero(100 / 5.0333, { casas: 2 })))).toBeInTheDocument();
    expect(within(painel).getByText(TEXTOS.hoje.dolarSemHistorico)).toBeInTheDocument();
  });

  it('dólar com variação suspeita: só o número, sem gráfico', () => {
    renderizar(<NumerosDoDia fatos={{ ...FATOS, dolar: { valor: 5.0333, variacao: 0.4, suspeito: true } }} />);
    const card = cartao(TEXTOS.hoje.dolar);
    expect(card.querySelector('[role="img"]')).toBeNull();
    expect(card.querySelector('.mini-grafico--vazio')).not.toBeNull();
  });

  it('dólar com série (fonte simulada): mini gráfico de 6 meses no lugar da inclinação', () => {
    estado.series.USDBRL = { valores: { fechamento: Array.from({ length: 130 }, (_, i) => 5 + i * 0.001) } };
    renderizar(<NumerosDoDia fatos={{ ...FATOS, dolar: { valor: 5.129, variacao: 0.001, suspeito: false } }} />);
    const card = cartao(TEXTOS.hoje.dolar);
    expect(within(card).getByRole('img', { name: /Dólar nos últimos 6 meses/ })).toBeInTheDocument();
    expect(card.querySelector('.hoje-inclinacao')).toBeNull();
  });

  it('IPCA: barras mensais da série, até o mês seguinte a ipca_ate', () => {
    const taxas = [0.0009, 0.0018, 0.0033, 0.0033, 0.007, 0.0088, 0.0067, 0.0058, 0.0016, 0.0007, -0.0032, 0.0082];
    estado.series.IPCA = serieMensal(taxas);
    renderizar(<NumerosDoDia fatos={{ ...FATOS, juros: { ipca_ate: '2026-09' } }} />);
    expect(screen.getByRole('img', { name: TEXTOS.hoje.mini.ipca(12, porcento(0.0082)) })).toBeInTheDocument();
  });

  it('CDI: só meses completos (o mês da última data fica de fora)', () => {
    const taxas = Array.from({ length: 13 }, (_, i) => (i === 11 ? 0.0123 : 0.01));
    estado.series.CDI = serieMensal(taxas);
    renderizar(<NumerosDoDia fatos={FATOS} />);
    expect(screen.getByRole('img', { name: TEXTOS.hoje.mini.cdi(12, porcento(0.0123)) })).toBeInTheDocument();
  });
});
