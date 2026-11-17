import { useId, useState } from 'react';
import { GraficoInterativo } from '../graficos/GraficoInterativo.jsx';
import Mascote from '../ui/Mascote.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { useSerie } from '../../hooks/useDados.js';
import { useIndicador } from '../../hooks/useIndicador.js';
import { trocarComTransicao } from '../../lib/movimento.js';
import { usePreferencias } from '../../context/contextos.js';
import { pct } from '../../lib/formato.js';
import {
  COMPARACOES,
  PERIODOS,
  acumuladoNaJanela,
  alinharSeries,
  cemViraram,
  formatoDataDaJanela,
  ultimoValor,
} from '../../lib/mercadoTela.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import { eventosNaJanela } from '../../lib/eventosMercado.js';

/** Cores fixas: cada índice tem a sua, igual nos chips, na legenda e nas linhas. */
const COR = {
  IBOV: 'var(--cor-serie-1)',
  CDI: 'var(--cor-serie-2)',
  IPCA: 'var(--cor-dado-3)',
  IDIV: 'var(--cor-dado-4)',
  SMLL: 'var(--cor-dado-6)',
  IFIX: 'var(--cor-dado-7)',
  IVVB11: 'var(--cor-dado-5)',
};

/** Todos os índices do gráfico, na ordem da legenda. Ibovespa e CDI começam ligados. */
const INDICES = ['IBOV', 'CDI', ...COMPARACOES];
const LIGADOS_INICIO = ['IBOV', 'CDI'];

const ROTULO_FIXO = { IBOV: TEXTOS.dia.ibovespa, CDI: TEXTOS.mercado.cdi };
const rotuloDe = (chave) => ROTULO_FIXO[chave] ?? TEXTOS.mercado.comparacao[chave];

/** Maior rentabilidade primeiro; sem dado no fim. */
const ordenarPorValor = (a, b) => {
  if (a.valor == null && b.valor == null) return 0;
  if (a.valor == null) return 1;
  if (b.valor == null) return -1;
  return b.valor - a.valor;
};

/** Cartão de uma série: bolinha da cor do gráfico, nome, valor com o sinal e a leitura em reais. */
function CartaoRendimento({ item, leitura }) {
  const { rotulo, cor, valor } = item;
  const sinal = valor == null ? 'neutro' : valor > 0 ? 'alta' : valor < 0 ? 'queda' : 'neutro';
  const final = cemViraram(valor);
  return (
    <li className="mercado-rendimento" data-sinal={sinal}>
      <span className="mercado-rendimento__nome">
        <span className="mercado-chip__bolinha" style={{ background: cor }} aria-hidden="true" />
        {rotulo}
      </span>
      <span className="mercado-rendimento__valor">{valor == null ? TEXTOS.mercado.semDado : pct(valor)}</span>
      {final && <span className="mercado-rendimento__leitura">{leitura(final)}</span>}
    </li>
  );
}

/**
 * "Quanto rendeu cada índice": os índices são chips liga/desliga (Ibovespa e CDI começam ligados).
 * Só os ligados são buscados. Cada série é cortada da janela de 1 ano já baixada, em pregões, e
 * rebaseada a 0% no primeiro ponto da janela escolhida. Com nenhum ligado, um estado vazio.
 */
export function GraficoIndices() {
  const { nivel } = usePreferencias();
  const idRotulo = useId();
  const idDica = useId();
  const [periodo, setPeriodo] = useState('6m');
  const [ligados, setLigados] = useState(LIGADOS_INICIO);
  // o fundo da opção escolhida desliza até a nova (useIndicador); a troca de período usa transição de vista
  const indicadorPeriodo = useIndicador(periodo);
  const pontos = PERIODOS.find((p) => p.chave === periodo).pontos;

  // uma consulta por índice da lista fixa (mesma ordem de hooks a cada render); só os ligados buscam
  const consultas = {
    IBOV: useSerie('IBOV', '1a', { enabled: ligados.includes('IBOV') }),
    CDI: useSerie('CDI', '1a', { enabled: ligados.includes('CDI') }),
    IPCA: useSerie('IPCA', '1a', { enabled: ligados.includes('IPCA') }),
    IDIV: useSerie('IDIV', '1a', { enabled: ligados.includes('IDIV') }),
    SMLL: useSerie('SMLL', '1a', { enabled: ligados.includes('SMLL') }),
    IFIX: useSerie('IFIX', '1a', { enabled: ligados.includes('IFIX') }),
    IVVB11: useSerie('IVVB11', '1a', { enabled: ligados.includes('IVVB11') }),
  };

  const selecionados = INDICES.filter((c) => ligados.includes(c));
  const falhas = selecionados.filter((c) => consultas[c].isError);
  // Ibovespa e CDI com falha bloqueiam o gráfico; comparação com falha vira nota abaixo dele
  const falhaBase = falhas.find((c) => !COMPARACOES.includes(c));
  const comparacoesFalha = falhas.filter((c) => COMPARACOES.includes(c));
  const carregando = selecionados.some((c) => consultas[c].isPending);

  const itens = selecionados
    .filter((c) => !consultas[c].isError)
    .map((c) => ({
      id: c,
      rotulo: rotuloDe(c),
      cor: COR[c],
      tracejada: COMPARACOES.includes(c),
      acumulado: acumuladoNaJanela(consultas[c].data, pontos),
    }));
  // quem não tem janela suficiente sai do gráfico, mas segue no cartão como "sem dado"
  const comDado = itens.filter((i) => i.acumulado);
  const valores = alinharSeries(comDado.map((i) => i.acumulado));
  const datas = comDado[0]?.acumulado.datas ?? [];
  const eventosJanela = eventosNaJanela(datas);
  const formatarData = formatoDataDaJanela(periodo);
  const rotuloPeriodo = TEXTOS.mercado.periodos[periodo];
  const leitura = porNivel(TEXTOS.mercado.leituraCem, nivel);
  const cartoes = itens
    .map((i) => ({ id: i.id, rotulo: i.rotulo, cor: i.cor, valor: ultimoValor(i.acumulado) }))
    .sort(ordenarPorValor);

  const tentarNovamente = () => selecionados.forEach((c) => consultas[c].refetch());

  // mantém a ordem da lista para a legenda e as cores não pularem de lugar
  const alternar = (chave) =>
    setLigados((atuais) =>
      atuais.includes(chave) ? atuais.filter((x) => x !== chave) : INDICES.filter((c) => c === chave || atuais.includes(c)),
    );

  let corpo;
  if (selecionados.length === 0) {
    corpo = (
      <div className="mercado-vazio-grafico">
        <Mascote humor="curioso" className="mercado-pavio" />
        <p className="mercado-vazio">{TEXTOS.mercado.semSelecao}</p>
      </div>
    );
  } else if (falhaBase) {
    corpo = <BlocoErro mensagem={consultas[falhaBase].error?.mensagemUsuario} onTentarNovamente={tentarNovamente} />;
  } else if (carregando) {
    corpo = (
      <div role="status">
        <span className="sr-only">{TEXTOS.mercado.carregando}</span>
        <Linhas quantidade={4} />
      </div>
    );
  } else if (comDado.length === 0) {
    corpo = <p className="mercado-vazio">{TEXTOS.mercado.semSerie}</p>;
  } else {
    corpo = (
      <>
        <GraficoInterativo
          series={comDado.map((i, k) => ({ id: i.id, rotulo: i.rotulo, cor: i.cor, tracejada: i.tracejada, valores: valores[k] }))}
          datas={datas}
          formatar={(v) => pct(v)}
          linhaZero
          trocaSuave
          carregando={carregando}
          eventos={eventosJanela}
        />
        <div className="chart-foot">
          <span>{formatarData(datas[0])}</span>
          <span>{formatarData(datas[datas.length - 1])}</span>
        </div>
        {eventosJanela.map((e) => (
          <p key={e.chave} className="mercado-nota">
            {porNivel(TEXTOS.eventos[e.chave].nota, nivel)}
          </p>
        ))}
        {comparacoesFalha.length > 0 && (
          <p className="mercado-nota">
            {TEXTOS.mercado.comparacaoIndisponivel(comparacoesFalha.map(rotuloDe).join(', '))}
          </p>
        )}
        <div className="mercado-resumo">
          <h3 className="mercado-resumo__titulo">{TEXTOS.mercado.resumoTitulo(rotuloPeriodo)}</h3>
          <ul className="mercado-resumo-cards" aria-label={TEXTOS.mercado.resumoLista(rotuloPeriodo)}>
            {cartoes.map((c) => (
              <CartaoRendimento key={c.id} item={c} leitura={leitura} />
            ))}
          </ul>
        </div>
      </>
    );
  }

  return (
    <div className="mercado-grafico" data-brilho="dado">
      <div className="mercado-grafico__cabecalho">
        <div>
          <h2 className="mercado-bloco-titulo">{TEXTOS.mercado.graficoTitulo}</h2>
          <p className="mercado-nota">{TEXTOS.mercado.graficoTexto}</p>
        </div>
        <div
          ref={indicadorPeriodo.trilhoRef}
          className="segmentado mercado-periodo"
          role="group"
          aria-label={TEXTOS.mercado.periodoGrupo}
        >
          <span
            ref={indicadorPeriodo.indicadorRef}
            className="segmentado-marcador"
            aria-hidden="true"
            style={{ viewTransitionName: 'mercado-periodo-marcador' }}
          />
          {PERIODOS.map((p) => (
            <button
              key={p.chave}
              type="button"
              className="botao"
              aria-pressed={periodo === p.chave}
              data-indicador-alvo={periodo === p.chave ? 'true' : undefined}
              onClick={() => trocarComTransicao(() => setPeriodo(p.chave))}
            >
              {TEXTOS.mercado.periodos[p.chave]}
            </button>
          ))}
        </div>
      </div>

      <div className="mercado-series">
        <span id={idRotulo} className="mercado-rotulo-grupo">
          {TEXTOS.mercado.comparacaoGrupo}
        </span>
        <div role="group" aria-labelledby={idRotulo}>
          <ul className="mercado-chips">
            {INDICES.map((chave) => (
              <li key={chave}>
                <button
                  type="button"
                  className="mercado-chip"
                  style={{ '--chip-cor': COR[chave] }}
                  aria-pressed={ligados.includes(chave)}
                  aria-describedby={idDica}
                  title={TEXTOS.mercado.comparacaoLonga[chave]}
                  onClick={() => alternar(chave)}
                >
                  <span className="mercado-chip__bolinha" style={{ background: COR[chave] }} aria-hidden="true" />
                  {rotuloDe(chave)}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p id={idDica} className="mercado-nota mercado-series__dica">
          {TEXTOS.mercado.limiteSeries}
        </p>
      </div>

      {corpo}
    </div>
  );
}
