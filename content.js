/**
 * Leilômetro — Content Script v3.3.0
 * UI: v3.0 | Scraping: window.__INITIAL_STATE__ + DOM fallback
 */

;(function () {
  "use strict"

  // ─── CRUD LOCAL POR LOTE ───────────────────────────────────────────────────
  const STORAGE_PREFIX = "lm_lote_v3_"
  const LOTS_INDEX_KEY = "lm_lots_index"
  const MAX_LOTES = 50

  // ─── DETECÇÃO DE PÁGINA DE VEÍCULO ────────────────────────────────────────
  const VEHICLE_PAGE_PATTERNS = {
    "leilo.com.br":
      /\/leilao\/.+\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i,
    "vipleiloes.com.br": /\/lotes?\/\d+/i,
    "copart.com.br": /\/lot\/\d+/i,
    "copart.com": /\/lot\/\d+/i,
    "guariglialeiloes.com.br": /\/lotes?\/\d+/i,
    "freitasleiloeiro.com.br": /\/lotes?\/\d+/i,
    "sodresantoro.com.br": /\/lotes?\/\d+/i
  }

  function isVehiclePage() {
    const host = window.location.hostname
    const path = window.location.pathname
    for (const [domain, pattern] of Object.entries(VEHICLE_PAGE_PATTERNS)) {
      if (host.includes(domain) && pattern.test(path)) return true
    }
    return false
  }

  function getLoteId() {
    // UUID-aware: leilo.com.br usa UUIDs na URL
    const url = window.location.href
    const m =
      url.match(
        /\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
      ) ||
      url.match(/\/lotes?\/(\d+)/i) ||
      url.match(/\/lots?\/(\d+)/i) ||
      url.match(/[?&]id=([a-f0-9-]+)/i)
    if (m) return m[1]
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
      const payload = {
        ...data,
        savedAt: Date.now(),
        url: window.location.href
      }
      localStorage.setItem(STORAGE_PREFIX + id, JSON.stringify(payload))

      // Índice leve no chrome.storage.local para o popup conseguir listar sem scripting permission
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.get([LOTS_INDEX_KEY], (res) => {
          let index = res[LOTS_INDEX_KEY] || []
          index = index.filter((item) => item.id !== id)
          index.unshift({
            id,
            url: window.location.href,
            modelo: data.modelo || "",
            savedAt: payload.savedAt
          })
          if (index.length > MAX_LOTES) index = index.slice(0, MAX_LOTES)
          chrome.storage.local.set({ [LOTS_INDEX_KEY]: index })
        })
      }
    } catch {}
  }

  function deleteLote(id) {
    try {
      localStorage.removeItem(STORAGE_PREFIX + id)
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.get([LOTS_INDEX_KEY], (res) => {
          const index = (res[LOTS_INDEX_KEY] || []).filter(
            (item) => item.id !== id
          )
          chrome.storage.local.set({ [LOTS_INDEX_KEY]: index })
        })
      }
    } catch {}
  }

  const tsStr = (ts) =>
    ts
      ? new Date(ts).toLocaleString("pt-BR", {
          dateStyle: "short",
          timeStyle: "short"
        })
      : ""

  // ─── CONFIGURAÇÕES PADRÃO ──────────────────────────────────────────────────
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

  // ─── LOG DE DEPURAÇÃO ──────────────────────────────────────────────────────
  function debugLog(dados, calc, loteId) {
    console.group(
      "%c[Leilômetro] 🔍 DADOS CAPTURADOS",
      "color: #f0ba32; font-weight: bold; font-size: 12px;"
    )
    console.log("ID do Lote:", loteId)
    console.log("URL:", window.location.href)
    console.log("Fonte:", dados.fonte || "DOM")
    console.table({
      Modelo: dados.modelo,
      "Lance Atual": dados.lance,
      "FIPE Original": dados.fipeScraped,
      Ano: dados.ano,
      KM: dados.km,
      "KM/Ano": dados.kmAno,
      "KM/Mês": dados.kmMes,
      "Comissão (%)": dados.comissaoPage
        ? (dados.comissaoPage * 100).toFixed(1) + "%"
        : "via config",
      "Comissão Auto": dados.comissaoAuto,
      "Depósito Bens": dados.depositoBens,
      Remoção: dados.taxaRemocao,
      Vistoria: dados.taxaVistoria,
      Combustível: dados.combustivel
    })
    console.log(
      "%c[Leilômetro] 🧮 CÁLCULOS",
      "color: #22c55e; font-weight: bold;"
    )
    console.table({
      "Custo Real": calc.custoReal,
      "Preço Limite (Stop)": calc.precoLimite,
      "Lances Possíveis": calc.lancesRestantes,
      "Lucro Potencial": calc.potencialLucro,
      "FIPE Utilizada": calc.fipe,
      "Score Final": calc.score,
      "Comissão Val": calc.comissao,
      "Taxa Pátio Efetiva": calc.taxaPatioEfetiva
    })
    console.groupEnd()
  }

  // ─── DEBUG LEILO ───────────────────────────────────────────────────────────
  function debugScrapeLeilo() {
    if (!window.location.hostname.includes("leilo.com.br")) return

    console.group(
      "%c[Leilômetro] 🔬 SELETORES DOM — leilo.com.br",
      "color:#38bdf8; font-weight:bold; font-size:12px;"
    )
    console.log("URL:", window.location.href)

    function getByLabel(texto) {
      for (const el of document.querySelectorAll(".label-categoria")) {
        if (el.textContent.trim().toLowerCase() === texto.toLowerCase()) {
          const p1 = el.parentElement?.parentElement?.querySelector("a p")
          if (p1?.textContent?.trim()) return p1.textContent.trim()
          const p2 = el.parentElement?.querySelector("p.text-categoria")
          if (p2?.textContent?.trim()) return p2.textContent.trim()
        }
      }
      return null
    }

    function getBySpanPrefix(prefixo) {
      for (const s of document.querySelectorAll("span")) {
        if (s.textContent.trim().startsWith(prefixo)) {
          const valor = s
            .closest('[class*="col-xs-5"], [class*="col-md-3"]')
            ?.nextElementSibling?.querySelector("span")
          return {
            label: s.textContent.trim(),
            valor: valor?.textContent?.trim() || null
          }
        }
      }
      return { label: null, valor: null }
    }

    const comissaoSpan = getBySpanPrefix("Comissão")

    console.table({
      "Lance (h3.valor-lote span)":
        document.querySelector("h3.valor-lote span")?.textContent?.trim() ??
        "❌ não encontrado",
      "Modelo (h1.nome-veiculo)":
        document.querySelector("h1.nome-veiculo")?.textContent?.trim() ??
        "❌ não encontrado",
      "Ano (label-categoria)": getByLabel("Ano") ?? "❌ não encontrado",
      "KM (label-categoria)": getByLabel("Km") ?? "❌ não encontrado",
      "Valor Mercado (label-categoria)":
        getByLabel("Valor Mercado") ?? "❌ não encontrado",
      "Combustível (label-categoria)":
        getByLabel("Combustivel") ?? "❌ não encontrado",
      "Comissão label (span)": comissaoSpan.label ?? "❌ não encontrado",
      "Comissão valor (próximo irmão)":
        comissaoSpan.valor ?? "❌ não encontrado",
      "Depósito de Bens":
        getBySpanPrefix("Depósito de Bens").valor ?? "❌ não encontrado",
      Remoção: getBySpanPrefix("Remoção").valor ?? "❌ não encontrado",
      Vistoria: getBySpanPrefix("Vistoria").valor ?? "❌ não encontrado"
    })

    console.log(
      "window.__INITIAL_STATE__ presente:",
      !!Array.from(document.querySelectorAll("script")).find((x) =>
        x.textContent.includes("window.__INITIAL_STATE__")
      )
    )
    console.log(
      "window.__Q_META__ presente:",
      typeof window.__Q_META__ !== "undefined"
    )

    console.groupEnd()
  }

  // ─── SELETORES POR SITE ────────────────────────────────────────────────────
  const SITE_SELECTORS = {
    "leilo.com.br": {
      lance: [
        "h3.valor-lote span",
        ".valor-lote span",
        ".current-bid",
        ".valor-atual"
      ],
      ano: [".label-categoria"],
      km: [".label-categoria"],
      combustivel: [".label-categoria"],
      modelo: ["h1.nome-veiculo", "h1"],
      fipe: [".label-categoria"],
      custos: {
        comissao: 'span[class*="comissao"], span',
        deposito: "span",
        remocao: "span",
        vistoria: "span"
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

  // ─── UTILITÁRIOS DE SCRAPING ───────────────────────────────────────────────
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

  // ─── SCRAPING ──────────────────────────────────────────────────────────────
  function scrapePageData() {
    const anoAtual = new Date().getFullYear()

    // ── 1. Prioridade: window.__INITIAL_STATE__ (leilo.com.br) ──────────────
    try {
      const s = Array.from(document.querySelectorAll("script")).find((x) =>
        x.textContent.includes("window.__INITIAL_STATE__")
      )
      if (s) {
        const txt = s.textContent
        const j = JSON.parse(
          txt.substring(txt.indexOf("{"), txt.lastIndexOf("}") + 1)
        )
        const l = j?.LoteSelecionadoState
        if (l) {
          const lance = l.valor?.valorProposta || l.valor?.lance?.valor || 0
          const fipeScraped = l.veiculo?.valorMercado || 0
          const modelo = (l.veiculo?.modelo || "Veículo")
            .replace(/\s+/g, " ")
            .substring(0, 60)
          const comissaoPage = (l.valor?.comissaoPorcentagem || 5) / 100
          const depositoBens = l.valor?.depositoDeBens || null
          const taxaRemocao = l.valor?.remocao || null
          const taxaVistoria = l.valor?.vistoria || null
          const anoRaw = l.veiculo?.anoFabricacao || l.veiculo?.anoModelo
          const ano = anoRaw
            ? parseInt(String(anoRaw).match(/\d{4}/)?.[0])
            : null
          const km = l.veiculo?.quilometragem || l.veiculo?.km || 0
          const combustivel = l.veiculo?.combustivel || "Flex"
          const idadeVeiculo = ano ? Math.max(1, anoAtual - ano) : null
          const kmAno =
            km && idadeVeiculo ? Math.round(km / idadeVeiculo) : null
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
            comissaoAuto: true,
            comissaoPage,
            depositoBens,
            taxaRemocao,
            taxaVistoria,
            milesMode: false,
            fonte: "__INITIAL_STATE__"
          }
        }
      }
    } catch (e) {}

    // ── 2. Fallback: DOM scraping ────────────────────────────────────────────
    const selectors = SITE_SELECTORS[getSiteKey()]
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

    let comissaoAuto = false
    let comissaoPage = null
    if (selectors.custos?.comissao) {
      comissaoPage = extractPct(trySelectors([selectors.custos.comissao]))
      if (comissaoPage) comissaoAuto = true
    }

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
    else if (pageText.includes("kit gás") || pageText.includes("gnv"))
      combustivel = "🟡 Flex + GNV"
    else if (pageText.includes("híbrido") || pageText.includes("hibrido"))
      combustivel = "🟢 Híbrido"
    else if (pageText.includes("gasolina")) combustivel = "⛽ Gasolina"
    else if (pageText.includes("diesel")) combustivel = "🔴 Diesel"
    else if (pageText.includes("flex")) combustivel = "✅ Flex"
    else if (pageText.includes("álcool") || pageText.includes("etanol"))
      combustivel = "🌿 Etanol"

    if (!lance) {
      const matches = pageText.match(/r\$\s*[\d.,]+/gi)
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
      milesMode,
      fonte: "DOM"
    }
  }

  // ─── LÓGICA DE CÁLCULO ────────────────────────────────────────────────────
  function calcularOportunidade(
    dados,
    fipeOverride,
    margemOverride,
    incrementoOverride
  ) {
    const { lance, fipeScraped } = dados
    const fipe = fipeOverride ?? fipeScraped ?? CONFIG.fipeMock
    const margem = margemOverride ?? CONFIG.margemRevenda
    const incremento = incrementoOverride ?? CONFIG.incrementoLance

    const comissaoPct =
      dados.comissaoAuto && dados.comissaoPage
        ? dados.comissaoPage
        : CONFIG.comissaoLeiloeiro

    const comissao = lance ? lance * comissaoPct : 0

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
    const lancesRestantes = Math.max(0, Math.floor(diferenca / incremento))

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

  // ─── CRIAÇÃO DO PAINEL ─────────────────────────────────────────────────────
  function createPanel(dados, calc, loteId, loteData) {
    const kmInfo = classifyKmAno(dados.kmAno)
    const scoreInfo = getScoreLabel(calc.score)
    const saved = !!loteData
    const notas = loteData?.notas ?? ""
    const fipePanel = loteData?.fipe ?? null
    const margemPanel = loteData?.marg ?? null
    const incrementoPanel = loteData?.incremento ?? null

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
    panel.setAttribute("data-version", "3.3")
    panel.setAttribute("data-lote-id", loteId)

    panel.innerHTML = `
      <div class="li-header">
        <div class="li-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span class="li-brand-name">Leilômetro</span>
          <span class="li-badge">PRO</span>
          ${saved ? '<span class="li-saved-badge">salvo</span>' : ""}
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
          <span class="li-item-label">FIPE Referência ${dados.fipeScraped ? '<span class="li-auto-tag">detectada</span>' : '<span class="li-hint-inline">— editável</span>'}</span>
          <div class="li-fipe-row">
            <input id="lm-fipe-input" class="li-fipe-input" type="number"
              placeholder="${BRL(calc.fipe)}" value="${fipePanel ?? (calc.fipe || "")}"/>
            ${calc.fipe ? `<span class="li-fipe-preview ${dados.fipeScraped ? "li-auto-found" : ""}">${BRL(calc.fipe)}</span>` : ""}
          </div>
          <span class="li-hint">tabela.fipe.org.br</span>
        </div>
        <div class="li-margem-edit-box">
          <span class="li-item-label">Margem de Revenda <span class="li-hint-inline">— editável</span></span>
          <div class="li-margem-row">
            <input id="lm-margem-input" class="li-fipe-input li-input-sm" type="number"
              min="1" max="60" value="${Math.round((margemPanel ?? CONFIG.margemRevenda) * 100)}"/>
            <span class="li-hint-inline">%</span>
          </div>
        </div>
        <div class="li-margem-edit-box">
          <span class="li-item-label">Incremento por Lance <span class="li-hint-inline">— editável</span></span>
          <div class="li-margem-row">
            <input id="lm-incremento-input" class="li-fipe-input" type="number"
              min="50" step="50" placeholder="${CONFIG.incrementoLance}" value="${incrementoPanel ?? CONFIG.incrementoLance}"/>
          </div>
          <span class="li-hint">Usado para calcular lances restantes até o limite.</span>
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

        <!-- DADOS DO VEÍCULO -->
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

        <div class="li-km-explanation">
          💡 <strong>Como calculamos?</strong> Dividimos a KM total pela idade do veículo (${dados.idadeVeiculo || 1} anos). A média mensal é a anual dividida por 12. Isso ajuda a identificar se o carro era de frota, aplicativo ou uso particular.
        </div>

        <div class="li-divider"></div>

        <!-- CUSTOS ESTIMADOS -->
        <div class="li-section-title">🔧 CUSTOS ESTIMADOS</div>
        <div class="li-grid">
          <div class="li-item">
            <span class="li-item-label">Conserto</span>
            <span class="li-item-value li-cost">${BRL(CONFIG.custoConserto)}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">Documentação</span>
            <span class="li-item-value li-cost">${BRL(CONFIG.custoDocumentacao)}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">IPVA</span>
            <span class="li-item-value li-cost">${BRL(CONFIG.custoIPVA)}</span>
          </div>
        </div>

        <div class="li-divider"></div>

        <!-- ANOTAÇÕES -->
        <div class="li-section-title">📝 ANOTAÇÕES DO LOTE</div>
        <div class="li-notas-box">
          <textarea id="lm-notas" class="li-textarea"
            placeholder="Ex: amassado para-choque, sem chave reserva, pneus novos...">${notas}</textarea>
          <div class="li-notas-footer">
            <span class="li-hint" id="lm-save-status">${saved ? `Salvo ${tsStr(loteData?.savedAt)}` : "Não salvo ainda"}</span>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="li-footer">
          <span class="li-scrape-note">
            ${!dados.lance ? "⚠️ Lance não detectado" : `✓ ${dados.fonte || "DOM"}`}
          </span>
          <div class="li-footer-btns">
          <button class="li-btn-settings li-btn-print-footer">🖨️ Imprimir</button>
          <button class="li-btn-reset">🗑️ Reset</button>
            <button class="li-save-btn" id="lm-btn-save">💾 Salvar</button>
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
    const fipe = loteData?.fipe ?? dados.fipeScraped ?? CONFIG.fipeMock ?? null
    const marg = loteData?.marg ?? CONFIG.margemRevenda
    const incremento = loteData?.incremento ?? null
    const calc = calcularOportunidade(dados, fipe, marg, incremento)
    const panel = createPanel(dados, calc, loteId, loteData)

    document.body.appendChild(panel)
    attachEventListeners(panel, dados, calc, loteId)

    debugLog(dados, calc, loteId)
    debugScrapeLeilo()
  }

  // ─── EVENTOS ───────────────────────────────────────────────────────────────
  function attachEventListeners(panel, dados, calc, loteId) {
    const btnClose = panel.querySelector(".li-btn-close")
    const btnMinimize = panel.querySelector(".li-btn-minimize")
    const btnRefresh = panel.querySelector(".li-btn-refresh")
    const body = panel.querySelector(".li-body")

    btnClose?.addEventListener("click", () => panel.remove())
    btnRefresh?.addEventListener("click", () => renderPanel())

    let minimized = false
    btnMinimize?.addEventListener("click", () => {
      minimized = !minimized
      body.classList.toggle("li-collapsed", minimized)
      btnMinimize.textContent = minimized ? "+" : "−"
    })

    makeDraggable(panel)

    panel
      .querySelectorAll(".li-btn-settings:not(.li-btn-print-footer)")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          if (chrome?.runtime?.openOptionsPage) chrome.runtime.openOptionsPage()
        })
      })

    function doSave(feedback = false) {
      const fipeVal = parseFloat(panel.querySelector("#lm-fipe-input")?.value)
      const margVal = parseFloat(panel.querySelector("#lm-margem-input")?.value)
      const incrementoVal = parseFloat(
        panel.querySelector("#lm-incremento-input")?.value
      )
      const notasVal = panel.querySelector("#lm-notas")?.value || ""

      saveLote(loteId, {
        fipe: isNaN(fipeVal) ? null : fipeVal,
        marg: isNaN(margVal) ? CONFIG.margemRevenda : margVal / 100,
        incremento: isNaN(incrementoVal) ? null : incrementoVal,
        notas: notasVal,
        modelo: dados.modelo
      })

      const st = panel.querySelector("#lm-save-status")
      if (st) st.textContent = `Salvo ${tsStr(Date.now())}`

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

    panel.querySelector("#lm-fipe-input")?.addEventListener("change", () => {
      doSave()
      renderPanel()
    })
    panel.querySelector("#lm-margem-input")?.addEventListener("change", () => {
      doSave()
      renderPanel()
    })
    panel
      .querySelector("#lm-incremento-input")
      ?.addEventListener("change", () => {
        doSave()
        renderPanel()
      })

    let notasTimer
    panel.querySelector("#lm-notas")?.addEventListener("input", () => {
      clearTimeout(notasTimer)
      notasTimer = setTimeout(() => doSave(), 800)
    })

    panel
      .querySelector("#lm-btn-save")
      ?.addEventListener("click", () => doSave(true))

    panel.querySelector(".li-btn-reset")?.addEventListener("click", () => {
      if (
        confirm(
          `Limpar dados salvos para este lote?\nID: ${loteId.toString().split("_").pop()}`
        )
      ) {
        deleteLote(loteId)
        renderPanel()
      }
    })

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
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:system-ui,sans-serif;color:#111;background:#fff;padding:36px;font-size:14px;line-height:1.5;}
h1{font-size:20px;font-weight:700;margin-bottom:2px;}
.sub{color:#777;font-size:12px;margin-bottom:20px;}
.score-row{display:flex;align-items:center;gap:14px;background:#f7f7f7;border-radius:10px;padding:14px 18px;margin-bottom:14px;}
.sn{font-size:44px;font-weight:700;line-height:1;color:${si.color};}
.oport{font-size:11px;color:#888;}.oport strong{display:block;font-size:19px;font-weight:700;color:${si.color};}
.km-row{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:8px;background:${ki.color}12;border:1px solid ${ki.color}40;margin-bottom:8px;font-weight:600;font-size:13px;color:${ki.color};}
.km-exp{font-size:11px;color:#888;margin-bottom:20px;line-height:1.5;}
.sec{margin-bottom:20px;}.stitle{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#aaa;margin-bottom:8px;}
table{width:100%;border-collapse:collapse;}td{padding:7px 0;border-bottom:1px solid #f0f0f0;font-size:13px;}td:last-child{text-align:right;font-weight:600;}
.hl td{background:#fffde7;}.gold{color:#b8860b;}.green{color:#16a34a;}.red{color:#dc2626;}.amber{color:#d97706;}
.notas{background:#f9f9f9;border:1px solid #e5e5e5;border-radius:8px;padding:12px;font-size:13px;white-space:pre-wrap;line-height:1.6;min-height:48px;}
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
  <tr><td>Lances restantes</td><td class="${calc.lancesRestantes > 0 ? "green" : "red"}">${calc.lancesRestantes ?? "—"} lances</td></tr>
  <tr><td>Potencial de Lucro</td><td class="${calc.potencialLucro > 0 ? "green" : "red"}">${BRL(calc.potencialLucro)}</td></tr>
</table></div>
${notas ? `<div class="sec"><div class="stitle">Anotações do Avaliador</div><div class="notas">${notas}</div></div>` : ""}
<div class="sec"><div class="stitle">Custos Estimados (referência)</div>
<table>
  <tr><td>Conserto estimado</td><td class="red">${BRL(CONFIG.custoConserto)}</td></tr>
  <tr><td>Documentação</td><td class="red">${BRL(CONFIG.custoDocumentacao)}</td></tr>
  <tr><td>IPVA atrasado</td><td class="red">${BRL(CONFIG.custoIPVA)}</td></tr>
</table></div>
<div class="aviso">⚠️ Análise de apoio à decisão. Leia o edital completo e faça vistoria antes de arrematar.</div>
<div class="footer"><span>Leilômetro v3.3 — ${window.location.href.slice(0, 60)}</span><span>${now}</span></div>
<script>window.onload=()=>window.print();<\/script></body></html>`)
    win.document.close()
  }

  // ─── ARRASTAR ──────────────────────────────────────────────────────────────
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

  // ─── OBSERVER ──────────────────────────────────────────────────────────────
  function observeLanceChanges() {
    let debounceTimer
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (document.getElementById("leilometro-panel")) renderPanel()
      }, 800)
    })
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    })
  }

  // ─── INICIALIZAÇÃO ─────────────────────────────────────────────────────────
  function init() {
    // Só renderiza o painel em páginas de veículo
    if (!isVehiclePage()) return

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

  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.sync.get(CONFIG_DEFAULTS, (saved) => {
      CONFIG = { ...CONFIG_DEFAULTS, ...saved }
      init()
    })
  } else {
    init()
  }

  if (typeof window !== "undefined") window.classifyKmAno = classifyKmAno
})()
