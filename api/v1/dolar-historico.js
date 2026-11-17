// Mesma rota do plugin local (scripts/dolarHistorico.mjs), em função da Vercel.
import { criarPedirDia, montarCorpoDolar } from '../../scripts/dolarHistorico.mjs';
import { rotaMontada } from '../_comum.js';

export default rotaMontada((env) => montarCorpoDolar(criarPedirDia(env)), 'histórico do dólar indisponível');
