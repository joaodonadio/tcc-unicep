import { Termo } from './Termo.jsx';
import { PERIODOS, celulaHoje, celulaPeriodo, temCalculado } from '../../lib/mercadoTela.js';
import { TEXTOS } from '../../lib/textos.js';

/** Termo do glossário de cada linha, pelo rótulo que o pacote traz. */
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
const ROTULO_BRENT = 'Petróleo Brent (US$)';

/** "Ibovespa (pontos)" -> nome "Ibovespa" e unidade "pontos". Sem parênteses, a unidade fica nula. */
function separarUnidade(rotulo) {
  const m = /^(.*?)\s*\((.*)\)$/.exec(rotulo ?? '');
  return m ? { nome: m[1], unidade: m[2] } : { nome: rotulo, unidade: null };
}

/** "4,58% até set/2026" -> valor "4,58%" e legenda "até set/2026". Sem " até ", o texto inteiro é o valor. */
function separarAte(texto) {
  const m = /^(.*?)\s+(até\s.+)$/.exec(texto ?? '');
  return m ? { valor: m[1], legenda: m[2] } : { valor: texto, legenda: null };
}

/** Ausência: pílula neutra apagada com o texto de indisponível. Nunca vira 0 nem cola traço no número. */
function Ausente() {
  return (
    <span className="mercado-celula" data-estado="ausente">
      {TEXTOS.mercado.indisponivel}
    </span>
  );
}

/** Marca do que veio do cálculo pela série: asterisco sobrescrito e a explicação só para leitor de tela. */
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

/** Número em pílula tingida pelo sinal (alta, queda ou estável). */
function Pilula({ texto, sinal, calculado = false }) {
  return (
    <span className="mercado-celula" data-sinal={sinal ?? 'flat'}>
      {texto}
      <Calculado ativo={calculado} />
    </span>
  );
}

/** Célula de período (1 mês, 6 meses, 1 ano). */
function CelulaPeriodo({ texto, sinal, calculado }) {
  if (texto == null || texto === '') return <Ausente />;
  return <Pilula texto={texto} sinal={sinal} calculado={calculado} />;
}

/**
 * Célula Hoje: com variação do dia, o valor atual fica grande e a variação em pílula abaixo.
 * Sem variação, o valor grande vem com a legenda (IPCA: "até set/2026").
 */
function CelulaHoje({ indicador }) {
  const hoje = celulaHoje(indicador);
  const calculado = Boolean(indicador.calculado?.hoje);
  if (hoje.nivel != null) {
    return (
      <>
        <span className="mercado-hoje__valor">{hoje.nivel}</span>
        <Pilula texto={hoje.texto} sinal={hoje.sinal} calculado={calculado} />
      </>
    );
  }
  if (hoje.texto == null || hoje.texto === '' || hoje.texto === TEXTOS.mercado.traco) return <Ausente />;
  const { valor, legenda } = separarAte(hoje.texto);
  return (
    <>
      <span className="mercado-hoje__valor">
        {valor}
        <Calculado ativo={calculado} />
      </span>
      {legenda && <span className="mercado-hoje__legenda">{legenda}</span>}
    </>
  );
}

/**
 * Tabela "Como foi cada índice": uma linha por indicador de data.indicadores,
 * colunas Hoje, 1 mês, 6 meses e 1 ano. Em telas estreitas (CSS) vira uma lista de cartões.
 */
export function TabelaIndices({ indicadores = [] }) {
  const semBrent = indicadores.some(
    (i) => i.label === ROTULO_BRENT && !i.periodos?.some((p) => /[0-9]/.test(p.valor_texto ?? '')),
  );
  return (
    <>
      <div className="mercado-rolagem" role="region" aria-label={TEXTOS.mercado.tabelaTitulo} tabIndex={0}>
        <table className="tabela mercado-tabela mercado-indices">
          <caption>{TEXTOS.mercado.tabelaTitulo}</caption>
          <thead>
            <tr>
              <th scope="col" className="rotulo-secao">
                {TEXTOS.mercado.colIndicador}
              </th>
              <th scope="col" className="num rotulo-secao">
                {TEXTOS.mercado.colHoje}
              </th>
              {PERIODOS.map((p) => (
                <th key={p.chave} scope="col" className="num rotulo-secao">
                  {TEXTOS.mercado.periodos[p.chave]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {indicadores.map((ind) => {
              const { nome, unidade } = separarUnidade(ind.label);
              return (
                <tr key={ind.label}>
                  <th scope="row" className="mercado-indice__nome">
                    <Termo chave={TERMO_DA_LINHA[ind.label]}>{nome}</Termo>
                    {unidade && (
                      <>
                        {' '}
                        <span className="mercado-indice__unidade">({unidade})</span>
                      </>
                    )}
                  </th>
                  <td className="num mercado-hoje" data-rotulo={TEXTOS.mercado.colHoje}>
                    <CelulaHoje indicador={ind} />
                  </td>
                  {PERIODOS.map((p) => {
                    const rotulo = TEXTOS.mercado.periodos[p.chave];
                    const celula = celulaPeriodo(ind, rotulo);
                    return (
                      <td key={p.chave} className="num" data-rotulo={rotulo}>
                        <CelulaPeriodo
                          texto={celula.texto}
                          sinal={celula.sinal}
                          calculado={Boolean(ind.periodos?.find((x) => x.rotulo === rotulo)?.calculado)}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {temCalculado(indicadores) && (
        <p className="mercado-nota mercado-nota--rodape">
          <span aria-hidden="true">{TEXTOS.mercado.asterisco} </span>
          {TEXTOS.mercado.calculadoNota}
        </p>
      )}
      {semBrent && <p className="mercado-nota mercado-nota--rodape">{TEXTOS.mercado.brentNota}</p>}
    </>
  );
}
