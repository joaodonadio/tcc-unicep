import { ArrowDown, ArrowUp } from 'lucide-react';
import { CartaoSerie } from './CartaoSerie.jsx';
import { usePreferencias } from '../../context/contextos.js';
import { useMercado, useSerie } from '../../hooks/useDados.js';
import { dataBR, diaMes } from '../../lib/datas.js';
import { pct } from '../../lib/formato.js';
import { cdiAoAno, historicoSelic, selicDoPacote, sinalDoTexto, textoPontos } from '../../lib/mercadoTela.js';
import { porNivel, TEXTOS } from '../../lib/textos.js';

const taxa = (v) => pct(v, { casas: 2, sinal: false });
/** Mudanças que cabem na lista sob o gráfico: as mais recentes. */
const MAX_MUDANCAS = 6;

/**
 * Juros: o valor de hoje é a meta da Selic publicada em mercado_dia (selic_meta). O histórico vem da
 * série SELIC publicada; sem ela, é estimado dia a dia pela série do CDI. Desenhado em degraus, com as
 * mudanças do período embaixo. Sem a série, mostra só o valor de hoje e a explicação; sem nenhum dado, fica vazio.
 */
export function GraficoJuros() {
  const { nivel } = usePreferencias();
  const mercado = useMercado();
  const serieSelic = useSerie('SELIC', '1a');
  const cdi = useSerie('CDI', '1a');
  const selic = selicDoPacote(mercado.data);
  const cdiHoje = cdiAoAno(mercado.data);
  // enquanto a série da Selic carrega, não mostra a estimativa (evita trocar de gráfico na frente da pessoa)
  const historico = serieSelic.isPending ? null : historicoSelic(serieSelic.data, cdi.data);
  const t = TEXTOS.mercado.juros;

  if (!historico) {
    return (
      <JurosSemSerie selic={selic} cdi={cdiHoje} carregando={serieSelic.isPending || cdi.isPending || (mercado.isLoading && !cdiHoje)} />
    );
  }

  const { serie, origem } = historico;
  const publicada = origem === 'serie';
  const n = serie.valores.length;
  const textoVar = textoPontos(serie.valores[n - 1] - serie.valores[0]);
  const variacao = textoVar ? { texto: textoVar, sinal: sinalDoTexto(textoVar), legenda: TEXTOS.mercado.noPeriodo } : null;
  const mudancas = serie.mudancas.slice(-MAX_MUDANCAS);

  const extra = (
    <div className="juros-mudancas">
      <h3 className="juros-mudancas__titulo">{porNivel(t.mudancasTitulo, nivel)}</h3>
      {mudancas.length === 0 ? (
        <p className="mercado-nota">{t.semMudanca}</p>
      ) : (
        <ol className="juros-mudancas__lista">
          {mudancas.map((m) => {
            const sinal = m.para < m.de ? 'down' : 'up';
            const Icone = sinal === 'down' ? ArrowDown : ArrowUp;
            return (
              <li key={m.data} className="juros-mudanca" data-sinal={sinal}>
                <span className="sr-only">{t.mudancaSr[sinal](taxa(m.de))}</span>
                <span className="juros-mudanca__taxa">{taxa(m.para)}</span>
                <span className="juros-mudanca__data">
                  <Icone size={13} aria-hidden="true" focusable="false" />
                  <span className="sr-only">{t.mudancaDesdeSr}</span>
                  {diaMes(m.data)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );

  return (
    <CartaoSerie
      titulo={porNivel(publicada ? t.tituloSeriePublicada : t.tituloSerie, nivel)}
      apoio={porNivel(publicada ? t.apoioSeriePublicada : t.apoioSerie, nivel)}
      pavio="curioso"
      valorAtual={valorSelic(selic)}
      valorLegenda={legendaSelic(selic, nivel)}
      variacao={variacao}
      serie={serie}
      degraus
      faixaExata
      rotuloGrafico={(publicada ? t.graficoSeriePublicada : t.graficoSerie)(
        dataBR(serie.datas[0]),
        dataBR(serie.datas[n - 1]),
        taxa(serie.valores[n - 1]),
      )}
      vazio={t.vazio}
      extra={extra}
      nota={cdiHoje ? porNivel(t.notaCdi, nivel)(cdiHoje.texto, cdiHoje.data) : null}
      calculo={origem === 'cdi' ? 'selic' : undefined}
      cor="var(--cor-serie-4)"
      formatarValor={taxa}
    />
  );
}

/** Valor de hoje em texto: a meta publicada, ou o aviso de indisponível / sem dado. */
function valorSelic(selic) {
  const t = TEXTOS.mercado.juros;
  if (selic.status === 'ok') return taxa(selic.valor);
  return selic.status === 'indisponivel' ? t.selicIndisponivel : t.selicSemDado;
}

/** Legenda do valor de hoje, com a data da meta; sem meta publicada, nenhuma legenda. */
function legendaSelic(selic, nivel) {
  if (selic.status !== 'ok') return null;
  return porNivel(TEXTOS.mercado.juros.valorLegenda, nivel)(selic.data ? diaMes(selic.data) : null);
}

/** Sem a série do CDI: o valor de hoje (meta da Selic do pacote), o CDI do dia e a explicação. */
function JurosSemSerie({ selic, cdi, carregando }) {
  const { nivel } = usePreferencias();
  const t = TEXTOS.mercado.juros;
  const legenda = legendaSelic(selic, nivel);
  const destaque = (selic.status !== 'sem_dado' || cdi) && (
    <>
      <div className="mercado-serie__resumo">
        <span className="mercado-serie__valor">{valorSelic(selic)}</span>
        {legenda && <span className="mercado-serie__valor-legenda">{legenda}</span>}
      </div>
      <dl className="juros-fatos">
        {cdi && (
          <div className="juros-fatos__linha">
            <dt>{porNivel(t.cdiRotulo, nivel)}</dt>
            <dd>{porNivel(t.cdiTexto, nivel)(cdi.texto)}</dd>
          </div>
        )}
        {porNivel(t.fatos, nivel).map((fato) => (
          <div key={fato.rotulo} className="juros-fatos__linha">
            <dt>{fato.rotulo}</dt>
            <dd>{fato.texto}</dd>
          </div>
        ))}
      </dl>
    </>
  );

  return (
    <CartaoSerie
      titulo={porNivel(t.titulo, nivel)}
      apoio={porNivel(t.apoio, nivel)}
      pavio="curioso"
      estado={carregando ? 'carregando' : 'pronto'}
      serie={null}
      rotuloGrafico={porNivel(t.grafico, nivel)}
      vazio={t.vazio}
      destaque={destaque || null}
      cor="var(--cor-serie-4)"
    />
  );
}
