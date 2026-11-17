import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import SecaoMercado from '../../components/mercado/SecaoMercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

const grupo = (nome) => screen.getByRole('heading', { level: 3, name: nome }).closest('section');

describe('SecaoMercado', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('mostra o título, os três grupos de índices e nenhum NaN', async () => {
    const { container } = renderizar(<SecaoMercado />);

    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.mercado.titulo })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.mercado.indicesTitulo })).toBeInTheDocument();
    for (const nome of ['Bolsa', 'Juros e inflação', 'Câmbio e petróleo']) {
      expect(screen.getByRole('heading', { level: 3, name: nome })).toBeInTheDocument();
    }
    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('não tem abas, nem a seção de destaques nem o link para os setores', async () => {
    renderizar(<SecaoMercado />);

    await screen.findByRole('heading', { level: 2, name: TEXTOS.mercado.indicesTitulo });
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(screen.queryByText('Ver todos os setores')).not.toBeInTheDocument();
    expect(screen.queryByText(/Pesquise o volume/)).not.toBeInTheDocument();
  });

  it('cada índice é um item de lista com o nome, o valor de hoje e os períodos', async () => {
    renderizar(<SecaoMercado />);
    await screen.findByRole('heading', { level: 3, name: 'Bolsa' });

    const itens = within(grupo('Bolsa')).getAllByRole('listitem');
    expect(itens).toHaveLength(5);
    expect(itens[0]).toHaveTextContent('Ibovespa');
    expect(itens[0].querySelector('.mercado-indice__grande')).not.toBeNull();
    expect(within(grupo('Bolsa')).getByText('IDIV')).toBeInTheDocument();
  });

  it('a explicação de uma linha aparece em cada índice, no nível simples', async () => {
    renderizar(<SecaoMercado />);
    await screen.findByRole('heading', { level: 3, name: 'Bolsa' });

    expect(within(grupo('Bolsa')).getByText('empresas que mais pagam proventos')).toBeInTheDocument();
  });

  it('nenhum período aparece como "Indisponível"', async () => {
    const { container } = renderizar(<SecaoMercado />);
    await screen.findByRole('heading', { level: 3, name: 'Bolsa' });

    expect(container.textContent).not.toMatch(/Indisponível/);
  });

  it('trocar o período marca o botão escolhido com aria-pressed', async () => {
    renderizar(<SecaoMercado />);

    const periodo = await screen.findByRole('group', { name: TEXTOS.mercado.periodoGrupo });
    const seisMeses = within(periodo).getByRole('button', { name: TEXTOS.mercado.periodos['6m'] });
    const umAno = within(periodo).getByRole('button', { name: TEXTOS.mercado.periodos['1a'] });

    expect(seisMeses).toHaveAttribute('aria-pressed', 'true');
    expect(umAno).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(umAno);

    expect(umAno).toHaveAttribute('aria-pressed', 'true');
    expect(seisMeses).toHaveAttribute('aria-pressed', 'false');
  });

  it('o gráfico começa com Ibovespa e CDI ligados e nenhuma comparação', async () => {
    renderizar(<SecaoMercado />);

    expect(await screen.findByRole('img', { name: /^Ibovespa: de/ })).toBeInTheDocument();

    const indices = screen.getByRole('group', { name: TEXTOS.mercado.comparacaoGrupo });
    expect(within(indices).getByRole('button', { name: TEXTOS.dia.ibovespa })).toHaveAttribute('aria-pressed', 'true');
    expect(within(indices).getByRole('button', { name: TEXTOS.mercado.cdi })).toHaveAttribute('aria-pressed', 'true');
    expect(within(indices).getByRole('button', { name: TEXTOS.mercado.comparacao.IPCA })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('todos os índices são chips liga/desliga, sem "Marcar todos" nem rótulo de fixo', async () => {
    renderizar(<SecaoMercado />);

    const indices = await screen.findByRole('group', { name: TEXTOS.mercado.comparacaoGrupo });
    const idiv = within(indices).getByRole('button', { name: TEXTOS.mercado.comparacao.IDIV });
    fireEvent.click(idiv);
    expect(idiv).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(idiv);
    expect(idiv).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(within(indices).getByRole('button', { name: TEXTOS.dia.ibovespa }));
    expect(within(indices).getByRole('button', { name: TEXTOS.dia.ibovespa })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: 'Marcar todos' })).not.toBeInTheDocument();
    expect(screen.queryByText('fixo')).not.toBeInTheDocument();
  });

  it('desligar todos os índices troca o gráfico pelo estado vazio com a frase', async () => {
    renderizar(<SecaoMercado />);

    const indices = await screen.findByRole('group', { name: TEXTOS.mercado.comparacaoGrupo });
    for (const nome of [TEXTOS.dia.ibovespa, TEXTOS.mercado.cdi]) {
      fireEvent.click(within(indices).getByRole('button', { name: nome }));
    }

    expect(screen.getByText(TEXTOS.mercado.semSelecao)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /^Ibovespa/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: /Rentabilidade de cada série/ })).not.toBeInTheDocument();
  });

  it('cada série visível tem um cartão com o valor e a leitura em reais, do maior para o menor', async () => {
    renderizar(<SecaoMercado />);

    const lista = await screen.findByRole('list', { name: TEXTOS.mercado.resumoLista(TEXTOS.mercado.periodos['6m']) });
    const cartoes = within(lista).getAllByRole('listitem');
    expect(cartoes.length).toBeGreaterThanOrEqual(2);

    const valores = cartoes.map((c) => {
      const texto = c.querySelector('.mercado-rendimento__valor').textContent;
      return texto === TEXTOS.mercado.semDado ? null : Number(texto.replace('%', '').replace('+', '').replace('−', '-').replace(',', '.'));
    });
    const comDado = valores.filter((v) => v != null);
    expect(comDado).toEqual([...comDado].sort((a, b) => b - a));

    for (const c of cartoes) {
      const leitura = c.querySelector('.mercado-rendimento__leitura');
      if (leitura) expect(leitura.textContent).toMatch(/^R\$ 100 viraram R\$ \d+,\d{2}$/);
    }
    expect(lista.textContent).not.toMatch(/NaN|undefined/);
  });
});
