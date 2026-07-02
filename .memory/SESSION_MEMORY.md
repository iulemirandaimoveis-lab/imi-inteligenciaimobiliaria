# SESSION_MEMORY — Memória de Curto Prazo

> Notas da sessão corrente/última. Sobrescreva a cada sessão (histórico durável vai para CHANGE_RECEIPT/LEARNINGS).

**Sessão**: 2026-07-02 · auditoria de inteligência

## Fatos verificados nesta sessão (confiança alta)

- 1.185 arquivos TS/TSX; 275 route handlers; 65 migrations; 57 suítes de teste.
- Gates: tsc ✅ / eslint ✅ / jest 829 ✅ 5 skipped.
- `mapbox-gl`: 0 imports diretos (motor real = maplibre-gl). CSP cita api.mapbox.com — verificar antes de remover.
- `xlsx/mammoth/pdf-parse`: usados só via dynamic import em `src/lib/document-parser.ts` (+ xlsx em `backoffice/imoveis/[id]/lotes/page.tsx:518`).
- Cron: 9 rotas, todas com `CRON_SECRET`.
- Rotas de IA seguem padrão auth→ratelimit→tenant (amostra: `ai/generate-content`).
- `admin/reset-password`: usa `getSession()` + senha temp de 6 hex — únicos desvios encontrados no padrão de segurança.
- Middleware: locale geo-IP; `/l/`, `/r/`, `/verificar` públicos; `/{locale}/users` → rewrite.
- Jest roda em ~12s — barato, rodar sempre.

## Comandos que funcionam neste ambiente

```bash
npm run type-check        # ~minutos, 0 erros em 2026-07-02
npm run lint              # limpo
npx jest --silent         # 12s
```

## Armadilhas encontradas

- grep por "auth check ausente" em rotas dá falso-positivo em massa — as rotas autenticam via `supabase.auth.getUser()` inline; sempre ler a rota antes de acusar.
- 3 arquivos .tsx citam SUPABASE_SERVICE_ROLE — é texto de UI (checklist), não uso real.
