import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SecaoSobreDados from '../components/dados/SecaoSobreDados.jsx';
import { TEXTOS } from '../lib/textos.js';
import { movimentoReduzido } from '../lib/movimento.js';

/** Página Sobre os dados: o que chegou na última atualização, avisos e fontes. */
export default function Dados() {
  const { hash } = useLocation();

  useEffect(() => {
    document.title = TEXTOS.paginas.tituloDocumento(TEXTOS.paginas.dados);
  }, []);

  // Link "como é feito" (selo de conta): rola até a conta indicada pela âncora
  useEffect(() => {
    if (!hash.startsWith('#conta-')) return;
    const alvo = document.getElementById(hash.slice(1));
    alvo?.scrollIntoView({ block: 'start', behavior: movimentoReduzido() ? 'auto' : 'smooth' });
  }, [hash]);

  return (
    <div className="pagina">
      <SecaoSobreDados nivelTitulo={1} />
    </div>
  );
}
