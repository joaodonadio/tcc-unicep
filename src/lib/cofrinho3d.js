/**
 * Coreografia do porquinho (funções puras). t é o tempo em segundos desde a moeda entrar na fenda:
 * antes disso (t < 0) ele só se prepara, depois pula, pousa e assenta.
 */

/** Antecipação: nos 0,4 s antes da moeda ele agacha de leve. */
const ANTECIPA = 0.4;
const AGACHA = 0.035;
/** Pulinho: voo curto e pouso que amassa e devolve. */
const VOO = 0.3;
const ALTURA = 0.24;
const ESTICA = 0.04;
const POUSO = 0.3;
const AMASSA = 0.06;
/** Balanço depois do pouso: oscilação que morre, como cerâmica assentando. */
const BALANCO = 0.05;
const DECAI = 3.6;
const OMEGA = 11;
/** Orelhas e rabo reagem depois do corpo e param aos poucos. */
const ABANO = 0.3;
const ABANO_OMEGA = 20;
const ABANO_DECAI = 3.2;
const RABO = 0.4;
const RABO_OMEGA = 17;
const RABO_DECAI = 2.2;
/** Olhos apertados de contente depois da moeda. */
const CONTENTE = 0.5;
const CONTENTE_SOBE = 0.1;
const CONTENTE_FICA = 0.5;
const CONTENTE_DESCE = 0.2;

const suave = (x) => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

/** Altura, escala vertical e inclinação do corpo no instante t. Fora da reação, tudo neutro. */
export function formaDoCofrinho(t) {
  if (t < -ANTECIPA) return { altura: 0, escalaY: 1, inclina: 0 };
  if (t < 0) return { altura: 0, escalaY: 1 - AGACHA * suave((t + ANTECIPA) / ANTECIPA), inclina: 0 };
  if (t < VOO) {
    const u = t / VOO;
    const escalaY =
      u < 0.25 ? 1 - AGACHA + (AGACHA + ESTICA) * suave(u / 0.25) : 1 + ESTICA * (1 - suave((u - 0.25) / 0.75));
    return { altura: ALTURA * 4 * u * (1 - u), escalaY, inclina: 0 };
  }
  const p = t - VOO;
  const escalaY = p < POUSO ? 1 - AMASSA * Math.sin((Math.PI * p) / POUSO) : 1;
  return { altura: 0, escalaY, inclina: BALANCO * Math.exp(-DECAI * p) * Math.sin(OMEGA * p) };
}

/** Abano extra das orelhas (rad), com um atraso pequeno em relação ao corpo. */
export function abanoDasOrelhas(t) {
  const u = t - 0.06;
  if (u <= 0) return 0;
  return ABANO * Math.exp(-ABANO_DECAI * u) * Math.sin(ABANO_OMEGA * u);
}

/** Abano extra do rabo (rad). */
export function abanoDoRabo(t) {
  if (t <= 0) return 0;
  return RABO * Math.exp(-RABO_DECAI * t) * Math.sin(RABO_OMEGA * t);
}

/** Escala vertical dos olhos: aperta de contente depois da moeda e volta. 1 fora da reação. */
export function olhoContente(t) {
  if (t <= 0) return 1;
  const fim = CONTENTE_SOBE + CONTENTE_FICA + CONTENTE_DESCE;
  if (t >= fim) return 1;
  if (t < CONTENTE_SOBE) return 1 - (1 - CONTENTE) * suave(t / CONTENTE_SOBE);
  if (t < CONTENTE_SOBE + CONTENTE_FICA) return CONTENTE;
  return CONTENTE + (1 - CONTENTE) * suave((t - CONTENTE_SOBE - CONTENTE_FICA) / CONTENTE_DESCE);
}
