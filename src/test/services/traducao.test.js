import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lerLote, lerResposta, montarLotes, traduzir } from '../../services/traducao.js';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('lerResposta', () => {
  it('lê a primeira parte e o idioma detectado', () => {
    expect(lerResposta([[['Petrobras sobe', 'Petrobras rises', null, null, 10]], null, 'en'])).toEqual({
      pt: 'Petrobras sobe',
      idioma: 'en',
    });
  });

  it('junta os trechos na ordem', () => {
    expect(
      lerResposta([
        [
          ['Olá. ', 'Hi. '],
          ['Tudo bem?', 'All good?'],
        ],
        null,
        'en',
      ]),
    ).toEqual({ pt: 'Olá. Tudo bem?', idioma: 'en' });
  });

  it('formato estranho devolve null', () => {
    expect(lerResposta(null)).toBeNull();
    expect(lerResposta({})).toBeNull();
    expect(lerResposta([[]])).toBeNull();
  });
});

describe('lerLote', () => {
  it('casa cada linha com seu original; linha igual ao original é português', () => {
    const r = [[['Petrobras sobe\n', 'Petrobras rises\n'], ['Itaú lucra', 'Itaú lucra']], null, 'en'];
    expect(lerLote(r, ['Petrobras rises', 'Itaú lucra'])).toEqual([
      { pt: 'Petrobras sobe', idioma: 'en' },
      { pt: 'Itaú lucra', idioma: 'pt' },
    ]);
  });

  it('número de linhas diferente devolve null para todas', () => {
    expect(lerLote([[['Uma só linha', 'x']], null, 'en'], ['a', 'b'])).toEqual([null, null]);
  });
});

describe('montarLotes', () => {
  it('quebra em lotes pelo tamanho', () => {
    expect(montarLotes(['aaaa', 'bbbb', 'cccc'], 10)).toEqual([['aaaa', 'bbbb'], ['cccc']]);
  });
});

describe('traduzir', () => {
  it('chama o proxy, devolve a tradução e guarda no cache', async () => {
    const fetchFalso = vi.fn(async () => ({
      ok: true,
      json: async () => [[['Petrobras sobe', 'Petrobras rises']], null, 'en'],
    }));
    vi.stubGlobal('fetch', fetchFalso);

    expect(await traduzir('Petrobras rises')).toEqual({ pt: 'Petrobras sobe', idioma: 'en' });
    const url = String(fetchFalso.mock.calls[0][0]);
    expect(url.startsWith('/traduzir/translate_a/single?')).toBe(true);
    expect(url).toContain('q=Petrobras%20rises');

    expect(await traduzir('Petrobras rises')).toEqual({ pt: 'Petrobras sobe', idioma: 'en' });
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('traducoes_v1'))['Petrobras rises']).toEqual({
      pt: 'Petrobras sobe',
      idioma: 'en',
    });
  });

  it('falha de rede devolve null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('rede'))));
    expect(await traduzir('Petrobras rises')).toBeNull();
  });

  it('resposta com ok false devolve null', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
    expect(await traduzir('Petrobras rises')).toBeNull();
  });

  it('pedidos juntos viram um só pedido, uma manchete por linha', async () => {
    const fetchFalso = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => [[['Petrobras sobe\n', 'Petrobras rises\n'], ['Vale cai', 'Vale falls']], null, 'en'],
    }));
    vi.stubGlobal('fetch', fetchFalso);

    const [a, b] = await Promise.all([traduzir('Petrobras rises'), traduzir('Vale falls')]);
    expect(a).toEqual({ pt: 'Petrobras sobe', idioma: 'en' });
    expect(b).toEqual({ pt: 'Vale cai', idioma: 'en' });
    expect(fetchFalso).toHaveBeenCalledTimes(1);
    expect(String(fetchFalso.mock.calls[0][0])).toContain('q=Petrobras%20rises%0AVale%20falls');
  });

  it('depois de um 429 para de pedir por um tempo', async () => {
    const fetchFalso = vi.fn(async () => ({ ok: false, status: 429 }));
    vi.stubGlobal('fetch', fetchFalso);

    expect(await traduzir('Petrobras rises')).toBeNull();
    expect(await traduzir('Vale falls')).toBeNull();
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it('texto vazio devolve null sem chamar fetch', async () => {
    const fetchFalso = vi.fn();
    vi.stubGlobal('fetch', fetchFalso);
    expect(await traduzir('   ')).toBeNull();
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
