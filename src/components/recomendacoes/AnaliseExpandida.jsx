import { Sparkline } from '../graficos/Sparkline.jsx';
import { Simulador } from './Simulador.jsx';
import { usePreferencias, useDecisoes } from '../../context/contextos.js';

/**
 * RF-2.4 e RF-2.5 — o conteúdo da análise expandida.
 *
 * Coluna esquerda = a explicação (o que foi identificado, por que importa, o
 * registro adequado ao nível do usuário e a trilha de como o sistema chegou
 * ali). Coluna direita = os instrumentos (tendência, glossário, simulador,
 * adequação e o feedback). Nenhum texto analítico é gerado aqui: tudo vem
 * pronto do back-end (§3), o front só escolhe qual bloco mostrar.
 */

const ICONE_EVIDENCIA = { up: '↗', down: '↘', flat: '→' };

function faixaAdequacao(valor) {
  if (valor > 80) return { classe: 'is-alta', rotulo: 'Alta adequação ao seu perfil' };
  if (valor > 50) return { classe: 'is-media', rotulo: 'Adequação média ao seu perfil' };
  return { classe: 'is-baixa', rotulo: 'Baixa adequação ao seu perfil' };
}

export function AnaliseExpandida({ recomendacao, perfil = 'moderado' }) {
  const { nivel } = usePreferencias();
  const { feedback, avaliar } = useDecisoes();

  const r = recomendacao;
  const avaliacao = feedback[r.id] ?? null;
  const adequacao = faixaAdequacao(r.adequacao_perfil ?? 0);
  const variacaoPositiva = !String(r.variacao_30d).startsWith('-');

  const passos = [
    { n: '01', txt: `Coletou preços, volume negociado e noticiário recente de ${r.ticker} na B3.` },
    { n: '02', txt: 'Processou os dados e comparou com a média histórica do ativo e do setor.' },
    {
      n: '03',
      txt: `Identificou ${r.evidencias.length} sinais relevantes apontando na mesma direção.`,
    },
    {
      n: '04',
      txt: `Calculou ${r.confianca}% de confiança e classificou o risco como ${r.risco.toLowerCase()}.`,
    },
  ];

  return (
    <div className="rec-expand-inner">
      {/* ---------------- coluna esquerda ---------------- */}
      <div>
        <div className="label">O QUE O SISTEMA IDENTIFICOU</div>
        <div className="ev-list">
          {r.evidencias.map((evidencia, i) => (
            <div className="ev-item" key={i}>
              <span className={`ev-icon is-${evidencia.direcao}`} aria-hidden="true">
                {ICONE_EVIDENCIA[evidencia.direcao] ?? '→'}
              </span>
              <span>{evidencia.texto}</span>
            </div>
          ))}
        </div>

        <div className="label" style={{ marginTop: '1.5rem' }}>
          POR QUE ISSO IMPORTA
        </div>
        <p className="porque">{r.porque}</p>

        {/* RF-5.1 — o toggle global escolhe qual dos dois registros aparece */}
        {nivel === 'simples' && r.explicacao_simples && (
          <div className="box-simples">{r.explicacao_simples}</div>
        )}
        {nivel === 'tecnico' && r.leitura_tecnica?.length > 0 && (
          <div className="box-tecnico">
            <div className="box-tecnico-label">LEITURA TÉCNICA</div>
            <dl className="tecnico-list">
              {r.leitura_tecnica.map((item, i) => (
                <div className="tecnico-row" key={i}>
                  <dt>{item.indicador}</dt>
                  <dd>{item.valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="label" style={{ marginTop: '1.5rem' }}>
          COMO O SISTEMA CHEGOU AQUI
        </div>
        <div className="passos">
          {passos.map((passo) => (
            <div className="passo" key={passo.n}>
              <span className="passo-n">{passo.n}</span>
              <span className="passo-txt">{passo.txt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- coluna direita ---------------- */}
      <div>
        <div className="label">TENDÊNCIA · 30 DIAS</div>
        <div className="spark-box">
          <Sparkline
            serie={r.serie_30d}
            tipo={r.tipo}
            descricao={`Tendência de ${r.ticker} nos últimos 30 dias: ${String(
              r.variacao_30d,
            ).replace('.', ',')}%.`}
          />
          <div className="spark-foot">
            <span>30 DIAS ATRÁS</span>
            <span className={variacaoPositiva ? 'var-up' : 'var-down'}>
              {String(r.variacao_30d).replace('.', ',')}%
            </span>
            <span>HOJE</span>
          </div>
        </div>

        {r.glossario?.length > 0 && (
          <>
            <div className="label" style={{ marginTop: '1.375rem' }}>
              TERMOS EXPLICADOS
            </div>
            <div className="glossario">
              {r.glossario.map((termo, i) => (
                <div className="glossario-item" key={i}>
                  <span className="glossario-termo">{termo.termo}</span> — {termo.definicao}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="label" style={{ marginTop: '1.375rem' }}>
          SIMULE ANTES DE DECIDIR
        </div>
        <Simulador variacao30d={r.variacao_30d} />

        <div className="label" style={{ marginTop: '1.375rem' }}>
          ADEQUAÇÃO AO SEU PERFIL
        </div>
        <div className="fit-row">
          <span className="fit-label">
            {adequacao.rotulo} ({perfil})
          </span>
          <span className="fit-value">{r.adequacao_perfil}%</span>
        </div>
        <div className="bar-track">
          <div
            className={`bar-fill fit-fill ${adequacao.classe}`}
            style={{ width: `${r.adequacao_perfil}%` }}
          />
        </div>

        {/* RF-2.5 — feedback */}
        {avaliacao ? (
          <div className="fb-done" role="status">
            {avaliacao === 'sim'
              ? 'Obrigado! O sistema registrou que esta explicação ajudou.'
              : 'Obrigado! O sistema vai priorizar explicações mais claras para você.'}
          </div>
        ) : (
          <div className="fb-row">
            <span className="fb-question">Esta análise foi útil?</span>
            <button type="button" className="fb-btn is-yes" onClick={() => avaliar(r.id, true)}>
              Sim
            </button>
            <button type="button" className="fb-btn is-no" onClick={() => avaliar(r.id, false)}>
              Não
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
