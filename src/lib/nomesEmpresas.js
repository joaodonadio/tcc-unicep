/**
 * Nomes de empresas vêm dos dados sem acento ("Sao Martinho", "CSN Mineracao").
 * Aqui cada palavra inteira conhecida ganha a grafia correta da língua, com a
 * mesma inicial maiúscula ou minúscula da original. Nomes já corretos não mudam.
 */

/** Palavra inteira (sem acento, minúscula) -> grafia correta. */
const PALAVRAS = {
  acucar: 'Açúcar',
  agricola: 'Agrícola',
  alcool: 'Álcool',
  brasilia: 'Brasília',
  ceramica: 'Cerâmica',
  comercio: 'Comércio',
  construcao: 'Construção',
  dor: "D'Or",
  distribuicao: 'Distribuição',
  eletrica: 'Elétrica',
  eletricas: 'Elétricas',
  energetica: 'Energética',
  gas: 'Gás',
  industria: 'Indústria',
  industrias: 'Indústrias',
  itau: 'Itaú',
  itausa: 'Itaúsa',
  locacao: 'Locação',
  logistica: 'Logística',
  metalurgica: 'Metalúrgica',
  mineracao: 'Mineração',
  pao: 'Pão',
  participacoes: 'Participações',
  petroleo: 'Petróleo',
  previdencia: 'Previdência',
  raizen: 'Raízen',
  saude: 'Saúde',
  sao: 'São',
  seguranca: 'Segurança',
  servicos: 'Serviços',
  siderurgica: 'Siderúrgica',
  telecomunicacoes: 'Telecomunicações',
};

/** Trechos dentro de uma palavra composta (ex.: "PetroReconcavo"). */
const TRECHOS = [[/Reconcavo/g, 'Recôncavo']];

/** Dá à grafia correta a mesma inicial (maiúscula ou minúscula) da palavra original. */
function casarInicial(original, corrigida) {
  const primeira = original.charAt(0);
  if (primeira === primeira.toLowerCase()) {
    return corrigida.charAt(0).toLowerCase() + corrigida.slice(1);
  }
  return corrigida;
}

/**
 * Corrige a grafia de um nome de empresa. Devolve o próprio valor se não for texto.
 * @param {string} nome
 * @returns {string}
 */
export function corrigirNome(nome) {
  if (typeof nome !== 'string') return nome;

  const porPalavra = nome.replace(/[A-Za-zÀ-ÿ]+/g, (palavra) => {
    const corrigida = PALAVRAS[palavra.toLowerCase()];
    return corrigida ? casarInicial(palavra, corrigida) : palavra;
  });

  return TRECHOS.reduce((texto, [padrao, troca]) => texto.replace(padrao, troca), porPalavra);
}
