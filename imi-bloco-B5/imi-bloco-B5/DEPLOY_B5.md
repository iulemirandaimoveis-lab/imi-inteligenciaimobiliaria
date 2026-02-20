# BLOCO B5 — INSTRUÇÃO DE DEPLOY
## IMI Atlantis — Módulo Avaliações Completo + Imóveis + Crédito

---

## ARQUIVOS ENTREGUES

### Avaliações (NOVO — 5 etapas NBR 14653 completo)
```
src/app/(backoffice)/backoffice/avaliacoes/
├── page.tsx                    ← Lista com KPIs + filtros + honorários
├── nova/page.tsx               ← 5 etapas: Imóvel > Cliente > Avaliação > Comparáveis > Docs
├── email-honorarios/page.tsx   ← Interpretador de email IA + proposta automática
└── exercicios/page.tsx         ← Treino diário NBR 14653 com geração IA
```

### Imóveis (NOVO — Nível ZAP)
```
src/app/(backoffice)/backoffice/imoveis/page.tsx  ← Grid/Lista + filtros avançados + FIPE ZAP
```

### Crédito (NOVO — Simulador completo)
```
src/app/(backoffice)/backoffice/credito/page.tsx  ← Operações + Simulador PRICE/SAC
```

### Components
```
src/app/(backoffice)/components/DesktopSidebar.tsx  ← Sidebar atualizada com todos os sub-menus
```

### SQL
```
022_avaliacoes_completo.sql  ← Execute no Supabase SQL Editor
```

---

## PASSO A PASSO DE DEPLOY

### 1. Copiar arquivos para o projeto
```bash
# Na raiz do projeto imi-atlantis-main

# Avaliações
cp [B5]/avaliacoes/page.tsx src/app/\(backoffice\)/backoffice/avaliacoes/page.tsx
cp [B5]/avaliacoes/nova/page.tsx src/app/\(backoffice\)/backoffice/avaliacoes/nova/page.tsx
cp [B5]/avaliacoes/email-honorarios/page.tsx src/app/\(backoffice\)/backoffice/avaliacoes/email-honorarios/page.tsx
cp [B5]/avaliacoes/exercicios/page.tsx src/app/\(backoffice\)/backoffice/avaliacoes/exercicios/page.tsx

# Imóveis
cp [B5]/imoveis/page.tsx src/app/\(backoffice\)/backoffice/imoveis/page.tsx

# Crédito
cp [B5]/credito/page.tsx src/app/\(backoffice\)/backoffice/credito/page.tsx

# Sidebar
cp [B5]/components/DesktopSidebar.tsx src/app/\(backoffice\)/components/DesktopSidebar.tsx
```

### 2. Criar pastas de rotas que não existem
```bash
mkdir -p src/app/\(backoffice\)/backoffice/avaliacoes/email-honorarios
mkdir -p src/app/\(backoffice\)/backoffice/avaliacoes/exercicios
```

### 3. Executar SQL no Supabase
- Abra o Supabase Dashboard > SQL Editor
- Cole e execute o conteúdo de `022_avaliacoes_completo.sql`
- Verifique se criou: avaliacoes, avaliacoes_comparaveis, email_interpretacoes, exercicios_score

### 4. Build local
```bash
cd imi-atlantis-main
npm run build
# Deve passar sem erros
```

### 5. Deploy Vercel
```bash
vercel --prod
```

---

## FUNCIONALIDADES ENTREGUES

### Módulo Avaliações (CEREBRO DO SISTEMA)
- **Nova Avaliação — 5 etapas NBR 14653:**
  - Etapa 1: Dados do imóvel (tipo, área, localização, padrão, características)
  - Etapa 2: Dados do solicitante (PF/PJ, instituição)
  - Etapa 3: Parâmetros + Calculadora de Honorários IBAPE (automática)
  - Etapa 4: Comparáveis com análise estatística em tempo real (média, CV%, validação de grau)
  - Etapa 5: Upload de documentos + links RI Digital, ONR, FIPE ZAP + resumo final

- **Interpretador de Email com IA:**
  - Cola email de tribunal/banco/particular
  - IA classifica: tipo de entidade, finalidade, metodologia, urgência
  - Calcula honorários automaticamente (IBAPE)
  - Gera rascunho de proposta completo com dados do email
  - Exemplos pré-carregados (TJ-PE, Bradesco, Particular)

- **Exercícios NBR 14653:**
  - 15+ questões categorizadas (Metodologias, Graus, Cálculos, Honorários, Fundamentação)
  - Níveis: Básico, Intermediário, Avançado
  - Sistema de streak e score por categoria
  - Geração ilimitada de questões via IA (Claude API)

### Módulo Imóveis (Nível ZAP)
- Grid/Lista com toggle
- Filtros avançados (preço, área, quartos, tipo, operação)
- KPIs: portfólio total, disponíveis, visualizações, favoritos
- Variação FIPE ZAP por imóvel
- Tags de destaque, status, operação
- Link direto para FIPE ZAP

### Módulo Crédito
- Simulador PRICE e SAC completo
  - Cálculo automático de parcelas
  - LTV em tempo real (alerta se > 80%)
  - Renda mínima necessária
  - Comparativo primeira vs última parcela
- Lista de operações com status
- Link para iniciar processo

---

## PRÓXIMOS PASSOS (B6 — FINAL)

1. **Conectar ao Supabase real** — trocar mock data por queries
2. **Homepage redesign** — Hero premium + trust signals
3. **Build limpo + Vercel prod**
4. **Refinamento de design do backoffice** (como você pediu — após sistema 100% funcional)

---

## NOTAS SOBRE O PDF

O e-book está em formato de imagens escaneadas (sem texto extraível automaticamente).
Para que o motor de IA use o conteúdo do professor como base:

**Opção A (Quando subir o livro):**
- Se vier com texto extraível, integro o conteúdo ao system prompt do interpretador de email e do gerador de laudos
- O sistema de exercícios pode referenciar seções específicas do livro

**Opção B (Provisório):**
- O motor atual usa NBR 14653-1, 14653-2 e tabelas IBAPE como base
- Já cobre: metodologias, graus, cálculos, honorários, fundamentação
- Quando subir logo e dados do CNAI, integro ao modelo de laudo

**Para subir sua logo e dados:**
- Logo: `public/logo-imi.png` (ou .svg)
- Dados profissionais: criar `src/config/avaliador.ts` com nome, CNAI, endereço, telefone
