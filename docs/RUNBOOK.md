# IMI — Runbook de Incidentes

## 1. Sistema fora do ar (500 errors)

### Diagnóstico
```bash
# Verificar status do Vercel
npx vercel ls --limit 5

# Verificar logs de runtime
npx vercel logs youthful-fermi --limit 50
```

### Ação imediata
1. Verificar Vercel Dashboard → Deployments → último deploy
2. Se o último deploy falhou → Rollback: `npx vercel rollback`
3. Se Supabase está fora → Verificar https://status.supabase.com

### Escalação
- Vercel: https://vercel.com/support
- Supabase: https://supabase.com/support

---

## 2. Domínio não aponta para versão correta

### Causa
O alias `www.iulemirandaimoveis.com.br` pode estar apontando para um deploy antigo.

### Fix
```bash
npx vercel alias set youthful-fermi.vercel.app www.iulemirandaimoveis.com.br
npx vercel alias set youthful-fermi.vercel.app iulemirandaimoveis.com.br
```

### Prevenção
O GitHub Actions workflow `deploy-production.yml` faz isso automaticamente quando `VERCEL_TOKEN` está configurado nos secrets do repo.

---

## 3. Criação de usuários falhando (403/500)

### Causa provável
- `SUPABASE_SERVICE_ROLE_KEY` não configurada no Vercel
- Sem service key, o fallback usa `signUp` que requer confirmação por email

### Fix
1. Supabase Dashboard → Project Settings → API → Service Role Key
2. Vercel Dashboard → Project → Settings → Environment Variables
3. Adicionar `SUPABASE_SERVICE_ROLE_KEY` com o valor

---

## 4. Upload de imagens falhando

### Causa provável
- Bucket sem políticas de RLS (storage)
- Arquivo excede limite de tamanho (2MB default)

### Verificação
```sql
-- No Supabase SQL Editor
SELECT * FROM storage.policies WHERE bucket_id IN ('avatars', 'developers', 'media');
```

### Fix
Se políticas estão ausentes, rodar a migration `fix_storage_policies_avatars_developers`.

---

## 5. Build OOM (Out of Memory)

### Sintoma
```
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

### Fix
- `package.json` usa `NODE_OPTIONS='--max-old-space-size=4096'` (ajustar para 8192 apenas se necessário no ambiente)
- `next.config.js` tem `typescript.ignoreBuildErrors: true` para pular type-checking no build
- Type-check separadamente: `npm run type-check`

---

## 6. Monitoramento

| Serviço | URL | O que monitora |
|---------|-----|----------------|
| Vercel | vercel.com/dashboard | Deploys, funções, erros |
| Supabase | app.supabase.com | Database, auth, storage |
| Sentry | sentry.io | Erros de runtime (quando DSN configurado) |

---

## 7. Contatos de emergência

| Papel | Contato |
|-------|---------|
| Fundadora/CEO | Iule Miranda |
| Infraestrutura | Vercel + Supabase (managed) |
| Código | Repositório GitHub |

---

## 8. RTO/RPO

| Métrica | Valor | Justificativa |
|---------|-------|---------------|
| RTO (Recovery Time Objective) | < 30 min | Rollback via Vercel é instantâneo |
| RPO (Recovery Point Objective) | < 24h | Supabase backups diários (plano Pro) |

### Procedimento de Recovery
1. **Aplicação**: `npx vercel rollback` (< 1 min)
2. **Banco de dados**: Supabase Dashboard → Database → Backups → Restore
3. **Dados de storage**: Supabase Storage backups (verificar plano)
