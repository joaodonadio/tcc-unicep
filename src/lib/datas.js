/**
 * Datas em pt-BR.
 *
 * Datas puras "AAAA-MM-DD" são tratadas como texto: nunca passam por
 * new Date('AAAA-MM-DD'), que é lido como UTC e pode cair no dia anterior.
 * Instantes com horário (ISO com offset) são exibidos no fuso de São Paulo.
 */

const FUSO = 'America/Sao_Paulo';

const DIAS_SEMANA = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const DATA_PURA = /^(\d{4})-(\d{2})-(\d{2})/;

/** Lê "AAAA-MM-DD" em partes, sem criar Date. Retorna null se não casar. */
const lerData = (iso) => {
  const m = DATA_PURA.exec(String(iso ?? ''));
  return m ? { ano: m[1], mes: m[2], dia: m[3] } : null;
};

/** "2026-10-22" -> "22/10/2026" */
export function dataBR(iso) {
  const d = lerData(iso);
  return d ? `${d.dia}/${d.mes}/${d.ano}` : '';
}

/** "2026-10-22" -> "22/10" */
export function diaMes(iso) {
  const d = lerData(iso);
  return d ? `${d.dia}/${d.mes}` : '';
}

/** "2026-10-22" -> "quinta-feira, 22 de outubro de 2026" */
export function dataExtenso(iso) {
  const d = lerData(iso);
  if (!d) return '';
  const ano = Number(d.ano);
  const mes = Number(d.mes);
  const dia = Number(d.dia);
  const diaSemana = DIAS_SEMANA[new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay()];
  return `${diaSemana}, ${dia} de ${MESES[mes - 1]} de ${ano}`;
}

/** "2026-09" -> "set/2026" */
export function mesAno(ano_mes) {
  const m = /^(\d{4})-(\d{2})/.exec(String(ano_mes ?? ''));
  return m ? `${MESES_ABREV[Number(m[2]) - 1]}/${m[1]}` : '';
}

/** "2026-11" -> "Novembro de 2026"; vazio se o mês não existir. */
export function mesExtenso(ano_mes) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(ano_mes ?? ''));
  const mes = m ? Number(m[2]) : 0;
  if (mes < 1 || mes > 12) return '';
  const nome = MESES[mes - 1];
  return `${nome.charAt(0).toUpperCase()}${nome.slice(1)} de ${m[1]}`;
}

const FORMATO_HORA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Partes de um instante ISO (com horário e offset) no fuso de São Paulo. */
const partesNoFuso = (iso) => {
  if (typeof iso !== 'string' || iso.trim() === '') return null;
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return null;
  return Object.fromEntries(FORMATO_HORA.formatToParts(instante).map(({ type, value }) => [type, value]));
};

/** "2026-10-24T23:25:33-03:00" -> "24/10/2026 às 23h25" */
export function dataHoraBR(iso) {
  const p = partesNoFuso(iso);
  return p ? `${p.day}/${p.month}/${p.year} às ${p.hour}h${p.minute}` : '';
}

/** "2026-10-24T23:25:33-03:00" -> "23h25" */
export function horaBR(iso) {
  const p = partesNoFuso(iso);
  return p ? `${p.hour}h${p.minute}` : '';
}

/** Quando a notícia saiu: "22/10/2026 às 17h19"; sem horário: "22/10/2026, sem horário"; sem nada: "sem horário". */
export function quandoPublicada(item) {
  const comHora = dataHoraBR(item?.publicado_em);
  if (comHora) return comHora;
  const dia = dataBR(item?.data_publicacao);
  return dia ? `${dia}, sem horário` : 'sem horário';
}

const FORMATO_DIA = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Dia civil de São Paulo em "AAAA-MM-DD" para o instante dado (padrão: agora). */
export function hojeISO(agora = new Date()) {
  const p = Object.fromEntries(FORMATO_DIA.formatToParts(agora).map(({ type, value }) => [type, value]));
  return `${p.year}-${p.month}-${p.day}`;
}

const DIAS_CURTOS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** "2026-10-26" -> "segunda" */
export function diaSemanaCurto(iso) {
  const d = lerData(iso);
  if (!d) return '';
  return DIAS_CURTOS[new Date(Date.UTC(Number(d.ano), Number(d.mes) - 1, Number(d.dia))).getUTCDay()];
}

/** "2026-06-30" -> "2T26" (trimestre e ano com dois dígitos). */
export function rotuloTrimestre(iso) {
  const d = lerData(iso);
  if (!d) return '';
  return `${Math.ceil(Number(d.mes) / 3)}T${d.ano.slice(2)}`;
}
