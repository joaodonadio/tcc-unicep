import { useMemo } from 'react';
import { useSerie } from '../../hooks/useDados.js';
import { brl, pct } from '../../lib/formato.js';
import { direcaoDe } from '../../lib/mapaPregao.js';
import { TEXTOS } from '../../lib/textos.js';
import { janelaComSalto, variacaoPeriodoSuspeita } from '../../lib/crivel.js';
import { fechamentoSeisMeses } from '../../lib/top5Estudo.js';
import { MiniGrafico } from '../graficos/MiniGrafico.jsx';
import { SeloRevisao } from '../ui/SeloRevisao.jsx';

const T = TEXTOS.top5Hoje;
const ALTURA = 88;
/** Cor da área pela direção dos 6 meses; estável ou sem dado, a cor da série principal. */
const COR_DA_DIRECAO = { up: 'var(--cor-alta)', down: 'var(--cor-queda)' };
const COR_NEUTRA = 'var(--cor-serie-1)';

/**
 * Preço da ação nos últimos 6 meses: título curto, a variação do resumo (com sinal) e a área do fechamento.
 * Sem série (ou com menos de 2 pontos) o gráfico não aparece; sem variação, o número some.
 */
export function Top5SeisMeses({ ticker, alta6m }) {
  const consulta = useSerie(ticker, '1a');
  const janela = useMemo(() => fechamentoSeisMeses(consulta.data), [consulta.data]);
  // salto de escala na janela ou período fora dos limites: o número vai para "mudou de escala"
  const suspeita = (janela && janelaComSalto(janela.valores)) || variacaoPeriodoSuspeita(alta6m);
  const numero = suspeita ? null : alta6m;
  const direcao = direcaoDe(numero);
  const carregando = consulta.isPending && !consulta.isError;
  if (alta6m == null && !janela && !carregando) return null;

  return (
    <div className="top5-seis">
      <p className="top5-seis-titulo">{T.seisMesesTitulo}</p>
      <div className="top5-seis-corpo">
        {suspeita ? (
          <SeloRevisao compacto />
        ) : (
          numero != null && (
            <span className="hoje-janela-valor" data-sinal={direcao}>
              {pct(numero)}
            </span>
          )
        )}
        {carregando && <div className="esqueleto top5-seis-grafico" style={{ height: `${ALTURA / 16}rem` }} aria-hidden="true" />}
        {janela && (
          <div className="top5-seis-grafico">
            <MiniGrafico
              tipo="area"
              faixaExata
              valores={janela.valores}
              cor={COR_DA_DIRECAO[direcao] ?? COR_NEUTRA}
              altura={ALTURA}
              rotulo={T.seisMesesRotulo(ticker, brl(janela.primeiro), brl(janela.ultimo))}
            />
          </div>
        )}
      </div>
    </div>
  );
}
