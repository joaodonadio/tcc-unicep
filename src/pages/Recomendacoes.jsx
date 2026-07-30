import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CardRecomendacao } from '../components/recomendacoes/CardRecomendacao.jsx';
import { ConsensoEspecialistas } from '../components/recomendacoes/ConsensoEspecialistas.jsx';
import { BlocoErro, BlocoVazio, CardSkeleton } from '../components/ui/Estados.jsx';
import { useAnaliseDoDia, useRecarregarAnalise } from '../hooks/useAnalise.js';

/**
 * TELA CENTRAL DE RECOMENDAÇÕES — RF-2.1 a RF-2.9.
 * Rota `/recomendacoes`. Aceita `state.expandir` na navegação: é assim que o
 * clique num nó do globo (RF-1.4) chega aqui com o card já aberto.
 */

const FILTROS = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'oportunidade', rotulo: '↗ Oportunidades' },
  { id: 'risco', rotulo: '⚠ Atenção' },
];

export default function Recomendacoes() {
  const { data, isPending, isError, error } = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();
  const location = useLocation();
  const [filtro, setFiltro] = useState('todas');
  const [expandido, setExpandido] = useState(null);

  const idParaExpandir = location.state?.expandir;
  useEffect(() => {
    if (!idParaExpandir) return;
    setFiltro('todas');
    setExpandido(idParaExpandir);
    // rola até o card recém-aberto depois que o layout assentar
    const timer = setTimeout(() => {
      document
        .querySelector(`[data-rec="${idParaExpandir}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => clearTimeout(timer);
  }, [idParaExpandir]);

  if (isError) {
    return (
      <main className="screen screen-mid">
        <BlocoErro
          mensagem={error?.mensagemUsuario ?? error?.message}
          onTentarNovamente={recarregar}
        />
      </main>
    );
  }

  const recomendacoes = data?.recomendacoes ?? [];
  const contagem = {
    todas: recomendacoes.length,
    oportunidade: recomendacoes.filter((r) => r.tipo === 'oportunidade').length,
    risco: recomendacoes.filter((r) => r.tipo === 'risco').length,
  };
  const filtradas =
    filtro === 'todas' ? recomendacoes : recomendacoes.filter((r) => r.tipo === filtro);

  return (
    <main className="screen screen-mid">
      <div className="fade-up-fast">
        <div className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          <span>CENTRAL DE RECOMENDAÇÕES</span>
        </div>
        <h2 className="h2">
          O que o sistema <span className="hl">identificou</span> hoje.
        </h2>
        <p className="lead">
          Cada recomendação explica o que foi identificado, por que importa e quais dados sustentam
          a análise — para você decidir com clareza, sem depender de jargão técnico.
        </p>
      </div>

      {/* RF-2.1 — filtros */}
      <div className="filters" role="group" aria-label="Filtrar recomendações">
        {FILTROS.map((opcao) => (
          <button
            key={opcao.id}
            type="button"
            className="filter-pill"
            aria-pressed={filtro === opcao.id}
            onClick={() => setFiltro(opcao.id)}
          >
            {opcao.rotulo} · {contagem[opcao.id]}
          </button>
        ))}
      </div>

      <div className="rec-list">
        {isPending && (
          <>
            <CardSkeleton altura="8rem" rotulo="Carregando recomendações…" />
            <CardSkeleton altura="8rem" rotulo="" />
            <CardSkeleton altura="8rem" rotulo="" />
          </>
        )}

        {!isPending && filtradas.length === 0 && (
          <BlocoVazio
            titulo="Nenhuma recomendação neste filtro"
            mensagem={
              filtro === 'risco'
                ? 'O sistema não identificou pontos de atenção hoje — o que também é uma informação.'
                : 'Nenhuma recomendação corresponde a este filtro no momento.'
            }
          />
        )}

        {filtradas.map((recomendacao) => (
          <div key={recomendacao.id} data-rec={recomendacao.id}>
            <CardRecomendacao
              recomendacao={recomendacao}
              expandido={expandido === recomendacao.id}
              aoAlternar={() =>
                setExpandido((atual) => (atual === recomendacao.id ? null : recomendacao.id))
              }
              perfil={data?.usuario?.perfil ?? 'moderado'}
              geradoEm={data?.gerado_em}
            />
          </div>
        ))}
      </div>

      {/* RF-2.9 */}
      {!isPending && <ConsensoEspecialistas recomendacoes={recomendacoes} />}

      {data?.descartados > 0 && (
        <p className="state-text" style={{ marginTop: '1.5rem' }}>
          {data.descartados} registro(s) chegaram fora do formato esperado e foram omitidos desta
          lista.
        </p>
      )}
    </main>
  );
}
