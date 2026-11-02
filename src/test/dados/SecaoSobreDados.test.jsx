import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import SecaoSobreDados from '../../components/dados/SecaoSobreDados.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS, porNivel } from '../../lib/textos.js';
import execucaoJson from '../../../public/dados/execucao.json';

const registro = execucaoJson.registros[0];
const CHAVE_PREFERENCIAS = 'painel-b3:preferencias';

const usarNivel = (nivel) => localStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify({ nivel, zoom: 1 }));

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

  describe('resumo do topo', () => {
    it('mostra a situação concluída e os fatos principais no simples', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(await screen.findByText(TEXTOS.dados.situacaoPainel.ok)).toBeInTheDocument();
      expect(screen.getByText(TEXTOS.dados.fatos.pregao)).toBeInTheDocument();
      expect(screen.getAllByText('22/10/2026').length).toBeGreaterThan(0);
      expect(screen.getByText(TEXTOS.dados.fatos.publicado)).toBeInTheDocument();
      expect(screen.getByText('24/10 às 23h25')).toBeInTheDocument();
      expect(screen.getByText(TEXTOS.dados.fatos.atualizacao)).toBeInTheDocument();
      expect(screen.getByText('nº 8')).toBeInTheDocument();
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

  describe('De onde vem cada coisa', () => {
    it('tem o título de seção e um cartão por fonte, sem o texto antigo', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(
        screen.getByRole('heading', { level: 3, name: /B3 e empresas/ }),
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: TEXTOS.dados.origens.bancoCentral.titulo })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: TEXTOS.dados.origens.finbert.titulo })).toBeInTheDocument();
      expect(screen.getByText(porNivel(TEXTOS.dados.origens.finbert.texto, 'simples'))).toBeInTheDocument();
    });
  });

  describe('O que chegou nesta atualização', () => {
    it('tem um cartão por pacote, com nome legível e selo de atualizado', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(await screen.findByRole('heading', { level: 3, name: 'Cadastro das ações' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: 'Proventos' })).toBeInTheDocument();
      expect(screen.getAllByText(TEXTOS.dados.selos.atualizado)).toHaveLength(registro.pacotes_enviados.length);
      expect(screen.queryByText(porNivel(TEXTOS.dados.selos.semMudanca, 'simples'))).not.toBeInTheDocument();
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
      expect(screen.getByRole('heading', { level: 3, name: 'Cadastro das ações' }).closest('li')).toHaveTextContent(
        'Registros: 85; removidos: 0',
      );
    });
  });

  describe('Avisos da coleta', () => {
    it('no simples mostra o resumo em frases e recolhe o texto cru num details fechado', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.dados.secoes.avisos })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Algo deu errado?' })).not.toBeInTheDocument();

      expect(screen.getByText(TEXTOS.dados.avisosResumo.modelo)).toBeInTheDocument();
      expect(screen.getByText(TEXTOS.dados.avisosResumo.ibovespa)).toBeInTheDocument();
      expect(screen.getByText(TEXTOS.dados.avisosResumo.horario)).toBeInTheDocument();
      expect(screen.getByText(TEXTOS.dados.avisosResumo.modelo).closest('details')).toBeNull();

      const cru = screen.getByText(registro.avisos[0]);
      const detalhes = cru.closest('details');
      expect(detalhes).not.toBeNull();
      expect(detalhes).not.toHaveAttribute('open');
      expect(screen.getByText(TEXTOS.dados.detalhesTecnicos)).toBeInTheDocument();
    });

    it('a nota da coleta também fica dentro do details no simples', async () => {
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      const nota = await screen.findByText(registro.coleta_status.nota);
      expect(nota.closest('details')).not.toBeNull();
    });

    it('no técnico a lista crua fica aberta e sem o resumo em frases', async () => {
      usarNivel('tecnico');
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      const cru = await screen.findByText(registro.avisos[0]);
      expect(cru.closest('details')).toHaveAttribute('open');
      expect(screen.queryByText(TEXTOS.dados.avisosResumo.modelo)).not.toBeInTheDocument();
    });

    it('no técnico, com o details aberto, mostra etiquetas de categoria, código em code e data formatada', async () => {
      usarNivel('tecnico');
      renderizar(<SecaoSobreDados nivelTitulo={1} />);
      const codigo = await screen.findByText('saida.publicar_top_provisorio = false');
      expect(codigo.tagName).toBe('CODE');

      const detalhes = codigo.closest('details');
      expect(detalhes).toHaveAttribute('open');

      const item = codigo.closest('li');
      expect(within(item).getByText(TEXTOS.dados.categoriasAviso.top5)).toBeInTheDocument();
      expect(within(detalhes).getAllByText(TEXTOS.dados.categoriasAviso.ibovespa).length).toBeGreaterThan(0);

      const data = within(detalhes).getByText('04/01/2021');
      expect(data.tagName).toBe('TIME');
      expect(data).toHaveAttribute('datetime', '2021-01-04');
    });
  });
});
