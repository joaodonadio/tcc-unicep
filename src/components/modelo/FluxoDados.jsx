import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Cpu, Download, Inbox, Monitor, Package, Server } from 'lucide-react';
import { useAnaliseDoDia } from '../../hooks/useAnalise.js';
import { useExecucao } from '../../hooks/useDados.js';
import { horaBR } from '../../lib/datas.js';
import { quantidadeCheia } from '../../lib/formato.js';
import { TEXTOS } from '../../lib/textos.js';
import NumeroAnimado from '../ui/NumeroAnimado.jsx';
import { useEmVista } from './useEmVista.js';

const eNumero = (v) => typeof v === 'number' && Number.isFinite(v);
const INTERVALO_DESTAQUE_MS = 3000;
const ICONES = { coleta: Download, processamento: Cpu, api: Server, interface: Monitor };

/** Soma os registros dos pacotes enviados; null se nenhum número chegou (ausência nunca vira 0). */
function totalDeRegistros(execucao) {
  const pacotes = Array.isArray(execucao?.pacotes_enviados) ? execucao.pacotes_enviados : [];
  const numeros = pacotes.map((p) => p?.registros).filter(eNumero);
  return numeros.length > 0 ? numeros.reduce((a, b) => a + b, 0) : null;
}

const inteiroTexto = (n) => quantidadeCheia(Math.round(n));

/** Fluxo dos dados em quatro estações ligadas por um trilho onde correm pacotes de dados. */
export default function FluxoDados() {
  const t = TEXTOS.modelo.fluxo;
  const execucao = useExecucao().data ?? null;
  const analise = useAnaliseDoDia().data;
  const trilho = useRef(null);
  const { visto, animar } = useEmVista(trilho, 0.25);
  const fase = visto ? 'visivel' : 'oculto';
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    if (!visto || !animar) return undefined;
    const id = setInterval(() => setAtivo((a) => (a + 1) % t.etapas.length), INTERVALO_DESTAQUE_MS);
    return () => clearInterval(id);
  }, [visto, animar, t.etapas.length]);

  const vivos = useMemo(() => {
    const rodada = Number.isInteger(execucao?.rodada) ? execucao.rodada : null;
    const total = totalDeRegistros(execucao);
    const acoes = analise?.estatisticas?.ativos_analisados;
    return {
      processamento:
        rodada !== null
          ? {
              antes: t.vivoAtualizacao.antes,
              valor: rodada,
              depois: t.vivoAtualizacao.depois(horaBR(execucao?.inicio), horaBR(execucao?.fim)),
            }
          : null,
      api: total !== null ? { antes: t.vivoRegistros.antes, valor: total, depois: t.vivoRegistros.depois } : null,
      interface: eNumero(acoes) ? { antes: t.vivoAcoes.antes, valor: acoes, depois: t.vivoAcoes.depois } : null,
    };
  }, [execucao, analise, t]);

  return (
    <section
      className="secao modelo-fluxo"
      data-brilho="dado"
      aria-labelledby="modelo-fluxo-titulo"
      data-anima={animar}
      style={{ '--intervalo': `${INTERVALO_DESTAQUE_MS}ms` }}
    >
      <h2 id="modelo-fluxo-titulo" className="modelo-titulo">
        {t.titulo}
      </h2>
      <p className="modelo-intro">{t.intro}</p>

      <ol className="trilho" aria-label={t.lista} ref={trilho} data-fase={fase}>
        {t.etapas.map((etapa, i) => {
          const vivo = vivos[etapa.chave];
          const Icone = ICONES[etapa.chave];
          return (
            <li
              key={etapa.chave}
              className="estacao"
              data-final={etapa.chave === 'interface'}
              data-ativo={ativo === i}
              style={{ '--i': i, '--atraso': i > 0 ? '1.6s' : '0s' }}
            >
              <div className="estacao__cartao">
                <span className="estacao__anel" aria-hidden="true" />
                <span className="estacao__progresso" aria-hidden="true" />
                <span className="estacao__cabeca">
                  <span className="estacao__marcador" aria-hidden="true">
                    <Icone size={16} strokeWidth={2.25} />
                  </span>
                  {etapa.horario && <span className="estacao__hora">{etapa.horario}</span>}
                </span>
                <h3 className="estacao__nome">{etapa.nome}</h3>
                <p className="estacao__texto">{etapa.texto}</p>
                <div className="estacao__transforma">
                  <span className="sr-only">{`${t.entraRotulo}: ${etapa.entra}. ${t.saiRotulo}: ${etapa.sai}.`}</span>
                  <span className="estacao__pilula estacao__pilula--entra" aria-hidden="true">
                    <Inbox size={14} strokeWidth={2.25} />
                    {etapa.entra}
                  </span>
                  <ArrowRight className="estacao__seta" size={16} strokeWidth={2.25} aria-hidden="true" />
                  <span className="estacao__pilula estacao__pilula--sai" aria-hidden="true">
                    <Package size={14} strokeWidth={2.25} />
                    {etapa.sai}
                  </span>
                </div>
                {etapa.fontes && (
                  <ul className="estacao__fontes">
                    {etapa.fontes.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                )}
                {etapa.chave === 'api' && (
                  <p className="estacao__pacotes">
                    <span className="estacao__pacotes-rotulo">{t.pacotesRotulo}</span>
                    {Object.values(TEXTOS.dados.pacotes).join(', ')}
                  </p>
                )}
                {vivo && (
                  <p className="estacao__vivo">
                    {vivo.antes}
                    <NumeroAnimado key={fase} valor={vivo.valor} formatar={inteiroTexto} ausente="" />
                    {vivo.depois}
                  </p>
                )}
              </div>
              {i < t.etapas.length - 1 && (
                <span className="estacao__ligacao" aria-hidden="true">
                  <span className="estacao__pacote">
                    <Package size={12} strokeWidth={2.5} />
                  </span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
