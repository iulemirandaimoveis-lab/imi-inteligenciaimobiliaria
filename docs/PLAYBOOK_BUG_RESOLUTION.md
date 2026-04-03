# IMI — Playbook de Resolução de Bugs

> Documento operacional para o Claude Code resolver bugs reportados pelos usuários via Settings → Reportar Bug.

---

## 1. Fluxo de Trabalho

```
Usuário reporta bug (Settings → Reportar Bug)
  → POST /api/bug-reports (salva no Supabase)
  → Notificação push para admin (iule@imi.com)
  → Admin aciona Claude Code com: "Resolva os bugs reportados"
  → Claude Code executa este playbook
```

### Comando para iniciar resolução:
```
"Verifique e resolva os bug reports abertos em /api/bug-reports"
```

---

## 2. Passo a Passo para o Agente

### 2.1 Buscar bugs abertos

```bash
# Via Supabase MCP ou API direta
curl -s "$SUPABASE_URL/rest/v1/bug_reports?status=eq.open&order=created_at.desc" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Ou via código — leia a tabela `bug_reports` onde `status IN ('open', 'investigating')`.

### 2.2 Para cada bug, analisar:

1. **Ler o título e descrição** — entender o que o usuário reportou
2. **Verificar `page_url`** — identificar qual página/rota tem o problema
3. **Verificar `category`** — direciona para o tipo de arquivo:
   - `visual` → CSS, componentes React, `globals.css`, theme
   - `funcionalidade` → API routes, hooks, estado do componente
   - `performance` → queries Supabase, re-renders, lazy loading
   - `mobile` → `useIsMobile()`, classes `sm:`/`md:`, MobileHeader
   - `dados` → API routes, Supabase queries, RLS policies
   - `seguranca` → auth checks, RLS, API validation
4. **Verificar `screenshot_urls`** — imagens do bug
5. **Verificar `console_errors`** — erros do console do usuário
6. **Verificar `user_agent`** — browser/dispositivo afetado

### 2.3 Localizar código relevante

Mapeamento de rotas para arquivos:

| Rota URL | Arquivo principal |
|----------|-------------------|
| `/backoffice/hoje` | `src/app/(backoffice)/backoffice/hoje/page.tsx` |
| `/backoffice/imoveis` | `src/app/(backoffice)/backoffice/imoveis/page.tsx` |
| `/backoffice/leads` | `src/app/(backoffice)/backoffice/leads/page.tsx` |
| `/backoffice/agenda` | `src/app/(backoffice)/backoffice/agenda/page.tsx` |
| `/backoffice/parcerias` | `src/app/(backoffice)/backoffice/parcerias/page.tsx` |
| `/backoffice/settings` | `src/app/(backoffice)/backoffice/settings/page.tsx` |
| `/backoffice/connect` | `src/app/(backoffice)/backoffice/connect/page.tsx` |
| `/backoffice/financeiro` | `src/app/(backoffice)/backoffice/financeiro/page.tsx` |
| `/backoffice/marketing` | `src/app/(backoffice)/backoffice/marketing/page.tsx` |
| Website `/*` | `src/app/[lang]/(website)/*` |
| API `/api/*` | `src/app/api/*` |

### 2.4 Corrigir

1. Identificar o bug no código
2. Aplicar a correção mínima necessária
3. Verificar se não quebra outros componentes
4. Rodar `npm run build` para confirmar que compila

### 2.5 Atualizar status do bug

```typescript
// PATCH /api/bug-reports/[id]
fetch(`/api/bug-reports/${bugId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'resolved', // ou 'investigating', 'in_progress', 'wont_fix'
    admin_notes: 'Corrigido: [descrição da correção aplicada]',
  }),
})
```

### 2.6 Commitar e fazer deploy

```bash
git add -A
git commit -m "fix: [título do bug] — resolves bug report #[id]"
git push origin main
# Vercel faz deploy automático via youthful-fermi
```

---

## 3. Tabela `bug_reports` — Schema

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK auto-generated |
| `created_by` | UUID | FK → auth.users |
| `title` | TEXT | Título do bug (max 300) |
| `description` | TEXT | Descrição detalhada (max 5000) |
| `severity` | TEXT | `low`, `medium`, `high`, `critical` |
| `category` | TEXT | `geral`, `visual`, `funcionalidade`, `performance`, `mobile`, `dados`, `seguranca` |
| `screenshot_urls` | TEXT[] | URLs de screenshots (max 5) |
| `page_url` | TEXT | URL onde o bug ocorreu |
| `user_agent` | TEXT | Browser/OS do usuário |
| `console_errors` | TEXT | Erros do console |
| `status` | TEXT | `open` → `investigating` → `in_progress` → `resolved`/`wont_fix`/`closed` |
| `admin_notes` | TEXT | Notas do admin/agente |
| `resolved_at` | TIMESTAMPTZ | Data de resolução |
| `resolved_by` | UUID | Quem resolveu |
| `created_at` | TIMESTAMPTZ | Data de criação |

---

## 4. Tabela `system_error_logs` — Erros Automáticos

Além dos bug reports manuais, erros do frontend são logados automaticamente via `POST /api/system/report-error`.

```bash
# Consultar erros recentes
SELECT * FROM system_error_logs
ORDER BY created_at DESC LIMIT 20;
```

---

## 5. Arquivos-Chave do Sistema

| Arquivo | Função |
|---------|--------|
| `src/app/api/bug-reports/route.ts` | POST (criar) + GET (listar) |
| `src/app/api/bug-reports/[id]/route.ts` | PATCH (admin atualiza status) |
| `src/app/api/system/report-error/route.ts` | Erros automáticos do frontend |
| `src/lib/notifications.ts` | `createNotification()` — notifica admin |
| `src/lib/web-push.ts` | Push notifications via VAPID |
| `src/lib/supabase/admin.ts` | `supabaseAdmin` — service role client |
| `src/lib/supabase/server.ts` | `createClient()` — user auth client |
| `src/app/(backoffice)/backoffice/settings/page.tsx` | UI do bug report (tab "Reportar Bug") |
| `src/app/globals.css` | CSS variables do tema |
| `src/app/(backoffice)/lib/theme.ts` | Objeto T com tokens de estilo |
| `src/lib/format.ts` | `fmt()` / `formatCurrency()` centralizados |

---

## 6. Regras de Prioridade

1. **critical** → Resolver imediatamente (receita, segurança, dados)
2. **high** → Resolver no mesmo dia (funcionalidade quebrada)
3. **medium** → Resolver na próxima sessão (UX, visual)
4. **low** → Backlog (melhorias, polish)

---

## 7. Checklist de Qualidade Pós-Fix

- [ ] `npm run build` passa sem erros
- [ ] Fix não introduz regressões em outros componentes
- [ ] CSS variables usadas (nunca hardcode colors)
- [ ] Mobile responsivo verificado (se aplicável)
- [ ] RLS policies não foram relaxadas
- [ ] Auth checks presentes em API routes
- [ ] Status do bug atualizado para `resolved` com `admin_notes`
