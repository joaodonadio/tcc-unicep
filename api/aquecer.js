// Agendamento diário da Vercel (vercel.json, "crons"): depois da publicação da API, pede as
// rotas montadas pelo domínio público para a CDN já guardar as respostas. Assim quem abre o
// site não espera as 85 consultas. Não lê nem devolve a chave.

export const ROTAS_AQUECIDAS = ['proventos-todos', 'velas-setores', 'series-semana', 'dolar-historico'];

export default async function handler(req, res) {
  const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (!dominio) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ erro: 'domínio de produção desconhecido' }));
  }
  const resultados = await Promise.all(
    ROTAS_AQUECIDAS.map(async (rota) => {
      try {
        const resp = await fetch(`https://${dominio}/api/v1/${rota}`);
        return { rota, status: resp.status };
      } catch {
        return { rota, status: null };
      }
    }),
  );
  res.statusCode = 200;
  return res.end(JSON.stringify({ resultados }));
}
