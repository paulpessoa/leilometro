# 📈 Leilômetro: plano de marketing e de negócios

> **Objetivo dos próximos 90 dias:** ganhar os **primeiros 300 usuários ativos** (gente que analisa pelo menos 1 lote por semana) **sem gastar dinheiro**. Receita fica para depois. Agora a meta é provar que as pessoas usam e voltam.
>
> Versão visual (fluxos e gráficos): [`plano.html`](plano.html). Posts prontos: [`posts/POSTS.md`](posts/POSTS.md). Comentários no YouTube: [`YOUTUBE.md`](YOUTUBE.md).

---

## 1. Resumo em 30 segundos

| Pergunta | Resposta |
|---|---|
| **O que é** | Extensão gratuita do Chrome que mostra, na página do lote, o **custo real**, o **lance máximo** (preço limite) e os **riscos** do veículo |
| **Para quem** | Quem compra carro em leilão: primeira compra para uso próprio, revendedor pequeno e quem busca renda extra |
| **Dor que resolve** | "Na hora do pregão eu me empolgo, esqueço as taxas e pago caro" |
| **Promessa** | *"Saiba seu teto antes do martelo bater."* |
| **Por que agora** | Leilão online cresce a cada ano e quase todo mundo ainda calcula na planilha ou de cabeça |
| **Modelo** | Freemium: grátis agora; depois um **Pro** simples com IA inclusa e mais leiloeiras |
| **Meta 90 dias** | 1.000 instalações → 300 ativos semanais → 50 pessoas na lista de espera do Pro |

---

## 2. Quem é o cliente (personas)

| Persona | Quem é | O que quer | Onde está | Prioridade |
|---|---|---|---|---|
| **🧑 João, 1º carro de leilão** | 25–45 anos, quer economizar 20–40% num carro para uso | Não cair em cilada, entender as taxas | YouTube ("vale a pena carro de leilão?"), grupos de Facebook | **Alta: maior volume** |
| **🧰 Marcos, revendedor pequeno** | Garagista ou lojista que compra de 2 a 10 carros por mês | Margem garantida e rapidez para analisar vários lotes | Grupos de WhatsApp, Instagram, pátios | **Alta: é quem paga no futuro** |
| **💸 Carla, renda extra** | Compra, arruma e revende 1 a 3 carros por ano | Saber se vai sobrar lucro depois do conserto | Instagram, TikTok, YouTube | Média |
| **🤝 Parceiros** | Despachante, mecânico de vistoria, assessor de leilão | Ferramenta para mostrar ao cliente | LinkedIn, Instagram, indicação | **Canal de indicação** |

> 💡 **Exemplo de como falar com cada um:**
> - João: *"Esse Onix de R$ 32 mil no lance sai por R$ 36.900 com as taxas. A extensão calcula sozinha."*
> - Marcos: *"Abra 10 lotes e veja na hora quais deixam 15% de margem."*

---

## 3. Posicionamento e concorrência

| Alternativa de hoje | Problema | Como o Leilômetro ganha |
|---|---|---|
| Planilha no Excel | Dá trabalho e ninguém atualiza no meio do pregão | Calcula sozinho, **dentro da página do lote** e em tempo real |
| Calcular de cabeça | Esquece comissão, pátio, remoção, documentação e IPVA | Mostra o custo completo, item por item |
| Assessoria de leilão | Cobra por carro (ou %) | Grátis, e ainda serve como ferramenta da própria assessoria |
| Apps de consulta veicular | Mostram o histórico, mas não dizem quanto dar | Diz o **lance máximo** para a margem que você quer |
| Grupos de WhatsApp | Opinião, não número | Número objetivo + IA para tirar dúvida |

**Frase de posicionamento:**
> Para quem compra carro em leilão e não quer pagar caro no calor do lance, o Leilômetro é a calculadora que mostra o custo real e o lance máximo na própria página do lote. Diferente de planilhas e assessorias, ele é grátis, funciona em tempo real e avisa antes de você passar do seu teto.

---

## 4. Modelo de negócio (simples e em fases)

### Fase A, agora até ~500 ativos: **100% grátis**
- Foco total em usuários, avaliações na Chrome Web Store e depoimentos.
- Coletar e-mails de uma **lista de espera do Pro** (formulário simples no site).

### Fase B, depois de ~500 ativos: **Leilômetro Pro**

Recomendação: **simplificar** os 4 planos do `ARQUITETURA_SAAS_E_MONETIZACAO.md` para **2**:

| Plano | Preço sugerido | O que tem |
|---|---|---|
| **Grátis** | R$ 0 | Tudo que existe hoje + IA sem chave (botão "Perguntar ao ChatGPT") + 3 análises/dia da IA do Leilômetro |
| **Pro** | R$ 19,90/mês ou R$ 149/ano | IA do Leilômetro ilimitada (uso justo), todas as leiloeiras, nuvem/sincronização, alertas de lotes, relatório com sua marca |

> **Por que não vender BYOK?** Para quem não é programador, "crie uma chave de API" é uma barreira enorme. O BYOK continua existindo como **opção avançada e gratuita** para quem já tem chave. Ele deixa de ser o produto pago. Detalhes na seção 9.

### Conta rápida do custo da IA (para não ter medo de oferecer grátis)
- 1 análise ≈ 3.000 tokens de entrada + 800 de saída.
- Em modelos baratos ("flash-lite" / "mini"), isso fica na ordem de **menos de R$ 0,01 por análise** (confira a tabela de preços atual do provedor).
- 300 usuários × 3 análises/dia × 30 dias = 27.000 análises/mês, algo como **R$ 100 a R$ 250/mês** no pior caso. O **free tier do Gemini** cobre boa parte no começo, e a API tem um **limite diário global** para nunca estourar o orçamento (`IA_LIMITE_GLOBAL_DIA`).

### Outras receitas (Fase C, opcionais)
1. **Afiliados:** consulta veicular/histórico, seguro para carro de leilão, transporte/guincho, despachante. O link entra só no relatório e na seção de dicas, nunca no meio do cálculo.
2. **B2B com leiloeiras:** um "selo Leilômetro" ou um widget de "custo real" na página do lote. Comprador confiante dá mais lance.
3. **Plano Lojista:** multi-usuário, exportação e servidor MCP (já descrito na arquitetura).

---

## 5. Funil e métricas (o que medir toda segunda-feira)

```
Viu o post/vídeo  →  Visitou o site  →  Instalou  →  Analisou 1 lote  →  Voltou na semana seguinte  →  Entrou na lista do Pro
   (alcance)          (cliques UTM)    (Web Store)     (ativação)            (retenção D7)               (intenção de pagar)
```

| Métrica | Onde ver | Meta 30d | Meta 90d |
|---|---|---|---|
| Instalações | Painel do desenvolvedor da Chrome Web Store | 200 | 1.000 |
| Usuários ativos semanais | Chrome Web Store › Estatísticas | 60 | 300 |
| Avaliações 5★ | Ficha da loja | 10 | 40 |
| Visitas no site | Microsoft Clarity (já instalado) | 1.500 | 8.000 |
| Lista de espera do Pro | Formulário | 10 | 50 |

**Use links com UTM em todo post**, assim você sabe qual rede traz mais gente:
```
https://leilometro.com.br/?utm_source=instagram&utm_medium=post&utm_campaign=post03_taxas
https://leilometro.com.br/?utm_source=youtube&utm_medium=comentario&utm_campaign=canal_x
```

---

## 6. Canais, por prioridade (custo zero)

| # | Canal | Por quê | Ritmo |
|---|---|---|---|
| 1 | **Comentários em vídeos do YouTube** sobre carro de leilão | Público 100% qualificado, já com a dúvida na cabeça | 5 comentários bons/dia (ver [`YOUTUBE.md`](YOUTUBE.md)) |
| 2 | **Grupos de Facebook e WhatsApp de leilão** | Onde João e Marcos tiram dúvidas | 2 a 3 respostas úteis/dia. Só cite a ferramenta quando ela resolve a pergunta |
| 3 | **Reels / Shorts / TikTok** com gravação de tela | Mostrar o painel em ação convence mais que texto | 3/semana (roteiros nos posts 2, 4, 6, 8) |
| 4 | **LinkedIn "build in public"** | Você é dev: a história de construir o produto atrai parceiros e recrutadores | 1 a 2/semana |
| 5 | **Calculadora web grátis no site** (SEO) | Pega quem está no **celular** (extensão não roda no Chrome mobile) e quem pesquisa "calculadora leilão" no Google | Página `calculadora.html` (criada nesta entrega) |
| 6 | **Ficha da Chrome Web Store (ASO)** | A busca dentro da loja traz instalações orgânicas | Título com "leilão de carros", 5 capturas, pedir avaliação no 3º uso |
| 7 | **Parceiros** (despachantes, vistoriadores, assessores) | Um parceiro traz dezenas de clientes | 5 contatos/semana no LinkedIn/Instagram, com Pro grátis vitalício como oferta |

### Regras de ouro para não queimar a marca
- **Transparência:** diga que você é o criador ("fiz essa extensão grátis…"). Esconder isso parece golpe, e o nicho de leilão tem muito golpe.
- **Valor primeiro:** responda a dúvida com números. O link vem no fim, e só quando faz sentido.
- **Nunca** copie e cole o mesmo texto em vários vídeos. O YouTube marca como spam e oculta.
- **Nunca** prometa lucro. Use "ajuda a decidir" e "mostra o custo real".

---

## 7. Regiões com mais potencial

O leilo.com.br e os grandes pátios se concentram no **Centro-Sul**. Hipótese inicial, a validar no [Google Trends](https://trends.google.com.br/trends/explore?geo=BR&q=leil%C3%A3o%20de%20carros) (filtre por estado):

| Região | Por que | Ação |
|---|---|---|
| **São Paulo (capital e interior)** | Maior frota, mais pátios (Copart, Sodré Santoro, Freitas, Mega Leilões) e muito revendedor | Prioridade 1: post e anúncio regional quando houver verba |
| **Goiás / DF** | O leilo.com.br tem forte presença em Goiânia e Aparecida de Goiânia | Prioridade 1: grupos locais de leilão |
| **Paraná, Santa Catarina e Minas Gerais** | Frota grande, muitas locadoras e bancos retomando veículos | Prioridade 2 |
| **Nordeste (MA, PE, BA, CE)** | A VIP Leilões nasceu em São Luís (MA) e tem muitos pátios na região | Prioridade 2, junto com o suporte à VIP |
| **Internacional (copart.com, EUA)** | Mercado gigante, mas com concorrentes fortes e em inglês | Só depois de dominar o Brasil |

> **Como validar em 10 minutos:** no Google Trends, compare "leilão de carros", "copart" e "leilo" nos últimos 12 meses por sub-região. Os 5 estados do topo viram o foco dos posts e dos grupos.

---

## 8. Expansão para outras leiloeiras (resumo)

O plano técnico completo está em `leilometro-extensao/docs/PLANO_MULTI_LEILOEIRAS.md`. Ordem sugerida, pelo número de compradores e pela facilidade técnica:

1. **Copart Brasil**: grande volume e muita busca. Página bem estruturada.
2. **VIP Leilões**: a maior rede de pátios e muito público no Nordeste. A API já tem um scraper.
3. **Sodré Santoro**: grande e tradicional em SP.
4. **Freitas Leiloeiro / Mega Leilões / Superbid**: em seguida.

A extensão agora tem um **modo beta "outras leiloeiras"**. O usuário autoriza o site com 1 clique, e ela tenta ler lance, ano, KM e FIPE da página e abre o mesmo painel. Para quem já tem a extensão instalada, nada muda: ela **não é desativada** pela atualização, porque as permissões novas são opcionais.

---

## 9. IA: qual a melhor forma para quem não é programador?

| Nível | Como funciona | Para quem | Custo para você | Atrito |
|---|---|---|---|---|
| **1. "Perguntar ao ChatGPT" (padrão)** | A extensão monta a pergunta com os dados do lote, **copia** e abre o ChatGPT, Gemini ou Claude. O usuário só cola (Ctrl+V) | Todo mundo | **R$ 0** | Mínimo: quase todo mundo já tem conta no ChatGPT |
| **2. IA do Leilômetro (cota grátis)** | A extensão chama a `leilometro-api`, que usa a sua chave do Gemini, com limite diário por instalação | Quem quer a resposta dentro do painel | Centavos/dia, com teto global | Zero: um clique |
| **3. BYOK (chave própria)** | Como hoje | Avançados e devs | R$ 0 | Alto |

**Recomendação:** o nível 1 fica como padrão já, porque funciona hoje sem servidor. O nível 2 entra assim que você publicar a API com a `GEMINI_API_KEY` e vira o gancho do Pro depois (grátis = 3/dia, Pro = ilimitado). O nível 3 fica escondido em "Avançado".

---

## 10. Plano de 90 dias

| Semana | Foco | Entregas |
|---|---|---|
| **1** | Arrumar a casa | Publicar a v1.2 na Chrome Web Store, revisar a ficha (ASO), criar contas @leilometro (IG/FB/LinkedIn), publicar a calculadora web |
| **2** | Primeiros posts | Posts 1 a 3, 5 comentários/dia no YouTube, entrar em 10 grupos de leilão |
| **3** | Prova social | Posts 4 a 6, pedir avaliação para os 10 primeiros usuários, gravar 2 Reels |
| **4** | Ajustar | Ver UTM/Clarity: qual canal trouxe mais? Dobrar a aposta nele. Posts 7 a 10 |
| **5–6** | Leiloeira nº 2 | Validar o adaptador da Copart/VIP com lotes reais e anunciar ("agora também na Copart") |
| **7–8** | Parceiros | 20 contatos com despachantes e assessores, oferecendo Pro grátis vitalício |
| **9–10** | IA do Leilômetro | Publicar a API com cota grátis e anunciar "IA sem precisar de chave" |
| **11–12** | Lista do Pro | Página do Pro com lista de espera e decisão de preço com base nas respostas |

---

## 11. Orçamento

| Item | Custo |
|---|---|
| Domínio, Vercel e Render (free) | Já pago / R$ 0 |
| IA (free tier do Gemini + limite global) | R$ 0 a R$ 50/mês no começo |
| Impulsionar 2 melhores posts (opcional, semana 4+) | R$ 100 a R$ 200, com segmentação por SP/GO e interesse "leilão" |
| **Total 90 dias** | **R$ 0 a R$ 350** |

---

## 12. Riscos e cuidados

| Risco | Como reduzir |
|---|---|
| Site da leiloeira muda o layout e o painel quebra | Adaptadores isolados por site + leitura por API/JSON-LD + aviso "dados incompletos" |
| Termos de uso das leiloeiras | A extensão só lê a página que **o próprio usuário** abriu. Não faz robôs nem lances automáticos |
| Parecer golpe (nicho cheio de golpe) | Transparência, site com CNPJ/contato quando houver, código aberto no GitHub |
| Spam no YouTube e nos grupos | Comentários únicos e úteis, no máximo 5/dia, sempre se identificando como criador |
| LGPD | Nenhum dado pessoal sai do navegador. A IA recebe só os dados do lote |
| Chrome no celular não roda extensão | Calculadora web no site + relatório que abre no WhatsApp |

---

_Última atualização: outubro/2026._
