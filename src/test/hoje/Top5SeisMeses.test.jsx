import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Top5SeisMeses } from '../../components/hoje/Top5SeisMeses.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { brl, pct } from '../../lib/formato.js';
import { TEXTOS } from '../../lib/textos.js';

const estado = vi.hoisted(() => ({ serie: null, pendente: false, erro: false }));

vi.mock('../../hooks/useDados.js', () => ({
  useSerie: () => ({ data: estado.serie, isPending: estado.pendente, isError: estado.erro, error: null, refetch: () => {} }),
}));

const T = TEXTOS.top5Hoje;
// 130 pregões: a janela de 6 meses (127) vai do 4º ao último ponto
const FECHAMENTO = Array.from({ length: 130 }, (_, i) => 10 + i * 0.1);

describe('Top5SeisMeses', () => {
  beforeEach(() => {
    estado.serie = { datas: FECHAMENTO.map((_, i) => `d${i}`), valores: { fechamento: FECHAMENTO } };
    estado.pendente = false;
    estado.erro = false;
  });

  it('variação de 6 meses com sinal e o gráfico descrito', () => {
    renderizar(<Top5SeisMeses ticker="ABCD3" alta6m={0.12} />);
    expect(screen.getByText(pct(0.12))).toHaveAttribute('data-sinal', 'up');
    expect(screen.getByText(T.seisMesesTitulo)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: T.seisMesesRotulo('ABCD3', brl(FECHAMENTO[3]), brl(FECHAMENTO[129])) }),
    ).toBeInTheDocument();
  });

  it('sem série, o gráfico não aparece e o rótulo fica', () => {
    estado.serie = null;
    renderizar(<Top5SeisMeses ticker="ABCD3" alta6m={-0.05} />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText(pct(-0.05))).toHaveAttribute('data-sinal', 'down');
  });

  it('série com um ponto só não desenha; sem variação, nada aparece', () => {
    estado.serie = { datas: ['d0'], valores: { fechamento: [10] } };
    const { container } = renderizar(<Top5SeisMeses ticker="ABCD3" alta6m={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('carregando, reserva o espaço sem desenhar', () => {
    estado.serie = null;
    estado.pendente = true;
    const { container } = renderizar(<Top5SeisMeses ticker="ABCD3" alta6m={null} />);
    expect(container.querySelector('.esqueleto')).not.toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });
});
