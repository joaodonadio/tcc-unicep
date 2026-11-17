// Mesma rota do plugin local (scripts/seriesSemana.mjs), em função da Vercel.
import { criarPedirJson } from '../../scripts/pedirApi.mjs';
import { montarSeriesSemana } from '../../scripts/seriesSemana.mjs';
import { rotaMontada } from '../_comum.js';

export default rotaMontada(
  async (env) => (await montarSeriesSemana(criarPedirJson(env, { nulo404: true }))).velas,
  'velas dos setores indisponíveis',
);
