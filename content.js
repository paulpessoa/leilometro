/**
 * LeilãoIntel — Content Script
 * Injeta painel de análise de oportunidade em sites de leilão de veículos
 * Manifest V3 | Versão 1.0.0
 */

;(function () {
  "use strict"

  // ─── CONFIGURAÇÕES PADRÃO ───────────────────────────────────────────────────
  const CONFIG_DEFAULTS = {
    margemRevenda: 0.15, // 15% margem de revenda
    comissaoLeiloeiro: 0.05, // 5% comissão
    taxaPatio: 350, // R$ estimado
    custoDocumentacao: 800, // DETRAN / transferência
    custoIPVA: 1200, // estimativa IPVA atrasado
    custoConserto: 2500, // estimativa conserto médio
    incrementoLance: 200, // R$ por incremento (ajustável)
    fipeMock: 45000 // FIPE mock (usuário informa no popup)
  }

  let CONFIG = { ...CONFIG_DEFAULTS }

  // Carrega configurações salvas
  if (typeof chrome !== "undefined" && chrome.storage) {
    chrome.storage.sync.get(CONFIG_DEFAULTS, (saved) => {
      CONFIG = { ...CONFIG_DEFAULTS, ...saved }
      init()
    })
  } else {
    init()
  }

  // ─── SELETORES POR SITE ────────────────────────────────────────────────────
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
      modelo: ['[data-uname="lotsearchLotNumberSection"]', ".lot-title", "h1"]
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
    // Fallback genérico
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
    for (const sel of selectorList) {
      try {
        // Suporte básico para :contains() via XPath ou iteração
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
        }

        const el = document.querySelector(sel)
        if (el && el.textContent.trim()) return el.textContent.trim()
      } catch (_) {}
    }
    return null
  }

  function extractNumber(str) {
    if (!str) return null
    // Remove R$, pontos de milhar, substitui vírgula decimal
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

  function extractKM(str) {
    if (!str) return null
    const match = str.replace(/\./g, "").match(/(\d{4,7})/)
    return match ? parseInt(match[1]) : null
  }

  function scrapePageData() {
    const selectors = SITE_SELECTORS[getSiteKey()]
    const anoAtual = new Date().getFullYear()

    // Tenta extrair dados da página
    const lanceRaw = trySelectors(selectors.lance)
    const anoRaw = trySelectors(selectors.ano)
    const kmRaw = trySelectors(selectors.km)
    const combustRaw = trySelectors(selectors.combustivel)
    const modeloRaw = trySelectors(selectors.modelo)
    const fipeRaw = selectors.fipe ? trySelectors(selectors.fipe) : null

    // Extração inteligente
    let lance = extractNumber(lanceRaw)
    let ano = extractYear(anoRaw) || extractYear(document.body.innerText)
    let km = extractKM(kmRaw)
    let fipeScraped = extractNumber(fipeRaw)

    // Se falhou o seletor de KM, tenta regex específica para "90.393 km"
    if (!km) {
      const kmMatch = document.body.innerText.match(/([\d.]+)\s*km/i)
      if (kmMatch) km = extractKM(kmMatch[1])
    }

    // Detecção de combustível no texto completo
    const pageText = document.body.innerText.toLowerCase()
    let combustivel = "Não identificado"
    if (combustRaw) combustivel = combustRaw.trim()
    // ... rest of fuel logic ...
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

    // Tentativa de extração de lance via regex no body inteiro
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
      fipeScraped
    }
  }

  // ─── LÓGICA DE CÁLCULO ─────────────────────────────────────────────────────

  function calcularOportunidade(dados) {
    const { lance, fipeScraped } = dados
    // Prioriza o FIPE capturado da página sobre o mock das configurações
    const fipe = fipeScraped || CONFIG.fipeMock

    const comissao = lance ? lance * CONFIG.comissaoLeiloeiro : 0
    const custoReal = lance ? lance + comissao + CONFIG.taxaPatio : 0

    const custosFixos =
      CONFIG.custoDocumentacao +
      CONFIG.custoIPVA +
      CONFIG.custoConserto +
      CONFIG.taxaPatio
    const margemReais = fipe * CONFIG.margemRevenda
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

  // ─── CRIAÇÃO DO PAINEL UI ──────────────────────────────────────────────────

  function createPanel(dados, calc) {
    const kmInfo = classifyKmAno(dados.kmAno)
    const scoreInfo = getScoreLabel(calc.score)
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
    panel.id = "leilao-intel-panel"
    panel.setAttribute("data-version", "1.0")

    panel.innerHTML = `
      <div class="li-header">
        <div class="li-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span class="li-brand-name">LeilãoIntel</span>
          <span class="li-badge">BETA</span>
        </div>
        <div class="li-controls">
          <button class="li-btn-refresh" title="Atualizar dados">↻</button>
          <button class="li-btn-minimize" title="Minimizar">−</button>
          <button class="li-btn-close" title="Fechar">×</button>
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

        <div class="li-section-title">💰 VALORES</div>
        <div class="li-grid">
          <div class="li-item">
            <span class="li-item-label">Lance Atual</span>
            <span class="li-item-value ${!dados.lance ? "li-not-found" : ""}">${BRL(dados.lance)}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">+ Comissão (5%)</span>
            <span class="li-item-value li-warn">+ ${BRL(calc.comissao)}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">+ Taxa Pátio Est.</span>
            <span class="li-item-value li-warn">+ ${BRL(CONFIG.taxaPatio)}</span>
          </div>
          <div class="li-item li-item-highlight">
            <span class="li-item-label">Custo Real</span>
            <span class="li-item-value">${BRL(calc.custoReal)}</span>
          </div>
        </div>

        <div class="li-divider"></div>

        <div class="li-section-title">📊 ANÁLISE FIPE</div>
        <div class="li-grid">
          <div class="li-item">
            <span class="li-item-label">FIPE Referência ${dados.fipeScraped ? " (Auto)" : ""}</span>
            <span class="li-item-value ${dados.fipeScraped ? "li-auto-found" : ""}">${BRL(calc.fipe)}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">Preço Limite</span>
            <span class="li-item-value li-limit">${BRL(calc.precoLimite)}</span>
          </div>
          <div class="li-item li-item-full">
            <span class="li-item-label">Margem até o limite</span>
            <div class="li-lances-badge ${calc.lancesRestantes === 0 ? "li-lances-danger" : ""}">
              ${lancesText}
              ${calc.lancesRestantes > 0 && dados.lance ? `<span class="li-lances-sub">= ${BRL(calc.precoLimite - calc.custoReal + CONFIG.taxaPatio)} de margem</span>` : ""}
            </div>
          </div>
          <div class="li-item li-item-full">
            <span class="li-item-label">Potencial de Lucro</span>
            <span class="li-item-value ${calc.potencialLucro > 0 ? "li-profit" : "li-loss"}">${BRL(calc.potencialLucro)}</span>
          </div>
        </div>

        <div class="li-divider"></div>

        <div class="li-section-title">🚗 DADOS DO VEÍCULO</div>
        <div class="li-grid">
          <div class="li-item">
            <span class="li-item-label">Ano Fabricação</span>
            <span class="li-item-value">${dados.ano ?? "—"}</span>
          </div>
          <div class="li-item">
            <span class="li-item-label">KM Total</span>
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

        <div class="li-footer">
          <span class="li-scrape-note">
            ${!dados.lance ? "⚠️ Lance não detectado automaticamente — verifique os dados" : "✓ Dados capturados da página"}
          </span>
          <button class="li-btn-settings">⚙️ Configurações</button>
        </div>
      </div>
    `

    return panel
  }

  // ─── INJEÇÃO E ATUALIZAÇÃO ─────────────────────────────────────────────────

  function renderPanel() {
    const existing = document.getElementById("leilao-intel-panel")
    if (existing) existing.remove()

    const dados = scrapePageData()
    const calc = calcularOportunidade(dados)
    const panel = createPanel(dados, calc)

    document.body.appendChild(panel)
    attachEventListeners(panel)

    console.log("[LeilãoIntel] Dados capturados:", dados)
    console.log("[LeilãoIntel] Cálculo:", calc)
  }

  function attachEventListeners(panel) {
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

    // Arrastar painel
    makeDraggable(panel)

    // Botão configurações abre popup
    btnSettings?.addEventListener("click", () => {
      if (chrome?.runtime?.openOptionsPage) {
        chrome.runtime.openOptionsPage()
      } else {
        alert("Abra o ícone da extensão na barra do Chrome para configurar.")
      }
    })
  }

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
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      el.style.left = `${origX + dx}px`
      el.style.top = `${origY + dy}px`
      el.style.right = "auto"
      el.style.bottom = "auto"
    })

    document.addEventListener("mouseup", () => {
      isDragging = false
      header.style.cursor = "grab"
    })
  }

  // ─── OBSERVER: DETECTA ATUALIZAÇÕES DE LANCE ───────────────────────────────

  function observeLanceChanges() {
    const selectors = SITE_SELECTORS[getSiteKey()]
    const allSels = selectors.lance.join(", ")
    let target

    try {
      target = document.querySelector(allSels)
    } catch (_) {}

    if (!target) {
      // Observa body inteiro com debounce
      target = document.body
    }

    let debounceTimer
    const observer = new MutationObserver(() => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        const panel = document.getElementById("leilao-intel-panel")
        if (panel) {
          const dados = scrapePageData()
          const calc = calcularOportunidade(dados)
          updatePanelValues(panel, dados, calc)
        }
      }, 800)
    })

    observer.observe(target, {
      subtree: true,
      childList: true,
      characterData: true
    })
  }

  function updatePanelValues(panel, dados, calc) {
    // Atualiza valores sem re-renderizar todo o painel
    const scoreInfo = getScoreLabel(calc.score)
    const kmInfo = classifyKmAno(dados.kmAno)

    const update = (sel, val) => {
      const el = panel.querySelector(sel)
      if (el) el.textContent = val
    }

    // Score ring update
    const ring = panel.querySelector(".li-score-ring")
    if (ring && calc.score !== null) {
      ring.style.background = `conic-gradient(${scoreInfo.color} ${calc.score * 3.6}deg, #1e293b 0deg)`
    }

    panel.querySelectorAll(".li-item-value").forEach((el, i) => {
      // Re-render simples das métricas principais
    })

    // Força re-render completo ao detectar mudança de lance
    renderPanel()
  }

  // ─── INICIALIZAÇÃO ──────────────────────────────────────────────────────────

  function init() {
    // Aguarda página carregar completamente
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        setTimeout(renderPanel, 1500)
      )
    } else {
      setTimeout(renderPanel, 1500)
    }

    // Observa mudanças dinâmicas de lance
    setTimeout(observeLanceChanges, 2000)

    // Atalho de teclado: Ctrl+Shift+L
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "L") {
        const panel = document.getElementById("leilao-intel-panel")
        if (panel) panel.remove()
        else renderPanel()
      }
    })
  }
})()
