import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { TomNoticias } from '../../components/inicio/TomNoticias.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS, porNivel } from '../../lib/textos.js';

const tom = (total) => ({ total, positivas: total, neutras: 0, negativas: 0 });

describe('TomNoticias com poucas manchetes', () => {
  it('avisa quando há menos de 20 manchetes classificadas', () => {
    renderizar(<TomNoticias tom={tom(7)} totalEmpresas={3} manchetes={{}} empresas={[]} />);
    expect(screen.getByText(porNivel(TEXTOS.paginas.poucasManchetes, 'simples')(7, 3))).toBeInTheDocument();
  });

  it('não avisa com 20 ou mais', () => {
    renderizar(<TomNoticias tom={tom(20)} totalEmpresas={9} manchetes={{}} empresas={[]} />);
    expect(screen.queryByText(/classificou só/)).not.toBeInTheDocument();
  });
});
