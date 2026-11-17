import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import SecaoSobreDados from '../../components/dados/SecaoSobreDados.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import execucaoJson from '../../../public/dados/execucao.json';

const registro = execucaoJson.registros[0];
const CHAVE_PREFERENCIAS = 'painel-b3:preferencias';

const usarNivel = (nivel) => localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ nivel, zoom: 1 }));

/** Bloco da equipe: o botão "Ver detalhes da equipe" controla o painel pelo id. */
const painelEquipe = () =>
  document.getElementById(screen.getByRole('button', { name: TEXTOS.dados.equipe.abrir }).getAttribute('aria-controls'));

describe('SecaoSobreDados', () => {
  beforeEach(() => {
    localStorage.clear();
    instalarFetchDados();
  });

  it('abre com o título e o id de âncora da página inicial', () => {
    const { container } = renderizar(<SecaoSobreDados />);
    expect(container.querySelector('section#dados')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: porNivel(TEXTOS.dados.titulo, 'simples') })).toBeInTheDocument();
  });

  it('mostra carregamento enquanto a atualização não chegou', () => {
    renderizar(<SecaoSobreDados nivelTitulo={1} />);
    expect(screen.getByRole('status')).toHaveTextContent(TEXTOS.dados.carregando);
  });

  describe('Última atualização', () => {
    it('é o primeiro cartão, com a situação concluída e os fatos principais no simples', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      const cartao = (await screen.findByRole('heading', { level: 2, name: TEXTOS.dados.ultima })).closest('section');
      expect(cartao).toHaveAttribute('data-brilho', 'alta');
      expect(within(cartao).getByText(TEXTOS.dados.situacaoPainel.ok)).toBeInTheDocument();
      expect(within(cartao).getByText(TEXTOS.dados.pavio.ok)).toBeInTheDocument();
      expect(within(cartao).getByText(TEXTOS.dados.fatos.pregao)).toBeInTheDocument();
      expect(within(cartao).getAllByText('22/10/2026').length).toBeGreaterThan(0);
      expect(within(cartao).getByText(TEXTOS.dados.fatos.publicado)).toBeInTheDocument();
      expect(within(cartao).getByText('24/10 às 23h25')).toBeInTheDocument();
      expect(within(cartao).getByText(TEXTOS.dados.fatos.atualizacao)).toBeInTheDocument();
      expect(within(cartao).getByText('nº 8')).toBeInTheDocument();
    });

    it('o pavio fica escondido da leitura de tela', async () => {
      const { container } = renderizar(<SecaoSobreDados nivelTitulo={1} />);
      await screen.findByRole('heading', { level: 2, name: TEXTOS.dados.ultima });
      expect(container.querySelector('.dados__pavio')).toHaveAttribute('aria-hidden', 'true');
    });

    it('no simples não mostra o início e o fim da atualização', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      await screen.findByText('nº 8');
      expect(screen.queryByText(TEXTOS.dados.fatos.periodo)).not.toBeInTheDocument();
    });

    it('no técnico mostra também o início e o fim', async () => {
      usarNivel('tecnico');
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(await screen.findByText(TEXTOS.dados.fatos.periodo)).toBeInTheDocument();
      expect(screen.getByText('23h23 a 23h25')).toBeInTheDocument();
    });
  });

  describe('Por onde os dados passam', () => {
    it('mostra coleta, processamento e a API como única fonte', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(await screen.findByRole('heading', { level: 3, name: TEXTOS.dados.origens.coleta.titulo })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: TEXTOS.dados.origens.processamento.titulo })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: TEXTOS.dados.origens.api.titulo })).toBeInTheDocument();
      expect(screen.getByText(porNivel(TEXTOS.dados.origens.api.texto, 'simples'))).toBeInTheDocument();
    });

    it('no simples não cita a Selic', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      await screen.findByRole('heading', { level: 3, name: TEXTOS.dados.origens.coleta.titulo });
      expect(screen.getByText(porNivel(TEXTOS.dados.origens.coleta.texto, 'simples'))).toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(/Selic/);
    });
  });

  describe('Bloco da equipe', () => {
    it('vem recolhido, com os quatro quadros dentro dele, na ordem: pacotes, avisos, fatos e etapas', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.dados.equipe.titulo })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: TEXTOS.dados.equipe.abrir })).toHaveAttribute('aria-expanded', 'false');
      expect(painelEquipe()).toHaveAttribute('inert');

      const quadros = within(painelEquipe())
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent);
      expect(quadros).toEqual([
        TEXTOS.dados.secoes.pacotes,
        TEXTOS.dados.secoes.avisos,
        TEXTOS.dados.secoes.fatosColeta,
        TEXTOS.dados.coleta.etapasTitulo,
      ]);
    });

    it('ao abrir, o painel sai do inert e o botão fica com aria-expanded', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      const botao = await screen.findByRole('button', { name: TEXTOS.dados.equipe.abrir });
      fireEvent.click(botao);
      expect(botao).toHaveAttribute('aria-expanded', 'true');
      expect(painelEquipe()).not.toHaveAttribute('inert');
      expect(painelEquipe()).toHaveAttribute('data-aberto', 'true');
    });
  });

  describe('O que chegou nesta atualização', () => {
    it('tem um item por pacote, com nome legível e a palavra Atualizado para quem não vê o ícone', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(await screen.findByText('Cadastro das ações')).toBeInTheDocument();
      expect(screen.getByText('Proventos')).toBeInTheDocument();
      expect(screen.getAllByText(/^Atualizado\./)).toHaveLength(registro.pacotes_enviados.length);
      expect(screen.queryByText(/^Sem mudança/)).not.toBeInTheDocument();
    });

    it('mostra a quantidade de itens com separador de milhar, e não mostra o nome do arquivo no simples', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(await screen.findByText('1.268 itens')).toBeInTheDocument();
      // acoes, resumo_acao e noticias_dia têm 85 itens cada
      expect(screen.getAllByText('85 itens')).toHaveLength(3);
      expect(screen.queryByText('acoes.json')).not.toBeInTheDocument();
    });

    it('no técnico mostra o arquivo e os números crus', async () => {
      usarNivel('tecnico');
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(await screen.findByText('acoes.json')).toBeInTheDocument();
      expect(screen.getByText('Cadastro das ações').closest('li')).toHaveTextContent('Registros: 85; removidos: 0');
    });
  });

  describe('Avisos da coleta', () => {
    it('no simples mostra o resumo em frases; o texto cru fica no bloco da equipe, fechado e com inert', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(await screen.findByRole('heading', { level: 3, name: TEXTOS.dados.secoes.avisos })).toBeInTheDocument();

      expect(screen.getByText(TEXTOS.dados.avisosResumo.modelo)).toBeInTheDocument();
      expect(screen.getByText(TEXTOS.dados.avisosResumo.ibovespa)).toBeInTheDocument();
      expect(screen.getByText(TEXTOS.dados.avisosResumo.horario)).toBeInTheDocument();

      expect(painelEquipe()).toHaveAttribute('inert');
      expect(painelEquipe()).toContainElement(screen.getByText(registro.avisos[0]));
    });

    it('a nota da coleta também fica dentro do bloco da equipe', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      const nota = await screen.findByText(registro.coleta_status.nota);
      expect(painelEquipe()).toContainElement(nota);
    });

    it('nos quadros da equipe, mostra etiquetas de categoria, código em code e data formatada', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      fireEvent.click(await screen.findByRole('button', { name: TEXTOS.dados.equipe.abrir }));

      const painel = painelEquipe();
      const codigo = within(painel).getByText('saida.publicar_top_provisorio = false');
      expect(codigo.tagName).toBe('CODE');

      const item = codigo.closest('li');
      expect(within(item).getByText(TEXTOS.dados.categoriasAviso.top5)).toBeInTheDocument();
      expect(within(painel).getAllByText(TEXTOS.dados.categoriasAviso.ibovespa).length).toBeGreaterThan(0);

      const data = within(painel).getByText('04/01/2021');
      expect(data.tagName).toBe('TIME');
      expect(data).toHaveAttribute('datetime', '2021-01-04');
    });
  });
});
