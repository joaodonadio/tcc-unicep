import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import SecaoMercado from '../../components/mercado/SecaoMercado.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { instalarFetchDados } from '../apoio/fetchDados.js';
import { TEXTOS } from '../../lib/textos.js';

const aba = (chave) => screen.getByRole('tab', { name: TEXTOS.mercado.abas[chave] });

describe('SecaoMercado', () => {
  beforeEach(() => {
    instalarFetchDados();
  });

  it('mostra o título, a tabela de índices com o Ibovespa e nenhum NaN', async () => {
    const { container } = renderizar(<SecaoMercado />);

    expect(await screen.findByRole('heading', { level: 2, name: TEXTOS.mercado.titulo })).toBeInTheDocument();

    const tabela = await screen.findByRole('table', { name: TEXTOS.mercado.tabelaTitulo });
    expect(within(tabela).getByRole('rowheader', { name: /^Ibovespa/ })).toBeInTheDocument();
    expect(within(tabela).getByRole('columnheader', { name: TEXTOS.mercado.colHoje })).toBeInTheDocument();

    expect(container.textContent).not.toMatch(/NaN|undefined/);
  });

  it('não tem mais a aba Setores; a aba Destaques leva à página Setores', async () => {
    renderizar(<SecaoMercado />);

    expect(screen.queryByRole('tab', { name: 'Setores' })).not.toBeInTheDocument();
    fireEvent.click(aba('destaques'));
    expect(screen.getByRole('link', { name: TEXTOS.setores.verTodos })).toHaveAttribute('href', '/setores');
  });

  it('mostra o destaque de cada setor, na aba Destaques', async () => {
    renderizar(<SecaoMercado />);

    fireEvent.click(aba('destaques'));

    expect(
      await screen.findByRole('heading', { level: 3, name: TEXTOS.mercado.destaqueSetorTitulo }),
    ).toBeInTheDocument();
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

  it('o gráfico dos índices desenha o Ibovespa com a comparação padrão (IPCA) marcada', async () => {
    renderizar(<SecaoMercado />);

    expect(await screen.findByRole('img', { name: /^Ibovespa: de/ })).toBeInTheDocument();

    const comparar = screen.getByRole('group', { name: TEXTOS.mercado.comparacaoGrupo });
    expect(within(comparar).getByRole('button', { name: TEXTOS.mercado.comparacao.IPCA })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('as séries fixas aparecem como fixas e as comparações alternam com aria-pressed', async () => {
    renderizar(<SecaoMercado />);

    const comparar = await screen.findByRole('group', { name: TEXTOS.mercado.comparacaoGrupo });
    expect(within(comparar).getAllByText(TEXTOS.mercado.fixo)).toHaveLength(2);

    const idiv = within(comparar).getByRole('button', { name: TEXTOS.mercado.comparacao.IDIV });
    fireEvent.click(idiv);
    expect(idiv).toHaveAttribute('aria-pressed', 'true');
  });

  it('permite marcar todas as comparações ao mesmo tempo e desmarcar todas de uma vez', async () => {
    renderizar(<SecaoMercado />);

    const comparar = await screen.findByRole('group', { name: TEXTOS.mercado.comparacaoGrupo });
    const idiv = within(comparar).getByRole('button', { name: TEXTOS.mercado.comparacao.IDIV });
    const smll = within(comparar).getByRole('button', { name: TEXTOS.mercado.comparacao.SMLL });

    fireEvent.click(idiv);
    fireEvent.click(smll);
    expect(idiv).toHaveAttribute('aria-pressed', 'true');
    expect(smll).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(within(comparar).getByRole('button', { name: TEXTOS.mercado.marcarTodas }));
    for (const nome of Object.values(TEXTOS.mercado.comparacao)) {
      expect(within(comparar).getByRole('button', { name: nome })).toHaveAttribute('aria-pressed', 'true');
    }

    fireEvent.click(within(comparar).getByRole('button', { name: TEXTOS.mercado.desmarcarTodas }));
    for (const nome of Object.values(TEXTOS.mercado.comparacao)) {
      expect(within(comparar).getByRole('button', { name: nome })).toHaveAttribute('aria-pressed', 'false');
    }
  });

  it('cada série visível tem um cartão com o valor e a leitura em reais, do maior para o menor', async () => {
    renderizar(<SecaoMercado />);

    const lista = await screen.findByRole('list', { name: TEXTOS.mercado.resumoLista(TEXTOS.mercado.periodos['6m']) });
    const cartoes = within(lista).getAllByRole('listitem');
    expect(cartoes.length).toBeGreaterThanOrEqual(3);

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
