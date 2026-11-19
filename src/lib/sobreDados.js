/**
 * Transparência sobre a atualização: funções puras que leem o registro de
 * `execucao` e montam o resumo do topo, os cartões de pacotes e os avisos da
 * seção "De onde vêm os números?". Nenhum texto literal aqui: tudo sai de TEXTOS.dados.
 *
 * Regra central: ausência nunca vira 0. Número que não chegou fica null
 * (a tela mostra "—") e o fato que faltar sai do resumo.
 */

import { dataBR, dataHoraBR, horaBR } from './datas.js';
import { TEXTOS } from './textos.js';

const { dados } = TEXTOS;

/** Leitura de chave própria de um mapa de textos (evita pegar propriedades herdadas). */
const lerMapa = (mapa, chave) => (Object.prototype.hasOwnProperty.call(mapa, chave) ? mapa[chave] : null);

/** Nome legível de um pacote; nome desconhecido sai como veio. */
export function nomePacote(pacote) {
  return lerMapa(dados.pacotes, pacote) ?? String(pacote ?? '');
}

/** Número do campo, ou null se não for um número finito. */
const numeroOuNulo = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** "2026-10-24T23:23:45-03:00" -> "24/10" (dia e mês no fuso de São Paulo). */
function diaDoInstante(iso) {
  const m = /^(\d{2})\/(\d{2})/.exec(dataHoraBR(iso));
  return m ? `${m[1]}/${m[2]}` : '';
}

/**
 * Cartões de "O que chegou": um item por pacote enviado.
 * `selo`: 'atualizado' (registros > 0), 'semMudanca' (0) ou null (número ausente).
 * `retirados`: quantidade removida, só quando é maior que zero; senão null.
 */
export function linhasDePacotes(execucao) {
  const pacotes = Array.isArray(execucao?.pacotes_enviados) ? execucao.pacotes_enviados : [];
  return pacotes.map((p, i) => {
    const registros = numeroOuNulo(p?.registros);
    const removidos = numeroOuNulo(p?.removidos);
    return {
      chave: `${p?.pacote ?? 'pacote'}-${i}`,
      nome: nomePacote(p?.pacote),
      registros,
      removidos,
      selo: registros === null ? null : registros > 0 ? 'atualizado' : 'semMudanca',
      retirados: removidos !== null && removidos > 0 ? removidos : null,
      arquivo: typeof p?.arquivo === 'string' && p.arquivo.trim() !== '' ? p.arquivo : null,
    };
  });
}

/** A coleta foi consultada nesta atualização? true/false; sem o campo, null (nunca presume). */
export function coletaConsultada(execucao) {
  const consultado = execucao?.coleta_status?.consultado;
  return typeof consultado === 'boolean' ? consultado : null;
}

/** Avisos em texto, como vieram do processamento. */
export function avisosDaAtualizacao(execucao) {
  const avisos = Array.isArray(execucao?.avisos) ? execucao.avisos : [];
  return avisos.filter((texto) => typeof texto === 'string' && texto.trim() !== '');
}

/** Nota da coleta, se houver. */
export function notaColeta(execucao) {
  const nota = execucao?.coleta_status?.nota;
  return typeof nota === 'string' && nota.trim() !== '' ? nota : '';
}

/**
 * Bastidores da coleta para os detalhes técnicos: fatos (horários, consultas, pregão lido) e etapas.
 * Campo que não veio fica de fora; nada vira 0.
 */
export function detalhesDaColeta(execucao) {
  const c = execucao?.coleta_status;
  if (!c) return { fatos: [], etapas: [] };
  const t = TEXTOS.dados.coleta;
  const numero = (v) => (Number.isFinite(v) ? String(v) : null);
  const fatos = [
    [t.fatos.inicio, dataHoraBR(c.iniciada_em)],
    [t.fatos.fim, dataHoraBR(c.finalizada_em)],
    [t.fatos.entrega, dataHoraBR(c.entrega_concluida_em)],
    [t.fatos.prazo, dataHoraBR(c.prazo)],
    [t.fatos.primeiraConsulta, dataHoraBR(c.primeira_consulta_em)],
    [t.fatos.ultimaConsulta, dataHoraBR(c.ultima_consulta_em)],
    [t.fatos.consultas, numero(c.consultas)],
    [t.fatos.espera, Number.isFinite(c.espera_segundos) ? t.segundos(c.espera_segundos) : null],
    [t.fatos.pregaoEsperado, dataBR(c.t_esperado)],
    [t.fatos.pregaoLido, dataBR(c.ultimo_pregao_lido)],
    [t.fatos.origem, c.origem ?? null],
    [t.fatos.execucao, c.execucao_id ?? null],
  ]
    .filter(([, valor]) => valor != null && valor !== '')
    .map(([rotulo, valor]) => ({ rotulo, valor }));
  const etapas = Object.entries(c.etapas ?? {}).map(([chave, situacao]) => ({
    chave,
    nome: t.etapas[chave] ?? chave,
    situacao: t.situacoes[situacao] ?? situacao,
    concluida: situacao === 'concluida',
  }));
  return { fatos, etapas };
}

const SITUACOES = ['ok', 'parcial', 'falhou'];
const TOM_SITUACAO = { ok: 'alta', parcial: 'acento', falhou: 'queda' };
const BRILHO_SITUACAO = { alta: 'alta', acento: 'acento', queda: 'queda', neutro: 'aco' };
const HUMOR_SITUACAO = { ok: 'contente', parcial: 'preocupado', falhou: 'preocupado', desconhecida: 'neutro' };

/**
 * Situação do topo: rótulo, tom (alta, acento, queda, neutro), mancha do cartão (brilho),
 * humor do pavio e frase curta. Status desconhecido cai em "desconhecida".
 */
export function situacaoPainel(status) {
  const chave = SITUACOES.includes(status) ? status : 'desconhecida';
  const tom = TOM_SITUACAO[chave] ?? 'neutro';
  return {
    rotulo: dados.situacaoPainel[chave],
    tom,
    brilho: BRILHO_SITUACAO[tom],
    humor: HUMOR_SITUACAO[chave],
    frase: dados.pavio[chave],
  };
}

/**
 * Fatos do topo. Cada um vem já em texto, ou null quando o dado não chegou (o fato some da tela).
 * `periodo` (início e fim) só interessa ao modo técnico. `dadosAte` é o instante até onde vão os dados (mercado_dia).
 */
export function fatosDaAtualizacao({ dataReferencia, execucao, dadosAte = null } = {}) {
  const v = dados.valores;
  const reg = execucao ?? {};
  const pregao = dataBR(dataReferencia) || null;
  const diaFim = diaDoInstante(reg.fim);
  const horaFim = horaBR(reg.fim);
  const horaInicio = horaBR(reg.inicio);
  const diaDadosAte = diaDoInstante(dadosAte);
  const horaDadosAte = horaBR(dadosAte);
  return {
    pregao,
    dadosAte: diaDadosAte && horaDadosAte ? v.publicado(diaDadosAte, horaDadosAte) : null,
    publicado: diaFim && horaFim ? v.publicado(diaFim, horaFim) : null,
    atualizacao: Number.isInteger(reg.rodada) ? v.numero(reg.rodada) : null,
    periodo: horaInicio && horaFim ? v.periodo(horaInicio, horaFim) : null,
  };
}

/** Aviso técnico que fica só no bloco da equipe, sem frase no resumo. */
const AVISO_SEM_RESUMO = /composi[çc][ãa]o do ibovespa|cobertura/i;

/** Regras que transformam um aviso técnico em frase simples (a primeira que casar entra no resumo). */
const REGRAS_AVISO = [
  { padrao: /modelo provis[óo]rio|teste|top 5 n[ãa]o oficial/i, frase: dados.avisosResumo.modelo },
  { padrao: /depois das 10h/i, frase: dados.avisosResumo.horario },
];

/**
 * Frases simples que resumem os avisos do processamento, sem o texto cru.
 * Sem avisos: "Nenhum aviso". Avisos que nenhuma regra reconhece: frase genérica.
 */
export function resumoAvisos(execucao) {
  // a estimativa da composição antiga do Ibovespa não vira frase para o público
  const textos = avisosDaAtualizacao(execucao).filter((t) => !AVISO_SEM_RESUMO.test(t));
  if (textos.length === 0) return [dados.avisosResumo.nenhum];
  const frases = REGRAS_AVISO.filter(({ padrao }) => textos.some((t) => padrao.test(t))).map(({ frase }) => frase);
  return frases.length > 0 ? frases : [dados.avisosResumo.generico];
}

/** Minúsculas e sem acento, para casar palavras-chave. */
const semAcento = (texto) => texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

/**
 * Regras da categoria de cada aviso cru, na ordem em que valem (a primeira que casar entra).
 * "top 5" vem antes de "modelo": um texto que fala de top 5 e de modelo é do top 5.
 */
const REGRAS_CATEGORIA = [
  ['ibovespa', /ibovespa|composicao/],
  ['horario', /\b10h\b|depois das/],
  // só "experimento" solto (ex.: registros do experimento) não é sobre o Top 5
  ['top5', /top 5|historico do experimento|experimento_/],
  ['modelo', /modelo/],
  ['agenda', /agenda|cron|consulta/],
];

/** Categoria do aviso cru: ibovespa, modelo, horario, top5, agenda ou outro. */
export function categoriaDoAviso(texto) {
  const t = semAcento(typeof texto === 'string' ? texto : '');
  const regra = REGRAS_CATEGORIA.find(([, padrao]) => padrao.test(t));
  return regra ? regra[0] : 'outro';
}

/**
 * Partes de um aviso cru, para exibir com formatação. Os caracteres são preservados:
 * - 'data': AAAA-MM-DD vira DD/MM/AAAA; AAAA-MM vira MM/AAAA (`iso` guarda a data original).
 * - 'codigo': expressões `palavra = valor`, opções que começam com --, identificadores com ponto ou sublinhado.
 * - 'texto': o resto.
 */
const PADRAO_PARTES =
  /(?<data>\b(?<a>\d{4})-(?<m>\d{2})-(?<d>\d{2})\b)|(?<mes>\b(?<ma>\d{4})-(?<mm>\d{2})\b(?!-\d))|(?<expr>(?<![\p{L}\p{N}_.])[\p{L}\p{N}]+(?:[._][\p{L}\p{N}]+)+ = [\p{L}\p{N}_.-]+)|(?<opcao>(?<![\p{L}\p{N}-])--[\p{L}\p{N}][\p{L}\p{N}-]*)|(?<ident>(?<![\p{L}\p{N}_.])[\p{L}\p{N}]+(?:[._][\p{L}\p{N}]+)+)/gu;

export function partesDoAviso(texto) {
  const original = typeof texto === 'string' ? texto : '';
  const partes = [];
  let ultimo = 0;
  const empurrarTexto = (fim) => {
    if (fim > ultimo) partes.push({ tipo: 'texto', valor: original.slice(ultimo, fim) });
  };

  for (const m of original.matchAll(PADRAO_PARTES)) {
    empurrarTexto(m.index);
    const g = m.groups;
    if (g.data) {
      partes.push({ tipo: 'data', valor: `${g.d}/${g.m}/${g.a}`, iso: g.data });
    } else if (g.mes) {
      partes.push({ tipo: 'data', valor: `${g.mm}/${g.ma}`, iso: g.mes });
    } else {
      partes.push({ tipo: 'codigo', valor: m[0] });
    }
    ultimo = m.index + m[0].length;
  }
  empurrarTexto(original.length);
  return partes;
}
