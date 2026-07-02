# DEPENDENCIES — Inventário e Auditoria de Dependências

> Contagens de uso = nº de arquivos com import direto em `src/`, `packages/`, `templates/`, `worker/`, `scripts/` (2026-07-02).

---

## Núcleo (não tocar sem plano)

| Pacote | Papel |
|---|---|
| next ^14.1, react 18, typescript 5.3 | Framework |
| @supabase/supabase-js, @supabase/ssr | Dados/Auth |
| tailwindcss 3.4 (+forms, typography), clsx, tailwind-merge | Estilo |
| @anthropic-ai/sdk | IA principal |
| zod, react-hook-form, @hookform/resolvers | Formulários/validação |
| framer-motion | Animação padrão |
| @sentry/nextjs | Observabilidade |
| next-pwa (+ worker/) | PWA |

## Uso Medido (indicadores)

| Pacote | Arquivos | Status |
|---|---|---|
| sonner | 140 | Toast padrão do projeto |
| swr | 19 | Data-fetching client-side padrão |
| recharts | 17 | Gráficos |
| qrcode | 10 | Tracking/QR |
| @dnd-kit/* | 7 | Drag & drop backoffice |
| next-themes | 4 | Tema claro/escuro |
| remotion + @remotion/player | 3 | Vídeo |
| maplibre-gl | 2 | Mapas (motor real) |
| bcryptjs | 2 | Hash local |
| exceljs | dynamic import | `src/lib/spreadsheet/` (adapter T-24; substituiu `xlsx`) |
| mammoth, pdf-parse | dynamic import | `src/lib/document-parser.ts` (lazy — correto) |
| gsap / @gsap/react | 1 | Uso pontual |
| @google/generative-ai | 1 | Uso pontual |
| web-push | 1 | Push server-side |

## ⚠️ Candidatas a Remoção (verificar e remover)

| Pacote | Evidência | Risco | Ação |
|---|---|---|---|
| `jsonwebtoken` (+ @types) | 0 imports encontrados | Baixo | Confirmar com `grep -r "jsonwebtoken"` e remover |
| `ua-parser-js` (+ @types) | 0 imports encontrados | Baixo | Idem |
| `mapbox-gl` (+ @types/mapbox-gl) | 0 imports diretos; motor é maplibre-gl | Médio — CSP referencia api.mapbox.com; verificar styles/tiles carregados por URL antes de remover | Investigar → remover ou documentar por quê fica |

**Ganho esperado**: menos superfície de segurança, `npm install` e bundle menores.

## Duplicações Conceituais (consolidar no longo prazo)

- **Animação**: framer-motion (padrão) + gsap (1 uso) → migrar o uso de gsap quando tocar no arquivo.
- **Mapas**: maplibre-gl (real) + mapbox-gl (suspeita de morta).
- **IA**: Anthropic (padrão) + Google Generative AI (1 uso) — decisão registrada? Ver DECISION_LOG.

## Regras

1. Antes de adicionar dependência: verifique se já existe equivalente nesta lista.
2. Libs pesadas de parsing (xlsx/mammoth/pdf-parse) **sempre** via `await import()` — nunca import estático.
3. Nova lib de UI/animação/gráfico exige entrada no DECISION_LOG.
4. `npm audit` roda no CI desde 2026-07-02: gate bloqueante para **críticas de produção** (`--omit=dev --audit-level=critical`) + audit informativo completo (D-10).

## Estado do `npm audit` (2026-07-02)

- **Produção** (`--omit=dev`): 0 críticas · 15 altas · 13 moderadas · 1 baixa.
- **Árvore completa**: 1 crítica (`handlebars` via ts-jest — dev) · 19 altas.
- **`xlsx` REMOVIDO 2026-07-02** (T-24) → substituído por `exceljs` via adapter `src/lib/spreadsheet/`.
- **Altas de produção restantes**: `next`/`next-pwa`/`workbox-*`/`rollup-plugin-terser`/`serialize-javascript`/`undici` (toolchain build — priorizar upgrade do Next e do next-pwa, que está defasado); `lodash`, `minimatch`, `@xmldom/xmldom`, `fast-uri`. (Reavaliar após esses: subir o gate do CI para `high`.)

---
**Última atualização**: 2026-07-02
