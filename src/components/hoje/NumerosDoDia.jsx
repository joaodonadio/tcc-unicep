import { useDolarPtax, useSelic } from '../../hooks/useBancoCentral.js';
import { useSerie } from '../../hooks/useDados.js';
import { dataBR, mesAno } from '../../lib/datas.js';
import { brl, numero, pct, quantidadeCheia } from '../../lib/formato.js';
import { usePreferencias } from '../../context/contextos.js';
import { ROTULO_STATUS, TEXTOS, porNivel } from '../../lib/textos.js';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { Linhas } from '../ui/Estados.jsx';
import { Variacao } from './Variacao.jsx';

const INDISPONIVEL = ROTULO_STATUS.indisponivel;

/** Valor formatado, ou o texto de indisponível quando não há número. */
const texto = (valor, formatar) => (valor == null ? INDISPONIVEL : formatar(valor));

/** Um número da faixa: rótulo pequeno em cima, valor grande, nota menor embaixo. */
function Numero({ rotulo, valor, nota }) {
  return (
    <div className="hoje-numero">
      <span className="hoje-numero-rotulo">{rotulo}</span>
      <span className="hoje-numero-valor">{valor}</span>
      {nota && <span className="hoje-numero-nota">{nota}</span>}
    </div>
  );
}

const porcentoAnual = (v) => pct(v, { casas: 2, sinal: false });

/** Nota da variação. Com valor e sem variação, mostra o aviso em vez de sumir (ausência nunca vira 0). */
const notaVariacao = (valor, variacao) =>
  valor != null && variacao == null ? TEXTOS.hoje.variacaoAusente : <Variacao valor={variacao ?? null} />;

/** CDI acumulado na janela de 1 ano da série (índice de retorno), para quando o pacote do dia não traz o CDI 12 meses. */
function cdiDaSerie(serie) {
  const indice = serie?.valores?.indice_retorno_total ?? [];
  const finitos = indice.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (finitos.length < 200) return null;
  return finitos[finitos.length - 1] / finitos[0] - 1;
}

/**
 * Faixa "Os números do dia": Ibovespa, dólar, Selic, CDI, IPCA e amplitude do pregão.
 * Dólar e Selic vêm do Banco Central (com fallback do pacote); o resto de data.fatos_pregao.
 */
export function NumerosDoDia({ fatos, dataPregao, carregando = false }) {
  const { nivel } = usePreferencias();
  const selic = useSelic();
  const ptax = useDolarPtax();
  const serieCdi = useSerie('CDI', '1a');

  if (carregando) {
    return (
      <div className="hoje-numeros">
        <Linhas quantidade={3} />
      </div>
    );
  }

  const ibov = fatos?.ibov;
  const amplitude = fatos?.amplitude;
  const juros = fatos?.juros;
  const cdi12m = juros?.cdi_12m ?? cdiDaSerie(serieCdi.data);

  // Dólar: o pacote do pregão tem prioridade (mesmo dado do parágrafo do resumo); a PTAX só entra sem valor no pacote.
  const cotacao = ptax.data;
  const numeroOuNulo = (v) => (Number.isFinite(v) ? v : null);
  const dolarDoPacote = numeroOuNulo(fatos?.dolar?.valor);
  const usaPacote = dolarDoPacote != null;
  const dolarValor = usaPacote ? dolarDoPacote : (cotacao?.valor ?? null);
  const dolarVariacao = usaPacote
    ? (fatos?.dolar?.suspeito ? null : numeroOuNulo(fatos?.dolar?.variacao))
    : (cotacao?.variacao ?? null);

  const selicValor = selic.isPending ? TEXTOS.hoje.carregando : texto(selic.data?.valor, (v) => porcentoAnual(v));

  // Fonte: data do pacote do pregão e data do dado da Selic (Banco Central), sem nulos.
  const dataPacote = dataBR(dataPregao);
  const dataSelic = dataBR(selic.data?.data);
  const fonte = [
    dataPacote ? TEXTOS.hoje.fonte.pacote(usaPacote ? TEXTOS.hoje.fonte.itensPacoteComDolar : TEXTOS.hoje.fonte.itensPacote, dataPacote) : null,
    TEXTOS.hoje.fonte.bcb(usaPacote ? TEXTOS.hoje.fonte.itensBcb : TEXTOS.hoje.fonte.itensBcbComDolar, dataSelic),
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="hoje-numeros">
      <Numero
        rotulo={<BotaoTermo chave="ibovespa">{porNivel(TEXTOS.hoje.ibovespa, nivel)}</BotaoTermo>}
        valor={texto(ibov?.pontos, (v) => numero(v, { casas: 0 }))}
        nota={notaVariacao(ibov?.pontos, ibov?.variacao)}
      />
      <Numero
        rotulo={<BotaoTermo chave="dolar">{porNivel(TEXTOS.hoje.dolar, nivel)}</BotaoTermo>}
        valor={texto(dolarValor, (v) => brl(v))}
        nota={notaVariacao(dolarValor, dolarVariacao)}
      />
      <Numero rotulo={<BotaoTermo chave="selic">{porNivel(TEXTOS.hoje.selic, nivel)}</BotaoTermo>} valor={selicValor} nota={selic.data ? porNivel(TEXTOS.hoje.selicNota, nivel) : null} />
      <Numero
        rotulo={<BotaoTermo chave="cdi">{porNivel(TEXTOS.hoje.cdi, nivel)}</BotaoTermo>}
        valor={texto(cdi12m, porcentoAnual)}
        nota={cdi12m != null ? porNivel(TEXTOS.hoje.cdiNota, nivel) : null}
      />
      <Numero
        rotulo={<BotaoTermo chave="ipca">{porNivel(TEXTOS.hoje.ipca, nivel)}</BotaoTermo>}
        valor={texto(juros?.ipca_12m, porcentoAnual)}
        nota={juros?.ipca_12m != null ? porNivel(TEXTOS.hoje.ipcaNota, nivel)(mesAno(juros?.ipca_ate)) : null}
      />
      <Numero
        rotulo={porNivel(TEXTOS.hoje.amplitude, nivel)}
        valor={amplitude && amplitude.total > 0 ? TEXTOS.hoje.amplitudeValor(quantidadeCheia(amplitude.subiram), quantidadeCheia(amplitude.cairam)) : INDISPONIVEL}
        nota={amplitude && amplitude.total > 0 ? porNivel(TEXTOS.hoje.amplitudeNota, nivel)(quantidadeCheia(amplitude.total)) : null}
      />
      <p className="hoje-numeros-fonte">{fonte}</p>
    </div>
  );
}
