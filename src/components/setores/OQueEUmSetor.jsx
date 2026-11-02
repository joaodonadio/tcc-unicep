import { IconeSetor } from '../ui/IconeSetor.jsx';
import { nomeSetor } from '../../lib/analiseDoDia.js';
import { TEXTOS } from '../../lib/textos.js';

/** Frase didática sobre o que é um setor, com 4 ícones de exemplo que entram de leve, um depois do outro. */
export function OQueEUmSetor() {
  return (
    <section className="setores-explica">
      <p className="setores-explica-frase">{TEXTOS.setores.oQueE}</p>
      <ul className="setores-exemplos">
        {TEXTOS.setores.exemplosTopo.map((e, i) => (
          <li key={e.setor} className="setores-exemplo" style={{ '--i': i }}>
            <span className="setor-selo-grande">
              <IconeSetor setor={e.setor} tamanho={22} />
            </span>
            <span className="setores-exemplo-nome">
              <span className="setores-exemplo-setor">{nomeSetor(e.setor)}</span>
              <span className="setores-exemplo-dica">{e.rotulo}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
