// Mesma rota do plugin local (scripts/proventosAgregados.mjs), em função da Vercel.
import { criarPedirJson } from '../../scripts/pedirApi.mjs';
import { montarProventosTodos } from '../../scripts/proventosAgregados.mjs';
import { rotaMontada } from '../_comum.js';

export default rotaMontada((env) => montarProventosTodos(criarPedirJson(env)), 'proventos indisponíveis');
