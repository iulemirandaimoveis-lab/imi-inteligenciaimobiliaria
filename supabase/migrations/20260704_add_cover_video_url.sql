-- cover_video_url estava prevista em jazz_boulevard_EXECUTAR_NO_SUPABASE.sql (linha 27),
-- mas nunca foi aplicada em produção. Sem ela, o select de /[lang]/imoveis (PR #334)
-- falhava com 42703 e o catálogo público inteiro caía no estado vazio "Portfólio em Curadoria".
-- Aplicada em produção via MCP em 2026-07-04 (migration: add_cover_video_url_to_developments).
ALTER TABLE public.developments ADD COLUMN IF NOT EXISTS cover_video_url TEXT;
