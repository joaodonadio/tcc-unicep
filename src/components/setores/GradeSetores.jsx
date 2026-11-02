import { TEXTOS } from '../../lib/textos.js';
import { CartaoSetor } from './CartaoSetor.jsx';

/** Médias do setor nos 4 períodos: { d1, m1, m6, a1 }, null onde não há dado. */
function mediasDoSetor(porPeriodo, nome) {
  return Object.fromEntries(
    Object.entries(porPeriodo).map(([periodo, lista]) => [periodo, lista.find((x) => x.setor === nome)?.media ?? null]),
  );
}

/** Grade de cartões, um por setor, na ordem recebida (do que mais subiu ao que mais caiu). */
export function GradeSetores({ setores, tecnico, tomPorSetor = [], porPeriodo }) {
  const maximoAcoes = setores.reduce(
    (m, s) => s.acoes.reduce((n, a) => (a.variacao == null ? n : Math.max(n, Math.abs(a.variacao))), m),
    0,
  );
  const tomDe = new Map(tomPorSetor.map((t) => [t.setor, t]));

  return (
    <section className="setores-cartoes" aria-labelledby="setores-cartoes-titulo">
      <h2 id="setores-cartoes-titulo" className="setores-titulo">
        {TEXTOS.setores.cartoesTitulo}
      </h2>
      <p className="setores-como-ler">{TEXTOS.setores.cartoesTexto}</p>

      <ul className="setores-grade" aria-label={TEXTOS.setores.listaTitulo}>
        {setores.map((s) => (
          <li key={s.setor}>
            <CartaoSetor
              setor={s}
              maximoAcoes={maximoAcoes}
              tecnico={tecnico}
              tom={tomDe.get(s.setor)}
              mediasPorPeriodo={mediasDoSetor(porPeriodo, s.setor)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
