import { Termo } from './Termo.jsx';
import Mascote from '../ui/Mascote.jsx';
import { SeloCalculo } from '../ui/SeloCalculo.jsx';
import { usePreferencias } from '../../context/contextos.js';
import { dataBR } from '../../lib/datas.js';
import { humorDaMaioriaDeSinais } from '../../lib/mascote.js';
import { agruparIndices, periodosComNumero, temCalculado, textosDoIndice, valorDoCard } from '../../lib/mercadoTela.js';
import { porNivel, TEXTOS } from '../../lib/textos.js';

/** Termo do glossário de cada índice, pelo rótulo que o pacote traz. */
const TERMO_DA_LINHA = {
  'Ibovespa (pontos)': 'ibovespa',
  'Dólar (R$)': 'dolar',
  'Petróleo Brent (US$)': 'brent',
  'CDI 12M': 'cdi',
  'IPCA 12M': 'ipca',
  IDIV: 'idiv',
  SMLL: 'smll',
  IFIX: 'ifix',
  IVVB11: 'ivvb11',
};

/** Asterisco do que veio do cálculo pela série: marca visível e a explicação para leitor de tela. */
function Calculado({ ativo }) {
  if (!ativo) return null;
  return (
    <>
      <sup className="mercado-asterisco" aria-hidden="true">
        {TEXTOS.mercado.asterisco}
      </sup>
      <span className="sr-only">{TEXTOS.mercado.calculadoSr}</span>
    </>
  );
}

/**
 * Uma placa de índice: nome e explicação de uma linha, o valor de hoje em destaque, a variação
 * do dia em pílula e, embaixo, só os períodos que têm número (1 mês, 6 meses, 1 ano).
 */
function CartaoIndice({ indicador, nivel, taxaDia = null }) {
  const textos = textosDoIndice(indicador.label);
  const valor = valorDoCard(indicador);
  const periodos = periodosComNumero(indicador);
  const semGrande = valor.grande == null;

  return (
    <li className="mercado-indice">
      <div className="mercado-indice__topo">
        <span className="mercado-indice__nome">
          <Termo chave={TERMO_DA_LINHA[indicador.label]}>{textos.nome}</Termo>
        </span>
        <span className="mercado-indice__explicacao">{porNivel(textos.explicacao, nivel)}</span>
      </div>

      <div className="mercado-indice__valor">
        <span
          className={semGrande ? 'mercado-indice__grande mercado-indice__grande--sem' : 'mercado-indice__grande'}
          data-sinal={valor.sinalGrande}
        >
          {valor.grande ?? TEXTOS.mercado.semDado}
        </span>
        {valor.legenda && <span className="mercado-indice__legenda">{valor.legenda}</span>}
        {valor.dia && (
          <span className="mercado-indice__dia">
            <span>{TEXTOS.mercado.noDia}</span>
            <span className="mercado-indice__pilula" data-sinal={valor.dia.sinal}>
              {valor.dia.texto}
            </span>
          </span>
        )}
        <Calculado ativo={valor.calculado} />
      </div>
      {taxaDia && <p className="mercado-indice__taxa">{porNivel(TEXTOS.mercado.taxaDia, nivel)(taxaDia.texto, taxaDia.data)}</p>}

      {periodos.length > 0 ? (
        <div className="mercado-indice__periodos">
          {periodos.map((p) => (
            <span key={p.rotulo} className="mercado-indice__periodo" data-sinal={p.sinal}>
              <span className="mercado-indice__periodo-rotulo">{p.rotulo}</span>
              <span className="mercado-indice__periodo-valor">
                {p.texto}
                <Calculado ativo={p.calculado} />
              </span>
            </span>
          ))}
        </div>
      ) : (
        <p className="mercado-indice__so">{TEXTOS.mercado.semSoDia}</p>
      )}
    </li>
  );
}

/** Um grupo: título com o Cotinha ao lado (quando há humor) e as placas dos índices dele. */
function GrupoIndices({ grupo, nivel, humor = null, taxaDia = null }) {
  return (
    <section className="mercado-grupo" aria-labelledby={'mercado-grupo-' + grupo.chave}>
      <div className="mercado-grupo__cabeca">
        <h3 id={'mercado-grupo-' + grupo.chave} className="mercado-grupo__titulo">
          {grupo.titulo}
        </h3>
        {humor && <Mascote humor={humor} className="mercado-pavio" />}
      </div>
      <ul className="mercado-indices entra-cartoes">
        {grupo.itens.map((indicador) => (
          <CartaoIndice
            key={indicador.label}
            indicador={indicador}
            nivel={nivel}
            taxaDia={indicador.label === 'CDI 12M' ? taxaDia : null}
          />
        ))}
      </ul>
    </section>
  );
}

/**
 * "Como foi cada índice": os índices em grupos. Bolsa ocupa a largura toda, com o Cotinha pela
 * maioria das variações do dia; Juros e inflação e Câmbio e petróleo ficam lado a lado.
 * Os grupos e as placas saem do que o pacote trouxe. `taxaDia` (CDI do dia) vai para a placa do CDI.
 */
export function IndicesPorGrupo({ indicadores = [], pregao = null, taxaDia = null }) {
  const { nivel } = usePreferencias();
  const grupos = agruparIndices(indicadores);
  const bolsa = grupos.find((g) => g.chave === 'bolsa');
  const pares = grupos.filter((g) => g.chave !== 'bolsa');
  // mesmo sinal que o cartão mostra: a variação do dia, ou o número grande quando não há dia
  const humorBolsa = humorDaMaioriaDeSinais(
    bolsa?.itens.map((i) => {
      const c = valorDoCard(i);
      return c.dia?.sinal ?? c.sinalGrande;
    }) ?? [],
  );

  return (
    <>
      {bolsa && <GrupoIndices grupo={bolsa} nivel={nivel} humor={humorBolsa} />}
      {pares.length > 0 && (
        <div className="mercado-grupos-par">
          {pares.map((grupo) => (
            <GrupoIndices key={grupo.chave} grupo={grupo} nivel={nivel} taxaDia={taxaDia} />
          ))}
        </div>
      )}
      {temCalculado(indicadores) && (
        <p className="mercado-nota mercado-nota--rodape">
          <span aria-hidden="true">{TEXTOS.mercado.asterisco} </span>
          {porNivel(TEXTOS.mercado.calculadoNota, nivel)}
        </p>
      )}
      {temCalculado(indicadores) && <SeloCalculo conta="periodosIndice" curto />}
      {pregao && <p className="mercado-nota mercado-nota--rodape">{TEXTOS.mercado.pregaoData(dataBR(pregao))}</p>}
    </>
  );
}
