# Auditoria do Backoffice / CRM — Alto Bellevue & Plataforma IMI
**Data:** 2026-06-03 · **Escopo:** fluxo comercial (lote → reserva → proposta → assinatura → contrato) + saúde de dados/segurança
**Contexto:** levantamento feito durante a Parte 2 (reserva, simulador, propostas). Banco: `imi-inteligenciaimobiliaria` (`zocffccwjjyelwrgunhu`).

---

## 1. Panorama
- Backoffice com **~60 módulos** e **248 rotas de API** — plataforma ampla (CRM, BPO financeiro, academy, RH, ads, analytics próprio, etc.).
- Forte sobreposição de conceitos (várias tabelas para "lote", "unidade" e "proposta"), o que gera risco de **confusão de fonte da verdade** — exatamente o ponto levantado pelo cliente.

---

## 2. Achados críticos (🔴 = corrigir já)

### 🔴 A1. RLS insegura em `subdivision_lots` (escrita aberta)
- Política viva: `subdivision_lots_auth_write` (`FOR ALL`) → **qualquer usuário autenticado pode alterar qualquer lote** (status, preço).
- A migração de correção **`20260602_lot_audit_and_rls_fix.sql` existe no repo mas NÃO foi aplicada** ao banco (`lot_status_history` não existe; política `subdivision_lots_manager_write` ausente).
- **Impacto:** mina a integridade da reserva (Parte 2.1) — um corretor comum poderia sobrescrever status fora do RPC com lock.
- **Ação:** aplicar a migração 20260602 (restringe escrita a admin/manager + trilha de auditoria). *Toca RLS/authz → requer aprovação explícita do cliente.*

### 🔴 A2. Duas tabelas de lote — fonte da verdade ambígua
- `subdivision_lots` (1.428 linhas; **Alto Bellevue = 383**) → onde os dados reais vivem.
- `development_units` (142 linhas; **0 do Alto Bellevue**).
- O mapa interativo lia `development_units` (vazio p/ AB) → status nunca refletia o banco.
- **Corrigido nesta sessão:** mapa + reserva repontuados para `subdivision_lots`.
- **Pendente:** decidir o papel de `development_units`/`units`/`projeto_unidades`/`property_units` (consolidar ou documentar fronteiras).

### 🔴 A3. RLS permissiva em massa
- Advisor de segurança: **261 WARN**, incluindo **142 `rls_policy_always_true`** (`USING (true)`) e 36 funções `SECURITY DEFINER` executáveis por `anon`.
- **Ação:** revisão dirigida das políticas `always_true` em tabelas com PII (leads, clients, propostas, chat).

### 🟠 A4. Duas tabelas de proposta
- `proposals` (moderna, integrada a `development_id`/`lead_id`/`broker_id`/`unit_id`, com `pdf_url`, `interest_score`) — **escolhida como base da Parte 2.3**.
- `propostas` (baseada em `property_*`, com tracking de engajamento e `organization_id`).
- **Risco:** dois fluxos paralelos de proposta. **Ação:** definir a canônica (recomendo `proposals`) e migrar/aposentar a outra.
- `proposals` tem **3 políticas `FOR ALL`** (`auth_access_proposals`, `auth_manage_proposals`, `bo_full_proposals`) — redundância/excesso a revisar.

### 🟠 A5. Assinatura dispersa
- `contratos` já tem conceito de assinatura (`assinatura_provider` `govbr|clicksign`, `assinatura_url`, `signed_at`).
- A Parte 2.3 adicionou assinatura à `proposals` (abstração Clicksign/DocuSign).
- **Ação:** unificar o fluxo **proposta assinada → contrato** (gerar `contratos` a partir da `proposals` aceita) para evitar duas trilhas de assinatura.

### 🟡 A6. Lacuna de geometria/seed do Alto Bellevue
- Tabela de preços: 382 lotes · Polígonos no CAD (cópia escolhida): 375 · **8 sem polígono** (D-3, D-15, H-13..19).
- `development_units` sem nenhuma linha de AB (preços/planos só no JSON estático).
- **Ação:** reconciliar tabela ↔ geometria; decidir se `development_units` deve ser semeado a partir de `subdivision_lots`.

---

## 3. O que foi entregue nesta sessão (Parte 1 + 2)
| Item | Estado |
|------|--------|
| **P1** Mapa fiel ao CAD: 375 lotes, **delimitação oficial** (DB2 LIMITE DO LOTE, 62 vértices) cercando 375/375, ruas (194) c/ nomes (19), linha da BR, entrada, viewBox sem overflow | ✅ verificado por render |
| **2.1** Reserva c/ lock transacional (`SELECT … FOR UPDATE`), RPCs `reserve_lot`/`release_lot`/`expire_lot_reservations`, RLS, cron 48h, UI gestor no mapa | ✅ aplicado no banco + testado (anti-conflito) |
| **2.2** Simulador financeiro por planos reais (à vista/12/36/60/120 + entrada ajustável) | ✅ |
| **2.3** Propostas + assinatura: abstração Clicksign/DocuSign, colunas em `proposals`, rota de envio + webhook + auditoria | ✅ código + migração aplicada (faltam credenciais do provedor) |

---

## 4. Roadmap priorizado

**P0 — Segurança (semana 1)**
1. Aplicar `20260602_lot_audit_and_rls_fix.sql` (escrita de lote só admin/manager + auditoria). *(aprovação de RLS)*
2. Revisar as 142 políticas `rls_policy_always_true` em tabelas com PII.
3. Enxugar as 3 políticas de `proposals` para um único modelo coerente.

**P1 — Fonte da verdade (semana 2)**
4. Oficializar `subdivision_lots` como SoT de loteamento; documentar/aposentar `development_units` p/ loteamento.
5. Escolher `proposals` como proposta canônica; plano de migração de `propostas`.

**P2 — Fluxo comercial fim-a-fim (semanas 3-4)**
6. Pipeline **lote → reserva → proposta → assinatura → contrato**: ao assinar (`proposals.status='accepted'`), gerar `contratos` e marcar lote `VENDIDO` via RPC com lock.
7. Configurar provedor de assinatura (env Clicksign **ou** DocuSign) + endpoint de webhook em produção.

**P3 — Reconciliação de dados**
8. Reconciliar os 8 lotes sem geometria; seed coerente entre tabela de preços, `subdivision_lots` e JSON do mapa.

---

## 4.1 Resolvido nesta sessão (segurança + config)
- ✅ **A1 resolvido:** aplicada `20260602_lot_audit_and_rls_fix` — `subdivision_lots` agora só admin/manager escreve + trilha `lot_status_history` (trigger). Reserva re-testada (anti-conflito OK, 2 eventos auditados).
- ✅ **`integrations` RLS endurecida:** a política `auth_all_integrations` expunha **todos os segredos a qualquer autenticado** → restrita a admin/manager (`20260603_harden_integrations_rls`).
- ✅ **Chaves de assinatura configuráveis pelo backoffice:** `Configurações → Assinatura eletrônica` (Clicksign/DocuSign), guardadas em `integrations` (RLS admin/manager), lidas server-side via service_role com fallback p/ env. Segredos nunca vão ao cliente (apenas hint mascarado).

### 🟠 A7 (novo). Página de propostas x schema real
- `backoffice/propostas/[id]` define `Proposal` com campos (`buyer_name`, `listed_price`, `property_snapshot`…) que **não existem** na tabela `proposals` real (`title`, `valor_proposta`, `development_id`…).
- **Impacto:** a UI de proposta pode estar parcialmente quebrada/dessincronizada. **Ação:** reconciliar interface ↔ tabela antes de plugar o botão "Enviar para assinatura" (a API `/api/proposals/[id]/sign` já está pronta).

## 5. Variáveis de ambiente (Parte 2.3) — opcional, há fallback pelo backoffice
```
SIGNATURE_PROVIDER=clicksign|docusign
# Clicksign
CLICKSIGN_API_TOKEN=...
CLICKSIGN_BASE_URL=https://app.clicksign.com
CLICKSIGN_WEBHOOK_SECRET=...
# DocuSign
DOCUSIGN_BASE_URI=https://demo.docusign.net/restapi
DOCUSIGN_ACCOUNT_ID=...
DOCUSIGN_ACCESS_TOKEN=...
DOCUSIGN_WEBHOOK_SECRET=...
```
Webhook do provedor → `POST /api/webhooks/signature/clicksign` (ou `/docusign`).
