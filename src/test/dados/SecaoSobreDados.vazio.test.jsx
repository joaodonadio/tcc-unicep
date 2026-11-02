import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import SecaoSobreDados from '../../components/dados/SecaoSobreDados.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

// Arquivo à parte: a execução vazia não pode herdar o cache dos outros testes.
describe('SecaoSobreDados sem registro de atualização', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra a frase de ausência em vez de uma tabela vazia', async () => {
    const servidor = instalarFetchDados();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (entrada, opcoes) => {
        const url = String(entrada?.url ?? entrada);
        if (url.includes('/execucao.json')) {
          return { ok: true, status: 200, json: async () => ({ versao_contrato: '1.0', registros: [] }) };
        }
        return servidor(entrada, opcoes);
      }),
    );

    renderizar(<SecaoSobreDados nivelTitulo={1} />);

    expect(await screen.findByText(porNivel(TEXTOS.dados.semDado, 'simples'))).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: TEXTOS.dados.secoes.origens })).toBeInTheDocument();
    expect(screen.queryByText(TEXTOS.dados.fatos.pregao)).not.toBeInTheDocument();
  });
});
