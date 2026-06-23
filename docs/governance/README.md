# Governança de Sprints — Mapa Miguel Marques (Digital Twin Comercial)

> **Objetivo:** evoluir o mapa do **Miguel Marques** até alcançar/superar o nível do
> **Alto Bellevue** e do padrão **GRAFF** (https://graff.estate), **sem jamais regredir**
> nenhuma funcionalidade aprovada, crítica ou em produção.
>
> **Status:** Sprint 0 (Auditoria) — concluída. Nenhuma alteração de código aplicada.

---

## Por que este conjunto de documentos existe

Faltava no projeto uma **governança de execução por sprints** com **congelamento de
funcionalidades aprovadas**. Sem ela, há dois riscos reais e já observados:

1. **Regredir o Alto Bellevue** (o projeto mais maduro) ao tentar padronizar para baixo.
2. **Reconstruir geometria que já está correta** — porque o mapa premium do MM **já usa
   a planta aprovada (DXF R07)**, mas existe uma versão **JPG legada** convivendo nas
   rotas genéricas. Quem vê a versão legada conclui (erradamente) que "o MM é um SVG
   colorido / planta simplificada".

A regra de ouro deste conjunto: **padroniza-se elevando os projetos inferiores ao nível
dos superiores. Jamais o contrário.**

---

## Documentos

| # | Documento | Conteúdo |
|---|---|---|
| 00 | [`00-GOVERNANCA-SPRINTS.md`](./00-GOVERNANCA-SPRINTS.md) | Regras absolutas, metodologia de sprints (0–6), trava de fonte de verdade, portão de qualidade GRAFF |
| 01 | [`01-INVENTARIO-E-SNAPSHOT.md`](./01-INVENTARIO-E-SNAPSHOT.md) | Inventário de funcionalidades (existentes / aprovadas / críticas / produção) + snapshot técnico congelado |
| 02 | [`02-CHECKLIST-REGRESSAO.md`](./02-CHECKLIST-REGRESSAO.md) | Checklist de regressão obrigatório antes de qualquer merge |
| 03 | [`03-SPRINT-0-AUDITORIA.md`](./03-SPRINT-0-AUDITORIA.md) | Auditoria Sprint 0: arquitetura, AB × MM, pontos de regressão, oportunidades GRAFF |
| 04 | [`04-SPRINT-1-PRECISAO-CARTOGRAFICA.md`](./04-SPRINT-1-PRECISAO-CARTOGRAFICA.md) | Sprint 1: verificação do DXF, fonte única de contagem, unificação de rotas, P0 dos IDs duplicados |

## Relação com a documentação existente

Estes documentos **não substituem** os já existentes — eles **orquestram** a evolução:

- `docs/AUDITORIA_MAPAS_AB_MM_2026-06-20.md` — auditoria técnica base (com evidência `arquivo:linha`).
- `docs/AUDITORIA_IMI_SPATIAL_ENGINE_2026-06-19.md` — motor espacial.
- `.claude/UI_REGRESSION_POLICY.md` — política de regressão de UI (regra absoluta).
- `docs/miguel-marques-cad-audit.md`, `docs/handoff-mapa-alto-bellevue-cad.md` — pipelines CAD.

---

**Última atualização:** 2026-06-23 · **Branch:** `claude/miguel-marques-sprint-governance-0fg009`
