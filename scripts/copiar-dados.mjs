// Copia os 8 pacotes JSON do processamento, sem alterar nenhum byte,
// para public/dados/ e confere o envelope do contrato 1.0.
// Uso: node scripts/copiar-dados.mjs "<pasta com os pacotes>"
import fs from 'node:fs';
import path from 'node:path';

const PACOTES = [
  'acoes.json',
  'resumo_acao.json',
  'series_diarias.json',
  'fundamentos_trimestrais.json',
  'proventos.json',
  'mercado_dia.json',
  'noticias_dia.json',
  'execucao.json',
];

const origem = process.argv[2];
if (!origem) {
  console.error('Informe a pasta de origem. Ex.: node scripts/copiar-dados.mjs "C:/Users/voce/Downloads/2026-10-23"');
  process.exit(1);
}

const destino = path.resolve(process.cwd(), 'public', 'dados');
fs.mkdirSync(destino, { recursive: true });

let falhou = false;
for (const nome of PACOTES) {
  const de = path.resolve(origem, nome);
  const para = path.join(destino, nome);
  if (!fs.existsSync(de)) {
    console.error(`Arquivo ausente na origem: ${de}`);
    falhou = true;
    continue;
  }
  fs.copyFileSync(de, para);
  try {
    const json = JSON.parse(fs.readFileSync(para, 'utf8'));
    const problemas = [];
    if (typeof json.pacote !== 'string') problemas.push('sem "pacote"');
    if (!String(json.versao_contrato ?? '').startsWith('1.')) problemas.push(`versão ${json.versao_contrato}`);
    if (!Array.isArray(json.registros)) problemas.push('sem "registros"');
    if (problemas.length) {
      console.error(`${nome}: ${problemas.join(', ')}`);
      falhou = true;
      continue;
    }
    const kb = (fs.statSync(para).size / 1024).toFixed(0);
    console.log(`${nome.padEnd(30)} ${json.pacote.padEnd(24)} v${json.versao_contrato}  ${String(json.registros.length).padStart(5)} registros  ${kb} KB`);
  } catch (erro) {
    console.error(`${nome}: JSON inválido (${erro.message})`);
    falhou = true;
  }
}

if (falhou) process.exit(1);
console.log(`Pacotes copiados para ${destino}`);
