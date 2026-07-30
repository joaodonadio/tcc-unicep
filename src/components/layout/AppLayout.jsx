import { Outlet, ScrollRestoration } from 'react-router-dom';
import { PreferenciasProvider } from '../../context/PreferenciasProvider.jsx';
import { DecisoesProvider } from '../../context/DecisoesProvider.jsx';
import { TourProvider } from '../../context/TourProvider.jsx';
import { FundoAmbiente } from './FundoAmbiente.jsx';
import { Navbar } from './Navbar.jsx';
import { Rodape } from './Rodape.jsx';
import { ControlesExperiencia } from '../experiencia/ControlesExperiencia.jsx';
import { BotaoAjuda } from '../experiencia/BotaoAjuda.jsx';
import { TourGuiado } from '../experiencia/TourGuiado.jsx';

/**
 * Layout único: navbar, rodapé e a camada de experiência montam uma só vez e
 * sobrevivem à troca de rota — por isso o Modo Calmo, o zoom e o tour são
 * transversais às 4 telas sem nenhum estado global de servidor.
 */
export function AppLayout() {
  return (
    <PreferenciasProvider>
      <DecisoesProvider>
        <TourProvider>
          {/* trocar de tela leva ao topo da nova tela, em vez de manter a
              rolagem da anterior (o Data Router não faz isso sozinho) */}
          <ScrollRestoration />
          <FundoAmbiente />
          <Navbar />
          <Outlet />
          <Rodape />
          <ControlesExperiencia />
          <BotaoAjuda />
          <TourGuiado />
        </TourProvider>
      </DecisoesProvider>
    </PreferenciasProvider>
  );
}
