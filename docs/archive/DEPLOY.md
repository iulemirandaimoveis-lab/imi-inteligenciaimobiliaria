# 🚀 Guia de Deploy - IMI Atlantis Backoffice

## 📋 Pré-requisitos

- [ ] Conta Vercel ativa
- [ ] Projeto Supabase criado
- [ ] Node.js 18+ instalado
- [ ] Git configurado

---

## 🗄️ PARTE 1: Configuração do Supabase

### 1.1 Criar Projeto no Supabase

1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha:
   - **Name**: `imi-atlantis`
   - **Database Password**: (anote em local seguro)
   - **Region**: `South America (São Paulo)`
4. Aguarde ~2 minutos para o projeto ser criado

### 1.2 Executar Migrations SQL

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **New Query**
3. Cole o conteúdo de `supabase/migrations/001_backoffice_schema.sql`
4. Clique em **Run** (canto inferior direito)
5. Aguarde a mensagem "Success. No rows returned"

**✅ Checkpoint**: Verifique em **Table Editor** se as tabelas foram criadas:
- leads
- developers
- developments
- credit_applications
- evaluations
- campaigns
- notifications
- team_members
- settings

### 1.3 Criar Usuário Admin

1. No Supabase Dashboard, vá em **Authentication** > **Users**
2. Clique em **Add User** > **Create new user**
3. Preencha:
   - **Email**: `laila@iulemirandaimoveis.com.br`
   - **Password**: (senha forte, anote)
   - **Auto Confirm User**: ✅ (marque)
4. Clique em **Create user**
5. **COPIE O UUID** do usuário criado (ex: `a1b2c3d4-...`)

### 1.4 Inserir Dados de Exemplo

1. Abra `supabase/migrations/002_sample_data.sql`
2. **Substitua** todas as ocorrências de `YOUR-ADMIN-USER-UUID` pelo UUID copiado
3. **Descomente** as seções comentadas (remova `/*` e `*/`)
4. No **SQL Editor**, cole o SQL modificado
5. Clique em **Run**

**✅ Checkpoint**: Verifique em **Table Editor**:
- `team_members`: 1 registro (você)
- `leads`: 3 registros
- `developments`: 2 registros
- `campaigns`: 1 registro

### 1.5 Configurar Storage (Opcional - para imagens)

1. Vá em **Storage**
2. Clique em **Create a new bucket**
3. Nome: `developments`
4. **Public bucket**: ✅ (marque)
5. Repita para criar buckets:
   - `documents` (privado)
   - `avatars` (público)

### 1.6 Copiar Credenciais

1. Vá em **Project Settings** > **API**
2. Copie:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (chave longa)

---

## 🌐 PARTE 2: Deploy no Vercel

### 2.1 Preparar Variáveis de Ambiente

1. Crie/edite `.env.local` na raiz do projeto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Site
NEXT_PUBLIC_SITE_URL=https://www.iulemirandaimoveis.com.br
```

2. **Substitua** os valores pelas credenciais copiadas do Supabase

### 2.2 Testar Localmente

```bash
# Instalar dependências
npm install

# Build de produção
npm run build

# Testar localmente
npm run start
```

Acesse http://localhost:3000/backoffice e faça login com:
- **Email**: `laila@iulemirandaimoveis.com.br`
- **Senha**: (a que você criou no Supabase)

**✅ Checkpoint**: Você deve ver o dashboard com dados de exemplo

### 2.3 Commit e Push

```bash
git add .
git commit -m "feat: Backoffice 100% completo com Supabase integration"
git push origin main
```

### 2.4 Deploy no Vercel

#### Opção A: Via Dashboard (Recomendado)

1. Acesse https://vercel.com/dashboard
2. Clique em **Add New...** > **Project**
3. Selecione o repositório `imi-atlantis`
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

5. Clique em **Environment Variables**
6. Adicione as variáveis:
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
   NEXT_PUBLIC_SITE_URL = https://www.iulemirandaimoveis.com.br
   ```

7. Clique em **Deploy**
8. Aguarde ~3 minutos

#### Opção B: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Quando solicitado, adicione as env vars
```

### 2.5 Configurar Domínio Customizado

1. No Vercel Dashboard, vá em **Settings** > **Domains**
2. Adicione: `www.iulemirandaimoveis.com.br`
3. Siga as instruções para configurar DNS

---

## ✅ PARTE 3: Verificação Final

### 3.1 Checklist de Funcionalidades

Teste no ambiente de produção:

- [ ] **Login**: `/backoffice/login`
- [ ] **Dashboard**: `/backoffice/dashboard`
- [ ] **Leads**: `/backoffice/leads` (lista + detalhes)
- [ ] **Imóveis**: `/backoffice/imoveis` (lista + detalhes)
- [ ] **Crédito**: `/backoffice/credito` (simulador + lista)
- [ ] **Avaliações**: `/backoffice/avaliacoes` (nova + lista)
- [ ] **Campanhas**: `/backoffice/campanhas` (nova + analytics)
- [ ] **Equipe**: `/backoffice/equipe`
- [ ] **Notificações**: `/backoffice/notificacoes`
- [ ] **Settings**: `/backoffice/settings`

### 3.2 Testes de Integração

- [ ] Criar novo lead
- [ ] Editar lead existente
- [ ] Criar nova campanha
- [ ] Visualizar analytics
- [ ] Atualizar settings

### 3.3 Performance

Execute no Chrome DevTools > Lighthouse:
- [ ] Performance: > 90
- [ ] Accessibility: > 95
- [ ] Best Practices: > 90
- [ ] SEO: > 90

---

## 🔧 PARTE 4: Configurações Adicionais (Opcional)

### 4.1 Configurar Email (Supabase)

1. Vá em **Authentication** > **Email Templates**
2. Customize os templates de:
   - Confirmação de email
   - Reset de senha
   - Magic link

### 4.2 Configurar Webhooks

1. Vá em **Database** > **Webhooks**
2. Crie webhooks para:
   - Novos leads → Notificação
   - Crédito aprovado → Email

### 4.3 Analytics

1. Adicione Google Analytics ID em Settings
2. Configure Facebook Pixel
3. Integre WhatsApp Business API

---

## 📊 Monitoramento

### Logs do Vercel
```bash
vercel logs --follow
```

### Logs do Supabase
1. Dashboard > **Logs**
2. Filtre por tipo (API, Auth, Database)

---

## 🆘 Troubleshooting

### Erro: "Invalid API key"
- Verifique se as env vars estão corretas no Vercel
- Redeploye após adicionar variáveis

### Erro: "Row Level Security"
- Execute novamente o SQL de RLS policies
- Verifique se o usuário está na tabela `team_members`

### Erro: "Build failed"
- Execute `npm run build` localmente
- Verifique erros de TypeScript
- Limpe cache: `rm -rf .next node_modules && npm install`

### Página em branco
- Verifique console do navegador (F12)
- Confirme que as env vars estão no Vercel
- Teste em modo incógnito

---

## 📞 Suporte

- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/docs
- **Next.js**: https://nextjs.org/docs

---

## 🎉 Conclusão

Seu Backoffice IMI Atlantis está **100% funcional** em produção!

**URLs Importantes:**
- **Produção**: https://www.iulemirandaimoveis.com.br
- **Backoffice**: https://www.iulemirandaimoveis.com.br/backoffice
- **Supabase**: https://supabase.com/dashboard/project/xxxxx
- **Vercel**: https://vercel.com/dashboard

**Próximos Passos:**
1. ✅ Treinar equipe no uso do Backoffice
2. ✅ Configurar integrações (WhatsApp, Analytics)
3. ✅ Importar leads existentes
4. ✅ Configurar automações de email
5. ✅ Monitorar performance e ajustar

---

**Desenvolvido com ❤️ por Antigravity AI**
