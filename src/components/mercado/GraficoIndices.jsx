import { useId, useMemo, useState } from 'react';
import { GraficoInterativo } from '../graficos/GraficoInterativo.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { useSerie } from '../../hooks/useDados.js';
import { usePreferencias } from '../../context/contextos.js';
import { dataBR } from '../../lib/datas.js';
import { pct } from '../../lib/formato.js';
import {
  COMPARACOES,
  PERIODOS,
  acumuladoNaJanela,
  alinharSeries,
  cemViraram,
  ultimoValor,
} from '../../lib/mercadoTela.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

/** Cores fixas: Ibovespa e CDI sempre; cada comparação tem a sua, marcada ou não. */
const COR = {
  ibov: 'var(--cor-serie-1)',
  cdi: 'var(--cor-serie-2)',
};
const COR_COMPARACAO = {
  IPCA: 'var(--cor-dado-3)',
  IDIV: 'var(--cor-dado-4)',
  SMLL: 'var(--cor-dado-6)',
  IFIX: 'var(--cor-dado-7)',
  IVVB11: 'var(--cor-dado-5)',
};

const VAZIO = { datas: [], valores: [] };

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
 * "Quanto rendeu cada índice": Ibovespa e CDI sempre, e as comparações que o leitor
 * marcar, todas ao mesmo tempo se quiser (só as marcadas são buscadas). Rentabilidade acumulada em % a partir do
 * primeiro dia da janela, com um cartão por série visível.
 */
export function GraficoIndices() {
  const { nivel } = usePreferencias();
  const idRotulo = useId();
  const idDica = useId();
  const [periodo, setPeriodo] = useState('6m');
  const [marcadas, setMarcadas] = useState(['IPCA']);
  const pontos = PERIODOS.find((p) => p.chave === periodo).pontos;

  const ibovQ = useSerie('IBOV', '1a');
  const cdiQ = useSerie('CDI', '1a');
  // uma consulta por índice da lista fixa (mesma ordem de hooks a cada render); só as marcadas buscam
  const porIndice = {
    IPCA: useSerie('IPCA', '1a', { enabled: marcadas.includes('IPCA') }),
    IDIV: useSerie('IDIV', '1a', { enabled: marcadas.includes('IDIV') }),
    SMLL: useSerie('SMLL', '1a', { enabled: marcadas.includes('SMLL') }),
    IFIX: useSerie('IFIX', '1a', { enabled: marcadas.includes('IFIX') }),
    IVVB11: useSerie('IVVB11', '1a', { enabled: marcadas.includes('IVVB11') }),
  };
  const consultasComp = marcadas.map((t) => porIndice[t]);

  const ibov = useMemo(() => acumuladoNaJanela(ibovQ.data, pontos), [ibovQ.data, pontos]);
  const cdi = useMemo(() => acumuladoNaJanela(cdiQ.data, pontos), [cdiQ.data, pontos]);
  // comparação que falhou sai do gráfico e vira nota abaixo dele; as outras seguem
  const comparacoesOk = marcadas.filter((t) => !porIndice[t].isError);
  const comparacoesFalha = marcadas.filter((t) => porIndice[t].isError);
  const rotulosFalha = comparacoesFalha.map((t) => TEXTOS.mercado.comparacao[t]).join(', ');
  const acumComp = comparacoesOk.map((t) => acumuladoNaJanela(porIndice[t].data, pontos));

  const itens = [
    { id: 'ibov', rotulo: TEXTOS.dia.ibovespa, cor: COR.ibov, acumulado: ibov },
    { id: 'cdi', rotulo: TEXTOS.mercado.cdi, cor: COR.cdi, acumulado: cdi },
    ...comparacoesOk.map((t, i) => ({
      id: 'comparacao-' + t,
      rotulo: TEXTOS.mercado.comparacao[t],
      cor: COR_COMPARACAO[t],
      tracejada: true,
      acumulado: acumComp[i],
    })),
  ];

  const valores = alinharSeries(itens.map((i) => i.acumulado ?? VAZIO));
  const datas = ibov?.datas ?? [];
  const rotuloPeriodo = TEXTOS.mercado.periodos[periodo];
  const leitura = porNivel(TEXTOS.mercado.leituraCem, nivel);
  const cartoes = itens.map((i) => ({ id: i.id, rotulo: i.rotulo, cor: i.cor, valor: ultimoValor(i.acumulado) }));
  cartoes.sort(ordenarPorValor);

  const falha = [ibovQ, cdiQ].find((q) => q.isError);
  const carregando = ibovQ.isPending || cdiQ.isPending || consultasComp.some((q) => q.isPending);

  const tentarNovamente = () => {
    ibovQ.refetch();
    cdiQ.refetch();
    consultasComp.forEach((q) => q.refetch());
  };

  const todas = marcadas.length === COMPARACOES.length;
  // mantém a ordem da lista para a legenda e as cores não pularem de lugar
  const alternar = (chave) =>
    setMarcadas((atuais) =>
      atuais.includes(chave) ? atuais.filter((x) => x !== chave) : COMPARACOES.filter((c) => c === chave || atuais.includes(c)),
    );
  const alternarTodas = () => setMarcadas(todas ? [] : [...COMPARACOES]);

  let corpo;
  if (falha) {
    corpo = <BlocoErro mensagem={falha.error?.mensagemUsuario} onTentarNovamente={tentarNovamente} />;
  } else if (carregando) {
    corpo = (
      <div role="status">
        <span className="sr-only">{TEXTOS.mercado.carregando}</span>
        <Linhas quantidade={4} />
      </div>
    );
  } else if (!ibov) {
    corpo = <p className="mercado-vazio">{TEXTOS.mercado.semSerie}</p>;
  } else {
    corpo = (
      <>
        <GraficoInterativo
          series={itens.map((i, k) => ({ id: i.id, rotulo: i.rotulo, cor: i.cor, tracejada: i.tracejada, valores: valores[k] }))}
          datas={datas}
          formatar={(v) => pct(v)}
          linhaZero
          carregando={carregando}
        />
        <div className="chart-foot">
          <span>{dataBR(datas[0])}</span>
          <span>{dataBR(datas[datas.length - 1])}</span>
        </div>
        {comparacoesFalha.length > 0 && <p className="mercado-nota">{TEXTOS.mercado.comparacaoIndisponivel(rotulosFalha)}</p>}
        <div className="mercado-resumo">
          <h4 className="mercado-resumo__titulo">{TEXTOS.mercado.resumoTitulo(rotuloPeriodo)}</h4>
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
          <h3 className="mercado-bloco-titulo">{TEXTOS.mercado.graficoTitulo}</h3>
          <p className="mercado-nota">{TEXTOS.mercado.graficoTexto}</p>
        </div>
        <div className="segmentado mercado-periodo" role="group" aria-label={TEXTOS.mercado.periodoGrupo}>
          {PERIODOS.map((p) => (
            <button
              key={p.chave}
              type="button"
              className="botao"
              aria-pressed={periodo === p.chave}
              onClick={() => setPeriodo(p.chave)}
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
            <li>
              <span className="mercado-chip mercado-chip--fixo">
                <span className="mercado-chip__bolinha" style={{ background: COR.ibov }} aria-hidden="true" />
                {TEXTOS.dia.ibovespa}
                <span className="mercado-chip__tag">{TEXTOS.mercado.fixo}</span>
              </span>
            </li>
            <li>
              <span className="mercado-chip mercado-chip--fixo">
                <span className="mercado-chip__bolinha" style={{ background: COR.cdi }} aria-hidden="true" />
                {TEXTOS.mercado.cdi}
                <span className="mercado-chip__tag">{TEXTOS.mercado.fixo}</span>
              </span>
            </li>
            {COMPARACOES.map((chave) => {
              const marcada = marcadas.includes(chave);
              const cor = COR_COMPARACAO[chave];
              return (
                <li key={chave}>
                  <button
                    type="button"
                    className="mercado-chip"
                    aria-pressed={marcada}
                    aria-describedby={idDica}
                    title={TEXTOS.mercado.comparacaoLonga[chave]}
                    onClick={() => alternar(chave)}
                  >
                    <span className="mercado-chip__bolinha" style={{ background: cor }} aria-hidden="true" />
                    {TEXTOS.mercado.comparacao[chave]}
                  </button>
                </li>
              );
            })}
            <li>
              <button type="button" className="mercado-chip mercado-chip--todas" onClick={alternarTodas}>
                {todas ? TEXTOS.mercado.desmarcarTodas : TEXTOS.mercado.marcarTodas}
              </button>
            </li>
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
