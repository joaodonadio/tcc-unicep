import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import SecaoSobreDados from '../../components/dados/SecaoSobreDados.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { TEXTOS } from '../../lib/textos.js';

// Arquivo à parte: a fonte de arquivos guarda em cache só os pacotes lidos com sucesso,
// então aqui a execução começa sem cache e a falha chega de verdade.
describe('SecaoSobreDados com falha na leitura', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra o bloco de erro com botão de tentar de novo, que refaz a leitura', async () => {
    const fetchFalho = vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchFalho);

    renderizar(<SecaoSobreDados />);

    expect(await screen.findByRole('alert')).toHaveTextContent(TEXTOS.estados.erroTitulo);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    const chamadasAntes = fetchFalho.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: TEXTOS.estados.tentarDeNovo }));

    await screen.findByRole('alert');
    expect(fetchFalho.mock.calls.length).toBeGreaterThan(chamadasAntes);
  });
});
