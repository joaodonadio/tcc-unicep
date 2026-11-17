# Interface do TCC: análise de ações da B3

Interface web do TCC **"Sistema Inteligente para Análise de Dados Financeiros e Investimentos"**. Mostra o que aconteceu no pregão das ações acompanhadas pelo projeto, quais dados acionaram cada regra e como cada conclusão foi montada. Os termos são explicados em linguagem simples ou técnica, conforme a escolha de quem lê.

Site publicado: https://tcc-unicep.vercel.app

> Conteúdo educativo: não é indicação de compra ou venda de ações. Projeto acadêmico.

## De onde vêm os dados

O site publicado busca os dados na API do projeto todos os dias e mostra sempre o pregão mais recente. A data aparece no topo da página Hoje.

A pasta `public/dados/` guarda uma **fotografia fixa** desses mesmos dados, tirada no pregão de 22/10/2026. Ela não aparece para quem acessa o site. Serve para duas coisas:

1. **Testes automáticos.** Antes de publicar, cerca de 2 mil testes conferem se cada número aparece certo na tela. Para isso, os números precisam ser sempre os mesmos: com os dados do dia, o teste mudaria a cada pregão e acusaria erro sem haver erro.
2. **Trabalhar sem a API.** Com a fotografia, dá para abrir o site no computador sem internet e sem a chave de acesso, por exemplo para mexer no visual.

O dia 22/10 não tem nada de especial: era o pregão mais recente quando a fotografia foi tirada.

## Requisitos

- Node.js 20 ou superior
- npm

## Instalação e execução

```bash
npm install
npm run dev
```

Abra http://localhost:5173. Por padrão, a interface lê a fotografia de `public/dados/` e não depende da API. Para usar os dados do dia, veja "Usar a API de leitura".

## Páginas

| Endereço | Página |
|---|---|
| `/` | Hoje: resumo do pregão, Top 5 para estudar, números do dia e blocos de apoio |
| `/mercado` | Mercado: índices em grupos e gráficos do dólar e de juros, sem abas |
| `/setores` | Setores: o que mudou em cada setor, por período |
| `/acoes` | Ações: o mapa do pregão por setor |
| `/proventos` | Proventos: agenda de pagamentos e ranking |
| `/noticias` | Notícias: tom das manchetes do último pregão |
| `/modelo` | O modelo: de onde vêm os dados e o modelo experimental |
| `/dados` | Sobre os dados: o que chegou na última atualização |
| `/acao/:ticker` | Ficha da ação, em perguntas |

`/sugestoes` vai para `/acoes`. Qualquer outro endereço vai para `/`.

No menu, Proventos, Notícias, O modelo e Sobre os dados aparecem na linha a partir de 1280px. Entre 721px e 1279px, e no celular, ficam no menu Mais.

## Atualizar os pacotes de dados

Copie os oito pacotes JSON do processamento para `public/dados/`:

```bash
npm run dados:copiar -- "C:/caminho/para/a-pasta-dos-pacotes"
```

O script copia os arquivos sem alterar nenhum byte e confere o envelope de cada um: campo `pacote`, `versao_contrato` na versão 1.x e lista `registros`. Se algum arquivo estiver ausente ou inválido, o script informa qual é e termina com erro.

Os oito pacotes são: `acoes.json`, `resumo_acao.json`, `series_diarias.json`, `fundamentos_trimestrais.json`, `proventos.json`, `mercado_dia.json`, `noticias_dia.json` e `execucao.json`.

## Usar a API de leitura

1. Copie `.env.example` para `.env`.
2. Preencha as variáveis:

   ```
   VITE_FONTE_DADOS=api
   VITE_API_PREFIXO=/api
   API_BASE_URL=<endereço base da API>
   API_KEY=<chave de acesso>
   ```

3. Reinicie o `npm run dev`.

Pontos de atenção:

- `API_BASE_URL` e `API_KEY` **não podem ter o prefixo `VITE_`**. Variáveis com esse prefixo entram no código enviado ao navegador, e qualquer visitante as veria.
- O proxy do servidor de desenvolvimento e do `npm run preview` acrescenta o cabeçalho `X-API-Key`. A chave não entra no build.
- Em produção (Vercel), o proxy do Vite não existe. Quem faz esse papel é a função `api/proxy.js`: recebe as chamadas em `/api`, acrescenta `X-API-Key` no servidor e encaminha à API.

Para trabalhar o design com o painel cheio, use `VITE_FONTE_DADOS=simulado`: os pacotes de `public/dados/` ganham valores simulados com semente fixa (série do dólar, ações estáveis, tom das notícias desigual e pagamentos nos próximos dias). `VITE_MOCK_LATENCY_MIN`, `VITE_MOCK_LATENCY_MAX` e `VITE_MOCK_ERROR_RATE` simulam atraso e falha. Esses números não são reais.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento, em http://localhost:5173 |
| `npm run build` | Build de produção, com separação do código por tela |
| `npm run preview` | Serve o build localmente, com o mesmo proxy de `/api` |
| `npm run compartilhar` | Build de desenvolvimento servido na porta 4173, para mostrar o site a outra pessoa |
| `npm run lint` | Análise estática com ESLint |
| `npm test` | Testes automatizados com Vitest (cerca de 2.000 testes em 151 arquivos) |
| `npm run test:watch` | Testes em modo de observação |
| `npm run dados:copiar -- "<pasta>"` | Copia e confere os pacotes do processamento |

## Modelos 3D

O site usa objetos 3D em algumas telas. A biblioteca Three.js só é baixada quando um quadro com objeto chega perto da tela.

Os modelos `.glb` ficam em `public/modelos/` e são gerados pelos scripts do Blender em `scripts/blender/`:

- `cofrinho.py` gera `public/modelos/cofrinho.glb`;
- `setores.py` gera os onze arquivos de `public/modelos/setores/`, um por setor.

Para gerar, com o Blender instalado, a partir da raiz do projeto:

```powershell
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python scripts/blender/cofrinho.py
& "C:\Program Files\Blender Foundation\Blender 5.2\blender.exe" --background --factory-startup --python scripts/blender/setores.py
```

Os scripts aceitam argumentos depois de `--` (por exemplo, `--previa` para gerar uma imagem de conferência). Veja o cabeçalho de cada um.

## Estrutura do código

```
src/
  App.jsx                 rotas de todas as páginas, com carregamento sob demanda
  pages/                  uma página por rota (Hoje, Mercado, Setores, Acoes, Proventos, Noticias, Modelo, Dados e Ficha)
  components/
    layout/               cabeçalho, controles de leitura, layout comum, rodapé e tela de erro de rota
    hoje/                 blocos da página Hoje (Como usar, Top 5, números do dia, gráfico do Ibovespa, resumos)
    acoes/                mapa do pregão da página Ações
    ficha/                perguntas, painéis e fundamentos da ficha da ação
    mercado/              componentes da página Mercado
    setores/              vitrine 3D, mosaico e resumo dos setores
    modelos3d/            objetos 3D da ficha e do Top 5 (carregados sob demanda)
    proventos/            resumo, agenda, gráfico e ranking de proventos
    noticias/             manchetes e tom das notícias
    modelo/               conteúdo da página O modelo (inclui a régua de acerto)
    dados/                conteúdo da página Sobre os dados
    regras/               explicação das regras de sinal
    graficos/             gráficos em SVG e ECharts
    ui/                   estados de carregamento, erro e vazio, termos com balão e botões
  context/                preferências de leitura
  hooks/                  consultas (TanStack Query), análise do dia e apoio (rolagem, movimento reduzido)
  lib/                    regras de sinal (sugestoes.js), perguntas da ficha, lista de ações, setores, textos (TEXTOS) e funções puras
  services/               fontes de dados (arquivos, API e simulada), contrato, erros e experimento
  styles/                 tokens de cor e tipografia (tokens.css), um arquivo por tela e por componente
  test/                   testes automatizados, em pastas por área
public/dados/             fotografia fixa dos pacotes (22/10/2026), usada nos testes
public/modelos/           modelos 3D (.glb)
scripts/copiar-dados.mjs  cópia e conferência dos pacotes
scripts/blender/          scripts que geram os modelos 3D
docs/                     documentação: arquitetura da interface e guia do usuário
```

## Visual

Tema escuro cinza-quente, com destaque âmbar. As fontes são a Atkinson Hyperlegible Next (títulos e texto) e a Atkinson Hyperlegible Mono (números), instaladas pelo próprio projeto. As cores e a tipografia ficam em `src/styles/tokens.css`. O projeto segue as preferências de movimento do sistema operacional: com movimento reduzido, as animações deixam de rodar.

## Documentação

- [Guia do usuário](docs/GUIA-DO-USUARIO.md): como ler cada página e a ficha da ação.
- [Arquitetura da interface](docs/ARQUITETURA-INTERFACE.md): rotas, contratos de dados, regras de sinal, decisões técnicas, acessibilidade e testes.
