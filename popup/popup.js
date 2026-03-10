// LeilãoIntel — Popup Script
// Salva e carrega configurações via chrome.storage.sync

const FIELDS = [
  { id: 'fipeMock',           type: 'number', default: 45000  },
  { id: 'margemRevenda',      type: 'pct',    default: 0.15   },
  { id: 'comissaoLeiloeiro',  type: 'pct',    default: 0.05   },
  { id: 'incrementoLance',    type: 'number', default: 200    },
  { id: 'taxaPatio',          type: 'number', default: 350    },
  { id: 'custoDocumentacao',  type: 'number', default: 800    },
  { id: 'custoIPVA',          type: 'number', default: 1200   },
  { id: 'custoConserto',      type: 'number', default: 2500   },
];

// Carrega valores salvos
chrome.storage.sync.get(
  Object.fromEntries(FIELDS.map(f => [f.id, f.default])),
  (data) => {
    FIELDS.forEach(({ id, type }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const val = data[id];
      el.value = type === 'pct' ? Math.round(val * 100) : val;
    });
  }
);

// Salva ao clicar
document.getElementById('btnSave').addEventListener('click', () => {
  const toSave = {};
  FIELDS.forEach(({ id, type }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const raw = parseFloat(el.value);
    if (isNaN(raw)) return;
    toSave[id] = type === 'pct' ? raw / 100 : raw;
  });

  chrome.storage.sync.set(toSave, () => {
    const msg = document.getElementById('successMsg');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 2500);
  });
});
