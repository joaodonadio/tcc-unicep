# Guia do usuário

Todo dia útil, o site mostra o que aconteceu no pregão anterior com as ações da B3 acompanhadas pelo projeto, em linguagem simples. Também mostra o experimento acadêmico do TCC, que testa se o tom das notícias ajuda a prever quais ações vão superar o Ibovespa.

> Conteúdo educativo: não é indicação de compra ou venda de ações.

## Antes de começar

- **De quando são os dados:** os dados chegam de manhã e trazem o fechamento do pregão anterior. A página Hoje mostra a data do pregão no título, e a página Sobre os dados mostra o que chegou na última atualização.
- **Aviso de atualização:** se a coleta do dia não terminar bem, um aviso aparece no cabeçalho. Nesse caso, parte dos dados pode ser do pregão anterior.
- **Quando falta um dado:** o lugar do valor mostra o texto "Indisponível", ou a explicação do motivo quando ela existe. O site nunca troca um dado ausente por zero.
- **Leitura:** o botão Leitura, no cabeçalho, abre um painel com as opções de leitura:
  - Simples ou Técnica: escolhe entre explicações em palavras simples e explicações com fórmulas, limites e valores;
  - A− e A+: diminuem ou aumentam o tamanho do texto, de 90% a 130%, em passos de 10%;
  - Como usar: leva ao bloco que explica as páginas do site, no início da página Hoje.

  Para fechar o painel, toque fora dele ou use a tecla Esc.
- **Termos explicados:** palavras com um traço pontilhado abrem um balão com a explicação. Para fechar o balão, use a tecla Esc. Não há um painel lateral de glossário.
- **Lembrança no seu navegador:** o nível de leitura, o tamanho do texto, a Minha lista e o bloco Como usar fechado ficam guardados só no seu navegador.

## Cabeçalho

Fica sempre no topo da página:

- o nome "Ações da B3", que leva à página Hoje;
- os links das páginas: Hoje, Mercado, Setores e Ações. Em telas a partir de 1280px, todas aparecem na linha. Entre 721px e 1279px, e no celular, Proventos, Notícias, O modelo e Sobre os dados ficam no menu Mais (no celular, o botão Mais fica na barra inferior);
- o ícone de lista, com o número de ações em Minha lista;
- o botão Leitura.

## Hoje

A página inicial (`/`). Mostra o essencial do pregão. Cada bloco tem um link para a página completa.

- **Como usar:** explica os blocos da página. Use o X para fechar; ele não volta enquanto você não reabrir pelo botão Como usar do cabeçalho.
- **Top 5 para estudar hoje:** cinco ações que as regras destacaram no pregão, para estudar com calma. Toque numa delas para ver o porquê.
  - Quando o modelo de previsão ainda está em avaliação, a lista segue as regras, nesta ordem: mais pontos a favor, depois menos pontos de atenção e, no empate, mais negociação que o normal. Se ainda empatar, vale a ordem alfabética do código.
  - O bloco Entenda com um objeto mostra um objeto 3D que ilustra o ponto escolhido.
- **Resumo do dia:** um texto curto sobre o pregão. "Ouvir o resumo" faz o navegador ler o texto em voz alta. O botão só aparece se o navegador tiver essa função.
- **Números do dia:** Ibovespa, dólar, Selic, CDI, IPCA e a amplitude do pregão. Logo abaixo, uma linha diz de onde vem cada dado, por exemplo: "Ibovespa, CDI, IPCA e altas e quedas: pacotes do pregão de 22/10/2026. Selic: Banco Central, valor em vigor."
- **Gráfico do Ibovespa:** a variação do índice nos últimos 6 meses.
- **Destaques do dia:** quem mais subiu, quem mais caiu e as ações com volume fora do comum.
- **Proventos, notícias e Minha lista:** um resumo de cada um, com link para a página completa.

## Mercado

Quatro abas: Índices, Juros e dólar, Setores e Destaques. A página também mostra o mapa do pregão, em que cada setor é uma linha colorida e cada ação é uma estação.

## Setores

Mostra o que mudou em cada setor e compara os setores entre si. Você escolhe o período (1 dia, 1 mês, 6 meses ou 1 ano). A cena com colunas 3D é decorativa: a lista ao lado traz as mesmas informações em texto.

## Ações

- **Abas:** Todas, Pontos fortes, Atenção, Só contexto e Minha lista. Uma ação pode aparecer em mais de uma aba, conforme as regras que se aplicaram a ela.
- **Busca:** digite o código (por exemplo, PETR4) ou parte do nome da empresa.
- **Guardar:** cada linha tem o botão Guardar, que leva a ação para a Minha lista.
- **Endereço:** a aba escolhida fica no endereço da página. Se você copiar o endereço, ele abre na mesma aba.

## Minha lista

- Reúne as ações que você quer acompanhar.
- Fica só no seu navegador. Nada é enviado. Outro navegador ou outro computador mostram outra lista.
- Para usar, toque em Guardar numa ação da página Ações. O ícone de lista do cabeçalho mostra quantas ações há na lista e leva a ela.

## Proventos

Agenda de pagamentos de dividendos e JCP, com gráfico por mês e um ranking de quem mais pagou.

## Notícias

O tom das manchetes do último pregão, com as empresas mais citadas. As manchetes em outra língua aparecem em português quando a tradução está disponível.

## O modelo

De onde vêm os dados, como funciona o modelo experimental e a comparação entre o acerto do modelo e o acaso, que é de 50%. Enquanto o resultado carrega, a seção mostra linhas de espera. Sem histórico suficiente, a página mostra que ainda não há resultado para comparar. Se a consulta falhar, aparece uma mensagem com o botão para tentar de novo.

## Sobre os dados

O que chegou na última atualização, avisos sobre os dados e as fontes.

## Ficha da ação

Endereço `/acao/` seguido do código da ação, por exemplo `/acao/PETR4`. Abre pelo código de cada ação nas outras páginas.

A ficha traz uma faixa de fundamentos da empresa e responde perguntas, uma por vez, em abas:

1. O que as regras dizem?
2. Ela deve muito?
3. Está cara?
4. Paga proventos?
5. Oscila muito?
6. Como foi o preço?
7. O que dizem as notícias?

- **Escolha de pergunta:** toque na aba da pergunta. A pergunta aberta fica no endereço da página, então você pode compartilhar a pergunta exata.
- **Explicação de cada número:** cada indicador tem uma frase que explica o que ele mede, e a linha "De onde vem" diz a origem do número (pregão da B3, balanços da empresa ou Banco Central).
- **Motivo da ausência:** quando um indicador não existe para a empresa, o lugar do valor mostra "Indisponível" ou "Não se aplica", com o motivo logo abaixo.
- **Voltar:** o botão "Voltar à página anterior" volta à página de onde você veio. Se você abriu a ficha direto pelo endereço, o botão leva à página Ações.
- **Entenda com um objeto:** alguns blocos trazem um objeto 3D que ilustra a ideia da pergunta.
- **Modo Técnica:** a ficha mostra mais detalhes.
  - Em "Ela deve muito?", os balanços trimestrais.
  - Em "Está cara?", o histórico do indicador, dia a dia.
  - Em "Como foi o preço?", o retorno da ação por período.

## Endereços antigos

- `/sugestoes` abre a página Ações.
- Qualquer outro endereço abre a página Hoje.

## Perguntas frequentes

- **Por que os dados são de ontem?** O pregão de hoje ainda não terminou quando os dados chegam de manhã.
- **O site indica compra ou venda?** Não. As regras apontam fatos para estudar. Elas não preveem preço.
- **Onde ficam as minhas marcações?** Só no seu navegador, na Minha lista. Nada é enviado.
