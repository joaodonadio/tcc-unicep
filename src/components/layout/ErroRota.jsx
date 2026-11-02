import { useRouteError } from 'react-router-dom';
import { BlocoErro } from '../ui/Estados.jsx';
import { TEXTOS } from '../../lib/textos.js';

const FALHA_DE_CARGA = /dynamically imported module|Importing a module script failed|error loading dynamically/i;

/** Tela de erro de rota: fica dentro do Outlet (mantém cabeçalho e rodapé) e oferece recarregar. */
export function ErroRota() {
  const erro = useRouteError();
  if (import.meta.env.DEV) console.error(erro);
  const versaoNova = FALHA_DE_CARGA.test(String(erro?.message ?? ''));
  return (
    <div className="pagina">
      <BlocoErro
        nivel={1}
        titulo={TEXTOS.estados.erroPaginaTitulo}
        mensagem={versaoNova ? TEXTOS.estados.erroVersaoNova : TEXTOS.estados.erroPaginaTexto}
        onTentarNovamente={() => window.location.reload()}
      />
    </div>
  );
}
