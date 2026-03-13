/**
 * Classifica o uso do veículo com base na quilometragem anual média.
 * @param {number} kmAno - Média de quilômetros rodados por ano.
 * @returns {object} Objeto contendo label, cor e emoji da classificação.
 */
function classifyKmAno(kmAno) {
  if (!kmAno) return { label: "— Não calculado", color: "#888", emoji: "❓" }
  
  if (kmAno < 10000) {
    return { 
      label: `${kmAno.toLocaleString("pt-BR")} km/ano — Uso Particular`, 
      color: "#22c55e", 
      emoji: "🟢" 
    }
  }
  
  if (kmAno < 15000) {
    return { 
      label: `${kmAno.toLocaleString("pt-BR")} km/ano — Uso Normal`, 
      color: "#86efac", 
      emoji: "🟢" 
    }
  }
  
  if (kmAno < 25000) {
    return { 
      label: `${kmAno.toLocaleString("pt-BR")} km/ano — Possível Frota`, 
      color: "#f59e0b", 
      emoji: "🟡" 
    }
  }
  
  if (kmAno < 35000) {
    return { 
      label: `${kmAno.toLocaleString("pt-BR")} km/ano — Uso Intenso`, 
      color: "#f97316", 
      emoji: "🟠" 
    }
  }
  
  return { 
    label: `${kmAno.toLocaleString("pt-BR")} km/ano — Uso Extremo/App`, 
    color: "#ef4444", 
    emoji: "🔴" 
  }
}
