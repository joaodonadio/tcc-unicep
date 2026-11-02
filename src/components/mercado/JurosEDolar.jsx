import { Termo } from './Termo.jsx';
import { GraficoInterativo } from '../graficos/GraficoInterativo.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { useHistoricoBcb } from '../../hooks/useBancoCentral.js';
import { SERIE_DOLAR_PTAX, SERIE_SELIC } from '../../lib/bancoCentral.js';
import { dataBR } from '../../lib/datas.js';
import { brl, numero, pct } from '../../lib/formato.js';
import { pontoHaMeses, ultimoPonto } from '../../lib/mercadoTela.js';
import { TEXTOS } from '../../lib/textos.js';

const COR = 'var(--cor-serie-1)';

/** Só o número: "ao ano" já está na frase-resumo, e o rótulo curto cabe no eixo. */
const formatarSelic = (v) => `${numero(v)}%`;

/** Frases de resumo: o que o bloco mostra abaixo do gráfico, com o que houver de dado. */
const fraseSelic = (atual, anterior) =>
  TEXTOS.mercado.selicResumo(
    `${numero(atual.valor)}%`,
    anterior ? `${numero(anterior.valor)}%` : null,
  );

const fraseDolar = (atual, anterior) =>
  TEXTOS.mercado.dolarResumo(
    brl(atual.valor),
    anterior ? brl(anterior.valor) : null,
    anterior ? pct(atual.valor / anterior.valor - 1) : null,
  );

/** Um gráfico com seu próprio eixo: histórico de um ano, resumo e fonte. Falha fica dentro do bloco. */
function BlocoBcb({ titulo, descricao, termo, serie, formatar, frase }) {
  const consulta = useHistoricoBcb(serie);
  const historico = consulta.data;
  const atual = historico ? ultimoPonto(historico) : null;

  let corpo;
  if (consulta.isError) {
    corpo = (
      <BlocoErro mensagem={TEXTOS.mercado.bcbErro} onTentarNovamente={() => consulta.refetch()} />
    );
  } else if (consulta.isPending) {
    corpo = (
      <>
        <span className="sr-only">{TEXTOS.mercado.carregando}</span>
        <Linhas quantidade={3} />
      </>
    );
  } else if (!atual) {
    corpo = <p className="mercado-vazio">{TEXTOS.mercado.semSerie}</p>;
  } else {
    const { datas, valores } = historico;
    corpo = (
      <>
        <GraficoInterativo
          series={[{ id: serie, rotulo: titulo, cor: COR, valores }]}
          datas={datas}
          formatar={formatar}
          carregando={consulta.isPending}
        />
        <div className="chart-foot">
          <span>{dataBR(datas[0])}</span>
          <span>{dataBR(datas[datas.length - 1])}</span>
        </div>
        <p className="mercado-resumo">{frase(atual, pontoHaMeses(historico, 12))}</p>
        <p className="mercado-fonte">{TEXTOS.mercado.fonteBcb}</p>
      </>
    );
  }

  return (
    <div className="mercado-juros-bloco">
      <h4 className="mercado-subtitulo">
        <Termo chave={termo}>{titulo}</Termo>
      </h4>
      <p className="mercado-nota">{descricao}</p>
      {corpo}
    </div>
  );
}

/**
 * Bloco "Juros e dólar", logo abaixo do gráfico dos índices: a meta da Selic e
 * o dólar PTAX de um ano, em dois gráficos separados (cada um com o seu eixo).
 */
export function JurosEDolar() {
  return (
    <div className="mercado-juros">
      <h3 className="mercado-bloco-titulo">{TEXTOS.mercado.jurosTitulo}</h3>
      <p className="mercado-nota">{TEXTOS.mercado.jurosTexto}</p>

      <div className="mercado-juros-grade">
        <BlocoBcb
          titulo={TEXTOS.mercado.selicTitulo}
          descricao={TEXTOS.mercado.selicDescricao}
          termo="selic"
          serie={SERIE_SELIC}
          formatar={formatarSelic}
          frase={fraseSelic}
        />
        <BlocoBcb
          titulo={TEXTOS.mercado.dolarTitulo}
          descricao={TEXTOS.mercado.dolarDescricao}
          termo="ptax"
          serie={SERIE_DOLAR_PTAX}
          formatar={brl}
          frase={fraseDolar}
        />
      </div>
    </div>
  );
}
