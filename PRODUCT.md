# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Principal:** a banca examinadora e os professores do TCC, que avaliam o sistema na defesa e nos testes de usabilidade.
- **Secundário:** pessoas leigas, inclusive idosas, que investem ou querem começar a investir e têm pouca intimidade com finanças.

Uso em celular e em computador por igual.

## Product Purpose

Publicar todo dia útil, por volta das 08:30, os fatos do pregão anterior de 85 ações acompanhadas da B3, explicados em linguagem simples, e mostrar o experimento acadêmico que testa se o tom das notícias, lido pelo FinBERT, ajuda a prever quais ações superam o Ibovespa no pregão seguinte.

Sucesso: a banca consegue auditar cada número até a origem, e uma pessoa leiga consegue reexplicar uma sugestão com as próprias palavras.

## Positioning

Cada número traz a origem, a comparação com o setor e uma explicação em dois níveis (simples por padrão, técnica numa chave). As sugestões saem de regras públicas, visíveis na própria interface. O experimento aparece comparado ao acaso, sem esconder quando não ganha dele.

## Operating Context

- Os dados mudam uma vez por dia útil, depois da coleta (08:00) e do processamento (08:25). Dias sem pregão não têm publicação.
- A interface só lê dados por uma API de leitura com chave, que não pode ir para o navegador. Até a API ser publicada, lê os pacotes JSON de exemplo, idênticos à resposta da API.
- Apresentação na defesa do TCC em projetor e notebook; teste com 5 usuários e questionário SUS.

## Capabilities and Constraints

- Contrato 1.0 dos 8 pacotes: acoes, resumo_acao, series_diarias, fundamentos_trimestrais, proventos, mercado_dia, noticias_dia, execucao.
- Todo número vem como valor + status. Ausência nunca é mostrada como 0.
- Linguagem proibida: o termo para conselho de investimento personalizado (e suas variações), o imperativo do verbo que significa adquirir ação, o substantivo que promete chance única de ganho e as expressões de ranking de ações (o superlativo de "bom" seguido de "ações"). Não há exceção: nem o aviso fixo ("Conteúdo educativo: não é indicação de compra ou venda de ações.") escapa.
- As sugestões da interface são regras transparentes sobre campos prontos, sem métricas novas.
- O Top 5 do experimento (sugestão de teste acadêmico, não de compra) aguarda a coleta de 5 anos de histórico. O formato já está definido; a tela mostra que falta a coleta. Enquanto isso, a página inicial mostra um "Top 5 para estudar" montado só pelas regras públicas, com a ordem de escolha escrita na tela; ele não é o Top 5 do modelo.
- Sem chat de perguntas ao sistema.
- Preferências e itens acompanhados ficam só no navegador; a API não aceita escrita.

## Brand Commitments

- O produto não tem marca comercial. O cabeçalho só identifica o conteúdo ("Ações da B3"), sem logotipo nem slogan.
- Voz: português simples, frases curtas, sem caixa alta, sem jargão sem explicação.
- Nada com cara de interface gerada por IA: sem fundo escuro com brilho neon, sem rótulos em caixa alta espaçada, sem texto de efeito nem símbolos decorativos (decisão do usuário em 28/10/2026).

## Evidence on Hand

- Pacotes reais publicados em 23/10/2026 (pregão de 22/10/2026), em `public/dados/`.
- Guias da equipe: Guia da API para a interface, Guia dos pacotes para a interface, Especificação do módulo de processamento e a planilha de dados da interface.
- Não existem depoimentos, métricas de acerto nem resultados do experimento. Nada disso pode ser inventado.

## Product Principles

1. Explicar antes de mostrar.
2. Fato não é previsão.
3. Regras à vista.
4. Ausência também é informação.
5. Uma leitura para cada público.

## Accessibility & Inclusion

WCAG 2.2 AA como piso, com foco em pessoas idosas e com pouca intimidade com finanças: texto grande e ajustável, linguagem simples, termos explicados onde aparecem, leitura do resumo em voz alta.
