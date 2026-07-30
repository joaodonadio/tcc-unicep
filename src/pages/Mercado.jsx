import { useMemo, useState } from 'react';
import { MapaBrasil } from '../components/canvas/MapaBrasil.jsx';
import { GraficoInterativo } from '../components/graficos/GraficoInterativo.jsx';
import { BlocoErro, CardSkeleton, Linhas } from '../components/ui/Estados.jsx';
import { useAnaliseDoDia, useHistorico, useRecarregarAnalise } from '../hooks/useAnalise.js';
import { espalharPins } from '../lib/projecaoBrasil.js';
import { dataCurta } from '../lib/formato.js';

/**
 * TELA MERCADO — RF-3.1 a RF-3.5.
 * Rota `/mercado`. "Notícias interpretadas, não apenas listadas": todo dado
 * bruto aqui vem acompanhado da leitura que o sistema faz dele (M1, M2).
 */

const PERIODOS = ['1M', '6M', '1A'];

const COR_TOM = {
  positivo: 'var(--success)',
  negativo: 'var(--danger)',
  alerta: 'var(--warning)',
  neutro: 'var(--map-neutral)',
};

export default function Mercado() {
  const { data, isPending, isError, error } = useAnaliseDoDia();
  const recarregar = useRecarregarAnalise();
  const [periodo, setPeriodo] = useState('6M');

  const tickerDestaque = data?.destaque?.ticker ?? 'PETR4';
  const historico = useHistorico(tickerDestaque, periodo);
  const pinsPosicionados = useMemo(() => espalharPins(data?.mapa_noticias ?? []), [data]);

  if (isError) {
    return (
      <main className="screen screen-wide">
        <BlocoErro
          mensagem={error?.mensagemUsuario ?? error?.message}
          onTentarNovamente={recarregar}
        />
      </main>
    );
  }

  const destaque = data?.destaque;
  const dias = historico.data?.dias ?? 180;

  return (
    <main className="screen screen-wide">
      <div className="fade-up-fast">
        <div className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          <span>DADOS QUE SUSTENTAM A ANÁLISE</span>
        </div>
        <h2 className="h2">
          O mercado em <span className="hl">contexto</span>.
        </h2>
      </div>

      {/* RF-3.1 — indicadores macro */}
      <div className="ind-grid">
        {isPending
          ? Array.from({ length: 8 }, (_, i) => (
              <div className="ind-card" key={i}>
                <Linhas quantidade={2} larguras={['52%', '80%']} />
              </div>
            ))
          : data.indicadores.map((indicador) => (
              <div className="ind-card" key={indicador.label}>
                <div className="ind-label">{indicador.label}</div>
                <div className="ind-value">{indicador.valor}</div>
                <div className={`ind-delta is-${indicador.sinal ?? 'flat'}`}>{indicador.delta}</div>
              </div>
            ))}
      </div>

      <div className="mercado-grid">
        {/* RF-3.2 — gráfico interativo */}
        <div className="card">
          <div className="chart-head">
            <div>
              <div className="chart-asset">
                {tickerDestaque}{' '}
                <span>
                  {destaque?.nome ?? ''} · {destaque?.descricao ?? 'ativo em destaque na análise'}
                </span>
              </div>
              <div className="chart-price">
                {destaque?.preco ?? '—'}{' '}
                {destaque?.variacao_dia && (
                  <span>▲ {String(destaque.variacao_dia).replace('.', ',')}% hoje</span>
                )}
              </div>
            </div>
            <div className="range-switch" role="group" aria-label="Período do gráfico">
              {PERIODOS.map((opcao) => (
                <button
                  key={opcao}
                  type="button"
                  className="range-btn"
                  aria-pressed={periodo === opcao}
                  onClick={() => setPeriodo(opcao)}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </div>

          {historico.isError ? (
            <BlocoErro
              titulo="Histórico indisponível"
              mensagem={historico.error?.mensagemUsuario}
              onTentarNovamente={historico.refetch}
            />
          ) : (
            <GraficoInterativo
              serie={historico.data?.serie ?? []}
              dias={dias}
              carregando={historico.isFetching}
            />
          )}

          <div className="chart-foot">
            <span>{dataCurta(new Date(Date.now() - dias * 86400000))}</span>
            <span>PASSE O CURSOR SOBRE O GRÁFICO</span>
            <span>{dataCurta(new Date())}</span>
          </div>
        </div>

        {/* RF-3.3 — mapa de notícias georreferenciadas */}
        <div className="card map-card">
          <div className="map-head">
            <div style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
              Impacto das notícias no Brasil
            </div>
            <div
              className="mono"
              style={{ fontSize: '0.59375rem', letterSpacing: '0.1em', color: 'var(--text-8)' }}
            >
              SENTIMENTO POR IA
            </div>
          </div>

          <div className="map-stage">
            <MapaBrasil />
            {pinsPosicionados.map(({ pin, indice, left, top, lado }) => {
              const cor = COR_TOM[pin.tom] ?? COR_TOM.neutro;
              return (
                <div
                  className={`map-pin is-${lado}`}
                  key={indice}
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <span
                    className="map-pin-dot"
                    style={{ background: cor, boxShadow: `0 0 12px ${cor}` }}
                    aria-hidden="true"
                  />
                  <div className="map-pin-text">
                    <div className="map-pin-title">{pin.titulo}</div>
                    <div className="map-pin-sub">{pin.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="map-legend">
            <span>
              <i style={{ background: 'var(--success)' }} />
              Positivo
            </span>
            <span>
              <i style={{ background: 'var(--danger)' }} />
              Negativo
            </span>
            <span>
              <i style={{ background: 'var(--warning)' }} />
              Alerta
            </span>
            <span>
              <i style={{ background: 'var(--map-neutral)' }} />
              Neutro
            </span>
          </div>
        </div>
      </div>

      {/* RF-3.4 — setores em movimento */}
      <section className="section-gap">
        <div className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          <span>DESEMPENHO POR SETOR · HOJE</span>
        </div>
        <div className="setores-grid">
          <div>
            <h2 className="h2-sm" style={{ marginTop: '0.5rem' }}>
              Setores em <span className="hl">movimento</span>.
            </h2>
            <p className="lead">
              Cada barra mostra a força do movimento de um setor da B3 hoje. Energia lidera com
              +2,1%, puxada pelo petróleo — enquanto o varejo segue pressionado.
            </p>
          </div>
          <div className="setores-box">
            {isPending ? (
              <Linhas quantidade={8} larguras={['100%']} />
            ) : (
              data.setores.map((setor) => {
                const positivo = setor.variacao >= 0;
                const largura = Math.min(100, (Math.abs(setor.variacao) / 2.2) * 100);
                return (
                  <div className="setor-row" key={setor.setor}>
                    <span className="setor-name">{setor.setor}</span>
                    <div className="setor-track">
                      <div
                        className={`setor-fill is-${positivo ? 'up' : 'down'}`}
                        style={{ width: `${largura}%` }}
                      />
                    </div>
                    <span className={`setor-val is-${positivo ? 'up' : 'down'}`}>
                      {positivo ? '▲ +' : '▼ '}
                      {String(Math.abs(setor.variacao)).replace('.', ',')}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* RF-3.5 — a leitura do sistema */}
      <section className="section-gap">
        <div className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" />
          <span>NOTÍCIAS INTERPRETADAS, NÃO APENAS LISTADAS</span>
        </div>
        <h2 className="h2-sm">
          A leitura do <span className="hl">sistema</span>.
        </h2>
        <div className="grid-3">
          {isPending
            ? Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} altura="10rem" rotulo="" />)
            : data.leituras.map((leitura, i) => (
                <div className="leitura-card" key={i}>
                  <div className="leitura-head">
                    <span className="leitura-tag">{leitura.tag}</span>
                    <span className={`leitura-tone is-${leitura.tom}`}>
                      ● {leitura.tom.toUpperCase()}
                    </span>
                  </div>
                  <div className="leitura-title">{leitura.titulo}</div>
                  <div className="leitura-fonte">{leitura.fonte}</div>
                  <div className="leitura-read">
                    <strong>Leitura do sistema:</strong> {leitura.leitura_do_sistema}
                  </div>
                </div>
              ))}
        </div>
      </section>
    </main>
  );
}
