import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChartCandlestick, Ellipsis, House, LayoutGrid, TrendingUp } from 'lucide-react';
import { useMetaPublicacao } from '../../hooks/useMetaPublicacao.js';
import { usePresenca } from '../../hooks/usePresenca.js';
import { dataBR } from '../../lib/datas.js';
import { TEXTO_EXECUCAO, TEXTOS } from '../../lib/textos.js';
import ControlesLeitura from './ControlesLeitura.jsx';
import Logo from '../ui/Logo.jsx';

/**
 * Páginas do menu, na ordem em que aparecem. Hoje é a rota "/", então usa end para não ficar ativa nas outras.
 * No celular a barra inferior mostra as quatro primeiras e o menu Mais; as marcadas com extra vão para o Mais.
 * Entre 720px e 1280px as páginas marcadas com extra também vão para o Mais, porque não cabem na linha.
 */
const PAGINAS = [
  { id: 'hoje', caminho: '/', end: true, Icone: House },
  { id: 'mercado', caminho: '/mercado', Icone: TrendingUp },
  { id: 'setores', caminho: '/setores', Icone: LayoutGrid },
  { id: 'acoes', caminho: '/acoes', Icone: ChartCandlestick },
  { id: 'proventos', caminho: '/proventos', extra: true },
  { id: 'noticias', caminho: '/noticias', extra: true },
  { id: 'modelo', caminho: '/modelo', extra: true },
  { id: 'dados', caminho: '/dados', extra: true },
];

const EXTRAS = PAGINAS.filter((pagina) => pagina.extra);

/** Cabeçalho fixo: marca, páginas e leitura. O aviso de atualização só aparece quando algo falhou. */
export default function Cabecalho() {
  const { data: analise } = useMetaPublicacao();
  const { pathname } = useLocation();
  const [maisAberto, setMaisAberto] = useState(false);
  // o menu fica montado até a saída terminar (usePresenca)
  const menuPresente = usePresenca(maisAberto);
  const refMais = useRef(null);
  const refBotaoMais = useRef(null);

  // o menu Mais fecha ao trocar de página, com Esc (devolvendo o foco ao botão) e ao tocar fora dele
  useEffect(() => setMaisAberto(false), [pathname]);
  useEffect(() => {
    if (!maisAberto) return undefined;
    const aoTeclar = (e) => {
      if (e.key !== 'Escape') return;
      setMaisAberto(false);
      refBotaoMais.current?.focus();
    };
    const aoTocar = (e) => {
      if (refMais.current && !refMais.current.contains(e.target)) setMaisAberto(false);
    };
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoTocar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoTocar);
    };
  }, [maisAberto]);

  // o status só aparece quando a atualização não está ok
  const status = analise?.status_execucao;
  const statusTexto =
    status && status !== 'ok'
      ? (TEXTO_EXECUCAO[status] ?? '').replace('{data}', dataBR(analise?.data_referencia))
      : '';

  return (
    <header className="cabecalho">
      <div className="cabecalho__linha pagina">
        <Link className="cabecalho__marca" to="/" viewTransition>
          <Logo />
        </Link>

        <nav className="cabecalho__nav" aria-label={TEXTOS.cabecalho.navegacao}>
          <ul>
            {PAGINAS.map(({ id, caminho, end, extra, Icone }) => (
              <li key={id} data-extra={extra ? 'true' : undefined}>
                <NavLink className="cabecalho__ancora" to={caminho} end={end} viewTransition>
                  {Icone && (
                    <Icone className="cabecalho__icone" aria-hidden="true" focusable="false" />
                  )}
                  {TEXTOS.cabecalho.paginas[id]}
                </NavLink>
              </li>
            ))}
            <li className="cabecalho__mais-li" ref={refMais}>
              <button
                ref={refBotaoMais}
                type="button"
                className="cabecalho__mais"
                aria-expanded={maisAberto}
                aria-controls={maisAberto ? 'menu-mais' : undefined}
                aria-label={TEXTOS.cabecalho.maisRotulo}
                onClick={() => setMaisAberto((aberto) => !aberto)}
              >
                <Ellipsis className="cabecalho__icone" aria-hidden="true" focusable="false" />
                {TEXTOS.cabecalho.mais}
              </button>
              {menuPresente && (
                <ul
                  id="menu-mais"
                  className="cabecalho__menu-mais"
                  data-estado={maisAberto ? 'entrando' : 'saindo'}
                  inert={maisAberto ? undefined : ''}
                >
                  {EXTRAS.map(({ id, caminho }) => (
                    <li key={id}>
                      <NavLink className="cabecalho__ancora" to={caminho} viewTransition>
                        {TEXTOS.cabecalho.paginas[id]}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          </ul>
        </nav>

        <div className="cabecalho__acoes">
          <ControlesLeitura />
        </div>
      </div>
      {/* aviso de atualização numa faixa própria: não disputa espaço com o menu nem com Leitura */}
      {statusTexto && (
        <div className="cabecalho__aviso" role="status">
          <p className="pagina">
            <span>{statusTexto}</span>{' '}
            <Link to="/dados" viewTransition>
              {TEXTOS.cabecalho.avisoDetalhes}
            </Link>
          </p>
        </div>
      )}
    </header>
  );
}
