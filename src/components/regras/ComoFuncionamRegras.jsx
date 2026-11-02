import { usePreferencias } from '../../context/contextos.js';
import { useAnaliseDoDia } from '../../hooks/useAnalise.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { ORDEM_TIPOS, REGRAS_POR_TIPO } from './tiposRegra.js';

const T = TEXTOS.regras;

/**
 * Como uma checagem funciona em dois passos e a lista de todas as regras, agrupada por tipo.
 * Com `ticker`, marca as que acenderam para essa ação; cada regra mostra o critério em texto.
 */
export default function ComoFuncionamRegras({ ticker = null }) {
  const { nivel } = usePreferencias();
  const { data } = useAnaliseDoDia();
  const sinais = ticker ? (data?.sugestoes?.find((s) => s.ticker === ticker)?.sinais ?? []) : null;
  const acesas = new Set((sinais ?? []).map((s) => s.id));
  const temMarca = sinais != null && Boolean(data);
  const acendeu = (id) => temMarca && acesas.has(id);

  return (
    <div className="regras-guia">
      <ol className="regras-passos">
        {T.passos.map((passo, i) => (
          <li key={passo.titulo} className="regras-passo">
            <span className="regras-passo__numero" aria-hidden="true">
              {i + 1}
            </span>
            <span className="regras-passo__texto">
              <span className="regras-passo__titulo">{passo.titulo}</span>
              {porNivel(passo.texto, nivel)}
            </span>
          </li>
        ))}
      </ol>

      <p className="regras-link">
        <BotaoTermo chave="regras_acenderam">{T.linkGlossario}</BotaoTermo>
      </p>

      {ORDEM_TIPOS.map((tipo) => {
        const regrasDoTipo = REGRAS_POR_TIPO.filter((regra) => regra.tipo === tipo).sort(
          (a, b) => Number(acendeu(b.id)) - Number(acendeu(a.id)),
        );
        return (
          <section key={tipo} className="regras-grupo" data-tipo={tipo}>
            <h4 className="regras-grupo__titulo">{T.tipos[tipo].nome}</h4>
            <p className="regras-grupo__texto">{T.tipos[tipo].texto}</p>
            <ul className="regras-grade">
              {regrasDoTipo.map((regra) => {
                const aceso = acendeu(regra.id);
                return (
                  <li key={regra.id} className="regras-item" data-acesa={String(aceso)}>
                    <span className="regras-led" data-acesa={String(aceso)} aria-hidden="true" />
                    <span className="regras-item__texto">
                      <span className="regras-item__nome">{regra.nome}</span>
                      <span className="regras-item__criterio">{regra.condicaoTexto}</span>
                    </span>
                    {aceso && <span className="regras-selo">{T.acendeuHoje}</span>}
                    {temMarca && !aceso && <span className="sr-only">{T.apagada}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
