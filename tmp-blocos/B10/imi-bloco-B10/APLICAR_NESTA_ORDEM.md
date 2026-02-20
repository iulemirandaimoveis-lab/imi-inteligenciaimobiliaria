# IMI Atlantis — GUIA DE APLICAÇÃO DEFINITIVO
## B5 → B10 | Ordem exata de execução

> Execute cada passo na ordem indicada. Não pule etapas.
> Tempo estimado: 20 minutos para aplicar tudo + 5 min de build.

---

## PRÉ-REQUISITO

```bash
# Na raiz do projeto (onde está package.json)
# Confirme que está no diretório correto:
ls package.json next.config.js
```

---

## PASSO 1 — SUPABASE SQL (execute em ordem no SQL Editor)

Acesse: https://app.supabase.com → SQL Editor

**1.1** Execute o conteúdo de: `B5/sql/022_avaliacoes_completo.sql`
**1.2** Execute o conteúdo de: `B6/sql/023_b6_consultorias_projetos_dashboard.sql`

Verifique no Table Editor que existem as tabelas:
`leads`, `avaliacoes`, `developments`, `consultorias`, `projetos`

---

## PASSO 2 — VARIÁVEIS DE AMBIENTE

Confirme no Vercel (Settings → Environment Variables) ou no `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SITE_URL=https://www.iulemirandaimoveis.com.br
```

---

## PASSO 3 — COPIAR ARQUIVOS (ordem obrigatória)

### 3.1 — LIB (dependência do B9, copiar PRIMEIRO)

```
B9/src/lib/page-metadata.ts  →  src/lib/page-metadata.ts
```

### 3.2 — SEO raiz

```
B9/src/app/sitemap.ts   →  src/app/sitemap.ts
B9/src/app/robots.ts    →  src/app/robots.ts
```

### 3.3 — B5 (módulos operacionais)

```
B5/avaliacoes/page.tsx                →  src/app/(backoffice)/backoffice/avaliacoes/page.tsx
B5/avaliacoes/nova/page.tsx           →  src/app/(backoffice)/backoffice/avaliacoes/nova/page.tsx
B5/imoveis/page.tsx                   →  src/app/(backoffice)/backoffice/imoveis/page.tsx
B5/credito/page.tsx                   →  src/app/(backoffice)/backoffice/credito/page.tsx
B5/components/DesktopSidebar.tsx      →  src/app/(backoffice)/components/DesktopSidebar.tsx
```

### 3.4 — B6 (dashboard + módulos secundários)

```
B6/src/app/(backoffice)/backoffice/dashboard/page.tsx            →  src/app/(backoffice)/backoffice/dashboard/page.tsx
B6/src/app/(backoffice)/backoffice/dashboard/DashboardClient.tsx →  src/app/(backoffice)/backoffice/dashboard/DashboardClient.tsx
B6/src/app/(backoffice)/backoffice/consultorias/page.tsx         →  src/app/(backoffice)/backoffice/consultorias/page.tsx
B6/src/app/(backoffice)/backoffice/consultorias/nova/page.tsx    →  src/app/(backoffice)/backoffice/consultorias/nova/page.tsx
B6/src/app/(backoffice)/backoffice/projetos/page.tsx             →  src/app/(backoffice)/backoffice/projetos/page.tsx
B6/src/app/(backoffice)/backoffice/relatorios/page.tsx           →  src/app/(backoffice)/backoffice/relatorios/page.tsx
B6/src/components/home/Hero.tsx                                  →  src/components/home/Hero.tsx
```

### 3.5 — B7 (playbooks + config)

```
B7/src/app/(backoffice)/backoffice/playbooks/page.tsx  →  src/app/(backoffice)/backoffice/playbooks/page.tsx
B7/src/config/avaliador.ts                             →  src/config/avaliador.ts   (criar pasta config/)
```
⚠️ Preencha CNAI e CRECI reais em `src/config/avaliador.ts` antes de publicar.

### 3.6 — B8 (API routes seguras + páginas corrigidas)

```
# Criar pasta: src/app/api/avaliacoes/
B8/src/app/api/avaliacoes/interpretar-email/route.ts  →  src/app/api/avaliacoes/interpretar-email/route.ts
B8/src/app/api/avaliacoes/gerar-exercicio/route.ts    →  src/app/api/avaliacoes/gerar-exercicio/route.ts

# Substituir versões do B5 (B8 tem a versão corrigida com server route):
B8/src/app/(backoffice)/backoffice/avaliacoes/email-honorarios/page.tsx  →  src/app/(backoffice)/backoffice/avaliacoes/email-honorarios/page.tsx
B8/src/app/(backoffice)/backoffice/avaliacoes/exercicios/page.tsx        →  src/app/(backoffice)/backoffice/avaliacoes/exercicios/page.tsx
```

### 3.7 — B9 (website projetos + SEO layouts)

```
B9/src/app/[lang]/(website)/projetos/page.tsx         →  src/app/[lang]/(website)/projetos/page.tsx
B9/src/app/[lang]/(website)/avaliacoes/layout.tsx     →  src/app/[lang]/(website)/avaliacoes/layout.tsx
B9/src/app/[lang]/(website)/credito/layout.tsx        →  src/app/[lang]/(website)/credito/layout.tsx
B9/src/app/[lang]/(website)/consultoria/layout.tsx    →  src/app/[lang]/(website)/consultoria/layout.tsx
B9/src/app/[lang]/(website)/imoveis/layout.tsx        →  src/app/[lang]/(website)/imoveis/layout.tsx
B9/src/app/[lang]/(website)/projetos/layout.tsx       →  src/app/[lang]/(website)/projetos/layout.tsx
B9/src/app/[lang]/(website)/sobre/layout.tsx          →  src/app/[lang]/(website)/sobre/layout.tsx
B9/src/app/[lang]/(website)/contato/layout.tsx        →  src/app/[lang]/(website)/contato/layout.tsx
B9/src/app/[lang]/(website)/inteligencia/layout.tsx   →  src/app/[lang]/(website)/inteligencia/layout.tsx
```

---

## PASSO 4 — CORREÇÃO DE CASE (Linux é case-sensitive)

```bash
# Se existir Kempinski.png com K maiúsculo:
ls public/ | grep -i kempinski
# Se retornar "Kempinski.png":
mv public/Kempinski.png public/kempinski.png
```

---

## PASSO 5 — BUILD LOCAL

```bash
npm run build
```

**Se aparecer erro de TypeScript:** Ignorado — `next.config.js` tem `ignoreBuildErrors: true`.

**Se aparecer erro de módulo não encontrado:**
- Verifique se copiou `src/lib/page-metadata.ts` (Passo 3.1)
- Verifique se copiou na ordem correta

**Build limpo esperado:** `✓ Compiled successfully` ou `✓ Generating static pages`

---

## PASSO 6 — DEPLOY

```bash
vercel --prod
```

Ou via Vercel Dashboard: Deployments → Trigger Deploy.

---

## PASSO 7 — QA PÓS-DEPLOY (checklist mínimo)

### Rotas website (público)
- [ ] `/` — Homepage carrega com Hero animado
- [ ] `/pt/avaliacoes` — Página avaliações com formulário
- [ ] `/pt/credito` — Simulador funciona
- [ ] `/pt/consultoria` — Página completa
- [ ] `/pt/projetos` — Reserva Atlantis em destaque
- [ ] `/pt/sobre` — Sobre IMI
- [ ] `/pt/contato` — Formulário envia lead
- [ ] `/sitemap.xml` — Sitemap gerado

### Backoffice (autenticado)
- [ ] `/login` → redireciona para `/backoffice/dashboard` após login
- [ ] Dashboard carrega KPIs (mesmo que sejam mock data)
- [ ] `/backoffice/avaliacoes/nova` — 5 steps funcionam
- [ ] `/backoffice/avaliacoes/email-honorarios` — análise de email funciona
- [ ] `/backoffice/avaliacoes/exercicios` — quiz NBR funciona
- [ ] `/backoffice/playbooks` — checklists interativos

### Mobile (375px)
- [ ] Header mobile abre/fecha sem bug
- [ ] Bottom nav visível e clicável
- [ ] Cards KPI empilham corretamente

---

## PROBLEMAS CONHECIDOS (não bloqueiam deploy)

| Problema | Impacto | Solução futura |
|---|---|---|
| `/about-profile.jpg` não existe | Broken image na página Sobre | Adicionar foto profissional em `public/` |
| `/hero-bg.jpg` não existe | Hero com fundo escuro sem foto | Adicionar imagem em `public/` |
| Mock data nos módulos | Dashboard mostra dados fictícios | Conectar Supabase por módulo (B11) |
| Recharts v3 API parcialmente incompatível | Gráficos de campanhas/timeline podem ter warnings | Atualizar sintaxe conforme uso |

---

## CONFIGURAÇÃO FINAL ANTES DO GO-LIVE

**1. `src/config/avaliador.ts`** — preencher dados reais:
```typescript
cnai: '35.XXX',           // número CNAI real
creci: 'PE-25.XXX',       // número CRECI real
cnpj: '00.000.000/0001-00',
telefone: '(81) 9 9723-0455',
```

**2. `src/lib/page-metadata.ts`** — verificar URL do site:
```typescript
const BASE = 'https://www.iulemirandaimoveis.com.br'  // confirmar domínio
```

**3. Imagens obrigatórias em `public/`:**
- `logo-imi.png` — logo em PNG com fundo transparente (400×120px min)
- `og-image.jpg` — imagem Open Graph (1200×630px) para compartilhamento social
- `hero-bg.jpg` — foto de fundo do Hero (1920×1080px)
- `about-profile.jpg` — foto profissional Iule Miranda
