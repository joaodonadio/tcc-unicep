/**
 * Ponto único de leitura dos dados. Escolhe a fonte pelo ambiente:
 *   VITE_FONTE_DADOS=api      -> API de leitura via proxy (fonteApi.js)
 *   qualquer outro / ausente  -> arquivos de public/dados (fonteArquivos.js)
 *
 * Os hooks chamam só `obter`; nunca sabem qual fonte está ativa.
 */

import { verificarContrato } from './contrato.js';
import { ErroDados, MENSAGEM_PADRAO } from './erros.js';
import { pedirApi } from './fonteApi.js';
import { pedirArquivos } from './fonteArquivos.js';
import { corrigirNome } from '../lib/nomesEmpresas.js';

/**
 * Corrige a grafia de `empresa` e `nome` em cada registro do envelope. Só o nível
 * do registro; devolve cópias, porque a fonte arquivos guarda os registros em cache.
 */
function corrigirNomes(resp) {
  const corrigirRegistro = (registro) => {
    if (!registro || typeof registro !== 'object') return registro;
    const campos = ['empresa', 'nome'].filter((campo) => typeof registro[campo] === 'string');
    if (campos.length === 0) return registro;
    const copia = { ...registro };
    for (const campo of campos) copia[campo] = corrigirNome(registro[campo]);
    return copia;
  };

  if (!resp || typeof resp !== 'object') return resp;
  if (Array.isArray(resp.registros)) {
    return { ...resp, registros: resp.registros.map(corrigirRegistro) };
  }
  return corrigirRegistro(resp);
}

function lerFonte() {
  return import.meta.env.VITE_FONTE_DADOS === 'api' ? 'api' : 'arquivos';
}

/** Fonte ativa no momento do carregamento do módulo ('api' ou 'arquivos'). */
export const FONTE = lerFonte();

/**
 * Busca uma rota (sem /v1, tickers já codificados) e devolve o envelope, um
 * registro ou null. Erros chegam sempre como ErroDados.
 */
export async function obter(caminho, { params, signal } = {}) {
  try {
    const resp = lerFonte() === 'api'
      ? await pedirApi(caminho, { params, signal })
      : await pedirArquivos(caminho, { params });

    if (resp && typeof resp === 'object' && resp.versao_contrato !== undefined) {
      verificarContrato(resp);
    }
    return corrigirNomes(resp);
  } catch (erro) {
    if (erro instanceof ErroDados) throw erro;
    if (signal?.aborted) throw erro;
    throw new ErroDados(MENSAGEM_PADRAO, { causa: erro });
  }
}
