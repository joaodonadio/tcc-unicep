import { readFileSync } from 'node:fs';
import path from 'node:path';
import { vi } from 'vitest';

/**
 * Fetch de teste para o modo arquivos: serve os pacotes de public/dados/
 * como a fonte arquivos os pede (`${BASE_URL}dados/<pacote>.json`).
 * Qualquer outra URL (ex.: /traduzir) responde 503, como um proxy indisponível.
 */

const PACOTE = /\/dados\/([\w-]+)\.json(?:[?#].*)?$/;
const RAIZ_DADOS = path.resolve(process.cwd(), 'public', 'dados');

const resposta = (status, dados) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => dados,
});

export function instalarFetchDados() {
  const falso = vi.fn(async (entrada) => {
    const url = String(entrada?.url ?? entrada);
    const casa = PACOTE.exec(url);
    if (!casa) return resposta(503, {});

    try {
      const arquivo = path.join(RAIZ_DADOS, `${casa[1]}.json`);
      return resposta(200, JSON.parse(readFileSync(arquivo, 'utf8')));
    } catch {
      return resposta(404, {});
    }
  });
  vi.stubGlobal('fetch', falso);
  return falso;
}
