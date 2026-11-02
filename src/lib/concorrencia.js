/** Aplica fn a cada item com no máximo `limite` em andamento; mantém a ordem; cada posição vira {ok, valor} ou {ok:false, erro}. */
export async function mapearComLimite(itens, limite, fn, { signal } = {}) {
  const resultados = new Array(itens.length);
  let proximo = 0;
  async function trabalhador() {
    while (proximo < itens.length) {
      if (signal?.aborted) throw signal.reason ?? new DOMException('Cancelado', 'AbortError');
      const i = proximo++;
      try { resultados[i] = { ok: true, valor: await fn(itens[i], i) }; }
      catch (erro) { if (signal?.aborted) throw erro; resultados[i] = { ok: false, erro }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, trabalhador));
  return resultados;
}

/** Tenta de novo enquanto deveRepetir(tentativa, erro) for true, com espera crescente. */
export async function comRepeticao(fn, deveRepetir, { esperaMs = 500, signal } = {}) {
  for (let tentativa = 0; ; tentativa++) {
    try { return await fn(); }
    catch (erro) {
      if (signal?.aborted || !deveRepetir(tentativa, erro)) throw erro;
      await new Promise((r) => setTimeout(r, esperaMs * 2 ** tentativa));
    }
  }
}

/** Fila com no máximo `limite` tarefas em andamento: devolve (fn) => Promise com o resultado de fn. */
export function criarLimitador(limite) {
  let emAndamento = 0;
  const fila = [];
  const proximo = () => {
    if (emAndamento >= limite || fila.length === 0) return;
    emAndamento += 1;
    const { fn, resolver, rejeitar } = fila.shift();
    Promise.resolve()
      .then(fn)
      .then(resolver, rejeitar)
      .finally(() => {
        emAndamento -= 1;
        proximo();
      });
  };
  return (fn) =>
    new Promise((resolver, rejeitar) => {
      fila.push({ fn, resolver, rejeitar });
      proximo();
    });
}
