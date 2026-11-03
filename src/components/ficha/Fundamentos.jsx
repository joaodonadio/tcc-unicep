import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProventos } from '../../hooks/useDados.js';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { Linhas } from '../ui/Estados.jsx';
import { dataBR } from '../../lib/datas.js';
import { EXPLICACOES } from '../../lib/explicacoes.js';
import { montarIndicadoresFicha } from '../../lib/fichaIndicadores.js';
import { proximoPagamento } from '../../lib/proventos.js';
import { BRILHO_DA_PERGUNTA } from '../../lib/perguntasFicha.js';
import { ROTULO_STATUS, TEXTOS } from '../../lib/textos.js';

const F = TEXTOS.ficha.fundamentos;

/** Indicadores de leitura rápida e a pergunta da ficha que cada um responde (a mancha vem dela). */
const DESTAQUES = [
  { chave: 'pl', pergunta: 'cara' },
  { chave: 'pvp', pergunta: 'cara' },
  { chave: 'roe', pergunta: 'cara' },
  { chave: 'dividend_yield', pergunta: 'proventos' },
  { chave: 'dl_ebitda', pergunta: 'divida' },
];

/** Último balanço: fim do período e dia/mês da entrega; sem data, a frase de ausência. */
function textoBalanco(balanco) {
  const fim = dataBR(balanco?.data_fim_periodo);
  const entrega = dataBR(balanco?.data_entrega).slice(0, 5);
  return fim ? F.ultimoBalanco(fim, entrega) : F.balancoIndisponivel;
}

/** Próximo provento com data de pagamento futura; sem nenhum, a frase de ausência. */
function textoProximo(proventos) {
  if (proventos.isPending) return F.proventoCarregando;
  if (proventos.isError) return F.proventoIndisponivel;
  const proximo = proximoPagamento(proventos.data);
  if (!proximo) return F.semProventoFuturo;
  return proximo.valor_texto == null
    ? F.proximoProventoSemValor(proximo.tipo_rotulo, proximo.data_texto)
    : F.proximoProvento(proximo.tipo_rotulo, proximo.valor_texto, proximo.data_texto);
}

/** Mediana do setor sem o prefixo do indicador ("Setor (mediana): 11,4×" vira "11,4×"). */
const medianaDoSetor = (indicador) => indicador?.setor_texto?.replace(/^[^:]*:\s*/, '') || null;

/**
 * Faixa fixa da ficha, acima das abas: cinco números de leitura rápida (cada um abre a
 * pergunta que o explica) e as datas da empresa. Valor ausente mostra o motivo, nunca zero.
 */
export function Fundamentos({ ticker, resumo, carregando }) {
  const indicadores = useMemo(() => montarIndicadoresFicha(resumo), [resumo]);
  const proventos = useProventos(ticker);

  return (
    <section className="ficha-fundamentos-bloco" aria-labelledby="fundamentos-titulo">
      <h2 id="fundamentos-titulo" className="sr-only">
        {F.titulo}
      </h2>

      {carregando ? (
        <Linhas quantidade={2} />
      ) : (
        <dl className="ficha-fundamentos">
          {DESTAQUES.map(({ chave, pergunta }) => {
            const rotulo = F.rotulos[chave];
            const indicador = indicadores.find((i) => i.chave === chave);
            const texto = indicador?.texto ?? '—';
            const ausente = texto === '—';
            const motivo = ausente ? indicador?.motivo || ROTULO_STATUS.indisponivel : '';
            const mediana = ausente ? null : medianaDoSetor(indicador);
            return (
              <div className="ficha-fundamento" key={chave} data-brilho={BRILHO_DA_PERGUNTA[pergunta]}>
                <dt>{rotulo}</dt>
                <dd className="ficha-fundamento-valor">
                  <Link to={`?pergunta=${pergunta}`} replace aria-label={F.verPergunta(rotulo, ausente ? motivo : texto)}>
                    {texto}
                  </Link>
                </dd>
                {motivo && <dd className="ficha-fundamento-apoio">{motivo}</dd>}
                {mediana && <dd className="ficha-fundamento-apoio">{F.setor(mediana)}</dd>}
              </div>
            );
          })}
        </dl>
      )}

      <ul className="ficha-datas" aria-label={F.datas}>
        <li>{textoBalanco(resumo?.balanco_referencia)}</li>
        <li>{textoProximo(proventos)}</li>
      </ul>
    </section>
  );
}
