import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Termo } from './Termo.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';
import { IconeSetor } from '../ui/IconeSetor.jsx';
import { useAcoes, useResumos } from '../../hooks/useDados.js';
import { numero, numeroCompacto, pct } from '../../lib/formato.js';
import {
  buscarLinhas,
  compararVolume,
  destaquePorSetor,
  linhasDeVolume,
  sinalDoTexto,
} from '../../lib/mercadoTela.js';
import { PASSO } from '../../lib/listaAcoes.js';
import { TEXTOS } from '../../lib/textos.js';

const AUSENTE = (
  <>
    <span aria-hidden="true">{TEXTOS.mercado.traco}</span>
    <span className="sr-only">{TEXTOS.mercado.indisponivel}</span>
  </>
);

const compacto = (v) => (v == null ? '' : numeroCompacto(v));
const vezesTexto = (v) => (v == null ? '' : TEXTOS.mercado.vezesNormal(numero(v, { casas: 1 })));

/** Variação do dia em pílula; sem dado, o traço com o motivo para leitor de tela. */
function Pilula({ variacao }) {
  const texto = variacao == null ? '' : pct(variacao);
  if (!texto) return AUSENTE;
  return (
    <span className="mercado-pilula" data-sinal={sinalDoTexto(texto)}>
      {texto}
    </span>
  );
}

/** Acima de 1,5 vez a mediana, o número das vezes ganha destaque em branco (cor de acento, em negrito). */
const LIMITE_FORTE = 1.5;

/**
 * Uma linha do ranking por setor: ícone, setor, ação (link para a ficha), variação do dia,
 * volume com barra proporcional ao maior volume do ranking, e vezes o normal à direita.
 */
function LinhaSetor({ linha, maximo }) {
  const largura = maximo > 0 ? (linha.volume / maximo) * 100 : 0;
  const forte = linha.relativo != null && linha.relativo >= LIMITE_FORTE;
  return (
    <li className="mercado-ranking__item">
      <IconeSetor setor={linha.setor} />
      <div className="mercado-ranking__quem">
        <span className="mercado-ranking__setor">{linha.setor}</span>
        <span className="mercado-ranking__acao">
          <Link to={`/acao/${linha.ticker}`} className="mercado-ranking__ticker">
            {linha.ticker}
          </Link>
          {linha.empresa && <span className="mercado-empresa">{linha.empresa}</span>}
        </span>
      </div>
      <Pilula variacao={linha.variacao} />
      <div className="mercado-ranking__volume">
        <span className="mercado-ranking__numero">
          <span className="sr-only">{TEXTOS.mercado.volumeDoDia}: </span>
          {compacto(linha.volume)}
        </span>
        <span className="mercado-ranking__barra" aria-hidden="true">
          <span style={{ width: `${largura}%` }} />
        </span>
        <span className={forte ? 'mercado-ranking__vezes mercado-ranking__vezes--forte' : 'mercado-ranking__vezes'}>
          {vezesTexto(linha.relativo) || AUSENTE}
        </span>
      </div>
    </li>
  );
}

/**
 * Aba "Destaques": a ação mais negociada de cada setor e uma lista de todas as ações
 * com busca, ordenável pelo volume do dia (15 por vez).
 */
export function DestaquesDoPregao() {
  const resumos = useResumos();
  const acoes = useAcoes();
  const [busca, setBusca] = useState('');
  const [direcao, setDirecao] = useState('descending');
  const [mostrar, setMostrar] = useState({ chave: '', n: PASSO });

  const linhas = useMemo(
    () => (resumos.data && acoes.data ? linhasDeVolume(resumos.data, acoes.data) : null),
    [resumos.data, acoes.data],
  );
  const setores = useMemo(() => destaquePorSetor(linhas ?? []), [linhas]);
  const maximoVolumeSetor = Math.max(0, ...setores.map((s) => s.volume ?? 0));

  const termo = busca.trim();
  const chave = `${termo}|${direcao}`;
  const quantas = mostrar.chave === chave ? mostrar.n : PASSO;
  const filtradas = useMemo(
    () => [...buscarLinhas(linhas ?? [], termo)].sort(compararVolume(direcao)),
    [linhas, termo, direcao],
  );

  if (resumos.isError || acoes.isError) {
    return (
      <BlocoErro
        mensagem={TEXTOS.mercado.termosVolumeErro}
        onTentarNovamente={() => {
          resumos.refetch();
          acoes.refetch();
        }}
      />
    );
  }
  if (!linhas) {
    return (
      <div role="status">
        <span className="sr-only">{TEXTOS.mercado.carregando}</span>
        <Linhas quantidade={6} />
      </div>
    );
  }

  const visiveis = filtradas.slice(0, quantas);
  const proximoPasso = Math.min(PASSO, filtradas.length - visiveis.length);

  return (
    <>
      <section className="mercado-destaque-setores" data-brilho="acento" aria-labelledby="mercado-setores-destaque">
        <h3 id="mercado-setores-destaque" className="mercado-bloco-titulo">
          {TEXTOS.mercado.destaqueSetorTitulo}
        </h3>
        <p className="mercado-nota">{TEXTOS.mercado.destaqueSetorTexto}</p>
        {setores.length > 0 ? (
          <ol className="mercado-ranking">
            {setores.map((l) => (
              <LinhaSetor key={l.setor} linha={l} maximo={maximoVolumeSetor} />
            ))}
          </ol>
        ) : (
          <p className="mercado-vazio">{TEXTOS.mercado.destaqueSetorVazio}</p>
        )}
      </section>

      <section className="mercado-busca-volume" aria-labelledby="mercado-busca-titulo">
        <h3 id="mercado-busca-titulo" className="mercado-bloco-titulo">
          {TEXTOS.mercado.buscaTitulo}
        </h3>
        <p className="mercado-nota">{TEXTOS.mercado.buscaTexto}</p>
        <label className="lista-busca">
          <Search className="lista-busca__icone" size={18} strokeWidth={2} aria-hidden="true" />
          <span className="sr-only">{TEXTOS.mercado.buscaRotulo}</span>
          <input
            type="search"
            value={busca}
            placeholder={TEXTOS.mercado.buscaExemplo}
            autoComplete="off"
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>

        {filtradas.length === 0 ? (
          <p className="mercado-vazio">{TEXTOS.mercado.semResultado}</p>
        ) : (
          <>
            <div className="mercado-rolagem" role="region" aria-label={TEXTOS.mercado.volumeTabela} tabIndex={0}>
              <table className="tabela mercado-tabela">
                <caption className="sr-only">{TEXTOS.mercado.volumeTabela}</caption>
                <thead>
                  <tr>
                    <th scope="col">{TEXTOS.mercado.colAcao}</th>
                    <th scope="col" className="num" aria-sort={direcao}>
                      <button
                        type="button"
                        className="mercado-ordem"
                        onClick={() => setDirecao((d) => (d === 'descending' ? 'ascending' : 'descending'))}
                      >
                        {TEXTOS.mercado.colVolume}
                      </button>
                    </th>
                    <th scope="col" className="num">
                      <Termo chave="mediana">{TEXTOS.mercado.colMediana}</Termo>
                    </th>
                    <th scope="col" className="num">
                      <Termo chave="volume_relativo">{TEXTOS.mercado.colVezes}</Termo>
                    </th>
                    <th scope="col" className="num">
                      {TEXTOS.mercado.colVariacaoDia}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((l) => (
                    <tr key={l.ticker}>
                      <th scope="row">
                        <Link to={`/acao/${l.ticker}`}>{l.ticker}</Link>
                        {l.empresa && <span className="mercado-nivel">{l.empresa}</span>}
                      </th>
                      <td className="num">{compacto(l.volume) || AUSENTE}</td>
                      <td className="num">{compacto(l.mediana) || AUSENTE}</td>
                      <td className="num">{l.relativo == null ? AUSENTE : numero(l.relativo, { casas: 1 })}</td>
                      <td className="num">
                        <Pilula variacao={l.variacao} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mercado-nota mercado-nota--rodape">
              {TEXTOS.mercado.mostrandoDe(visiveis.length, filtradas.length)}
            </p>
            {proximoPasso > 0 && (
              <button type="button" className="botao" onClick={() => setMostrar({ chave, n: quantas + PASSO })}>
                {TEXTOS.mercado.mostrarMais(proximoPasso)}
              </button>
            )}
          </>
        )}
      </section>
    </>
  );
}
