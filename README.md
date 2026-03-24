# IMI — Inteligencia Imobiliaria

> Plataforma proptech completa com IA multi-LLM para gestao imobiliaria, avaliacoes NBR 14653, CRM com lead scoring, e BPO financeiro.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** 164 API routes + Supabase (PostgreSQL + Auth + Storage + Realtime)
- **AI:** Anthropic Claude + Google Gemini (multi-LLM with cost tracking)
- **Deploy:** Vercel + Supabase Cloud
- **PWA:** next-pwa with offline support

## Quick Start

```bash
git clone https://github.com/iulemirandaimoveis-lab/imi-inteligenciaimobiliaria.git
cd imi-inteligenciaimobiliaria
cp .env.example .env.local  # Fill in your keys
npm install
npm run dev
```

## Modules

| Module | Routes | Description |
|--------|--------|-------------|
| **Leads CRM** | 12 | Pipeline, scoring, qualification, inbox |
| **Imoveis** | 15 | CRUD, explorer, portfolio, comparator |
| **Avaliacoes** | 8 | Motor NBR 14653, laudos, calculadora |
| **AI Chat** | 3 | Multi-model chat with context engine |
| **Tracking** | 6 | QR codes, link tracking, geo analytics |
| **BPO Financeiro** | 5 | DRE, conciliacao, categorizacao IA |
| **Rentals** | 3 | Short stay + traditional rental management |
| **Social** | 8 | OAuth, inbox unificada, DM read/reply |
| **Partnerships** | 7 | Inter-broker deals, commission tracking |
| **Biblioteca** | 3 | 27 livros, reader, knowledge base |

## Database

Run migrations in order:
1. `supabase/migrations/20260317_production_unified_migration.sql` (baseline)
2. Any files dated after 20260317

## Environment Variables

See `.env.example` for all required variables.

## Design System

- **Brand:** Navy (#050B14) x Gold (#C8A44A)
- **Fonts:** Playfair Display (logo only) + Outfit (UI) + JetBrains Mono (data)
- **Components:** Glass cards, navy buttons with gold accent line
- **Reference:** `src/app/(backoffice)/lib/theme.ts`

## License

Proprietary — IMI Inteligencia Imobiliaria 2026
