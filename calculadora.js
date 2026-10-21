// Calculadora de lance máximo — mesmas regras de leilometro-extensao/lib/calc.js
;(function () {
  "use strict"

  const $ = (id) => document.getElementById(id)
  const campos = ["fipe", "lance", "ano", "km", "comissao", "taxas", "conserto", "doc", "ipva", "margem"]

  // "62.000" → 62000 · "5,5" → 5.5
  function numero(v) {
    const t = String(v || "").trim().replace(/[^\d.,-]/g, "")
    if (!t) return 0
    const normal = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(t) ? t.replace(/\./g, "") : t
    const n = parseFloat(normal)
    return isFinite(n) ? n : 0
  }

  const BRL = (v) => (v == null || !isFinite(v) ? "—" : "R$ " + Math.round(v).toLocaleString("pt-BR"))

  function ler() {
    const d = {}
    for (const c of campos) d[c] = numero($("c-" + c).value)
    return d
  }

  function classificarKm(kmAno) {
    if (!kmAno) return ["informe ano e KM", "var(--muted)"]
    const fmt = kmAno.toLocaleString("pt-BR")
    if (kmAno < 10000) return [`${fmt} · particular`, "var(--green)"]
    if (kmAno < 15000) return [`${fmt} · uso normal`, "var(--green)"]
    if (kmAno < 25000) return [`${fmt} · possível frota`, "var(--amber)"]
    if (kmAno < 35000) return [`${fmt} · uso intenso`, "#f97316"]
    return [`${fmt} · extremo/aplicativo`, "var(--red)"]
  }

  function calcular(d) {
    const com = d.comissao / 100
    const margem = d.margem / 100
    const pos = d.conserto + d.doc + d.ipva
    const custoLeilao = d.lance ? d.lance * (1 + com) + d.taxas : null
    const total = custoLeilao != null ? custoLeilao + pos : null
    const limite = d.fipe ? (d.fipe * (1 - margem) - d.taxas - pos) / (1 + com) : null
    const lucro = d.fipe && total != null ? d.fipe - total : null
    const idade = d.ano > 1950 ? Math.max(1, new Date().getFullYear() - d.ano) : null
    const kmAno = idade && d.km > 0 ? Math.round(d.km / idade) : null
    return { custoLeilao, total, limite, lucro, kmAno, pos }
  }

  function veredito(d, r) {
    if (!d.fipe || !d.lance || r.limite == null) return ["Preencha a FIPE e o lance para ver o veredito.", "var(--muted)"]
    if (r.limite <= 0) return ["Com esses custos não sobra margem em nenhum lance.", "var(--red)"]
    const ratio = d.lance / r.limite
    const folga = BRL(r.limite - d.lance)
    if (ratio < 0.85) return [`Boa oportunidade: ainda cabem ${folga} até o seu teto.`, "var(--green)"]
    if (ratio <= 1) return [`Atenção: faltam só ${folga} para o seu teto.`, "var(--amber)"]
    return [`Passou do teto em ${BRL(d.lance - r.limite)}. A sua margem já não fecha.`, "var(--red)"]
  }

  function resumoTexto(d, r) {
    return [
      `Veículo ${d.ano || "?"}, ${d.km ? d.km.toLocaleString("pt-BR") + " km" : "KM não informada"}`,
      `FIPE ${BRL(d.fipe)} · lance ${BRL(d.lance)} · comissão ${d.comissao}% · taxas ${BRL(d.taxas)}`,
      `Custos pós-arremate ${BRL(r.pos)} (conserto ${BRL(d.conserto)}, documentação ${BRL(d.doc)}, IPVA ${BRL(d.ipva)})`,
      `Custo real ${BRL(r.total)} · lance máximo para ${d.margem}% de margem: ${BRL(r.limite)}`
    ].join("\n")
  }

  let ultimo = null

  function atualizar() {
    const d = ler()
    const r = calcular(d)
    ultimo = { d, r }
    $("r-leilao").textContent = BRL(r.custoLeilao)
    $("r-total").textContent = BRL(r.total)
    $("r-acima").textContent = d.lance && r.total ? `+${Math.round((r.total / d.lance - 1) * 100)}%` : "—"
    $("r-limite").textContent = r.limite != null && r.limite > 0 ? BRL(Math.floor(r.limite)) : "—"
    const [txt, cor] = veredito(d, r)
    const v = $("r-veredito")
    v.textContent = txt
    v.style.color = cor
    v.style.background = "rgba(255,255,255,0.04)"
    v.style.border = `1px solid ${cor}`
    $("r-lucro").textContent = r.lucro != null ? BRL(r.lucro) : "—"
    $("r-lucro").style.color = r.lucro != null ? (r.lucro >= 0 ? "var(--green)" : "var(--red)") : ""
    const [km, corKm] = classificarKm(r.kmAno)
    $("r-km").textContent = km
    $("r-km").style.color = corKm
    const msg = `Fiz a conta no Leilômetro:\n${resumoTexto(d, r)}\nhttps://leilometro.com.br/calculadora`
    $("b-whats").href = "https://wa.me/?text=" + encodeURIComponent(msg)
  }

  function promptIa(d, r) {
    return `Você é um especialista em leilão de veículos no Brasil. Analise este lote e responda em português, de forma direta:
1) Vale a pena disputar? (comprar / cautela / evitar)
2) Principais riscos
3) Lance máximo que você recomendaria e por quê
4) O que checar na vistoria e no edital

Dados (use só estes números, não invente FIPE nem histórico):
${resumoTexto(d, r)}

Lembre que não há garantia de resultado e que devo ler o edital e vistoriar o veículo.`
  }

  async function perguntarIa() {
    if (!ultimo) atualizar()
    const texto = promptIa(ultimo.d, ultimo.r)
    let copiado = false
    try {
      await navigator.clipboard.writeText(texto)
      copiado = true
    } catch {}
    $("calc-toast").textContent = copiado
      ? "✓ Pergunta copiada. Se ela não aparecer no ChatGPT, cole com Ctrl+V (no celular: segure e toque em Colar)."
      : "Não deu para copiar automaticamente. Copie o texto que abrimos no ChatGPT."
    window.open("https://chatgpt.com/?q=" + encodeURIComponent(texto), "_blank", "noopener")
  }

  // Formata milhar ao sair do campo: 62000 → 62.000
  function formatar(e) {
    const id = e.target.id
    if (["c-comissao", "c-margem", "c-ano"].includes(id)) return
    const n = numero(e.target.value)
    if (n) e.target.value = Math.round(n).toLocaleString("pt-BR")
  }

  if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", () => {
    const form = $("calc-form")
    form.addEventListener("input", atualizar)
    form.addEventListener("submit", (e) => e.preventDefault())
    form.querySelectorAll("input").forEach((i) => i.addEventListener("blur", formatar))
    $("b-ia").addEventListener("click", perguntarIa)
    atualizar()
  })

  if (typeof module !== "undefined") module.exports = { numero, calcular }
})()
