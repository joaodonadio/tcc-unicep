import { usePreferencias } from '../../context/contextos.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/**
 * Contas feitas no site com os dados da API: uma lista de cartões, um por conta, com âncora `conta-<chave>`.
 * O último cartão explica as datas do site (não é conta, por isso fica fora de `contas.itens`).
 */
export default function ContasDoSite({ nivelSecao = 2 }) {
  const { nivel } = usePreferencias();
  const Sub = `h${nivelSecao}`;
  const Cabeca = `h${nivelSecao + 1}`;
  const { contas } = TEXTOS;

  return (
    <section id="contas" className="dados__bloco" aria-labelledby="contas-titulo">
      <Sub id="contas-titulo" className="dados__subtitulo">
        {contas.titulo}
      </Sub>
      <p>{porNivel(contas.intro, nivel)}</p>
      <ul className="dados__origens contas-lista">
        {Object.entries(contas.itens).map(([chave, item]) => (
          <li className="dados__mini contas-item" id={`conta-${chave}`} key={chave}>
            <Cabeca className="dados__mini-titulo">{item.titulo}</Cabeca>
            <dl className="contas-dl">
              <dt>{contas.rotuloUsa}</dt>
              <dd>{item.usa}</dd>
              <dt>{contas.rotuloComo}</dt>
              <dd>{porNivel(item.como, nivel)}</dd>
              <dt>{contas.rotuloOnde}</dt>
              <dd>{item.onde}</dd>
            </dl>
          </li>
        ))}
        <li className="dados__mini contas-item" id="datas-do-site">
          <Cabeca className="dados__mini-titulo">{contas.datas.titulo}</Cabeca>
          <dl className="contas-dl">
            <dt>{contas.rotuloUsa}</dt>
            <dd>{contas.datas.usa}</dd>
            <dt>{contas.rotuloComo}</dt>
            <dd>{porNivel(contas.datas.como, nivel)}</dd>
            <dt>{contas.rotuloOnde}</dt>
            <dd>{contas.datas.onde}</dd>
          </dl>
        </li>
      </ul>
    </section>
  );
}
