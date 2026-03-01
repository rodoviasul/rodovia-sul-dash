# PROMPT: IDENTIDADE VISUAL — RODOVIA SUL FINANCIAL DASHBOARD

---

## CONTEXTO DO PROJETO (PRÉ-PREENCHIDO)

- **Nome do projeto:** Rodovia Sul — Dashboard Financeiro Gerencial
- **O que faz:** Dashboard de análise financeira com DRE Gerencial e Fluxo de Caixa. Visão consolidada da saúde financeira da empresa — receitas, custos operacionais, margens, resultado líquido e movimentação de caixa. Dados ainda não conectados ao BD — o dashboard deve ser estruturado para receber os dados quando a integração estiver pronta.
- **Para quem:** Diretoria e sócios. Pessoas que conhecem o negócio profundamente, não precisam de explicações básicas, precisam de julgamento rápido: "estamos bem ou mal esse mês? onde está sangrando? o caixa aguenta?"
- **Tipo de dado dominante:** Séries temporais mensais (receita, custos, margens), composição de custos por categoria operacional (combustível, manutenção, pedágios, mão de obra, etc.), waterfall de resultado (DRE em cascata), fluxo acumulado de caixa vs. projeção.
- **Sensação desejada:** Sala de reunião de diretoria de uma transportadora séria. Não é fintech, não é startup — é uma empresa familiar de 40 anos que opera com precisão. O dashboard deve ter a seriedade de um relatório contábil com a agilidade de um cockpit executivo. Como abrir um dossiê financeiro onde cada número já tem seu contexto e cada tendência já tem seu sinal de alerta.
- **O que NÃO quer parecer:** Excel reestilizado, PowerPoint de apresentação, dashboard de startup com gradientes coloridos, Tableau genérico, sistema ERP com tela de relatório.
- **Mode:** Light — empresa tradicional, diretoria acostumada a documentos impressos e relatórios em papel. Light mode transmite formalidade e legibilidade em reunião.
- **Referência de energia:** "A sobriedade do relatório anual da Vale + a precisão do Bloomberg + a clareza editorial do Financial Times"
- **Cor accent:** Azul institucional da Rodovia Sul — sugerido `#1A4B8C` (azul profundo, sério, confiável). UMA cor. Todo o resto é neutro.

---

## CONTEXTO DA EMPRESA — RODOVIA SUL

**Quem é:** Transportadora fundada em 1981, sede em Santa Rosa/RS. Empresa familiar com mais de 40 anos de mercado no segmento de carga fracionada e direta interestadual.

**Operação:** 4 unidades (Santa Rosa/matriz, Porto Alegre, São Paulo, Curitiba). Frota de 52 veículos próprios + 50 agregados. Mais de 200 toneladas/dia e 215.000 volumes/mês. Certificada ISO 9002.

**Implicações para o dashboard financeiro:**
O DRE gerencial de uma transportadora tem linhas de custo muito específicas que precisam ter peso visual próprio:
- **Combustível** — maior custo variável, altamente sensível ao preço do diesel
- **Manutenção de frota** — custo recorrente com picos sazonais
- **Pedágios** — custo fixo por rota, previsível mas relevante
- **Mão de obra (motoristas + operação)** — maior custo fixo
- **Seguro de carga e frota** — custo periódico
- **Terceiros / agregados** — custo variável de frete terceirizado

O fluxo de caixa de transportadora tem sazonalidade característica: picos de receita em períodos comerciais fortes (novembro/dezembro, pré-colheita do agro no sul) e meses mais fracos no início do ano. O dashboard deve refletir e contextualizar essa sazonalidade.

---

## ESTRUTURA DE DADOS ESPERADA

O banco de dados ainda não está conectado. A IA que implementa deve estruturar o dashboard com **dados mockados realistas** para uma transportadora de médio porte, organizados nas seguintes estruturas que serão substituídas pela integração real:

### DRE Gerencial — estrutura esperada
```
Receita Bruta de Fretes
  (-) Impostos sobre Serviços (ISS, PIS, COFINS)
= Receita Líquida

  (-) Custos Operacionais Diretos
      • Combustível
      • Manutenção de Frota
      • Pedágios
      • Motoristas (salários + encargos)
      • Frete Terceiros / Agregados
      • Seguro de Carga
= Lucro Bruto

  (-) Despesas Operacionais
      • Pessoal Administrativo
      • Aluguel / Instalações
      • Tecnologia e Sistemas
      • Despesas Comerciais
      • Depreciação de Frota
= EBITDA (aproximado gerencial)

  (-) Resultado Financeiro (juros, IOF, tarifas bancárias)
= Resultado Antes do IR

  (-) IR / CSLL (estimado)
= Resultado Líquido
```

### Fluxo de Caixa — estrutura esperada
```
Saldo Inicial
  (+) Recebimentos de Clientes
  (+) Outras Entradas
  (-) Pagamentos Operacionais
      • Combustível
      • Manutenção
      • Folha de Pagamento
      • Fornecedores / Terceiros
      • Impostos e Taxas
  (-) Investimentos (CAPEX — compra de veículos, equipamentos)
  (-) Serviço da Dívida (financiamentos de frota)
= Saldo Final do Período

Caixa Disponível
Projeção dos próximos 3 meses
```

### Dimensões de filtro (para quando o BD estiver conectado)
- `periodo`: mês/ano de referência (filtro principal)
- `filial`: Santa Rosa / Porto Alegre / São Paulo / Curitiba / Consolidado
- `categoria_custo`: para drill-down no breakdown de custos
- `tipo_carga`: fracionada / direta (quando disponível)

---

## O QUE ESTE PROMPT FAZ

Você vai criar uma identidade visual ORIGINAL para o dashboard financeiro da Rodovia Sul. Não é trocar cores de um template de DRE. É criar uma experiência onde cada linha do resultado tem contexto, cada variação tem sinal, e a diretoria abre o dashboard e em 30 segundos sabe se o mês foi bom, onde está o problema, e se o caixa está seguro.

A interface age como um controller experiente que já analisou tudo e está apresentando as conclusões — não os dados brutos.

---

## A MENTALIDADE DA DIRETORIA DE TRANSPORTADORA

Os sócios da Rodovia Sul não abrem o dashboard para aprender sobre finanças. Eles abrem para responder três perguntas:

**"Como foi o mês?"** → Resultado líquido vs. mês anterior vs. mesmo mês do ano passado. Margem líquida. Simples e rápido.

**"Onde está sangrando?"** → Qual linha de custo cresceu acima do esperado? Combustível subiu junto com o diesel? Manutenção teve pico? Terceiros cresceram mais que a receita?

**"O caixa aguenta?"** → Saldo atual, projeção dos próximos meses, compromissos relevantes à vista.

A interface responde essas três perguntas ANTES de o sócio precisar formulá-las. Esse é o padrão.

---

## A REGRA DAS BIBLIOTECAS DE GRÁFICOS

### PROIBIDO:
- **Recharts** — padrão do React, zero personalidade
- **Chart.js** — canvas genérico, sem anotações editoriais
- **Victory** — previsível
- **ApexCharts** — aparência de sistema ERP dos anos 2010

### OBRIGATÓRIO para este projeto — combinação recomendada:

| Biblioteca | Por quê neste projeto |
|---|---|
| **Observable Plot** | DNA editorial do FT — perfeito para o DRE em cascata (waterfall), séries temporais de margem e o gráfico de fluxo acumulado. Grammar of graphics com aparência de relatório financeiro sério |
| **Visx (Airbnb)** | Primitivos React sobre D3 — para o breakdown de custos com encoding semântico customizado e o gráfico de composição de receita por filial |
| **D3.js** (pontual) | Para o waterfall do DRE, que exige posicionamento de rótulos e encoding de direção (positivo/negativo) com precisão que Observable Plot não entrega nativamente |

---

## AS QUATRO CAMADAS DO STORYTELLING VISUAL

### Camada 1: ESTRUTURA NARRATIVA

**Hierarquia editorial — três zonas de leitura:**

**ZONA 1 — MANCHETE EXECUTIVA (topo):**
Três números em tipografia dramática que respondem "como foi o mês" em 10 segundos:
1. **Resultado Líquido do mês** — número grande com encoding de cor (azul se positivo, vermelho funcional se negativo) + delta vs. mês anterior + delta vs. mesmo mês ano anterior
2. **Margem Líquida %** — percentual com referência histórica inline: "melhor margem desde Agosto 2023" ou "abaixo da média dos últimos 12 meses"
3. **Saldo de Caixa atual** — com indicador de tendência (subindo/descendo) e dias de cobertura operacional estimados

Abaixo dos três números, uma linha narrativa em `font-editorial`: "Rodovia Sul · Fevereiro 2025 · Receita R$X · Custos R$Y · Margem X%"

**ZONA 2 — CONTEXTO ANALÍTICO (meio):**
Dois painéis lado a lado:
- **Esquerdo:** DRE em cascata (waterfall) do mês — da receita bruta ao resultado líquido, cada linha como uma barra que adiciona ou subtrai valor
- **Direito:** Breakdown de custos operacionais — composição proporcional das categorias de custo

Abaixo dos dois painéis:
- **Esquerdo:** Série temporal de receita + resultado líquido dos últimos 12 meses
- **Direito:** Fluxo de caixa acumulado no ano com projeção

**ZONA 3 — DETALHE (baixo):**
Tabela do DRE completo com todas as linhas, valores do mês atual, mês anterior, mesmo mês ano passado, e variações percentuais. Linha por linha, com encoding de cor nas variações que extrapolam limites normais.

**Filtros como narrativa:**
Seletor de período (mês/ano) no topo da manchete — discreto mas sempre visível. Quando o filtro de filial estiver disponível, aparece como seletor secundário à direita do período. A troca de período atualiza a manchete primeiro (animação rápida de fade), depois os gráficos de contexto, depois a tabela.

**Navegação:**
Sem sidebar. Duas abas no topo: **Resultado** (DRE gerencial) e **Caixa** (fluxo de caixa). A aba ativa tem borda inferior em `accent-primary`. A interface inteira muda ao trocar de aba — não são subseções da mesma tela, são duas visões independentes com a mesma linguagem visual.

### Camada 2: LINGUAGEM VISUAL

**Tipografia:**
- `font-display`: **Playfair Display** — para os números grandes da manchete (resultado líquido, margem, saldo de caixa). Serifa elegante que evoca relatório financeiro de prestígio, não dashboard de tech
- `font-editorial`: **Source Serif 4** — para anotações dentro dos gráficos, tooltips narrativos, a linha de resumo da manchete. Legibilidade de leitura longa com personalidade editorial
- `font-ui`: **Inter Display** (variante display, não a versão genérica) ou **Outfit** — para labels de navegação, filtros, cabeçalhos de tabela. Limpo sem ser genérico
- `font-data`: **IBM Plex Mono** — para valores monetários em tabelas, eixos, percentuais, variações. Precisão tabular com personalidade analítica

**Sistema de cor — Azul institucional + neutros:**
Base light (branco/cinza muito claro) + **`#1A4B8C`** como ÚNICA cor vibrante. Nada mais.

O azul aparece em: números positivos na manchete, barras de receita no waterfall, série principal nos gráficos de tendência, borda ativa de abas, botões de ação, indicadores acima da meta.

**Encoding semântico de cor:**
- Receita / entradas / positivo: azul `accent-primary`
- Custos / saídas / deduções no waterfall: cinza médio neutro — não vermelho, para não alarmar o que é operação normal
- Resultado final positivo: azul `accent-primary` com opacidade plena
- Resultado final negativo: `data-negative` vermelho funcional — apenas quando o resultado líquido é de fato negativo
- Variação acima de +10% positivo: `data-positive` verde funcional — apenas em deltas de tabela
- Variação abaixo de -10%: `data-negative` vermelho funcional — apenas em deltas de tabela

**Geometria:**
Cantos com radius moderado (6-8px) nos cards — nem completamente reto (frio demais para diretoria tradicional), nem pill (jovem demais). A interface é séria mas não austera.

**Densidade:**
Média-alta. A diretoria conhece os números, não precisa de espaço vazio. Mas como é light mode e o público é executivo sênior, há mais respiro que o Bloomberg Terminal — mais próximo de um relatório impresso bem diagramado.

**Eixos e grids:**
Grid horizontal sutil em `border-subtle` (opacity 15%). Sem grid vertical. Labels de eixo em `font-data` tamanho mínimo, `text-muted`. Linha de zero sempre visível quando o gráfico cruza o eixo (resultado pode ser negativo).

### Camada 3: ANATOMIA DOS GRÁFICOS

**Sistema de anotações específico para finanças:**
- Linha tracejada horizontal mostrando **média dos últimos 12 meses** em cada gráfico temporal — label inline: "Média 12m"
- Linha tracejada horizontal mostrando **mesmo período do ano anterior** — label inline: "2024"
- Em meses com variação de preço de diesel acima de X%: anotação vertical com label "Diesel +X%" — contexto externo que explica o custo
- Em meses de alta sazonalidade (novembro, dezembro, março para o agro): banda de fundo em `accent-subtle` com label de sazonalidade

**Encoding semântico específico:**
- Barras do waterfall: receita bruta em azul pleno → cada dedução/custo em cinza neutro descendo → resultado final em azul pleno (se positivo) ou `data-negative` (se negativo)
- No breakdown de custos: a categoria com maior crescimento vs. mês anterior tem borda esquerda em `data-negative` translúcida + label de variação
- No fluxo de caixa: área acima da linha de saldo inicial em `accent-subtle` (entradas positivas), área abaixo em `data-context` (saídas), linha de saldo acumulado em `accent-primary` espessa

### Camada 4: RITMO EDITORIAL

**A Manchete:**
A primeira coisa que o sócio vê não é uma tabela de DRE. É o veredicto do mês — três números com seus contextos, numa tipografia que transmite peso e seriedade. O resultado líquido em `font-display` tamanho grande é o título do relatório. Os outros dois números são os subtítulos. A linha narrativa é o lead da notícia.

**O Desenvolvimento:**
O waterfall do DRE conta a história de como se chegou ao resultado — da receita bruta descendo linha a linha até o resultado líquido. É a narrativa visual do demonstrativo. Ao lado, o breakdown de custos revela onde está a concentração. Abaixo, a série temporal mostra se o mês foi exceção ou tendência.

**O Detalhe:**
A tabela completa do DRE fica disponível abaixo, com todas as linhas, mas com peso visual menor — é para quem quer confirmar um número específico, não para quem está lendo o resumo executivo.

---

## CONCEITOS VISUAIS POR COMPONENTE

### 1. Waterfall do DRE Gerencial

**Representa:** A jornada do dinheiro — como a receita bruta se transforma em resultado líquido depois de cada dedução e custo.

**Descoberta que comunica:** "Em qual etapa está sendo perdida mais margem — impostos, custos diretos, ou despesas operacionais?"

**Biblioteca:** D3.js — o waterfall com rótulos posicionados acima/abaixo de cada barra e a linha de conexão entre barras exige controle de pixel que Observable Plot não entrega nativamente.

**Anatomia detalhada:**
Barras verticais sequenciais. A primeira barra (Receita Bruta) parte do zero e sobe — cor `accent-primary`, altura proporcional ao valor. As barras seguintes (deduções e custos) "flutuam" — começam no nível onde a barra anterior terminou e descem, cor `data-context` (cinza neutro). A barra final (Resultado Líquido) parte do zero novamente, cor `accent-primary` se positivo ou `data-negative` se negativo — é o veredito visual.

Linhas horizontais tracejadas finas em `border-subtle` conectam o topo de cada barra ao início da próxima — mantém a continuidade visual da cascata.

Rótulo acima de cada barra: valor em `font-data text-primary` e nome da linha em `font-ui text-muted` tamanho menor abaixo do valor. A barra de Resultado Líquido tem o rótulo em tamanho maior e cor `accent-primary` ou `data-negative` — é o ponto de destaque.

Ao hover em qualquer barra: tooltip narrativo com nome da linha, valor absoluto, % da receita bruta, e variação vs. mês anterior.

**Viabilidade:** Código puro com D3.js — o waterfall financeiro é um dos casos canônicos de uso de D3 para encoding posicional complexo.

---

### 2. Série Temporal de Resultado (12 meses)

**Representa:** A trajetória — não apenas onde estamos hoje, mas se estamos melhorando ou piorando.

**Descoberta que comunica:** "O resultado deste mês é uma anomalia ou confirma uma tendência?"

**Biblioteca:** Observable Plot — área chart com encoding de sinal (positivo/negativo) é o caso de uso ideal do Plot.

**Anatomia detalhada:**
Duas séries sobrepostas no mesmo canvas:
- **Receita líquida:** área preenchida em `accent-subtle` (azul muito translúcido), linha superior em `accent-primary` espessura 2px
- **Resultado líquido:** linha em `accent-primary` espessura 2.5px com pontos nos meses. Quando o resultado é negativo em algum mês, o segmento da linha naquele mês muda para `data-negative` e a área abaixo do zero é preenchida em `data-anomaly-bg`

Linha tracejada horizontal em `data-target` mostrando a média de resultado líquido dos 12 meses — label inline à direita: "Média: R$X"

Segunda linha tracejada em `data-context` mostrando o mesmo período do ano anterior (série defasada) — label inline: "2024"

Marcador especial no mês atual (o mais recente): círculo em `accent-primary` com borda branca de 2px — é onde estamos agora.

Em meses com sazonalidade conhecida (novembro/dezembro): banda de fundo vertical em `accent-subtle` opacidade 30% com label no topo: "Alta temporada"

Tooltip ao hover: "Fevereiro 2025 · Receita Líq: R$X · Resultado: R$Y · Margem: X% · vs. Fev 2024: +/-Z%"

**Viabilidade:** Código puro com Observable Plot.

---

### 3. Breakdown de Custos Operacionais

**Representa:** A anatomia dos custos — onde está sendo gasto cada real dos custos diretos.

**Descoberta que comunica:** "Qual categoria de custo está crescendo acima do esperado e comprimindo a margem?"

**Biblioteca:** Visx — para o bar chart horizontal com encoding de variação e borda semântica customizada.

**Anatomia detalhada:**
Bar chart horizontal ordenado por valor decrescente (maior custo no topo). Cada barra representa uma categoria de custo: Combustível, Motoristas, Frete Terceiros, Manutenção, Pedágios, Seguro, Outros.

Barras em `surface-elevated` (cinza claro) como base. A barra de Combustível — tipicamente a maior — tem fill em `data-context` mais escuro para refletir seu peso. Todas as outras em cinza mais claro.

À direita de cada barra: valor absoluto em `font-data text-primary` + percentual do custo total em `font-data text-muted`.

Encoding de variação: à esquerda de cada barra, uma pequena coluna de delta vs. mês anterior. Se a categoria cresceu mais de 5%: delta em `data-negative` com seta para cima. Se caiu mais de 5%: delta em `data-positive` com seta para baixo. Se estável: delta em `text-muted`.

A categoria com maior crescimento percentual vs. mês anterior tem borda esquerda vertical em `data-negative` de 3px — é o alerta editorial silencioso. Label acima dessa barra: "↑ Maior variação do mês" em `font-editorial text-muted` tamanho mínimo.

Tooltip ao hover: "Combustível · R$X · 34% dos custos diretos · +8% vs. Jan · Diesel subiu 6% no período"

**Viabilidade:** Código puro com Visx.

---

### 4. Fluxo de Caixa Acumulado

**Representa:** A segurança financeira — não apenas quanto tem, mas se o caixa está crescendo ou encolhendo ao longo do ano.

**Descoberta que comunica:** "O caixa está em trajetória saudável ou há um ponto de pressão à frente?"

**Biblioteca:** Observable Plot — área com linha de saldo acumulado e encoding de zona de segurança.

**Anatomia detalhada:**
Eixo X: meses do ano (janeiro a dezembro). Eixo Y: saldo acumulado em R$.

Área preenchida abaixo da linha de saldo: `accent-subtle` quando saldo positivo e crescendo, `data-anomaly-bg` quando saldo está abaixo de um threshold mínimo definido (ex: 1 mês de custo operacional).

Linha de saldo acumulado em `accent-primary` espessura 2.5px para os meses realizados. A partir do mês atual, a linha se torna tracejada em `data-context` para os meses projetados — com banda de confiança em torno da projeção (área translúcida mostrando range pessimista/otimista).

Linha horizontal tracejada em `data-target` mostrando o **saldo mínimo de segurança operacional** — label inline: "Reserva mínima: R$X". Se a linha de saldo se aproxima dessa linha, a área entre elas fica em `status-warning` translúcido.

Barras finas verticais de entrada (azul claro) e saída (cinza) para cada mês — como um "micro waterfall" mensal abaixo da linha de saldo. Mostram a composição do movimento sem dominar a visualização.

Tooltip ao hover: "Março 2025 · Saldo: R$X · Entradas: R$Y · Saídas: R$Z · Cobertura: X dias de operação"

**Viabilidade:** Código puro com Observable Plot.

---

### 5. Tabela do DRE Completo (Detalhe)

**Representa:** O documento — para quem precisa de cada linha com precisão contábil.

**Descoberta que comunica:** "Qual linha específica do DRE está fora do padrão este mês?"

**Biblioteca:** shadcn `<Table>` customizado com encoding visual via className — sem biblioteca de gráficos.

**Anatomia detalhada:**
Colunas: Nome da Linha | Mês Atual | Mês Anterior | Δ% vs. Mês Anterior | Mesmo Mês Ano Anterior | Δ% vs. Ano Anterior | % da Receita Bruta

Hierarquia visual das linhas:
- Linhas de grupo (Receita Bruta, Lucro Bruto, EBITDA, Resultado Líquido): fundo `surface-elevated`, texto em `text-primary font-ui` peso semibold, separador superior em `border-default` mais visível
- Linhas de detalhe: fundo `surface-page`, texto em `text-secondary font-data`, indent de 16px no nome
- Linhas de resultado final (Resultado Líquido): fundo `accent-subtle`, texto em `accent-primary font-data` peso bold

Encoding das colunas de delta:
- Delta positivo acima de 10%: `data-positive` com seta ↑
- Delta negativo acima de 10% (em linhas de receita — que é ruim): `data-negative` com seta ↓
- Delta negativo acima de 10% (em linhas de custo — que é bom): `data-positive` com seta ↓
- Variações dentro de ±10%: `text-muted` sem cor especial

A coluna "% da Receita Bruta" tem uma mini barra horizontal proporcional atrás do percentual — como um inline bar chart embutido na célula. Em `accent-subtle` para linhas de receita, em `data-context` para linhas de custo.

Hover na row: fundo `surface-elevated`.

**Viabilidade:** Código puro com shadcn `<Table>` + Tailwind tokens.

---

### 6. Empty State / Estado sem BD conectado

**Representa:** O momento atual do projeto — o dashboard existe, a estrutura está pronta, mas os dados reais ainda não chegaram.

**Anatomia detalhada:**
O dashboard renderiza completamente com **dados mockados realistas** de uma transportadora fictícia (valores plausíveis para o porte da Rodovia Sul — receita mensal na faixa de R$2-5M, custos típicos do setor). Isso serve dois propósitos: valida o design antes da integração e permite que a diretoria veja exatamente como o dashboard vai funcionar.

Um banner discreto no topo — não modal, não alerta agressivo — em `surface-elevated` com borda esquerda em `status-warning` de 3px: "Você está visualizando dados demonstrativos. A integração com o banco de dados está em desenvolvimento." com botão "Saiba mais" em `text-muted`.

Quando o BD for conectado, o banner desaparece e os dados mockados são substituídos pelos reais — a estrutura do dashboard não muda.

**Viabilidade:** Código puro — os dados mockados são um objeto JavaScript estático com a mesma forma do contrato de dados esperado.

---

## TOKENS DE DESIGN

### Cores — Fundos
| Token | Valor | Uso |
|---|---|---|
| `surface-page` | `#F8F9FB` | Fundo principal — off-white levemente frio, não branco puro |
| `surface-card` | `#FFFFFF` | Cards, painéis, tabela |
| `surface-elevated` | `#EEF1F6` | Hover de rows, cabeçalhos de grupo, zona de detalhe |
| `surface-inset` | `#E8ECF2` | Campos de filtro, inputs, áreas de código |

### Cores — Texto
| Token | Valor | Uso |
|---|---|---|
| `text-headline` | `#0F1F3D` | Números grandes da manchete, resultado líquido |
| `text-primary` | `#1A2840` | Títulos de seção, nomes de linhas do DRE |
| `text-secondary` | `#4A5568` | Descrições, subtítulos, valores de contexto |
| `text-muted` | `#8A9BB0` | Labels de eixo, metadata, linhas de detalhe do DRE |
| `text-data` | `#2D3748` | Valores monetários em tabelas, percentuais, eixos |

### Cores — Accent (APENAS O AZUL INSTITUCIONAL)
| Token | Valor | Uso |
|---|---|---|
| `accent-primary` | `#1A4B8C` | A cor da Rodovia Sul — receita, resultado positivo, série principal, aba ativa, botões |
| `accent-hover` | `#1557A8` | Hover state do accent |
| `accent-subtle` | `#1A4B8C12` | Área de gráficos de receita, fundo de linhas de resultado, badge backgrounds |
| `accent-glow` | `0 0 0 3px #1A4B8C20` | Focus ring, destaque em pontos de dado |

### Cores — Dados (Encoding Semântico)
| Token | Valor | Uso |
|---|---|---|
| `data-context` | `#C8D0DC` | Barras de custo no waterfall, séries de comparação, contexto histórico |
| `data-positive` | `#1A7A4A` | Variações positivas em deltas de tabela — NUNCA como cor de categoria |
| `data-negative` | `#C0392B` | Resultado líquido negativo, custos com alta anormal, variações ruins — NUNCA como cor de categoria |
| `data-neutral` | `#9AA5B4` | Dados sem julgamento, linhas de benchmark |
| `data-anomaly-bg` | `#C0392B08` | Fundo de períodos com resultado negativo ou caixa abaixo do mínimo |
| `data-target` | `#4A556880` | Linhas de média, metas, referências históricas |

### Cores — Status (APENAS feedback funcional)
| Token | Valor | Uso |
|---|---|---|
| `status-success` | `#1A7A4A` | Meta atingida, variação positiva confirmada |
| `status-error` | `#C0392B` | Resultado negativo, caixa crítico |
| `status-warning` | `#C07A10` | Caixa próximo ao mínimo, custo acima de threshold |

### Bordas
| Token | Valor | Uso |
|---|---|---|
| `border-default` | `#D1D9E4` | Contornos padrão de cards e painéis |
| `border-subtle` | `#E8ECF2` | Separadores internos, linhas de tabela |
| `border-accent` | `#1A4B8C30` | Destaque de elemento selecionado |
| `border-focus` | `#1A4B8C60` | Focus state em inputs e seletores |

### Tipografia
| Token | Fonte | Uso |
|---|---|---|
| `font-display` | **Playfair Display** (Google Fonts) | Números da manchete — resultado líquido, margem, saldo de caixa |
| `font-editorial` | **Source Serif 4** (Google Fonts) | Tooltips narrativos, anotações inline, linha de resumo da manchete |
| `font-ui` | **Outfit** (Google Fonts) | Navegação, labels, filtros, cabeçalhos de tabela, nomes de linhas do DRE |
| `font-data` | **IBM Plex Mono** (Google Fonts) | Valores monetários, percentuais, eixos, deltas |

### Geometria
| Token | Valor | Uso |
|---|---|---|
| `radius-card` | `8px` | Cards e painéis |
| `radius-button` | `6px` | Botões — moderado, nem reto nem pill |
| `radius-badge` | `4px` | Badges de variação, status labels |
| `radius-tooltip` | `6px` | Tooltips de gráfico |
| `radius-chart` | `0px` | Área dos gráficos — reto para seriedade analítica |
| `radius-input` | `6px` | Inputs e seletores de filtro |

### Sombras
| Token | Valor | Uso |
|---|---|---|
| `shadow-card` | `0 1px 4px rgba(26,75,140,0.08)` | Cards — sombra levemente azulada, coerente com o accent |
| `shadow-float` | `0 8px 24px rgba(26,75,140,0.12)` | Tooltips, dropdowns, modais |
| `shadow-focus` | `0 0 0 3px #1A4B8C20` | Focus ring |

### Dimensões de Gráfico
| Token | Valor | Uso |
|---|---|---|
| `chart-height-hero` | `300px` | Série temporal de resultado (gráfico principal) |
| `chart-height-waterfall` | `360px` | Waterfall do DRE — precisa de altura para as barras serem legíveis |
| `chart-height-context` | `240px` | Breakdown de custos, fluxo de caixa |
| `chart-height-spark` | `40px` | Sparklines inline na manchete |
| `chart-stroke-primary` | `2.5px` | Série principal (resultado, saldo acumulado) |
| `chart-stroke-context` | `1px` | Séries de comparação (ano anterior, média) |
| `chart-annotation-opacity` | `0.6` | Opacidade de linhas e labels de anotação |

---

## COMPONENTES SHADCN — OVERRIDES

| Componente | Override (usando tokens) |
|---|---|
| `<Card>` | `surface-card`, `border-default`, `radius-card`, `shadow-card` |
| `<Button>` | Primary: `accent-primary` bg + branco text + `radius-button`. Ghost: `surface-elevated` bg + `text-primary` + `border-default` |
| `<Badge>` | Positivo: `data-positive` text + verde translúcido bg. Negativo: `data-negative` text + vermelho translúcido bg. Neutro: `text-muted` + `surface-elevated` |
| `<Table>` | `font-data` para valores, `font-ui` para headers, `border-subtle` entre rows, hover em `surface-elevated`, grupos em `surface-elevated` com `font-ui` semibold |
| `<Tabs>` | Aba ativa: `text-primary font-ui` semibold + borda inferior `accent-primary` 2px. Inativa: `text-muted`. Sem background de aba. |
| `<Select>` | `surface-inset` bg, `border-default`, focus em `border-focus`, `font-ui`, dropdown em `surface-card` com `shadow-float` |
| `<Tooltip>` | `surface-card` bg, `shadow-float`, `border-default`, `font-editorial` para narrativa, `font-data` para valores |

---

## PADRÕES DE ANOTAÇÃO ESPECÍFICOS — CONTEXTO FINANCEIRO

### Meta / Benchmark no Gráfico Temporal
Quando uma linha de referência histórica precisa aparecer num gráfico:
- Linha tracejada horizontal em `data-target`, espessura 1px
- Label inline à direita da linha: texto em `font-data` tamanho 10px, cor `text-muted`
- Exemplos: "Média 12m", "2024", "Break-even"
- A linha NÃO tem tooltip próprio — é referência silenciosa

### Alerta de Custo Anormal
Quando uma categoria de custo cresceu acima de 10% vs. mês anterior:
- Borda esquerda de 3px em `data-negative` translúcido na barra ou row
- Micro-label acima: "↑ +X% vs. mês anterior" em `font-data` tamanho 9px, cor `data-negative` opacidade 70%
- Sem modal, sem alerta agressivo — é uma marcação editorial discreta que o olho treinado captura

### Variação de Delta em Tabela
Para cada célula de variação percentual na tabela do DRE:
- Calcular se a variação é "boa" ou "ruim" considerando o tipo de linha:
  - Linhas de receita: crescimento é bom (+), queda é ruim (-)
  - Linhas de custo: crescimento é ruim (+), queda é bom (-)
  - Linhas de resultado: crescimento é bom (+), queda é ruim (-)
- Encoding: seta direcional + cor funcional conforme o julgamento calculado acima
- Variações dentro de ±5%: sem cor, apenas o número em `text-muted`

### Zona de Caixa Mínimo
No gráfico de fluxo de caixa acumulado:
- Quando a linha de saldo se aproxima a menos de 20% do threshold de reserva mínima: área entre as duas linhas preenchida em `status-warning` com opacidade 10%
- Quando cruza abaixo: área em `data-anomaly-bg`, e o ponto de cruzamento recebe um marcador especial: círculo com borda `data-negative` + tooltip: "Caixa abaixo da reserva mínima operacional"

### Tooltip Narrativo — Padrão para DRE
Todo tooltip de gráfico financeiro deve ter:
- **Linha 1:** Período em `font-ui text-muted` (ex: "Fevereiro 2025")
- **Linha 2:** Valor principal em `font-data text-headline` tamanho maior
- **Linha 3:** Delta vs. mês anterior em `data-positive` ou `data-negative` com seta
- **Linha 4:** Delta vs. mesmo período ano anterior em `text-secondary`
- **Linha 5 (quando relevante):** Contexto editorial em `font-editorial text-muted` — ex: "Melhor resultado em 8 meses" ou "Combustível subiu 6% no período"

---

## CONTRATO DE DADOS — INTERFACE PARA INTEGRAÇÃO FUTURA

Quando o BD for conectado, a IA que implementa deve substituir os dados mockados por chamadas às seguintes estruturas. O dashboard deve ser construído com essa separação desde o início — dados mockados no mesmo formato que os dados reais.

```
// Estrutura esperada do DRE mensal
{
  periodo: "2025-02",           // YYYY-MM
  filial: "consolidado",        // ou "santa_rosa" | "porto_alegre" | "sao_paulo" | "curitiba"
  linhas: [
    {
      codigo: "REC_BRUTA",
      nome: "Receita Bruta de Fretes",
      valor: 3850000,
      tipo: "receita",          // "receita" | "deducao" | "custo" | "despesa" | "resultado"
      nivel: 1                  // 1 = grupo, 2 = detalhe
    },
    // ... demais linhas
  ]
}

// Estrutura esperada do Fluxo de Caixa
{
  periodo: "2025-02",
  saldo_inicial: 480000,
  movimentos: [
    { categoria: "recebimentos_clientes", valor: 3920000, tipo: "entrada" },
    { categoria: "combustivel", valor: -680000, tipo: "saida" },
    // ... demais movimentos
  ],
  saldo_final: 512000,
  saldo_minimo_referencia: 300000   // 1 mês de custo operacional estimado
}
```

A IA que implementa deve criar um arquivo `data/mock.ts` com dados realistas nesse formato, e um arquivo `data/api.ts` que expõe as mesmas funções mas busca do Supabase — a troca é uma linha de import.

---

## REGRA DE OURO

Ao criar qualquer tela, painel ou gráfico deste dashboard:

1. A interface age como um **controller experiente** — ela já analisou o DRE e está apresentando as conclusões, não os dados brutos
2. **`#1A4B8C` é a ÚNICA cor vibrante** — receita, resultado positivo, série principal. Custos são cinza. Alertas são vermelho funcional. Sem arco-íris
3. O **waterfall do DRE é a visualização central** — conta a história de como a receita vira resultado. É o coração do produto
4. **Tooltips são narrativos** — nunca apenas o valor. Sempre delta vs. mês anterior, delta vs. ano anterior, e contexto interpretativo quando relevante
5. A **manchete responde três perguntas** antes de qualquer gráfico: "como foi o mês?", "qual a margem?", "como está o caixa?"
6. **Encoding de variação é semântico** — crescimento de custo é ruim, crescimento de receita é bom. A cor reflete o julgamento, não apenas a direção
7. **Dashboard roda com dados mockados** desde o primeiro dia — a estrutura é idêntica à que vai receber os dados reais
8. **NUNCA Recharts, Chart.js, Victory** — usar D3 + Observable Plot + Visx como definido neste documento
9. **Tokens semânticos em tudo** — nenhum valor hardcoded no código
10. *"A diretoria abre o dashboard e em 30 segundos sabe se o mês foi bom, onde está o problema, e se o caixa aguenta."*

## Teste Final

Coloque o dashboard ao lado de um relatório de DRE em Excel. A diferença deve ser óbvia em QUATRO níveis:

- **ESTRUTURA:** manchete executiva com os três números críticos antes de qualquer tabela ou gráfico
- **LINGUAGEM:** Playfair Display nos números grandes, azul único sobre fundo off-white, geometria de relatório financeiro sério
- **ANATOMIA:** waterfall conta a história do resultado, breakdown de custos mostra onde está o problema, série temporal mostra a tendência — todos com anotações e encoding semântico
- **RITMO:** o sócio lê manchete → entende o mês → explora o waterfall → confirma o custo que preocupa → verifica o caixa. Sem precisar de um controller ao lado

Se a diretoria precisar calcular mentalmente a margem → **FALHOU.**
Se o waterfall for uma tabela com barras simples sem encoding de direção → **FALHOU.**
Se os custos e as receitas tiverem o mesmo peso visual → **FALHOU.**
Se não houver dados mockados realistas rodando antes da integração → **FALHOU.**