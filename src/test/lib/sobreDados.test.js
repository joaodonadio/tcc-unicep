import { describe, expect, it } from 'vitest';
import {
  avisosDaAtualizacao,
  categoriaDoAviso,
  fatosDaAtualizacao,
  linhasDePacotes,
  nomePacote,
  notaColeta,
  partesDoAviso,
  resumoAvisos,
  situacaoPainel,
} from '../../lib/sobreDados.js';
import { detalhesDaColeta } from '../../lib/sobreDados.js';
import { TEXTOS } from '../../lib/textos.js';
import execucaoJson from '../../../public/dados/execucao.json';

const execucaoReal = execucaoJson.registros[0];

const execucao = {
  data_referencia: '2026-10-23',
  rodada: 8,
  inicio: '2026-10-24T23:23:45-03:00',
  fim: '2026-10-24T23:25:33-03:00',
  status: 'ok',
  coleta_status: { consultado: false, nota: 'gatilho da coleta não consultado (etapa 8)' },
  pacotes_enviados: [
    { pacote: 'acoes', arquivo: 'acoes.json', registros: 85, removidos: 0 },
    { pacote: 'pacote_novo', arquivo: 'pacote_novo.json', registros: 3, removidos: 1 },
  ],
  avisos: ['Primeiro aviso.', '', '  ', 'Segundo aviso.'],
};

describe('nomePacote', () => {
  it('traduz os pacotes conhecidos para o nome legível', () => {
    expect(nomePacote('acoes')).toBe('Cadastro das ações');
    expect(nomePacote('series_diarias')).toBe('Séries de preço e índices');
    expect(nomePacote('execucao')).toBe('Dados da atualização');
  });

  it('devolve o nome cru para um pacote desconhecido', () => {
    expect(nomePacote('pacote_novo')).toBe('pacote_novo');
  });

  it('não confunde nome herdado do objeto com pacote conhecido', () => {
    expect(nomePacote('constructor')).toBe('constructor');
    expect(nomePacote('toString')).toBe('toString');
  });
});

describe('linhasDePacotes', () => {
  it('uma linha por pacote, com nome legível e números', () => {
    const linhas = linhasDePacotes(execucao);
    expect(linhas).toHaveLength(2);
    expect(linhas[0]).toMatchObject({ nome: 'Cadastro das ações', registros: 85, removidos: 0 });
    expect(linhas[1]).toMatchObject({ nome: 'pacote_novo', registros: 3, removidos: 1 });
  });

  it('ausência de número fica null, nunca 0', () => {
    const linhas = linhasDePacotes({ pacotes_enviados: [{ pacote: 'acoes', registros: 'x' }] });
    expect(linhas[0].registros).toBeNull();
    expect(linhas[0].removidos).toBeNull();
  });

  it('chaves das linhas são únicas mesmo com pacotes repetidos', () => {
    const linhas = linhasDePacotes({
      pacotes_enviados: [
        { pacote: 'acoes', registros: 1 },
        { pacote: 'acoes', registros: 2 },
      ],
    });
    expect(new Set(linhas.map((l) => l.chave)).size).toBe(2);
  });

  it('sem pacotes ou sem execução, devolve lista vazia', () => {
    expect(linhasDePacotes(null)).toEqual([]);
    expect(linhasDePacotes({})).toEqual([]);
  });
});

describe('avisosDaAtualizacao e notaColeta', () => {
  it('devolve só os avisos com texto, como vieram', () => {
    expect(avisosDaAtualizacao(execucao)).toEqual(['Primeiro aviso.', 'Segundo aviso.']);
  });

  it('sem avisos, devolve lista vazia', () => {
    expect(avisosDaAtualizacao({})).toEqual([]);
    expect(avisosDaAtualizacao(null)).toEqual([]);
  });

  it('a nota da coleta sai do campo coleta_status.nota', () => {
    expect(notaColeta(execucao)).toBe('gatilho da coleta não consultado (etapa 8)');
    expect(notaColeta({ coleta_status: { nota: '   ' } })).toBe('');
    expect(notaColeta({})).toBe('');
  });
});

describe('linhasDePacotes: selo e retirados', () => {
  it('registros acima de zero viram selo atualizado; zero vira sem mudança; ausente fica sem selo', () => {
    const linhas = linhasDePacotes({
      pacotes_enviados: [
        { pacote: 'acoes', registros: 5, removidos: 0 },
        { pacote: 'proventos', registros: 0, removidos: 0 },
        { pacote: 'mercado_dia', removidos: 0 },
      ],
    });
    expect(linhas.map((l) => l.selo)).toEqual(['atualizado', 'semMudanca', null]);
  });

  it('retirados só aparece quando há item removido', () => {
    const linhas = linhasDePacotes({
      pacotes_enviados: [
        { pacote: 'acoes', registros: 1, removidos: 3 },
        { pacote: 'proventos', registros: 1, removidos: 0 },
        { pacote: 'noticias_dia', registros: 1 },
      ],
    });
    expect(linhas.map((l) => l.retirados)).toEqual([3, null, null]);
  });
});

describe('situacaoPainel', () => {
  it('concluída é alta, com mancha alta, pavio contente e frase própria', () => {
    expect(situacaoPainel('ok')).toEqual({
      rotulo: TEXTOS.dados.situacaoPainel.ok,
      tom: 'alta',
      brilho: 'alta',
      humor: 'contente',
      frase: TEXTOS.dados.pavio.ok,
    });
  });

  it('parcial é acento e com falha é queda; ambos com pavio preocupado', () => {
    expect(situacaoPainel('parcial')).toMatchObject({ tom: 'acento', brilho: 'acento', humor: 'preocupado' });
    expect(situacaoPainel('falhou')).toMatchObject({ tom: 'queda', brilho: 'queda', humor: 'preocupado' });
  });

  it('status desconhecido ou herdado vira situação não informada, em tom neutro', () => {
    for (const status of [undefined, 'em_andamento', 'constructor']) {
      expect(situacaoPainel(status)).toEqual({
        rotulo: TEXTOS.dados.situacaoPainel.desconhecida,
        tom: 'neutro',
        brilho: 'aco',
        humor: 'neutro',
        frase: TEXTOS.dados.pavio.desconhecida,
      });
    }
  });
});

describe('fatosDaAtualizacao', () => {
  it('monta pregão, publicação e número da atualização, com início e fim à parte', () => {
    expect(fatosDaAtualizacao({ dataReferencia: '2026-10-22', execucao })).toEqual({
      pregao: '22/10/2026',
      dadosAte: null,
      publicado: '24/10 às 23h25',
      atualizacao: 'nº 8',
      periodo: '23h23 a 23h25',
    });
  });

  it('dados até vêm do instante do mercado, com dia e hora de São Paulo', () => {
    const fatos = fatosDaAtualizacao({ dataReferencia: '2026-11-04', execucao, dadosAte: '2026-11-05T08:00:00-03:00' });
    expect(fatos.dadosAte).toBe('05/11 às 08h00');
  });

  it('ausência de dado vira null, nunca texto inventado', () => {
    expect(fatosDaAtualizacao({ dataReferencia: null, execucao: { status: 'ok' } })).toEqual({
      pregao: null,
      dadosAte: null,
      publicado: null,
      atualizacao: null,
      periodo: null,
    });
  });
});

describe('resumoAvisos', () => {
  it('reconhece os avisos de modelo de teste e horário fora do normal; o do Ibovespa estimado não vira frase', () => {
    expect(resumoAvisos(execucaoReal)).toEqual([
      TEXTOS.dados.avisosResumo.modelo,
      TEXTOS.dados.avisosResumo.horario,
    ]);
  });

  it('sem avisos, diz que não há nenhum', () => {
    expect(resumoAvisos({ avisos: [] })).toEqual([TEXTOS.dados.avisosResumo.nenhum]);
  });

  it('avisos que nenhuma regra reconhece viram a frase genérica', () => {
    expect(resumoAvisos({ avisos: ['Retornos diários suspeitos entre 2025-10-16 e 2026-10-22.'] })).toEqual([
      TEXTOS.dados.avisosResumo.generico,
    ]);
  });

  it('não repete a mesma frase quando dois avisos caem na mesma regra', () => {
    const frases = resumoAvisos({ avisos: ['Modelo provisório A.', 'Top 5 de teste B.'] });
    expect(frases).toEqual([TEXTOS.dados.avisosResumo.modelo]);
  });
});

describe('categoriaDoAviso', () => {
  it('classifica os avisos reais pela categoria certa', () => {
    expect(categoriaDoAviso('Composição do Ibovespa cobre 1448 de 1697 pregões.')).toBe('ibovespa');
    expect(categoriaDoAviso('Modelo provisório: treinado de 2024-01-02 a 2026-06-19.')).toBe('modelo');
    expect(categoriaDoAviso('Gerado depois das 10h: não entra no histórico do experimento.')).toBe('horario');
    expect(categoriaDoAviso('Antes da entrada em produção: este top 5 é um teste de funcionamento.')).toBe('top5');
    expect(categoriaDoAviso('Modelo de 2026-06 (o do mês de D ainda não foi treinado).')).toBe('modelo');
    expect(categoriaDoAviso('Top 5 gerado só como teste de funcionamento (modelo não oficial).')).toBe('top5');
    expect(categoriaDoAviso('Daily da agenda (origem cron). Consulta única (--sem-esperar).')).toBe('agenda');
    expect(categoriaDoAviso('Retornos diários suspeitos entre 2025-10-16 e 2026-10-22.')).toBe('outro');
  });

  it('ignora caixa e acento', () => {
    expect(categoriaDoAviso('COMPOSIÇÃO do ibovespa')).toBe('ibovespa');
    expect(categoriaDoAviso('TOP 5 de teste')).toBe('top5');
  });

  it('texto vazio ou que não é texto cai em outro', () => {
    expect(categoriaDoAviso('')).toBe('outro');
    expect(categoriaDoAviso(null)).toBe('outro');
  });
});

describe('partesDoAviso', () => {
  it('troca a data ISO completa por DD/MM/AAAA e guarda a data original', () => {
    expect(partesDoAviso('de 2021-01-04 a 2026-10-22.')).toEqual([
      { tipo: 'texto', valor: 'de ' },
      { tipo: 'data', valor: '04/01/2021', iso: '2021-01-04' },
      { tipo: 'texto', valor: ' a ' },
      { tipo: 'data', valor: '22/10/2026', iso: '2026-10-22' },
      { tipo: 'texto', valor: '.' },
    ]);
  });

  it('AAAA-MM sozinho vira MM/AAAA', () => {
    expect(partesDoAviso('Modelo de 2026-06 (o do mês).')).toEqual([
      { tipo: 'texto', valor: 'Modelo de ' },
      { tipo: 'data', valor: '06/2026', iso: '2026-06' },
      { tipo: 'texto', valor: ' (o do mês).' },
    ]);
  });

  it('expressão palavra = valor vira código inteiro', () => {
    expect(partesDoAviso('(saida.publicar_top_provisorio = false).')).toEqual([
      { tipo: 'texto', valor: '(' },
      { tipo: 'codigo', valor: 'saida.publicar_top_provisorio = false' },
      { tipo: 'texto', valor: ').' },
    ]);
  });

  it('opção que começa com -- vira código', () => {
    expect(partesDoAviso('Consulta única (--sem-esperar).')).toEqual([
      { tipo: 'texto', valor: 'Consulta única (' },
      { tipo: 'codigo', valor: '--sem-esperar' },
      { tipo: 'texto', valor: ').' },
    ]);
  });

  it('identificadores com sublinhado ou ponto viram código', () => {
    expect(partesDoAviso('experimento_top e experimento_historico')).toEqual([
      { tipo: 'codigo', valor: 'experimento_top' },
      { tipo: 'texto', valor: ' e ' },
      { tipo: 'codigo', valor: 'experimento_historico' },
    ]);
  });

  it('texto sem nada técnico vira uma parte só', () => {
    expect(partesDoAviso('Retornos diários suspeitos.')).toEqual([{ tipo: 'texto', valor: 'Retornos diários suspeitos.' }]);
  });

  it('texto vazio ou que não é texto não gera partes', () => {
    expect(partesDoAviso('')).toEqual([]);
    expect(partesDoAviso(null)).toEqual([]);
  });

  it('preserva todos os caracteres: juntando os valores (data pela forma ISO) dá o texto original', () => {
    for (const aviso of execucaoReal.avisos) {
      const juntado = partesDoAviso(aviso)
        .map((p) => (p.tipo === 'data' ? p.iso : p.valor))
        .join('');
      expect(juntado).toBe(aviso);
    }
  });
});

describe('detalhesDaColeta', () => {
  it('monta fatos e etapas só com o que veio', () => {
    const { fatos, etapas } = detalhesDaColeta({
      coleta_status: { consultas: 1, origem: 'cron', t_esperado: '2026-11-04', etapas: { precos: 'concluida', analise: 'pulada' } },
    });
    expect(fatos.map((f) => f.valor)).toEqual(['1', '04/11/2026', 'cron']);
    expect(etapas).toEqual([
      { chave: 'precos', nome: 'Preços', situacao: 'concluída', concluida: true },
      { chave: 'analise', nome: 'Análise', situacao: 'pulada', concluida: false },
    ]);
  });

  it('sem coleta_status fica vazio, sem inventar valor', () => {
    expect(detalhesDaColeta({})).toEqual({ fatos: [], etapas: [] });
  });
});
