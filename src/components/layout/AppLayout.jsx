import { useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { PreferenciasProvider } from '../../context/PreferenciasProvider.jsx';
import { ListaProvider } from '../../context/ListaProvider.jsx';
import Cabecalho from './Cabecalho.jsx';
import AvisoMovimento from './AvisoMovimento.jsx';
import { Rodape } from './Rodape.jsx';
import { FundoPontos } from './FundoPontos.jsx';
import { TEXTOS } from '../../lib/textos.js';

/**
 * Layout único: cabeçalho e rodapé montam uma só vez e sobrevivem à troca de rota.
 * Os providers de preferências e lista ficam aqui.
 */
export function AppLayout() {
  const { pathname, hash } = useLocation();
  const ultimoCaminho = useRef(pathname);

  // ao trocar de tela, o foco vai para o conteúdo (leitor de tela anuncia a nova página);
  // com âncora na URL, a própria âncora manda na rolagem e o foco fica como está
  useEffect(() => {
    if (ultimoCaminho.current === pathname) return;
    ultimoCaminho.current = pathname;
    if (hash) return;
    document.getElementById('conteudo')?.focus({ preventScroll: true });
  }, [pathname, hash]);

  return (
    <PreferenciasProvider>
      <ListaProvider>
        {/* trocar de tela leva ao topo da nova tela, em vez de manter a
            rolagem da anterior (o Data Router não faz isso sozinho) */}
        <ScrollRestoration />
        <FundoPontos />
        <a className="pular-conteudo" href="#conteudo">
          {TEXTOS.cabecalho.pularConteudo}
        </a>
        <Cabecalho />
        {/* fixo no canto inferior: não empurra o conteúdo nem rouba o foco */}
        <AvisoMovimento />
        <main id="conteudo" tabIndex={-1}>
          {/* a chave por rota refaz o wrapper a cada troca de tela, então a entrada suave roda de novo */}
          <div key={pathname} className="rota-entrada">
            <Outlet />
          </div>
        </main>
        <Rodape />
      </ListaProvider>
    </PreferenciasProvider>
  );
}
