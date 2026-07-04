# 2026-07-04 — Hotfix: catálogo /imoveis vazio em produção (FX-10)

## Problema
`iulemirandaimoveis.com.br/{lang}/imoveis` mostrava apenas o empty state "Portfólio em
Curadoria" em produção, apesar de o banco ter 7 empreendimentos com
`status_commercial='published'` (Alto Bellevue, Jazz Boulevard, Kempinski ×2, Bougainvillea,
Miguel Marques, Recanto do Sol).

## Causa-raiz
- PR #334 adicionou `cover_video_url` ao select de `src/app/[lang]/(website)/imoveis/page.tsx`.
- A coluna estava prevista apenas na migration manual
  `supabase/migrations/jazz_boulevard_EXECUTAR_NO_SUPABASE.sql` (linha 27), que foi executada
  **parcialmente** em produção — todas as outras colunas existiam; essa não.
- PostgREST responde 42703 (coluna inexistente) e a query **inteira** falha → `data = null` →
  `initialDevelopments.length === 0` → empty state. Com 0 `rental_properties` ativos, a página
  ficava 100% vazia. Único sinal: `console.error` no server (sem alerta).

## Correção
1. **Produção (imediato)**: `ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS
   cover_video_url TEXT` aplicada via MCP (migration `add_cover_video_url_to_developments`).
   Aditiva, idempotente e já prevista em migration commitada no repo. A página é
   `force-dynamic`, então o site voltou na requisição seguinte.
2. **Repo**: migration versionada `supabase/migrations/20260704_add_cover_video_url.sql`.
3. **Hardening**: `imoveis/page.tsx` agora tem `FULL_SELECT` + `CORE_SELECT` (colunas
   históricas). Se o select completo falhar, refaz a query com o núcleo seguro — o catálogo
   público nunca mais zera por causa de uma coluna nova não migrada.

## Verificação
- Select completo reproduzido via SQL em produção: falhava antes, retorna 7 linhas depois.
- FK `developments_developer_id_fkey` confirmada (embed `developers(name,logo_url)` ok).
- `tsc --noEmit` ✅ · `next lint --file .../imoveis/page.tsx` ✅.
- Fetch direto do site bloqueado pelo proxy do ambiente (403) — verificação foi no nível da query.

## Prevenção (registrada em FX-10)
- Coluna nova em select de página pública ⇒ confirmar existência em produção antes do deploy.
- Migrations "EXECUTAR_NO_SUPABASE" manuais são armadilha: versionar em `YYYYMMDD_*.sql` e aplicar.
