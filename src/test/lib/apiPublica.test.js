// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Regra do projeto: o front só lê a API privada (src/services/cliente.js).
 * Nenhum endereço de API pública no código e nenhum fetch fora de src/services/.
 */
const RAIZ = process.cwd();
const relativo = (abs) => path.relative(RAIZ, abs).split(path.sep).join('/');
const varrer = (dir) =>
  readdirSync(dir).flatMap((nome) => {
    const abs = path.join(dir, nome);
    return statSync(abs).isDirectory() ? varrer(abs) : [abs];
  });

const FONTES = varrer(path.join(RAIZ, 'src'))
  .map(relativo)
  .filter((rel) => /\.(js|jsx|mjs)$/.test(rel))
  .filter((rel) => !rel.startsWith('src/test/'));

/** Montados em partes, por garantia, para nenhuma varredura acusar este arquivo. */
const PUBLICAS = [
  ['/', 'bcb'].join(''),
  ['bc', 'data'].join(''),
  ['api', '.bcb'].join(''),
  ['translate', '.googleapis'].join(''),
  ['/', 'traduzir'].join(''),
];
/** fetch( solto ou como método; "refetch(" não conta. */
const FETCH = /\bfetch\s*\(/;

const ler = (rel) => readFileSync(path.join(RAIZ, rel), 'utf8');
const linhasCom = (rel, teste) =>
  ler(rel)
    .split(/\r?\n/)
    .map((texto, i) => ({ linha: i + 1, texto }))
    .filter(({ texto }) => teste(texto));

describe('regra: o front só consulta a API privada', () => {
  it('a varredura encontrou arquivos', () => {
    expect(FONTES.length).toBeGreaterThan(10);
  });

  it.each(FONTES)('%s não cita API pública', (rel) => {
    expect(linhasCom(rel, (t) => PUBLICAS.some((p) => t.includes(p)))).toEqual([]);
  });

  it.each(FONTES.filter((rel) => !rel.startsWith('src/services/')))('%s não chama fetch (só src/services/)', (rel) => {
    expect(linhasCom(rel, (t) => FETCH.test(t))).toEqual([]);
  });

  it('vite.config.js não tem proxy para API pública', () => {
    const config = ler('vite.config.js');
    for (const p of PUBLICAS) expect(config.includes(p)).toBe(false);
  });
});
