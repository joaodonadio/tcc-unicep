import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GraficoDolar } from './GraficoDolar.jsx';
import { GraficoJuros } from './GraficoJuros.jsx';
import { PainelIndices } from './PainelIndices.jsx';
import { useAnaliseDoDia, useRecarregarAnalise } from '../../hooks/useAnalise.js';
import { useMercado, useResumos } from '../../hooks/useDados.js';
import { humorDaVariacao } from '../../lib/mascote.js';
import { comPeriodosIbovespa, frasesDoResumo, rentabilidadeIbovDos, taxaCdiDoDia } from '../../lib/mercadoTela.js';
import { TEXTOS } from '../../lib/textos.js';
import { valorOuNulo } from '../../lib/valor.js';
import Mascote from '../ui/Mascote.jsx';
import { BlocoErro } from '../ui/Estados.jsx';

/**
 * Seção "O mercado": uma frase com o pregão, os índices e, abaixo, o dólar e os juros
 * lado a lado. A página não tem mais abas: um ?aba= antigo sai da URL. Carregamento e erro
 * dos índices ficam no próprio painel.
 */
export default function SecaoMercado({ nivelTitulo = 2 }) {
  const Titulo = `h${nivelTitulo}`;
  const { data, isPending, isError, error } = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();
  const resumos = useResumos();
  const mercado = useMercado();
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    if (!params.has('aba')) return;
    const limpa = new URLSearchParams(params);
    limpa.delete('aba');
    setParams(limpa, { replace: true, preventScrollReset: true });
  }, [params, setParams]);

  const pronto = !isError && !isPending;
  const resumoDoPregao = data ? frasesDoResumo(data.estatisticas, data.estado_mercado) : '';
  const indicadores = data ? comPeriodosIbovespa(data.indicadores, rentabilidadeIbovDos(resumos.data)) : [];
  const pregao = resumos.data?.[0]?.data_referencia ?? null;

  const pendencia = isError ? (
    <BlocoErro mensagem={error?.mensagemUsuario} onTentarNovamente={recarregar} />
  ) : (
    <div className="mercado-indices" role="status" aria-live="polite">
      <span className="sr-only">{TEXTOS.mercado.carregando}</span>
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} className="esqueleto" style={{ height: '4.5rem' }} aria-hidden="true" />
      ))}
    </div>
  );

  return (
    <section id="mercado" className="secao mercado" aria-labelledby="mercado-titulo">
      <div className="mercado-cabecalho">
        <Titulo id="mercado-titulo" className="mercado-titulo">
          {TEXTOS.mercado.titulo}
        </Titulo>
        <p className="mercado-intro">{TEXTOS.mercado.intro}</p>
      </div>

      {resumoDoPregao && (
        <div className="mercado-resumo-linha">
          <Mascote humor={humorDaVariacao(valorOuNulo(mercado.data?.IBOV?.variacao_dia))} className="mercado-pavio" />
          <p className="mercado-resumo-dia">{resumoDoPregao}</p>
        </div>
      )}

      <PainelIndices
        indicadores={pronto ? indicadores : null}
        pendencia={pendencia}
        pregao={pregao}
        taxaDia={taxaCdiDoDia(mercado.data)}
      />

      <div className="mercado-par">
        <GraficoDolar />
        <GraficoJuros />
      </div>
    </section>
  );
}
