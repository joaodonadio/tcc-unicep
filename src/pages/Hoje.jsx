import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GloboAtivos } from '../components/canvas/GloboAtivos.jsx';
import { BlocoErro, BlocoVazio, CardSkeleton, Linhas } from '../components/ui/Estados.jsx';
import { useAnaliseDoDia, useRecarregarAnalise } from '../hooks/useAnalise.js';
import { useCountUp } from '../hooks/useCountUp.js';
import { useLeituraEmVoz } from '../hooks/useLeituraEmVoz.js';
import { useDecisoes, useTour } from '../context/contextos.js';
import { SENTIMENTO_ROTULO, dataExtenso, horaCurta, saudacao } from '../lib/formato.js';

/**
 * TELA HOJE — RF-1.1 a RF-1.10.
 * Rota `/`, tela inicial. Responde a "o que aconteceu hoje e por quê" antes de
 * qualquer número solto (M2, M11).
 */

function Estatistica({ valor, rotulo, variante, sufixo }) {
  const animado = useCountUp(valor);
  return (
    <div className="stat">
      <div className={`stat-value${variante ? ` is-${variante}` : ''}`}>
        {animado}
        {sufixo && <sup aria-hidden="true"> {sufixo}</sup>}
      </div>
      <div className="stat-label">{rotulo}</div>
    </div>
  );
}

function CardInsightAtivo({ ticker, ativos, recomendacoes, aoFechar }) {
  const navigate = useNavigate();
  const ativo = ativos.find((a) => a.ticker === ticker);
  const recomendacao = recomendacoes.find((r) => r.ticker === ticker);
  const tipo = ativo?.tipo ?? 'neutro';

  const rotuloTipo =
    tipo === 'oportunidade'
      ? '● OPORTUNIDADE'
      : tipo === 'risco'
        ? '⚠ PONTO DE ATENÇÃO'
        : '● NEUTRO';
  const cor =
    tipo === 'oportunidade'
      ? 'var(--accent)'
      : tipo === 'risco'
        ? 'var(--warning)'
        : 'var(--map-neutral)';

  return (
    <div className="globe-insight" role="region" aria-label={`Detalhe de ${ticker}`}>
      <div className="globe-insight-head">
        <span className="globe-insight-kind" style={{ color: cor }}>
          {rotuloTipo}
        </span>
        <button
          type="button"
          className="globe-insight-close"
          onClick={aoFechar}
          aria-label="Fechar detalhe do ativo"
        >
          ×
        </button>
      </div>
      <div className="globe-insight-ticker">
        {ticker} <span>· {ativo?.nome ?? recomendacao?.nome ?? ''}</span>
      </div>
      <p className="globe-insight-text">
        {recomendacao?.resumo ??
          'Ativo monitorado continuamente. Nenhum sinal relevante identificado hoje — comportamento dentro do padrão esperado.'}
      </p>
      {recomendacao && (
        <button
          type="button"
          className="globe-insight-cta"
          onClick={() =>
            navigate('/recomendacoes', { state: { expandir: recomendacao.id } })
          }
        >
          Ver recomendação →
        </button>
      )}
    </div>
  );
}

export default function Hoje() {
  const { data, isPending, isError, error } = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();
  const navigate = useNavigate();
  const { iniciar: iniciarTour } = useTour();
  const { decisoes, temDecisoes } = useDecisoes();
  const [selecionado, setSelecionado] = useState(null);
  const voz = useLeituraEmVoz(data?.resumo_simples);

  if (isError) {
    return (
      <main className="screen screen-hoje">
        <BlocoErro mensagem={error?.mensagemUsuario ?? error?.message} onTentarNovamente={recarregar} />
      </main>
    );
  }

  const estatisticas = data?.estatisticas ?? { oportunidades: 0, riscos: 0, ativos_analisados: 0 };
  const ativos = data?.ativos ?? [];
  const recomendacoes = data?.recomendacoes ?? [];
  const sentimento = SENTIMENTO_ROTULO[data?.sentimento_geral] ?? '—';
  // Sem nome enquanto os dados não chegam: um placeholder mais longo que o nome
  // real ("investidor" vs "João") fazia o h1 quebrar em duas linhas e voltar
  // para uma, empurrando a página inteira 66px — sozinho, todo o CLS da tela.
  const nome = data?.usuario?.nome;

  return (
    <main className="screen screen-hoje">
      <div className="hoje-hero">
        {/* ---------- coluna esquerda: saudação, estatísticas e CTAs ---------- */}
        <div className="fade-up">
          <div className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            <span>ANÁLISE DO MERCADO · {dataExtenso(data?.gerado_em)}</span>
          </div>

          {/* RF-1.1 */}
          <h1 className="h1">{nome ? `${saudacao()}, ${nome}.` : `${saudacao()}.`}</h1>
          <p className="hoje-frase">
            Analisamos o mercado e encontramos{' '}
            <span className="hl">
              {estatisticas.oportunidades}{' '}
              {estatisticas.oportunidades === 1 ? 'oportunidade' : 'oportunidades'}
            </span>{' '}
            relevantes para você hoje.
          </p>

          {/* RF-1.2 */}
          <div className="stats">
            <Estatistica
              valor={estatisticas.oportunidades}
              rotulo="OPORTUNIDADES"
              variante="op"
              sufixo="↗"
            />
            <Estatistica
              valor={estatisticas.riscos}
              rotulo="RISCOS IMPORTANTES"
              variante="risk"
              sufixo="⚠"
            />
            <Estatistica valor={estatisticas.ativos_analisados} rotulo="ATIVOS ANALISADOS" />
            <div className="stat">
              <div className="stat-sentiment">{sentimento}</div>
              <div className="stat-label" style={{ marginTop: '0.625rem' }}>
                SENTIMENTO DO MERCADO
              </div>
            </div>
          </div>

          {/* RF-1.6 */}
          <div className="hoje-ctas">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/recomendacoes')}
            >
              Explorar análise de hoje →
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/perguntar')}>
              Perguntar ao sistema
            </button>
          </div>

          <div className="hoje-meta">
            <div className="hoje-timestamp">
              <span aria-hidden="true" />
              <span>ÚLTIMA ANÁLISE ÀS {horaCurta(data?.gerado_em)}</span>
            </div>
            <button type="button" className="btn-link" onClick={iniciarTour}>
              Primeira vez aqui? Faça o tour guiado →
            </button>
          </div>
        </div>

        {/* ---------- coluna direita: globo 3D ---------- */}
        <div className="globe-wrap fade-up delay-1">
          <div className="globe-stage">
            <div className="globe-halo" aria-hidden="true" />
            <div className="globe-io globe-io-in" aria-hidden="true">
              DADOS DO MERCADO
            </div>
            <div className="globe-io globe-io-out" aria-hidden="true">
              RECOMENDAÇÕES
            </div>
            <GloboAtivos
              ativos={ativos}
              selecionado={selecionado}
              onSelecionar={setSelecionado}
              estadoMercado={data?.estado_mercado ?? 'estavel'}
            />
            {selecionado && (
              <CardInsightAtivo
                ticker={selecionado}
                ativos={ativos}
                recomendacoes={recomendacoes}
                aoFechar={() => setSelecionado(null)}
              />
            )}
          </div>

          {/* RF-1.5 */}
          <div className="globe-legend">
            <span className="globe-legend-item">
              <i style={{ background: 'var(--accent)' }} />
              OPORTUNIDADE ↗
            </span>
            <span className="globe-legend-item">
              <i style={{ background: 'var(--warning)' }} />
              RISCO ⚠
            </span>
            <span className="globe-legend-item">
              <i style={{ background: 'rgba(150,180,230,0.7)' }} />
              NEUTRO
            </span>
            <span className="globe-legend-hint">· CLIQUE NOS ATIVOS PARA EXPLORAR</span>
          </div>

          {/* alternativa textual ao canvas: o globo é canal redundante (§4.4).
              O contêiner é renderizado sempre — some-lo enquanto os dados não
              chegam causaria salto de layout na troca (CLS, §6). */}
          <div className="globe-alt-list">
            {ativos.map((ativo) => (
              <button
                key={ativo.ticker}
                type="button"
                className={`globe-alt-btn${selecionado === ativo.ticker ? ' is-selected' : ''}`}
                onClick={() =>
                  setSelecionado((atual) => (atual === ativo.ticker ? null : ativo.ticker))
                }
                aria-pressed={selecionado === ativo.ticker}
              >
                {ativo.ticker}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- RF-1.7 — resumo do dia + TTS ---------- */}
      <section className="resumo">
        <div className="resumo-row">
          <div className="resumo-col">
            <div className="eyebrow">
              <span className="eyebrow-dot" aria-hidden="true" />
              <span>RESUMO DO DIA · EM 30 SEGUNDOS</span>
            </div>
            {isPending ? (
              <div style={{ marginTop: '1rem' }}>
                <Linhas quantidade={3} larguras={['100%', '94%', '72%']} />
              </div>
            ) : (
              <p className="resumo-text">{data.resumo_simples}</p>
            )}
          </div>
          {voz.disponivel && !isPending && (
            <button type="button" className="btn btn-accent" onClick={voz.alternar}>
              {voz.falando ? '⏹ Parar de ouvir' : '🔊 Ouvir o resumo'}
            </button>
          )}
        </div>
      </section>

      {/* ---------- RF-1.8 — diário de decisões ---------- */}
      {temDecisoes && (
        <section className="diario">
          <div className="diario-head">
            <strong>Diário de decisões</strong>
            <span>o sistema guarda o contexto de cada decisão sua</span>
          </div>
          <div className="diario-list">
            {Object.entries(decisoes).map(([id, registro]) => (
              <div className="diario-item" key={id}>
                <span
                  className={`diario-badge is-${registro.acao === 'seguir' ? 'seguir' : 'ignorar'}`}
                >
                  {registro.acao === 'seguir' ? 'SEGUIR' : 'IGNORAR'}
                </span>
                <span className="diario-ticker">
                  {registro.ticker} <span>· {registro.nome}</span>
                </span>
                <span className="diario-snapshot">
                  no momento da decisão: confiança {registro.snapshot.confianca}% · risco{' '}
                  {registro.snapshot.risco}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- RF-1.9 / RF-1.10 — alertas e agenda ---------- */}
      <section className="section-gap">
        <div className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          <span>ALERTAS E AGENDA ECONÔMICA</span>
        </div>
        <div className="dual-grid">
          <div className="card">
            <div className="card-title">
              <span className="card-title-dot" aria-hidden="true" />
              Alertas inteligentes
            </div>
            {isPending ? (
              <div className="alert-list">
                <Linhas quantidade={6} />
              </div>
            ) : data.alertas.length === 0 ? (
              <p className="state-text" style={{ marginTop: '1rem' }}>
                Nenhum alerta relevante até agora — o sistema segue monitorando.
              </p>
            ) : (
              <div className="alert-list">
                {data.alertas.slice(0, 3).map((alerta, i) => (
                  <div className="alert-item" key={i}>
                    <span
                      className="alert-dot"
                      style={{
                        color:
                          alerta.severidade === 'positivo'
                            ? 'var(--success)'
                            : alerta.severidade === 'atencao'
                              ? 'var(--danger)'
                              : 'var(--accent)',
                        background: 'currentColor',
                      }}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="alert-text">{alerta.texto}</div>
                      <div className="alert-when">{alerta.quando}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">
              <span
                className="card-title-dot"
                style={{ background: 'var(--primary)', boxShadow: '0 0 10px rgba(47,107,255,0.8)' }}
                aria-hidden="true"
              />
              Agenda econômica
            </div>
            {isPending ? (
              <div className="agenda-list">
                <Linhas quantidade={6} />
              </div>
            ) : data.agenda.length === 0 ? (
              <BlocoVazio
                titulo="Agenda vazia"
                mensagem="Nenhum evento econômico programado para os próximos dias."
              />
            ) : (
              <div className="agenda-list">
                {data.agenda.slice(0, 3).map((evento, i) => (
                  <div className="agenda-item" key={i}>
                    <div className="agenda-chip">
                      <div className="agenda-chip-day">{evento.dia}</div>
                      <div className="agenda-chip-hour">{evento.hora}</div>
                    </div>
                    <div className="agenda-body">
                      <div className="agenda-title">{evento.titulo}</div>
                      <div className="agenda-sub">{evento.subtitulo}</div>
                    </div>
                    <span
                      className={`agenda-impact is-${evento.impacto === 'Alto' ? 'alto' : 'medio'}`}
                    >
                      {evento.impacto}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

    </main>
  );
}
