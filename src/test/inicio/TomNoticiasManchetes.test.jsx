import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { TomNoticias } from '../../components/inicio/TomNoticias.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

const tom = { total: 2, positivas: 1, neutras: 0, negativas: 1 };
const manchetes = {
  positivo: [
    {
      tag: 'PETR4',
      tom: 'positivo',
      titulo: 'Petrobras sobe forte',
      link: 'https://exemplo.com/petro',
      fonte: 'Valor · 22/10/2026 às 17h19',
    },
  ],
  negativo: [
    {
      tag: 'VALE3',
      tom: 'negativo',
      titulo: 'Vale cai no dia',
      link: 'https://exemplo.com/vale',
      fonte: 'G1 · 22/10/2026, sem horário',
    },
  ],
};

const linksPara = (href) => screen.getAllByRole('link').filter((a) => a.getAttribute('href') === href);

describe('TomNoticias: lista de manchetes', () => {
  it('cada manchete tem um único link, no título, com aviso de nova aba', () => {
    renderizar(<TomNoticias tom={tom} manchetes={manchetes} empresas={[]} />);

    const links = linksPara('https://exemplo.com/petro');
    expect(links).toHaveLength(1);
    expect(links[0].textContent).toContain('Petrobras sobe forte');
    expect(links[0].textContent).toContain(TEXTOS.dia.abreNovaAba);
  });

  it('a linha de baixo traz só a fonte e a data', () => {
    renderizar(<TomNoticias tom={tom} manchetes={manchetes} empresas={[]} />);

    expect(screen.getByText('Valor · 22/10/2026 às 17h19')).toBeInTheDocument();
    expect(screen.queryByText(/PETR4/)).toBeNull();
  });

  it('cada manchete ganha uma pílula com o tom e o data-tom correspondente', () => {
    renderizar(<TomNoticias tom={tom} manchetes={manchetes} empresas={[]} />);

    const positiva = screen.getByText(TEXTOS.dia.tomDaManchete.positivo);
    expect(positiva).toHaveAttribute('data-tom', 'alta');

    const negativa = screen.getByText(TEXTOS.dia.tomDaManchete.negativo);
    expect(negativa).toHaveAttribute('data-tom', 'queda');
  });
});
