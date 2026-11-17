import { pct } from '../../lib/formato.js';
import { TEXTOS } from '../../lib/textos.js';

/** Frase-resumo: "Hoje 3 setores subiram e 8 caíram. O que mais subiu foi ..." (vazia sem nenhum dado). */
export function fraseDosSetores(setores, periodo) {
  const comValor = setores.filter((s) => s.media != null);
  if (comValor.length === 0) return '';
  const subiram = comValor.filter((s) => s.media > 0).length;
  const cairam = comValor.filter((s) => s.media < 0).length;
  const maior = comValor[0];
  const menor = comValor.at(-1);
  // "maior alta" só se o maior subiu, "maior queda" só se o menor caiu
  return [
    TEXTOS.setores.resumo(TEXTOS.setores.periodosExtenso[periodo], subiram, cairam),
    maior.media > 0 && TEXTOS.setores.resumoMaior(maior.setor, pct(maior.media)),
    menor.media < 0 && TEXTOS.setores.resumoMenor(menor.setor, pct(menor.media)),
  ]
    .filter(Boolean)
    .join(' ');
}
