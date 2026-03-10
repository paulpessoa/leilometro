/**
 * Leilômetro — Content Script
 * Injeta painel de análise de oportunidade em sites de leilão de veículos
 * Manifest V3 | Versão 3.0.0
 *
 * Base: seu código original (estrutura, scraping, cálculo, UI, observer)
 * + v3: CRUD localStorage por lote, anotações, botão imprimir, badge salvo,
 *       comissão lida da página automaticamente (Leilo)
 */

;(function () {
  "use strict"

  // ─── CRUD LOCAL POR LOTE ───────────────────────────────────────────────────
  const STORAGE_PREFIX = "lm_lote_"
  const MAX_LOTES = 50

  function getLoteId() {
    const url = window.location.href
    const patterns = [
      /\/lotes?\/(\d+)/i,
      /\/lots?\/(\d+)/i,
      /\/item\/(\d+)/i,
      /\/veiculo\/(\d+)/i,
      /[?&]id=(\d+)/i,
      /[?&]lote=(\d+)/i,
      /\/(\d{5,12})(?:[/?#]|$)/
    ]
    for (const p of patterns) {
      const m = url.match(p)
      if (m) return `${window.location.hostname}_${m[1]}`
    }
    const base = url.split("?")[0].split("#")[0]
    return `${window.location.hostname}_${btoa(base)
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 20)}`
  }

  function loadLote(id) {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_PREFIX + id))
    } catch {
      return null
    }
  }

  function saveLote(id, data) {
    try {
      const keys = Object.keys(localStorage).filter((k) =>
        k.startsWith(STORAGE_PREFIX)
      )
      if (keys.length >= MAX_LOTES) {
        const oldest = keys.sort((a, b) => {
          const g = (k) => {
            try {
              return JSON.parse(localStorage.getItem(k))?.savedAt || 0
            } catch {
              return 0
            }
          }
          return g(a) - g(b)
        })[0]
        localStorage.removeItem(oldest)
      }
      localStorage.setItem(
        STORAGE_PREFIX + id,
        JSON.stringify({
          ...data,
          savedAt: Date.now(),
          url: window.location.href
        })
      )
    } catch {}
  }

  function deleteLote(id) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + id)
    } catch {}
  }

  const tsStr = (ts) =>
    ts
      ? new Date(ts).toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short"
        })
      : ""

  // ─── CONFIGURAÇÕES PADRÃO (seus nomes de campo) ────────────────────────────
  const CONFIG_DEFAULTS = {
    margemRevenda: 0.15,
    comissaoLeiloeiro: 0.05,
    taxaPatio: 350,
    custoDocumentacao: 800,
    custoIPVA: 1200,
    custoConserto: 2500,
    incrementoLance: 200,
    fipeMock: 45000
  }

  let CONFIG = { ...CONFIG_DEFAULTS }

  // Carrega configurações salvas — depois init()
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.sync.get(CONFIG_DEFAULTS, (saved) => {
      CONFIG = { ...CONFIG_DEFAULTS, ...saved }
      init()
    })
  } else {
    init()
  }

  // ─── SELETORES POR SITE (seu código preservado) ────────────────────────────
  const SITE_SELECTORS = {
    "leilo.com.br": {
      lance: [
        '[class*="lance"] [class*="valor"]',
        '[class*="bid"] [class*="amount"]',
        ".current-bid",
        ".valor-atual"
      ],
      ano: [".campo-ano", 'p:contains("/")', 'span:contains("Ano") + p'],
      km: ['p.text-categoria:contains("km")', ".campo-km"],
      combustivel: [".campo-combustivel"],
      modelo: ["h1", ".titulo-lote", ".text-h5.text-weight-bold"],
      fipe: [
        'span.label-categoria:contains("Valor Mercado") + p',
        'p:contains("R$")'
      ],
      custos: {
        comissao: 'span:contains("Comissão")',
        deposito: 'span:contains("Depósito de Bens")',
        remocao: 'span:contains("Remoção")',
        vistoria: 'span:contains("Vistoria")'
      }
    },
    "vipleiloes.com.br": {
      lance: [".valor-lance", ".lance-atual", '[class*="current"]', ".price"],
      ano: [".ano-veiculo", '[data-field="ano"]', "td.ano"],
      km: [".km-veiculo", '[data-field="km"]', ".odometer"],
      combustivel: [".combustivel", '[data-field="combustivel"]'],
      modelo: ["h1.title", ".vehicle-name", ".lote-titulo"]
    },
    "copart.com.br": {
      lance: [
        ".bid-amount",
        "#current-bid",
        ".current-price",
        '[class*="CurrentBid"]'
      ],
      ano: ['[data-uname="lotsearchVehicleYear"]', ".year", ".veh-year"],
      km: [
        '[data-uname="lotsearchOdometerReading"]',
        ".odometer-reading",
        ".mileage"
      ],
      combustivel: ['[data-uname="lotsearchFuelType"]', ".fuel-type"],
      modelo: ['[data-uname="lotsearchLotNumberSection"]', ".lot-title", "h1"],
      milesMode: true
    },
    "copart.com": {
      lance: [
        '[data-uname="bidNowAmount"]',
        ".bid-amount",
        "#current-bid",
        '[class*="CurrentBid"]'
      ],
      ano: ['[data-uname="lotsearchVehicleYear"]', ".year"],
      km: ['[data-uname="lotsearchOdometerReading"]', ".odometer-reading"],
      combustivel: ['[data-uname="lotsearchFuelType"]', ".fuel-type"],
      modelo: ['[data-uname="lotsearchLotNumberSection"]', "h1"],
      milesMode: true
    },
    "guariglialeiloes.com.br": {
      lance: [".lance-atual", ".bid-value", ".valor-corrente"],
      ano: [".campo-ano", '[class*="ano"]'],
      km: [".campo-km", '[class*="quilometragem"]'],
      combustivel: [".campo-combustivel"],
      modelo: ["h1", ".titulo-lote"]
    },
    "freitasleiloeiro.com.br": {
      lance: [".current-bid", ".valor-lance", ".lance-corrente"],
      ano: [".ano", '[data-label="Ano"]'],
      km: [".km", '[data-label="KM"]', ".quilometragem"],
      combustivel: [".combustivel", '[data-label="Combustível"]'],
      modelo: ["h1", ".lot-description"]
    },
    "sodresantoro.com.br": {
      lance: [
        '[class*="lance"][class*="valor"]',
        '[class*="bid"][class*="amount"]'
      ],
      ano: ['[class*="ano"]'],
      km: ['[class*="km"]'],
      combustivel: ['[class*="combustivel"]'],
      modelo: ["h1"]
    },
    "lance-livre.com.br": {
      lance: [
        '[class*="lance"][class*="valor"]',
        '[class*="bid"][class*="amount"]'
      ],
      ano: ['[class*="ano"]'],
      km: ['[class*="km"]'],
      combustivel: ['[class*="combustivel"]'],
      modelo: ["h1"]
    },
    default: {
      lance: [
        '[class*="lance"][class*="valor"]',
        '[class*="bid"][class*="amount"]',
        '[class*="current"][class*="price"]',
        '[class*="atual"]'
      ],
      ano: ['[class*="ano"]', "[data-ano]", "[data-year]", '[class*="year"]'],
      km: [
        '[class*=" km"]',
        '[class*="odometro"]',
        '[class*="mileage"]',
        '[class*="quilometr"]'
      ],
      combustivel: [
        '[class*="combustivel"]',
        '[class*="fuel"]',
        '[class*="combust"]'
      ],
      modelo: ["h1", '[class*="titulo"]', '[class*="title"]', '[class*="nome"]']
    }
  }

  // ─── UTILITÁRIOS DE SCRAPING (seu código preservado) ──────────────────────

  function getSiteKey() {
    const host = window.location.hostname
    return (
      Object.keys(SITE_SELECTORS).find((k) => host.includes(k)) || "default"
    )
  }

  function trySelectors(selectorList) {
    if (!selectorList) return null
    for (const sel of selectorList) {
      try {
        if (sel.includes(":contains(")) {
          const match = sel.match(/(.*):contains\("(.*)"\)(.*)/)
          if (match) {
            const [_, tag, text, suffix] = match
            const elements = document.querySelectorAll(tag || "*")
            for (const el of elements) {
              if (el.textContent.includes(text)) {
                if (suffix && suffix.includes("+")) {
                  const next = el.nextElementSibling
                  if (next) return next.textContent.trim()
                }
                return el.textContent.trim()
              }
            }
          }
          continue
        }
        const el = document.querySelector(sel)
        if (el && el.textContent.trim()) return el.textContent.trim()
      } catch (_) {}
    }
    return null
  }

  function extractNumber(str) {
    if (!str) return null
    const cleaned = str
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
    const n = parseFloat(cleaned)
    return isNaN(n) ? null : n
  }

  function extractYear(str) {
    if (!str) return null
    const match = str.match(/\b(19[5-9]\d|20[0-2]\d)\b/)
    return match ? parseInt(match[1]) : null
  }

  function extractKM(str, milesMode = false) {
    if (!str) return null
    const match = str.replace(/\./g, "").match(/(\d{4,7})/)
    if (!match) return null
    return milesMode
      ? Math.round(parseInt(match[1]) * 1.609)
      : parseInt(match[1])
  }

  function extractPct(str) {
    if (!str) return null
    const m = str.match(/([\d,]+)\s*%/)
    return m ? parseFloat(m[1].replace(",", ".")) / 100 : null
  }

  function scrapePageData() {
    const selectors = SITE_SELECTORS[getSiteKey()]
    const anoAtual = new Date().getFullYear()
    const milesMode = selectors.milesMode || false

    const lanceRaw = trySelectors(selectors.lance)
    const anoRaw = trySelectors(selectors.ano)
    const kmRaw = trySelectors(selectors.km)
    const combustRaw = trySelectors(selectors.combustivel)
    const modeloRaw = trySelectors(selectors.modelo)
    const fipeRaw = selectors.fipe ? trySelectors(selectors.fipe) : null

    let lance = extractNumber(lanceRaw)
    let ano = extractYear(anoRaw) || extractYear(document.body.innerText)
    let km = extractKM(kmRaw, milesMode)
    let fipeScraped = extractNumber(fipeRaw)

    // Comissão lida da página (Leilo varia 4–5%)
    let comissaoAuto = false
    let comissaoPage = null
    if (selectors.custos?.comissao) {
      comissaoPage = extractPct(trySelectors([selectors.custos.comissao]))
      if (comissaoPage) comissaoAuto = true
    }

    // Taxas extras da Leilo (depósito, remoção, vistoria)
    const depositoBens = selectors.custos?.deposito
      ? extractNumber(trySelectors([selectors.custos.deposito]))
      : null
    const taxaRemocao = selectors.custos?.remocao
      ? extractNumber(trySelectors([selectors.custos.remocao]))
      : null
    const taxaVistoria = selectors.custos?.vistoria
      ? extractNumber(trySelectors([selectors.custos.vistoria]))
      : null

    if (!km) {
      const kmMatch = document.body.innerText.match(/([\d.]+)\s*km/i)
      if (kmMatch) km = extractKM(kmMatch[1], milesMode)
    }

    const pageText = document.body.innerText.toLowerCase()
    let combustivel = "Não identificado"
    if (combustRaw) combustivel = combustRaw.trim()
    else if (pageText.includes("elétrico") || pageText.includes("eletrico"))
      combustivel = "⚡ Elétrico"
    else if (
      pageText.includes("kit gás") ||
      pageText.includes("kit gas") ||
      pageText.includes("gnv")
    )
      combustivel = "🟡 Flex + GNV"
    else if (pageText.includes("híbrido") || pageText.includes("hibrido"))
      combustivel = "🟢 Híbrido"
    else if (pageText.includes("gasolina")) combustivel = "⛽ Gasolina"
    else if (pageText.includes("diesel")) combustivel = "🔴 Diesel"
    else if (pageText.includes("flex")) combustivel = "✅ Flex"
    else if (
      pageText.includes("álcool") ||
      pageText.includes("alcool") ||
      pageText.includes("etanol")
    )
      combustivel = "🌿 Etanol"

    if (!lance) {
      const matches = pageText.match(/r\$\s*([\d.,]+)/gi)
      if (matches) {
        const valores = matches
          .map((m) => extractNumber(m))
          .filter((v) => v && v > 1000 && v < 500000)
        if (valores.length) lance = Math.min(...valores)
      }
    }

    const modelo = modeloRaw
      ? modeloRaw.replace(/\s+/g, " ").substring(0, 60)
      : "Veículo não identificado"
    const idadeVeiculo = ano ? Math.max(1, anoAtual - ano) : null
    const kmAno = km && idadeVeiculo ? Math.round(km / idadeVeiculo) : null
    const kmMes = kmAno ? Math.round(kmAno / 12) : null

    return {
      lance,
      ano,
      km,
      kmAno,
      kmMes,
      combustivel,
      modelo,
      idadeVeiculo,
      fipeScraped,
      comissaoAuto,
      comissaoPage,
      depositoBens,
      taxaRemocao,
      taxaVistoria,
      milesMode
    }
  }

  // ─── LÓGICA DE CÁLCULO (seu código, + comissão variável) ──────────────────

  function calcularOportunidade(dados, fipeOverride, margemOverride) {
    const { lance, fipeScraped } = dados
    const fipe = fipeOverride ?? fipeScraped ?? CONFIG.fipeMock
    const margem = margemOverride ?? CONFIG.margemRevenda

    // Comissão: lida da página > configuração
    const comissaoPct =
      dados.comissaoAuto && dados.comissaoPage
        ? dados.comissaoPage
        : CONFIG.comissaoLeiloeiro

    const comissao = lance ? lance * comissaoPct : 0

    // Taxa pátio: soma depósito+remoção+vistoria se detectados, senão usa config
    const extrasDetectados =
      (dados.depositoBens || 0) +
      (dados.taxaRemocao || 0) +
      (dados.taxaVistoria || 0)
    const taxaPatioEfetiva =
      extrasDetectados > 0 ? extrasDetectados : CONFIG.taxaPatio

    const custoReal = lance ? lance + comissao + taxaPatioEfetiva : 0

    const custosFixos =
      CONFIG.custoDocumentacao +
      CONFIG.custoIPVA +
      CONFIG.custoConserto +
      CONFIG.taxaPatio
    const margemReais = fipe * margem
    const precoLimite = fipe - margemReais - custosFixos

    const diferenca = precoLimite - (lance || 0)
    const lancesRestantes = Math.max(
      0,
      Math.floor(diferenca / CONFIG.incrementoLance)
    )

    const potencialLucro = lance
      ? fipe -
        custoReal -
        CONFIG.custoConserto -
        CONFIG.custoDocumentacao -
        CONFIG.custoIPVA
      : null

    const score = calcularScore(lance, precoLimite, dados.kmAno)

    return {
      comissao,
      comissaoPct,
      taxaPatioEfetiva,
      custoReal,
      precoLimite,
      lancesRestantes,
      potencialLucro,
      score,
      fipe
    }
  }

  function calcularScore(lance, precoLimite, kmAno) {
    if (!lance || !precoLimite) return null
    let score = 100
    const ratio = lance / precoLimite
    if (ratio < 0.7) score = 95
    else if (ratio < 0.85) score = 75
    else if (ratio < 0.95) score = 55
    else if (ratio < 1.0) score = 35
    else score = 10

    if (kmAno) {
      if (kmAno > 30000) score -= 20
      else if (kmAno > 20000) score -= 10
    }
    return Math.max(0, Math.min(100, score))
  }

  // Sua função — mantida exatamente como escreveu
  function classifyKmAno(kmAno) {
    if (!kmAno) return { label: "— Não calculado", color: "#888", emoji: "❓" }
    if (kmAno < 10000)
      return {
        label: `${kmAno.toLocaleString("pt-BR")} km/ano — Uso Particular`,
        color: "#22c55e",
        emoji: "🟢"
      }
    if (kmAno < 15000)
      return {
        label: `${kmAno.toLocaleString("pt-BR")} km/ano — Uso Normal`,
        color: "#86efac",
        emoji: "🟢"
      }
    if (kmAno < 25000)
      return {
        label: `${kmAno.toLocaleString("pt-BR")} km/ano — Possível Frota`,
        color: "#f59e0b",
        emoji: "🟡"
      }
    if (kmAno < 35000)
      return {
        label: `${kmAno.toLocaleString("pt-BR")} km/ano — Uso Intenso`,
        color: "#f97316",
        emoji: "🟠"
      }
    return {
      label: `${kmAno.toLocaleString("pt-BR")} km/ano — Uso Extremo/App`,
      color: "#ef4444",
      emoji: "🔴"
    }
  }

  function getScoreLabel(score) {
    if (score === null) return { label: "—", color: "#888" }
    if (score >= 80) return { label: "EXCELENTE", color: "#22c55e" }
    if (score >= 60) return { label: "BOA", color: "#84cc16" }
    if (score >= 40) return { label: "REGULAR", color: "#f59e0b" }
    if (score >= 20) return { label: "ARRISCADA", color: "#f97316" }
    return { label: "EVITAR", color: "#ef4444" }
  }

  // ─── FORMATAÇÃO ────────────────────────────────────────────────────────────
  const BRL = (v) =>
    v != null
      ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "—"
  const NUM = (v) => (v != null ? v.toLocaleString("pt-BR") : "—")

  // ─── CRIAÇÃO DO PAINEL UI (seu HTML base + novas seções) ──────────────────

  function createPanel(dados, calc, loteId, loteData) {
    const kmInfo = classifyKmAno(dados.kmAno)
    const scoreInfo = getScoreLabel(calc.score)
    const saved = !!loteData
    const notas = loteData?.notas ?? ""
    const fipePanel = loteData?.fipe ?? null // FIPE editada no painel para este lote
    const margemPanel = loteData?.marg ?? null // margem editada para este lote

    const lancesText = dados.lance
      ? calc.lancesRestantes > 0
        ? `${calc.lancesRestantes} lances`
        : "🚨 Limite atingido!"
      : "—"

    const scoreColor =
      calc.score !== null
        ? `conic-gradient(${scoreInfo.color} ${calc.score * 3.6}deg, #1e293b 0deg)`
        : "none"

    const panel = document.createElement("div")
    panel.id = "leilometro-panel"
    panel.setAttribute("data-version", "3.0")
    panel.setAttribute("data-lote-id", loteId)

    panel.innerHTML = `
      <div class="li-header">
        <div class="li-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span class="li-brand-name">Leilômetro</span>
          <span class="li-badge">BETA</span>
          ${saved ? '<span class="li-saved-badge">💾 salvo</span>' : ""}
        </div>
        <div class="li-controls">
          <button class="li-btn-print"   title="Imprimir análise">🖨️</button>
          <button class="li-btn-refresh" title="Atualizar dados">↻</button>
          <button class="li-btn-minimize" title="Minimizar">−</button>
          <button class="li-btn-close"   title="Fechar">×</button>
        </div>
      </div>

      <div class="li-body">
        <div class="li-vehicle-name">${dados.modelo}</div>
        <div class="li-lote-id">🔑 ${loteId.split("_").pop()}</div>

        <div class="li-score-row">
          <div class="li-score-ring" style="background: ${scoreColor}">
            <div class="li-score-inner">
              <span class="li-score-num">${calc.score ?? "—"}</span>
              <span class="li-score-label">SCORE</span>
            </div>
          </div>
          <div class="li-oport-badge" style="color:${scoreInfo.color}; border-color:${scoreInfo.color}20; background:${scoreInfo.color}12">
            OPORTUNIDADE <strong>${scoreInfo.label}</strong>
          </div>
        </div>

        <div class="li-divider"></div>

        <!-- VALORES -->
        <div class="li-section-title">💰 VALORES</div>
        <div class="li-grid">
          <div class="li-item">
            <span class="li-item-label">Lance Atual</span>
            <span class="li-item-value ${!dados.lance ? "li-not-found" : ""}">${BRL(dados.lance)}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">Comissão (${(calc.comissaoPct * 100).toFixed(0)}%) ${dados.comissaoAuto ? '<span class="li-auto-tag">auto</span>' : ""}</span>
            <span class="li-item-value li-warn">+ ${BRL(calc.comissao)}</span>
          </div>
          ${
            dados.depositoBens
              ? `
          <div class="li-item">
            <span class="li-item-label">Depósito Bens <span class="li-auto-tag">auto</span></span>
            <span class="li-item-value li-warn">+ ${BRL(dados.depositoBens)}</span>
          </div>`
              : ""
          }
          ${
            dados.taxaRemocao
              ? `
          <div class="li-item">
            <span class="li-item-label">Remoção <span class="li-auto-tag">auto</span></span>
            <span class="li-item-value li-warn">+ ${BRL(dados.taxaRemocao)}</span>
          </div>`
              : ""
          }
          ${
            dados.taxaVistoria
              ? `
          <div class="li-item">
            <span class="li-item-label">Vistoria <span class="li-auto-tag">auto</span></span>
            <span class="li-item-value li-warn">+ ${BRL(dados.taxaVistoria)}</span>
          </div>`
              : ""
          }
          ${
            !dados.depositoBens && CONFIG.taxaPatio
              ? `
          <div class="li-item">
            <span class="li-item-label">Taxa Pátio Est.</span>
            <span class="li-item-value li-warn">+ ${BRL(CONFIG.taxaPatio)}</span>
          </div>`
              : ""
          }
          <div class="li-item li-item-highlight li-item-full">
            <span class="li-item-label">Custo Real</span>
            <span class="li-item-value">${BRL(calc.custoReal)}</span>
          </div>
        </div>

        <div class="li-divider"></div>

        <!-- ANÁLISE FIPE -->
        <div class="li-section-title">📊 ANÁLISE FIPE</div>
        <div class="li-fipe-edit-box">
          <span class="li-item-label">FIPE Referência ${dados.fipeScraped ? '<span class="li-auto-tag">detectada</span>' : '<span class="li-hint-inline">— editável, salvo por lote</span>'}</span>
          <div class="li-fipe-row">
            <input id="lm-fipe-input" class="li-fipe-input" type="number"
              placeholder="${BRL(calc.fipe)}" value="${fipePanel ?? (calc.fipe || "")}"/>
            ${calc.fipe ? `<span class="li-fipe-preview ${dados.fipeScraped ? "li-auto-found" : ""}">${BRL(calc.fipe)}</span>` : ""}
          </div>
          <span class="li-hint">tabela.fipe.org.br</span>
        </div>
        <div class="li-margem-edit-box">
          <span class="li-item-label">Margem de Revenda <span class="li-hint-inline">— editável, salvo por lote</span></span>
          <div class="li-margem-row">
            <input id="lm-margem-input" class="li-fipe-input li-input-sm" type="number"
              min="1" max="60" value="${Math.round((margemPanel ?? CONFIG.margemRevenda) * 100)}"/>
            <span class="li-hint-inline">%</span>
          </div>
        </div>

        <div class="li-grid" style="margin-top: 8px">
          <div class="li-item">
            <span class="li-item-label">Preço Limite</span>
            <span class="li-item-value li-limit">${BRL(calc.precoLimite)}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">Potencial de Lucro</span>
            <span class="li-item-value ${calc.potencialLucro > 0 ? "li-profit" : "li-loss"}">${BRL(calc.potencialLucro)}</span>
          </div>
          <div class="li-item li-item-full">
            <span class="li-item-label">Margem até o limite</span>
            <div class="li-lances-badge ${calc.lancesRestantes === 0 ? "li-lances-danger" : ""}">
              ${lancesText}
              ${
                calc.lancesRestantes > 0 && dados.lance
                  ? `<span class="li-lances-sub">${BRL(calc.precoLimite - calc.custoReal + CONFIG.taxaPatio)} de margem</span>`
                  : ""
              }
            </div>
          </div>
        </div>

        <div class="li-divider"></div>

        <!-- DADOS DO VEÍCULO (seu HTML original) -->
        <div class="li-section-title">🚗 DADOS DO VEÍCULO</div>
        <div class="li-grid">
          <div class="li-item">
            <span class="li-item-label">Ano do Veículo</span>
            <span class="li-item-value">${dados.ano ?? "—"}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">KM Total ${dados.milesMode ? "(milhas→km)" : ""}</span>
            <span class="li-item-value">${dados.km ? `${NUM(dados.km)} km` : "—"}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">Média Anual</span>
            <span class="li-item-value">${dados.kmAno ? `${NUM(dados.kmAno)} km/ano` : "—"}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">Média Mensal</span>
            <span class="li-item-value">${dados.kmMes ? `${NUM(dados.kmMes)} km/mês` : "—"}</span>
          </div>
          <div class="li-item li-item-full">
            <span class="li-item-label">Classificação de Uso</span>
            <span class="li-km-badge" style="color:${kmInfo.color}; border-color:${kmInfo.color}40; background:${kmInfo.color}15">
              ${kmInfo.emoji} ${kmInfo.label}
            </span>
          </div>
        </div>

        <!-- Sua explicação de KM (preservada) -->
        <div class="li-km-explanation">
          💡 <strong>Como calculamos?</strong> Dividimos a KM total pela idade do veículo (${dados.idadeVeiculo || 1} anos). A média mensal é a anual dividida por 12. Isso ajuda a identificar se o carro era de frota, aplicativo ou uso particular.
        </div>

        <div class="li-divider"></div>

        <!-- CUSTOS ESTIMADOS (seu HTML original) -->
        <div class="li-section-title">🔧 CUSTOS ESTIMADOS</div>
        <div class="li-grid">
          <div class="li-item">
            <span class="li-item-label">Conserto estimado</span>
            <span class="li-item-value li-cost">${BRL(CONFIG.custoConserto)}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">Documentação</span>
            <span class="li-item-value li-cost">${BRL(CONFIG.custoDocumentacao)}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">IPVA atrasado est.</span>
            <span class="li-item-value li-cost">${BRL(CONFIG.custoIPVA)}</span>
          </div>
        </div>

        <div class="li-divider"></div>

        <!-- ANOTAÇÕES (novo v3) -->
        <div class="li-section-title">📝 ANOTAÇÕES DO LOTE</div>
        <div class="li-notas-box">
          <textarea id="lm-notas" class="li-textarea"
            placeholder="Ex: amassado para-choque, sem chave reserva, pneus novos, interior ok...">${notas}</textarea>
          <div class="li-notas-footer">
            <span class="li-hint" id="lm-save-status">${saved ? `Salvo ${tsStr(loteData?.savedAt)}` : "Não salvo ainda"}</span>
            <button class="li-save-btn" id="lm-btn-save">💾 Salvar</button>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="li-footer">
          <span class="li-scrape-note">
            ${!dados.lance ? "⚠️ Lance não detectado automaticamente — verifique os dados" : "✓ Dados capturados da página"}
          </span>
          <div class="li-footer-btns">
            <button class="li-btn-settings li-btn-print-footer">🖨️ Imprimir</button>
            <button class="li-btn-reset">🗑️ Reset</button>
            <button class="li-btn-settings">⚙️ Config</button>
          </div>
        </div>
      </div>
    `

    return panel
  }

  // ─── INJEÇÃO E ATUALIZAÇÃO ─────────────────────────────────────────────────

  function renderPanel() {
    const existing = document.getElementById("leilometro-panel")
    if (existing) existing.remove()

    const loteId = getLoteId()
    const loteData = loadLote(loteId)

    const dados = scrapePageData()

    // FIPE e margem: lote salvo > config
    const fipe = loteData?.fipe ?? dados.fipeScraped ?? CONFIG.fipeMock ?? null
    const marg = loteData?.marg ?? CONFIG.margemRevenda

    const calc = calcularOportunidade(dados, fipe, marg)
    const panel = createPanel(dados, calc, loteId, loteData)

    document.body.appendChild(panel)
    attachEventListeners(panel, dados, calc, loteId)

    console.log("[Leilômetro] Lote:", loteId, "| Saved:", !!loteData)
    console.log("[Leilômetro] Dados:", dados)
    console.log("[Leilômetro] Cálculo:", calc)
  }

  function attachEventListeners(panel, dados, calc, loteId) {
    const btnClose = panel.querySelector(".li-btn-close")
    const btnMinimize = panel.querySelector(".li-btn-minimize")
    const btnRefresh = panel.querySelector(".li-btn-refresh")
    const btnSettings = panel.querySelector(".li-btn-settings")
    const body = panel.querySelector(".li-body")

    btnClose?.addEventListener("click", () => panel.remove())
    btnRefresh?.addEventListener("click", () => renderPanel())

    let minimized = false
    btnMinimize?.addEventListener("click", () => {
      minimized = !minimized
      body.style.display = minimized ? "none" : "block"
      btnMinimize.textContent = minimized ? "+" : "−"
    })

    makeDraggable(panel)

    btnSettings?.addEventListener("click", () => {
      if (chrome?.runtime?.openOptionsPage) chrome.runtime.openOptionsPage()
      else alert("Abra o ícone da extensão na barra do Chrome para configurar.")
    })

    // ── Salvar por lote ──────────────────────────────────────────────────────
    function doSave(feedback = false) {
      const fipeVal = parseFloat(panel.querySelector("#lm-fipe-input")?.value)
      const margVal = parseFloat(panel.querySelector("#lm-margem-input")?.value)
      const notasVal = panel.querySelector("#lm-notas")?.value || ""

      saveLote(loteId, {
        fipe: isNaN(fipeVal) ? null : fipeVal,
        marg: isNaN(margVal) ? CONFIG.margemRevenda : margVal / 100,
        notas: notasVal
      })

      const st = panel.querySelector("#lm-save-status")
      if (st) st.textContent = `Salvo ${tsStr(Date.now())}`

      // Badge "salvo" no header
      const brand = panel.querySelector(".li-brand")
      if (brand && !brand.querySelector(".li-saved-badge")) {
        const b = document.createElement("span")
        b.className = "li-saved-badge"
        b.textContent = "💾 salvo"
        brand.appendChild(b)
      }

      if (feedback) {
        const btn = panel.querySelector("#lm-btn-save")
        if (btn) {
          btn.textContent = "✅ Salvo!"
          setTimeout(() => (btn.textContent = "💾 Salvar"), 1500)
        }
      }
    }

    // FIPE ou margem alterada → salva e recalcula
    panel.querySelector("#lm-fipe-input")?.addEventListener("change", () => {
      doSave()
      renderPanel()
    })
    panel.querySelector("#lm-margem-input")?.addEventListener("change", () => {
      doSave()
      renderPanel()
    })

    // Notas com debounce (800ms)
    let notasTimer
    panel.querySelector("#lm-notas")?.addEventListener("input", () => {
      clearTimeout(notasTimer)
      notasTimer = setTimeout(() => doSave(), 800)
    })

    panel
      .querySelector("#lm-btn-save")
      ?.addEventListener("click", () => doSave(true))

    // Reset lote
    panel.querySelector(".li-btn-reset")?.addEventListener("click", () => {
      if (
        confirm(
          `Limpar dados salvos para este lote?\nID: ${loteId.split("_").pop()}`
        )
      ) {
        deleteLote(loteId)
        renderPanel()
      }
    })

    // Imprimir
    const doPrint = () =>
      printAnalise(dados, calc, panel.querySelector("#lm-notas")?.value || "")
    panel.querySelector(".li-btn-print")?.addEventListener("click", doPrint)
    panel
      .querySelector(".li-btn-print-footer")
      ?.addEventListener("click", doPrint)
  }

  // ─── IMPRIMIR ──────────────────────────────────────────────────────────────
  function printAnalise(dados, calc, notas) {
    const si = getScoreLabel(calc.score)
    const ki = classifyKmAno(dados.kmAno)
    const now = new Date().toLocaleString("pt-BR")

    const win = window.open("", "_blank", "width=700,height=950")
    win.document
      .write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/>
<title>Leilômetro — Análise</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=DM+Mono:wght@400;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'DM Sans',sans-serif;color:#111;background:#fff;padding:36px;font-size:14px;line-height:1.5;}
h1{font-size:20px;font-weight:700;margin-bottom:2px;}
.sub{color:#777;font-size:12px;margin-bottom:20px;}
.score-row{display:flex;align-items:center;gap:14px;background:#f7f7f7;border-radius:10px;padding:14px 18px;margin-bottom:14px;}
.sn{font-family:'DM Mono',monospace;font-size:44px;font-weight:700;line-height:1;color:${si.color};}
.oport{font-size:11px;color:#888;}.oport strong{display:block;font-size:19px;font-weight:700;color:${si.color};}
.km-row{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:8px;background:${ki.color}12;border:1px solid ${ki.color}40;margin-bottom:8px;font-weight:600;font-size:13px;color:${ki.color};}
.km-exp{font-size:11px;color:#888;margin-bottom:20px;line-height:1.5;}
.sec{margin-bottom:20px;}.stitle{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;margin-bottom:8px;}
table{width:100%;border-collapse:collapse;}td{padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:13px;}td:last-child{text-align:right;font-family:'DM Mono',monospace;font-weight:600;}
.hl td{background:#fffde7;}.gold{color:#b8860b;}.green{color:#16a34a;}.red{color:#dc2626;}.amber{color:#d97706;}
.notas{background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:12px;font-size:13px;color:#333;white-space:pre-wrap;line-height:1.6;min-height:48px;}
.aviso{background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px;font-size:11px;color:#795548;margin-top:16px;line-height:1.6;}
.footer{margin-top:24px;padding-top:12px;border-top:1px solid #eee;font-size:10px;color:#bbb;display:flex;justify-content:space-between;}
@media print{body{padding:20px;}}
</style></head><body>
<h1>Leilômetro — Análise de Oportunidade</h1>
<div class="sub">${dados.modelo} · ${now} · ${window.location.hostname}</div>
<div class="score-row"><div class="sn">${calc.score ?? "—"}</div><div class="oport">OPORTUNIDADE<strong>${si.label}</strong></div></div>
<div class="km-row">${ki.emoji}&nbsp;${ki.label}</div>
<div class="km-exp">📐 ${NUM(dados.km)} km ÷ ${dados.idadeVeiculo ?? "?"} anos = ${NUM(dados.kmAno)} km/ano · Média mensal: ${NUM(dados.kmMes)} km/mês</div>
<div class="sec"><div class="stitle">Dados do Veículo</div>
<table>
  <tr><td>Modelo</td><td>${dados.modelo}</td></tr>
  <tr><td>Ano</td><td>${dados.ano ?? "—"}</td></tr>
  <tr><td>KM${dados.milesMode ? " (conv. milhas)" : ""}</td><td>${dados.km ? `${NUM(dados.km)} km` : "—"}</td></tr>
  <tr><td>Combustível</td><td>${dados.combustivel}</td></tr>
</table></div>
<div class="sec"><div class="stitle">Valores e Taxas</div>
<table>
  <tr><td>Lance atual</td><td>${BRL(dados.lance)}</td></tr>
  <tr><td>Comissão (${(calc.comissaoPct * 100).toFixed(0)}%)${dados.comissaoAuto ? " — lida da página" : " — estimada"}</td><td class="amber">+ ${BRL(calc.comissao)}</td></tr>
  ${dados.depositoBens ? `<tr><td>Depósito de Bens</td><td class="amber">+ ${BRL(dados.depositoBens)}</td></tr>` : ""}
  ${dados.taxaRemocao ? `<tr><td>Taxa de Remoção</td><td class="amber">+ ${BRL(dados.taxaRemocao)}</td></tr>` : ""}
  ${dados.taxaVistoria ? `<tr><td>Vistoria</td><td class="amber">+ ${BRL(dados.taxaVistoria)}</td></tr>` : ""}
  ${!dados.depositoBens && CONFIG.taxaPatio ? `<tr><td>Taxa de Pátio est.</td><td class="amber">+ ${BRL(CONFIG.taxaPatio)}</td></tr>` : ""}
  <tr class="hl"><td><strong>Custo Real</strong></td><td class="gold"><strong>${BRL(calc.custoReal)}</strong></td></tr>
</table></div>
<div class="sec"><div class="stitle">Análise FIPE</div>
<table>
  <tr><td>FIPE de referência</td><td>${BRL(calc.fipe)}</td></tr>
  <tr><td>Margem de revenda</td><td>${Math.round(CONFIG.margemRevenda * 100)}%</td></tr>
  <tr class="hl"><td><strong>Preço Limite</strong></td><td class="gold"><strong>${BRL(calc.precoLimite)}</strong></td></tr>
  <tr><td>Lances restantes</td><td class="${calc.lancesRestantes > 0 ? "green" : "red"}">${calc.lancesRestantes != null ? `${calc.lancesRestantes} lances` : "—"}</td></tr>
  <tr><td>Potencial de Lucro</td><td class="${calc.potencialLucro > 0 ? "green" : "red"}">${BRL(calc.potencialLucro)}</td></tr>
</table></div>
${notas ? `<div class="sec"><div class="stitle">Anotações do Avaliador</div><div class="notas">${notas}</div></div>` : ""}
<div class="sec"><div class="stitle">Custos Estimados (referência)</div>
<table>
  <tr><td>Conserto estimado</td><td class="red">${BRL(CONFIG.custoConserto)}</td></tr>
  <tr><td>Documentação</td><td class="red">${BRL(CONFIG.custoDocumentacao)}</td></tr>
  <tr><td>IPVA atrasado</td><td class="red">${BRL(CONFIG.custoIPVA)}</td></tr>
</table></div>
<div class="aviso">⚠️ Análise de apoio à decisão. Leia o edital completo e faça vistoria antes de arrematar. O Leilômetro não se responsabiliza por decisões de compra.</div>
<div class="footer"><span>Leilômetro v3.0 — ${window.location.href.slice(0, 60)}</span><span>${now}</span></div>
<script>window.onload=()=>window.print();<\/script></body></html>`)
    win.document.close()
  }

  // ─── OBSERVER: DETECTA ATUALIZAÇÕES DE LANCE (seu código preservado) ───────

  function observeLanceChanges() {
    const selectors = SITE_SELECTORS[getSiteKey()]
    const allSels = selectors.lance.join(", ")
    let target

    try {
      target = document.querySelector(allSels)
    } catch (_) {}
    if (!target) target = document.body

    let debounceTimer
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const panel = document.getElementById("leilometro-panel")
        if (panel) renderPanel()
      }, 800)
    })

    observer.observe(target, {
      subtree: true,
      childList: true,
      characterData: true
    })
  }

  // ─── ARRASTAR (seu código preservado) ─────────────────────────────────────

  function makeDraggable(el) {
    const header = el.querySelector(".li-header")
    let isDragging = false,
      startX,
      startY,
      origX,
      origY

    header.style.cursor = "grab"

    header.addEventListener("mousedown", (e) => {
      if (e.target.tagName === "BUTTON") return
      isDragging = true
      startX = e.clientX
      startY = e.clientY
      const rect = el.getBoundingClientRect()
      origX = rect.left
      origY = rect.top
      header.style.cursor = "grabbing"
      e.preventDefault()
    })

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return
      el.style.left = `${origX + e.clientX - startX}px`
      el.style.top = `${origY + e.clientY - startY}px`
      el.style.right = "auto"
      el.style.bottom = "auto"
    })

    document.addEventListener("mouseup", () => {
      isDragging = false
      header.style.cursor = "grab"
    })
  }

  // ─── INICIALIZAÇÃO (seu código preservado) ─────────────────────────────────

  function init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        setTimeout(renderPanel, 1500)
      )
    } else {
      setTimeout(renderPanel, 1500)
    }

    setTimeout(observeLanceChanges, 2000)

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        const panel = document.getElementById("leilometro-panel")
        if (panel) panel.remove()
        else renderPanel()
      }
    })
  }

  // Expõe classifyKmAno para uso externo (como você tinha no export)
  if (typeof window !== "undefined") window.classifyKmAno = classifyKmAno
})()
