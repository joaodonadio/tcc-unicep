// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Arquivos da interface antiga, que ainda existem até serem apagados.
 * ESTA LISTA DEVE FICAR VAZIA quando o código antigo for removido, para que
 * a checagem de linguagem passe a cobrir todo o src.
 * Entrada que termina em "/" vale para o diretório inteiro.
 */
const LEGADO_A_REMOVER = [];

/** Termos proibidos, montados em partes para este arquivo não se acusar ao ser varrido. */
const PROIBIDOS = new RegExp(
  [
    ['inv', 'estia'].join(''),
    ['recomen', 'da'].join(''),
    `\\b${['comp', 're'].join('')}\\b`,
    ['oport', 'unidade'].join(''),
    ['melhores', 'ações'].join(' '),
    ['perguntar', 'ao sistema'].join(' '),
  ].join('|'),
  'i',
);

const RAIZ = process.cwd();

const relativo = (abs) => path.relative(RAIZ, abs).split(path.sep).join('/');

const varrer = (dir) =>
  readdirSync(dir).flatMap((nome) => {
    const abs = path.join(dir, nome);
    return statSync(abs).isDirectory() ? varrer(abs) : [abs];
  });

const ehLegado = (rel) =>
  LEGADO_A_REMOVER.some((entrada) => (entrada.endsWith('/') ? rel.startsWith(entrada) : rel === entrada));

const fontes = varrer(path.join(RAIZ, 'src'))
  .map(relativo)
  .filter((rel) => /\.(js|jsx)$/.test(rel))
  .filter((rel) => !ehLegado(rel));

/** Documentação do projeto, varrida junto com o código: vale o mesmo critério. */
const DOCUMENTOS = [
  ...readdirSync(path.join(RAIZ, 'docs'))
    .filter((nome) => nome.endsWith('.md'))
    .map((nome) => `docs/${nome}`),
  'README.md',
  'PRODUCT.md',
];

const ARQUIVOS = [...fontes, 'index.html', 'package.json', ...DOCUMENTOS];

/** Linhas do arquivo que contêm termo proibido. Não há exceção: nem o aviso fixo escapa. */
const linhasProibidas = (rel) =>
  readFileSync(path.join(RAIZ, rel), 'utf8')
    .split(/\r?\n/)
    .map((texto, i) => ({ linha: i + 1, texto }))
    .filter(({ texto }) => PROIBIDOS.test(texto));

describe('linguagem: termos proibidos na interface, no código e na documentação', () => {
  it('a varredura encontrou arquivos para checar', () => {
    expect(ARQUIVOS.length).toBeGreaterThan(2);
  });

  it('a varredura cobre os documentos do projeto', () => {
    expect(DOCUMENTOS).toEqual(expect.arrayContaining(['README.md', 'PRODUCT.md']));
  });

  it.each(ARQUIVOS)('%s não usa termos proibidos', (rel) => {
    expect(linhasProibidas(rel)).toEqual([]);
  });
});
