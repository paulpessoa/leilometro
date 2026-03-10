# Leilômetro — Contexto Completo do Projeto

> Use este arquivo como prompt inicial ao abrir uma nova sessão no Claude Code (VSCode).  
> Cole o conteúdo inteiro no chat ou use `/context` para carregar o arquivo.

---

## O que é o projeto

**Leilômetro** é uma extensão Chrome (Manifest V3) que injeta um painel de análise em sites de leilão de veículos brasileiros. O objetivo é ajudar compradores a não cometerem erros matemáticos durante o lance ao vivo, mostrando custo real, score de oportunidade, análise FIPE e classificação de KM/ano.

---

## Estrutura de arquivos atual

```
leilometro/
├── manifest.json
├── content.js          ← script injetado nas páginas dos leiloeiros
├── styles.css          ← estilos do painel injetado (prefixo #leilometro-panel)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── popup/
    ├── popup.html
    └── popup.js
```

---

## Sites suportados (manifest.json matches)

| Site                      | Observações                                                       |
| ------------------------- | ----------------------------------------------------------------- |
| `leilo.com.br`            | Comissão variável (4–5%), tem depósito de bens, remoção, vistoria |
| `vipleiloes.com.br`       | Seletores básicos                                                 |
| `copart.com.br`           | Odômetro em milhas → converter ×1.609                             |
| `copart.com`              | Mesmo que acima, domínio diferente                                |
| `guariglialeiloes.com.br` | Seletores básicos                                                 |
| `freitasleiloeiro.com.br` | Usa `data-label` attributes                                       |
| `sodresantoro.com.br`     | Adicionado, seletores ainda não validados                         |
| `lance-livre.com.br`      | Adicionado, seletores ainda não validados                         |

---

## Nomes dos campos de configuração (chrome.storage.sync)

> ⚠️ ATENÇÃO: Estes são os nomes exatos. Não renomear.

```js
CONFIG_DEFAULTS = {
  fipeMock: 0, // FIPE manual (fallback quando não detectada)
  margemRevenda: 0.15, // 15% — armazenado como decimal
  comissaoLeiloeiro: 0.05, // 5%  — armazenado como decimal
  incrementoLance: 200, // R$ por incremento
  taxaPatio: 0, // R$ — zero por padrão, usuário preenche
  custoDocumentacao: 0,
  custoIPVA: 0,
  custoConserto: 0,
};
```

No `popup.js`, os campos `type: 'pct'` são multiplicados/divididos por 100 na UI.  
**Campos com valor 0 mostram placeholder** — não preencher com valor padrão fictício.

---

## Lógica de cálculo

```
comissao       = lance × comissaoPct
taxaPatioEfetiva = (depositoBens + taxaRemocao + taxaVistoria) || taxaPatio
custoReal      = lance + comissao + taxaPatioEfetiva

custosFixos    = custoDocumentacao + custoIPVA + custoConserto + taxaPatio
margemReais    = fipe × margemRevenda
precoLimite    = fipe - margemReais - custosFixos

lancesRestantes = floor((precoLimite - lance) / incrementoLance)
potencialLucro  = fipe - custoReal - custoConserto - custoDocumentacao - custoIPVA

score (0–100):
  lance/precoLimite < 0.70 → 95
  lance/precoLimite < 0.85 → 75
  lance/precoLimite < 0.95 → 55
  lance/precoLimite < 1.00 → 35
  lance/precoLimite ≥ 1.00 → 10
  kmAno > 30.000 → -20 pts
  kmAno > 20.000 → -10 pts
```

---

## CRUD local por lote (localStorage)

> Esta é a feature principal da v3. Cada lote tem um ID estável derivado da URL.

```js
STORAGE_PREFIX = "lm_lote_"
MAX_LOTES = 50   // LRU: remove o mais antigo quando cheio

// Cada entrada salva:
{
  fipe:    number | null,   // FIPE editada pelo usuário para este lote
  marg:    number,          // margem editada (decimal, ex: 0.20)
  notas:   string,          // anotações livres
  savedAt: timestamp,
  url:     string
}
```

**Prioridade de FIPE:** lote salvo > `fipeScraped` (lida da página) > `CONFIG.fipeMock`  
**Prioridade de margem:** lote salvo > `CONFIG.margemRevenda`

### Extração do ID do lote

```js
// Padrões testados (em ordem):
/\/lotes?\/(\d+)/i
/\/lots?\/(\d+)/i
/\/item\/(\d+)/i
/\/veiculo\/(\d+)/i
/[?&]id=(\d+)/i
/[?&]lote=(\d+)/i
/\/(\d{5,12})(?:[/?#]|$)/   // fallback: número longo na URL
// último fallback: btoa(url base).slice(0,20)
```

---

## Seletores CSS — estado atual e o que precisa ser validado

> ⚠️ NENHUM seletor foi validado com DevTools em páginas reais ainda.  
> Esta é a tarefa mais crítica antes de publicar.

### Como validar cada seletor

1. Abrir a página do lote no Chrome
2. `F12` → Console → testar: `document.querySelector('SEU_SELETOR')?.textContent`
3. Se retornar `null` → inspecionar o elemento no HTML e encontrar o seletor correto
4. Atualizar `SITE_SELECTORS` em `content.js`

### Campos que precisam de seletor por site

Para cada site, validar:

- `lance` — valor do lance atual (atualiza em tempo real)
- `comissao` — percentual de comissão (Leilo varia 4–5%)
- `deposito`, `remocao`, `vistoria` — taxas extras (só Leilo tem)
- `ano` — ano de fabricação
- `km` — quilometragem
- `combustivel`
- `modelo` — título do lote (h1 geralmente funciona)
- `fipe` — FIPE exibida na página (quando disponível)

### Leilo.com.br — seletores conhecidos (a confirmar)

```js
lance: ('[class*="lance"] [class*="valor"]', ".current-bid");
comissao: 'span:contains("Comissão")'; // ← :contains não é CSS nativo, usa loop
deposito: 'span:contains("Depósito de Bens")';
remocao: 'span:contains("Remoção")';
vistoria: 'span:contains("Vistoria")';
fipe: 'span.label-categoria:contains("Valor Mercado") + p';
```

> ⚠️ Os seletores `:contains()` são implementados via loop no `trySelectors()`,  
> não são CSS nativo. Cuidado ao tentar usá-los fora do `content.js`.

---

## Pontos críticos de atenção

### 1. O seletor de lance precisa ser o mais robusto possível

O lance muda em tempo real. O `MutationObserver` (em `observeLanceChanges`) reage a mudanças no DOM e chama `renderPanel()` com debounce de 800ms. Se o seletor estiver errado, o painel não atualiza.

### 2. Copart usa milhas, não km

```js
milesMode: true; // ativa conversão automática ×1.609
```

Confirmar se `copart.com.br` (nacional) também usa milhas ou já exibe km.

### 3. O painel re-renderiza o HTML inteiro ao atualizar

Não tem estado incremental — `renderPanel()` remove e recria o `#leilometro-panel`.  
Consequência: qualquer texto que o usuário esteja digitando no campo de notas é perdido se o lance mudar. **Solução futura:** atualizar só o valor do lance/score sem re-render completo.

### 4. `all: initial` no CSS do painel

O painel usa `all: initial` para isolar estilos dos sites. Isso significa que **todas as propriedades precisam ser declaradas explicitamente** com `!important`. Se um estilo sumir misteriosamente, provavelmente falta `!important`.

### 5. Permissões do manifest — não adicionar novas sem necessidade

Permissões atuais: `["storage", "activeTab"]`. A Chrome Web Store exige justificativa para cada permissão. Não adicionar `tabs`, `scripting`, `cookies` ou qualquer outra sem necessidade real.

### 6. Política de privacidade é obrigatória para publicar

Precisa de uma página hospedada com política de privacidade antes de submeter na Chrome Web Store. Pode ser uma seção da landing page. Conteúdo mínimo: "a extensão não coleta nem transmite dados pessoais; todos os dados ficam armazenados localmente no navegador do usuário."

---

## Tarefas pendentes por prioridade

### 🔴 Crítico — antes de qualquer teste real

- [ ] **Validar seletores CSS no leilo.com.br** — especialmente `lance`, `comissao`, `deposito`, `remocao`, `vistoria`
- [ ] **Validar que `getLoteId()` extrai ID correto** nas URLs do Leilo (ex: `leilo.com.br/lote/12345`)
- [ ] **Testar CRUD**: abrir lote, salvar notas + FIPE, navegar para outro lote, voltar — dados devem restaurar
- [ ] **Testar botão Reset** — deve limpar só o lote atual do localStorage

### 🟡 Importante — antes de publicar

- [ ] **Validar seletores no vipleiloes.com.br**
- [ ] **Validar seletores no guariglialeiloes.com.br**
- [ ] **Validar seletores no freitasleiloeiro.com.br**
- [ ] **Validar Copart** — confirmar se usa milhas, testar conversão
- [ ] **Sodresantoro e Lance-Livre** — ainda sem seletores validados
- [ ] **Testar campo FIPE editável**: digitar valor → apertar Tab/Enter → painel deve recalcular
- [ ] **Testar impressão** — botão 🖨️ deve abrir janela com análise formatada para imprimir
- [ ] **Criar política de privacidade** na landing page
- [ ] **Criar screenshots** para Chrome Web Store (1280×800 ou 640×400)

### 🟢 Melhorias futuras (não urgentes)

- [ ] Atualizar lance/score sem re-render completo (preservar notas em edição)
- [ ] Histórico de lotes avaliados (listar os 50 salvos)
- [ ] Dark/light toggle (só se usuários pedirem)
- [ ] API FIPE automática (instável, deixar por último)
- [ ] Monetização: freemium via Hotmart/Kiwify

---

## Infraestrutura de hospedagem

| Componente          | Onde                                      | Custo          |
| ------------------- | ----------------------------------------- | -------------- |
| Landing page        | Vercel (deploy via drag-and-drop do HTML) | Grátis         |
| Domínio             | registro.br (ex: `leilometro.com.br`)     | ~R$ 40/ano     |
| DNS / CDN           | Cloudflare                                | Grátis         |
| Extensão            | Chrome Web Store                          | U$5 taxa única |
| Pagamentos (futuro) | Hotmart ou Kiwify                         | % por venda    |
| Servidor / banco    | **Não precisa agora**                     | R$ 0           |

**Custo total para lançar: menos de R$ 100.**

---

## Tempo de publicação na Chrome Web Store

- Primeira publicação: **3–7 dias úteis**
- Atualizações: **1–3 dias úteis**
- Se reprovar: mais 3–7 dias após correção

**Causas comuns de reprovação:**

1. Permissões sem justificativa clara
2. Falta de política de privacidade
3. Descrição vaga ou inconsistente com o comportamento real
4. Ícones de baixa qualidade

---

## Como instalar localmente para testes

```bash
# 1. Extrair o zip ou usar a pasta diretamente
# 2. Abrir chrome://extensions/
# 3. Ativar "Modo do desenvolvedor" (canto superior direito)
# 4. Clicar em "Carregar sem compactação"
# 5. Selecionar a pasta leilometro/
# 6. Abrir qualquer site suportado (ex: leilo.com.br)
# 7. O painel aparece automaticamente após ~1.5s
# 8. Ctrl+Shift+L — abre/fecha o painel
```

**Para recarregar após editar os arquivos:**  
Voltar em `chrome://extensions/` → clicar no ícone de atualização (↻) na linha da extensão.  
Não precisa reinstalar, só recarregar a aba do leiloeiro.

---

## Fluxo de trabalho recomendado no VSCode + Claude Code

```
1. Abrir lote no Chrome com DevTools aberto (F12)
2. Inspecionar o elemento que quer selecionar
3. Testar: document.querySelector('seletor')?.textContent no Console
4. Atualizar content.js com o seletor confirmado
5. Recarregar extensão + recarregar aba do leiloeiro
6. Confirmar no painel se o dado apareceu corretamente
7. Repetir para cada campo de cada site
```

---

## Decisões técnicas tomadas (não reverter sem motivo)

| Decisão                                              | Motivo                                                                                                    |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| localStorage (não chrome.storage) para CRUD de lotes | chrome.storage é assíncrono e complica o render; localStorage é síncrono e suficiente para dados por lote |
| Sem API FIPE automática                              | API pública é instável, tem rate limit e adiciona latência; campo editável é mais confiável               |
| Sem dark/light toggle                                | Painel dark já contrasta bem em sites brancos; adicionar só se usuários pedirem                           |
| Re-render completo vs. atualização parcial           | Mais simples agora; trade-off aceito: notas podem ser perdidas se lance mudar durante digitação           |
| Custo Real não inclui custos de conserto/doc/IPVA    | Esses valores são estimativas; contaminam o cálculo principal; ficam na seção "referência" separada       |
| ID do painel: `leilometro-panel` (não `lm-panel`)    | Mantido para compatibilidade com testes existentes                                                        |

---

## Contexto adicional

- O usuário que usa a extensão é comprador de carros em leilão, geralmente revendedor ou pessoa física
- O caso de uso principal: estar no lote durante o leilão ao vivo, com o painel aberto, podendo ver em tempo real quantos lances ainda cabem antes de estourar a margem
- O campo de anotações serve para registrar observações da vistoria (amassados, sem chave, pneus, etc.) antes do dia do leilão, e consultar no momento do lance
- A FIPE e a margem são editáveis por lote porque cada veículo tem uma FIPE diferente e o usuário pode ter margens diferentes dependendo do tipo de carro

---

## Prompt sugerido para iniciar sessão no Claude Code

```
Contexto: estou desenvolvendo a extensão Chrome "Leilômetro" (Manifest V3)
para análise de leilões de veículos. Tenho os arquivos atuais na pasta.
Leia o arquivo CONTEXTO.md antes de qualquer alteração.

Tarefa atual: [DESCREVA O QUE QUER FAZER]

Regras:
- Não renomear campos de CONFIG_DEFAULTS
- Não mudar o ID do painel (#leilometro-panel)
- Não adicionar permissões ao manifest sem perguntar
- Sempre testar seletores CSS no DevTools antes de alterar
- Manter compatibilidade com os 8 sites listados no manifest
```

---

_Gerado em: 10/03/2026 — Sessão de desenvolvimento no claude.ai_
