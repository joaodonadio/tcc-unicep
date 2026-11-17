import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { GradeSetores } from '../../components/setores/GradeSetores.jsx';
import { renderizar } from '../apoio/renderizar.jsx';
import { pct } from '../../lib/formato.js';
import { TEXTOS } from '../../lib/textos.js';

const acao = (ticker, empresa, variacao, revisao = false) => ({ ticker, empresa, variacao, revisao });

// Já ordenados do que mais subiu ao que mais caiu, como setoresPorPeriodo entrega.
const setores = [
  {
    setor: 'Financeiro', media: 0.05, n: 2, total: 2, subiram: 2, cairam: 0,
    melhor: null, pior: null, emRevisao: [],
    acoes: [acao('ITUB4', 'Itaú', 0.06), acao('BBDC4', 'Bradesco', 0.04)],
  },
  {
    setor: 'Bens Industriais', media: 0.01, n: 1, total: 1, subiram: 1, cairam: 0,
    melhor: null, pior: null, emRevisao: [],
    acoes: [acao('WEGE3', 'WEG', 0.01)],
  },
  {
    setor: 'Saúde', media: -0.03, n: 1, total: 2, subiram: 0, cairam: 1,
    melhor: null, pior: null, emRevisao: ['RDOR3'],
    acoes: [acao('FLRY3', 'Fleury', -0.03), acao('RDOR3', 'Rede', null, true)],
  },
  {
    setor: 'Comunicações', media: null, n: 0, total: 1, subiram: 0, cairam: 0,
    melhor: null, pior: null, emRevisao: [],
    acoes: [acao('TIMS3', 'TIM', null)],
  },
];

describe('GradeSetores (mosaico)', () => {
  it('o destaque traz o que mais subiu e o que mais caiu, cada um com o seu rótulo de canto', () => {
    renderizar(<GradeSetores setores={setores} tecnico={false} />);

    const destaques = document.querySelectorAll('.setor-cartao--destaque');
    expect(destaques).toHaveLength(2);
    expect(destaques[0]).toHaveTextContent('Financeiro');
    expect(destaques[0].querySelector('.setor-canto')).toHaveTextContent(TEXTOS.setores.subiuMais);
    expect(destaques[1]).toHaveTextContent('Saúde');
    expect(destaques[1].querySelector('.setor-canto')).toHaveTextContent(TEXTOS.setores.caiuMais);
  });

  it('no técnico, o destaque mostra o rótulo de maior alta ou de maior queda no lugar do que o setor faz', () => {
    localStorage.setItem('painel-b3:preferencias', JSON.stringify({ nivel: 'tecnico', zoom: 1 }));
    renderizar(<GradeSetores setores={setores} tecnico />);

    expect(screen.getByText(TEXTOS.setores.maiorAltaMedia)).toBeInTheDocument();
    expect(screen.getByText(TEXTOS.setores.maiorQuedaMedia)).toBeInTheDocument();
    localStorage.removeItem('painel-b3:preferencias');
  });

  it('num período só de alta, o último destaque é "Subiu menos" com "Menor alta média", sem contradição', () => {
    const soAlta = [setores[0], { ...setores[1], media: 0.005 }];
    renderizar(<GradeSetores setores={soAlta} tecnico />);

    const destaques = document.querySelectorAll('.setor-cartao--destaque');
    expect(destaques[1].querySelector('.setor-canto')).toHaveTextContent(TEXTOS.setores.subiuMenos);
    expect(destaques[1]).toHaveTextContent(TEXTOS.setores.menorAltaMedia);
    expect(destaques[1]).not.toHaveTextContent(TEXTOS.setores.maiorAltaMedia);
    expect(destaques[0]).toHaveTextContent(TEXTOS.setores.maiorAltaMedia);
  });

  it('num período só de queda, o primeiro destaque é "Caiu menos" com "Menor queda média"', () => {
    const soQueda = [{ ...setores[1], media: -0.005 }, setores[2]];
    renderizar(<GradeSetores setores={soQueda} tecnico />);

    const destaques = document.querySelectorAll('.setor-cartao--destaque');
    expect(destaques[0].querySelector('.setor-canto')).toHaveTextContent(TEXTOS.setores.caiuMenos);
    expect(destaques[0]).toHaveTextContent(TEXTOS.setores.menorQuedaMedia);
    expect(destaques[1]).toHaveTextContent(TEXTOS.setores.maiorQuedaMedia);
  });

  it('cada ação é um link para a própria ação, com aria-label de ticker, empresa e variação', () => {
    renderizar(<GradeSetores setores={setores} tecnico={false} />);

    const grade = screen.getByRole('list', { name: TEXTOS.setores.listaTitulo });
    const itub = within(grade).getByRole('link', {
      name: `ITUB4, Itaú, ${TEXTOS.setores.variacaoNoPeriodo(pct(0.06))}`,
    });
    expect(itub).toHaveAttribute('href', '/acao/ITUB4');
    expect(itub).toHaveAttribute('data-estado', 'alta');
  });

  it('ação em revisão tem o ponto tracejado e o aria-label diz "mudou de escala"', () => {
    renderizar(<GradeSetores setores={setores} tecnico={false} />);

    const grade = screen.getByRole('list', { name: TEXTOS.setores.listaTitulo });
    const rede = within(grade).getByRole('link', { name: 'RDOR3, Rede, preço mudou de escala' });
    expect(rede).toHaveAttribute('data-estado', 'revisao');
  });

  it('a contagem usa a mesma concordância da lista e a frase longa não aparece na tela', () => {
    renderizar(<GradeSetores setores={setores} tecnico={false} />);

    const contagem = document.querySelector('.setor-cartao--destaque .setor-contagem');
    expect(contagem).toHaveTextContent('2↑');
    expect(within(contagem).getByText(TEXTOS.setores.subiramAcoes(2, 2))).toBeInTheDocument();
    expect(screen.queryByText(/subiram e/)).toBeNull();
  });

  it('setor sem média mostra "Sem dado" na contagem, sem número', () => {
    renderizar(<GradeSetores setores={setores} tecnico={false} />);

    const vazio = document.querySelector('.setor-contagem--vazia');
    expect(vazio).toHaveTextContent(TEXTOS.setores.semDado);
  });

  it('os demais setores ficam em fileira completa, sem buraco: uma linha de 2 cartões', () => {
    renderizar(<GradeSetores setores={setores} tecnico={false} />);

    const fileiras = document.querySelectorAll('.setores-fileira');
    // a primeira fileira é o destaque; a segunda leva Bens Industriais e Comunicações
    expect(fileiras).toHaveLength(2);
    expect(fileiras[1].children).toHaveLength(2);
    expect(fileiras[1].style.getPropertyValue('--colunas')).toBe('2');
  });

  it('a frase de como ler muda de acordo com o nível', () => {
    renderizar(<GradeSetores setores={setores} tecnico={false} />);

    expect(screen.getByText(TEXTOS.setores.cartoesTexto.simples)).toBeInTheDocument();
  });
});
