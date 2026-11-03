import { useSerie } from '../../hooks/useDados.js';
import { useDetalhes } from '../../hooks/useDetalhes.js';
import { dataBR, mesAno } from '../../lib/datas.js';
import { brl, numero, pct, quantidadeCheia } from '../../lib/formato.js';
import { usePreferencias } from '../../context/contextos.js';
import { fechamentoAnterior } from '../../lib/hoje.js';
import { direcaoDe } from '../../lib/mapaPregao.js';
import { cortarJanela, JANELAS, mesSeguinte, variacoesMensais } from '../../lib/series.js';
import { ROTULO_STATUS, TEXTOS, porNivel } from '../../lib/textos.js';
import { MiniGrafico } from '../graficos/MiniGrafico.jsx';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { BotaoDetalhes, PainelDetalhes } from '../ui/Detalhes.jsx';
import { Linhas } from '../ui/Estados.jsx';
import { Variacao } from './Variacao.jsx';

const INDISPONIVEL = ROTULO_STATUS.indisponivel;
const formatarPontos = (v) => numero(v, { casas: 0 });
/** Fração em %, duas casas, sem "+": 0.0082 -> "0,82%"; negativo leva o sinal de menos. */
const porcento = (v) => pct(v, { casas: 2, sinal: false });
const CAMPO_INDICE = 'indice_retorno_total';

/** Valor formatado, ou o texto de indisponível quando não há número. */
const texto = (valor, formatar) => (valor == null ? INDISPONIVEL : formatar(valor));

/** Mancha pela direção do movimento: alta sálvia, queda rosa-terra; estável ou sem dado fica neutra. */
const BRILHO_DA_DIRECAO = { up: 'alta', down: 'queda' };

/** Cor da linha pela direção do dia (mesma lógica da mancha); sem direção, a cor da série principal. */
const COR_DA_DIRECAO = { up: 'var(--cor-alta)', down: 'var(--cor-queda)' };
const COR_NEUTRA = 'var(--cor-serie-1)';
/** Juros e inflação (mancha 'aco'): verde-água da paleta de dados. */
const COR_ACO = 'var(--cor-dado-6)';
/** Cor de cada grupo da matriz de pontos, na ordem subiram, estáveis, caíram. */
const CORES_AMPLITUDE = ['var(--cor-alta)', 'var(--cor-estavel)', 'var(--cor-queda)'];

/** Mancha da amplitude pelo saldo: mais ações subindo é alta, mais caindo é queda, empate fica neutro. */
function brilhoDoSaldo(subiram, cairam) {
  if (subiram > cairam) return 'alta';
  if (cairam > subiram) return 'queda';
  return undefined;
}

/** Frase do mini gráfico com o primeiro e o último valor finitos; com menos de 2, sem frase (o gráfico não aparece). */
function descreverSerie(lista, formatar, frase) {
  const finitos = lista.filter((v) => Number.isFinite(v));
  if (finitos.length < 2) return undefined;
  return frase(formatar(finitos[0]), formatar(finitos[finitos.length - 1]));
}

/** Frase das barras mensais: quantos meses e o valor do mais recente. Com menos de 2, sem frase (o gráfico não aparece). */
function descreverMeses(valores, frase) {
  const finitos = valores.filter((v) => Number.isFinite(v));
  if (finitos.length < 2) return undefined;
  return frase(finitos.length, porcento(finitos[finitos.length - 1]));
}

/**
 * Mínima e máxima da janela de 6 meses da série do Ibovespa e a posição do fechamento de hoje entre elas (0 a 1).
 * Sem série, sem pontos, sem atual ou com máxima igual à mínima: null (a régua não aparece).
 * O atual entra na faixa se estiver fora da série, para o marcador nunca sair do trilho.
 */
function faixaSeisMeses(serie, atual) {
  const fechamento = cortarJanela(serie, JANELAS['6m']).valores.fechamento ?? [];
  const finitos = fechamento.filter((v) => Number.isFinite(v));
  if (finitos.length === 0 || !Number.isFinite(atual)) return null;
  const min = Math.min(...finitos, atual);
  const max = Math.max(...finitos, atual);
  if (max === min) return null;
  return { min, max, posicao: Number(((atual - min) / (max - min)).toFixed(4)) };
}

/**
 * Régua da faixa de 6 meses do Ibovespa: trilho fino com a posição do fechamento de hoje,
 * mínima e máxima embaixo. A barra é decorativa; o texto sr-only dá a mesma informação.
 */
function FaixaSeisMeses({ min, max, posicao }) {
  const minimo = formatarPontos(min);
  const maximo = formatarPontos(max);
  return (
    <span className="hoje-faixa">
      <span className="hoje-faixa__titulo">{TEXTOS.hoje.faixaSeisMeses}</span>
      <span className="hoje-faixa__trilho" aria-hidden="true">
        <span className="hoje-faixa__marca" style={{ left: `calc(${posicao} * 100%)` }} />
      </span>
      <span className="hoje-faixa__rotulos" aria-hidden="true">
        <span className="num">{minimo}</span>
        <span className="num">{maximo}</span>
      </span>
      <span className="sr-only">{TEXTOS.hoje.faixaSeisMesesDescricao(minimo, maximo)}</span>
    </span>
  );
}

/** Legenda da matriz de pontos de altas e quedas: bolinha da cor e a contagem de cada grupo. */
function LegendaAmplitude({ subiram, cairam, estaveis }) {
  const itens = [
    { chave: 'subiram', tom: 'alta', n: subiram },
    { chave: 'estaveis', tom: 'estavel', n: estaveis },
    { chave: 'cairam', tom: 'queda', n: cairam },
  ].filter((p) => Number.isFinite(p.n));
  return (
    <ul className="hoje-legenda">
      {itens.map((p) => (
        <li key={p.chave} data-tom={p.tom}>
          {TEXTOS.hoje.legendaAmplitude[p.chave]} <span className="num">{quantidadeCheia(p.n)}</span>
        </li>
      ))}
    </ul>
  );
}

/** Uma linha de texto do painel de detalhes. */
const notaDetalhe = (chave, conteudo) => (
  <span key={chave} className="hoje-numero-nota">
    {conteudo}
  </span>
);

/**
 * Um indicador: cartão de vidro com título, número grande, variação do dia (se houver) e mini gráfico no pé.
 * O resto do texto (notas, faixa, legenda do gráfico) fica num painel que abre pelo botão redondo do canto.
 * Fechado, o painel segue no DOM com `inert`: sai da ordem de foco e da leitura de tela.
 * `nome` é o título em texto puro (para o botão); `detalhes` é uma lista de elementos com key.
 * Sem detalhes, o cartão fica sem botão. Valor sem algarismo (Indisponível, Carregando) sai em texto, não em mono.
 * `largo` estica o cartão na grade.
 */
function Numero({ nome, rotulo, valor, variacao, grafico, detalhes = [], brilho, largo = false }) {
  const { aberto, alternar, id } = useDetalhes();
  const palavra = !/\d/.test(valor);
  const temDetalhes = detalhes.length > 0;
  return (
    <div className={largo ? 'hoje-numero hoje-numero--largo' : 'hoje-numero'} data-brilho={brilho} data-aberto={aberto ? 'true' : undefined}>
      <div className="hoje-numero-topo">
        <span className="hoje-numero-rotulo">{rotulo}</span>
        {temDetalhes && <BotaoDetalhes nome={nome} aberto={aberto} controla={id} onClick={alternar} />}
      </div>
      <span className={palavra ? 'hoje-numero-valor hoje-numero-valor--palavra' : 'hoje-numero-valor'}>{valor}</span>
      {/* linha sempre presente (vazia sem variação): os cartões fechados da fileira ficam da mesma altura */}
      <span className="hoje-numero-nota hoje-numero-var">{variacao}</span>
      {grafico}
      {temDetalhes && (
        <PainelDetalhes id={id} aberto={aberto}>
          {detalhes}
        </PainelDetalhes>
      )}
    </div>
  );
}

/**
 * Dólar sem série: inclinação de dois pontos (pregão anterior → hoje) com rótulos curtos embaixo
 * (decorativos; a frase completa vai no gráfico). Sem o valor anterior, fica o espaço reservado do mini gráfico.
 */
function InclinacaoDolar({ antes, hoje, cor }) {
  const tem = antes != null && hoje != null;
  return (
    <div className="hoje-inclinacao">
      <MiniGrafico
        tipo="inclinacao"
        valores={tem ? [antes, hoje] : []}
        cor={cor}
        altura={56}
        rotulo={tem ? TEXTOS.hoje.mini.dolar(brl(antes), brl(hoje)) : undefined}
      />
      {tem && (
        <span className="hoje-inclinacao-rotulos" aria-hidden="true">
          <span>
            {TEXTOS.hoje.inclinacao.antes} <span className="num">{brl(antes)}</span>
          </span>
          <span>{TEXTOS.hoje.inclinacao.hoje}</span>
        </span>
      )}
    </div>
  );
}

/** CDI acumulado na janela de 1 ano da série (índice de retorno), para quando o pacote do dia não traz o CDI 12 meses. */
function cdiDaSerie(serie) {
  const indice = serie?.valores?.indice_retorno_total ?? [];
  const finitos = indice.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (finitos.length < 200) return null;
  return finitos[finitos.length - 1] / finitos[0] - 1;
}

/**
 * Faixa "Os números do dia": Ibovespa, dólar, CDI, IPCA e altas e quedas do pregão.
 * Valores de data.fatos_pregao (pacotes do pregão); mini gráficos das séries diárias (Ibovespa, CDI, IPCA).
 * O dólar usa a série USDBRL quando existe (fonte simulada); sem ela, a inclinação do pregão anterior a hoje.
 */
export function NumerosDoDia({ fatos, dataPregao, carregando = false }) {
  const { nivel } = usePreferencias();
  // mesmas séries e chaves do gráfico do Ibovespa e da página Mercado: o React Query devolve do cache
  const serieIbov = useSerie('IBOV', '1a');
  const serieCdi = useSerie('CDI', '1a');
  const serieIpca = useSerie('IPCA', '1a');
  const serieDolar = useSerie('USDBRL', '1a'); // só existe na fonte simulada; sem série, fica a inclinação

  if (carregando) {
    return (
      <div className="hoje-numeros">
        <Linhas quantidade={3} />
      </div>
    );
  }

  const ibov = fatos?.ibov;
  const faixa = faixaSeisMeses(serieIbov.data, ibov?.pontos);
  const amplitude = fatos?.amplitude;
  const temAmplitude = Boolean(amplitude && amplitude.total > 0);
  const juros = fatos?.juros;
  const cdi12m = juros?.cdi_12m ?? cdiDaSerie(serieCdi.data);

  // Dólar: valor do pacote do pregão; variação suspeita sai
  const numeroOuNulo = (v) => (Number.isFinite(v) ? v : null);
  const dolarValor = numeroOuNulo(fatos?.dolar?.valor);
  const dolarVariacao = fatos?.dolar?.suspeito ? null : numeroOuNulo(fatos?.dolar?.variacao);
  const dolarAntes = fechamentoAnterior(dolarValor, dolarVariacao);
  const fechamentoDolar = cortarJanela(serieDolar.data, JANELAS['6m']).valores.fechamento ?? [];
  const descDolar = descreverSerie(fechamentoDolar, (v) => brl(v), TEXTOS.hoje.mini.dolarSerie);
  const corDolar = COR_DA_DIRECAO[direcaoDe(dolarVariacao)] ?? COR_NEUTRA;

  // Mini gráficos: valores e frase de cada um (sem frase = dados insuficientes, o gráfico não aparece)
  const fechamento6m = cortarJanela(serieIbov.data, JANELAS['6m']).valores.fechamento ?? [];
  // CDI: só meses completos (o mês da última data pode estar em andamento)
  const cdiMensal = variacoesMensais(serieCdi.data, CAMPO_INDICE, { semUltimoMes: true }).valores;
  // IPCA: a série sobe em degrau no 1º dia útil do mês seguinte ao de referência; entram meses até o seguinte a ipca_ate
  const ateIpca = mesSeguinte(juros?.ipca_ate);
  const ipcaMensal = variacoesMensais(serieIpca.data, CAMPO_INDICE, ateIpca ? { ateMes: ateIpca } : { semUltimoMes: true }).valores;
  const descIbov = descreverSerie(fechamento6m, formatarPontos, TEXTOS.hoje.mini.ibovespa);
  const descCdi = descreverMeses(cdiMensal, TEXTOS.hoje.mini.cdi);
  const descIpca = descreverMeses(ipcaMensal, TEXTOS.hoje.mini.ipca);

  // Fonte: só os pacotes do pregão; o dólar entra na lista quando o pacote trouxe o valor
  const dataPacote = dataBR(dataPregao);
  const itensFonte = dolarValor != null ? TEXTOS.hoje.fonte.itensPacoteComDolar : TEXTOS.hoje.fonte.itensPacote;
  const fonte = dataPacote ? TEXTOS.hoje.fonte.pacote(itensFonte, dataPacote) : null;

  return (
    <div className="hoje-numeros">
      <Numero
        nome={porNivel(TEXTOS.hoje.ibovespa, nivel)}
        rotulo={<BotaoTermo chave="ibovespa">{porNivel(TEXTOS.hoje.ibovespa, nivel)}</BotaoTermo>}
        valor={texto(ibov?.pontos, formatarPontos)}
        variacao={<Variacao valor={ibov?.variacao ?? null} />}
        grafico={
          <MiniGrafico
            tipo="area"
            valores={fechamento6m}
            cor={COR_DA_DIRECAO[direcaoDe(ibov?.variacao)] ?? COR_NEUTRA}
            rotulo={descIbov}
          />
        }
        detalhes={[
          ibov?.pontos != null && ibov?.variacao == null && notaDetalhe('variacao', TEXTOS.hoje.variacaoAusente),
          faixa && <FaixaSeisMeses key="faixa" min={faixa.min} max={faixa.max} posicao={faixa.posicao} />,
          descIbov && notaDetalhe('grafico', TEXTOS.hoje.legendaGrafico.ibovespa),
        ].filter(Boolean)}
        brilho={BRILHO_DA_DIRECAO[direcaoDe(ibov?.variacao)]}
      />
      <Numero
        nome={porNivel(TEXTOS.hoje.dolar, nivel)}
        rotulo={<BotaoTermo chave="dolar">{porNivel(TEXTOS.hoje.dolar, nivel)}</BotaoTermo>}
        valor={texto(dolarValor, (v) => brl(v))}
        variacao={<Variacao valor={dolarVariacao} />}
        grafico={
          descDolar ? (
            <MiniGrafico tipo="area" valores={fechamentoDolar} cor={corDolar} rotulo={descDolar} />
          ) : (
            <InclinacaoDolar antes={dolarAntes} hoje={dolarValor} cor={corDolar} />
          )
        }
        detalhes={[
          dolarValor != null && notaDetalhe('pacote', TEXTOS.hoje.dolarPacote),
          dolarAntes != null && notaDetalhe('anterior', TEXTOS.hoje.dolarAnterior(brl(dolarAntes))),
          dolarValor != null && dolarVariacao == null && notaDetalhe('variacao', TEXTOS.hoje.variacaoAusente),
          dolarValor > 0 && notaDetalhe('conversao', TEXTOS.hoje.dolarConversao(numero(100 / dolarValor, { casas: 2 }))),
          descDolar ? notaDetalhe('grafico', TEXTOS.hoje.legendaGrafico.ibovespa) : notaDetalhe('historico', TEXTOS.hoje.dolarSemHistorico),
        ].filter(Boolean)}
        brilho={BRILHO_DA_DIRECAO[direcaoDe(dolarVariacao)] ?? 'aco'}
      />
      <Numero
        nome={porNivel(TEXTOS.hoje.cdi, nivel)}
        rotulo={<BotaoTermo chave="cdi">{porNivel(TEXTOS.hoje.cdi, nivel)}</BotaoTermo>}
        valor={texto(cdi12m, porcento)}
        grafico={<MiniGrafico tipo="barras" valores={cdiMensal} cor={COR_ACO} rotulo={descCdi} />}
        detalhes={[
          cdi12m != null && notaDetalhe('nota', porNivel(TEXTOS.hoje.cdiNota, nivel)),
          descCdi && notaDetalhe('grafico', TEXTOS.hoje.legendaGrafico.cdi),
        ].filter(Boolean)}
        brilho="aco"
      />
      <Numero
        nome={porNivel(TEXTOS.hoje.ipca, nivel)}
        rotulo={<BotaoTermo chave="ipca">{porNivel(TEXTOS.hoje.ipca, nivel)}</BotaoTermo>}
        valor={texto(juros?.ipca_12m, porcento)}
        grafico={<MiniGrafico tipo="barras" valores={ipcaMensal} cor={COR_ACO} rotulo={descIpca} />}
        detalhes={[
          juros?.ipca_12m != null && notaDetalhe('nota', porNivel(TEXTOS.hoje.ipcaNota, nivel)(mesAno(juros?.ipca_ate))),
          descIpca && notaDetalhe('grafico', TEXTOS.hoje.legendaGrafico.ipca),
        ].filter(Boolean)}
        brilho="aco"
      />
      <Numero
        largo
        nome={porNivel(TEXTOS.hoje.amplitude, nivel)}
        rotulo={porNivel(TEXTOS.hoje.amplitude, nivel)}
        valor={temAmplitude ? TEXTOS.hoje.amplitudeValor(quantidadeCheia(amplitude.subiram), quantidadeCheia(amplitude.cairam)) : INDISPONIVEL}
        grafico={
          <MiniGrafico
            tipo="pontos"
            valores={temAmplitude ? [amplitude.subiram, amplitude.estaveis ?? null, amplitude.cairam] : []}
            cores={CORES_AMPLITUDE}
            rotulo={
              temAmplitude
                ? TEXTOS.hoje.mini.amplitude(
                    quantidadeCheia(amplitude.subiram),
                    quantidadeCheia(amplitude.cairam),
                    Number.isFinite(amplitude.estaveis) ? quantidadeCheia(amplitude.estaveis) : null,
                  )
                : undefined
            }
          />
        }
        detalhes={
          temAmplitude
            ? [
                notaDetalhe('nota', porNivel(TEXTOS.hoje.amplitudeNota, nivel)(quantidadeCheia(amplitude.total))),
                <LegendaAmplitude key="legenda" subiram={amplitude.subiram} cairam={amplitude.cairam} estaveis={amplitude.estaveis} />,
              ]
            : []
        }
        brilho={temAmplitude ? brilhoDoSaldo(amplitude.subiram, amplitude.cairam) : undefined}
      />
      {fonte && <p className="hoje-numeros-fonte">{fonte}</p>}
    </div>
  );
}
