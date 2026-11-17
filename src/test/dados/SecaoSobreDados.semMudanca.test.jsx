import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import SecaoSobreDados from '../../components/dados/SecaoSobreDados.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import execucaoJson from '../../../public/dados/execucao.json';

// Arquivo à parte: a fonte de arquivos guarda os pacotes em cache por arquivo de teste,
// então a execução alterada aqui precisa chegar pelo fetch deste arquivo.
const registroBase = execucaoJson.registros[0];

/** Faz a execução de teste chegar pelo fetch; o resto dos pacotes vem de public/dados. */
function servirExecucao(registros) {
  const servidor = instalarFetchDados();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (entrada, opcoes) => {
      const url = String(entrada?.url ?? entrada);
      if (url.includes('/execucao.json')) {
        return { ok: true, status: 200, json: async () => ({ versao_contrato: '1.0', registros }) };
      }
      return servidor(entrada, opcoes);
    }),
  );
}

describe('SecaoSobreDados com pacote sem mudança e número ausente', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra o selo de sem mudança sem o zero solto, o retirados e a quantidade não informada', async () => {
    servirExecucao([
      {
        ...registroBase,
        avisos: [],
        pacotes_enviados: [
          { pacote: 'acoes', arquivo: 'acoes.json', registros: 0, removidos: 2 },
          { pacote: 'proventos', arquivo: 'proventos.json', registros: null, removidos: 0 },
        ],
      },
    ]);

    renderizar(<SecaoSobreDados nivelTitulo={1} />);

    const semMudanca = porNivel(TEXTOS.dados.selos.semMudanca, 'simples');
    expect(await screen.findByText(new RegExp(`^${semMudanca}\\.`))).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.dados.selos.retirados(2))).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^${TEXTOS.dados.semQuantidade}\\.`))).toBeInTheDocument();
    expect(screen.queryByText(/itens/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Atualizado\./)).not.toBeInTheDocument();
  });

  it('sem avisos, a frase de nenhum aviso aparece e a nota da coleta fica recolhida, sem lista crua', async () => {
    // Este arquivo lê a execução uma vez (cache por arquivo): o cenário é o mesmo do teste acima.
    servirExecucao([{ ...registroBase, avisos: [] }]);

    renderizar(<SecaoSobreDados nivelTitulo={1} />);

    expect(await screen.findByText(TEXTOS.dados.avisosResumo.nenhum)).toBeInTheDocument();
    const nota = screen.getByText(registroBase.coleta_status.nota);
    expect(nota.closest('.detalhes-painel')).toHaveAttribute('inert');
    expect(screen.getByRole('button', { name: TEXTOS.dados.equipe.abrir })).toBeInTheDocument();
  });
});
