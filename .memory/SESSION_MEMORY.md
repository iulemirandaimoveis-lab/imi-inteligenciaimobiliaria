# SESSION_MEMORY (sobrescrita por sessão)

**Sessão**: 2026-07-04 · Hotfix produção — /imoveis vazio ("Portfólio em Curadoria")

## Contexto vivo
- Dono reportou via screenshot mobile: `iulemirandaimoveis.com.br/pt/imoveis` só mostrava o empty state.
- Diagnóstico: coluna `cover_video_url` do select (PR #334) não existia em produção — a migration
  manual `jazz_boulevard_EXECUTAR_NO_SUPABASE.sql` foi aplicada parcialmente (só essa coluna faltava).
  PostgREST 42703 derruba a query inteira → `data=null` → empty state. 0 rentals ativos → página 100% vazia.
- Fix em 2 camadas: (1) coluna aplicada em produção via MCP (site voltou imediatamente, page é
  force-dynamic); (2) código: migration versionada + fallback `CORE_SELECT` no `imoveis/page.tsx`.
- Branch designado: `claude/website-correction-ihsy4p`.
- Armadilha reconfirmada: `npx tsc` sem node_modules "passa" — sempre `npm ci` antes dos gates.
- Proxy deste ambiente bloqueia fetch do site em produção (403) — verificação foi via SQL (reproduz
  o select exato) + FK do embed confirmada no pg_constraint.

## Estado ao fim da sessão
- Produção corrigida (DB). PR com migration + hardening + memória aguardando merge.
- Follow-up sugerido: varrer outros selects públicos por colunas ausentes em produção (mesma classe FX-10).
