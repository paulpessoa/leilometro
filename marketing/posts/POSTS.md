# 📣 Sequência de 12 posts: Facebook, Instagram e LinkedIn

> As artes estão em [`img/`](img/). Para mudar um texto ou número, edite [`gerar/gerar.mjs`](gerar/gerar.mjs) e rode `node gerar.mjs` (instruções no topo do arquivo).
>
> **Formatos:**
> - `.png` (1080×1080): feed do Instagram, Facebook e LinkedIn.
> - `.mp4`: **use este no Instagram e no Facebook** (Reels/feed). O Instagram **não aceita GIF**.
> - `.gif`: LinkedIn, comentários, WhatsApp e a página do site.
>
> **Ritmo sugerido:** 3 posts por semana (seg/qua/sex, entre 19h e 21h, quando o público de leilão está online). As 12 artes cobrem 4 semanas.
>
> **Link na bio / nos posts:** use sempre o link com UTM indicado em cada post. Assim o Clarity mostra qual post trouxe visita.

## Hashtags base (escolha 8 a 12 por post no Instagram; 3 no LinkedIn; 0 a 2 no Facebook)

`#leilao #leilaodecarros #leilaodeveiculos #carrodeleilao #arrematante #copart #leilo #revendadecarros #carrosusados #tabelafipe #economia #dicasautomotivas`

LinkedIn: `#leilão #empreendedorismo #javascript #buildinpublic #chromeextension`

---

## Semana 1: apresentação

### Post 01: "Nunca pague a mais no leilão" (apresentação)
**Arte:** `img/post01-apresentacao.png` · **UTM:** `?utm_source={rede}&utm_medium=post&utm_campaign=p01_apresentacao`

**Instagram / Facebook**
```
Você já viu um carro "baratinho" no leilão e, no fim, pagou quase o preço de loja? 😬

Criei o Leilômetro: uma extensão GRÁTIS para o Chrome que abre um painel na página do lote e mostra:

✅ o custo real (lance + comissão + taxas do pátio)
✅ o seu lance máximo para ainda ter lucro
✅ o KM/ano (particular, frota ou aplicativo)
✅ um score de oportunidade de 0 a 100

Funciona no leilo.com.br e já tem modo beta para outras leiloeiras.
Sem cadastro e sem cartão. 👉 link na bio

#leilao #leilaodecarros #carrodeleilao #arrematante #tabelafipe #revendadecarros
```

**LinkedIn**
```
Lancei um projeto pessoal: o Leilômetro, uma extensão gratuita do Chrome para quem compra carro em leilão.

O problema: no calor do pregão, as pessoas esquecem que o lance é só uma parte do preço. Comissão, pátio, remoção, documentação e IPVA somam facilmente 20 a 30% a mais.

A solução: um painel na própria página do lote que calcula o custo real, o lance máximo para a margem desejada e o perfil de uso do carro (KM/ano).

Se você conhece alguém que compra carro em leilão, me ajuda compartilhando? Feedback é muito bem-vindo.

🔗 leilometro.com.br?utm_source=linkedin&utm_medium=post&utm_campaign=p01_apresentacao
#leilão #empreendedorismo #chromeextension
```
**Texto alternativo (acessibilidade):** "Painel do Leilômetro com um Onix 2021: lance de R$ 32.000, custo no leilão de R$ 35.250 e lance máximo de R$ 43.380."

---

### Post 02: "O lance não é o preço" (animado)
**Arte:** `img/post02-lance-nao-e-preco.mp4` (IG/FB) · `.gif` (LinkedIn) · **UTM:** `p02_custo_real`

**Instagram / Facebook**
```
O lance foi R$ 32.000. Quanto o carro custou de verdade? 🤔

Lance ............................ R$ 32.000
+ Comissão do leiloeiro (5%) ..... R$ 1.600
+ Pátio, remoção e vistoria ...... R$ 1.650
+ Conserto estimado .............. R$ 2.500
+ Documentação e transferência ... R$ 1.200
+ IPVA ........................... R$ 1.800
= CUSTO REAL ..................... R$ 40.750

Quase 27% acima do lance. E muita gente só percebe depois de arrematar.

O Leilômetro faz essa conta sozinho, em cada lote, antes de você dar o lance. Grátis no Chrome. 👉 link na bio

Salva esse post para a próxima vez que for dar lance. 📌
#leilao #leilaodeveiculos #carrodeleilao #dicasautomotivas #economia
```

**LinkedIn**
```
Um exemplo real de como o "preço" engana no leilão de veículos:

Lance de R$ 32.000 → custo real de R$ 40.750 (+27%).

Comissão, taxas do pátio, conserto, documentação e IPVA não aparecem no número grande da tela. Por isso fiz o Leilômetro calcular tudo isso ao vivo, na página do lote.

#leilão #finanças #buildinpublic
```

---

### Post 03: "Quanto dar no máximo?" (fórmula)
**Arte:** `img/post03-formula-preco-limite.png` · **UTM:** `p03_formula`

**Instagram / Facebook**
```
A pergunta de ouro do leilão: QUANTO DAR NO MÁXIMO? 💰

Fórmula do preço limite:
(FIPE × (1 − margem) − taxas − custos pós) ÷ (1 + comissão)

Exemplo, um Onix 2021 com FIPE de R$ 62.000 e margem de 15%:
(62.000 × 0,85 − 1.650 − 5.500) ÷ 1,05 = R$ 43.380

Acima de R$ 43.380, a sua margem some. Simples assim.

O Leilômetro calcula isso em cada lote e ainda avisa quando o lance chega perto. 👉 link na bio

#leilao #leilaodecarros #arrematante #tabelafipe #revendadecarros
```

**LinkedIn:** use a mesma arte com o texto: *"Às vezes a melhor feature é uma fórmula bem explicada. Esta é a regra do Leilômetro para o lance máximo…"* + a fórmula + link.

---

## Semana 2: funcionalidades

### Post 04: "Ele apita antes de você exagerar" (Modo Leilão, animado)
**Arte:** `img/post04-modo-leilao.mp4` / `.gif` · **UTM:** `p04_modo_leilao`

**Instagram / Facebook (Reels)**
```
Pregão ao vivo, lance subindo, coração acelerado… e você passa do teto sem perceber. 🫠

O Modo Leilão do Leilômetro:
🔔 apita quando faltam poucos lances para o seu teto
🚨 toca um alarme quando o lance passa do teto
📈 mostra o gráfico e o ritmo dos lances
💡 pisca o título da aba, então funciona até com outra aba aberta

Você decide com a cabeça fria, antes do martelo bater.
Grátis no Chrome. 👉 link na bio

#leilao #leilaoonline #carrodeleilao #arrematante #copart #leilo
```
**Dica de Reels:** grave a tela de um pregão real com o Modo Leilão ligado (15 a 30 s) e use este MP4 como capa/fechamento.

---

### Post 05: "O odômetro entrega o passado" (KM/ano)
**Arte:** `img/post05-km-ano.png` · **UTM:** `p05_km_ano`

**Instagram / Facebook**
```
Mesmo modelo, mesmo ano… e um pode ter rodado 3x mais que o outro. 🚗💨

A conta é simples: KM ÷ idade do carro = KM por ano.

🟢 até 15 mil km/ano → uso particular/normal
🟡 15 a 25 mil → possível frota
🔴 acima de 30 mil → uso intenso ou aplicativo

Mais KM/ano = mais desgaste e revenda mais difícil. O Leilômetro mostra isso no painel de cada lote.

Qual foi o maior KM/ano que você já viu num leilão? 👇
#leilao #carrosusados #carrodeleilao #dicasautomotivas #revendadecarros
```

---

### Post 06: "4 sinais de risco no anúncio"
**Arte:** `img/post06-sinais-de-risco.png` · **UTM:** `p06_riscos`

**Instagram / Facebook**
```
Antes de dar lance, confira estes 4 sinais no anúncio: ⚠️

🎥 Lote SEM VÍDEO: muitas vezes o carro não liga ou não anda.
🔑 SEM CHAVE: chave codificada pode custar centenas de reais.
📋 LAUDO COM OBSERVAÇÕES: remarcação, sinistro ou corrosão derrubam a revenda.
🏦 RECUPERADO DE FINANCIAMENTO: costuma ter manutenção atrasada.

Não quer dizer que o carro é ruim. Quer dizer que o seu teto tem que ser MENOR.

O Leilômetro marca esses sinais no painel do lote automaticamente.
#leilao #leilaodecarros #carrodeleilao #vistoria #arrematante
```

---

## Semana 3: IA e comparação

### Post 07: "IA no leilão sem configurar nada" (animado)
**Arte:** `img/post07-ia-sem-chave.mp4` / `.gif` · **UTM:** `p07_ia_sem_chave`

**Instagram / Facebook**
```
Você usa ChatGPT? Então já tem um assessor de leilão. 🤖

No painel do Leilômetro, clique em "Perguntar ao ChatGPT":
1️⃣ a extensão monta a pergunta com TODOS os números do lote
2️⃣ copia e abre o ChatGPT (ou o Gemini, ou o Claude)
3️⃣ você cola (Ctrl+V) e recebe o veredito, os riscos e um teto sugerido

Sem criar chave de API e sem pagar nada a mais.
👉 link na bio

#leilao #inteligenciaartificial #chatgpt #carrodeleilao #arrematante
```

**LinkedIn**
```
Decisão de produto: como oferecer IA para um público que não é técnico?

Meu primeiro caminho foi o BYOK (o usuário traz a própria chave de API). Para devs, é ótimo. Para quem compra carro em leilão, "crie uma chave na OpenAI" é um muro.

A solução mais simples que encontrei: a extensão monta um prompt completo com os dados do lote, copia e abre o ChatGPT/Gemini/Claude. O usuário só cola. Custo de infraestrutura: zero.

O próximo passo é uma cota gratuita pela minha própria API (Gemini Flash-Lite, com limite diário). E o BYOK continua lá, para quem quiser.

Às vezes a melhor arquitetura é a que tira atrito, não a mais sofisticada.
#buildinpublic #ia #produto
```

---

### Post 08: "Qual dos três vale mais?" (comparador)
**Arte:** `img/post08-comparador.png` · **UTM:** `p08_comparador`

**Instagram / Facebook**
```
Três carros, três lances. Qual você levaria? 👀

🚗 Onix 2021: lance R$ 32.000 · custo real R$ 40.750 · score 75
🚗 HB20 2020: lance R$ 36.500 · custo real R$ 45.475 · score 45
🚗 Argo 2021: lance R$ 41.000 · custo real R$ 50.200 · score 55

O mais barato no lance nem sempre é o melhor negócio. Mas, neste caso, o Onix ganha: o lance está bem abaixo do lance máximo e o KM/ano é normal.

No Leilômetro você salva os lotes e compara lado a lado (e exporta em CSV).
Comenta: qual você escolheria? 👇
#leilao #leilaodecarros #revendadecarros #carrosusados #tabelafipe
```

---

### Post 09: "Checklist da vistoria" (post para salvar)
**Arte:** `img/post09-checklist-vistoria.png` · **UTM:** `p09_checklist`

**Instagram / Facebook**
```
📌 SALVA ESTE POST para o dia da visitação:

☑️ Leia o edital inteiro: taxas, prazo de retirada, débitos
☑️ Confira chassi e motor com o documento
☑️ Olhe colunas, longarinas e assoalho (sinal de batida)
☑️ Procure ferrugem, solda e massa nas portas
☑️ Veja o nível e a cor do óleo e da água
☑️ Pneus, estepe, macaco e chave de roda
☑️ Confirme se o carro liga e anda (veja o vídeo do lote)
☑️ Some guincho e transporte se o pátio for longe

O assistente do Leilômetro monta um checklist específico para cada lote, com base nos dados do anúncio.
Marca aquele amigo que vai no próximo leilão! 👇
#leilao #vistoria #carrodeleilao #dicasautomotivas #arrematante
```

---

## Semana 4: confiança e comunidade

### Post 10: "Da planilha para uma extensão" (bastidores, foco no LinkedIn)
**Arte:** `img/post10-bastidores-dev.png` · **UTM:** `p10_bastidores`

**LinkedIn** *(personalize com a sua história real: por que você começou?)*
```
Tudo começou com uma planilha. [Conte aqui, em 2 ou 3 frases, como você ou alguém próximo se interessou por leilão e qual foi a dor.]

Hoje ela virou o Leilômetro, uma extensão do Chrome:
• JavaScript puro, sem framework e sem build
• Manifest V3
• a fórmula do lance máximo coberta por testes
• privacidade: os lotes ficam no navegador do usuário
• IA opcional (ChatGPT, Gemini ou a chave do próprio usuário)

O que aprendi até aqui: [1 aprendizado técnico + 1 de produto].

O código está no GitHub e o produto é grátis. Se você trabalha com leilão, revenda ou extensões de navegador, adoraria trocar uma ideia.

🔗 leilometro.com.br?utm_source=linkedin&utm_medium=post&utm_campaign=p10_bastidores
#buildinpublic #javascript #chromeextension
```

**Instagram / Facebook (versão curta)**
```
Bastidores 🛠️ O Leilômetro é um projeto pessoal feito por um desenvolvedor, grátis e com o código aberto no GitHub. Seus lotes ficam no SEU navegador, e nada vai para servidor nenhum.
Tem sugestão? Me conta aqui nos comentários! 👇
```

---

### Post 11: "Está no celular?" (calculadora web)
**Arte:** `img/post11-calculadora-celular.png` · **UTM:** `p11_calculadora` · link: `leilometro.com.br/calculadora`

**Instagram / Facebook**
```
Está vendo o leilão pelo celular? 📱

A extensão funciona no computador, mas a CALCULADORA DO LANCE MÁXIMO funciona em qualquer lugar:

👉 leilometro.com.br/calculadora

Coloque a FIPE, o lance, a comissão, as taxas e a margem que você quer. Ela mostra na hora:
✅ o custo real
✅ o lance máximo
✅ se ainda sobra lucro

Grátis e sem cadastro. Salva nos favoritos! ⭐
#leilao #leilaodecarros #carrodeleilao #tabelafipe #arrematante
```

---

### Post 12: "Qual leiloeira vem agora?" (enquete)
**Arte:** `img/post12-enquete-leiloeiras.png` · **UTM:** `p12_enquete`

**Instagram / Facebook**
```
Você decide o próximo passo do Leilômetro! 🗳️

Hoje ele funciona no leilo.com.br e já tem modo beta para outros sites. Qual leiloeira deve ganhar suporte completo primeiro?

🅰️ Copart
🅱️ VIP Leilões
©️ Sodré Santoro
🅳 Outra (escreve qual!)

Comenta a letra 👇 A mais votada entra no próximo mês.
#leilao #copart #vipleiloes #sodresantoro #leilaodecarros
```
**Stories:** repita como enquete nativa do Instagram (figurinha "Enquete", até 4 opções).

---

## ✅ Checklist antes de publicar cada post
- [ ] O link com UTM está certo (troque `{rede}` por `instagram`, `facebook` ou `linkedin`)
- [ ] Instagram/Facebook: use o **.mp4** nas artes animadas
- [ ] Coloquei o texto alternativo (Instagram: Configurações avançadas › Acessibilidade)
- [ ] Respondi os comentários das primeiras 2 horas (o algoritmo valoriza isso)
- [ ] Anotei na planilha de métricas: alcance, salvamentos, cliques
