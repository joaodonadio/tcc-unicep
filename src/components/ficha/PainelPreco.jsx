import { useMemo, useState } from 'react';
import { GraficoInterativo } from '../graficos/GraficoInterativo.jsx';
import { BlocoErro, BlocoVazio, Linhas } from '../ui/Estados.jsx';
import { usePreferencias } from '../../context/contextos.js';
import { useSerie } from '../../hooks/useDados.js';
import { useIndicador } from '../../hooks/useIndicador.js';
import { trocarComTransicao } from '../../lib/movimento.js';
import { dataBR } from '../../lib/datas.js';
import { brl, numeroCompacto, pct } from '../../lib/formato.js';
import { montarTabelaRetornos, textoMovimento, variacaoDaSerie } from '../../lib/fichaIndicadores.js';
import { janelaComSalto, ultimoSalto } from '../../lib/crivel.js';
import { eventosNaJanela } from '../../lib/eventosMercado.js';
import { SeloRevisao } from '../ui/SeloRevisao.jsx';
import { SeloCalculo } from '../ui/SeloCalculo.jsx';
import {
  JANELAS,
  acumuladoAlinhado,
  cortarJanela,
  rentabilidadeComparada,
  serieInsuficiente,
} from '../../lib/series.js';
import { EXPLICACOES } from '../../lib/explicacoes.js';
import { TEXTOS } from '../../lib/textos.js';
import { exibir } from '../../lib/valor.js';

const PERIODOS = ['1S', '1M', '6M', '1A'];
const PONTOS = { '1S': JANELAS['1s'], '1M': JANELAS['1m'], '6M': JANELAS['6m'], '1A': JANELAS['1a'] };
const CHAVE_RESUMO = { '1M': 'm1', '6M': 'm6', '1A': 'a1' };
const CLASSE_VALOR = { up: 'valor valor--alta', down: 'valor valor--queda', flat: 'valor valor--estavel' };

/** Texto de "o que é" conforme o nível de leitura (técnico cai no simples se não houver). */
function explicacaoDe(chave, nivel) {
  const e = EXPLICACOES[chave];
  return nivel === 'tecnico' && e.tecnico ? e.tecnico : e.simples;
}

/** Rodapé do gráfico: primeira e última data do período. */
function RodapeDatas({ datas }) {
  return (
    <div className="chart-foot">
      <span>{dataBR(datas[0])}</span>
      <span>{dataBR(datas[datas.length - 1])}</span>
    </div>
  );
}

/** "O preço subiu 12% em 6 meses; o Ibovespa caiu 7% no mesmo período.", gerada dos dados; sem preço, null. */
function fraseDoPeriodo(fechamento, ibov, periodo) {
  const acao = textoMovimento(variacaoDaSerie(fechamento));
  if (!acao) return null;
  const indice = textoMovimento(ibov ? ibov[ibov.length - 1] : null);
  return indice
    ? TEXTOS.ficha.frases.precoIbov(periodo, acao, indice)
    : TEXTOS.ficha.frases.precoSo(periodo, acao);
}

/**
 * Pergunta "Como foi o preço?": fechamento do período, com a opção de
 * comparar com o Ibovespa. No nível técnico, a tabela de retornos.
 */
export function PainelPreco({ ticker, resumo }) {
  const { nivel } = usePreferencias();
  const simples = nivel !== 'tecnico';
  const [periodo, setPeriodo] = useState('6M');
  const [comparar, setComparar] = useState(false);
  // o fundo da opção escolhida desliza até a nova (useIndicador); a troca de período usa transição de vista
  const indicadorPeriodo = useIndicador(periodo);
  const n = PONTOS[periodo];
  const serie = useSerie(ticker, '1a');
  const ibov = useSerie('IBOV', '1a');
  const setor = useSerie(`SETOR_SEM:${ticker}`, '1a');

  // Mudança de escala do preço dentro da janela (grupamento sem ajuste nos dados): o gráfico
  // começa depois dela, só com preços na escala de hoje.
  const corteBruto = useMemo(() => (serie.data ? cortarJanela(serie.data, n) : null), [serie.data, n]);
  const inicioEscala = useMemo(
    () => (corteBruto ? ultimoSalto(corteBruto.valores.fechamento ?? []) : -1),
    [corteBruto],
  );
  const nUsado = inicioEscala > 0 ? corteBruto.datas.length - inicioEscala : n;
  const corte = useMemo(() => (serie.data ? cortarJanela(serie.data, nUsado) : null), [serie.data, nUsado]);
  const comp = useMemo(
    () => (serie.data ? rentabilidadeComparada(serie.data, ibov.data ?? null, nUsado) : null),
    [serie.data, ibov.data, nUsado],
  );
  // Setor sem a empresa: sem série ou sem dados na janela, a linha simplesmente não aparece.
  const setorComp = useMemo(() => {
    const alinhado = serie.data ? acumuladoAlinhado(serie.data, setor.data ?? null, nUsado) : null;
    return alinhado?.some((v) => v != null) ? alinhado : null;
  }, [serie.data, setor.data, nUsado]);
  // Janela com mudança de escala do preço: a variação do período não vale (vira "mudou de escala").
  const saltos = useMemo(() => {
    if (!serie.data) return {};
    const temSalto = (chave) => janelaComSalto(cortarJanela(serie.data, JANELAS[chave]).valores.fechamento ?? []);
    return { s1: temSalto('1s'), m1: temSalto('1m'), m6: temSalto('6m'), a1: temSalto('1a') };
  }, [serie.data]);
  const retornos = useMemo(() => montarTabelaRetornos(resumo, saltos), [resumo, saltos]);

  // 1 semana não vem pronta no resumo: sai do acumulado do setor na própria janela
  const setorDaSemana = setorComp?.filter(Number.isFinite).at(-1) ?? null;
  const campoSetor =
    periodo === '1S'
      ? { valor: setorDaSemana, status: setorDaSemana == null ? 'indisponivel' : 'ok' }
      : resumo?.rentabilidade?.setor?.[CHAVE_RESUMO[periodo]];
  const setorNoPeriodo = exibir(campoSetor, (v) => pct(v));

  let grafico;
  if (serie.isError) {
    grafico = (
      <BlocoErro
        titulo={TEXTOS.ficha.graficoIndisponivel}
        mensagem={serie.error?.mensagemUsuario}
        onTentarNovamente={serie.refetch}
      />
    );
  } else if (serie.isPending) {
    grafico = <Linhas quantidade={4} />;
  } else if (serie.data == null) {
    grafico = <BlocoVazio titulo={TEXTOS.ficha.semSerie} />;
  } else if (serieInsuficiente(serie.data, 'fechamento', n)) {
    grafico = <BlocoVazio titulo={TEXTOS.ficha.historicoCurto} />;
  } else {
    const { datas, valores } = corte;
    const comSalto = inicioEscala > 0;
    const curtoDemais = comSalto && datas.length < 2;
    const fraseDesempenho =
      simples && !comSalto ? fraseDoPeriodo(valores.fechamento, comp?.ibov, TEXTOS.ficha.periodos[periodo]) : null;
    const temVolume = (valores.volume ?? []).some((v) => Number.isFinite(v));
    grafico = (
      <>
        <section className="ficha-grafico" aria-labelledby="ficha-grafico-titulo">
          <h3 id="ficha-grafico-titulo" className="ficha-grafico-titulo">
            {comparar ? TEXTOS.ficha.rentabilidadeTitulo : TEXTOS.ficha.precoTitulo}
          </h3>
          {comSalto && <SeloRevisao />}
          {comSalto && !curtoDemais && <p className="ficha-grafico-texto">{TEXTOS.revisao.desde(dataBR(datas[0]))}</p>}
          {comSalto && <SeloCalculo conta="escala" curto />}
          {fraseDesempenho && <p className="ficha-leitura-frase">{fraseDesempenho}</p>}
          {simples && (
            <p className="ficha-grafico-texto">
              {comparar ? TEXTOS.ficha.rentabilidadeTexto : TEXTOS.ficha.precoTexto}
            </p>
          )}
          {comparar && !comp?.ibov && <p className="ficha-grafico-texto">{TEXTOS.ficha.semIbov}</p>}
          {curtoDemais ? (
            <BlocoVazio titulo={TEXTOS.revisao.periodo} />
          ) : comparar ? (
            <>
              <GraficoInterativo
                series={[
                  { id: 'acao', rotulo: ticker, valores: comp?.acao ?? [], cor: 'var(--cor-serie-1)' },
                  ...(comp?.ibov
                    ? [
                        {
                          id: 'ibov',
                          rotulo: TEXTOS.dia.ibovespa,
                          valores: comp.ibov,
                          tracejada: true,
                          cor: 'var(--cor-serie-2)',
                        },
                      ]
                    : []),
                  ...(setorComp
                    ? [
                        {
                          id: 'setor',
                          rotulo: setor.data?.nome || TEXTOS.ficha.setorSemEmpresa,
                          valores: setorComp,
                          cor: 'var(--cor-serie-3)',
                        },
                      ]
                    : []),
                ]}
                datas={datas}
                formatar={(v) => pct(v)}
                linhaZero
                eventos={eventosNaJanela(datas)}
                notaLegenda={TEXTOS.ficha.setorNoPeriodo(setorNoPeriodo.texto)}
                carregando={serie.isPending}
              />
              <SeloCalculo conta="comparacao" curto />
            </>
          ) : (
            <GraficoInterativo
              series={[{ id: 'fechamento', rotulo: ticker, valores: valores.fechamento ?? [] }]}
              datas={datas}
              eventos={eventosNaJanela(datas)}
              formatar={brl}
              carregando={serie.isPending}
            />
          )}
          {!curtoDemais && <RodapeDatas datas={datas} />}
        </section>

        {!comparar && temVolume && (
          <section className="ficha-volume" aria-labelledby="ficha-volume-titulo">
            <h3 id="ficha-volume-titulo" className="ficha-grafico-titulo">
              {TEXTOS.ficha.volumeTitulo}
            </h3>
            <GraficoInterativo
              series={[{ id: 'volume', rotulo: TEXTOS.ficha.volumeTitulo, valores: valores.volume, cor: 'var(--cor-serie-3)' }]}
              datas={datas}
              modo="barras"
              formatar={numeroCompacto}
              altura={120}
              carregando={serie.isPending}
            />
            <RodapeDatas datas={datas} />
            {simples && <p className="ficha-grafico-texto">{TEXTOS.ficha.volumeTexto}</p>}
          </section>
        )}
      </>
    );
  }

  return (
    <div className="ficha-preco-painel">
      {!simples && (
        <div className="ficha-rolagem" role="region" aria-label={TEXTOS.ficha.retornos} tabIndex={0}>
          <table className="ficha-tab">
            <caption className="sr-only">{TEXTOS.ficha.retornos}</caption>
            <thead>
              <tr>
                <th scope="col">{TEXTOS.ficha.serie}</th>
                {retornos.colunas.map((coluna) => (
                  <th key={coluna.chave} scope="col" className="ficha-tab-num">
                    {coluna.rotulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {retornos.linhas.map((linha) => (
                <tr key={linha.rotulo}>
                  <th scope="row">{linha.rotulo}</th>
                  {linha.celulas.map((celula, indice) => (
                    <td
                      key={retornos.colunas[indice].chave}
                      className="ficha-tab-num"
                      title={celula.motivo || undefined}
                      data-rotulo={retornos.colunas[indice].rotulo}
                    >
                      <span className={CLASSE_VALOR[celula.sinal]}>{celula.texto}</span>
                      {celula.emRevisao && <SeloRevisao compacto />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      <div className="ficha-controles">
        <div ref={indicadorPeriodo.trilhoRef} className="segmentado" role="group" aria-label={TEXTOS.ficha.periodo}>
          <span
            ref={indicadorPeriodo.indicadorRef}
            className="segmentado-marcador"
            aria-hidden="true"
            style={{ viewTransitionName: 'ficha-periodo-marcador' }}
          />
          {PERIODOS.map((opcao) => (
            <button
              key={opcao}
              type="button"
              className="botao"
              aria-pressed={periodo === opcao}
              data-indicador-alvo={periodo === opcao ? 'true' : undefined}
              onClick={() => trocarComTransicao(() => setPeriodo(opcao))}
            >
              {TEXTOS.ficha.periodos[opcao]}
            </button>
          ))}
        </div>
        <label className="ficha-comparar">
          <input type="checkbox" checked={comparar} onChange={(e) => setComparar(e.target.checked)} />{' '}
          {TEXTOS.ficha.comparar}
        </label>
      </div>

      {grafico}

      {simples && <p className="ficha-nota">{explicacaoDe('rentabilidade', nivel)}</p>}
    </div>
  );
}
