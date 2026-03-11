// Leilômetro — Popup Script v3.3.0

const LOTS_INDEX_KEY = "lm_lots_index"

const FIELDS = [
  { id: 'fipeMock',          type: 'number', default: 45000 },
  { id: 'margemRevenda',     type: 'pct',    default: 0.15  },
  { id: 'comissaoLeiloeiro', type: 'pct',    default: 0.05  },
  { id: 'incrementoLance',   type: 'number', default: 200   },
  { id: 'taxaPatio',         type: 'number', default: 350   },
  { id: 'custoDocumentacao', type: 'number', default: 800   },
  { id: 'custoIPVA',         type: 'number', default: 1200  },
  { id: 'custoConserto',     type: 'number', default: 2500  },
]

// ─── CONFIGURAÇÕES ────────────────────────────────────────────────────────────
chrome.storage.sync.get(
  Object.fromEntries(FIELDS.map(f => [f.id, f.default])),
  data => {
    FIELDS.forEach(({ id, type }) => {
      const el = document.getElementById(id)
      if (!el) return
      el.value = type === 'pct' ? Math.round(data[id] * 100) : data[id]
    })
  }
)

document.getElementById('btnSave').addEventListener('click', () => {
  const toSave = {}
  FIELDS.forEach(({ id, type }) => {
    const el = document.getElementById(id)
    if (!el) return
    const raw = parseFloat(el.value)
    if (isNaN(raw)) return
    toSave[id] = type === 'pct' ? raw / 100 : raw
  })

  chrome.storage.sync.set(toSave, () => {
    const msg = document.getElementById('successMsg')
    msg.style.display = 'block'
    setTimeout(() => { msg.style.display = 'none'; window.close() }, 1500)
  })
})

// ─── LOTES SALVOS ─────────────────────────────────────────────────────────────
function tempoRelativo(ts) {
  const diff = Date.now() - ts
  const min  = Math.floor(diff / 60000)
  const h    = Math.floor(diff / 3600000)
  const d    = Math.floor(diff / 86400000)
  if (min < 1)  return 'agora'
  if (min < 60) return `${min}min atrás`
  if (h < 24)   return `${h}h atrás`
  if (d === 1)  return 'ontem'
  return `${d} dias atrás`
}

function renderLotes(index) {
  const container = document.getElementById('lotes-list')
  const empty     = document.getElementById('lotes-empty')
  const counter   = document.getElementById('lotes-counter')

  counter.textContent = index.length ? `${index.length} lote${index.length > 1 ? 's' : ''}` : ''

  if (!index.length) {
    empty.style.display = 'block'
    container.innerHTML = ''
    return
  }

  empty.style.display = 'none'
  container.innerHTML = index.map(item => {
    const modelo = item.modelo || 'Veículo'
    const host   = (() => { try { return new URL(item.url).hostname.replace('www.', '') } catch { return '' } })()
    const tempo  = tempoRelativo(item.savedAt)
    return `
      <div class="lot-item" data-url="${item.url}">
        <div class="lot-info">
          <span class="lot-modelo">${modelo}</span>
          <span class="lot-meta">${host} · ${tempo}</span>
        </div>
        <button class="lot-open" data-url="${item.url}" title="Abrir lote">→</button>
      </div>
    `
  }).join('')

  container.querySelectorAll('.lot-open').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      chrome.tabs.create({ url: btn.dataset.url })
    })
  })

  container.querySelectorAll('.lot-item').forEach(row => {
    row.addEventListener('click', () => chrome.tabs.create({ url: row.dataset.url }))
  })
}

chrome.storage.local.get([LOTS_INDEX_KEY], res => {
  renderLotes(res[LOTS_INDEX_KEY] || [])
})
