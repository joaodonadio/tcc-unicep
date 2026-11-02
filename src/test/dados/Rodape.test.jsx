import { beforeEach, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { Rodape } from '../../components/layout/Rodape.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

describe('Rodape: link para Sobre os dados', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('leva à página Sobre os dados', () => {
    renderizar(<Rodape />);
    expect(screen.getByRole('link', { name: TEXTOS.dados.linkRodape })).toHaveAttribute('href', '/dados');
  });
});
