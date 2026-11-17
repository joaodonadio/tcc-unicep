import { describe, expect, it } from 'vitest';
import { renderizar } from '../apoio/renderizar.jsx';
import { IndicesPorGrupo } from '../../components/mercado/IndicesPorGrupo.jsx';

const indice = (label, valor, delta, sinal) => ({ label, valor, delta, sinal, periodos: [] });

describe('IndicesPorGrupo', () => {
  it('o humor da Bolsa vem da maioria dos sinais dos índices do grupo', () => {
    const baixa = [
      indice('Ibovespa (pontos)', '165.000', '−1,0%', 'down'),
      indice('IDIV', '10', '−0,5%', 'down'),
      indice('SMLL', '10', '+0,2%', 'up'),
    ];
    const { container, unmount } = renderizar(<IndicesPorGrupo indicadores={baixa} />);
    expect(container.querySelector('.mercado-pavio')).toHaveClass('mascote--preocupado');
    unmount();

    const alta = [
      indice('Ibovespa (pontos)', '165.000', '+1,0%', 'up'),
      indice('IDIV', '10', '+0,5%', 'up'),
      indice('SMLL', '10', '−0,2%', 'down'),
    ];
    const { container: c2 } = renderizar(<IndicesPorGrupo indicadores={alta} />);
    expect(c2.querySelector('.mercado-pavio')).toHaveClass('mascote--contente');
  });
});
