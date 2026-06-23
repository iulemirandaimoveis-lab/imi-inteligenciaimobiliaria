# 00 — Governança de Sprints (Prompt Master + Adendo)

> Este documento é a **fonte normativa**. Todo agente de IA ou desenvolvedor que tocar
> no mapa do Miguel Marques (ou do Alto Bellevue) deve lê-lo **antes** de qualquer
> alteração. Ele tem precedência sobre conveniência, velocidade ou "melhorias rápidas".

---

## 1. REGRA ABSOLUTA — NÃO QUEBRAR O QUE JÁ FUNCIONA

Antes de qualquer alteração:

1. **Criar/atualizar inventário** completo do sistema atual → [`01-INVENTARIO-E-SNAPSHOT.md`](./01-INVENTARIO-E-SNAPSHOT.md).
2. **Identificar** funcionalidades: existentes · aprovadas · críticas · em produção.
3. **Criar snapshot técnico** (commit de referência + arquivos-chave + assets).
4. **Rodar o checklist de regressão** → [`02-CHECKLIST-REGRESSAO.md`](./02-CHECKLIST-REGRESSAO.md).
5. **Nenhuma funcionalidade aprovada pode ser removida.**
6. **Nenhuma funcionalidade aprovada pode piorar.**
7. **Nenhuma alteração pode ser aplicada direto em produção sem validação.**
8. **Toda evolução é incremental.**
9. Se houver **risco de regressão**: criar **feature flag** + **branch isolada** e
   implementar **sem afetar produção**.
10. **Alto Bellevue é a referência atual.** Tudo que existe nele deve continuar funcionando.
11. **Miguel Marques deve evoluir** até alcançar ou superar o nível do Alto Bellevue.
12. **Nunca reduzir qualidade para padronizar.** Padroniza-se **elevando** os projetos
    inferiores ao nível dos superiores. **Jamais o contrário.**

---

## 2. TRAVA DE FONTE DE VERDADE (a regra que faltava)

> **Não utilizar o mapa atual como referência visual.** Utilizar **exclusivamente** o
> **DWG, DXF e PDF aprovados** como fonte de verdade. O mapa atual é **legado temporário**.
> O objetivo é **reconstruir a representação espacial** do Miguel Marques a partir dos
> arquivos técnicos oficiais, **preservando funcionalidades existentes** e elevando a
> experiência ao padrão de **Digital Twin Comercial**.

**Hierarquia de fonte de verdade (decrescente):**

1. `R07 — Planta de piso — PLANTA LOTEADA.dwg`
2. `R07 — Planta de piso — PLANTA LOTEADA.dxf`
3. `Planta Miguel Marques aprovada.pdf`
4. `Disponibilidade lotes — Miguel Marques (Mi Gestão).pdf` → **somente status/preço**, não geometria.

**Nunca** derivar geometria de: o SVG atual · o JSON atual como ponto de partida ·
coordenadas inventadas/estimadas a olho.

### ⚠️ Restrição técnica conhecida (ler antes de prometer "pixel-perfect")

O DXF **não contém polígonos de lote fechados** — os lotes aparecem como **linhas soltas**
(ver comentário em `scripts/cad/mm/build-map.mjs:1-16`). Portanto:

- A geometria de lote é **reconstruída** a partir de **centroides e áreas reais** + grade
  axis-Voronoi (testada/profundidade). Isso **já usa dados reais do CAD**, não estimativa.
- "Pixel-a-pixel igual à planta" só é possível quando o **DWG/DXF trouxer o lote como
  polígono fechado** (polyline fechada por lote/quadra). **Sprint 1** deve, antes de tudo,
  verificar se o DWG tem essas polylines e, se sim, extrair o contorno **exato**.

---

## 3. METODOLOGIA OBRIGATÓRIA — EXECUÇÃO EM SPRINTS

- **Não entregar tudo de uma vez.** Dividir em sprints **independentes**.
- Cada sprint é **concluída, testada e documentada** antes da próxima.
- Se o contexto da IA crescer demais: **PARAR → gerar relatório → validar → próxima sprint.**
- **Nunca** continuar sem concluir a sprint atual.
- Cada sprint gera um doc de conclusão em `.claude/completions/AAAA-MM-DD-<sprint>.md`.

### Roadmap

| Sprint | Nome | Objetivo | Toca produção? | Status |
|---|---|---|---|---|
| **0** | Auditoria | Entender exatamente o que existe hoje | ❌ Não | ✅ Concluída |
| **1** | Precisão Cartográfica | Mapa = planta aprovada (DWG→DXF→PDF) | ⚠️ Sob flag | 🟡 Em andamento ([04](./04-SPRINT-1-PRECISAO-CARTOGRAFICA.md)) |
| **2** | Motor de Mapa | Zoom/pan/seleção/filtros/busca/foco | ⚠️ Sob flag | ⬜ |
| **3** | Experiência GRAFF | Visual aéreo, sombras, profundidade, hierarquia | ⚠️ Sob flag | ⬜ |
| **4** | MI Twin | Camadas técnica/comercial/render/satélite/drone | ⚠️ Sob flag | ⬜ |
| **5** | MI Sales OS | Carrinho/comparação/proposta/reserva/compartilhar/histórico | ⚠️ Sob flag | ⬜ |
| **6** | Qualidade GRAFF | Eliminar aparência de "mapa de loteamento comum" | ⚠️ Sob flag | ⬜ |

### Definition of Done por sprint

- [ ] Entregáveis da sprint completos
- [ ] Checklist de regressão ([02](./02-CHECKLIST-REGRESSAO.md)) **verde** (AB e MM)
- [ ] `npm run type-check`, `npm run lint`, `npm test` passando
- [ ] Doc de conclusão criado
- [ ] Nenhuma funcionalidade aprovada removida/piorada

---

## 4. ESCOPO DAS SPRINTS

### SPRINT 0 — Auditoria ✅
Arquitetura atual · componentes · bugs · mapa AB · mapa MM · diferenças · pontos de
regressão · oportunidades GRAFF. **Nenhuma alteração visual ou funcional.** → [03](./03-SPRINT-0-AUDITORIA.md)

### SPRINT 1 — Precisão Cartográfica (a mais importante)
Fazer o mapa representar a **planta aprovada**. Quadras/ruas/lotes/geometrias/proporções/
alinhamentos corretos. Fonte: DWG → DXF → PDF. **Nunca** SVG/JSON atual nem coordenadas
inventadas. **Entrega-se sob feature flag**, validando contra a versão atual antes de promover.

> Pré-requisito de Sprint 1: verificar se o **DWG** tem polylines de lote fechadas
> (ver §2). Se sim, contorno **exato**; se não, manter reconstrução por centroide/área e
> **documentar a limitação**.

### SPRINT 2 — Motor de Mapa
Substituir render estático por motor espacial: zoom progressivo · pan · seleção · destaque
· filtros · busca · foco automático · hover (desktop) · toque (mobile). **Sem alterar layout.**

### SPRINT 3 — Experiência GRAFF
Produto premium: visualização aérea · sombras · profundidade · relevo visual · hierarquia
de áreas · áreas comuns destacadas · masterplan premium. **Sem render fake, sem imagem
decorativa.** Tudo baseado na planta real.

### SPRINT 4 — MI Twin (Digital Twin v1)
Camadas: técnica · comercial · render · satélite · drone. Troca **instantânea** entre camadas.

### SPRINT 5 — MI Sales OS
Carrinho · comparação · proposta · reserva · compartilhamento · histórico.
> Nota: o MM **já** tem carrinho + proposta multi-lote via WhatsApp
> (`MiguelMarquesPlanView.tsx:118-238`). Sprint 5 **evolui**, não recria.

### SPRINT 6 — Qualidade GRAFF
Eliminar a aparência de "mapa de loteamento comum". Ver portão §5.

---

## 5. PORTÃO DE QUALIDADE GRAFF (gate de aceite visual)

Antes de promover qualquer sprint visual para produção, responder:

| Pergunta | Resposta = REPROVADO | Resposta = APROVADO |
|---|---|---|
| Parece um PDF colorido? | Sim | Não |
| Parece um SVG cru? | Sim | Não |
| Parece software dos anos 2000? | Sim | Não |
| Parece um produto premium de inteligência imobiliária? | — | Sim |
| O corretor vende **só mostrando o mapa**? | — | Sim |
| O cliente entende o valor **sem explicação**? | — | Sim |
| Está próximo do padrão **GRAFF**? | — | Sim |

**Qualquer "REPROVADO" bloqueia o merge** da sprint visual.

---

## 6. Regras para agentes de IA (reforço do CLAUDE.md)

- Sempre explicar **quais arquivos** serão alterados e **por quê** antes de mudar.
- Nunca fazer alterações amplas sem plano explícito e aprovado.
- Preservar a arquitetura (App Router, Supabase RLS, server/client split).
- Não alterar autenticação, billing ou banco sem aprovação explícita.
- Nunca commitar `.env.local` ou secrets.
- **Não tocar em `.claude/ALTO_BELLEVUE_LOCATION.md`** (URLs de localização/tour congeladas).
