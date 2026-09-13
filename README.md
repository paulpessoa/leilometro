# Leilômetro — Landing Page & Portal Oficial

> Landing page oficial e central de suporte do **Leilômetro**, a extensão Chrome que atua como co-piloto financeiro em leilões de veículos em tempo real.  
> Deploy em produção: [leilometro.com.br](https://leilometro.com.br)

---

## 🎯 Sobre o Projeto

O portal **leilometro.com.br** apresenta a proposta de valor da extensão, demonstra visualmente seu painel de inteligência em tempo real, disponibiliza links para a Chrome Web Store e oferece centrais de suporte, termos de uso e política de privacidade.

O código-fonte da extensão Chrome encontra-se no repositório dedicado:  
👉 **[paulpessoa/leilometro-extensao](https://github.com/paulpessoa/leilometro-extensao)**

---

## 🚀 Recursos Destacados no Portal

- **Painel Interativo em Tempo Real**: Demonstração visual do painel com score de oportunidade (0–100), taxas detalhadas e margem de lances.
- **Transparência Matemática (Tooltips Interativos)**:
  - **Fórmula do Preço Limite**: `(FIPE - Margem de Revenda) - Custos Estimados = Preço Limite`.
  - **Classificação de Uso**: Cálculo de KM/Ano e média mensal para identificar uso particular, frota ou aplicativo.
- **Scraping Resiliente & Tolerante a Falhas**: Apoio completo a leilões com layouts dinâmicos (como Leilo.com.br Quasar 2026) e operação contínua mesmo quando a quilometragem não consta ou o hodômetro é inacessível.
- **Campos de Formulário Modernos**: Edição rápida de FIPE de referência, margem de revenda, consertos e documentação.
- **Detecção Automática da Extensão**: O site detecta via `chrome.runtime.sendMessage` se o usuário já tem o Leilômetro instalado no navegador, transformando o botão de instalação em um indicador de status ativo.
- **Conformidade LGPD**: Banner de consentimento com suporte a Microsoft Clarity e política de privacidade transparente.

---

## 📁 Estrutura de Arquivos

```
leilometro/
├── index.html            # Landing page principal com mockup interativo e planos
├── suporte.html          # Central de suporte com FAQ detalhado
├── privacidade.html      # Política de privacidade compatível com LGPD / Chrome Web Store
├── termos.html           # Termos de uso do serviço
├── styles.css            # Design system dark theme, tipografia Bebas Neue & DM Sans
├── app.js                # Lógica do cursor, animações de scroll, FAQ e detecção de extensão
├── vercel.json           # Configuração de deploy, rotas e headers de segurança na Vercel
├── robots.txt            # Regras para indexadores de busca
├── sitemap.xml           # Mapa do site para SEO
├── favicon/              # Pacote completo de favicons e webmanifest
└── icons/                # Ícones da marca em alta resolução
```

---

## 🌐 Deploy e Publicação

Este repositório está configurado para deploy contínuo na **Vercel**. Cada commit na branch `main` gera uma nova versão de produção em `leilometro.com.br`.

---

_Leilômetro — Seu próximo lance começa aqui._
