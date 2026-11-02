import { REGRAS } from '../../lib/sugestoes.js';

/** Ordem dos tipos nas telas: a favor, atenção e contexto. */
export const ORDEM_TIPOS = ['forte', 'atencao', 'contexto'];

/** Tipo de um sinal ou regra; tipo desconhecido cai em contexto. */
export const tipoDe = (sinal) => (sinal.tipo === 'forte' || sinal.tipo === 'atencao' ? sinal.tipo : 'contexto');

/** Todas as regras do projeto, agrupadas na ordem dos tipos. */
export const REGRAS_POR_TIPO = ORDEM_TIPOS.flatMap((tipo) => REGRAS.filter((regra) => regra.tipo === tipo));
