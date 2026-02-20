# IMI Atlantis — B6 Deployment Guide
## Guia de implantação — Bloco Final

---

## 1. ESTRUTURA DE ARQUIVOS B6

```
COPIAR para src/:
├── app/(backoffice)/backoffice/
│   ├── dashboard/
│   │   ├── page.tsx                ← REPLACE (Server Component com Supabase)
│   │   └── DashboardClient.tsx     ← NEW (UI client)
│   ├── consultorias/
│   │   ├── page.tsx                ← REPLACE (lista completa)
│   │   └── nova/page.tsx           ← REPLACE (form 3 steps)
│   ├── projetos/page.tsx           ← REPLACE (portfólio empreendimentos)
│   └── relatorios/page.tsx         ← REPLACE (geração de relatórios)
└── components/home/
    └── Hero.tsx                    ← REPLACE (redesign premium)
```

---

## 2. SQL — EXECUTE NO SUPABASE

**Arquivo:** `sql/023_b6_consultorias_projetos_dashboard.sql`

1. Acesse: https://app.supabase.com → seu projeto → SQL Editor
2. Cole o conteúdo do arquivo
3. Execute (Run)
4. Verifique no Table Editor: tabelas `consultorias` e `projetos` criadas
5. Verifique em Database → Functions: `get_dashboard_stats` criada

---

## 3. VARIÁVEIS DE AMBIENTE

Confirme que existem no Vercel (Settings → Environment Variables):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   ← necessário para server components
ANTHROPIC_API_KEY=sk-ant-...       ← email interpreter + exercícios
```

---

## 4. BUILD & DEPLOY

```bash
# 1. Na raiz do projeto
npm run build

# Se der erro de imagem:
# Renomeie: public/Kempinski.png → public/kempinski.png
# (Linux é case-sensitive — a URL no código usa minúscula)

# 2. Se build passar:
vercel --prod
```

---

## 5. QA CHECKLIST PÓS-DEPLOY

### Navegação
- [ ] `/` → Homepage abre com Hero redesenhado + stats bar
- [ ] `/backoffice/dashboard` → KPIs carregam (mesmo com fallback mock)
- [ ] `/backoffice/avaliacoes` → lista com KPIs
- [ ] `/backoffice/avaliacoes/nova` → stepper 5 passos funciona
- [ ] `/backoffice/avaliacoes/email-honorarios` → abre sem erro 404
- [ ] `/backoffice/avaliacoes/exercicios` → abre sem erro 404
- [ ] `/backoffice/imoveis` → grid/list toggle funciona
- [ ] `/backoffice/credito` → simulador PRICE/SAC calcula
- [ ] `/backoffice/consultorias` → lista com filtros
- [ ] `/backoffice/consultorias/nova` → stepper 3 passos funciona
- [ ] `/backoffice/projetos` → cards com barra de vendas
- [ ] `/backoffice/relatorios` → grid de relatórios abre
- [ ] `/backoffice/leads` → pipeline funciona
- [ ] `/login` → redireciona corretamente

### Mobile (testar no Chrome DevTools 375px)
- [ ] Header mobile abre/fecha drawer sem bug de z-index
- [ ] Bottom nav visível e clicável
- [ ] Hero responsivo, texto não corta
- [ ] Cards de dashboard empilham em 2 colunas

### Supabase
- [ ] Login funciona (session persiste após F5)
- [ ] Dashboard não mostra erro 500 (fallback mock ativo se tabelas vazias)
- [ ] Formulário avaliação nova salva (verifica na tabela `avaliacoes`)

---

## 6. PRÓXIMOS PASSOS PÓS-B6

### Curto prazo (urgente)
1. **Substituir mock data** nos módulos por queries Supabase reais
   - Pattern: `createClient()` → `supabase.from('tabela').select()` → passar como props ao Client Component
2. **CNAI + CRECI** — inserir números reais no Hero (Trust pills) e no config do avaliador

### Médio prazo
3. **Geração de laudo PDF** — usar Puppeteer ou React-PDF com template NBR 14653
4. **Upload de documentos** — Supabase Storage bucket `laudos` + `documentos`
5. **Email automático** — Resend / Nodemailer ao criar nova avaliação
6. **Integração Anthropic real** — `/api/interpret-email` e `/api/generate-exercise` server actions

### Design refinement (quando sistema 100% funcional)
7. Backoffice: substituir cinzas genéricos por paleta própria
8. Empty states com ilustrações SVG customizadas
9. Loading skeletons por módulo
10. Micro-animações de transição entre páginas

---

## 7. CONFIGURAÇÃO AVALIADOR (preencha com dados reais)

Crie o arquivo `src/config/avaliador.ts`:

```typescript
export const AVALIADOR = {
  nome: 'Iule Miranda',
  cnai: '35.XXX',          // ← inserir número real
  creci: 'PE-25.XXX',      // ← inserir número real
  empresa: 'IMI — Iule Miranda Imóveis',
  endereco: 'Recife, Pernambuco — Brasil',
  telefone: '(81) 9 9723-0455',
  email: 'contato@iulemirandaimoveis.com.br',
  logo: '/logo-imi.png',   // ← garantir que existe em public/
  site: 'www.iulemirandaimoveis.com.br',
}
```

Este arquivo é importado no futuro gerador de laudo PDF e no sistema de honorários.

---

## STATUS DO PROJETO

| Módulo | Status |
|--------|--------|
| Dashboard | ✅ Server Component + Supabase |
| Avaliações (lista + nova + email + exercícios) | ✅ B5 |
| Imóveis | ✅ B5 |
| Crédito | ✅ B5 |
| Consultorias | ✅ B6 |
| Projetos | ✅ B6 |
| Relatórios | ✅ B6 |
| Leads | ✅ B4 |
| Hero Website | ✅ B6 redesign |
| Supabase real data | ⚠️ Mock — conectar por módulo |
| PDF Laudo NBR | 🔜 Próximo sprint |
| SEO metadata | 🔜 Próximo sprint |
