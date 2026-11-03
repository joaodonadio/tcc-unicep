import {
  Building2,
  Cpu,
  Factory,
  Fuel,
  HeartPulse,
  Landmark,
  Pickaxe,
  RadioTower,
  ShoppingBag,
  ShoppingBasket,
  Zap,
} from 'lucide-react';
import { semAcento } from '../../lib/listaAcoes.js';

// cada setor ganha um desenho que lembra o ramo; setor novo cai no prédio genérico
const ICONES = [
  ['consumo nao ciclico', ShoppingBasket],
  ['consumo ciclico', ShoppingBag],
  ['financeiro', Landmark],
  ['utilidade publica', Zap],
  ['bens industriais', Factory],
  ['materiais basicos', Pickaxe],
  ['petroleo', Fuel],
  ['saude', HeartPulse],
  ['tecnologia', Cpu],
  ['comunicacoes', RadioTower],
];

function iconeDoSetor(setor) {
  const nome = semAcento(String(setor ?? ''));
  return ICONES.find(([chave]) => nome.startsWith(chave))?.[1] ?? Building2;
}

/** Ícone decorativo do setor, num selo redondo de fundo claro (acento neutro; aria-hidden: o nome do setor vem ao lado). */
export function IconeSetor({ setor, tamanho = 18 }) {
  const Icone = iconeDoSetor(setor);
  return (
    <span className="icone-setor" aria-hidden="true">
      <Icone size={tamanho} strokeWidth={1.75} />
    </span>
  );
}
