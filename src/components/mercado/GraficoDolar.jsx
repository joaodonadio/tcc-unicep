import { CartaoSerie } from './CartaoSerie.jsx';
import { useSerieDoDolar } from '../../hooks/useDados.js';
import { usePreferencias } from '../../context/contextos.js';
import { dataBR } from '../../lib/datas.js';
import { numero, pct } from '../../lib/formato.js';
import { humorDaVariacao } from '../../lib/mascote.js';
import { resumoDeSerie, sinalDoTexto } from '../../lib/mercadoTela.js';
import { porNivel, TEXTOS } from '../../lib/textos.js';

const formatarReais = (v) => `R$ ${numero(v, { casas: 2 })}`;

/**
 * Dólar em reais, um ponto por pregão (fechamento). A série vem da série diária do pacote (USDBRL);
 * sem ela, da rota local montada com as publicações diárias. A variação é do primeiro ao último pregão.
 */
export function GraficoDolar() {
  const { nivel } = usePreferencias();
  const consulta = useSerieDoDolar();
  const serie = consulta.data ?? null;
  const resumo = resumoDeSerie(serie);
  const titulo = porNivel(TEXTOS.mercado.dolar.titulo, nivel);
  const estado = consulta.isError ? 'erro' : consulta.isPending ? 'carregando' : 'pronto';

  let variacao = null;
  if (resumo?.variacao != null) {
    const texto = pct(resumo.variacao);
    variacao = { texto, sinal: sinalDoTexto(texto), legenda: TEXTOS.mercado.noPeriodo };
  }

  return (
    <CartaoSerie
      titulo={titulo}
      apoio={TEXTOS.mercado.dolar.apoio}
      pavio={humorDaVariacao(resumo?.variacao)}
      estado={estado}
      erro={consulta.error?.mensagemUsuario}
      onTentarNovamente={() => consulta.refetch()}
      valorAtual={resumo ? formatarReais(resumo.fim.valor) : null}
      variacao={variacao}
      serie={serie}
      rotuloGrafico={
        resumo
          ? TEXTOS.mercado.serieRotulo(titulo, dataBR(resumo.inicio.data), dataBR(resumo.fim.data), formatarReais(resumo.fim.valor))
          : titulo
      }
      vazio={TEXTOS.mercado.dolar.vazio}
      // montado pelas publicações: o selo já explica, sem repetir a nota
      nota={
        consulta.data?.origem === 'publicacoes'
          ? null
          : porNivel(consulta.data?.origem === 'serie' ? TEXTOS.mercado.dolar.notaSerie : TEXTOS.mercado.dolar.nota, nivel)
      }
      calculo={consulta.data?.origem === 'publicacoes' ? 'dolar' : undefined}
      cor="var(--cor-serie-1)"
      formatarValor={formatarReais}
    />
  );
}
