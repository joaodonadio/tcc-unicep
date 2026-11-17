import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { CartaoSetor } from '../../components/setores/CartaoSetor.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { EXPLICACOES } from '../../lib/explicacoes.js';
import { TEXTOS } from '../../lib/textos.js';

const setor = {
  setor: 'Financeiro',
  media: 0.02,
  n: 2,
  total: 2,
  subiram: 2,
  cairam: 0,
  melhor: null,
  pior: null,
  emRevisao: [],
  acoes: [
    { ticker: 'ITUB4', empresa: 'Itaú', variacao: 0.03, revisao: false },
    { ticker: 'BBDC4', empresa: 'Bradesco', variacao: 0.01, revisao: false },
  ],
};

const tom = { setor: 'Financeiro', positivas: 4, neutras: 3, negativas: 1, total: 8, saldo: 0.375 };

describe('CartaoSetor: tom das notícias do dia', () => {
  beforeEach(() => {
    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
  });

  it('mostra as três contagens na barra e na legenda, com o rótulo e o botão de explicação', () => {
    const { container } = renderizar(<CartaoSetor setor={setor} tecnico tom={tom} />);

    const bloco = container.querySelector('.setor-tom');
    expect(bloco).not.toBeNull();
    expect(bloco.querySelector('[data-contagem="positivas"]')).toHaveStyle({ flexGrow: '4' });
    expect(bloco.querySelector('[data-contagem="neutras"]')).toHaveStyle({ flexGrow: '3' });
    expect(bloco.querySelector('[data-contagem="negativas"]')).toHaveStyle({ flexGrow: '1' });
    expect(bloco.querySelector('.setor-tom-barra')).toHaveAttribute('aria-hidden', 'true');

    const legenda = bloco.querySelector('.setor-tom-legenda');
    expect(legenda).toHaveTextContent('4positivas');
    expect(legenda).toHaveTextContent('3neutras');
    expect(legenda).toHaveTextContent('1negativas');

    expect(screen.getByText(TEXTOS.setores.tomNoticias)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: TEXTOS.setores.tomNoticias })).toHaveAttribute(
      'data-termo',
      'tom_setor',
    );
  });

  it('o rótulo traz a frase simples no title, para o hover do desktop', () => {
    renderizar(<CartaoSetor setor={setor} tecnico tom={tom} />);

    expect(screen.getByText(TEXTOS.setores.tomNoticias)).toHaveAttribute(
      'title',
      EXPLICACOES.tom_setor.simples,
    );
  });

  it('o botão de explicação abre o balão com a explicação do técnico', () => {
    renderizar(<CartaoSetor setor={setor} tecnico tom={tom} />);

    fireEvent.click(screen.getByRole('button', { name: TEXTOS.setores.tomNoticias }));
    expect(screen.getByText(EXPLICACOES.tom_setor.tecnico)).toBeInTheDocument();
  });

  it('sem tom (nulo ou total zero), o bloco não aparece', () => {
    const { container, unmount } = renderizar(<CartaoSetor setor={setor} tecnico tom={null} />);
    expect(container.querySelector('.setor-tom')).toBeNull();
    unmount();

    const { container: vazio } = renderizar(
      <CartaoSetor setor={setor} tecnico tom={{ ...tom, total: 0 }} />,
    );
    expect(vazio.querySelector('.setor-tom')).toBeNull();
  });

  it('no modo simples, o tom não aparece', () => {
    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'simples', zoom: 1 }));
    const { container } = renderizar(<CartaoSetor setor={setor} tecnico={false} tom={tom} />);
    expect(container.querySelector('.setor-tom')).toBeNull();
  });
});
