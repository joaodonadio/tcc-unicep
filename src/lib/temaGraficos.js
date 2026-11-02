/**
 * Tema dos gráficos (ECharts não entende var()): lê os tokens CSS em tempo de
 * execução e devolve cores reais, com valores de reserva se a variável vier vazia.
 */

const RESERVA = {
  '--cor-texto': '#f3eee6',
  '--cor-texto-suave': '#a39d92',
  '--cor-fio': '#46484d',
  '--cor-borda': '#4a4c51',
  '--cor-superficie': '#34363a',
  '--cor-superficie-2': 'rgb(255 255 255 / 0.08)',
  '--cor-fundo': '#1a1815',
  '--cor-alta': '#7cc39a',
  '--cor-queda': '#ea8f86',
  '--cor-dado-1': '#e8a54b',
  '--cor-dado-2': '#8fbf9f',
  '--cor-dado-3': '#a99bd6',
  '--cor-dado-4': '#7fa3c0',
  '--cor-dado-5': '#a8a39a',
  '--fonte-texto': 'system-ui, sans-serif',
};

/** Valor de um token CSS na raiz, ou a reserva quando ausente (jsdom, SSR). */
export function lerToken(nome) {
  let valor = '';
  try {
    if (typeof document !== 'undefined') {
      valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
    }
  } catch {
    valor = '';
  }
  return valor || RESERVA[nome] || '';
}

/** Resolve "var(--x)" ou "var(--x, reserva)" para a cor real; outros valores passam intactos. */
export function resolverCor(cor) {
  if (typeof cor !== 'string') return cor;
  const m = cor.trim().match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (!m) return cor;
  const token = lerToken(m[1]);
  if (token && token.startsWith('var(')) return resolverCor(token);
  return token || (m[2] ? m[2].trim() : '') || RESERVA['--cor-dado-1'];
}

/** Lê "#rgb", "#rrggbb", "rgb()" ou "rgb(r g b / a)" em [r, g, b, alfa]; outro formato devolve null. */
function paraRgba(cor) {
  const c = String(cor ?? '').trim();
  let m = c.match(/^#([\da-f]{3}|[\da-f]{6})$/i);
  if (m) {
    let hex = m[1];
    if (hex.length === 3) hex = hex.split('').map((h) => h + h).join('');
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  m = c.match(/^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)(?:\s*[,/]\s*([\d.]+)(%?))?\s*\)$/i);
  if (m) {
    const alfa = m[4] === undefined ? 1 : parseFloat(m[4]) / (m[5] ? 100 : 1);
    return [Number(m[1]), Number(m[2]), Number(m[3]), alfa];
  }
  return null;
}

/** Cor translúcida composta sobre um fundo opaco: devolve rgb() sólido (sem alfa). Formato desconhecido volta intacto. */
export function opacaSobre(cor, fundo) {
  const c = paraRgba(cor);
  const f = paraRgba(fundo);
  if (!c || !f) return cor;
  const a = c[3];
  const canal = (i) => Math.round(c[i] * a + f[i] * (1 - a));
  return `rgb(${canal(0)}, ${canal(1)}, ${canal(2)})`;
}

/** Paleta e tipografia atuais, para montar as opções do gráfico. */
export function temaGraficos() {
  const fundo = lerToken('--cor-fundo');
  return {
    texto: lerToken('--cor-texto'),
    suave: lerToken('--cor-texto-suave'),
    fio: lerToken('--cor-fio'),
    borda: lerToken('--cor-borda'),
    fundo,
    /** Cartão do tooltip: superfície elevada opaca (o gráfico não aparece através dele). */
    superficie: opacaSobre(lerToken('--cor-superficie-2'), fundo),
    alta: lerToken('--cor-alta'),
    queda: lerToken('--cor-queda'),
    dados: [1, 2, 3, 4, 5].map((i) => lerToken(`--cor-dado-${i}`)),
    fonte: lerToken('--fonte-texto'),
  };
}

/** Converte "#rgb"/"#rrggbb"/"rgb()" em rgba com a opacidade dada; outro formato volta intacto. */
export function comOpacidade(cor, opacidade) {
  if (typeof cor !== 'string') return cor;
  const c = cor.trim();
  let m = c.match(/^#([\da-f]{3})$/i);
  if (m) {
    const [r, g, b] = m[1].split('').map((h) => parseInt(h + h, 16));
    return `rgba(${r},${g},${b},${opacidade})`;
  }
  m = c.match(/^#([\da-f]{6})/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacidade})`;
  }
  m = c.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (m) return `rgba(${m[1]},${m[2]},${m[3]},${opacidade})`;
  return c;
}
