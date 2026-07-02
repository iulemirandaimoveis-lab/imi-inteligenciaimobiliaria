# REUSABLE_COMPONENTS — Catálogo de Reuso

> Antes de criar componente/util novo: procure aqui. Ao criar um reutilizável: registre aqui.

---

## UI Primitivos (`src/components/ui/`)
Botões, inputs, dialogs, command palette (cmdk), slots radix. Base de todos os mundos — usar sempre antes de criar variante.

## Mapas (`src/components/maps/`)
- `AerialSatelliteMap.tsx` — satélite genérico (Esri), sem dependência de tema; usado por múltiplos empreendimentos. **Reusar para empreendimento novo com âncora georreferenciada.**
- Viewers de lote: `SubdivisionLotMap`, `SubdivisionPlanView` (genéricos) vs `AltoBellevue*`/`MiguelMarques*` (específicos). Empreendimento novo → começar dos genéricos.
- `JazzBoulevardViewer` — vertical (torre/andar/unidade); fonte única site+console.

## Infra/Lib
- `src/lib/rate-limit.ts` — `limiters.<tipo>(chave)`; adicionar limiter novo aqui, não criar outro mecanismo.
- `src/lib/document-parser.ts` — docx/xlsx/pdf/txt → texto (lazy).
- `src/lib/spreadsheet/` — **adapter de planilha** (`readSpreadsheetRows`, `readSpreadsheetSheetsAsCsv`; ExcelJS). Todo parsing de xlsx passa por aqui — NUNCA importar xlsx/exceljs direto (T-24/D-13).
- `src/lib/imi-auth/` — `getImiSession`, RBAC, `logActivity` (audit best-effort).
- `src/lib/supabase/{client,server,admin,middleware,storage}.ts` — únicos pontos de acesso a dados.
- `src/lib/supabase-storage.ts` — upload client-side com progresso.
- `src/services/brazil-apis/` — ViaCEP, BrasilAPI, ReceitaWS, Brapi (com rotas `cep/[cep]`, `cnpj/[cnpj]`).
- `src/lib/notifications/` — push web (VAPID) + WhatsApp (Evolution API).

## Hooks (`src/hooks/`)
- `use-is-mobile` (testado) — detecção responsiva canônica.
- `hooks/animations/` — animações reutilizáveis; `hooks/backoffice/` — dados do admin.

## Padrões prontos para copiar
- Rota autenticada com RL: `src/app/api/ai/generate-content/route.ts`
- Rota cron: `src/app/api/cron/daily/route.ts`
- Rota admin com service-role: `src/app/api/admin/reset-password/route.ts` (⚠️ corrigir F-01/F-02 antes de copiar)
- Isolamento por feature flag: `src/__tests__/digital-twin/`

---
**Atualizado**: 2026-07-02
