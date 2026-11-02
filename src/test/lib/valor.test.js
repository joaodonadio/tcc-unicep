import { describe, expect, it } from 'vitest';
import { exibir, exibirNumero, ok, textoStatus, valorOuNulo } from '../../lib/valor.js';

describe('leitura de campos com status', () => {
  it('ok é true só para status ok com número finito', () => {
    expect(ok({ valor: 1.5, status: 'ok' })).toBe(true);
    expect(ok({ valor: 0, status: 'ok' })).toBe(true);
  });

  it('status ok sem valor (null) não é utilizável', () => {
    expect(ok({ valor: null, status: 'ok' })).toBe(false);
    expect(valorOuNulo({ valor: null, status: 'ok' })).toBeNull();
  });

  it('valor não finito não é utilizável', () => {
    expect(ok({ valor: NaN, status: 'ok' })).toBe(false);
    expect(ok({ valor: Infinity, status: 'ok' })).toBe(false);
  });

  it('aceita valor não numérico em campo ok (ex.: mês do IPCA)', () => {
    expect(ok({ valor: '2026-09', status: 'ok' })).toBe(true);
    expect(valorOuNulo({ valor: '2026-09', status: 'ok' })).toBe('2026-09');
  });

  it('valorOuNulo devolve o número quando ok e null caso contrário', () => {
    expect(valorOuNulo({ valor: 12.3, status: 'ok' })).toBe(12.3);
    expect(valorOuNulo({ valor: 0, status: 'lucro_negativo' })).toBeNull();
  });

  it('nenhum status além de ok torna o campo utilizável', () => {
    for (const status of [
      'lucro_negativo',
      'nao_se_aplica',
      'indisponivel',
      'historico_insuficiente',
      'calibracao_nao_conferida',
    ]) {
      expect(ok({ valor: 1, status })).toBe(false);
    }
  });

  it('nulo ou sem status não é ok', () => {
    expect(ok(null)).toBe(false);
    expect(ok(undefined)).toBe(false);
    expect(ok({ valor: 1 })).toBe(false);
  });
});

describe('texto de status', () => {
  it('lucro_negativo usa o texto do pacote quando existe', () => {
    expect(textoStatus({ valor: -1, status: 'lucro_negativo', texto: 'Prejuízo no trimestre' })).toBe(
      'Prejuízo no trimestre',
    );
  });

  it('lucro_negativo sem texto usa a frase padrão de prejuízo', () => {
    expect(textoStatus({ valor: -1, status: 'lucro_negativo' })).toBe(
      'Empresa com prejuízo nos últimos 12 meses',
    );
  });

  it('nao_se_aplica vira "Não se aplica"', () => {
    expect(textoStatus({ valor: null, status: 'nao_se_aplica' })).toBe('Não se aplica');
  });

  it('historico_insuficiente vira "Histórico insuficiente"', () => {
    expect(textoStatus({ valor: null, status: 'historico_insuficiente' })).toBe(
      'Histórico insuficiente',
    );
  });

  it('calibracao_nao_conferida não mostra texto', () => {
    expect(textoStatus({ valor: 1, status: 'calibracao_nao_conferida' })).toBe('');
  });

  it('indisponivel, status desconhecido e ausência viram "Indisponível"', () => {
    expect(textoStatus({ valor: null, status: 'indisponivel' })).toBe('Indisponível');
    expect(textoStatus({ valor: null, status: 'algum_status_novo' })).toBe('Indisponível');
    expect(textoStatus(undefined)).toBe('Indisponível');
  });
});

describe('exibir e exibirNumero', () => {
  it('exibir com valor ok aplica o formatador', () => {
    expect(exibir({ valor: 0.05, status: 'ok' }, (v) => v * 100)).toEqual({ texto: 5, motivo: '' });
  });

  it('exibir sem valor mostra travessão e o motivo do status', () => {
    expect(exibir({ valor: null, status: 'lucro_negativo' })).toEqual({
      texto: '—',
      motivo: 'Empresa com prejuízo nos últimos 12 meses',
    });
    expect(exibir(undefined)).toEqual({ texto: '—', motivo: 'Indisponível' });
    expect(exibir({ valor: null, status: 'calibracao_nao_conferida' }).motivo).toBe('Indisponível');
  });

  it('exibirNumero nunca transforma ausência em 0', () => {
    expect(exibirNumero(null)).toBe('—');
    expect(exibirNumero(0, String)).toBe('0');
  });
});
