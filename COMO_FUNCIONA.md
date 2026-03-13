# 🔍 Como Funciona o Leilômetro

Este documento explica em detalhes como cada valor exibido no painel do Leilômetro é calculado.

---

## 📊 Dados Capturados

### Lance Atual

**Fonte:** Extraído automaticamente da página do leilão

- **Método 1 (Prioritário):** `window.__INITIAL_STATE__.LoteSelecionadoState.valor.valorProposta`
- **Método 2 (Fallback):** Seletores DOM específicos por site (ex: `h3.valor-lote span`)
- **Método 3 (Último recurso):** Busca por padrões `R$ X.XXX,XX` no texto da página

### Ano do Veículo

**Fonte:** Extraído automaticamente ou preenchido manualmente

- **Automático:** `__INITIAL_STATE__.veiculo.anoFabricacao` ou `anoModelo`
- **Fallback:** Busca por padrões de 4 dígitos entre 1950-2029
- **Manual:** Campo editável caso não seja detectado

### Quilometragem (KM)

**Fonte:** Extraído automaticamente ou preenchido manualmente

- **Automático:** `__INITIAL_STATE__.veiculo.quilometragem`
- **Fallback:** Busca por padrões numéricos seguidos de "km"
- **Conversão:** Sites internacionais (Copart) convertem milhas para km (× 1.609)

### FIPE Referência

**Fonte:** Detectada automaticamente ou preenchida manualmente

- **Automático:** `__INITIAL_STATE__.veiculo.valorMercado`
- **Manual:** Campo editável (obrigatório para cálculos precisos)
- **Padrão:** R$ 45.000 (valor de referência quando não detectado)

---

## 💰 Cálculos de Custos

### Comissão do Leiloeiro

**Fórmula:** `Lance Atual × Percentual de Comissão`

**Percentual:**

- **Automático:** Extraído da página (`__INITIAL_STATE__.valor.comissaoPorcentagem`)
- **Padrão:** 5% (quando não detectado)

**Exemplo:**

```
Lance: R$ 30.000
Comissão: 5%
Resultado: R$ 30.000 × 0,05 = R$ 1.500
```

### Taxas Extras (Auto-detectadas)

Quando disponíveis na página, são somadas automaticamente:

1. **Depósito de Bens:** `__INITIAL_STATE__.valor.depositoDeBens`
2. **Taxa de Remoção:** `__INITIAL_STATE__.valor.remocao`
3. **Vistoria:** `__INITIAL_STATE__.valor.vistoria`
4. **Despachante:** `__INITIAL_STATE__.valor.despachante`

**Taxa de Pátio Efetiva:**

- Se houver taxas detectadas: `Soma de todas as taxas extras`
- Se não houver: `R$ 350` (estimativa padrão)

### Custo Real

**Fórmula:** `Lance Atual + Comissão + Taxa de Pátio Efetiva`

**Exemplo:**

```
Lance: R$ 30.000
Comissão: R$ 1.500
Taxa Pátio: R$ 350
Custo Real: R$ 30.000 + R$ 1.500 + R$ 350 = R$ 31.850
```

---

## 📈 Análise FIPE

### Margem de Revenda

**Padrão:** 15% (editável)
**Uso:** Define o lucro desejado sobre o valor FIPE

**Cálculo:** `FIPE × Margem`

**Exemplo:**

```
FIPE: R$ 50.000
Margem: 15%
Margem em Reais: R$ 50.000 × 0,15 = R$ 7.500
```

### Custos Fixos Estimados

**Fórmula:** `Conserto + Documentação + IPVA + Taxa Pátio`

**Valores Padrão (editáveis):**

- Conserto: R$ 2.500
- Documentação: R$ 800
- IPVA: R$ 1.200
- Taxa Pátio: R$ 350

**Total Padrão:** R$ 4.850

### Preço Limite

**Fórmula:** `FIPE - Margem de Revenda - Custos Fixos`

Este é o valor máximo que você deveria pagar no leilão para manter a margem de lucro desejada.

**Exemplo:**

```
FIPE: R$ 50.000
Margem: R$ 7.500
Custos Fixos: R$ 4.850
Preço Limite: R$ 50.000 - R$ 7.500 - R$ 4.850 = R$ 37.650
```

### Lances Restantes

**Fórmula:** `(Preço Limite - Lance Atual) ÷ Incremento por Lance`

**Incremento Padrão:** R$ 200 (editável)

**Exemplo:**

```
Preço Limite: R$ 37.650
Lance Atual: R$ 30.000
Incremento: R$ 200
Lances Restantes: (R$ 37.650 - R$ 30.000) ÷ R$ 200 = 38 lances
```

**Interpretação:**

- ✅ **> 0 lances:** Ainda há margem para dar lances
- 🚨 **0 lances:** Limite atingido! Não dê mais lances

### Potencial de Lucro

**Fórmula:** `FIPE - Custo Real - Conserto - Documentação - IPVA`

**Exemplo:**

```
FIPE: R$ 50.000
Custo Real: R$ 31.850
Conserto: R$ 2.500
Documentação: R$ 800
IPVA: R$ 1.200
Potencial de Lucro: R$ 50.000 - R$ 31.850 - R$ 2.500 - R$ 800 - R$ 1.200 = R$ 13.650
```

---

## 🚗 Análise de Uso do Veículo

### Idade do Veículo

**Fórmula:** `Ano Atual - Ano do Veículo`

**Exemplo:**

```
Ano Atual: 2026
Ano do Veículo: 2020
Idade: 2026 - 2020 = 6 anos
```

### KM por Ano (Média Anual)

**Fórmula:** `KM Total ÷ Idade do Veículo`

**Exemplo:**

```
KM Total: 72.000 km
Idade: 6 anos
KM/Ano: 72.000 ÷ 6 = 12.000 km/ano
```

### KM por Mês (Média Mensal)

**Fórmula:** `KM por Ano ÷ 12`

**Exemplo:**

```
KM/Ano: 12.000 km/ano
KM/Mês: 12.000 ÷ 12 = 1.000 km/mês
```

### Classificação de Uso

Baseada na média anual (KM/Ano):

| KM/Ano          | Classificação   | Emoji | Cor         | Interpretação                            |
| --------------- | --------------- | ----- | ----------- | ---------------------------------------- |
| < 10.000        | Uso Particular  | 🟢    | Verde       | Baixa rodagem, provavelmente uso pessoal |
| 10.000 - 14.999 | Uso Normal      | 🟢    | Verde Claro | Uso regular, dentro da média             |
| 15.000 - 24.999 | Possível Frota  | 🟡    | Amarelo     | Uso intenso, pode ter sido frota         |
| 25.000 - 34.999 | Uso Intenso     | 🟠    | Laranja     | Alta rodagem, desgaste acelerado         |
| ≥ 35.000        | Uso Extremo/App | 🔴    | Vermelho    | Muito alta, típico de Uber/99            |

---

## 🎯 Score de Oportunidade

O score é calculado com base em dois fatores principais:

### 1. Relação Lance/Preço Limite

**Fórmula:** `Lance Atual ÷ Preço Limite`

| Relação   | Score Base | Interpretação          |
| --------- | ---------- | ---------------------- |
| < 70%     | 95 pontos  | Excelente negócio      |
| 70% - 84% | 75 pontos  | Boa oportunidade       |
| 85% - 94% | 55 pontos  | Oportunidade regular   |
| 95% - 99% | 35 pontos  | Oportunidade arriscada |
| ≥ 100%    | 10 pontos  | Evitar - sem margem    |

### 2. Penalização por KM/Ano

Reduz o score baseado no uso:

- **KM/Ano > 30.000:** -20 pontos
- **KM/Ano > 20.000:** -10 pontos
- **KM/Ano ≤ 20.000:** Sem penalização

### Score Final

**Fórmula:** `Score Base - Penalização KM`

**Limites:** Mínimo 0, Máximo 100

**Exemplo:**

```
Lance: R$ 30.000
Preço Limite: R$ 37.650
Relação: 30.000 ÷ 37.650 = 79,7% → Score Base: 75
KM/Ano: 12.000 → Penalização: 0
Score Final: 75 - 0 = 75 pontos → BOA OPORTUNIDADE
```

### Classificação do Score

| Score  | Classificação | Cor         | Recomendação                             |
| ------ | ------------- | ----------- | ---------------------------------------- |
| 80-100 | EXCELENTE     | Verde       | Ótima oportunidade, considere dar lances |
| 60-79  | BOA           | Verde Limão | Boa oportunidade, analise bem            |
| 40-59  | REGULAR       | Amarelo     | Oportunidade mediana, cuidado            |
| 20-39  | ARRISCADA     | Laranja     | Alto risco, evite se possível            |
| 0-19   | EVITAR        | Vermelho    | Não recomendado, sem margem              |

---

## 💡 Dicas de Uso

1. **Sempre verifique a FIPE:** O cálculo só é preciso com o valor FIPE correto
2. **Ajuste os custos:** Cada veículo tem condições diferentes
3. **Considere o KM/Ano:** Alta rodagem pode indicar desgaste prematuro
4. **Leia o edital:** Verifique restrições, débitos e condições especiais
5. **Faça vistoria:** Sempre que possível, vistorie o veículo presencialmente

---

## ⚠️ Avisos Importantes

- ✅ Esta é uma **ferramenta de apoio à decisão**
- ✅ Os valores são **estimativas** baseadas em dados públicos
- ✅ **Sempre leia o edital completo** do leilão
- ✅ **Faça vistoria presencial** quando possível
- ✅ Considere custos adicionais não previstos (multas, sinistro, etc.)
- ✅ O valor FIPE é uma **referência**, não o preço de venda garantido

---

**Desenvolvido por QiSites** | [qisites.com.br](https://qisites.com.br)
