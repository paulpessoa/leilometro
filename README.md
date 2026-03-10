# Leilômetro — Extensão Chrome para Análise de Leilões

> Camada de inteligência injetada em sites de leilão de veículos.  
> Calcule o preço ideal, comissões e KM/Ano em tempo real — sem erros matemáticos no calor do lance.

---

## 📦 Como Instalar

1. **Abra o Chrome** e acesse: `chrome://extensions/`
2. Ative o **"Modo do desenvolvedor"** (toggle no canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta **`leilometro/`** (esta pasta)
5. O ícone aparecerá na barra do Chrome — pronto!

---

## 🌐 Sites Suportados

| Site                    | Status         |
| ----------------------- | -------------- |
| leilo.com.br            | ✅ Configurado |
| vipleiloes.com.br       | ✅ Configurado |
| copart.com.br           | ✅ Configurado |
| guariglialeiloes.com.br | ✅ Configurado |
| freitasleiloeiro.com.br | ✅ Configurado |
| copart.com (US)         | ✅ Configurado |

---

## ⚙️ Configuração Inicial (Importante!)

Antes de usar, clique no ícone da extensão e configure:

1. **Valor FIPE** do veículo que está analisando (consulte tabela.fipe.org.br)
2. **Margem de revenda** desejada (padrão: 15%)
3. **Custos estimados** de conserto, documentação e IPVA

---

## 📊 O que o Painel Mostra

```
┌─────────────────────────────────┐
│ Leilômetro          [−][×] │
├─────────────────────────────────┤
│ HONDA CIVIC EXL 2019            │
│                                 │
│  [SCORE: 75]  OPORTUNIDADE BOA  │
├─────────────────────────────────┤
│ 💰 VALORES                      │
│  Lance Atual       R$ 28.000    │
│  + Comissão (5%)  + R$ 1.400    │
│  + Taxa Pátio Est.+ R$ 350      │
│  Custo Real        R$ 29.750    │
├─────────────────────────────────┤
│ 📊 ANÁLISE FIPE                 │
│  FIPE Referência   R$ 45.000    │
│  Preço Limite      R$ 33.200    │
│  Margem            14 lances    │
│  Potencial de Lucro R$ 7.450    │
├─────────────────────────────────┤
│ 🚗 DADOS DO VEÍCULO             │
│  Ano: 2019    KM: 67.000        │
│  Combustível: ✅ Flex           │
│  🟡 11.167 km/ano — Uso Normal  │
└─────────────────────────────────┘
```

---

## 🔢 Lógica de Cálculo

```
Custo Real     = Lance + (Lance × 5%) + Taxa Pátio

Preço Limite   = FIPE - (FIPE × Margem%)
                 - Custo Conserto
                 - Documentação
                 - IPVA Atrasado

Lances Restantes = (Preço Limite - Lance) / Incremento

Score (0-100):
  < 70% do limite  → 95 pts (EXCELENTE)
  70-85% do limite → 75 pts (BOA)
  85-95% do limite → 55 pts (REGULAR)
  95-99% do limite → 35 pts (ARRISCADA)
  ≥ 100% do limite → 10 pts (EVITAR)
```

---

## ⌨️ Atalhos

| Atalho               | Ação                         |
| -------------------- | ---------------------------- |
| `Ctrl+Shift+L`       | Abre / fecha o painel        |
| Arrastar o cabeçalho | Move o painel na tela        |
| Botão `↻`            | Atualiza a leitura dos dados |
| Botão `−`            | Minimiza o painel            |

---

## 📁 Estrutura de Arquivos

```
leilometro/
├── manifest.json          # Manifest V3
├── content.js             # Scraping + cálculos + UI injetada
├── styles.css             # Estilos do painel (dark, premium)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── popup/
    ├── popup.html         # Tela de configurações
    └── popup.js           # Salva/carrega configurações
```

---

## 🛠️ Próximos Passos (Roadmap)

- [ ] Integração real com API FIPE (fipe.parallelum.com.br)
- [ ] Histórico de leilões analisados
- [ ] Exportação de análise em PDF
- [ ] Alertas de preço por e-mail/WhatsApp
- [ ] Comparação com preços de mercado (OLX, Webmotors)
- [ ] Suporte a mais leiloeiros

---

_Leilômetro v1.0.0 — Manifest V3 — Desenvolvido para compradores inteligentes_
