import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import Ficha from '../../pages/Ficha.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';

vi.mock('../../hooks/useDados.js', async () => {
  // Balanços reais: PETR4 tem 8 trimestres; ASAI3 não tem balanço no pacote.
  const { readFileSync } = await import('node:fs');
  const path = await import('node:path');
  const fundamentos = JSON.parse(
    readFileSync(path.join(process.cwd(), 'public', 'dados', 'fundamentos_trimestrais.json'), 'utf8'),
  ).registros;
  const COM_RESUMO = ['PETR4', 'ASAI3'];
  return {
    useAcoes: () => ({
      data: [
        {
          ticker: 'PETR4',
          empresa: 'Petrobras',
          setor: 'Petróleo, Gás e Biocombustíveis',
          subsetor: 'Exploração, Refino e Distribuição',
          tipo_acao: 'PN',
          ativo_no_universo: true,
        },
        {
          ticker: 'ASAI3',
          empresa: 'Assaí',
          setor: 'Consumo não Cíclico',
          subsetor: 'Comércio e Distribuição',
          tipo_acao: 'ON',
          ativo_no_universo: true,
        },
      ],
      isSuccess: true,
      isPending: false,
      isError: false,
    }),
    useProventos: () => ({ data: [], isSuccess: true, isPending: false, isError: false, refetch: () => {} }),
    useFundamentos: (ticker) => ({
      data: fundamentos.filter((f) => f.ticker === ticker),
      isSuccess: true,
      isPending: false,
      isError: false,
      refetch: () => {},
    }),
    useSerie: () => ({ data: null, isSuccess: true, isPending: false, isError: false, refetch: () => {} }),
    useResumo: (ticker) =>
      COM_RESUMO.includes(ticker)
        ? {
            data: {
              ticker,
              data_referencia: '2026-10-26',
              setor_comparacao_fraca: ticker === 'ASAI3',
              cotacao: {
                fechamento: { valor: 53.88, status: 'ok' },
                variacao_dia: { valor: -0.0818, status: 'ok' },
              },
            },
            isSuccess: true,
            isPending: false,
            isError: false,
            refetch: () => {},
          }
        : { data: null, isSuccess: true, isPending: false, isError: false, refetch: () => {} },
  };
});

vi.mock('../../components/ficha/PorQueApareceu.jsx', () => ({
  PorQueApareceu: () => <p>conteúdo regras</p>,
}));
vi.mock('../../components/ficha/PainelIndicadores.jsx', () => ({
  PainelIndicadores: () => <p>conteúdo indicadores</p>,
}));
vi.mock('../../components/ficha/PainelBalancos.jsx', () => ({
  PainelBalancos: () => <p>extra balanços</p>,
}));
vi.mock('../../components/ficha/PainelHistorico.jsx', () => ({
  PainelHistorico: () => <p>extra histórico</p>,
}));
vi.mock('../../components/ficha/PainelProventos.jsx', () => ({
  PainelProventos: () => <p>conteúdo proventos</p>,
}));
vi.mock('../../components/ficha/PainelPreco.jsx', () => ({
  PainelPreco: () => <p>conteúdo preço</p>,
}));
vi.mock('../../components/ficha/PainelNoticias.jsx', () => ({
  PainelNoticias: () => <p>conteúdo notícias</p>,
}));

const CHAVE_PREFERENCIAS = 'painel-b3:preferencias';

function renderizarFicha(caminho) {
  return renderizar(
    <Routes>
      <Route path="/acao/:ticker" element={<Ficha />} />
    </Routes>,
    { rota: caminho },
  );
}

const aba = (nome) => screen.getByRole('tab', { name: nome });

describe('ficha da ação por perguntas /acao/:ticker', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('deep link ?pergunta=divida seleciona a pergunta certa', () => {
    renderizarFicha('/acao/PETR4?pergunta=divida');
    expect(aba(/Dívida/)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { level: 2, name: porNivel(TEXTOS.ficha.perguntas.divida.titulo, 'simples') })).toBeInTheDocument();
    expect(screen.getByText('conteúdo indicadores')).toBeInTheDocument();
  });

  it('id inválido cai em Regras', () => {
    renderizarFicha('/acao/PETR4?pergunta=xyz');
    expect(aba(/Regras/)).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('conteúdo regras')).toBeInTheDocument();
  });

  it('?aba=balancos antigo vira Dívida', () => {
    renderizarFicha('/acao/PETR4?aba=balancos');
    expect(aba(/Dívida/)).toHaveAttribute('aria-selected', 'true');
  });

  it('as abas navegam por clique e por teclado, sem botões de próxima e anterior', () => {
    renderizarFicha('/acao/PETR4?pergunta=regras');
    expect(screen.queryByText(/Próxima pergunta|Pergunta anterior|Você está aqui/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(7);
    expect(aba(/Regras/)).toHaveAttribute('aria-controls', 'painel-regras');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('id', 'painel-regras');

    fireEvent.click(aba(/Dívida/));
    expect(aba(/Dívida/)).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(aba(/Dívida/), { key: 'ArrowRight' });
    expect(aba(/Está cara\?/)).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(aba(/Está cara\?/), { key: 'End' });
    expect(aba(/Notícias/)).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(aba(/Notícias/), { key: 'Home' });
    expect(aba(/Regras/)).toHaveAttribute('aria-selected', 'true');
  });

  it('o número do fundamento abre a aba da pergunta', () => {
    renderizarFicha('/acao/PETR4?pergunta=regras');
    fireEvent.click(screen.getByRole('link', { name: /Dividend yield.*Abrir a pergunta/ }));
    expect(aba(/Proventos/)).toHaveAttribute('aria-selected', 'true');
  });

  it('no nível técnico a pergunta mostra os extras', () => {
    localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizarFicha('/acao/PETR4?pergunta=divida');
    expect(screen.getByText('extra balanços')).toBeInTheDocument();
    expect(screen.queryByText(TEXTOS.ficha.tecnicoNota)).not.toBeInTheDocument();
  });

  it('no nível simples os extras somem e a nota técnica aparece', () => {
    renderizarFicha('/acao/PETR4?pergunta=divida');
    expect(screen.queryByText('extra balanços')).not.toBeInTheDocument();
    expect(screen.getByText(TEXTOS.ficha.tecnicoNota)).toBeInTheDocument();
  });

  it('Guardar alterna aria-pressed', () => {
    renderizarFicha('/acao/PETR4?pergunta=regras');
    const botao = screen.getByRole('button', { name: /Guardar PETR4/ });
    expect(botao).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(botao);
    // o nome acessível é fixo ("Guardar PETR4"); o estado vai só em aria-pressed
    expect(botao).toHaveAttribute('aria-pressed', 'true');
  });

  it('ticker inexistente mostra a mensagem de não encontrada', () => {
    renderizarFicha('/acao/XPTO3');
    expect(screen.getByText(TEXTOS.ficha.naoEncontrada)).toBeInTheDocument();
  });

  it('na pergunta "Está cara?" aparece o gráfico de receita e lucro com balanço', () => {
    renderizarFicha('/acao/PETR4?pergunta=cara');
    expect(screen.getByRole('heading', { level: 3, name: TEXTOS.ficha.resultadoTitulo })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: TEXTOS.ficha.dividaEbitdaTitulo })).not.toBeInTheDocument();
  });

  it('na pergunta "Ela deve muito?" aparece o gráfico de dívida sobre EBITDA nos dois níveis', () => {
    renderizarFicha('/acao/PETR4?pergunta=divida');
    expect(screen.getByRole('heading', { level: 3, name: TEXTOS.ficha.dividaEbitdaTitulo })).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.ficha.dividaEbitdaTexto)).toBeInTheDocument();
  });

  it('ação sem balanço mostra o vazio no lugar do gráfico de receita', () => {
    renderizarFicha('/acao/ASAI3?pergunta=cara');
    expect(screen.getByText(TEXTOS.ficha.semBalancos)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: TEXTOS.ficha.resultadoTitulo })).not.toBeInTheDocument();
  });

  it('o cabeçalho mostra empresa, subsetor e o tipo curto, com a explicação no title', () => {
    renderizarFicha('/acao/PETR4?pergunta=regras');
    expect(screen.getByRole('heading', { level: 1, name: 'PETR4' })).toBeInTheDocument();
    expect(screen.getByText('Petrobras')).toBeInTheDocument();
    expect(screen.getByText('Exploração, Refino e Distribuição')).toBeInTheDocument();
    expect(screen.getByTitle(TEXTOS.ficha.tipoAcao.PN)).toHaveTextContent('PN');
    cleanup();

    renderizarFicha('/acao/ASAI3?pergunta=regras');
    expect(screen.getByTitle(TEXTOS.ficha.tipoAcao.ON)).toHaveTextContent('ON');
  });

  it('o cabeçalho mostra o preço e a variação do dia', () => {
    renderizarFicha('/acao/PETR4?pergunta=regras');
    expect(screen.getByText(/R\$\s53,88/)).toBeInTheDocument();
    expect(screen.getByText(/8,2% no dia/)).toBeInTheDocument();
  });

  it('nota de setor com poucas empresas aparece em dívida e preço, mas não quando a comparação vale', () => {
    renderizarFicha('/acao/ASAI3?pergunta=divida');
    expect(screen.getByText(TEXTOS.ficha.setorFraco)).toBeInTheDocument();
    cleanup();

    renderizarFicha('/acao/ASAI3?pergunta=cara');
    expect(screen.getByText(TEXTOS.ficha.setorFraco)).toBeInTheDocument();
    cleanup();

    renderizarFicha('/acao/PETR4?pergunta=divida');
    expect(screen.queryByText(TEXTOS.ficha.setorFraco)).not.toBeInTheDocument();
  });

  it('no nível simples o histórico aparece na pergunta "Está cara?"', () => {
    renderizarFicha('/acao/PETR4?pergunta=cara');
    expect(screen.getByText('extra histórico')).toBeInTheDocument();
  });
});
