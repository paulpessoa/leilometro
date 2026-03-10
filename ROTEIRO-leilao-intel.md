# 🏎️ LeilãoIntel — Roteiro de Testes + Estratégia de Produto

---

## PARTE 1 — MANTENDO OS PÉS NO CHÃO

> Leia isso antes de qualquer linha de código.

### O que você tem de verdade agora

Um **skeleton funcional** que:
- Injeta um painel no DOM de sites de leilão
- Faz scraping genérico por seletores CSS
- Calcula custo real com taxas fixas
- Exibe score e KM/Ano

### O que você NÃO tem ainda

- Seletores validados em nenhum site (precisam ser conferidos um a um)
- Certeza de que o DOM de cada site não vai quebrar os seletores
- Usuário real usando a ferramenta e confirmando que ela ajuda
- Qualquer receita

### A armadilha clássica

```
"Vou adicionar FIPE automática + histórico + comparação de lotes
 + alertas de WhatsApp + dashboard + integração Webmotors..."
                                         ↓
         Nada funciona direito. Ninguém usa. Você abandona.
```

### A regra de ouro deste projeto

**Uma coisa de cada vez. Valide antes de construir.**

Ordem correta:
1. Fazer funcionar em 1 site (Leilo)
2. Um usuário real usar e achar útil
3. Repetir para os outros 4 sites
4. Só então pensar em monetização

---

## PARTE 2 — ROTEIRO DE TESTES SITE POR SITE

### Ambiente de teste

Antes de começar, abra o Chrome com:
1. `chrome://extensions/` → extensão carregada
2. Console DevTools aberto (`F12` → aba Console)
3. Um bloco de notas para anotar o que funciona/quebra

---

### 🔵 SITE 1 — leilo.com.br

**URL de teste:** Acesse qualquer lote de carro em leilão ativo ou encerrado.

**O que inspecionar no DevTools (F12 → Elements):**

```
Procure por:
□ Valor do lance   → clique no número na tela → anote o seletor CSS exato
□ Valor da FIPE    → verifique se aparece (nem sempre)
□ Comissão %       → procure texto "comissão" ou "%" próximo ao lance
□ Taxa de pátio    → procure "remoção", "pátio", "depósito"
□ Total previsto   → verifique se somam tudo ou não
□ Quantidade de lances → procure contador de lances
□ Ano do veículo   → nas características do lote
□ KM               → nas características do lote
□ Combustível      → nas características do lote
□ Incremento       → valor de cada incremento de lance
```

**Checklist de validação — Leilo:**
```
□ Painel apareceu na tela?
□ Lance detectado automaticamente?  Valor: ________
□ Comissão lida da página?          Valor: ________
□ Taxa pátio lida da página?        Valor: ________
□ Total previsto lido?              Valor: ________
□ Quantidade de lances exibida?     Valor: ________
□ Ano detectado?                    Valor: ________
□ KM detectado?                     Valor: ________
□ Combustível detectado?            Valor: ________
□ Incremento detectado?             Valor: ________
□ Cálculo de custo real correto?
□ Score faz sentido dado o contexto?
□ KM/Ano calculou certo?
```

**Seletores a investigar na Leilo (exemplos — confirme no DevTools):**
```css
/* Lance atual — inspecionar o número principal */
.bid-value, .current-bid, [class*="CurrentBid"]

/* Comissão — procurar span próximo ao lance */
[class*="commission"], [class*="taxa"], span:contains("%")

/* Total previsto (se disponível) */
[class*="total"], [class*="previsto"]

/* Contador de lances */
[class*="bid-count"], [class*="lances"]
```

**Se algo não funcionar:** Abra o console e teste:
```javascript
// Cole no console para testar seletores manualmente
document.querySelector('.SEU-SELETOR-AQUI')?.textContent
```

---

### 🟣 SITE 2 — vipleiloes.com.br

**O que é diferente aqui:**
- Layout pode ser mais simples
- Verificar se tem contador de lances visível
- Verificar se mostra incremento na tela

**Checklist de validação — VIP Leilões:**
```
□ Painel apareceu?
□ Lance detectado?                  Valor: ________
□ Contador de lances?               Valor: ________
□ Incremento na tela?               Valor: ________
□ Ano/KM detectados?
□ Comissão exibida na página?       Valor: ________
□ Custo real calculado corretamente?
```

**Atenção:** VIP pode usar SPA (Single Page Application) — o painel pode precisar
recarregar ao navegar entre lotes. Verifique se o MutationObserver detecta a mudança.

---

### 🟡 SITE 3 — guariglialeiloes.com.br

**O que verificar:**
- Layout geralmente mais tradicional/table-based
- Informações de taxas podem estar no edital (PDF), não na página
- Comissão pode estar nos termos de uso

**Checklist — Guariglia:**
```
□ Painel apareceu?
□ Lance detectado?                  Valor: ________
□ Onde ficam as taxas no site?      Local: ________
□ FIPE aparece?
□ Características (ano/km/combustível) detectadas?
□ Edital vinculado ao lote? (verificar formato)
```

---

### 🟢 SITE 4 — freitasleiloeiro.com.br

**O que verificar:**
- Site pode ter lotes em catálogo estático (sem lance ao vivo na mesma página)
- Verificar se o lance é exibido inline ou em modal/popup

**Checklist — Freitas:**
```
□ Painel apareceu?
□ O lance fica na mesma URL ou abre modal?
□ Lance detectado?                  Valor: ________
□ Modal quebra a injeção do painel?
□ Ano/KM/combustível nas características?
□ Taxas listadas no site?
```

---

### 🔴 SITE 5 — copart.com.br

**O que é diferente aqui:**
- Site mais robusto, maior
- Provavelmente usa React/Angular — seletores dinâmicos
- Tem KM em milhas (importados) — verificar conversão
- FIPE não disponível (carros importados/salvados)

**Checklist — Copart:**
```
□ Painel apareceu?
□ Lance em BRL ou USD?
□ KM em km ou milhas?              Unidade: ________
□ Seletores do React estáveis ou com hash?
□ FIPE disponível?
□ Dados do veículo (ano/modelo) detectados?
□ Taxas visíveis na página?
□ Conversão milhas → km funcionando? (×1.609)
```

---

## PARTE 3 — TABELA DE TAXAS POR LEILOEIRO

> Pesquise e preencha antes de codar os valores fixos

| Leiloeiro | Comissão | Depósito Bens | Taxa Remoção | Vistoria | Observações |
|-----------|----------|---------------|--------------|----------|-------------|
| Leilo     | 4–5%     | Verificar     | Verificar    | Verificar| Varia por lote |
| VIP Leilões | 5%    | —             | —            | —        | Confirmar no edital |
| Guariglia | Verificar| Verificar     | Verificar    | Verificar| — |
| Freitas   | Verificar| —             | —            | —        | — |
| Copart BR | Verificar| Verificar     | Verificar    | Verificar| Buyer's Fee |

**Fontes para pesquisar:** Edital de cada leilão + FAQ/Termos dos sites

---

## PARTE 4 — PRIORIDADE DE DESENVOLVIMENTO

### O que implementar PRIMEIRO (máximo valor, mínimo esforço)

```
✅ PRIORIDADE ALTA — Implementar logo
────────────────────────────────────────
1. Campo FIPE editável quando não detectado na tela
   → Sem isso, o cálculo de Preço Limite não funciona

2. Leitura de comissão da página (Leilo varia 4-5%)
   → Maior diferencial vs. valor fixo

3. Leitura do Total Previsto quando disponível na Leilo
   → Se o site já fez o cálculo, usar o valor deles

4. Botão Imprimir análise
   → Usuário valoriza ter registro da análise

5. Classificação KM/Ano no bloco principal do painel
   → Você pediu isso — é diferencial visual imediato
```

```
⏳ PRIORIDADE MÉDIA — Próxima iteração
────────────────────────────────────────
6. Quantidade de lances na Leilo e VIP
   → Muito útil mas requer seletor específico validado

7. Leitura de incremento da página
   → Muda a precisão do contador "X lances restantes"

8. Conversão milhas→km para Copart
   → Só faz sentido depois que Copart estiver funcionando

9. Bloco de custos estimados no fim (não incluir no cálculo)
   → Para dar contexto sem distorcer o score
```

```
❌ PRIORIDADE BAIXA — Não agora
────────────────────────────────────────
10. API FIPE automática (instável, rate limit, latência)
11. Histórico de análises (requer backend)
12. Dashboard web (requer backend)
13. Integração WhatsApp/alertas
14. Suporte a novos leiloeiros
```

---

## PARTE 5 — ESTRUTURA REVISADA DO PAINEL

Baseado no que você pediu, a ordem correta dos blocos é:

```
┌─────────────────────────────────────┐
│ 🏎️ LeilãoIntel              [−][×] │
├─────────────────────────────────────┤
│ NOME DO VEÍCULO / LOTE              │
│                                     │
│  BLOCO 1 — SCORE + OPORTUNIDADE     │
│  [SCORE: 75]  OPORTUNIDADE: BOA     │
│                                     │
│  BLOCO 2 — CLASSIFICAÇÃO KM/ANO     │
│  🟢 13.400 km/ano — Uso Particular  │
│  (Calculado: 67.000 km / 5 anos)    │
│                                     │
├─────────────────────────────────────┤
│  BLOCO 3 — VALORES E TAXAS          │
│  Lance atual        R$ 28.000       │
│  + Comissão (5%)   + R$  1.400      │
│  + Depósito bens   + R$    ???      │
│  + Taxa remoção    + R$    ???      │
│  ─────────────────────────────      │
│  CUSTO REAL         R$ 29.750       │
│                                     │
├─────────────────────────────────────┤
│  BLOCO 4 — ANÁLISE FIPE             │
│  FIPE [R$ 45.000 ✏️ editar]         │
│  Preço Limite       R$ 34.000       │
│  Margem [20% ✏️]                    │
│  Lances restantes   21 lances       │
│                                     │
├─────────────────────────────────────┤
│  BLOCO 5 — DADOS DO VEÍCULO         │
│  Ano: 2019  KM: 67.000  Flex        │
│  Incremento: R$ 500                 │
│                                     │
├─────────────────────────────────────┤
│  BLOCO 6 — CUSTOS ESTIMADOS (REF.)  │
│  ⚠️ Valores aproximados, não         │
│  incluídos no cálculo acima         │
│  Conserto estimado  R$ 2.500        │
│  Documentação       R$ 800          │
│  IPVA atrasado est. R$ 1.200        │
│                                     │
│  [🖨️ Imprimir Análise] [⚙️ Config]  │
└─────────────────────────────────────┘
```

---

## PARTE 6 — DADOS E PRIVACIDADE

### O que a extensão LÊ
- Texto público visível na tela (preços, características)
- Nada que o usuário não pudesse anotar manualmente

### O que a extensão NÃO LÊ
- Senhas, sessões, cookies de autenticação
- Dados de pagamento
- Histórico de navegação de outras abas

### Permissões necessárias no manifest.json
```json
"permissions": ["storage", "activeTab"]
```
- `storage`: salvar configurações do usuário (FIPE, margem)
- `activeTab`: ler conteúdo da aba atual

**Não precisar de:** `tabs`, `history`, `cookies`, `webRequest`

### Comunicar isso claramente
Na landing page e na descrição da Chrome Web Store, deixe explícito:
> "Lemos apenas o conteúdo público visível na tela.
>  Nenhum dado seu é enviado para servidores externos."

---

## PARTE 7 — MONETIZAÇÃO COM OS PÉS NO CHÃO

### O que funciona para extensões Chrome

**Freemium com paywall suave** (recomendado para começar):
- Versão free: painel básico, 2 leiloeiros, sem score
- Versão paga: tudo + score + histórico + todos os sites
- Preço: R$ 37–57/mês (1–2 arremates cobrem o custo)

**O argumento de venda é simples:**
> "Se o LeilãoIntel te salvar de pagar R$ 2.000 a mais em um único
>  leilão, ele se paga por 3 anos."

### Como cobrar (sem backend no começo)
1. **Gumroad** → vende licenças de 1 ano, entrega um código de ativação
2. **Hotmart / Kiwify** → assinatura mensal
3. **Stripe** + verificação no popup (requer backend mínimo)

### O que validar ANTES de criar o sistema de pagamento
- 10 pessoas usando a versão gratuita consistentemente
- Pelo menos 3 dizendo "pagaria por isso"
- Um caso real onde ajudou a não errar o lance

### Canais para adquirir os primeiros usuários
```
1. Grupos de WhatsApp/Telegram de leilão de carros
   → "Criei uma extensão, quem quer testar grátis?"

2. YouTube — comentários em vídeos de leilão
   → Pessoas que assistem já estão no funil

3. Reddit r/investimentos / fóruns de leilão
   → Comunidade técnica, feedback qualificado

4. Próprios participantes dos leilões (abordagem direta)
   → Quem está no site já é o cliente ideal

5. Parceria com despachantes e avaliadores de veículos
   → Eles usam com clientes → indicam a extensão
```

---

## PARTE 8 — CHECKLIST "ANTES DE PUBLICAR"

```
□ Testado nos 5 leiloeiros com lotes reais
□ Seletores CSS documentados e funcionando
□ Campo FIPE editável funcionando
□ Leitura de comissão variável (Leilo 4–5%)
□ Botão imprimir funcionando
□ Blocos de custo estimado no fim (sem afetar cálculo)
□ Margem de revenda editável (padrão 20%)
□ Incremento lido da página quando disponível
□ KM/Ano com classificação no bloco 1
□ Painel arrastável e minimizável
□ Sem erros no console do Chrome
□ manifest.json com permissões mínimas
□ Ícones criados (16, 48, 128px)
□ README com instruções de instalação
□ Privacidade documentada
□ Pelo menos 1 pessoa real testou e achou útil
```

---

## RESUMO: O QUE FAZER AGORA (ESTA SEMANA)

```
Dia 1 — Teste a extensão atual na Leilo
  → Abra um lote real, anote o que funciona e o que quebra
  → Inspecione os seletores no DevTools

Dia 2 — Corrija os seletores da Leilo
  → Foque em: lance, comissão, total previsto, quantidade de lances

Dia 3 — Adicione campo FIPE editável
  → É o mais importante para o cálculo funcionar

Dia 4 — Teste VIP Leilões
  → Repita o processo de inspecionar + corrigir seletores

Dia 5 — Reorganize o painel na ordem correta
  → Score + KM/Ano no topo, custos estimados no fim, botão imprimir

Semana 2 — Guariglia + Freitas
Semana 3 — Copart (mais complexo)
Semana 4 — Primeiro usuário real testando
```

---

*"A ferramenta útil e simples que 10 pessoas usam toda semana
  vale mais do que a plataforma completa que ninguém usa."*
