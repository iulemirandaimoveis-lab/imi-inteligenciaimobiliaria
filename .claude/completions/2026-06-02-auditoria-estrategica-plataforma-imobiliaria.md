# AUDITORIA ESTRATÉGICA COMPLETA — PLATAFORMA IMI INTELIGÊNCIA IMOBILIÁRIA
## Empreendimentos: Alto Bellevue | Miguel Marques | Jazz Boulevard
**Data:** 2026-06-02 | **Versão:** 1.0 — Auditoria CTO/Arquiteto

---

## SUMÁRIO EXECUTIVO

Este documento é a auditoria técnica, operacional e estratégica completa do ecossistema digital dos empreendimentos Alto Bellevue, Miguel Marques e Jazz Boulevard, operando sobre a plataforma IMI Inteligência Imobiliária.

**Veredicto geral:** A plataforma tem base tecnológica sólida (Next.js App Router + Supabase + TypeScript) e features avançadas (IA, realtime, mapas interativos), mas **possui falhas estruturais críticas** que comprometem a segurança operacional, a integridade das vendas e a escalabilidade multi-equipes. A maior parte dos riscos está concentrada no sistema de gestão de status dos imóveis, que opera sem auditoria, sem locks, sem workflow, sem controle de permissão por papel e sem proteção contra race conditions.

---

## 1. VISÃO EXECUTIVA

### Cenário Atual

| Dimensão | Status | Risco |
|---|---|---|
| Website/UX Público | Funcional, incompleto | Médio |
| Mapa Interativo | Funcional, sem realtime robusto | Alto |
| Backoffice Admin | Funcional, inseguro | Crítico |
| Sistema de Status | Fundamentalmente falho | CRÍTICO |
| Gestão Multi-equipes | Inexistente | CRÍTICO |
| Permissões por Papel | Inexistente para imóveis | CRÍTICO |
| Auditoria/Log | Inexistente para lotes | CRÍTICO |
| Race Conditions | Sem proteção | CRÍTICO |
| Pipeline de Vendas | Manual/informal | Alto |
| Jazz Boulevard | Duplicação de dados | Alto |
| Segurança RLS | Falha para lotes | CRÍTICO |

### Impacto Comercial Estimado

- **Risco de venda dupla**: Dois corretores podem negociar o mesmo lote simultaneamente — sem qualquer proteção.
- **Risco de fraude interna**: Qualquer usuário autenticado pode alterar qualquer status sem log.
- **Risco de conflito de equipes**: Sem regras de ownership, times competem diretamente sobre os mesmos lotes.
- **Perda de receita**: Lotes em "NEGOCIACAO" indefinida bloqueiam o estoque sem conversão.

---

## 2. DIAGNÓSTICO GERAL

### O que existe (mapeamento completo)

**Empreendimentos ativos:**
- **Alto Bellevue**: 331 lotes, 14 quadras (A–N), Garanhuns-PE. Loteamento fechado, R$ 248k–550k.
- **Miguel Marques**: 800+ lotes, 24 quadras (A–Z+), Garanhuns-PE. Loteamento popular, R$ 17k–75k.
- **Jazz Boulevard**: Edifício residencial, 2 torres (A e B), 12 andares, 3 tipos de plantas (Tipo A, B, Cobertura), Garanhuns-PE.

**Stack técnico:**
- Framework: Next.js App Router (src/)
- Banco: Supabase/PostgreSQL com RLS
- Auth: Supabase Auth
- UI: Tailwind CSS + design-system próprio
- IA: Anthropic SDK (Claude) + Google Generative AI
- Animação: GSAP + Framer Motion
- Vídeo: Remotion
- Deploy: Vercel
- Edge: Cloudflare Workers (worker/)
- Forms: React Hook Form + Zod

**Módulos existentes:**
- Website público por empreendimento (`/imoveis/[slug]`)
- Mapa interativo SVG/Canvas de lotes
- Visualizador de planta baixa
- Backoffice admin (`/backoffice`)
- Sistema de equipes e corretores
- CRM básico (leads)
- Pipeline de propostas
- Chat interno (Connect)
- Módulo de avaliações (AVM)
- BPO financeiro
- Módulo de locação
- WhatsApp integração
- E-mail integração
- Social media (Meta Ads, Google Ads)
- Academia/carreira (IMI Academy)
- Plantão/escala
- Frota de veículos

---

## 3. PONTOS FORTES

### Arquitetura Técnica
- ✅ Next.js App Router com separação clara server/client
- ✅ Supabase como backend completo (auth, database, realtime, storage)
- ✅ TypeScript em todo o projeto
- ✅ RLS habilitado na maioria das tabelas
- ✅ Migrations versionadas
- ✅ Sistema de design próprio (design-system/)
- ✅ Testes E2E com Playwright
- ✅ CI/CD via Vercel

### Features Avançadas
- ✅ Mapa interativo de lotes SVG com scores de investimento (IMI Score)
- ✅ Visualização de planta baixa interativa para Jazz Boulevard
- ✅ Sistema de pontuação de lotes (investment, living, cost-benefit, liquidity scores)
- ✅ Integrações de IA (Claude/Gemini) para insights imobiliários
- ✅ Realtime subscriptions para atualizações ao vivo
- ✅ Sistema de avaliação AVM integrado
- ✅ Chat interno por empreendimento/equipe
- ✅ Integração WhatsApp para leads
- ✅ Plantão/escala para corretores
- ✅ Módulo de locação (short-stay + tradicional)

### Dados e Conteúdo
- ✅ Base de dados completa dos 331 lotes do Alto Bellevue
- ✅ Base de dados completa dos 800+ lotes do Miguel Marques
- ✅ Preços reais por lote calculados
- ✅ Special types (ESQUINA) marcados

---

## 4. PROBLEMAS CRÍTICOS

### C1 — AUSÊNCIA TOTAL DE AUDITORIA NO SISTEMA DE LOTES

**Arquivo afetado:** `supabase/migrations/20260516_subdivision_lots.sql`

A tabela `subdivision_lots` não possui:
- Coluna `changed_by` (quem alterou)
- Coluna `previous_status` (status anterior)
- Tabela de histórico (`lot_status_history`)
- Trigger de log automático

**Consequência:** Status pode ser alterado por qualquer pessoa, a qualquer hora, sem rastro. Em uma operação com R$ 248k–550k por lote, isso é inaceitável.

**Código atual (RLS):**
```sql
CREATE POLICY "subdivision_lots_auth_write" ON public.subdivision_lots
  FOR ALL USING (auth.uid() IS NOT NULL);
```

Qualquer usuário autenticado pode INSERT, UPDATE e DELETE qualquer lote.

---

### C2 — RLS QUEBRADA PARA LOTES (SEGURANÇA CRÍTICA)

A política `subdivision_lots_auth_write` permite que **qualquer usuário autenticado** altere qualquer lote de qualquer empreendimento. Isso inclui:
- Corretores de outras equipes
- Gestores de outros empreendimentos
- Usuários com roles sem permissão comercial

Não há verificação de:
- Papel do usuário (corretor/gerente/admin)
- Pertencimento a equipe responsável pelo empreendimento
- Hierarquia de aprovação

---

### C3 — RACE CONDITIONS SEM PROTEÇÃO

**Cenário de risco:**
1. Corretor A abre lote X-10 no app → status DISPONIVEL
2. Corretor B abre o mesmo lote X-10 → status DISPONIVEL
3. Corretor A clica em "Negociar" → UPDATE status = NEGOCIACAO
4. Corretor B clica em "Negociar" (50ms depois) → UPDATE status = NEGOCIACAO

Resultado: ambos acreditam ter exclusividade sobre o lote. Dois clientes diferentes são negociados no mesmo imóvel.

**O código atual** (backoffice/imoveis/[id]/lotes/page.tsx) usa:
```typescript
await supabase
  .from('subdivision_lots')
  .update({ status, price, notes })
  .eq('id', lot.id)
```

Sem `SELECT FOR UPDATE`, sem optimistic locking (versão/etag), sem transação atômica.

---

### C4 — AUSÊNCIA DE SISTEMA DE LOCKS E RESERVAS

Não existe:
- Tabela `lot_locks` para reserva temporária exclusiva
- Tabela `lot_negotiations` para registrar negociações formais
- Tabela `lot_reservations` para reservas com depósito
- Campo `locked_by_user_id` nos lotes
- Campo `lock_expires_at` com timeout automático
- Campo `negotiation_expires_at` com SLA
- Mecanismo de fila para lotes concorridos

---

### C5 — AUSÊNCIA DE WORKFLOW DE NEGOCIAÇÃO

O "status NEGOCIACAO" é apenas uma string. Não existe:
- Quem iniciou a negociação
- Quando expirou (timeout)
- Qual cliente está interessado
- Qual valor foi proposto
- Qual corretor está responsável
- Aprovação gerencial exigida
- Histórico de interações

Um lote pode ficar em "NEGOCIACAO" para sempre sem qualquer ação — efetivamente bloqueando estoque indefinidamente.

---

### C6 — INCONSISTÊNCIA DE STATUS ENTRE EMPREENDIMENTOS

**Loteamentos (Alto Bellevue + Miguel Marques):**
```
DISPONIVEL | VENDIDO | NEGOCIACAO | PROPRIETARIO | IGREJA
```

**Jazz Boulevard (jazzUnits.ts seed):**
```
available | reserved | sold
```

**Produção (projeto_unidades migration):**
```
disponivel | reservado | vendido | bloqueado
```

Três vocabulários diferentes para o mesmo conceito em três lugares do sistema. A sincronização entre o dado no banco e o dado estático no TypeScript é manual e propensa a divergência.

---

### C7 — DADOS DO JAZZ BOULEVARD EM DOIS LUGARES

Jazz Boulevard tem dados em:
1. **`/data/jazzUnits.ts`** — função TypeScript que gera unidades dinamicamente (seed faker)
2. **Banco de dados** — migration `20260530_imi_spatial_properties.sql` que insere registros no Supabase

Os status das unidades em `jazzUnits.ts` são gerados por uma função pseudo-aleatória:
```typescript
const SEED_STATUSES = ['available','available','available','reserved','available','available','sold'...]
function seedStatus(floor, pos) { return SEED_STATUSES[(floor + pos) % SEED_STATUSES.length] }
```

Isso significa que os status exibidos no mapa são **falsos/calculados**, não refletem a realidade do banco de dados. Uma venda real não altera o mapa.

---

### C8 — ESCRITA DIRETA AO BANCO VIA BROWSER CLIENT

O backoffice de lotes usa `createClient()` (browser client) para escrever direto no banco:

```typescript
// src/app/(backoffice)/backoffice/imoveis/[id]/lotes/page.tsx
const supabase = createClient()
await supabase.from('subdivision_lots').update({ status, price, notes }).eq('id', id)
```

Não há:
- Validação server-side das transições de status
- Verificação de papel do usuário no servidor
- Log da operação no servidor
- Rollback em caso de falha
- Notificação para outros usuários online

---

### C9 — COLUNA DUPLICADA NO BANCO (INCONSISTÊNCIA DE SCHEMA)

```sql
-- Ambas existem no schema:
ALTER TABLE developments ADD COLUMN IF NOT EXISTS status_comercial TEXT DEFAULT 'rascunho';
ALTER TABLE developments ADD COLUMN IF NOT EXISTS status_commercial TEXT DEFAULT 'draft';
```

Dois campos (`status_comercial` pt-BR e `status_commercial` en) para o mesmo dado. Código usa um ou outro inconsistentemente.

---

### C10 — NÚMEROS DE LOTES AUSENTES (INTEGRIDADE DE DADOS)

**Miguel Marques Quadra B:** Sequência vai de lote 37 → lote 39 (lote 38 ausente).
**Miguel Marques Quadra D:** Sequência vai de lote 25 → lote 60 (lotes 26–59 ausentes, 34 lotes faltando).

Isso sugere que o seed de dados foi feito manualmente e não passou por validação de integridade. Em um loteamento com 800+ lotes, há alto risco de inconsistências adicionais não detectadas.

---

## 5. PROBLEMAS MÉDIOS

### M1 — STATUS_CFG DUPLICADO

O objeto de configuração de status (cores, labels) está definido separadamente em:
- `src/app/[lang]/(website)/imoveis/components/SubdivisionLotMap.tsx`
- `src/app/(backoffice)/backoffice/imoveis/[id]/lotes/page.tsx`

Qualquer mudança de cor/label precisa ser feita em dois lugares. Risco de divergência visual entre público e backoffice.

### M2 — PAYMENT CONDITIONS HARDCODED NO FRONTEND

```typescript
// SubdivisionLotMap.tsx
const PAYMENT_CONDITIONS: Record<string, {...}> = {
  '8b9f6835-1bd0-4850-80b0-aaef2223300d': { entrada: '1+1 — R$ 1.450 (5%)' },
  'ab7d1fc1-f069-4e3b-a515-8e1204c11247': { entrada: '20% de entrada' },
}
```

Condições de pagamento hardcoded com UUIDs de development. Qualquer atualização exige deploy. Alto risco de dado desatualizado sendo exibido ao cliente.

### M3 — WHATSAPP HARDCODED NO CÓDIGO-FONTE

```typescript
// imoveis/[slug]/page.tsx
const jazzWhatsapp = params.slug === 'jazz-boulevard-garanhuns' ? '558799668204' : null
href={`https://wa.me/${jazzWhatsapp ?? '5581997230455'}?...`}
```

Números de WhatsApp de corretores/gerentes hardcoded no código-fonte. Troca de corretor exige deploy. Violação de privacidade (exposição de número pessoal no git).

### M4 — TOUR VIRTUAL HARDCODED

```typescript
// imoveis/[slug]/page.tsx
'jazz-boulevard-garanhuns': 'https://tour.panoee.net/TORRE_SOUL_RESIDENCE',
```

URL de tour virtual hardcoded. Se o link mudar, exige deploy.

### M5 — IMPORTAÇÃO CSV SEM VALIDAÇÃO ROBUSTA

O backoffice suporta importação CSV de lotes, mas a validação de status no CSV usa:
```typescript
const statusMap: Record<string, string> = { ... }
// Fallback: statusMap[statusRaw] ?? 'DISPONIVEL'
```

Status inválido no CSV silenciosamente vira DISPONIVEL. Um CSV com erro pode resetar lotes VENDIDOS para DISPONIVEL — risco gravíssimo de perda de dados.

### M6 — PREÇOS CALCULADOS SEM VALIDAÇÃO

Os preços no seed são calculados como expressões:
```sql
(dev_id,'A',1, 443.91, 443910*0.78, 'VENDIDO', 'ESQUINA'),
```

O preço `443910*0.78` = R$ 346.249,80. Este cálculo foi feito em SQL mas não há validação de que os preços fazem sentido em relação à área. Possibilidade de erro humano no fator multiplicador não detectado.

### M7 — QUERY DE LOTES SEM PAGINAÇÃO

O mapa de lotes carrega TODOS os lotes de uma vez:
```typescript
const { data: lots } = await supabase.from('subdivision_lots').select('*').eq('development_id', devId)
```

Para Miguel Marques com 800+ lotes, isso é um payload imenso carregado de uma vez. Problema de performance e custo de banda.

### M8 — SEM REALTIME SUBSCRIPTIONS EXPLÍCITAS NOS MAPAS

O `SubdivisionLotMap.tsx` usa `useEffect` para carregar lotes na montagem, mas não há evidência de subscription realtime para atualizações ao vivo. Se outro usuário muda o status de um lote, o mapa não atualiza automaticamente sem refresh.

---

## 6. PROBLEMAS MENORES

### P1 — Ausência de tipos TypeScript gerados para subdivision_lots
Os tipos Supabase (`src/types/supabase.ts`) provavelmente estão desatualizados após migrations recentes.

### P2 — Globals.css de 78KB
`src/app/globals.css` tem 78.939 bytes. CSS excessivo não utilizado provavelmente presente.

### P3 — globals-b11-additions.css separado
Arquivo CSS adicional sugere que adições foram feitas de forma incremental sem refatoração.

### P4 — 82 diretórios de API
A superfície de API é enorme (82 subdiretórios). Sem documentação de API, sem rate limiting consistente, sem versionamento de API.

### P5 — Cloudflare Workers sem docs
Diretório `worker/` existe mas sem documentação sobre o que faz ou como está integrado.

### P6 — Design-system separado sem documentação
Diretório `design-system/` existe mas sem Storybook ou documentação.

---

## 7. RISCOS OPERACIONAIS

### RO1 — Venda Dupla (RISCO MÁXIMO)
**Probabilidade:** Alta em operação multi-equipe simultânea  
**Impacto:** Catastrófico — conflito legal, perda de credibilidade, devolução de sinal  
**Causa raiz:** Ausência de lock e race condition no update de status  
**Detecção:** Zero — não há alerta para status conflitante  

### RO2 — Lote Bloqueado Indefinidamente
**Probabilidade:** Alta  
**Impacto:** Alto — estoque indisponível sem conversão  
**Causa raiz:** Sem timeout/expiração em NEGOCIACAO  
**Detecção:** Zero — sem monitoramento de SLA  

### RO3 — Dado de Estoque Desatualizado no Site
**Probabilidade:** Média  
**Impacto:** Alto — cliente vê lote DISPONÍVEL mas já foi vendido  
**Causa raiz:** Sem realtime subscription no mapa público  
**Detecção:** Baixa — cliente apenas percebe ao tentar negociar  

### RO4 — Conflito de Equipes sobre o Mesmo Lote
**Probabilidade:** Alta  
**Impacto:** Alto — dois corretores de equipes diferentes trabalhando o mesmo cliente/lote  
**Causa raiz:** Sem ownership, sem fila, sem prioridade  
**Detecção:** Zero  

### RO5 — Importação CSV Reseta Vendas para Disponível
**Probabilidade:** Baixa (mas possível)  
**Impacto:** Catastrófico  
**Causa raiz:** Fallback de status inválido vira DISPONIVEL  
**Detecção:** Zero — sem backup antes do import  

### RO6 — Status do Jazz Boulevard Não Reflete Realidade
**Probabilidade:** Alta (já ocorrendo)  
**Impacto:** Médio-Alto — cliente vê apartamento "disponível" que já foi vendido  
**Causa raiz:** Status gerado algoritmicamente, não do banco de dados  

---

## 8. RISCOS TÉCNICOS

### RT1 — Schema Drift
Múltiplas migrations sequenciais sem snapshot consolidado após cada grande mudança. `status_comercial` vs `status_commercial` é sintoma disso. O schema real no banco pode divergir das migrations.

### RT2 — Tipos TypeScript Desatualizados
A todo novo campo adicionado via migration, os tipos TypeScript precisam ser regenerados. Sem automação, isso gera bugs de runtime silenciosos.

### RT3 — Débito Técnico nas Migrations
50+ arquivos de migration, alguns com prefixo `_archive/`. A migration `20260327_definitive_consolidated` sugere que houve uma consolidação parcial, mas ainda há muitas migrations granulares.

### RT4 — Globals.css de 78KB
Provável CSS não utilizado acumulado. Impacto em Core Web Vitals (LCP, CLS).

### RT5 — Ausência de Rate Limiting nas APIs
Com 82 endpoints, nenhum tem rate limiting documentado. Vulnerabilidade a abuso.

### RT6 — API Keys de IA no Servidor Sem Rotation
Anthropic SDK e Google AI são chamados via Route Handlers, mas sem documentação de rotation de keys.

### RT7 — Cloudflare Workers não Documentado
O diretório `worker/` existe mas sem clareza sobre o que processa. Potencial single point of failure.

---

## 9. RISCOS COMERCIAIS

### RC1 — Credibilidade com Corretores Parceiros
Se uma corretor vende um lote que outro corretor já negociou → conflito comercial → perda de parceria.

### RC2 — Perda de Lead por Dado Desatualizado
Lead vê lote disponível no site → toma decisão de compra → descobre que já foi vendido → frustração → desistência.

### RC3 — Impossibilidade de Comissão Auditável
Sem rastreio de quem negociou o quê, disputas de comissão são insolúveis.

### RC4 — Conformidade LGPD
Números de WhatsApp pessoais no código-fonte. Dados de clientes sem política de retenção documentada.

### RC5 — Gestão de Distrato Impossível
Sem status DISTRATO e sem histórico, é impossível saber se um lote DISPONIVEL atual já foi vendido e retornou ao estoque — informação crítica para comissões e histórico.

---

## 10. PROBLEMAS DE UX

### UX1 — Mapa de Lotes sem Feedback Realtime
Usuário olha para o mapa e não sabe se o status que vê é ao vivo ou está desatualizado. Sem indicador de "última atualização" ou "status ao vivo".

### UX2 — Jazz Boulevard com Status Fake
O mapa do Jazz Boulevard exibe status gerado algoritmicamente. "Disponível" pode não ser disponível. Isso é desonesto com o cliente e potencialmente ilegal (publicidade enganosa).

### UX3 — Sem Indicador de "Lote em Negociação Recente"
Corretor não sabe se o lote DISPONIVEL que está prestes a oferecer foi negociado há 5 minutos por outro time.

### UX4 — Backoffice sem Confirmação em Ações Destrutivas
No backoffice, alterar status de VENDIDO para DISPONIVEL não pede confirmação. Um clique acidental pode registrar um lote vendido como disponível.

### UX5 — Formulário de Contato sem SLA Visível
O site não informa ao cliente em quanto tempo será respondido após envio do formulário/WhatsApp.

### UX6 — Mobile: Mapa de Lotes Complexo
O mapa SVG com 331 lotes (Alto Bellevue) ou 800+ (Miguel Marques) em mobile é extremamente denso. Navegação difícil em tela pequena.

### UX7 — Sem Filtro de Preço no Mapa
O mapa tem filtro de status mas não tem filtro de faixa de preço ou área. Para 800 lotes, isso limita muito a usabilidade.

### UX8 — Sem Comparador de Lotes
Cliente não pode comparar lote A-10 com B-5 lado a lado.

### UX9 — Condições de Pagamento Sem Simulador
As condições de pagamento estão listadas estaticamente. Não há simulador de financiamento interativo.

---

## 11. PROBLEMAS DE ARQUITETURA

### AR1 — Sem Camada de Domínio Centralizada para Imóveis
O conceito de "lote disponível" está espalhado em:
- Componentes do website
- Páginas do backoffice
- Migrations SQL
- Seeds de dados
- Tipos TypeScript locais

Não há um módulo de domínio centralizado (ex: `src/features/lots/`) com:
- Definição canônica de status
- Regras de transição
- Validação de permissões
- Service layer

### AR2 — Escrita Direta do Browser ao Banco
O padrão browser → Supabase direto (sem Route Handler intermediário) foi adotado para o backoffice de lotes. Impossibilita:
- Lógica de negócio server-side
- Logging server-side
- Validação complexa
- Notificações push após mudança

### AR3 — Dados do Jazz em Dois Sistemas
`jazzUnits.ts` (estático TypeScript) + banco de dados Supabase. Sem fonte única da verdade.

### AR4 — APIs Não Versionadas
82 endpoints sem versionamento (`/api/v1/`). Breaking changes afetam todos os clientes.

### AR5 — Sem Event Sourcing para Status
Status é apenas o estado atual. Sem eventos históricos, impossível reconstruir a timeline de um lote.

---

## 12. PROBLEMAS DE ESCALABILIDADE

### ES1 — Carregamento Completo de Lotes
800 lotes carregados de uma vez. Para 10.000 lotes (crescimento), será inviável.

### ES2 — SVG Rendering para 800+ Lotes
O mapa SVG renderiza todos os elementos simultaneamente. Para loteamentos maiores, causará travamento no browser.

### ES3 — Sem Cache de Disponibilidade
Cada visita ao site faz uma query completa ao banco. Sem CDN cache de disponibilidade, a Supabase receberá queries repetitivas de clientes anônimos.

### ES4 — Sem Fila de Processamento
Não há sistema de filas (Bull, Inngest, etc.) para processar:
- Expiração de negociações
- Notificações de SLA
- Sincronização de status

### ES5 — Sem Observabilidade
Sem APM (Sentry, Datadog, etc.) configurado para monitorar performance de queries, errors de API, e latência de operações críticas.

---

## 13. MELHORIAS IMEDIATAS (Sprint 0 — até 2 semanas)

### I1 — Corrigir RLS de subdivision_lots (URGENTE)
**Ação:** Restringir escrita de lotes por role. Criar política que verifica se usuário é gerente/admin do empreendimento.

```sql
-- Substituir política atual:
DROP POLICY "subdivision_lots_auth_write" ON subdivision_lots;

-- Somente via API server-side (usar service_role key)
-- Ou policy granular:
CREATE POLICY "subdivision_lots_manager_write" ON subdivision_lots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'manager')
    )
  );
```

### I2 — Adicionar Tabela de Histórico de Status (URGENTE)
**Ação:** Criar `lot_status_history` e trigger automático.

```sql
CREATE TABLE lot_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES subdivision_lots(id),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,
  metadata JSONB
);

CREATE OR REPLACE FUNCTION log_lot_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO lot_status_history (lot_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER lot_status_audit
  AFTER UPDATE ON subdivision_lots
  FOR EACH ROW EXECUTE FUNCTION log_lot_status_change();
```

### I3 — Mover Configurações de Negócio para Banco
**Ação:** Criar tabela `development_commercial_config` para:
- Condições de pagamento
- WhatsApp de contato
- URL do tour virtual
- Vigência das condições

### I4 — Validação Robusta no Import CSV
**Ação:** Rejeitar CSV com status inválido (não silently default). Exigir confirmação antes de sobrescrever status críticos (VENDIDO, PROPRIETARIO).

### I5 — Corrigir Status do Jazz Boulevard
**Ação:** Substituir a função `seedStatus()` por query real ao banco de dados. As unidades devem ter `status` real persistido no Supabase, não calculado.

### I6 — Eliminar Números de Telefone do Código-fonte
**Ação:** Mover para `development_commercial_config` ou variável de ambiente. Nunca commitar PII no código.

### I7 — Validar Integridade dos Lotes do Miguel Marques
**Ação:** Query para detectar gaps na numeração:
```sql
SELECT quadra, generate_series(1, max(lot_number)) AS expected
EXCEPT
SELECT quadra, lot_number FROM subdivision_lots WHERE development_id = [MM_DEV_ID]
ORDER BY quadra, expected;
```

---

## 14. MELHORIAS ESTRATÉGICAS (Sprint 1–3 — 1 a 3 meses)

### E1 — Sistema de Negociação Formal
Criar entidade `lot_negotiations` com:
- `lot_id`, `broker_id`, `team_id`, `client_name`, `client_cpf`
- `status` (pending, active, approved, rejected, expired, converted)
- `proposed_value`, `proposed_conditions`
- `expires_at` (SLA automático, ex: 48h)
- `manager_id` (quem aprovou)
- `notes`, `metadata`

### E2 — Sistema de Locks de Unidade
Criar tabela `lot_locks`:
- `lot_id`, `locked_by`, `team_id`
- `lock_type` (soft_lock = intenção, hard_lock = negociação ativa)
- `expires_at` (soft: 30min, hard: 48h)
- `reason`

Implementar com `SELECT FOR UPDATE` ou Supabase Advisory Locks.

### E3 — Dashboard de Status em Tempo Real
- Mapa de calor de disponibilidade por empreendimento
- Contador de lotes por status (atualizado via realtime)
- Alertas de SLA (lotes em NEGOCIACAO há mais de X horas)
- Feed de atividade recente (quem alterou o quê)

### E4 — Pipeline de Vendas Estruturado
Estados formais:
```
DISPONIVEL → EM_PROSPECCAO → EM_NEGOCIACAO → RESERVADO → CONTRATO_GERADO 
→ CONTRATO_ASSINADO → VENDIDO
```

Com transições controladas por papel e aprovação.

### E5 — Realtime Subscriptions nos Mapas Públicos
```typescript
supabase.channel('lot-changes')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'subdivision_lots' }, 
    (payload) => updateLotStatus(payload.new))
  .subscribe()
```

---

## 15. MELHORIAS ESTRUTURAIS (Sprint 4+ — 3 a 6 meses)

### S1 — Event Sourcing para Lotes
Substituir status mutable por eventos imutáveis:
- `LOT_LISTED` → `NEGOTIATION_STARTED` → `NEGOTIATION_EXPIRED` → `RESERVATION_CREATED` → `CONTRACT_SENT` → `CONTRACT_SIGNED` → `SALE_COMPLETED`

### S2 — Domain Module para Lots
Criar `src/features/lots/` com:
- `domain/` — tipos, regras, validações
- `services/` — lot.service.ts com lógica de negócio
- `api/` — Route Handlers para cada operação
- `hooks/` — React hooks para UI
- `components/` — componentes reutilizáveis

### S3 — API Versionada e Documentada
- `/api/v1/lots/[id]/status` — com validação de papel, log, lock
- OpenAPI/Swagger automático
- Rate limiting por usuário/endpoint

### S4 — Observabilidade Enterprise
- Sentry para error tracking
- Datadog/Axiom para APM e logs estruturados
- Alertas para: venda dupla, SLA violado, error spike

---

## 16. ROADMAP PRIORITÁRIO

### Fase 0 — Estabilização de Segurança (Semana 1–2)
```
[ ] Fix RLS subdivision_lots
[ ] Adicionar lot_status_history + trigger
[ ] Mover telefones/configs para banco
[ ] Corrigir status Jazz Boulevard
[ ] Validar integridade dados Miguel Marques
[ ] Backup completo antes de qualquer mudança
```

### Fase 1 — Workflow Básico (Mês 1)
```
[ ] Tabela lot_negotiations
[ ] API server-side para status changes
[ ] Expiração automática de negociações (cron/edge function)
[ ] Dashboard de SLA no backoffice
[ ] Realtime no mapa público
[ ] Permissões por papel (corretor/gerente/admin)
```

### Fase 2 — Multi-equipes (Mês 2–3)
```
[ ] Sistema de locks (soft/hard)
[ ] Ownership de lote por equipe
[ ] Fila de prioridade para lotes disputados
[ ] Pipeline visual de vendas
[ ] Notificações (push/WhatsApp) para eventos críticos
[ ] Relatório de conversão por equipe
```

### Fase 3 — Enterprise Grade (Mês 4–6)
```
[ ] Event sourcing completo
[ ] Domain module refatorado
[ ] API v1 documentada
[ ] Observabilidade completa
[ ] Testes E2E para fluxo de venda
[ ] Simulador de financiamento
[ ] Integração DocuSign/D4Sign para contratos
```

---

## 17. ARQUITETURA RECOMENDADA

### Database Schema (Novo)

```sql
-- 1. Configuração comercial por empreendimento
CREATE TABLE development_commercial_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id UUID NOT NULL REFERENCES developments(id),
  payment_conditions JSONB NOT NULL DEFAULT '{}',
  whatsapp_contact TEXT,
  virtual_tour_url TEXT,
  valid_from DATE,
  valid_until DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Histórico de status de lotes (audit trail)
CREATE TABLE lot_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES subdivision_lots(id),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  reason TEXT,
  metadata JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX ON lot_status_history(lot_id);
CREATE INDEX ON lot_status_history(changed_at DESC);

-- 3. Negociações formais
CREATE TABLE lot_negotiations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id UUID NOT NULL REFERENCES subdivision_lots(id),
  broker_id UUID NOT NULL REFERENCES profiles(id),
  team_id UUID REFERENCES teams(id),
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_cpf TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','approved','rejected','expired','converted','cancelled')),
  proposed_value DECIMAL(12,2),
  proposed_conditions JSONB,
  priority INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  manager_id UUID REFERENCES profiles(id),
  manager_notes TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX ON lot_negotiations(lot_id) WHERE status IN ('active','approved');

-- 4. Locks temporários
CREATE TABLE lot_locks (
  lot_id UUID PRIMARY KEY REFERENCES subdivision_lots(id),
  locked_by UUID NOT NULL REFERENCES profiles(id),
  team_id UUID REFERENCES teams(id),
  lock_type TEXT NOT NULL CHECK (lock_type IN ('viewing','negotiating','reserved')),
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Auto-cleanup: cron que deleta locks expirados a cada 5 minutos
```

### Status Model Unificado (Novo)

```typescript
// src/features/lots/domain/status.ts
export const LOT_STATUS = {
  DISPONIVEL: 'DISPONIVEL',
  EM_PROSPECCAO: 'EM_PROSPECCAO',     // soft lock, interesse informal
  EM_NEGOCIACAO: 'EM_NEGOCIACAO',     // hard lock, negociação formal ativa
  RESERVADO: 'RESERVADO',             // reserva com depósito
  CONTRATO_ENVIADO: 'CONTRATO_ENVIADO',
  CONTRATO_ASSINADO: 'CONTRATO_ASSINADO',
  VENDIDO: 'VENDIDO',                 // terminal
  BLOQUEADO: 'BLOQUEADO',             // admin only (impedimento jurídico, obra, etc.)
  PROPRIETARIO: 'PROPRIETARIO',       // pertence ao loteador/incorporador
  DISTRATO: 'DISTRATO',               // em processo de distrato
} as const;

// Transições permitidas por papel:
export const ALLOWED_TRANSITIONS: Record<Role, Record<Status, Status[]>> = {
  corretor: {
    DISPONIVEL: ['EM_PROSPECCAO'],
    EM_PROSPECCAO: ['DISPONIVEL'],  // pode cancelar sua prospecção
  },
  gerente: {
    EM_PROSPECCAO: ['EM_NEGOCIACAO', 'DISPONIVEL'],
    EM_NEGOCIACAO: ['RESERVADO', 'DISPONIVEL'],
    RESERVADO: ['CONTRATO_ENVIADO', 'DISTRATO'],
    CONTRATO_ENVIADO: ['CONTRATO_ASSINADO', 'DISTRATO'],
    CONTRATO_ASSINADO: ['VENDIDO', 'DISTRATO'],
    DISTRATO: ['DISPONIVEL'],
  },
  admin: {
    // Pode fazer qualquer transição + BLOQUEADO
    '*': ['*', 'BLOQUEADO'],
  },
};
```

### API Route Pattern (Seguro)

```typescript
// src/app/api/v1/lots/[id]/status/route.ts
import { createServerClient } from '@/lib/supabase/server'
import { validateStatusTransition } from '@/features/lots/domain/status'
import { logStatusChange } from '@/features/lots/services/audit'
import { acquireLotLock } from '@/features/lots/services/lock'

export async function PATCH(req, { params }) {
  const supabase = createServerClient() // service_role ou verificação de JWT
  const user = await getAuthenticatedUser(supabase)
  
  const { new_status, reason, client_info } = await req.json()
  
  // 1. Verificar permissão pelo papel
  const allowed = validateStatusTransition(user.role, currentStatus, new_status)
  if (!allowed) return Response.json({ error: 'Transition not allowed' }, { status: 403 })
  
  // 2. Tentar adquirir lock exclusivo
  const lock = await acquireLotLock(params.id, user.id, new_status)
  if (!lock.acquired) return Response.json({ error: 'Lot is locked by another user', lockedBy: lock.lockedBy }, { status: 409 })
  
  // 3. Transação atômica
  const { error } = await supabase.rpc('update_lot_status', {
    p_lot_id: params.id,
    p_new_status: new_status,
    p_changed_by: user.id,
    p_reason: reason,
  })
  
  // 4. Log estruturado
  await logStatusChange({ lotId: params.id, from: currentStatus, to: new_status, user, reason })
  
  // 5. Notificar outros usuários (realtime)
  await supabase.channel('lot-updates').send({ type: 'broadcast', event: 'lot-status-changed', payload: { lotId: params.id, newStatus: new_status } })
  
  return Response.json({ success: true })
}
```

---

## 18. FLUXOS IDEAIS

### Fluxo de Venda Ideal (Etapas)

```
1. LEAD ENTRA NO SITE
   → Vê mapa com status realtime
   → Filtra por preço/área/quadra
   → Seleciona lote de interesse
   → Clica "Tenho interesse" → WhatsApp/Formulário → Lead criado no CRM

2. CORRETOR RECEBE LEAD
   → Notificação push/WhatsApp
   → Abre backoffice → Lead atribuído
   → Clica "Iniciar Prospecção" → Lote muda para EM_PROSPECCAO
   → Lock temporário de 30 minutos

3. REUNIÃO/NEGOCIAÇÃO
   → Corretor apresenta proposta
   → Abre "Negociação Formal" no backoffice
   → Preenche: cliente, valor proposto, condições
   → Lote muda para EM_NEGOCIACAO
   → Hard lock de 48h ativa
   → Gerente recebe notificação para aprovação

4. APROVAÇÃO GERENCIAL
   → Gerente revisa proposta
   → Pode aprovar, rejeitar ou solicitar ajuste
   → Se aprovado: lote muda para RESERVADO
   → Cliente recebe confirmação de reserva
   → Prazo para depósito (ex: 72h)

5. CONTRATO
   → Jurídico gera contrato
   → Lote muda para CONTRATO_ENVIADO
   → DocuSign/D4Sign enviado ao cliente
   → Acompanhamento via webhook

6. ASSINATURA E VENDA
   → Contrato assinado → CONTRATO_ASSINADO
   → Comprovante de pagamento → VENDIDO
   → Comissão calculada automaticamente
   → Mapa público atualizado em realtime

7. DISTRATO (se necessário)
   → Admin inicia distrato
   → Status: DISTRATO
   → Prazo legal respeitado
   → Lote retorna a DISPONIVEL com flag "retornado ao estoque"
   → Histórico completo preservado
```

### Fluxo Multi-equipes

```
Cenário: Corretor A (Equipe Bellevue) e Corretor B (Equipe Miguel) querem o mesmo lote

1. Corretor A clica "Iniciar Prospecção" em Lote X-10
   → Sistema cria lock temporário (30min) para A
   → Lote muda para EM_PROSPECCAO
   → Corretor B vê lote como "Em prospecção por outra equipe"

2. Corretor B quer o mesmo lote
   → Pode "Registrar Interesse" (entra na fila)
   → Gerente vê fila de interessados

3. Se Corretor A não converte em 30 minutos
   → Lock expira automaticamente
   → Próximo na fila recebe notificação

4. Se Corretor A converte para EM_NEGOCIACAO
   → Hard lock de 48h
   → Fila de outros interessados é notificada: "Lote em negociação ativa"

5. Gerente sempre tem visibilidade total
   → Dashboard com todos os lotes, todos os locks, todas as filas
```

---

## 19. MODELO IDEAL DE GESTÃO DE STATUS

### Estados Completos

| Status | Descrição | Quem pode setar | Tempo máximo | Reversível por |
|---|---|---|---|---|
| DISPONIVEL | Livre para negociação | Sistema/Admin | Indefinido | — |
| EM_PROSPECCAO | Corretor demonstrando interesse | Corretor | 30 min | Corretor/Gerente |
| EM_NEGOCIACAO | Negociação formal ativa | Gerente (após aprovação) | 48h | Gerente/Admin |
| RESERVADO | Depósito confirmado | Gerente | 30 dias | Admin |
| CONTRATO_ENVIADO | Contrato gerado e enviado | Gerente | 15 dias | Admin |
| CONTRATO_ASSINADO | Assinatura confirmada | Sistema (webhook) | — | Admin apenas |
| VENDIDO | Pagamento confirmado | Gerente/Admin | Terminal | Admin + DISTRATO |
| BLOQUEADO | Impedimento jurídico/técnico | Admin apenas | Indefinido | Admin |
| PROPRIETARIO | Pertence ao loteador | Admin apenas | Indefinido | Admin |
| DISTRATO | Em processo de reversão | Admin apenas | 60 dias | Admin |

### Regras de Negócio Críticas

```
REGRA 1: Apenas 1 negociação ativa por lote (UNIQUE constraint)
REGRA 2: Corretor não pode definir VENDIDO (apenas gerente/admin)
REGRA 3: Admin pode fazer qualquer transição com justificativa obrigatória
REGRA 4: Expiração automática: EM_PROSPECCAO (30min), EM_NEGOCIACAO (48h), RESERVADO (30d)
REGRA 5: DISTRATO exige aprovação de 2 pessoas (gerente + admin)
REGRA 6: Todo status change gera entrada em lot_status_history
REGRA 7: Toda mudança para VENDIDO dispara cálculo de comissão
REGRA 8: Status de imóvel público (site) atualiza em realtime (< 5s)
REGRA 9: Lock expirado automaticamente retorna para DISPONIVEL (sem ação manual)
REGRA 10: CSV import nunca pode sobrescrever VENDIDO/CONTRATO_* sem aprovação
```

---

## 20. MODELO IDEAL MULTI-EQUIPES

### Hierarquia Proposta

```
ADMIN (Iule Miranda / Diretoria)
  └── GERENTE DE EMPREENDIMENTO
        ├── LIDER DE EQUIPE
        │     └── CORRETOR PLENO
        │           └── CORRETOR TRAINEE (só pode prospectar)
        └── PARCEIRO EXTERNO (co-broke, acesso limitado)
```

### Ownership de Empreendimento

```sql
CREATE TABLE development_teams (
  id UUID PRIMARY KEY,
  development_id UUID NOT NULL REFERENCES developments(id),
  team_id UUID NOT NULL REFERENCES teams(id),
  can_prospect BOOLEAN DEFAULT true,
  can_negotiate BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,  -- times com priority maior têm preferência
  territory JSONB,             -- quadras/setores que esse time pode trabalhar
  commission_percentage DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Regras de Disputa Multi-equipes

```
1. Apenas equipes autorizadas para o empreendimento podem interagir com seus lotes
2. Se duas equipes têm permissão para o mesmo lote, aplica-se prioridade ou fila FIFO
3. Co-broke: quando lead vem de outra equipe, regra de split de comissão automática
4. Gerente de empreendimento tem visão de TODAS as equipes
5. Equipes não veem as negociações de outras equipes (RLS)
```

---

## 21. MODELO IDEAL DE PERMISSÕES

### Roles e Capacidades

| Capacidade | Trainee | Corretor | Lider | Gerente | Admin |
|---|---|---|---|---|---|
| Ver mapa de disponibilidade | ✅ | ✅ | ✅ | ✅ | ✅ |
| Iniciar prospecção (soft lock) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Criar negociação formal | ❌ | ✅ | ✅ | ✅ | ✅ |
| Aprovar negociação | ❌ | ❌ | ❌ | ✅ | ✅ |
| Definir RESERVADO | ❌ | ❌ | ❌ | ✅ | ✅ |
| Gerar contrato | ❌ | ❌ | ❌ | ✅ | ✅ |
| Definir VENDIDO | ❌ | ❌ | ❌ | ✅ | ✅ |
| Definir BLOQUEADO | ❌ | ❌ | ❌ | ❌ | ✅ |
| Iniciar DISTRATO | ❌ | ❌ | ❌ | ❌ | ✅ |
| Importar CSV | ❌ | ❌ | ✅ | ✅ | ✅ |
| Ver histórico de status | ❌ | ✅ | ✅ | ✅ | ✅ |
| Ver negociações de outros | ❌ | ❌ | ✅ | ✅ | ✅ |
| Alterar preço | ❌ | ❌ | ❌ | ✅ | ✅ |
| Relatórios de conversão | ❌ | Próprio | Equipe | Empreendimento | Total |

---

## 22. MODELO IDEAL DE AUDITORIA

### Eventos a Logar

```typescript
// src/features/lots/domain/audit-events.ts
export const AUDIT_EVENTS = {
  LOT_STATUS_CHANGED: 'lot.status_changed',
  LOT_PRICE_CHANGED: 'lot.price_changed',
  LOT_LOCKED: 'lot.locked',
  LOT_LOCK_EXPIRED: 'lot.lock_expired',
  NEGOTIATION_CREATED: 'negotiation.created',
  NEGOTIATION_APPROVED: 'negotiation.approved',
  NEGOTIATION_REJECTED: 'negotiation.rejected',
  NEGOTIATION_EXPIRED: 'negotiation.expired',
  RESERVATION_CREATED: 'reservation.created',
  CONTRACT_GENERATED: 'contract.generated',
  CONTRACT_SIGNED: 'contract.signed',
  SALE_COMPLETED: 'sale.completed',
  DISTRATO_INITIATED: 'distrato.initiated',
  CSV_IMPORT_EXECUTED: 'import.csv_executed',
  BULK_STATUS_CHANGE: 'import.bulk_status_change',
} as const;
```

### Schema de Audit Log Expandido

```sql
CREATE TABLE lot_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,          -- dos AUDIT_EVENTS acima
  lot_id UUID REFERENCES subdivision_lots(id),
  development_id UUID REFERENCES developments(id),
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  team_id UUID,
  before_state JSONB,                -- snapshot do estado anterior
  after_state JSONB,                 -- snapshot do estado posterior
  reason TEXT,
  client_info JSONB,                 -- nome, CPF (criptografado), telefone
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Particionamento por data para performance
-- Retenção mínima de 10 anos (obrigação legal imobiliária)
-- Audit log é imutável: apenas INSERT, nunca UPDATE ou DELETE
ALTER TABLE lot_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_insert_only" ON lot_audit_log
  FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_read_authorized" ON lot_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );
-- Sem políticas de UPDATE ou DELETE
```

---

## 23. SUGESTÕES DE AUTOMAÇÃO

### AUT1 — Expiração Automática de Locks
```typescript
// Supabase Edge Function (cron a cada 5 minutos)
// Retorna lotes com locks expirados para DISPONIVEL
// Notifica via push/WhatsApp os interessados na fila
```

### AUT2 — SLA Alert para Negociações Paradas
```
Regra: Se lote está em EM_NEGOCIACAO há mais de 24h sem ação → alerta para gerente
Regra: Se lote está em EM_NEGOCIACAO há mais de 48h sem ação → auto-expira
```

### AUT3 — Distribuição Automática de Leads
```
Quando lead entra via formulário/WhatsApp:
1. Identifica empreendimento de interesse
2. Verifica equipe responsável
3. Atribui ao corretor disponível com menor carga
4. Notifica corretor em até 2 minutos
5. Se não houver resposta em 30min → redistribui
```

### AUT4 — Relatório Diário de Estoque
```
Todo dia às 8h: e-mail/WhatsApp para gerentes com:
- Lotes que mudaram de status nas últimas 24h
- Negociações prestes a expirar (próximas 6h)
- Leads não respondidos há mais de 24h
- Conversão de ontem
```

### AUT5 — Cálculo Automático de Comissão
```
Ao setar VENDIDO:
1. Identifica corretor responsável
2. Identifica se há co-broke (equipe externa)
3. Calcula comissão baseada em tabela de regras
4. Gera nota de comissão no sistema financeiro
5. Notifica corretor
```

---

## 24. SUGESTÕES DE IA

### AI1 — Assistente de Negociação
Claude analisando histórico do cliente + dados do lote → sugestão de argumento de venda, melhor condição de pagamento, comparação com lotes similares já vendidos.

### AI2 — Detecção de Padrão de Fraude
IA monitora padrões anômalos:
- Usuário alterando status de muitos lotes rapidamente
- Mesmo lote alterado muitas vezes em sequência
- Status VENDIDO → DISPONIVEL sem autorização gerencial

### AI3 — Precificação Dinâmica
IA analisa: velocidade de vendas, demanda por quadra, sazonalidade, comparable sales → sugere ajuste de preço em lotes próximos a esgotamento.

### AI4 — Chatbot de Atendimento no Site
Claude como assistente no site do empreendimento:
- Responde dúvidas sobre lotes específicos
- Agenda visitas
- Qualifica lead antes de transferir para corretor
- Consulta disponibilidade em tempo real via function calling

### AI5 — Previsão de Conversão
Score de probabilidade de conversão por negociação (0-100%), baseado em:
- Tempo de resposta do cliente
- Histórico de conversas
- Número de visitas ao mesmo lote
- Comportamento similar de outras negociações

---

## 25. SUGESTÕES DE ANALYTICS

### ANL1 — Funil de Conversão por Empreendimento
```
Visitantes site → Leads → Atendimentos → Negociações → Reservas → Vendas
Conversão: 1000 → 150 → 50 → 20 → 12 → 10
```

### ANL2 — Heatmap de Lotes
Quais lotes recebem mais cliques no mapa (interesse) vs. quantos são convertidos.

### ANL3 — Performance por Corretor e Equipe
- Taxa de conversão por corretor
- Tempo médio de negociação
- Valor médio negociado
- Comissão gerada

### ANL4 — Análise de Desistência
Em qual estágio os clientes desistem mais. O que os perdemos. Segmentação por perfil.

### ANL5 — SEO e Aquisição
- Quais palavras-chave trazem leads qualificados
- Performance por empreendimento em busca orgânica
- CPC vs. lead orgânico por empreendimento

---

## 26. SUGESTÕES DE CONVERSÃO

### CONV1 — Urgência Real-time no Site
Exibir: "3 pessoas visualizando este lote agora" (baseado em realtime Supabase presence).

### CONV2 — Simulador de Financiamento Interativo
Campo de entrada: valor da entrada → calcula parcelas → "Simular agora" → lead captado.

### CONV3 — Galeria 3D / Tour Virtual Integrado
Botão "Visita Virtual" integrado ao mapa (não apenas link externo). Rastrea tempo de visualização.

### CONV4 — Comparador de Lotes
Selecionar 2-3 lotes e comparar lado a lado: área, preço, quadra, scores, condições.

### CONV5 — Calendário de Visitas Online
Corretor disponibiliza horários → cliente agenda direto → confirmação automática.

### CONV6 — Prova Social
"12 lotes vendidos nos últimos 30 dias" com dados reais do banco. Constrói urgência genuína.

---

## 27. SUGESTÕES DE SEGURANÇA

### SEG1 — Criptografia de PII
CPF e nome de clientes nas negociações devem ser criptografados no banco (pgcrypto).

### SEG2 — Audit Log Imutável
A tabela `lot_audit_log` deve ser append-only. Sem UPDATE, sem DELETE, mesmo com service_role.

### SEG3 — Two-Factor Authentication
Para ações críticas (VENDIDO, DISTRATO), exigir 2FA independente de sessão ativa.

### SEG4 — IP e Device Fingerprint em Ações Críticas
Logar IP, user-agent, e geolocalization em todas as mudanças de status de imóveis.

### SEG5 — Alertas de Anomalia
Se um usuário mudar o status de 5+ lotes em 10 minutos → bloquear automaticamente e notificar admin.

### SEG6 — LGPD Compliance
- Política de retenção de dados de clientes (leads) documentada
- Opção de "esquecimento" para dados pessoais
- Registro de consentimento para contato comercial
- DPO designado

---

## 28. SUGESTÕES DE PERFORMANCE

### PERF1 — Cache de Disponibilidade
Status dos lotes mudam raramente (< 10 vezes/dia por empreendimento). Cachear resposta de disponibilidade no Edge (Vercel/Cloudflare) com TTL de 30 segundos. Invalidar on-demand quando há mudança.

### PERF2 — Lazy Loading do Mapa
Carregar apenas os lotes visíveis no viewport atual. Implementar virtualização para 800+ lotes.

### PERF3 — CDN para Imagens dos Empreendimentos
Imagens dos lotes e plantas via Supabase Storage com CDN, não servidas diretamente.

### PERF4 — Paginação no Backoffice
O backoffice de lotes deve paginar (100 lotes por vez) e ter busca server-side, não carregar tudo.

### PERF5 — Bundle Size
`globals.css` de 78KB e animações GSAP/Framer Motion podem impactar LCP. Auditar com Lighthouse.

---

## 29. SUGESTÕES DE ESCALABILIDADE

### SCALE1 — Multi-Empreendimento sem Hardcode
O sistema atual tem IDs e configs hardcoded. Qualquer novo empreendimento exige deploy. Tornar configurável via banco.

### SCALE2 — Arquitetura de Tenant por Empreendimento
Cada empreendimento (ou grupo) é um tenant com RLS próprio. Permite multi-incorporadora no futuro.

### SCALE3 — Webhook Architecture para Eventos
Quando status muda → emitir evento → múltiplos consumidores (WhatsApp, email, analytics, CRM externo).

### SCALE4 — Feature Flags
Para lançamentos graduais de novas features (ex: simulador de financiamento só para Alto Bellevue primeiro).

### SCALE5 — Background Jobs para Expiração
Migrar lógica de expiração de locks/negociações de crons para Supabase Edge Functions ou Inngest para confiabilidade.

---

## 30. PLANO DE EVOLUÇÃO DA PLATAFORMA

### Visão de 12 meses

**Mês 1–2: Fundação Segura**
- Zero race conditions
- Audit trail completo
- Permissões por papel funcionando
- Jazz Boulevard com dados reais

**Mês 3–4: Workflow Profissional**
- Pipeline de vendas estruturado (6 etapas)
- Aprovação gerencial para negociações
- SLA automático com alertas
- Dashboard executivo de status

**Mês 5–6: Multi-equipes Enterprise**
- Ownership de empreendimento por equipe
- Fila de prioridade
- Co-broke automático
- Comissão calculada automaticamente

**Mês 7–8: Conversão e CRM**
- Simulador de financiamento no site
- Chatbot IA no site
- Funil de conversão rastreado
- Integração DocuSign para contratos

**Mês 9–10: Inteligência Comercial**
- Precificação dinâmica sugerida por IA
- Score de probabilidade de conversão
- Relatórios de mercado por quadra
- Previsão de estoque

**Mês 11–12: Plataforma Escalável**
- Novos empreendimentos 100% via backoffice (zero deploy)
- API pública documentada para parceiros
- Mobile app para corretores
- Dashboard de KPIs executivo em tempo real

---

## CONCLUSÃO

A plataforma IMI tem um potencial enorme e está tecnicamente bem posicionada. O risco imediato está concentrado em três pontos que precisam ser atacados em no máximo 2 semanas:

1. **Corrigir RLS de subdivision_lots** — qualquer usuário autenticado pode alterar qualquer lote
2. **Criar lot_status_history** — sem isso, cada status change é uma caixa preta irrastreável  
3. **Corrigir status do Jazz Boulevard** — hoje exibe dados falsos gerados algoritmicamente

O restante do roadmap eleva a plataforma de um sistema funcional para uma solução enterprise-grade capaz de suportar múltiplas equipes, múltiplos empreendimentos, e um volume comercial de dezenas de vendas mensais sem risco de venda dupla ou conflito de equipes.

**A maior ameaça hoje não é técnica — é operacional.** Dois corretores negociando o mesmo lote simultaneamente podem custar mais do que o custo inteiro de corrigir a arquitetura.

---
*Auditoria realizada em: 2026-06-02*  
*Baseada em: análise de código-fonte, schema de banco, migrations, componentes, API routes e seed data*  
*Scope: Alto Bellevue (331 lotes) | Miguel Marques (800+ lotes) | Jazz Boulevard (2 torres)*
