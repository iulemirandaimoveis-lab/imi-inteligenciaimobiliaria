# PROJECT_MAP — Mapa Completo do Repositório

> Gerado pela auditoria de inteligência de projeto em 2026-07-02.
> Fonte de verdade para navegação. Atualize quando a estrutura mudar.

---

## Visão Geral

| Métrica | Valor (2026-07-02) |
|---|---|
| Arquivos TS/TSX em `src/` | ~1.185 |
| Rotas de API (`route.ts`) | 275 |
| Migrations Supabase | 65 arquivos |
| Suítes de teste unitário | 57 (834 testes, todos verdes) |
| Specs E2E (Playwright) | 2 (`e2e/smoke`, `e2e/critical-flows`) |
| Locales i18n | pt (default), en, es, ja, ar |

## Árvore de Alto Nível

```
/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── [lang]/(website)/   # Site público i18n (imoveis, projetos, biblioteca, avaliacoes…)
│   │   ├── (backoffice)/       # Backoffice admin (sem locale) — /backoffice/*
│   │   ├── (auth)/             # Fluxos de autenticação
│   │   ├── users/              # IMI Console (portal de corretores, sem locale)
│   │   ├── api/                # 275 route handlers
│   │   ├── l/, r/              # Short-links e redirects públicos
│   │   ├── lp/[code]/          # Landing pages dinâmicas
│   │   ├── p/                  # Páginas públicas de proposta
│   │   └── verificar/          # Verificação pública de QR
│   ├── components/             # UI compartilhada (ui/, maps/, backoffice/, imi/, website/…)
│   ├── features/               # Módulos por domínio (admin, avaliacoes, cadam, connect, lotmap, properties, proposals, users)
│   ├── lib/                    # Núcleo (ai/, supabase/, imi-auth/, intelligence/, valuation/, geo/, lotmap/, notifications/…)
│   ├── services/               # Serviços externos (brazil-apis/, intelligence/, locations/)
│   ├── hooks/                  # Hooks React (animations/, backoffice/)
│   ├── dictionaries/           # pt/en/es/ja/ar.json
│   ├── remotion/               # Composições de vídeo
│   ├── middleware.ts           # Locale + auth + security headers + CORS
│   └── types/                  # Tipos globais (inclui supabase.ts)
├── packages/                   # Pacotes internos via alias webpack (@imi/*)
│   ├── imi-cad-generator, imi-scene-adapter, imi-property-metadata,
│   ├── imi-domain, imi-crm-adapter, imi-spatial
├── supabase/                   # migrations/ (65), rls-policies.sql, MIGRATIONS_MAP.md
├── e2e/                        # Playwright
├── worker/                     # Custom service worker (next-pwa customWorkerDir)
├── templates/                  # @imi/templates
├── design-system/              # Tokens/design system
├── scripts/                    # validate-lots, cad/geo solver etc.
├── docs/                       # Documentação (este sistema de inteligência + históricos)
├── .memory/                    # Memória persistente de agentes (estado, decisões, aprendizados)
└── .claude/                    # Instruções operacionais p/ Claude Code
```

## Domínios Principais

| Domínio | Código | Rotas | Dados |
|---|---|---|---|
| Site público (imóveis, projetos) | `src/app/[lang]/(website)` | `/pt/imoveis`, `/pt/projetos/*` | `subdivision_lots`, `developments` |
| Backoffice admin | `src/app/(backoffice)` | `/backoffice/*` | dezenas de tabelas (leads, conteúdo, financeiro, RH…) |
| IMI Console (corretores) | `src/app/users`, `src/lib/imi-auth` | `/users/*` | schema `imi` (projects, proposals, commissions, goals) |
| Mapas de lotes | `src/features/lotmap`, `src/components/maps` | plan/geo/satélite | JSON de lotes + `subdivision_lots` |
| IA (conteúdo, avaliação, leads) | `src/lib/ai`, `src/app/api/ai/*` | 20+ endpoints | Anthropic SDK + Google Generative AI |
| Avaliações (PTAM) | `src/lib/avaliacoes`, `src/features/avaliacoes` | `/backoffice/avaliacoes` | KB própria + export |
| WhatsApp/CRM | `src/lib/whatsapp` | `/api/whatsapp*`, Evolution API | qualification, follow-ups |
| BPO Financeiro | `/api/bpo/*` | `/backoffice` | DRE, conciliação |
| Notificações push | `src/lib/notifications` | `/api/push*` | web-push + VAPID |

## Empreendimentos com Lógica Dedicada

- **Alto Bellevue** (loteamento) — mapa plano/geo/satélite; localização protegida (ver `.claude/ALTO_BELLEVUE_LOCATION.md` — NUNCA alterar URLs de localização/tour).
- **Miguel Marques** (loteamento) — `projetos/miguel-marques`, cron de sync de disponibilidade.
- **Jazz Boulevard** (vertical) — tipologias, viewer torre/andar/unidade.

## Onde Procurar Primeiro

| Preciso de… | Vá para |
|---|---|
| Autenticação/permissões | `src/middleware.ts`, `src/lib/supabase/*`, `src/lib/imi-auth/*` |
| Nova rota de API | `src/app/api/**/route.ts` (padrão: auth → rate-limit → zod → lógica) |
| Cliente Supabase correto | `docs/ARCHITECTURE.md` §Supabase |
| Mapa/lotes | `src/features/lotmap`, `src/lib/lots`, `src/components/maps` |
| Documentação existente | `docs/INDEX.md` + este arquivo |

---
**Última atualização**: 2026-07-02
