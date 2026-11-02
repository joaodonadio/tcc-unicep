import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import Noticias from '../../pages/Noticias.jsx';
import PainelHoje from '../../components/hoje/PainelHoje.jsx';
import SecaoSobreDados from '../../components/dados/SecaoSobreDados.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

vi.mock('../../hooks/useTraducao.js', () => ({ useTraducao: () => ({ data: null }) }));
vi.mock('../../components/modelos3d/Modelo3D.jsx', () => ({ default: () => null }));

const CHAVE_PREFERENCIAS = 'painel-b3:preferencias';
const usarNivel = (nivel) => localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ nivel, zoom: 1 }));

describe('textos mudam com o nível de leitura', () => {
  beforeEach(() => {
    localStorage.clear();
    instalarFetchDados();
  });

  it('Notícias: título e introdução do modo simples trocam pelos do modo técnico', async () => {
    const { unmount } = renderizar(<Noticias />);
    expect(screen.getByRole('heading', { level: 1, name: porNivel(TEXTOS.paginas.noticiasTitulo, 'simples') })).toBeInTheDocument();
    expect(screen.getByText(porNivel(TEXTOS.paginas.noticiasIntro, 'simples'))).toBeInTheDocument();
    unmount();

    usarNivel('tecnico');
    renderizar(<Noticias />);
    expect(screen.getByRole('heading', { level: 1, name: porNivel(TEXTOS.paginas.noticiasTitulo, 'tecnico') })).toBeInTheDocument();
    expect(screen.getByText(porNivel(TEXTOS.paginas.noticiasIntro, 'tecnico'))).toBeInTheDocument();
    expect(screen.queryByText(porNivel(TEXTOS.paginas.noticiasIntro, 'simples'))).not.toBeInTheDocument();
  });

  it('Hoje: o título do bloco de números muda de nível', async () => {
    const { unmount } = renderizar(<PainelHoje />);
    expect(
      await screen.findByRole('heading', { level: 2, name: porNivel(TEXTOS.hoje.numeros, 'simples') }),
    ).toBeInTheDocument();
    unmount();

    usarNivel('tecnico');
    renderizar(<PainelHoje />);
    expect(
      await screen.findByRole('heading', { level: 2, name: porNivel(TEXTOS.hoje.numeros, 'tecnico') }),
    ).toBeInTheDocument();
    expect(await screen.findByText(porNivel(TEXTOS.hoje.ibovespa, 'tecnico'))).toBeInTheDocument();
  });

  it('Sobre os dados: o título muda de nível', async () => {
    usarNivel('tecnico');
    renderizar(<SecaoSobreDados />);
    expect(
      await screen.findByRole('heading', { level: 2, name: porNivel(TEXTOS.dados.titulo, 'tecnico') }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: porNivel(TEXTOS.dados.titulo, 'simples') })).not.toBeInTheDocument();
  });
});
