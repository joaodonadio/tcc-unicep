import { useEffect, useMemo, useState } from 'react';
import { MousePointerClick } from 'lucide-react';
import { MapaPregao } from '../components/acoes/MapaPregao.jsx';
import { BlocoErro, Linhas } from '../components/ui/Estados.jsx';
import { usePreferencias } from '../context/contextos.js';
import { useAnaliseDoDia, useRecarregarAnalise } from '../hooks/useAnalise.js';
import { useResumos } from '../hooks/useDados.js';
import { useRolarParaAncora } from '../hooks/useRolarParaAncora.js';
import { filtrarAcoes, maisNegociadaPorSetor } from '../lib/listaAcoes.js';
import { porNivel, TEXTOS } from '../lib/textos.js';

/**
 * Página Ações: todas as ações do pregão por setor, com a mais negociada de cada setor circulada.
 */
export default function Acoes() {
  const { nivel } = usePreferencias();
  const analise = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();
  const resumos = useResumos();
  const [busca, setBusca] = useState('');
  // a âncora do setor só existe com o mapa montado: a rolagem espera os dados
  useRolarParaAncora(analise.data != null);

  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.acoes);
  }, []);

  const circuladas = useMemo(
    () => maisNegociadaPorSetor(analise.data?.acoes_pregao, resumos.data),
    [analise.data, resumos.data],
  );

  // a busca só reduz a lista mostrada; as circuladas seguem as do pregão inteiro
  const acoesFiltradas = useMemo(
    () => filtrarAcoes(analise.data?.acoes_pregao, { busca }),
    [analise.data, busca],
  );
  const buscando = busca.trim() !== '';

  const titulo = TEXTOS.setores.mapaTitulo;

  return (
    <div className="pagina acoes-pagina">
      <header className="pagina-topo">
        <h1 className="pagina-titulo">{TEXTOS.paginas.acoes}</h1>
        <p className="pagina-intro">{TEXTOS.acoes.intro}</p>
        <p className="pagina-dica">
          <MousePointerClick size={16} aria-hidden="true" focusable="false" />
          {porNivel(TEXTOS.acoes.dicaFicha, nivel)}
        </p>
      </header>

      <section className="secao acoes-mapa entra-lista" aria-label={titulo}>
        {analise.isError ? (
          <BlocoErro mensagem={analise.error?.mensagemUsuario} onTentarNovamente={recarregar} />
        ) : analise.isPending ? (
          <Linhas quantidade={4} />
        ) : (
          <>
            <div className="acoes-busca">
              <label className="acoes-busca-rotulo" htmlFor="acoes-busca-campo">
                {TEXTOS.acoes.buscaRotulo}
              </label>
              <input
                id="acoes-busca-campo"
                type="search"
                className="acoes-busca-campo"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder={TEXTOS.acoes.buscaPlaceholder}
                autoComplete="off"
              />
              <p className="acoes-busca-contagem" aria-live="polite">
                {buscando ? TEXTOS.acoes.buscaContagem(acoesFiltradas.length) : null}
              </p>
            </div>

            {buscando && acoesFiltradas.length === 0 ? (
              <p className="estado acoes-busca-vazia">{TEXTOS.acoes.buscaVazia}</p>
            ) : (
              <MapaPregao acoes={acoesFiltradas} titulo={titulo} circuladas={circuladas} />
            )}
          </>
        )}
      </section>
    </div>
  );
}
