import { TEXTOS } from '../../lib/textos.js';

/** Menções honrosas: só os nomes, sem cargos nem instituições. */
export default function Mencoes() {
  const t = TEXTOS.modelo.mencoes;
  return (
    <section className="secao modelo-mencoes" aria-labelledby="modelo-mencoes-titulo">
      <h2 id="modelo-mencoes-titulo" className="modelo-titulo">
        {t.titulo}
      </h2>
      <p className="modelo-intro">{t.texto}</p>
      <ul className="mencoes">
        {t.nomes.map((nome) => (
          <li key={nome} className="mencoes__nome">
            {nome}
          </li>
        ))}
      </ul>
    </section>
  );
}
