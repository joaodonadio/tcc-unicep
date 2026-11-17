/** Sufixo jurídico no fim do nome ("S.A.", "SA", "S/A", "Holding"). Sai do nome curto. */
const SUFIXO = /\s+(?:S\.?\s?A\.?|S\/A|HOLDING)$/i;

/** Palavras que ficam em minúscula no meio do nome ("Banco do Brasil"). */
const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em']);

/** Nome em maiúsculas vira título: "CSN MINERACAO" -> "Csn Mineracao". */
function emTitulo(texto) {
  return texto
    .split(' ')
    .map((palavra, i) => {
      const baixa = palavra.toLowerCase();
      if (i > 0 && MINUSCULAS.has(baixa)) return baixa;
      // "(BRASIL)" vira "(Brasil)": a maiúscula vai na primeira letra, depois do parêntese
      return baixa.replace(/\p{L}/u, (letra) => letra.toUpperCase());
    })
    .join(' ');
}

/**
 * Nome curto da empresa para exibir: fica com o nome depois de " - " (se houver), tira o sufixo jurídico e põe em
 * título se estiver em maiúsculas.
 * Nome mixto ("Itaú Unibanco") não muda. Ausente ou vazio vira null.
 * @param {string|null} [nome]
 * @returns {string|null}
 */
export function nomeCurto(nome) {
  if (typeof nome !== 'string') return null;

  let texto = nome.trim();
  if (!texto) return null;
  // "PETRÓLEO BRASILEIRO S.A. - PETROBRAS": o nome depois do travessão é o conhecido
  const marca = texto.split(/\s+-\s+/).at(-1).trim();
  if (marca) texto = marca;

  // o sufixo casa depois de um espaço, então sempre sobra alguma palavra antes dele
  let anterior;
  do {
    anterior = texto;
    texto = texto.replace(SUFIXO, '');
  } while (texto !== anterior);

  return texto === texto.toUpperCase() && /[A-Z]/.test(texto) ? emTitulo(texto) : texto;
}
