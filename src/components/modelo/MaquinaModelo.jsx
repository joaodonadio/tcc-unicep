import { useRef } from 'react';
import { useAcoes } from '../../hooks/useDados.js';
import { useEmVista } from './useEmVista.js';

/** Vagas do pódio do Top 5 (o próprio nome do recorte). */
const VAGAS = [0, 1, 2, 3, 4];

/** Fila de pontinhos que corre de um bloco ao próximo. */
function Trilha({ className = '' }) {
  return (
    <span className={`maq__trilha ${className}`.trim()}>
      <i />
      <i />
    </span>
  );
}

/** Medidor em meia-lua: o ponteiro oscila só para ilustrar, sem número. */
function Medidor() {
  return (
    <svg className="maq__medidor" viewBox="0 0 120 72" focusable="false">
      <path d="M 10 62 A 50 50 0 0 1 110 62" className="maq__arco" style={{ stroke: 'var(--cor-borda-forte)' }} />
      <path
        d="M 10 62 A 50 50 0 0 1 110 62"
        className="maq__arco maq__arco--tracos"
        style={{ stroke: 'var(--cor-texto-suave)' }}
      />
      <g className="maq__ponteiro">
        <line x1="60" y1="62" x2="60" y2="22" style={{ stroke: 'var(--cor-acento)' }} />
      </g>
      <circle cx="60" cy="62" r="5" style={{ fill: 'var(--cor-acento)' }} />
    </svg>
  );
}

/**
 * Pequena máquina animada: entradas soltam pontinhos para o modelo, o modelo gira, a chance oscila
 * e o Top 5 sobe de uma grade (uma bolinha por ação) para um pódio. Tudo decorativo; a explicação
 * em texto fica na lista do diagrama.
 */
export default function MaquinaModelo({ diagrama }) {
  const ref = useRef(null);
  const { animar } = useEmVista(ref, 0.3);
  const acoes = useAcoes().data;
  const quantidade = Array.isArray(acoes) && acoes.length > 0 ? acoes.length : null;
  const [entradas, modelo, chance, top5] = diagrama;

  return (
    <div className="maq" ref={ref} aria-hidden="true" data-anima={animar} data-brilho="lavanda">
      <div className="maq__no maq__no--entradas">
        <span className="maq__nome">{entradas.nome}</span>
        <ul className="maq__chips">
          {entradas.itens.map((item, k) => (
            <li key={item} className="maq__entrada" style={{ '--k': k }}>
              <span className="maq__chip">{item}</span>
              <Trilha />
            </li>
          ))}
        </ul>
      </div>

      <div className="maq__no maq__no--modelo">
        <div className="maq__nucleo">
          <span className="maq__brilho" />
          <span className="maq__anel maq__anel--1" />
          <span className="maq__anel maq__anel--2" />
          <span className="maq__anel maq__anel--3" />
          <span className="maq__miolo" />
        </div>
        <span className="maq__nome">{modelo.nome}</span>
        <span className="maq__item">{modelo.itens[0]}</span>
      </div>

      <Trilha className="maq__ponte" />

      <div className="maq__no maq__no--chance">
        <Medidor />
        <span className="maq__nome">{chance.nome}</span>
        <span className="maq__item">{chance.itens[0]}</span>
      </div>

      <Trilha className="maq__ponte" />

      <div className="maq__no maq__no--top5">
        <div className="maq__vagas">
          {VAGAS.map((j) => (
            <span key={j} className="maq__vaga" style={{ '--j': j }} />
          ))}
        </div>
        <div className="maq__campo" data-indefinido={quantidade === null}>
          {quantidade !== null && Array.from({ length: quantidade }, (_, k) => <i key={k} />)}
          {VAGAS.map((j) => (
            <span key={j} className="maq__sobe" style={{ '--j': j }} />
          ))}
        </div>
        <span className="maq__nome">{top5.nome}</span>
        <span className="maq__item">{top5.itens[0]}</span>
      </div>
    </div>
  );
}
