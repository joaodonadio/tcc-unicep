import { Info } from 'lucide-react';
import { usePreferencias } from '../../context/contextos.js';
import { useAnaliseDoDia, useRecarregarAnalise } from '../../hooks/useAnalise.js';
import { REGRAS, SEM_CONTRA } from '../../lib/sugestoes.js';
import { AVISO_FIXO, TEXTOS, porNivel } from '../../lib/textos.js';
import ComoFuncionamRegras from '../regras/ComoFuncionamRegras.jsx';
import { tipoDe } from '../regras/tiposRegra.js';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import ComparacaoRegra from './ComparacaoRegra.jsx';
import PlacarRegras from './PlacarRegras.jsx';

/**
 * Pergunta "O que as regras dizem?": um placar com quantas checagens acenderam por tipo,
 * as que acenderam em grupos (a favor, pontos de atenção e contexto) e, recolhido, como
 * cada checagem funciona. Nada de decisão nem feedback aqui.
 */

const GRUPOS = [
  { tipo: 'forte', titulo: TEXTOS.ficha.aFavor },
  { tipo: 'atencao', titulo: TEXTOS.ficha.cuidado },
  { tipo: 'contexto', titulo: TEXTOS.ficha.contexto },
];

/** Limite sem o aviso fixo, em minúscula inicial e sem ponto final, para entrar numa frase só. */
function limpaLimite(texto) {
  const t = String(texto).replace(AVISO_FIXO, '').trim().replace(/\.$/, '');
  return /^\p{Lu}\p{Ll}/u.test(t) ? t[0].toLowerCase() + t.slice(1) : t;
}

/** Limites de todos os sinais, sem repetição. */
const limitesDe = (sinais) => [...new Set(sinais.flatMap((s) => s.limites ?? []).map(limpaLimite).filter(Boolean))];

/** Uma regra acesa: título, frase, números de comparação e, se houver, o que pesa contra. */
function Regra({ sinal, nivel }) {
  const texto = nivel === 'tecnico' && sinal.tecnico ? sinal.tecnico : sinal.simples;
  const dados = sinal.dados ?? [];
  const comSetor = dados.some((d) => d.comparado);
  // "Nada pesa contra" vem como item da lista; na tela, a ausência do bloco já diz isso
  const contra = (sinal.contra ?? []).filter((item) => item !== SEM_CONTRA);

  return (
    <article className="ficha-regra" data-tipo={tipoDe(sinal)}>
      <h4 className="ficha-regra-titulo">{sinal.titulo}</h4>
      <p className="ficha-regra-texto">{texto}</p>
      {dados.length > 0 && <ComparacaoRegra dados={dados} comSetor={comSetor} />}
      {contra.length > 0 && (
        <>
          <h5 className="ficha-subtitulo">{TEXTOS.ficha.contra}</h5>
          <ul className="ficha-lista">
            {contra.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}

/** Como funciona cada checagem, recolhido por padrão. */
function ExplicacaoRegras({ ticker }) {
  return (
    <details className="regras-detalhes">
      <summary>{TEXTOS.regras.resumoCheck(REGRAS.length)}</summary>
      <ComoFuncionamRegras ticker={ticker} />
    </details>
  );
}

export function PorQueApareceu({ ticker }) {
  const { nivel } = usePreferencias();
  const analise = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();

  if (analise.isError) {
    return (
      <BlocoErro
        titulo={TEXTOS.estados.erroTitulo}
        mensagem={analise.error?.mensagemUsuario}
        onTentarNovamente={recarregar}
      />
    );
  }
  if (analise.isPending) return <Linhas quantidade={3} />;

  const sugestao = analise.data?.sugestoes?.find((s) => s.ticker === ticker);
  const sinais = sugestao?.sinais ?? [];
  if (sinais.length === 0) {
    return (
      <div className="estado">
        <p>{porNivel(TEXTOS.ficha.semRegras, nivel)}</p>
        <ExplicacaoRegras ticker={ticker} />
      </div>
    );
  }

  const limites = limitesDe(sinais);

  return (
    <div className="ficha-regras">
      <PlacarRegras sinais={sinais} />
      {GRUPOS.map((grupo) => {
        const doGrupo = sinais.filter((s) => tipoDe(s) === grupo.tipo);
        if (doGrupo.length === 0) return null;
        return (
          <section key={grupo.tipo} className="ficha-grupo" data-tipo={grupo.tipo}>
            <h3 className="ficha-grupo-titulo">{grupo.titulo(doGrupo.length)}</h3>
            {doGrupo.map((sinal) => (
              <Regra key={sinal.id} sinal={sinal} nivel={nivel} />
            ))}
          </section>
        );
      })}
      {limites.length > 0 && (
        <p className="ficha-limites">
          <Info className="ficha-limites__icone" size={18} aria-hidden="true" />
          <span>{TEXTOS.ficha.limitesRegras(limites)}</span>
        </p>
      )}
      <ExplicacaoRegras ticker={ticker} />
    </div>
  );
}
