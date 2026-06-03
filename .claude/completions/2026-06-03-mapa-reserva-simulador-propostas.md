# Conclusão — Mapa Alto Bellevue + Reserva/Simulador/Propostas + Segurança

**Data:** 2026-06-03 · **Banco:** imi-inteligenciaimobiliaria (`zocffccwjjyelwrgunhu`)

## Parte 1 — Mapa fiel ao CAD ✅
- Perímetro real do condomínio = polígono fechado de 62 vértices da camada `DB2 LIMITE DO LOTE` (POLIGONAL eram fragmentos).
- 375 lotes, perímetro cercando 375/375, 194 ruas (19 nomes), linha BR, entrada, viewBox sem overflow. Validado por render PNG.

## Parte 2 ✅
- **2.1 Reserva + lock** em `subdivision_lots` (fonte da verdade real do AB): `reserve_lot/release_lot/expire_lot_reservations` (SELECT…FOR UPDATE), RLS, cron 48h, UI gestor. Testado: anti-conflito + auditoria.
- **2.2 Simulador** financeiro por planos reais (à vista/12/36/60/120 + entrada).
- **2.3 Propostas + assinatura**: abstração Clicksign+DocuSign, colunas em `proposals`, rotas sign/webhook, **chaves configuráveis pelo backoffice** (`/backoffice/settings/assinatura`, tabela `integrations`).
- **2.4 Auditoria + roadmap**: `docs/AUDITORIA_BACKOFFICE_2026-06-03.md`.

## Segurança (CTO) ✅
- `subdivision_lots`: removida política `auth_*_write` (escrita aberta) → só admin/manager + trilha `lot_status_history`.
- `integrations`: removida `auth_all_integrations` (todos os segredos expostos) → admin/manager.

## Verificação
- `tsc --noEmit`: 0 erros · `npm run build`: ✓ sucesso (426/426) · todas as rotas novas compiladas.
- Reserva testada via RPC (RESERVADO→conflito→DISPONIVEL, 2 eventos auditados).
- Contrato de config de assinatura testado (save→load).

## Pendências (do cliente)
- Configurar chaves Clicksign/DocuSign em `/backoffice/settings/assinatura` e registrar webhook do provedor.
- Roadmap P1+: reconciliar tabelas duplicadas (proposals×propostas, lot tables) e a interface de `propostas/[id]`.

## Migrations aplicadas
20260602_lot_audit_and_rls_fix · 20260603_lot_reservations · 20260603_proposal_signatures ·
20260603_harden_integrations_rls · 20260603_integrations_signature_category
