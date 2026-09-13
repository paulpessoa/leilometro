# 🚀 Planejamento de Arquitetura: Login, Cloud Sync, IA (BYOK/MCP) e Monetização

Documento de especificação técnica e estratégica para a evolução do ecossistema **Leilômetro** (Extensão Chrome + Web App em leilometro.com.br).

---

## 💡 Parecer Geral & Oportunidade de Mercado

A ideia de conectar a extensão a um Web App com login, sincronização de lotes e camada de IA é **altamente recomendada** e possui enorme potencial por 3 motivos cruciais:

1. **Retenção e Lock-in:** O maior gargalo de extensões puramente locais (`localStorage`) é que se o usuário limpa o navegador ou troca de máquina, ele perde os lotes analisados. Ter um painel web com os carros salvos transforma a ferramenta de um utilitário temporário em um **CRM financeiro de leilões**.
2. **BYOK (Bring Your Own Key) = Risco Zero de Infraestrutura de IA:** O modelo BYOK permite cobrar uma assinatura acessível (R$ 19,90) sem gastar 1 centavo com chamadas de API da OpenAI/Anthropic/Google, pois a conta da IA fica a cargo do usuário.
3. **Escada de Valor (R$ 19,90 ➔ R$ 47,00):** Usuários iniciantes ou técnicos preferem colocar sua própria chave (ou usar a cota gratuita do Gemini Flash). Usuários corporativos e arrematantes tradicionais não querem saber de configurar chaves e preferem pagar R$ 47,00 para ter IA pronta de fábrica.

---

## 🔐 1. Arquitetura de Login Simples & Seguro

Para manter a simplicidade, baixa complexidade e custo zero de autenticação inicial, a melhor stack é:

### Stack Recomendada: **Supabase Auth + PostgreSQL (ou Firebase)**
- **Por quê?** Plano gratuito generoso (até 50.000 usuários ativos/mês), banco relacional com Row Level Security (RLS) e suporte nativo a Magic Link (login sem senha por e-mail) e Google OAuth.
- **Vercel Serverless Functions:** Pode ser integrado diretamente na infraestrutura atual da Vercel.

### Fluxo de Autenticação Extensão ⟷ Site
```
[Usuário na Extensão] 
        │
        ├── 1. Clica em "Fazer Login"
        │
        ▼
[Abre aba: leilometro.com.br/login]
        │
        ├── 2. Usuário faz login (Google ou Magic Link)
        ├── 3. Web App gera Sessão JWT no Supabase
        │
        ▼
[Troca segura de Token para a Extensão]
        │
        ├── Método A (Recomendado): window.postMessage via externally_connectable
        │   O manifest.json já autoriza: "externally_connectable": ["https://www.leilometro.com.br/*"]
        │   O site envia: chrome.runtime.sendMessage(EXTENSION_ID, { type: "AUTH_SUCCESS", token })
        │
        ▼
[Extensão armazena o token em chrome.storage.local (criptografado/seguro)]
        │
        └── Agora toda análise ou lote salvo na extensão sincroniza com a API em nuvem!
```

---

## 🗄️ 2. Modelo de Dados no Banco (PostgreSQL / Supabase)

Tabelas essenciais:

```sql
-- Usuários e Assinaturas
CREATE TABLE users_profile (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  plan_tier TEXT DEFAULT 'free', -- 'free', 'starter_byok', 'pro_ai'
  ai_provider TEXT DEFAULT 'gemini', -- 'gemini', 'claude', 'openai'
  user_api_key_encrypted TEXT, -- Chave criptografada se for BYOK
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lotes Salvos pelo Usuário
CREATE TABLE saved_lots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users_profile(id) ON DELETE CASCADE,
  external_lote_id TEXT NOT NULL,
  url TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano INTEGER,
  km INTEGER,
  combustivel TEXT,
  lance_atual NUMERIC,
  custo_real NUMERIC,
  fipe NUMERIC,
  preco_limite NUMERIC,
  score INTEGER,
  taxas JSONB, -- { deposito, remocao, vistoria, despachante }
  custos_estimados JSONB, -- { conserto, doc, ipva }
  notas TEXT,
  laudo_cautelar TEXT,
  status TEXT DEFAULT 'analisando', -- 'analisando', 'favorito', 'arrematado', 'descartado'
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🤖 3. Integração com IA: BYOK (Bring Your Own Key) & MCP

### A) Modelo BYOK (R$ 19,90/mês)
- **Como funciona:** Na aba de configurações da conta no site ou na extensão, o usuário tem campos para inserir sua chave:
  - **Google Gemini API Key** (Google AI Studio dá chave gratuita com limite de até 15 RPM no Gemini 2.0 / 1.5 Flash).
  - **Anthropic Claude API Key** (Claude 3.5 Sonnet / Haiku).
  - **OpenAI API Key** (GPT-4o-mini / GPT-4o).
- **Segurança:** A chave nunca é trafegada desprotegida. Pode ser mantida apenas no `chrome.storage.local` do usuário ou criptografada no banco com AES-GCM usando uma chave mestra por usuário.
- **O que a IA faz:**
  1. **Análise de Laudo Cautelar:** Detecta termos de alerta ocultos nos editais ("reparo estrutural na coluna B", "chassi remarcado", "recuperado de sinistro", "leilão judicial com pendências").
  2. **Estimativa de Revenda:** Sugere margem ideal baseada no histórico de depreciação do modelo.
  3. **Simulador de Lances:** Gera um roteiro: *"Dê lances de até R$ 26.000 se o conserto for leve; acima disso, o risco supera a margem de 15%"*.

### B) Integração MCP (Model Context Protocol)
O **MCP** é o padrão aberto lançado pela Anthropic que permite conectar IAs a fontes de dados locais e remotas.
- **Como aplicar no Leilômetro:**
  - Criar um **servidor MCP do Leilômetro** (`leilometro-mcp-server`).
  - Um arrematante profissional ou lojista usando Claude Desktop, Cursor ou agentes de IA pode habilitar o MCP do Leilômetro.
  - **Ferramentas expostas pelo MCP:**
    - `get_saved_lots(status, min_score)`: Lista os lotes monitorados pelo usuário.
    - `calculate_vehicle_limit(fipe, costs, margin)`: Calcula o teto de lance.
    - `inspect_lot_risks(lote_id)`: Pede para a IA avaliar todo o dossiê do veículo.
  - **Diferencial Competitivo Único:** Nenhum outro software de leilão no Brasil oferece suporte ao protocolo MCP. Isso atrai entusiastas de tecnologia, fundos e gestores de frotas.

---

## 💰 4. Estrutura de Planos & Monetização

| Nível / Plano | Preço Sugerido | Infraestrutura IA | Funcionalidades Incluídas |
| :--- | :--- | :--- | :--- |
| **Gratuito (Extensão)** | **R$ 0** | Sem IA | • Leitura em tempo real de taxas e lances<br>• Cálculo de Preço Limite e KM/Ano<br>• Salva até 5 lotes localmente na máquina |
| **Caçador Cloud + BYOK** | **R$ 19,90 / mês**<br>*(ou R$ 179/ano)* | **BYOK**<br>*(Chave do próprio usuário)* | • **Nuvem ilimitada:** Acesse seus lotes salvos em qualquer computador<br>• **BYOK:** Conecte sua chave gratuita do Gemini ou Claude/GPT<br>• **Consultas ilimitadas de IA** via BYOK<br>• **Exportação:** Gerar relatórios em PDF e planilhas Excel/CSV<br>• **Comparador Web:** Compare 2 ou mais lotes lado a lado |
| **Arrematante Pro (IA Inclusa)** | **R$ 47,00 / mês**<br>*(ou R$ 397/ano)* | **IA Gerenciada**<br>*(Sem precisar de chave)* | • Tudo do plano anterior<br>• **Sem precisar configurar chaves de API**<br>• **50 análises completas de IA por mês** (dossiê do laudo, riscos ocultos e margem)<br>• **Alertas de Lotes:** Aviso quando lotes de alta oportunidade (Score 80+) forem cadastrados<br>• **Suporte prioritário via WhatsApp** |
| **Lojista / Dealer MCP** | **R$ 97,00 a R$ 147,00 / mês** | **IA Híbrida + MCP Server** | • Multi-usuários (até 3 acessos na mesma empresa)<br>• **Servidor MCP Oficial:** Conexão direta com Claude Desktop e agentes<br>• Relatórios de vistoria em PDF com logotipo próprio (White-label)<br>• Cota expandida de IA gerenciada (200 consultas/mês) |

---

## 🛠️ 5. Próximos Passos de Implementação (Roadmap Sugerido)

1. **Fase 1: Configuração do Supabase (Backend Serverless)**
   - Criar projeto no Supabase (plano free).
   - Configurar tabelas `users_profile` e `saved_lots`.
   - Ativar autenticação Magic Link e Google.

2. **Fase 2: Tela de Login e Dashboard em `leilometro`**
   - Criar página `/login.html` e `/dashboard.html` no repositório do site.
   - Sincronizar login com a extensão via `externally_connectable`.

3. **Fase 3: Módulo BYOK na Extensão e no Dashboard**
   - Input seguro para Gemini API Key / Claude API Key.
   - Botão *"Analisar com IA"* no painel da extensão que envia o resumo do lote e o laudo cautelar para o modelo.

4. **Fase 4: Checkout e Pagamento**
   - Integração com gateway simples e rápido (Asaas, Stripe Brasil ou Kiwify/Hotmart com webhook para atualizar o `plan_tier` do usuário no Supabase).
