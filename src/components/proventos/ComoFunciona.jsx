import { useRef } from 'react';
import { CalendarCheck, Hourglass, Route, Wallet } from 'lucide-react';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { useEmVista } from '../modelo/useEmVista.js';
import { TEXTOS } from '../../lib/textos.js';

/**
 * Como funciona: três passos ilustrados de quando a pessoa precisa ter a ação
 * até o dinheiro cair. Uma moedinha percorre os passos em loop lento (CSS, só
 * transform e opacity) enquanto a seção está à vista; com movimento reduzido ela
 * fica parada no primeiro passo.
 */

const T = TEXTOS.proventos;

export function ComoFunciona({ nivelTitulo = 3 }) {
  const T1 = `h${nivelTitulo}`;
  const T2 = `h${nivelTitulo + 1}`;
  const passosRef = useRef(null);
  const { animar } = useEmVista(passosRef, 0.3);
  return (
    <section className="proventos-bloco proventos-funciona" aria-labelledby="proventos-funciona-titulo">
      <T1 id="proventos-funciona-titulo" className="proventos-bloco-titulo proventos-com-icone">
        <Route size={22} aria-hidden="true" />
        <span>{T.comoFunciona}</span>
      </T1>
      <p className="proventos-como-ler">{T.comoLer.funciona}</p>

      <div className="proventos-passos" ref={passosRef} data-anima={animar}>
        <span className="proventos-trilha" aria-hidden="true">
          <span className="proventos-moeda">
            <span className="proventos-moeda-disco" />
          </span>
        </span>

        <ol className="proventos-passos-lista">
          <li className="proventos-passo" style={{ '--atraso': '0s' }}>
            <span className="proventos-passo-icone" aria-hidden="true">
              <CalendarCheck size={24} strokeWidth={1.75} />
            </span>
            <div className="proventos-passo-texto">
              <T2 className="proventos-passo-titulo">
                {T.passo1Titulo}
                <BotaoTermo chave="data_com">{T.passo1Termo}</BotaoTermo>
              </T2>
              <p>{T.passo1Texto}</p>
            </div>
          </li>

          <li className="proventos-passo" style={{ '--atraso': '0.15s' }}>
            <span className="proventos-passo-icone" aria-hidden="true">
              <Hourglass size={24} strokeWidth={1.75} />
            </span>
            <div className="proventos-passo-texto">
              <T2 className="proventos-passo-titulo">{T.passo2Titulo}</T2>
              <p>{T.passo2Texto}</p>
            </div>
          </li>

          <li className="proventos-passo" style={{ '--atraso': '0.3s' }}>
            <span className="proventos-passo-icone" aria-hidden="true">
              <Wallet size={24} strokeWidth={1.75} />
            </span>
            <div className="proventos-passo-texto">
              <T2 className="proventos-passo-titulo">{T.passo3Titulo}</T2>
              <p>
                {T.passo3Antes}
                <BotaoTermo chave="dividendo">{T.legendaAlertas.dividendo}</BotaoTermo>
                {T.passo3Meio}
                <BotaoTermo chave="jcp">{T.legendaAlertas.jcp}</BotaoTermo>
                {T.passo3Depois}
              </p>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}
