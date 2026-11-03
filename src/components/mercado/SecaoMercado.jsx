import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DestaquesDoPregao } from './DestaquesDoPregao.jsx';
import { PainelIndices } from './PainelIndices.jsx';
import { useAnaliseDoDia, useRecarregarAnalise } from '../../hooks/useAnalise.js';
import { useResumos } from '../../hooks/useDados.js';
import { comPeriodosIbovespa, frasesDoResumo, rentabilidadeIbovDos } from '../../lib/mercadoTela.js';
import { TEXTOS } from '../../lib/textos.js';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';

const ABAS = ['indices', 'destaques'];
const ABA_INICIAL = 'indices';
const TECLAS_PROXIMA = ['ArrowRight'];
const TECLAS_ANTERIOR = ['ArrowLeft'];

/**
 * Seção "O mercado": uma frase com o pregão e, abaixo, uma barra de abas com uma
 * visão por vez (índices e destaques; os setores têm página própria). A aba vai para a URL
 * em ?aba=. Só o painel ativo é montado. Carregamento e erro ficam dentro dele.
 */
export default function SecaoMercado({ nivelTitulo = 2 }) {
  const Titulo = `h${nivelTitulo}`;
  const { data, isPending, isError, error } = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();
  const resumos = useResumos();
  const [params, setParams] = useSearchParams();
  const botoes = useRef({});

  const abaDaUrl = params.get('aba');
  const aba = ABAS.includes(abaDaUrl) ? abaDaUrl : ABA_INICIAL;

  const pronto = !isError && !isPending;
  const resumoDoPregao = data ? frasesDoResumo(data.estatisticas, data.estado_mercado) : '';
  const indicadores = data ? comPeriodosIbovespa(data.indicadores, rentabilidadeIbovDos(resumos.data)) : [];

  const escolherAba = (chave) => {
    setParams({ aba: chave }, { replace: true, preventScrollReset: true });
    botoes.current[chave]?.focus();
  };

  const aoTeclaAba = (e, indice) => {
    const ultimo = ABAS.length - 1;
    let destino = null;
    if (TECLAS_PROXIMA.includes(e.key)) destino = indice === ultimo ? 0 : indice + 1;
    else if (TECLAS_ANTERIOR.includes(e.key)) destino = indice === 0 ? ultimo : indice - 1;
    else if (e.key === 'Home') destino = 0;
    else if (e.key === 'End') destino = ultimo;
    if (destino === null) return;
    e.preventDefault();
    escolherAba(ABAS[destino]);
  };

  const pendencia = isError ? (
    <BlocoErro mensagem={error?.mensagemUsuario} onTentarNovamente={recarregar} />
  ) : (
    <div role="status">
      <span className="sr-only">{TEXTOS.mercado.carregando}</span>
      <Linhas quantidade={6} />
    </div>
  );

  const painel = {
    indices: (
      <PainelIndices indicadores={pronto ? indicadores : null} pendencia={pendencia} />
    ),
    destaques: (
      <>
        <p className="mercado-ver-setores">
          <Link to="/setores">{TEXTOS.setores.verTodos}</Link>
        </p>
        <DestaquesDoPregao />
      </>
    ),
  }[aba];

  return (
    <section id="mercado" className="secao mercado" aria-labelledby="mercado-titulo">
      <div className="mercado-cabecalho">
        <Titulo id="mercado-titulo" className="mercado-titulo">
          {TEXTOS.mercado.titulo}
        </Titulo>
        <p className="mercado-intro">{TEXTOS.mercado.intro}</p>
      </div>

      {resumoDoPregao && <p className="mercado-resumo-dia">{resumoDoPregao}</p>}

      <div className="abas mercado-abas" role="tablist" aria-label={TEXTOS.mercado.abasRotulo}>
        {ABAS.map((chave, indice) => {
          const selecionada = chave === aba;
          return (
            <button
              key={chave}
              ref={(el) => {
                botoes.current[chave] = el;
              }}
              type="button"
              role="tab"
              id={'mercado-aba-' + chave}
              aria-controls="mercado-painel"
              aria-selected={selecionada}
              tabIndex={selecionada ? 0 : -1}
              className="aba"
              onClick={() => escolherAba(chave)}
              onKeyDown={(e) => aoTeclaAba(e, indice)}
            >
              {TEXTOS.mercado.abas[chave]}
            </button>
          );
        })}
      </div>

      <div id="mercado-painel" role="tabpanel" aria-labelledby={'mercado-aba-' + aba} className="mercado-painel">
        {/* Na página própria o h1 é o título da seção: o nome da aba vira h2 oculto para a hierarquia não pular */}
        {nivelTitulo === 1 && <h2 className="sr-only">{TEXTOS.mercado.abas[aba]}</h2>}
        <p className="mercado-aba-descricao">{TEXTOS.mercado.abasDescricao[aba]}</p>
        {painel}
      </div>
    </section>
  );
}
