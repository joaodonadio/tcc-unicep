import { useId, useRef, useState } from 'react';
import { useSerie } from '../../hooks/useDados.js';
import { usePreferencias } from '../../context/contextos.js';
import { diaMes } from '../../lib/datas.js';
import { CAMPOS_SERIE_ANO, resumoSerie, trechosSemValor } from '../../lib/historicoAcao.js';
import { numero } from '../../lib/formato.js';
import { ROTULO_STATUS, TEXTOS } from '../../lib/textos.js';
import { trocarComTransicao } from '../../lib/movimento.js';
import { exibirNumero } from '../../lib/valor.js';
import { GraficoInterativo } from '../graficos/GraficoInterativo.jsx';
import { BlocoErro, BlocoVazio, Linhas } from '../ui/Estados.jsx';

const H = TEXTOS.ficha.historicoAno;
const finito = (v) => typeof v === 'number' && Number.isFinite(v);
const TECLAS_PROXIMA = ['ArrowRight', 'ArrowDown'];
const TECLAS_ANTERIOR = ['ArrowLeft', 'ArrowUp'];

/** Motivo de um trecho sem valor, traduzido; status desconhecido cai em "Indisponível". */
const motivoDo = (status) => ROTULO_STATUS[status] || ROTULO_STATUS.indisponivel;

/**
 * "Histórico de 1 ano" da pergunta "Está cara?": a série diária de P/L, P/VP e dividend yield
 * no último ano, com um indicador por vez (abas). Ao lado, valor atual, mínima, máxima e
 * mediana do período. Trechos sem valor aparecem como nota abaixo do gráfico. No técnico,
 * soma o percentil do valor atual dentro do ano.
 */
export function HistoricoAno({ ticker }) {
  const { nivel } = usePreferencias();
  const tecnico = nivel === 'tecnico';
  const { data, isPending, isError, error, refetch } = useSerie(ticker, '1a');
  const [campoEscolhido, setCampoEscolhido] = useState(CAMPOS_SERIE_ANO[0].campo);
  const idPainel = useId();
  const botoesAba = useRef({});

  if (isPending) return <Linhas quantidade={3} />;
  if (isError) {
    return (
      <BlocoErro titulo={TEXTOS.ficha.historicoIndisponivel} mensagem={error?.mensagemUsuario} onTentarNovamente={refetch} />
    );
  }
  if (!data) return <BlocoVazio titulo={TEXTOS.ficha.semSerie} />;

  const datas = Array.isArray(data.datas) ? data.datas : [];
  const def = CAMPOS_SERIE_ANO.find((c) => c.campo === campoEscolhido) ?? CAMPOS_SERIE_ANO[0];
  const valores = Array.isArray(data.valores?.[def.campo]) ? data.valores[def.campo] : [];
  const resumo = resumoSerie(valores);
  const validos = valores.filter(finito).length;
  const trechos = trechosSemValor(data.status?.[def.campo], datas);
  const idAba = (campo) => `${idPainel}-${campo}`;
  // a troca de aba dá o crossfade curto da página (movimento.css, seção 21)
  const trocarAba = (campo) => trocarComTransicao(() => setCampoEscolhido(campo), 'suave');

  // setas, Home e End trocam a aba e levam o foco até ela (setas circulares)
  const escolherAba = (campo) => {
    trocarAba(campo);
    botoesAba.current[campo]?.focus();
  };
  const aoTeclaAba = (e, indice) => {
    const ultimo = CAMPOS_SERIE_ANO.length - 1;
    let destino = null;
    if (TECLAS_PROXIMA.includes(e.key)) destino = indice === ultimo ? 0 : indice + 1;
    else if (TECLAS_ANTERIOR.includes(e.key)) destino = indice === 0 ? ultimo : indice - 1;
    else if (e.key === 'Home') destino = 0;
    else if (e.key === 'End') destino = ultimo;
    if (destino === null) return;
    e.preventDefault();
    escolherAba(CAMPOS_SERIE_ANO[destino].campo);
  };

  return (
    <section className="ficha-hist-ano" aria-labelledby={`${idPainel}-titulo`}>
      <h3 className="ficha-grupo-titulo" id={`${idPainel}-titulo`}>
        {H.titulo}
      </h3>

      <div className="ficha-hist-abas" role="tablist" aria-label={H.abas}>
        {CAMPOS_SERIE_ANO.map((c, indice) => (
          <button
            key={c.campo}
            ref={(el) => {
              botoesAba.current[c.campo] = el;
            }}
            type="button"
            role="tab"
            id={idAba(c.campo)}
            aria-selected={c.campo === def.campo}
            aria-controls={idPainel}
            tabIndex={c.campo === def.campo ? 0 : -1}
            className="ficha-hist-aba"
            onClick={() => trocarAba(c.campo)}
            onKeyDown={(e) => aoTeclaAba(e, indice)}
          >
            {c.rotulo}
          </button>
        ))}
      </div>

      <div className="ficha-hist-ano-painel" role="tabpanel" id={idPainel} aria-labelledby={idAba(def.campo)}>
        {validos >= 2 ? (
          <GraficoInterativo
            serie={valores}
            datas={datas}
            formatar={def.formatar}
            descricao={H.descricao(def.rotulo, ticker)}
            altura={160}
            carregando={isPending}
          />
        ) : (
          <p className="ficha-nota">{validos === 1 ? TEXTOS.ficha.historicoUmDia : H.semDado}</p>
        )}

        <dl className="ficha-hist-ano-resumo">
          <div>
            <dt>{H.atual}</dt>
            <dd>{exibirNumero(resumo.atual, def.formatar)}</dd>
          </div>
          <div>
            <dt>{H.minima}</dt>
            <dd>{exibirNumero(resumo.minima, def.formatar)}</dd>
          </div>
          <div>
            <dt>{H.maxima}</dt>
            <dd>{exibirNumero(resumo.maxima, def.formatar)}</dd>
          </div>
          <div>
            <dt>{H.mediana}</dt>
            <dd>{exibirNumero(resumo.mediana, def.formatar)}</dd>
          </div>
          {tecnico && resumo.percentil != null && (
            <div>
              <dt>{H.percentil}</dt>
              <dd>{H.percentilValor(numero(Math.round(resumo.percentil * 100), { casas: 0 }))}</dd>
            </div>
          )}
        </dl>

        {trechos.map((t) => (
          <p className="ficha-nota" key={`${t.de}-${t.ate}-${t.status}`}>
            {H.semValor(def.rotulo, diaMes(t.de), diaMes(t.ate), motivoDo(t.status))}
          </p>
        ))}
      </div>
    </section>
  );
}
