import { useId, useMemo, useState } from 'react';
import { useHistoricoCampo } from '../../hooks/useDados.js';
import { usePreferencias } from '../../context/contextos.js';
import { dataBR } from '../../lib/datas.js';
import { CAMPOS_HISTORICO, compararEm, datasDisponiveis } from '../../lib/historicoAcao.js';
import { TEXTOS } from '../../lib/textos.js';
import { exibirNumero } from '../../lib/valor.js';
import { GraficoInterativo } from '../graficos/GraficoInterativo.jsx';
import { BlocoErro, BlocoVazio, Linhas } from '../ui/Estados.jsx';

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/** No nível simples só estes indicadores aparecem (sem a tabela "como estava"). */
const CAMPOS_SIMPLES = ['pl', 'pvp', 'dividend_yield'];

/** "P/L passou de 8,2 em 12/03/2026 para 6,0 em 20/10/2026.", do primeiro ao último valor guardado. */
function fraseDaEvolucao(h, def) {
  const indices = [...h.valores.keys()].filter((i) => finito(h.valores[i]));
  if (indices.length < 2) return null;
  const primeiro = indices[0];
  const ultimo = indices[indices.length - 1];
  return TEXTOS.ficha.frases.historico(
    def.rotulo,
    def.formatar(h.valores[primeiro]),
    def.formatar(h.valores[ultimo]),
    dataBR(h.datas[primeiro]),
    dataBR(h.datas[ultimo]),
  );
}

/**
 * Histórico da ficha, na pergunta "Está cara?". No simples: a evolução de P/L, P/VP e
 * dividend yield. No técnico: também a tabela "como estava em" uma data guardada e a
 * cotação e o ROE na evolução.
 */
export function PainelHistorico({ ticker }) {
  const { nivel } = usePreferencias();
  const simples = nivel !== 'tecnico';
  const fechamento = useHistoricoCampo(ticker, 'cotacao.fechamento');
  const pl = useHistoricoCampo(ticker, 'pl');
  const pvp = useHistoricoCampo(ticker, 'pvp');
  const dy = useHistoricoCampo(ticker, 'dividend_yield');
  const roe = useHistoricoCampo(ticker, 'roe');
  const historicos = useMemo(
    () => ({
      'cotacao.fechamento': fechamento.data ?? null,
      pl: pl.data ?? null,
      pvp: pvp.data ?? null,
      dividend_yield: dy.data ?? null,
      roe: roe.data ?? null,
    }),
    [fechamento.data, pl.data, pvp.data, dy.data, roe.data],
  );
  const datas = useMemo(() => datasDisponiveis(historicos), [historicos]);
  const [dataEscolhida, setDataEscolhida] = useState(null);
  const [campoEvolucao, setCampoEvolucao] = useState('cotacao.fechamento');
  const idBlocoComparacao = useId();
  const idBlocoEvolucao = useId();

  const campos = simples ? CAMPOS_HISTORICO.filter((c) => CAMPOS_SIMPLES.includes(c.campo)) : CAMPOS_HISTORICO;
  const consultaDoCampo = {
    'cotacao.fechamento': fechamento,
    pl,
    pvp,
    dividend_yield: dy,
    roe,
  };
  const consultas = simples ? [pl, pvp, dy] : [fechamento, pl, pvp, dy, roe];

  if (consultas.every((c) => c.isPending)) return <Linhas quantidade={4} />;
  if (consultas.every((c) => c.isError)) {
    return (
      <BlocoErro
        titulo={TEXTOS.ficha.historicoIndisponivel}
        mensagem={fechamento.error?.mensagemUsuario}
        onTentarNovamente={fechamento.refetch}
      />
    );
  }
  if (datas.length === 0) return <BlocoVazio titulo={TEXTOS.ficha.historicoVazio} />;

  const n = datas.length;
  const ultima = datas[n - 1];
  const dataSel = dataEscolhida ?? datas[0];
  const linhas = compararEm(historicos, n >= 2 ? dataSel : datas[0]);

  // Se o nível mudou e o campo escolhido saiu da lista, mostra o primeiro da lista.
  const campoAtual = campos.some((c) => c.campo === campoEvolucao) ? campoEvolucao : campos[0].campo;
  const def = campos.find((c) => c.campo === campoAtual);
  const h = historicos[campoAtual];
  const valoresValidos = h ? h.valores.filter(finito).length : 0;
  const fraseEvolucao = simples && h && valoresValidos >= 2 ? fraseDaEvolucao(h, def) : null;

  return (
    <div className="ficha-historico">
      {simples && <p className="ficha-nota">{TEXTOS.ficha.historicoDias(n, ticker)}</p>}

      <div className="ficha-hist-blocos">
        {!simples && (
          <section className="ficha-hist-bloco" aria-labelledby={idBlocoComparacao}>
            <h3 id={idBlocoComparacao}>{TEXTOS.ficha.comoEstava}</h3>
            {n >= 2 ? (
              <label className="ficha-campo">
                {TEXTOS.ficha.pregaoDe}
                <select value={dataSel} onChange={(e) => setDataEscolhida(e.target.value)}>
                  {datas.slice(0, -1).map((d) => (
                    <option key={d} value={d}>
                      {dataBR(d)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="ficha-nota">{TEXTOS.ficha.historicoSoUm(dataBR(datas[0]))}</p>
            )}

            <div className="ficha-rolagem" role="region" aria-label={TEXTOS.ficha.historico} tabIndex={0}>
              <table className="tabela">
                <caption>{TEXTOS.ficha.historico}</caption>
                <thead>
                  <tr>
                    <th scope="col">{TEXTOS.ficha.indicador}</th>
                    {n >= 2 && <th scope="col">{TEXTOS.ficha.emData(dataBR(dataSel))}</th>}
                    <th scope="col">{TEXTOS.ficha.maisRecente(dataBR(ultima))}</th>
                    {n >= 2 && <th scope="col">{TEXTOS.ficha.diferenca}</th>}
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.campo}>
                      <th scope="row">{l.rotulo}</th>
                      {n >= 2 && <td>{l.antes_texto}</td>}
                      <td>{l.agora_texto}</td>
                      {n >= 2 && <td>{l.diferenca_texto}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="ficha-hist-bloco" aria-labelledby={idBlocoEvolucao}>
          <h3 id={idBlocoEvolucao}>{TEXTOS.ficha.evolucao}</h3>
          <label className="ficha-campo">
            {TEXTOS.ficha.indicador}
            <select value={campoAtual} onChange={(e) => setCampoEvolucao(e.target.value)}>
              {campos.map((c) => (
                <option key={c.campo} value={c.campo}>
                  {c.rotulo}
                </option>
              ))}
            </select>
          </label>

          {!h ? (
            consultaDoCampo[campoAtual]?.isPending ? (
              <Linhas quantidade={2} />
            ) : (
              <p className="ficha-nota">{TEXTOS.ficha.historicoSemDados}</p>
            )
          ) : (
            <>
              {fraseEvolucao && <p className="ficha-leitura-frase">{fraseEvolucao}</p>}
              {valoresValidos >= 2 && (
                <GraficoInterativo
                  series={[{ id: campoAtual, rotulo: def.rotulo, valores: h.valores }]}
                  datas={h.datas}
                  formatar={def.formatar}
                  altura={140}
                  carregando={consultaDoCampo[campoAtual]?.isPending === true}
                />
              )}
              {valoresValidos === 1 && <p className="ficha-nota">{TEXTOS.ficha.historicoUmDia}</p>}
              {!simples && (
                <ol className="ficha-hist-lista">
                  {[...h.datas.keys()].reverse().map((i) => (
                    <li key={h.datas[i]}>
                      <span>{dataBR(h.datas[i])}</span>
                      <span>{exibirNumero(h.valores[i], def.formatar)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
