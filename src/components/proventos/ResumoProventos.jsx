import { Link } from 'react-router-dom';
import { Building2, CalendarCheck, Wallet } from 'lucide-react';
import Mascote from '../ui/Mascote.jsx';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { CalendarioProventos } from './CalendarioProventos.jsx';
import { diaMes, mesAno } from '../../lib/datas.js';
import { pct } from '../../lib/formato.js';
import { resumoProventos } from '../../lib/proventosTela.js';
import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Faixa de resumo da página Proventos: uma frase-guia com o mascote e quatro
 * fatos (próximo pagamento, total marcado, mês de pico, maior dividend yield).
 * Bloco sem dado não aparece. Abaixo, o calendário com pagamentos e datas-com.
 */

const R = TEXTOS.proventos.resumo;

/* Três passos curtos ligados por uma linha: da data-com até o dinheiro na conta */
function LinhaDoTempo() {
  const T = TEXTOS.proventos;
  return (
    <ol className="proventos-linha-tempo entra-cartoes">
      <li>
        <span className="proventos-tempo-icone" aria-hidden="true">
          <CalendarCheck size={20} strokeWidth={1.75} />
        </span>
        <span>
          {T.passo1Titulo}
          <BotaoTermo chave="data_com">{T.passo1Termo}</BotaoTermo>
        </span>
      </li>
      <li>
        <span className="proventos-tempo-icone" aria-hidden="true">
          <Building2 size={20} strokeWidth={1.75} />
        </span>
        <span>{T.passo2Titulo}</span>
      </li>
      <li>
        <span className="proventos-tempo-icone" aria-hidden="true">
          <Wallet size={20} strokeWidth={1.75} />
        </span>
        <span>{T.passo3Titulo}</span>
      </li>
    </ol>
  );
}

function Bloco({ rotulo, valor, apoio }) {
  return (
    <div className="proventos-resumo-item">
      <p className="proventos-resumo-rotulo">{rotulo}</p>
      <p className="proventos-resumo-valor">{valor}</p>
      {apoio && <div className="proventos-resumo-apoio">{apoio}</div>}
    </div>
  );
}

// quatro cartões em esqueleto enquanto a agenda carrega
function Esqueletos() {
  return (
    <>
      <p className="sr-only" role="status">
        {TEXTOS.dia.proventosCarregando}
      </p>
      <div className="proventos-resumo-grade entra-cartoes" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="proventos-resumo-item">
            <span className="esqueleto" style={{ height: '0.9rem', width: '50%' }} />
            <span className="esqueleto" style={{ height: '2rem' }} />
            <span className="esqueleto" style={{ height: '0.9rem' }} />
          </div>
        ))}
      </div>
    </>
  );
}

export function ResumoProventos({ futuros, aDefinir, eventos, hoje, ranking, carregando = false }) {
  const { nivel } = usePreferencias();
  const T = TEXTOS.proventos;
  const { proximo, marcados, mesPico, topo } = resumoProventos(futuros, aDefinir, hoje, ranking);

  const blocos = [];
  if (proximo) {
    blocos.push(
      <Bloco
        key="proximo"
        rotulo={porNivel(R.proximo, nivel)}
        valor={
          <Link to={`/acao/${proximo.ticker}?pergunta=proventos`} className="num proventos-resumo-link">
            {proximo.ticker}
          </Link>
        }
        apoio={
          <>
            <span>
              {proximo.valor ? (
                <>
                  <span className="num">{proximo.valor}</span> {TEXTOS.proventos.porAcao}
                </>
              ) : (
                R.proximoSemValor
              )}
            </span>
            <span>
              {R.proximoData} <span className="num">{diaMes(proximo.data)}</span>
              {proximo.dias !== null && <> · {T.prazo(proximo.dias)}</>}
            </span>
          </>
        }
      />,
    );
  }
  if (marcados) {
    blocos.push(
      <Bloco
        key="marcados"
        rotulo={porNivel(R.marcados, nivel)}
        valor={<span className="num">{marcados.total}</span>}
        apoio={marcados.aDefinir > 0 ? R.marcadosADefinir(marcados.aDefinir) : null}
      />,
    );
  }
  if (mesPico) {
    blocos.push(
      <Bloco
        key="pico"
        rotulo={porNivel(R.mesPico, nivel)}
        valor={<span className="num">{mesAno(mesPico.mes)}</span>}
        apoio={R.mesPicoApoio(mesPico.qtd)}
      />,
    );
  }
  if (topo) {
    blocos.push(
      <Bloco
        key="topo"
        rotulo={porNivel(R.topo, nivel)}
        valor={<span className="num">{pct(topo.dy, { casas: 1, sinal: false })}</span>}
        apoio={
          <>
            <Link to={`/acao/${topo.ticker}?pergunta=proventos`} className="num proventos-resumo-link">
              {topo.ticker}
            </Link>{' '}
            {R.topoApoio}
          </>
        }
      />,
    );
  }

  return (
    <section className="proventos-bloco proventos-resumo" aria-labelledby="proventos-resumo-guia">
      <div className="proventos-resumo-guia">
        <Mascote humor="contente" className="proventos-resumo-mascote" />
        <p id="proventos-resumo-guia">{porNivel(R.guia, nivel)}</p>
      </div>

      {carregando ? (
        <Esqueletos />
      ) : (
        blocos.length > 0 && <div className="proventos-resumo-grade entra-cartoes">{blocos}</div>
      )}

      <LinhaDoTempo />

      {!carregando && futuros !== undefined && (
        <div className="proventos-resumo-calendario">
          <CalendarioProventos eventos={eventos} hoje={hoje} />
        </div>
      )}
    </section>
  );
}
