import { useMemo } from 'react';
import { useFundamentos } from '../../hooks/useDados.js';
import { montarBalancos } from '../../lib/balancos.js';
import { TEXTOS } from '../../lib/textos.js';
import { BlocoErro, BlocoVazio, Linhas } from '../ui/Estados.jsx';

/** Balanços trimestrais da ficha (nível técnico, na pergunta "Ela deve muito?"): 8 trimestres, um por coluna. */
export function PainelBalancos({ ticker }) {
  const fundamentos = useFundamentos(ticker);
  const tabela = useMemo(() => montarBalancos(fundamentos.data), [fundamentos.data]);

  if (fundamentos.isError) {
    return (
      <BlocoErro
        titulo={TEXTOS.ficha.balancosIndisponiveis}
        mensagem={fundamentos.error?.mensagemUsuario}
        onTentarNovamente={fundamentos.refetch}
      />
    );
  }
  if (fundamentos.isPending) return <Linhas quantidade={6} />;
  if (tabela.colunas.length === 0) return <BlocoVazio titulo={TEXTOS.ficha.semBalancos} />;

  return (
    <>
      <div className="ficha-rolagem" role="region" aria-label={TEXTOS.ficha.balancosRegiao} tabIndex={0}>
        <table className="ficha-tab">
          <caption className="sr-only">{TEXTOS.ficha.balancos}</caption>
          <thead>
            <tr>
              <th scope="col">{TEXTOS.ficha.indicador}</th>
              {tabela.colunas.map((coluna) => (
                <th scope="col" key={coluna.data} className="ficha-tab-num">
                  <span className="ficha-tri">{coluna.rotulo}</span>
                  {coluna.entrega && <span className="ficha-entrega">{TEXTOS.ficha.entregue(coluna.entrega)}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabela.linhas.map((linha) => (
              <tr key={linha.id}>
                <th scope="row">{linha.rotulo}</th>
                {linha.celulas.map((celula, i) => (
                  <td key={tabela.colunas[i].data} className="ficha-tab-num" title={celula.motivo || undefined}>
                    {celula.texto}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ficha-nota">{TEXTOS.ficha.balancosNota}</p>
    </>
  );
}
