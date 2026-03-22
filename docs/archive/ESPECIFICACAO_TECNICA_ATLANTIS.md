# ESPECIFICAÇÃO TÉCNICA: SISTEMA OPERACIONAL COMERCIAL IMI ATLANTIS

**Versão**: 1.0  
**Data**: 2026-02-08  
**Repositório**: github.com/iulemirandaimoveis-lab/imi-atlantis  
**Produto Comercial**: Connectar (SaaS Multi-tenant)

---

## 1. DIAGNÓSTICO DO BACKOFFICE ATUAL

### 1.1 Infraestrutura Existente

**Stack Tecnológica**:
- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- TailwindCSS + Framer Motion
- Anthropic Claude 3.5 Sonnet
- Google Gemini (geração imagens)

**Migrations SQL Implementadas** (8 arquivos):
1. `001_backoffice.sql` - Estrutura base
2. `002_backoffice_complete.sql` - Complementos
3. `003_international_media.sql` - Media internacional
4. `004_multi_tenant_core.sql` - Multi-tenancy + IA logs
5. `005_content_management.sql` - Gestão conteúdo
6. `006_ads_management.sql` - Gestão anúncios
7. `007_crm_prescriptive.sql` - CRM prescritivo
8. `008_social_publishing.sql` - Publicação social

**Tabelas Core Existentes** (17 tabelas):
- `tenants` - Workspaces multi-tenant
- `niche_playbooks` - Templates por nicho
- `tenant_users` - Vínculo usuários/tenants
- `ai_requests` - Log completo chamadas IA
- `content_calendar` - Calendários mensais
- `content_items` - Posts criados
- `content_variants` - Variantes por canal
- `ads_accounts`, `ads_campaigns`, `ads_metrics`, `ads_insights`
- `leads`, `lead_interactions`, `lead_follow_ups`, `lead_scoring_history`
- `social_accounts`, `content_publications`, `publishing_queue`

**Páginas Backoffice Existentes**:
- `/backoffice/dashboard` - Dashboard principal
- `/backoffice/imoveis` - Gestão imóveis
- `/backoffice/leads` - CRM com scoring IA
- `/backoffice/conteudos` - Calendário + editor posts
- `/backoffice/ads` - Dashboard anúncios
- `/backoffice/consultations` - Consultorias
- `/backoffice/avaliacoes` - Avaliações
- `/backoffice/construtoras` - Construtoras
- `/backoffice/credito` - Crédito imobiliário
- `/backoffice/settings` - Configurações

**APIs Implementadas** (9 rotas):
- `POST /api/ai/generate-calendar` - Calendário mensal Claude
- `POST /api/ai/generate-content` - Post individual Claude
- `POST /api/ai/generate-image` - Imagem Gemini
- `POST /api/ai/generate-from-suggestion` - Post do plano
- `POST /api/ai/analyze-campaign` - Análise campanha Claude
- `POST /api/ai/qualify-lead` - Qualificação lead Claude
- `POST /api/publish` - Publicação redes sociais
- `POST /api/upload` - Upload arquivos
- `POST /api/tracking/time` - Tracking tempo

### 1.2 Módulos Implementados (Status Atual)

**✅ Módulo Conteúdos (100%)**:
- Planejamento mensal com Claude (plano estratégico + 30 posts)
- Geração posts individuais (copy + CTA + hashtags)
- Editor visual completo
- Geração imagens Gemini
- Variantes por canal (Instagram/Facebook/LinkedIn/Twitter)
- Sistema aprovação
- Agendamento publicação
- Publicação automática (5 plataformas simuladas)

**🟡 Módulo Ads (60%)**:
- Dashboard consolidado Google Ads + Meta Ads
- Upload CSV + análise Claude
- Insights prescritivos com benchmarks
- Cálculo economia potencial
- **Pendente**: OAuth real + sync automático

**🟡 Módulo CRM (50%)**:
- Qualificação automática leads (Claude)
- Scoring 0-100
- Priorização (critical/high/medium/low)
- Sugestões follow-up
- Histórico interações
- **Pendente**: Automação WhatsApp + email sequences

### 1.3 Gaps Identificados

**Módulos Ausentes**:
1. Playbooks editáveis por nicho
2. Automação completa postagens (OAuth real)
3. Ads com execução (pausar/ativar campanhas)
4. CRM com automação completa
5. Relatórios executivos
6. Analytics consolidado
7. WhatsApp Business API
8. Gestão permissões granular

**Funcionalidades Transversais Ausentes**:
- Versionamento playbooks
- Histórico auditoria completo
- Permissões por perfil (além de RLS)
- Internacionalização (i18n)
- Testes automatizados
- Documentação técnica

---

## 2. ARQUITETURA GERAL DOS NOVOS MÓDULOS

### 2.1 Princípios Arquiteturais

**Multi-tenancy First**:
- Isolamento total por `tenant_id`
- RLS em todas tabelas
- Playbooks compartilháveis entre tenants
- Configurações por tenant (cores, tom, IA)

**IA como Motor Interno**:
- Claude: planejamento, análise, recomendações, qualificação
- Gemini: geração imagens apenas
- Nenhuma IA executa ações sem aprovação humana
- Todos prompts parametrizados por nicho via playbooks

**Parametrização por Nicho**:
- Zero hardcoding de mercado imobiliário
- Playbooks versionáveis e editáveis
- Linguagem, públicos, restrições legais por nicho
- Templates de campanhas por nicho

**Auditabilidade Total**:
- Log de todas chamadas IA (`ai_requests`)
- Histórico de mudanças (triggers)
- Rastreamento ações por usuário
- Custos por tenant rastreáveis

### 2.2 Camadas da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                    │
│  Backoffice Multi-tenant + Site Público por Tenant      │
└─────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│                   API LAYER (Next.js)                    │
│  /api/ai/* | /api/publish | /api/crm/* | /api/reports   │
└─────────────────────────────────────────────────────────┘
                            │
┌──────────────────┬──────────────────┬──────────────────┐
│   IA SERVICES    │  INTEGRATIONS    │   AUTOMATION     │
│  Claude (text)   │  Meta API        │  N8N/Temporal    │
│  Gemini (image)  │  Google Ads API  │  Cron Jobs       │
│                  │  LinkedIn API    │  Queue Workers   │
│                  │  WhatsApp API    │                  │
└──────────────────┴──────────────────┴──────────────────┘
                            │
┌─────────────────────────────────────────────────────────┐
│              DATABASE (Supabase PostgreSQL)              │
│  Multi-tenant + RLS + Triggers + Views + Functions      │
└─────────────────────────────────────────────────────────┘
```

### 2.3 Fluxo de Dados

**Entrada de Dados**:
1. Operador configura tenant (nicho, playbook, identidade visual)
2. Playbook define linguagem, públicos, restrições
3. Operador cria calendário/campanha/lead
4. Sistema parametriza prompt Claude com dados do playbook
5. Claude gera output estruturado (JSON)
6. Sistema salva + exibe para aprovação humana
7. Após aprovação, executa ação (publicar, enviar, pausar)

**Saída de Dados**:
- Posts publicados em redes sociais
- Campanhas pausadas/ativadas via APIs
- Mensagens WhatsApp enviadas
- Emails de follow-up enviados
- Relatórios executivos gerados

---

## 3. ESPECIFICAÇÃO MÓDULO A MÓDULO

### 3.1 Módulo Playbooks por Nicho

**Objetivo**: Parametrizar todo comportamento do sistema por nicho de mercado.

**Tabelas SQL**:

```sql
-- Já existe: niche_playbooks
-- Adicionar campos:
ALTER TABLE niche_playbooks ADD COLUMN content_guidelines JSONB DEFAULT '{}';
ALTER TABLE niche_playbooks ADD COLUMN crm_scripts JSONB DEFAULT '{}';
ALTER TABLE niche_playbooks ADD COLUMN whatsapp_templates JSONB DEFAULT '[]';
ALTER TABLE niche_playbooks ADD COLUMN email_templates JSONB DEFAULT '[]';

-- Nova tabela: playbook_versions (versionamento)
CREATE TABLE playbook_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID REFERENCES niche_playbooks(id) ON DELETE CASCADE,
    version INT NOT NULL,
    changes_summary TEXT,
    changed_by UUID REFERENCES auth.users(id),
    snapshot JSONB NOT NULL, -- Snapshot completo do playbook
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Estrutura Playbook Completo**:

```typescript
interface NichePlaybook {
    // Identificação
    slug: string;
    name: string;
    niche: string;
    version: number;
    
    // Linguagem
    default_language: {
        greetings: string[];
        objections_handling: Record<string, string>;
        CTAs: string[];
        tone_modifiers: string[]; // "técnico", "casual", "formal"
    };
    
    // Conteúdo
    content_guidelines: {
        forbidden_terms: string[]; // Ex: "garantia de lucro"
        required_disclaimers: string[];
        hashtag_strategy: string;
        post_length_limits: Record<string, number>;
        image_style: string; // "profissional", "lifestyle", "técnico"
    };
    
    // CRM
    crm_scripts: {
        qualification_questions: string[];
        objection_responses: Record<string, string>;
        follow_up_sequences: FollowUpSequence[];
    };
    
    // Templates
    whatsapp_templates: WhatsAppTemplate[];
    email_templates: EmailTemplate[];
    
    // Públicos
    typical_audiences: string[];
    
    // Legal
    legal_restrictions: string;
    
    // Campanhas
    campaign_templates: CampaignTemplate[];
}
```

**API Routes**:
- `GET /api/playbooks` - Lista playbooks
- `GET /api/playbooks/[id]` - Detalhes playbook
- `POST /api/playbooks` - Cria playbook (admin)
- `PUT /api/playbooks/[id]` - Atualiza playbook (cria versão)
- `GET /api/playbooks/[id]/versions` - Histórico versões

**Página Backoffice**:
- `/backoffice/playbooks` - Lista playbooks disponíveis
- `/backoffice/playbooks/[id]` - Editor completo playbook
- `/backoffice/settings/playbook` - Vincular playbook ao tenant

**Fluxo IA**:
- Claude NÃO edita playbooks
- Playbooks são inputs para prompts Claude
- Exemplo: `"Gere post seguindo tom: ${playbook.default_language.tone_modifiers}"`

---

### 3.2 Módulo Automação Postagens (Completar)

**Objetivo**: Publicação real em redes sociais via OAuth.

**Integrações Necessárias**:

**Meta Business API** (Facebook + Instagram):
```typescript
// OAuth Flow
1. Redirecionar para: https://www.facebook.com/v18.0/dialog/oauth
2. Receber code
3. Trocar por access_token
4. Salvar em social_accounts

// Publicar
POST https://graph.facebook.com/v18.0/{page-id}/feed
POST https://graph.facebook.com/v18.0/{ig-user-id}/media
```

**LinkedIn API**:
```typescript
// OAuth 2.0
1. Redirecionar para: https://www.linkedin.com/oauth/v2/authorization
2. Trocar code por token
3. Publicar: POST https://api.linkedin.com/v2/ugcPosts
```

**WhatsApp Business API**:
```typescript
// Cloud API (Meta)
POST https://graph.facebook.com/v18.0/{phone-number-id}/messages
{
  "messaging_product": "whatsapp",
  "to": "{recipient}",
  "type": "template",
  "template": { "name": "{template_name}" }
}
```

**Tabelas SQL** (já existem, adicionar):

```sql
-- Adicionar à social_accounts
ALTER TABLE social_accounts ADD COLUMN scopes TEXT[];
ALTER TABLE social_accounts ADD COLUMN page_id TEXT; -- Para Facebook
ALTER TABLE social_accounts ADD COLUMN ig_user_id TEXT; -- Para Instagram

-- Nova tabela: whatsapp_conversations
CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    lead_id UUID REFERENCES leads(id),
    phone_number TEXT NOT NULL,
    status TEXT DEFAULT 'active', -- active, closed
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nova tabela: whatsapp_messages
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES whatsapp_conversations(id),
    direction TEXT NOT NULL, -- inbound, outbound
    message_type TEXT, -- text, image, template
    content TEXT,
    media_url TEXT,
    template_name TEXT,
    status TEXT, -- sent, delivered, read, failed
    external_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Routes**:
- `GET /api/oauth/meta/authorize` - Inicia OAuth Meta
- `GET /api/oauth/meta/callback` - Callback OAuth
- `GET /api/oauth/linkedin/authorize` - Inicia OAuth LinkedIn
- `GET /api/oauth/linkedin/callback` - Callback
- `POST /api/whatsapp/send` - Envia mensagem WhatsApp
- `POST /api/whatsapp/webhook` - Recebe mensagens (webhook)

**Substituir em** `src/lib/social/publisher.ts`:
- Remover simulações
- Implementar chamadas reais às APIs
- Manter mesma interface pública

**Scheduler** (Cron Jobs):
```typescript
// Vercel Cron ou N8N
// A cada hora: processar fila de publicações
GET /api/cron/process-publishing-queue

// Implementação:
import { processPublishingQueue } from '@/lib/social/publisher';
export async function GET() {
    const result = await processPublishingQueue();
    return Response.json(result);
}
```

---

### 3.3 Módulo Ads Prescritivo Completo

**Objetivo**: Análise + execução de ações em campanhas.

**Integrações Necessárias**:

**Google Ads API**:
```typescript
// OAuth 2.0
1. Redirecionar para Google OAuth
2. Scopes: https://www.googleapis.com/auth/adwords
3. API: Google Ads API v15

// Ações
- Listar campanhas: googleads.googleapis.com/v15/customers/{customer_id}/googleAdsService:search
- Pausar campanha: UPDATE campaign SET status = 'PAUSED'
- Ajustar lance: UPDATE ad_group SET cpc_bid_micros = X
```

**Meta Ads API**:
```typescript
// Usar mesmo OAuth do Meta Business
// API: Marketing API v18.0

// Ações
GET /{ad-account-id}/campaigns
POST /{campaign-id} { status: 'PAUSED' }
POST /{adset-id} { bid_amount: 1000 }
```

**Tabelas SQL** (adicionar):

```sql
-- Adicionar à ads_campaigns
ALTER TABLE ads_campaigns ADD COLUMN auto_optimization_enabled BOOLEAN DEFAULT false;
ALTER TABLE ads_campaigns ADD COLUMN optimization_rules JSONB DEFAULT '[]';

-- Nova tabela: ads_actions (log de ações executadas)
CREATE TABLE ads_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    campaign_id UUID REFERENCES ads_campaigns(id),
    action_type TEXT NOT NULL, -- pause, activate, adjust_bid, change_budget
    action_params JSONB,
    reason TEXT, -- Recomendação da IA que motivou
    executed_by UUID REFERENCES auth.users(id),
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    result TEXT, -- success, failed
    error_message TEXT
);
```

**API Routes**:
- `GET /api/oauth/google-ads/authorize`
- `GET /api/oauth/google-ads/callback`
- `POST /api/ads/sync` - Sincroniza campanhas
- `POST /api/ads/pause-campaign` - Pausa campanha
- `POST /api/ads/activate-campaign` - Ativa campanha
- `POST /api/ads/adjust-bid` - Ajusta lance
- `POST /api/ads/apply-recommendation` - Aplica recomendação IA

**Biblioteca** `src/lib/ads/executor.ts`:

```typescript
interface ExecuteAdActionParams {
    platform: 'google_ads' | 'meta_ads';
    action_type: 'pause' | 'activate' | 'adjust_bid' | 'change_budget';
    campaign_id: string;
    params: any;
    reason: string;
    executed_by: string;
}

async function executeAdAction(params: ExecuteAdActionParams) {
    // 1. Validar permissões
    // 2. Chamar API externa (Google/Meta)
    // 3. Salvar em ads_actions
    // 4. Atualizar ads_campaigns
    // 5. Retornar resultado
}
```

**Scheduler**:
```typescript
// Diário: sincronizar métricas
GET /api/cron/sync-ads-metrics

// A cada 6h: analisar campanhas e gerar alertas
GET /api/cron/analyze-campaigns
```

---

### 3.4 Módulo CRM Completo

**Objetivo**: Automação completa de follow-ups.

**Funcionalidades Adicionais**:

**Email Sequences**:
```sql
CREATE TABLE email_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    name TEXT NOT NULL,
    trigger_condition TEXT, -- lead_created, lead_qualified, no_response_7days
    emails JSONB NOT NULL, -- Array de emails com delays
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE email_sequence_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID REFERENCES email_sequences(id),
    lead_id UUID REFERENCES leads(id),
    current_step INT DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, completed, paused
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
```

**WhatsApp Automation**:
```sql
-- Usar whatsapp_conversations e whatsapp_messages já definidos

CREATE TABLE whatsapp_auto_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    trigger_keyword TEXT,
    response_template TEXT,
    is_active BOOLEAN DEFAULT true
);
```

**API Routes**:
- `POST /api/crm/enroll-sequence` - Inscreve lead em sequência
- `POST /api/crm/send-whatsapp` - Envia WhatsApp manual
- `GET /api/crm/conversation/[leadId]` - Histórico conversa
- `POST /api/crm/auto-respond` - Resposta automática

**Scheduler**:
```typescript
// A cada hora: processar email sequences
GET /api/cron/process-email-sequences

// Implementação:
// 1. Buscar enrollments ativos
// 2. Verificar se delay passou
// 3. Enviar próximo email
// 4. Atualizar current_step
```

**Integração Email** (Resend):
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
    from: 'contato@{tenant-domain}',
    to: lead.email,
    subject: emailTemplate.subject,
    html: renderTemplate(emailTemplate.body, lead),
});
```

---

### 3.5 Módulo Relatórios Executivos

**Objetivo**: Relatórios semanais/mensais em linguagem executiva.

**Tabelas SQL**:

```sql
CREATE TABLE executive_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    report_type TEXT NOT NULL, -- weekly, monthly
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Dados consolidados
    summary TEXT, -- Gerado por Claude
    metrics JSONB, -- Métricas numéricas
    insights JSONB, -- Insights da IA
    recommendations JSONB, -- Recomendações
    
    -- Metadata
    generated_by UUID REFERENCES auth.users(id),
    ai_request_id UUID REFERENCES ai_requests(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Estrutura Relatório**:

```typescript
interface ExecutiveReport {
    period: { start: string; end: string };
    summary: string; // Resumo executivo 3-5 frases
    
    metrics: {
        content: {
            posts_created: number;
            posts_published: number;
            total_reach: number;
            total_engagement: number;
        };
        ads: {
            investment: number;
            conversions: number;
            cpa: number;
            roas: number;
        };
        crm: {
            new_leads: number;
            qualified_leads: number;
            conversions: number;
            avg_response_time_hours: number;
        };
    };
    
    insights: string[]; // 5-7 insights principais
    recommendations: string[]; // 3-5 ações recomendadas
    
    cost_breakdown: {
        ai_costs: number;
        ads_investment: number;
        total: number;
    };
}
```

**API Routes**:
- `POST /api/reports/generate` - Gera relatório
- `GET /api/reports` - Lista relatórios
- `GET /api/reports/[id]` - Detalhes relatório
- `GET /api/reports/[id]/pdf` - Download PDF

**Biblioteca** `src/lib/reports/generator.ts`:

```typescript
async function generateExecutiveReport(params: {
    tenant_id: string;
    period_start: string;
    period_end: string;
    report_type: 'weekly' | 'monthly';
}) {
    // 1. Buscar métricas do período
    const metrics = await fetchMetrics(params);
    
    // 2. Chamar Claude para análise
    const analysis = await analyzeWithClaude(metrics, playbook);
    
    // 3. Salvar relatório
    const report = await saveReport({
        ...params,
        metrics,
        summary: analysis.summary,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
    });
    
    // 4. Gerar PDF (opcional)
    // await generatePDF(report);
    
    return report;
}
```

**Scheduler**:
```typescript
// Segunda-feira 8h: relatório semanal
GET /api/cron/generate-weekly-reports

// Dia 1 do mês 8h: relatório mensal
GET /api/cron/generate-monthly-reports
```

**Página Backoffice**:
- `/backoffice/reports` - Lista relatórios
- `/backoffice/reports/[id]` - Visualização relatório

---

## 4. PONTOS DE INTEGRAÇÃO

### 4.1 Integrações Externas Necessárias

| Serviço | Propósito | Autenticação | Custo Estimado |
|---------|-----------|--------------|----------------|
| Meta Business API | Facebook + Instagram posts | OAuth 2.0 | Gratuito |
| LinkedIn API | Posts LinkedIn | OAuth 2.0 | Gratuito |
| Google Ads API | Gestão campanhas | OAuth 2.0 | Gratuito |
| Meta Ads API | Gestão campanhas | OAuth 2.0 | Gratuito |
| WhatsApp Cloud API | Mensagens WhatsApp | Meta OAuth | $0.005/msg |
| Resend | Envio emails | API Key | $0.10/1000 |
| Anthropic Claude | IA texto | API Key | $3-15/1M tokens |
| Google Gemini | IA imagens | API Key | $0.002/imagem |

### 4.2 Webhooks Necessários

**WhatsApp Webhook**:
```typescript
POST /api/webhooks/whatsapp
// Recebe mensagens inbound
// Salva em whatsapp_messages
// Trigger auto-responses se aplicável
```

**Meta Ads Webhook** (opcional):
```typescript
POST /api/webhooks/meta-ads
// Notificações de mudanças em campanhas
// Atualiza ads_campaigns em tempo real
```

### 4.3 Scheduler/Cron Jobs

**Recomendação**: Vercel Cron (gratuito até 100 execuções/dia) ou N8N (self-hosted).

**Jobs Necessários**:
```typescript
// A cada hora
- /api/cron/process-publishing-queue
- /api/cron/process-email-sequences

// A cada 6 horas
- /api/cron/analyze-campaigns
- /api/cron/sync-ads-metrics

// Diário (1x/dia)
- /api/cron/sync-whatsapp-messages
- /api/cron/check-forgotten-leads

// Semanal (segunda 8h)
- /api/cron/generate-weekly-reports

// Mensal (dia 1, 8h)
- /api/cron/generate-monthly-reports
```

---

## 5. ESTRATÉGIA DE PARAMETRIZAÇÃO POR NICHO

### 5.1 Playbooks como Fonte de Verdade

**Fluxo de Parametrização**:
1. Admin cria playbook para nicho (ex: "Clínicas Médicas")
2. Playbook define: linguagem, públicos, restrições, templates
3. Tenant vincula playbook ao criar workspace
4. Sistema usa playbook em TODOS prompts Claude
5. Operador NÃO precisa saber detalhes do nicho

**Exemplo Prompt Parametrizado**:

```typescript
const prompt = `
Você é um especialista em ${playbook.niche}.

Tom de voz: ${playbook.default_language.tone_modifiers.join(', ')}

Público-alvo: ${playbook.typical_audiences.join(', ')}

Restrições legais obrigatórias:
${playbook.legal_restrictions}

Termos proibidos: ${playbook.content_guidelines.forbidden_terms.join(', ')}

TAREFA: Gere um post para ${channel} sobre ${topic}

Estrutura:
- Gancho (1 frase)
- Desenvolvimento (2-3 parágrafos)
- CTA usando uma destas opções: ${playbook.default_language.CTAs.join(' | ')}
- Hashtags seguindo estratégia: ${playbook.content_guidelines.hashtag_strategy}

Retorne JSON:
{
  "copy": "...",
  "cta": "...",
  "hashtags": ["..."]
}
`;
```

### 5.2 Nichos Iniciais Sugeridos

1. **Real Estate** (já implementado)
2. **Clínicas Médicas**
3. **Escritórios Advocacia**
4. **Academias/Fitness**
5. **Restaurantes**
6. **E-commerce Moda**
7. **Consultorias Empresariais**

Cada nicho tem playbook próprio com:
- Linguagem específica
- Restrições legais (CFM, OAB, ANVISA, etc)
- Públicos típicos
- Templates de campanha

---

## 6. STACK SUGERIDA

### 6.1 Stack Atual (Manter)

**Frontend**:
- Next.js 14 (App Router) ✅
- TypeScript ✅
- TailwindCSS + Framer Motion ✅

**Backend**:
- Next.js API Routes ✅
- Supabase (PostgreSQL + Auth + Storage) ✅

**IA**:
- Anthropic Claude 3.5 Sonnet ✅
- Google Gemini Nano Banana Pro ✅

### 6.2 Adições Necessárias

**Scheduler**:
- **Opção A**: Vercel Cron (simples, gratuito até 100/dia)
- **Opção B**: N8N self-hosted (mais flexível, workflows visuais)
- **Recomendação**: Iniciar com Vercel Cron, migrar para N8N se necessário

**Email**:
- **Resend** (API simples, $0.10/1000 emails, domínio próprio)

**PDF Generation**:
- **@react-pdf/renderer** (relatórios executivos)

**OAuth**:
- **next-auth** (gerenciar múltiplos providers OAuth)

**Queue** (opcional, futuro):
- **BullMQ + Redis** (se Vercel Cron não escalar)

### 6.3 Variáveis de Ambiente Adicionais

```bash
# Já existem
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Adicionar
RESEND_API_KEY=
META_APP_ID=
META_APP_SECRET=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=
GOOGLE_ADS_DEVELOPER_TOKEN=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
CRON_SECRET= # Para proteger endpoints cron
```

---

## 7. ROADMAP LÓGICO DE IMPLEMENTAÇÃO

### Fase 1: Fundação (2-3 semanas)

**Sprint 1.1 - Playbooks Editáveis**:
- [ ] Migration playbook_versions
- [ ] Campos adicionais em niche_playbooks
- [ ] API CRUD playbooks
- [ ] Página /backoffice/playbooks
- [ ] Editor playbook completo
- [ ] Versionamento automático

**Sprint 1.2 - OAuth Redes Sociais**:
- [ ] Configurar next-auth
- [ ] OAuth Meta (Facebook + Instagram)
- [ ] OAuth LinkedIn
- [ ] Página /backoffice/settings/integrations
- [ ] Substituir simulações em publisher.ts

**Sprint 1.3 - WhatsApp Business**:
- [ ] Migrations whatsapp_*
- [ ] Integração WhatsApp Cloud API
- [ ] Webhook /api/webhooks/whatsapp
- [ ] Página /backoffice/whatsapp
- [ ] Auto-responses básicas

### Fase 2: Automação (2-3 semanas)

**Sprint 2.1 - Email Sequences**:
- [ ] Migrations email_sequences
- [ ] Integração Resend
- [ ] API enroll/unenroll sequences
- [ ] Cron process-email-sequences
- [ ] Página /backoffice/crm/sequences

**Sprint 2.2 - Ads OAuth + Sync**:
- [ ] OAuth Google Ads
- [ ] OAuth Meta Ads
- [ ] Sync diário métricas
- [ ] Cron sync-ads-metrics
- [ ] Dashboard real-time

**Sprint 2.3 - Ads Executor**:
- [ ] Migration ads_actions
- [ ] Biblioteca ads/executor.ts
- [ ] API pause/activate/adjust
- [ ] Botões ação no dashboard
- [ ] Confirmação antes de executar

### Fase 3: Inteligência (1-2 semanas)

**Sprint 3.1 - Relatórios Executivos**:
- [ ] Migration executive_reports
- [ ] Biblioteca reports/generator.ts
- [ ] Prompt Claude para análise
- [ ] Cron relatórios semanais/mensais
- [ ] Página /backoffice/reports
- [ ] Geração PDF

**Sprint 3.2 - Analytics Consolidado**:
- [ ] View analytics_consolidated
- [ ] Dashboard /backoffice/analytics
- [ ] Comparação períodos
- [ ] Exportação CSV

### Fase 4: Refinamento (1-2 semanas)

**Sprint 4.1 - Permissões Granulares**:
- [ ] Migration user_permissions
- [ ] Middleware permissões
- [ ] UI gerenciar permissões
- [ ] Testes RLS

**Sprint 4.2 - Auditoria Completa**:
- [ ] Migration audit_logs
- [ ] Trigger em todas tabelas críticas
- [ ] Página /backoffice/audit
- [ ] Filtros avançados

**Sprint 4.3 - Testes + Docs**:
- [ ] Testes unitários (Jest)
- [ ] Testes E2E (Playwright)
- [ ] Documentação técnica
- [ ] Guia operador

### Fase 5: Produto Connectar (2-3 semanas)

**Sprint 5.1 - Multi-tenant Completo**:
- [ ] Signup self-service
- [ ] Billing (Stripe)
- [ ] Limites por tier
- [ ] Página pública Connectar

**Sprint 5.2 - Internacionalização**:
- [ ] i18n (next-intl)
- [ ] Traduções EN/ES
- [ ] Playbooks multi-idioma

**Sprint 5.3 - Onboarding**:
- [ ] Wizard setup inicial
- [ ] Templates prontos
- [ ] Tutoriais interativos

---

## 8. RISCOS E MITIGAÇÕES

| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| APIs externas mudam | Alto | Média | Abstrair em adapters, versionar |
| Custos IA explodem | Alto | Baixa | Limites por tenant, cache agressivo |
| OAuth complexo | Médio | Alta | Usar next-auth, documentar bem |
| Performance com multi-tenant | Alto | Média | Índices corretos, RLS otimizado |
| Playbooks mal configurados | Médio | Alta | Validação rigorosa, templates default |
| Scheduler não escala | Médio | Baixa | Migrar para BullMQ se necessário |

---

## 9. MÉTRICAS DE SUCESSO

**Técnicas**:
- Build time < 60s
- Tempo resposta API < 500ms (p95)
- Uptime > 99.5%
- Cobertura testes > 70%

**Produto**:
- 1 operador gerencia 100+ leads/mês
- Redução 80% tempo criação conteúdo
- ROI ads melhora 30%+ com recomendações IA
- Tempo resposta lead < 5min (automação)

**Negócio** (Connectar):
- 10 clientes pagantes em 3 meses
- MRR $5.000 em 6 meses
- Churn < 10%/mês
- NPS > 50

---

## 10. CONCLUSÃO

Esta especificação define um **Sistema Operacional Comercial completo, multi-tenant, parametrizável por nicho e operável por 1 pessoa**.

**Diferenciais**:
1. IA como motor interno (não chat livre)
2. Parametrização total via playbooks
3. Auditabilidade completa
4. Automação end-to-end
5. Replicável como SaaS

**Próximos Passos Imediatos**:
1. Revisar especificação com stakeholders
2. Priorizar sprints (sugestão: começar Fase 1)
3. Configurar ambientes (staging + production)
4. Iniciar Sprint 1.1 (Playbooks)

**Entrega Estimada Completa**: 10-12 semanas (2,5-3 meses)

---

**Documento Técnico Fechado**  
Pronto para implementação incremental sem refatoração do backoffice existente.
