# Common Mistakes

**⚠️ CRITICAL - Read at session start (2 min saves 2 hours!)**

---

## Top 5 Critical Mistakes

### 1. Usar cliente Supabase errado (server vs client)

**Symptom**: Erro de autenticação ou RLS não funciona
**Check**: `src/lib/supabase/` — existe `client.ts` e `server.ts`
**Fix**: Use `createServerClient` em Server Components/Route Handlers; `createBrowserClient` em Client Components

### 2. Esquecer de regenerar tipos TypeScript após migration Supabase

**Symptom**: TypeScript não reconhece novas colunas/tabelas
**Check**: `src/types/supabase.ts` está desatualizado
**Fix**: `supabase gen types typescript --local > src/types/supabase.ts`

### 3. Importar componentes server-side com `"use client"` errado

**Symptom**: Erro "Event handlers cannot be passed to Client Component props"
**Check**: Componentes com hooks React precisam de `"use client"` no topo
**Fix**: Adicionar `"use client"` ou extrair lógica de estado para componente filho

### 4. Variáveis de ambiente sem prefixo NEXT_PUBLIC_ no client

**Symptom**: Variável é `undefined` no browser
**Check**: Vars acessadas no client precisam de `NEXT_PUBLIC_` prefixo
**Fix**: Renomear a variável e atualizar `.env.local` e Vercel

### 5. Chamar API Anthropic/Google AI diretamente do client

**Symptom**: API key exposta no bundle ou erro de CORS
**Check**: Chamadas AI devem passar por Route Handlers (`app/api/`)
**Fix**: Criar endpoint em `src/app/api/` e chamar via `fetch` do client

---

**Update this file when:**
- Bug took >1 hour to debug
- Error could cause production issue
- Mistake repeated across sessions
- Pattern violates framework conventions

**Last Updated**: 2026-05-10
