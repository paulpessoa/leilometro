// Leilômetro: gera as artes dos posts (PNG 1080×1080, GIF e MP4) a partir de HTML.
//
// Uso:
//   cd marketing/posts/gerar
//   npm install            # instala o Playwright (só na primeira vez)
//   npx playwright install chromium
//   node gerar.mjs         # gera tudo em ../img
//   node gerar.mjs 04      # gera só o post 04
//
// GIF e MP4 precisam do ffmpeg no PATH (https://ffmpeg.org). Sem ele, saem só os PNGs.
// Para mudar um texto ou número, edite o objeto POSTS abaixo e rode de novo.

import { createRequire } from "node:module"
import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, rmSync, existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const AQUI = dirname(fileURLToPath(import.meta.url))
const SAIDA = join(AQUI, "..", "img")
const require = createRequire(import.meta.url)

function carregarPlaywright() {
  for (const p of ["playwright", "/opt/node22/lib/node_modules/playwright"]) {
    try {
      return require(p)
    } catch {}
  }
  console.error("Playwright não encontrado. Rode: npm install && npx playwright install chromium")
  process.exit(1)
}

const b64 = (arq) => readFileSync(join(AQUI, arq)).toString("base64")
const ICONE = `data:image/png;base64,${readFileSync(join(AQUI, "..", "..", "..", "icons", "icon128.png")).toString("base64")}`
const fonte = (familia, arq, peso) =>
  `@font-face{font-family:"${familia}";src:url(data:font/woff2;base64,${b64("fonts/" + arq)}) format("woff2");font-weight:${peso}}`

// ─── IDENTIDADE (mesmas cores do site) ───────────────────────────────────────
const CSS = `
${fonte("Bebas Neue", "bebas-neue-latin-400-normal.woff2", 400)}
${fonte("DM Sans", "dm-sans-latin-400-normal.woff2", 400)}
${fonte("DM Sans", "dm-sans-latin-700-normal.woff2", 700)}
${fonte("DM Sans", "dm-sans-latin-800-normal.woff2", 800)}
:root{--gold:#f0b429;--dark:#080c10;--dark2:#0f1419;--dark3:#161d26;--dark4:#1e2733;--line:rgba(240,180,41,.16);
--text:#e8edf2;--muted:#8ea1b8;--green:#22c55e;--lime:#84cc16;--amber:#f59e0b;--orange:#f97316;--red:#ef4444}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1080px;overflow:hidden;background:var(--dark)}
body{font-family:"DM Sans",sans-serif;color:var(--text);-webkit-font-smoothing:antialiased}
.card{position:relative;width:1080px;height:1080px;padding:64px 76px 56px;display:flex;flex-direction:column;gap:30px;
background:radial-gradient(900px 600px at 85% -10%,rgba(240,180,41,.13),transparent 60%),var(--dark)}
.card:after{content:"";position:absolute;inset:0;pointer-events:none;
background-image:linear-gradient(rgba(240,180,41,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(240,180,41,.035) 1px,transparent 1px);background-size:54px 54px}
.brand{display:flex;align-items:center;gap:16px;font-family:"Bebas Neue";font-size:38px;letter-spacing:2px;z-index:1}
.brand img{width:52px;height:52px;border-radius:12px}
.brand .tag{margin-left:auto;font-family:"DM Sans";font-weight:700;font-size:20px;letter-spacing:1.5px;text-transform:uppercase;
color:var(--gold);border:2px solid var(--line);padding:8px 18px;border-radius:999px}
main{flex:1;display:flex;flex-direction:column;gap:24px;z-index:1;min-height:0}
h1{font-family:"Bebas Neue";font-weight:400;font-size:118px;line-height:.92;letter-spacing:1px}
h1 em{font-style:normal;color:var(--gold)}
h2{font-family:"Bebas Neue";font-weight:400;font-size:64px;line-height:1;letter-spacing:1px}
.sub{font-size:32px;line-height:1.35;color:var(--muted);max-width:860px}
.sub b{color:var(--text)}
footer{display:flex;justify-content:space-between;align-items:center;font-size:24px;color:var(--muted);z-index:1;
border-top:2px solid var(--line);padding-top:24px}
footer b{color:var(--gold);font-weight:800;font-size:28px}
.painel{background:var(--dark2);border:2px solid var(--line);border-radius:28px;padding:34px 38px;display:flex;flex-direction:column;gap:18px}
.linha{display:flex;justify-content:space-between;align-items:baseline;font-size:31px;gap:24px}
.linha span{color:var(--muted)}
.linha b{font-variant-numeric:tabular-nums;font-weight:800}
.big{font-family:"Bebas Neue";font-size:92px;line-height:1;color:var(--gold);font-variant-numeric:tabular-nums}
.pill{display:inline-flex;align-items:center;gap:10px;font-weight:800;font-size:24px;padding:8px 18px;border-radius:999px;letter-spacing:1px}
.sep{height:2px;background:var(--line)}
.mono{font-variant-numeric:tabular-nums}
`

const BRL = (v) => "R$ " + Math.round(v).toLocaleString("pt-BR")
const shell = (tag, corpo, rodape = "Grátis no Chrome") => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><style>${CSS}</style></head>
<body><div class="card"><header class="brand"><img src="${ICONE}" alt="">LEILÔMETRO<span class="tag">${tag}</span></header>
<main>${corpo}</main><footer><b>leilometro.com.br</b><span>${rodape}</span></footer></div></body></html>`

const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)
const fase = (t, a, b) => ease((t - a) / (b - a))

// ─── EXEMPLO USADO EM TODOS OS POSTS (números conferidos com lib/calc.js) ────
// Onix 1.0 LT 2021 · 68.000 km · FIPE R$ 62.000 · comissão 5% · taxas do pátio R$ 1.650
// Pós-arremate: conserto R$ 2.500 + documentação R$ 1.200 + IPVA R$ 1.800 = R$ 5.500
// Preço limite (margem 15%) = (62.000×0,85 − 1.650 − 5.500) ÷ 1,05 = R$ 43.380
const EX = { fipe: 62000, lance: 32000, com: 0.05, taxas: 1650, conserto: 2500, doc: 1200, ipva: 1800, limite: 43380 }

// ─── POSTS ───────────────────────────────────────────────────────────────────
const POSTS = {
  "01": {
    nome: "post01-apresentacao",
    html: () =>
      shell(
        "Novo",
        `<h1 style="font-size:96px">NUNCA PAGUE <em>A MAIS</em><br>NO LEILÃO.</h1>
        <div class="painel">
          <div class="linha"><span>Chevrolet Onix 1.0 LT · 2021</span><span class="pill" style="background:rgba(132,204,22,.15);color:var(--lime)">SCORE 75 · BOA</span></div>
          <div class="sep"></div>
          <div class="linha"><span>Lance atual</span><b>${BRL(EX.lance)}</b></div>
          <div class="linha"><span>Custo no leilão</span><b>${BRL(EX.lance * 1.05 + EX.taxas)}</b></div>
          <div class="linha"><span>Seu lance máximo</span><b style="color:var(--gold);font-size:44px">${BRL(EX.limite)}</b></div>
          <div class="linha"><span>KM/ano</span><b style="color:var(--green)">13.600 · uso normal</b></div>
        </div>
        <p class="sub">Extensão grátis que mostra o <b>custo real</b> e o <b>lance máximo</b> direto na página do lote.</p>`
      )
  },

  "02": {
    nome: "post02-lance-nao-e-preco",
    frames: 84,
    fps: 14,
    html: (t) => {
      const itens = [
        ["Lance", EX.lance],
        ["+ Comissão do leiloeiro (5%)", EX.lance * EX.com],
        ["+ Taxas do pátio, remoção, vistoria", EX.taxas],
        ["+ Conserto estimado", EX.conserto],
        ["+ Documentação e transferência", EX.doc],
        ["+ IPVA", EX.ipva]
      ]
      const total = itens.reduce((s, [, v]) => s + v, 0)
      let acumulado = 0
      const linhas = itens
        .map(([r, v], i) => {
          const p = fase(t, 0.05 + i * 0.1, 0.13 + i * 0.1)
          acumulado += v * p
          return `<div class="linha" style="opacity:${0.15 + 0.85 * p};transform:translateX(${(1 - p) * 40}px)"><span>${r}</span><b>${BRL(v)}</b></div>`
        })
        .join("")
      const fim = fase(t, 0.7, 0.8)
      return shell(
        "Faça a conta",
        `<h1 style="font-size:92px">O LANCE <em>NÃO É</em><br>O PREÇO.</h1>
        <div class="painel" style="gap:14px">${linhas}<div class="sep"></div>
          <div class="linha"><span style="font-size:34px;color:var(--text);font-weight:700">Custo real</span><span class="big" style="color:var(--gold)">${BRL(acumulado)}</span></div>
        </div>
        <p class="sub" style="opacity:${fim}">Quase <b style="color:var(--red)">${Math.round((total / EX.lance - 1) * 100)}% acima do lance</b>. O Leilômetro faz essa conta sozinho, em cada lote.</p>`
      )
    }
  },

  "03": {
    nome: "post03-formula-preco-limite",
    html: () =>
      shell(
        "Fórmula",
        `<h1 style="font-size:108px">QUANTO DAR<br><em>NO MÁXIMO?</em></h1>
        <div class="painel" style="gap:22px">
          <p style="font-size:30px;color:var(--muted)">Preço limite =</p>
          <p style="font-size:40px;font-weight:800;line-height:1.3">( FIPE × (1 − margem) − taxas − custos pós ) <span style="color:var(--gold)">÷</span> (1 + comissão)</p>
          <div class="sep"></div>
          <p style="font-size:30px;color:var(--muted)">Exemplo · Onix 2021 · margem de 15%</p>
          <p style="font-size:34px;line-height:1.4" class="mono">( 62.000 × 0,85 − 1.650 − 5.500 ) ÷ 1,05 =</p>
          <p class="big" style="font-size:120px">${BRL(EX.limite)}</p>
        </div>
        <p class="sub">Passou disso, <b>sua margem some</b>. O painel avisa antes.</p>`
      )
  },

  "04": {
    nome: "post04-modo-leilao",
    frames: 96,
    fps: 14,
    html: (t) => {
      const inc = 500
      const passos = Math.min(13, Math.floor(fase(t, 0.05, 0.75) * 13))
      const lance = 38000 + passos * inc
      const teto = EX.limite
      const faltam = Math.max(0, Math.floor((teto - lance) / inc))
      const passou = lance > teto
      const cor = passou ? "var(--red)" : faltam <= 3 ? "var(--amber)" : "var(--green)"
      const pct = Math.min(100, (lance / 46000) * 100)
      const pctTeto = (teto / 46000) * 100
      const pisca = passou && Math.floor(t * 40) % 2 === 0
      const hist = Array.from({ length: passos + 1 }, (_, i) => 38000 + i * inc)
      const barras = hist
        .map((v) => `<div style="flex:1;height:${((v - 36000) / 10000) * 100}%;background:${v > teto ? "var(--red)" : "var(--gold)"};border-radius:6px 6px 0 0;opacity:.85"></div>`)
        .join("")
      return shell(
        "Modo Leilão",
        `<h1 style="font-size:100px">ELE APITA ANTES<br>DE VOCÊ <em>EXAGERAR.</em></h1>
        <div class="painel" style="border-color:${passou ? "rgba(239,68,68,.6)" : "var(--line)"};background:${pisca ? "rgba(239,68,68,.12)" : "var(--dark2)"}">
          <div class="linha"><span>🔴 Ao vivo · Onix 2021</span><span class="pill" style="background:${passou ? "rgba(239,68,68,.18)" : "rgba(34,197,94,.14)"};color:${cor}">${passou ? "🔔 PASSOU DO TETO" : `faltam ${faltam} lances`}</span></div>
          <div class="linha"><span>Lance</span><span class="big" style="color:${cor}">${BRL(lance)}</span></div>
          <div style="position:relative;height:26px;background:var(--dark4);border-radius:999px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${cor};border-radius:999px"></div>
            <div style="position:absolute;left:${pctTeto}%;top:-4px;bottom:-4px;width:5px;background:var(--text)"></div>
          </div>
          <div class="linha" style="font-size:26px"><span>Seu teto: <b style="color:var(--text)">${BRL(teto)}</b></span><span>incremento ${BRL(inc)}</span></div>
          <div style="display:flex;align-items:flex-end;gap:8px;height:120px">${barras}</div>
        </div>
        <p class="sub">Som, notificação e título da aba piscando <b>quando faltam poucos lances</b> ou quando o lance passa do seu teto.</p>`
      )
    }
  },

  "05": {
    nome: "post05-km-ano",
    html: () => {
      const linha = (carro, km, idade, rot, cor) => `
        <div class="painel" style="padding:26px 34px;gap:10px;flex-direction:row;align-items:center;justify-content:space-between">
          <div><p style="font-size:30px;font-weight:800">${carro}</p><p style="font-size:24px;color:var(--muted)">${km.toLocaleString("pt-BR")} km em ${idade} anos</p></div>
          <div style="text-align:right"><p class="mono" style="font-size:42px;font-weight:800;color:${cor}">${Math.round(km / idade).toLocaleString("pt-BR")} km/ano</p>
          <span class="pill" style="background:${cor}22;color:${cor}">${rot}</span></div>
        </div>`
      return shell(
        "Dica",
        `<h1 style="font-size:90px">O ODÔMETRO<br><em>ENTREGA</em> O PASSADO.</h1>
        ${linha("Fiat Argo 2021", 45000, 5, "PARTICULAR", "#22c55e")}
        ${linha("Hyundai HB20 2020", 132000, 6, "POSSÍVEL FROTA", "#f59e0b")}
        ${linha("Chevrolet Onix 2022", 160000, 4, "APLICATIVO", "#ef4444")}
        <p class="sub"><b>KM ÷ idade do carro.</b> Acima de 25 mil km/ano costuma ser frota ou app: mais desgaste, menos revenda.</p>`
      )
    }
  },

  "06": {
    nome: "post06-sinais-de-risco",
    html: () => {
      const item = (ic, t, d) => `<div style="display:flex;gap:26px;align-items:flex-start">
        <div style="font-size:52px;width:80px;height:80px;display:grid;place-items:center;background:var(--dark3);border:2px solid var(--line);border-radius:20px;flex:none">${ic}</div>
        <div><p style="font-size:34px;font-weight:800">${t}</p><p style="font-size:26px;color:var(--muted);line-height:1.35">${d}</p></div></div>`
      return shell(
        "Atenção",
        `<h1 style="font-size:100px">4 SINAIS DE <em>RISCO</em><br>NO ANÚNCIO.</h1>
        <div style="display:flex;flex-direction:column;gap:26px">
          ${item("🎥", "Lote sem vídeo", "Muitas vezes o carro não liga ou não anda.")}
          ${item("🔑", "Sem chave", "Chave codificada pode custar centenas de reais.")}
          ${item("📋", "Laudo com observações", "Remarcação, sinistro ou corrosão derrubam a revenda.")}
          ${item("🏦", "Recuperado de financiamento", "Costuma ter manutenção atrasada.")}
        </div>
        <p class="sub">O Leilômetro mostra esses alertas <b>no painel do lote</b>.</p>`
      )
    }
  },

  "07": {
    nome: "post07-ia-sem-chave",
    frames: 98,
    fps: 14,
    html: (t) => {
      const clique = t > 0.18 && t < 0.26
      const copiado = fase(t, 0.24, 0.32)
      const chat = fase(t, 0.38, 0.5)
      const resp = fase(t, 0.62, 0.72)
      const digitado = "Analise este lote de leilão: Onix 1.0 LT 2021, 68.000 km, FIPE R$ 62.000, lance R$ 32.000, comissão 5%, taxas R$ 1.650, sem vídeo…"
      const n = Math.floor(fase(t, 0.42, 0.6) * digitado.length)
      return shell(
        "IA sem chave",
        `<h1 style="font-size:96px">IA NO LEILÃO<br><em>SEM CONFIGURAR</em> NADA.</h1>
        <div style="display:flex;gap:22px;align-items:stretch;height:430px">
          <div class="painel" style="flex:0 0 380px;gap:14px;padding:28px">
            <p style="font-size:24px;color:var(--muted)">Painel do lote</p>
            <p style="font-size:28px;font-weight:800">Onix 2021</p>
            <p class="mono" style="font-size:26px">Lance ${BRL(EX.lance)}</p>
            <div style="margin-top:auto;padding:18px;border-radius:16px;text-align:center;font-weight:800;font-size:24px;
              background:${clique ? "var(--gold)" : "rgba(240,180,41,.14)"};color:${clique ? "var(--dark)" : "var(--gold)"};border:2px solid var(--gold);transform:scale(${clique ? 0.96 : 1})">
              🤖 Perguntar ao ChatGPT</div>
            <p style="font-size:22px;text-align:center;color:var(--green);opacity:${copiado}">✓ Pergunta copiada</p>
          </div>
          <div class="painel" style="flex:1;opacity:${chat};transform:translateY(${(1 - chat) * 30}px);padding:26px;gap:16px;min-width:0">
            <p style="font-size:22px;color:var(--muted)">Seu chat de IA · cole com Ctrl+V</p>
            <div style="align-self:flex-end;background:var(--dark4);border-radius:18px 18px 4px 18px;padding:16px 20px;font-size:21px;line-height:1.35">${digitado.slice(0, n)}${n < digitado.length ? "▌" : ""}</div>
            <div style="background:rgba(245,158,11,.12);border:2px solid rgba(245,158,11,.4);border-radius:18px 18px 18px 4px;padding:16px 20px;font-size:22px;line-height:1.4;opacity:${resp}">
              <b style="color:var(--amber)">CAUTELA.</b> Bom preço, mas <b>lote sem vídeo</b>: considere guincho e revisão. Teto sugerido <b>R$ 40.000</b>.</div>
          </div>
        </div>
        <p class="sub">Um clique copia a pergunta com os números do lote e abre o ChatGPT, o Gemini ou o Claude. <b>Sem criar chave de API.</b></p>`
      )
    }
  },

  "08": {
    nome: "post08-comparador",
    html: () => {
      const carros = [
        ["Onix 2021", 32000, 40750, 43380, "13.600", 75, "#84cc16"],
        ["HB20 2020", 36500, 45475, 40143, "22.000", 45, "#f59e0b"],
        ["Argo 2021", 41000, 50200, 45000, "9.000", 55, "#f59e0b"]
      ]
      const col = ([n, l, c, pl, km, s, cor], i) => `
        <div class="painel" style="flex:1;padding:26px;gap:12px;${i === 0 ? "border-color:var(--gold);box-shadow:0 0 0 4px rgba(240,180,41,.12)" : ""}">
          ${i === 0 ? '<span class="pill" style="align-self:flex-start;background:var(--gold);color:var(--dark);font-size:18px">MELHOR</span>' : '<span class="pill" style="align-self:flex-start;font-size:18px;opacity:0">-</span>'}
          <p style="font-size:30px;font-weight:800">${n}</p>
          <p style="font-size:20px;color:var(--muted)">Lance</p><p class="mono" style="font-size:28px;font-weight:700">${BRL(l)}</p>
          <p style="font-size:20px;color:var(--muted)">Custo real</p><p class="mono" style="font-size:28px;font-weight:700">${BRL(c)}</p>
          <p style="font-size:20px;color:var(--muted)">Lance máximo</p><p class="mono" style="font-size:28px;font-weight:700;color:var(--gold)">${BRL(pl)}</p>
          <p style="font-size:20px;color:var(--muted)">KM/ano</p><p class="mono" style="font-size:28px;font-weight:700">${km}</p>
          <p class="big" style="font-size:72px;color:${cor}">${s}</p>
        </div>`
      return shell(
        "Comparador",
        `<h1 style="font-size:88px">QUAL DOS TRÊS <em>VALE MAIS?</em></h1>
        <div style="display:flex;gap:20px">${carros.map(col).join("")}</div>
        <p class="sub">Salve os lotes e compare lado a lado. Dá para exportar em <b>CSV</b>.</p>`
      )
    }
  },

  "09": {
    nome: "post09-checklist-vistoria",
    html: () => {
      const itens = [
        "Leia o edital inteiro: taxas, prazo de retirada, débitos",
        "Confira chassi e motor com o documento",
        "Olhe colunas, longarinas e assoalho (sinal de batida)",
        "Procure ferrugem, solda e massa nas portas",
        "Veja o nível e a cor do óleo e da água",
        "Pneus, estepe, macaco e chave de roda",
        "Pergunte se o carro liga e anda (veja o vídeo)",
        "Some guincho e transporte se o pátio for longe"
      ]
      return shell(
        "Salve este post",
        `<h1 style="font-size:100px">CHECKLIST DA<br><em>VISTORIA.</em></h1>
        <div class="painel" style="gap:16px;padding:30px 36px">
          ${itens.map((x) => `<div style="display:flex;gap:20px;align-items:center;font-size:29px;line-height:1.25"><span style="flex:none;width:38px;height:38px;border:3px solid var(--gold);border-radius:10px;display:grid;place-items:center;color:var(--gold);font-size:24px">✓</span>${x}</div>`).join("")}
        </div>
        <p class="sub">O assistente do Leilômetro monta um checklist <b>específico para cada lote</b>.</p>`
      )
    }
  },

  "10": {
    nome: "post10-bastidores-dev",
    html: () =>
      shell(
        "Bastidores",
        `<h1 style="font-size:86px">DA PLANILHA PARA UMA<br><em>EXTENSÃO</em> DO CHROME.</h1>
        <div class="painel" style="gap:12px">
          ${[
            ["JavaScript puro", "sem framework, sem build"],
            ["Manifest V3", "padrão atual do Chrome"],
            ["Cálculos com testes", "a fórmula do lance máximo é testada"],
            ["Privacidade", "os seus lotes ficam no seu navegador"],
            ["IA opcional", "ChatGPT, Gemini ou chave própria"]
          ]
            .map(([a, b]) => `<div class="linha"><b>${a}</b><span>${b}</span></div>`)
            .join('<div class="sep"></div>')}
        </div>
        <p class="sub">Projeto pessoal, grátis e aberto no GitHub. <b>Feedback é muito bem-vindo.</b></p>`,
        "github.com/paulpessoa"
      )
  },

  "11": {
    nome: "post11-calculadora-celular",
    html: () =>
      shell(
        "No celular",
        `<div style="display:flex;gap:56px;align-items:center;flex:1">
          <div style="flex:1;display:flex;flex-direction:column;gap:28px">
            <h1 style="font-size:100px">ESTÁ NO<br><em>CELULAR?</em></h1>
            <p class="sub">A extensão é para o computador. No celular, use a <b>calculadora grátis</b> no site: o mesmo cálculo, sem instalar nada.</p>
            <p style="font-size:30px;font-weight:800;color:var(--gold)">leilometro.com.br/calculadora</p>
          </div>
          <div style="flex:0 0 360px;height:660px;border:10px solid var(--dark4);border-radius:56px;background:var(--dark2);padding:44px 26px;display:flex;flex-direction:column;gap:16px">
            ${[["FIPE", "62.000"], ["Lance", "32.000"], ["Comissão", "5%"], ["Taxas do pátio", "1.650"], ["Custos pós", "5.500"], ["Margem", "15%"]]
              .map(([a, b]) => `<div style="display:flex;justify-content:space-between;font-size:22px;background:var(--dark3);padding:12px 16px;border-radius:12px"><span style="color:var(--muted)">${a}</span><b class="mono">${b}</b></div>`)
              .join("")}
            <div style="margin-top:auto;text-align:center"><p style="font-size:20px;color:var(--muted)">Lance máximo</p><p class="big" style="font-size:72px">${BRL(EX.limite)}</p></div>
          </div>
        </div>`
      )
  },

  "12": {
    nome: "post12-enquete-leiloeiras",
    html: () =>
      shell(
        "Enquete",
        `<h1 style="font-size:104px">QUAL LEILOEIRA<br><em>VEM AGORA?</em></h1>
        <p class="sub">Hoje o Leilômetro funciona no <b>leilo.com.br</b>, com modo beta para outros sites. Vote nos comentários:</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          ${[["A", "Copart"], ["B", "VIP Leilões"], ["C", "Sodré Santoro"], ["D", "Outra (qual?)"]]
            .map(([l, n]) => `<div class="painel" style="flex-direction:row;align-items:center;gap:22px;padding:28px"><span class="big" style="font-size:72px">${l}</span><span style="font-size:36px;font-weight:800">${n}</span></div>`)
            .join("")}
        </div>`
      )
  }
}

// ─── RENDERIZAÇÃO ────────────────────────────────────────────────────────────
const temFfmpeg = (() => {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
})()

async function main() {
  const filtro = process.argv[2]
  mkdirSync(SAIDA, { recursive: true })
  const { chromium } = carregarPlaywright()
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } })

  for (const [id, post] of Object.entries(POSTS)) {
    if (filtro && filtro !== id) continue
    // Capa estática (para animados, o último quadro)
    await page.setContent(post.html(1), { waitUntil: "load" })
    await page.evaluate(() => document.fonts.ready)
    await page.screenshot({ path: join(SAIDA, `${post.nome}.png`) })
    console.log("✓", `${post.nome}.png`)

    if (!post.frames || !temFfmpeg) continue
    const dir = join(SAIDA, `.frames-${id}`)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir)
    for (let i = 0; i < post.frames; i++) {
      await page.setContent(post.html(i / (post.frames - 1)), { waitUntil: "load" })
      await page.screenshot({ path: join(dir, `f${String(i).padStart(3, "0")}.png`) })
    }
    // Segura o último quadro por 2,5 s para dar tempo de ler
    const hold = `tpad=stop_mode=clone:stop_duration=2.5`
    const entrada = ["-y", "-loglevel", "error", "-framerate", String(post.fps), "-i", join(dir, "f%03d.png")]
    execFileSync("ffmpeg", [...entrada, "-vf", `${hold},format=yuv420p`, "-c:v", "libx264", "-crf", "20", "-movflags", "+faststart", join(SAIDA, `${post.nome}.mp4`)])
    execFileSync("ffmpeg", [
      ...entrada,
      "-vf",
      `${hold},scale=720:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4`,
      join(SAIDA, `${post.nome}.gif`)
    ])
    rmSync(dir, { recursive: true, force: true })
    console.log("✓", `${post.nome}.mp4 + .gif`)
  }
  await browser.close()
  if (!temFfmpeg) console.log("ffmpeg não encontrado: GIF/MP4 não foram gerados.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
