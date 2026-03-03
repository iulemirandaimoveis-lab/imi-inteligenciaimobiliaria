# 🎯 CONFIGURAÇÃO FINALIZADA - PRÓXIMOS PASSOS

## ✅ O Que Já Foi Feito

1. **API Keys Configuradas** ✅
   - Claude API: Adicionada ao .env
   - Gemini API: Adicionada ao .env

2. **Código Implementado** ✅
   - 7 tabelas SQL prontas
   - 3 API Routes funcionais
   - UI do módulo Conteúdos pronta

---

## 🚀 AGORA: Aplicar Migrations no Supabase

### Opção Recomendada: Via Dashboard (5 minutos)

**Passo 1**: Acesse o SQL Editor do Supabase
```
https://supabase.com/dashboard/project/zocffccwjjyelwrgunhu/sql/new
```

**Passo 2**: Aplique a Migration 004 (Multi-Tenant Core)

1. Clique em **"New Query"**
2. Copie TODO conteúdo do arquivo:
   ```
   supabase/migrations/004_multi_tenant_core.sql
   ```
3. Cole no editor SQL
4. Clique em **"Run"** (ou Ctrl/Cmd + Enter)
5. Aguarde mensagem **"Success"**

**Passo 3**: Aplique a Migration 005 (Content Management)

1. Clique em **"New Query"** novamente
2. Copie TODO conteúdo do arquivo:
   ```
   supabase/migrations/005_content_management.sql
   ```
3. Cole no editor SQL
4. Clique em **"Run"** (ou Ctrl/Cmd + Enter)
5. Aguarde mensagem **"Success"**

**Passo 4**: Verificar se deu certo

Execute este SQL no editor:
```sql
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'tenants', 
  'niche_playbooks', 
  'tenant_users',
  'ai_requests', 
  'content_calendar',
  'content_items', 
  'content_variants'
);
```

✅ **Deve retornar 7 linhas** (uma para cada tabela)

---

## 🎨 Depois das Migrations: Testar o Sistema

### 1. Acessar o Módulo Conteúdos

```bash
# O servidor já está rodando em http://localhost:3000
# Acesse no navegador:
http://localhost:3000/backoffice/conteudos
```

### 2. Login no Backoffice

Se não estiver logado:
```
Email: admin@example.com (ou seu usuário do backoffice)
Senha: sua senha
```

### 3. Criar Primeiro Calendário com IA

1. Clique no botão **"Novo Calendário"**
2. No formulário:
   - **Mês**: Março (ou próximo mês)
   - **Ano**: 2026
   - **Objetivos**: Adicione pelo menos um objetivo
     - Exemplo: "Gerar 50 leads qualificados"
     - Exemplo: "Aumentar awareness da marca"
3. (Opcional) Adicione ofertas especiais ou datas estratégicas
4. Clique em **"Gerar Calendário"**

**O que vai acontecer**:
- ⏳ Loading animation (10-15 segundos)
- 🤖 Claude API processa o pedido
- 📊 Retorna plano com 20-30 posts sugeridos
- 💳 Custo: ~$0.15 USD (será logado na tabela `ai_requests`)
- ✅ Card do calendário aparece na lista

### 4. Ver Logs de IA e Custos

No SQL Editor do Supabase, execute:
```sql
SELECT 
    provider,
    model,
    request_type,
    tokens_input,
    tokens_output,
    cost_usd,
    status,
    created_at
FROM ai_requests
ORDER BY created_at DESC
LIMIT 5;
```

Verá detalhes de cada chamada à Claude/Gemini.

---

## 📊 Estrutura Criada no Banco

Após aplicar as migrations, você terá:

### Tabelas Multi-Tenant
- `tenants` - Workspace da IMI (já criado automaticamente)
- `niche_playbooks` - Playbook "Mercado Imobiliário Brasil" (já criado)
- `tenant_users` - Vínculo entre usuários e tenants

### Tabelas de Conteúdo
- `content_calendar` - Planejamentos mensais
- `content_items` - Posts individuais
- `content_variants` - Variações por canal (Instagram/Facebook/etc)

### Infraestrutura
- `ai_requests` - Logs de todas chamadas IA (custo, tokens, latência)

---

## 🔍 Troubleshooting

### Erro ao aplicar migration
- **Sintaxe SQL**: Certifique-se de copiar TODO o arquivo (não só partes)
- **Ordem**: Execute 004 ANTES de 005
- **Permissões**: Use o SQL Editor do Dashboard (tem permissões de admin)

### Página /backoffice/conteudos não carrega
- ✅ Confirme que migrations foram aplicadas (query de verificação acima)
- ✅ Veja console do navegador (F12) para erros
- ✅ Confirme que servidor está rodando (`npm run dev`)

### Botão "Gerar Calendário" não funciona
- ✅ Verifique API keys no .env (sem espaços extras)
- ✅ Veja console do navegador para erros de autenticação
- ✅ Confirme que está logado no backoffice

### Erro "Invalid API key"
- ✅ Claude key começa com `sk-ant-api03-`
- ✅ Gemini key começa com `AIza`
- ✅ Reinicie servidor após adicionar ao .env

---

## 📚 Documentação Útil

- **Guia Completo**: `docs/COMO_USAR.md`
- **Setup APIs**: `docs/SETUP_AI_APIS.md`
- **Especificação**: `docs/SPEC_SISTEMA_COMERCIAL_IA.md`

---

## ✅ Checklist Final

- [x] API Keys configuradas no .env
- [ ] Migration 004 aplicada no Supabase
- [ ] Migration 005 aplicada no Supabase
- [ ] Verificação SQL retorna 7 tabelas
- [ ] Servidor rodando (`npm run dev`)
- [ ] Página /backoffice/conteudos acessível
- [ ] Primeiro calendário criado com sucesso
- [ ] Logs em `ai_requests` mostram custo

---

**Status Atual**: ✅ **CÓDIGO PRONTO** | 🔄 **AGUARDANDO MIGRATIONS**

**Próxima ação**: Aplicar migrations via Supabase Dashboard (5 minutos) → Testar criação de calendário! 🚀
