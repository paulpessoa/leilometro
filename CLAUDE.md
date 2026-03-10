# Leilômetro — Chrome Extension

Extensão Chrome (Manifest V3) que injeta um painel de análise de oportunidades em sites de leilão de veículos. Calcula custo real, margem FIPE, score de oportunidade e classificação de KM/Ano em tempo real.

## Estrutura do Projeto

```
leilometro/
├── manifest.json          # Manifest V3 — permissões e sites suportados
├── content.js             # Content script: scraping + cálculos + UI injetada (IIFE)
├── utils.js               # Utilitário: classifyKmAno (ES module export)
├── styles.css             # Estilos do painel injetado (dark theme)
├── icons/                 # Ícones 16/48/128px
└── popup/
    ├── popup.html         # UI de configurações (com CSS inline)
    └── popup.js           # Salva/carrega config via chrome.storage.sync
```

## Sites Suportados

- leilo.com.br, vipleiloes.com.br, copart.com.br, copart.com
- guariglialeiloes.com.br, freitasleiloeiro.com.br, sodresantoro.com.br

## Arquitetura

### content.js

- IIFE (`(function(){ "use strict" })()`) sem módulos ES
- Carrega config de `chrome.storage.sync` antes de chamar `init()`
- `SITE_SELECTORS` — mapa de seletores CSS por domínio + fallback `default`
- `scrapePageData()` — extrai lance, ano, km, combustível, modelo, FIPE da página
- `calcularOportunidade()` — aplica lógica financeira (custo real, preço limite, score)
- `renderPanel()` — cria e injeta o painel no DOM via `innerHTML`
- `observeLanceChanges()` — MutationObserver com debounce de 800ms para atualizar ao vivo
- Atalho `Ctrl+Shift+L` para abrir/fechar o painel

### Lógica de Cálculo

```
Custo Real   = Lance + (Lance × comissão%) + taxaPatio
Preço Limite = FIPE - (FIPE × margemRevenda%) - custoConserto - custoDocumentacao - custoIPVA
Score (0-100): baseado em lance/precoLimite ratio + penalidade por alto KM/ano
```

### utils.js

- `classifyKmAno(kmAno)` exportado como ES module
- **Atenção:** `content.js` tem uma cópia inline de `classifyKmAno` — não usa `import`
- Se atualizar a lógica de classificação, atualizar **ambos** os arquivos

### popup/popup.js

- Lê inputs do HTML e salva em `chrome.storage.sync`
- Chaves: `fipeMock`, `margemRevenda`, `comissaoLeiloeiro`, `incrementoLance`, `taxaPatio`, `custoDocumentacao`, `custoIPVA`, `custoConserto`
- Valores são percentuais decimais (ex: `margemRevenda = 0.15` para 15%)

## Instalação Local

1. `chrome://extensions/` → ativar "Modo do desenvolvedor"
2. "Carregar sem compactação" → selecionar esta pasta
3. Sem build step — arquivos servidos diretamente

## Convenções

- Português BR em todo o código (variáveis, comentários, UI)
- Formatação monetária via `Intl` (`toLocaleString("pt-BR", { style: "currency", currency: "BRL" })`)
- Sem framework — DOM puro, sem bundler, sem npm
- Seções do código delimitadas por comentários `// ─── TÍTULO ───`
