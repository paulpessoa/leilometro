// Cursor
const cursor = document.getElementById("cursor")
const ring = document.getElementById("cursorRing")
let mx = 0
let my = 0
let rx = 0
let ry = 0

// Only initialize custom cursor on desktop with fine pointer and no reduced motion
const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

if (cursor && ring && isDesktop && !prefersReducedMotion) {
  document.addEventListener("mousemove", (e) => {
    mx = e.clientX
    my = e.clientY
    cursor.style.transform = `translate(${mx - 4}px,${my - 4}px)`
  })

  function animateRing() {
    if (prefersReducedMotion) return // Stop loop if user changes preference
    rx += (mx - rx) * 0.12
    ry += (my - ry) * 0.12
    ring.style.transform = `translate(${rx - 16}px,${ry - 16}px)`
    requestAnimationFrame(animateRing)
  }

  animateRing()

  document.querySelectorAll("a,button,[role='button']").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      ring.style.width = "48px"
      ring.style.height = "48px"
      ring.style.borderColor = "rgba(240,180,41,0.6)"
    })
    el.addEventListener("mouseleave", () => {
      ring.style.width = "32px"
      ring.style.height = "32px"
      ring.style.borderColor = "rgba(240,180,41,0.4)"
    })
  })
}

// Scroll reveal
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add("visible")
    })
  },
  { threshold: 0.1 }
)

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el))

// FAQ with Accessibility
document.querySelectorAll(".faq-q").forEach((q) => {
  const toggleFAQ = () => {
    const item = q.closest(".faq-item")
    const wasOpen = item.classList.contains("open")
    
    // Close others
    document.querySelectorAll(".faq-item").forEach((i) => {
      i.classList.remove("open")
      i.querySelector(".faq-q").setAttribute("aria-expanded", "false")
    })
    
    if (!wasOpen) {
      item.classList.add("open")
      q.setAttribute("aria-expanded", "true")
    }
  }

  q.addEventListener("click", toggleFAQ)
  q.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      toggleFAQ()
    }
  })
})

// Detecta se a extensão Leilômetro está instalada/ativa no navegador
;(function detectarLeilometro() {
  const heroInstall = document.querySelector('[data-cta="hero-install"]')
  if (!heroInstall) return

  if (
    typeof chrome === "undefined" ||
    !chrome.runtime ||
    !chrome.runtime.sendMessage
  ) {
    // Provavelmente não é Chrome ou não expõe a API
    return
  }

  // IDs da extensão
  const EXTENSION_IDS = [
    "oifmcimfbbbjenddghinhddmmihfolpi",
    "pkbgjcipepjnjifgmkciplabdmckddmj"
  ]

  let resolved = false

  function onDetected(version) {
    // Ajusta CTAs quando a extensão já está instalada
    const navInstall = document.querySelector('[data-cta="nav-install"]')
    const pricingFree = document.querySelector('[data-cta="pricing-free"]')
    const ctaFinal = document.querySelector('[data-cta="cta-final"]')
    const ctaFinalText = document.querySelector('[data-cta="cta-final-text"]')

    const URL_LEILO = "https://www.leilo.com.br/"

    // 1. Oculta o link de instalação no topo
    if (navInstall) {
      navInstall.style.display = "none"
    }

    // 2. Transforma o primeiro botão de instalar (Hero) em badge de status
    if (heroInstall) {
      heroInstall.textContent = `  ✓ Extensão Instalada - v${version}  `
      // Remove classes de botão e aplica estilo de badge de status
      heroInstall.className = "ext-status-pill ext-status-pill-ok"
      heroInstall.href = "javascript:void(0)"
      heroInstall.style.cursor = "default"
      heroInstall.style.textDecoration = "none"
      heroInstall.style.display = "inline-flex"
    }

    if (pricingFree) {
      pricingFree.textContent = "Usar plano grátis agora"
      pricingFree.addEventListener("click", (e) => {
        e.preventDefault()
        window.open(URL_LEILO, "_blank")
      })
    }

    // 3. Altera o último botão para "Começar a usar" com target _blank
    if (ctaFinal) {
      ctaFinal.textContent = "Começar a usar leilo.com.br"
      ctaFinal.href = URL_LEILO
      ctaFinal.target = "_blank"
    }

    if (ctaFinalText) {
      ctaFinalText.innerHTML =
        "Extensão já instalada neste navegador.<br />Abra um leilão e deixe o Leilômetro trabalhar por você."
    }
  }

  EXTENSION_IDS.forEach((id) => {
    try {
      chrome.runtime.sendMessage(id, "leilometro_ping", (response) => {
        if (
          resolved ||
          chrome.runtime.lastError ||
          !response ||
          !response.installed
        ) {
          return
        }

        resolved = true
        onDetected(response.version)
      })
    } catch (e) {
      // Silencia erros para não quebrar a landing em outros navegadores
    }
  })
})()
