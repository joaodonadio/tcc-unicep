import { useId } from 'react';
import { MiniGrafico } from '../graficos/MiniGrafico.jsx';
import Mascote from '../ui/Mascote.jsx';
import { SeloCalculo } from '../ui/SeloCalculo.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { dataBR } from '../../lib/datas.js';
import { TEXTOS } from '../../lib/textos.js';
import { ariaDosEventos, eventosNaJanela, marcasDosEventos } from '../../lib/eventosMercado.js';

const ALTURA_GRAFICO = 200;
const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Cartão de uma série diária: título, valor de hoje em destaque, variação no período com sinal
 * e o gráfico interativo (data e valor no balão). Sem dois pontos com valor, uma frase no lugar
 * do gráfico; nunca 0.
 * `estado`: 'pronto' | 'carregando' | 'erro'. `serie`: {datas, valores} ou null.
 * `destaque`: conteúdo que entra no lugar da frase de vazio quando não há série.
 * `degraus` e `faixaExata` vão para o gráfico; `extra` entra logo abaixo das datas do gráfico.
 * `calculo` (chave de `TEXTOS.contas.itens`) põe o selo "Calculado no site" depois da nota, quando a série é feita aqui.
 */
export function CartaoSerie({
  titulo,
  apoio,
  pavio = null,
  selo = null,
  estado = 'pronto',
  erro,
  onTentarNovamente,
  valorAtual = null,
  valorLegenda = null,
  variacao = null,
  serie = null,
  rotuloGrafico,
  vazio,
  destaque = null,
  extra = null,
  degraus = false,
  faixaExata = false,
  nota = null,
  calculo = null,
  cor,
  formatarValor,
}) {
  const idTitulo = useId();
  const pontos = (serie?.valores ?? []).filter(finito).length;

  let corpo;
  if (estado === 'erro') {
    corpo = <BlocoErro mensagem={erro} onTentarNovamente={onTentarNovamente} nivel={3} />;
  } else if (estado === 'carregando') {
    corpo = (
      <div role="status">
        <span className="sr-only">{TEXTOS.mercado.carregando}</span>
        <Linhas quantidade={3} />
      </div>
    );
  } else if (pontos < 2) {
    // sem série, um conteúdo próprio (ex.: juros com o CDI ao ano) ou a frase de vazio
    corpo = destaque ?? <p className="mercado-vazio">{vazio}</p>;
  } else {
    const datas = serie.datas;
    const eventosJanela = eventosNaJanela(datas);
    corpo = (
      <>
        <div className="mercado-serie__resumo">
          {valorAtual != null && <span className="mercado-serie__valor">{valorAtual}</span>}
          {valorAtual != null && valorLegenda && <span className="mercado-serie__valor-legenda">{valorLegenda}</span>}
          {variacao && (
            <span className="mercado-serie__variacao" data-sinal={variacao.sinal}>
              {variacao.texto}
              <span className="mercado-serie__variacao-legenda"> {variacao.legenda}</span>
            </span>
          )}
        </div>
        <MiniGrafico
          tipo="area"
          interativo
          datas={datas}
          valores={serie.valores}
          cor={cor}
          altura={ALTURA_GRAFICO}
          marcas={marcasDosEventos(eventosJanela, datas)}
          rotulo={[rotuloGrafico, ariaDosEventos(eventosJanela, datas)].filter(Boolean).join(' ') || undefined}
          formatarValor={formatarValor}
          degraus={degraus}
          faixaExata={faixaExata}
        />
        <div className="chart-foot">
          <span>{dataBR(datas[0])}</span>
          <span>{dataBR(datas[datas.length - 1])}</span>
        </div>
        {extra}
      </>
    );
  }

  return (
    <section className="mercado-serie" data-brilho="aco" aria-labelledby={idTitulo}>
      <div className="mercado-serie__cabeca">
        <h2 id={idTitulo} className="mercado-bloco-titulo">
          {titulo}
        </h2>
        {selo && <span className="mercado-selo">{selo}</span>}
      </div>
      <div className="mercado-apoio">
        {pavio && <Mascote humor={pavio} className="mercado-pavio" />}
        <p className="mercado-nota">{apoio}</p>
      </div>
      {corpo}
      {nota && <p className="mercado-nota mercado-nota--rodape">{nota}</p>}
      {calculo && <SeloCalculo conta={calculo} />}
    </section>
  );
}
