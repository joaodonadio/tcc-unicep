import { useMemo } from 'react';
import { usePreferencias } from '../../context/contextos.js';
import { useResumo } from '../../hooks/useDados.js';
import { EXPLICACOES } from '../../lib/explicacoes.js';
import { montarIndicadoresFicha, montarLinhasTecnicas } from '../../lib/fichaIndicadores.js';
import { TEXTOS } from '../../lib/textos.js';
import { BotaoTermo } from '../ui/BotaoTermo.jsx';
import { BlocoErro, Linhas } from '../ui/Estados.jsx';

const I = TEXTOS.ficha.indicadores;

/** Nome do indicador; com entrada no glossário vira botão que abre o termo. */
function NomeComTermo({ rotulo, chave }) {
  return EXPLICACOES[chave] ? <BotaoTermo chave={chave}>{rotulo}</BotaoTermo> : rotulo;
}

/**
 * Nível simples: um bloco de leitura por indicador. Nome, valor grande, uma frase comparando
 * com o setor e "Como ler" (texto simples do glossário).
 */
function BlocoLeitura({ indicador }) {
  const { rotulo, texto, motivo, complemento, setor_valor_texto, barras, texto_api, nota, explicacao, comparacao } =
    indicador;
  const frase = comparacao && setor_valor_texto ? I.comparacao[comparacao.situacao](setor_valor_texto) : texto_api;

  return (
    <article className="ficha-leitura">
      <h3 className="ficha-leitura-nome">
        <NomeComTermo rotulo={rotulo} chave={explicacao} />
      </h3>
      <p className="ficha-leitura-valor">{texto}</p>
      {motivo && <p className="valor-motivo">{motivo}</p>}
      {complemento && <p className="ficha-leitura-frase">{complemento}</p>}
      {frase && <p className="ficha-leitura-frase">{frase}</p>}
      {I.origem[explicacao] && (
        <p className="ficha-leitura-origem">
          <span className="ficha-leitura-como-rotulo">{I.origemRotulo}</span> {I.origem[explicacao]}
        </p>
      )}
      {barras && (
        <div className="ficha-comparacao">
          <span className="ficha-barra-nome">{TEXTOS.ficha.barraAcao}</span>
          <span className="ficha-barra-trilha" aria-hidden="true">
            <span className="ficha-barra-acao" style={{ '--v': barras.acao / 100 }} />
          </span>
          <span className="ficha-barra-valor">{texto}</span>
          <span className="ficha-barra-nome">{TEXTOS.ficha.barraSetor}</span>
          <span className="ficha-barra-trilha" aria-hidden="true">
            <span className="ficha-barra-setor" style={{ '--v': barras.setor / 100 }} />
          </span>
          <span className="ficha-barra-valor">{setor_valor_texto}</span>
        </div>
      )}
      {nota && <p className="ficha-nota">{nota}</p>}
      <p className="ficha-leitura-como">
        <span className="ficha-leitura-como-rotulo">{I.comoLer}</span> {EXPLICACOES[explicacao].simples}
      </p>
    </article>
  );
}

/** Nível técnico: uma tabela só, com ação, mediana do setor, diferença e situação. */
function TabelaTecnica({ linhas }) {
  const origens = linhas
    .filter((l) => I.origem[l.explicacao])
    .map((l) => ({ id: l.id, rotulo: l.rotulo, origem: I.origem[l.explicacao] }));
  return (
    <div className="ficha-rolagem" role="region" aria-label={I.regiao} tabIndex={0}>
      <table className="ficha-tab">
        <caption className="sr-only">{I.tabela}</caption>
        <thead>
          <tr>
            <th scope="col">{I.colIndicador}</th>
            <th scope="col" className="ficha-tab-num">
              {I.colAcao}
            </th>
            <th scope="col" className="ficha-tab-num">
              {I.colSetor}
            </th>
            <th scope="col" className="ficha-tab-num">
              {I.colDiferenca}
            </th>
            <th scope="col">{I.colSituacao}</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => (
            <tr key={l.id}>
              <th scope="row">
                <span title={EXPLICACOES[l.explicacao]?.tecnico ?? EXPLICACOES[l.explicacao]?.simples}>
                  <NomeComTermo rotulo={l.rotulo} chave={l.explicacao} />
                </span>
              </th>
              <td className="ficha-tab-num">
                {l.acao}
                {l.motivo && <span className="valor-motivo ficha-tab-motivo">{l.motivo}</span>}
              </td>
              <td className="ficha-tab-num">{l.setor}</td>
              <td className="ficha-tab-num">{l.diferenca}</td>
              <td>{l.situacao ? I.situacao[l.situacao] : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {origens.length > 0 && (
        <ul className="ficha-origens" aria-label={I.origemLista}>
          {origens.map((o) => (
            <li key={o.id}>
              <strong>{o.rotulo}</strong> {o.origem}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Indicadores de uma pergunta (chaves vêm de chavesDaPergunta): blocos de leitura no simples, tabela no técnico. */
export function PainelIndicadores({ ticker, chaves }) {
  const { nivel } = usePreferencias();
  const resumo = useResumo(ticker);
  const indicadores = useMemo(() => montarIndicadoresFicha(resumo.data), [resumo.data]);
  const linhas = useMemo(
    () => (nivel === 'tecnico' ? montarLinhasTecnicas(resumo.data, chaves) : []),
    [nivel, resumo.data, chaves],
  );

  if (resumo.isError) {
    return (
      <BlocoErro
        titulo={TEXTOS.estados.erroTitulo}
        mensagem={resumo.error?.mensagemUsuario}
        onTentarNovamente={resumo.refetch}
      />
    );
  }
  if (resumo.isPending) return <Linhas quantidade={3} />;

  if (nivel === 'tecnico') {
    return linhas.length === 0 ? null : <TabelaTecnica linhas={linhas} />;
  }

  const escolhidos = indicadores.filter((i) => chaves.includes(i.chave));
  if (escolhidos.length === 0) return null;

  return (
    <div className="ficha-leituras">
      {escolhidos.map((indicador) => (
        <BlocoLeitura key={indicador.chave} indicador={indicador} />
      ))}
    </div>
  );
}
