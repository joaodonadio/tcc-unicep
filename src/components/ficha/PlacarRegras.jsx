import { Info, ThumbsUp, TriangleAlert } from 'lucide-react';
import { REGRAS } from '../../lib/sugestoes.js';
import { TEXTOS } from '../../lib/textos.js';
import { ORDEM_TIPOS, REGRAS_POR_TIPO, tipoDe } from '../regras/tiposRegra.js';
import NumeroAnimado from '../ui/NumeroAnimado.jsx';

const T = TEXTOS.regras;
const ICONES = { forte: ThumbsUp, atencao: TriangleAlert, contexto: Info };

/**
 * Placar das regras de uma ação: quantas acenderam em cada tipo e uma fileira com
 * uma barra por regra (acesa na cor do tipo, apagada em cinza).
 */
export default function PlacarRegras({ sinais }) {
  const acesas = new Set(sinais.map((s) => s.id));
  const cartoes = ORDEM_TIPOS.map((tipo) => ({
    tipo,
    acesas: sinais.filter((s) => tipoDe(s) === tipo).length,
    total: REGRAS.filter((regra) => regra.tipo === tipo).length,
  }));

  return (
    <section className="placar-regras">
      <ul className="placar-cartoes">
        {cartoes.map(({ tipo, acesas: quantas, total }) => {
          const Icone = ICONES[tipo];
          return (
            <li key={tipo} className="placar-cartao" data-tipo={tipo}>
              <Icone className="placar-cartao__icone" size={22} aria-hidden="true" />
              <span className="placar-cartao__nome">{T.tipos[tipo].nome}</span>
              <NumeroAnimado className="placar-cartao__numero" valor={quantas} formatar={(n) => String(n)} />
              <span className="placar-cartao__de">{T.deTotal(total)}</span>
            </li>
          );
        })}
      </ul>
      <div className="placar-barra" aria-hidden="true">
        {REGRAS_POR_TIPO.map((regra) => (
          <span
            key={regra.id}
            className="placar-segmento"
            data-tipo={regra.tipo}
            data-acesa={String(acesas.has(regra.id))}
          />
        ))}
      </div>
      <p className="placar-legenda">{T.placarLegenda(sinais.length, REGRAS.length)}</p>
    </section>
  );
}
