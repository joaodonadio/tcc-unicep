/**
 * Pede JSON à API privada com a chave no cabeçalho. Usado pelos plugins do Vite e pelas
 * funções da Vercel (api/): a lógica de montagem recebe só a função devolvida aqui.
 * `nulo404`: 404 vira null (sem registro) em vez de erro.
 */
export function criarPedirJson(env, { nulo404 = false } = {}) {
  const base = String(env.API_BASE_URL ?? '').replace(/\/+$/, '');
  const cabecalhos = { 'X-API-Key': env.API_KEY ?? '' };
  return async function pedirJson(caminho) {
    const resp = await fetch(`${base}/v1/${caminho}`, { headers: cabecalhos });
    if (nulo404 && resp.status === 404) return null;
    if (!resp.ok) throw new Error(`${caminho}: HTTP ${resp.status}`);
    return resp.json();
  };
}
