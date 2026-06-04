# Backoffice Spec — Disponibilidade, Reservas e Auditoria

> Gestão comercial dos lotes. Boa parte da infraestrutura **já existe** no Supabase;
> esta spec descreve o modelo e o que falta de UI.

## 1. Infra existente (reusar)

| Recurso | Onde |
|---|---|
| Tabela de lotes | `subdivision_lots` (`20260516_subdivision_lots.sql`) |
| Reservas | `lot_reservations` + RPC `reserve_lot` / `release_lot` / `expire_lot_reservations` (`20260603_lot_reservations.sql`) |
| Auditoria | `lot_status_history` + trigger `log_lot_status_change` (`20260602_lot_audit_and_rls_fix.sql`) |
| API | `POST /api/lots/reserve` (`reserve` / `release`) |
| UI de status | `backoffice/imoveis/[id]/lotes/page.tsx` (edição + import/export CSV) |
| Papéis | `profiles.role` (`admin`/`manager`) via `is_lot_manager()` (SECURITY DEFINER) |

## 2. Regras de negócio

- **Status público × interno separados.** Público: `DISPONIVEL/NEGOCIACAO/VENDIDO/...`.
  Reserva muda status para `RESERVADO` e expira automaticamente.
- **Concorrência:** `reserve_lot` usa `SELECT … FOR UPDATE` — dois corretores não reservam
  o mesmo lote simultaneamente (`LOT_ALREADY_RESERVED`).
- **Reserva expira:** `expire_lot_reservations()` (cron) devolve o lote a `DISPONIVEL`.
- **Lote vendido não volta a disponível** sem permissão de gestor.
- **Toda alteração gera log** (trigger → `lot_status_history`): quem, quando, antes→depois, motivo.
- **Importação valida antes de publicar** (CSV de preços/disponibilidade).

## 3. Gaps de UI a implementar

| # | Item | Status |
|---|---|---|
| 1 | Botão "Reservar lote" (com prazo + cliente) no backoffice e no drawer do corretor | a fazer |
| 2 | Botão "Cancelar reserva" / liberar | a fazer |
| 3 | Visualizador do **histórico de auditoria** (`lot_status_history`) por lote | a fazer |
| 4 | Painel de reservas ativas + expiração | a fazer |
| 5 | Drawer do corretor: cliente, CPF, telefone, origem, intenção, criar negociação | a fazer |
| 6 | Validação de importação com preview de divergências (`validate:lots`) | parcial |

## 4. Fluxo de reserva (corretor)

```
Drawer do lote → "Reservar"
  → POST /api/lots/reserve { unitId, clientName, clientPhone, hours }
  → reserve_lot()  (checa papel, trava, status)
      ok → lote = RESERVADO, reserva ativa com expires_at
      erro → 409 (já reservado) / 403 (sem permissão)
```

## 5. Segurança

- RLS restringe escrita a `admin`/`manager`. Não alterar auth/billing.
- PII (telefone do cliente) só visível a gestores (`lot_reservations_manager_all`).
- Migrações novas só com aprovação (ex.: coluna de status interno, se necessária).
