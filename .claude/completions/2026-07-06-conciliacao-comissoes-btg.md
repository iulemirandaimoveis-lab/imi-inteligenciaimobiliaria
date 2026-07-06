# Completion — Conciliação de comissões IMI × Mano Imóveis (contas BTG PF/PJ)

**Data**: 2026-07-06 · **Branch**: `claude/imi-commission-reconciliation-eyng5a`

## Pedido
Criar toda a estrutura e interface para conciliar e confirmar as comissões da IMI
recebidas via imobiliárias parceiras (Mano Imóveis), conectando ou deixando pronto para
conectar as contas BTG Pactual PF e PJ da IMI (docs referenciados: conta-pj e
meu-primeiro-access-token do BTG Empresas).

## Entregue
- **Banco** (`supabase/migrations/20260706_commission_bank_reconciliation.sql`, ainda
  **não aplicado em produção** — ver Pendências): `bank_accounts` (contas BTG da IMI),
  `bank_transactions` (extrato sincronizado/importado), `commission_reconciliations`
  (vínculo repasse↔transação com score), `bank_oauth_tokens` (tokens OAuth, RLS sem
  nenhuma policy — só service role, mesmo padrão de `partner_api_keys`/D-15). RLS
  habilitada em todas; seed das 2 contas (BTG PF — Jule Miranda, manual; BTG PJ — IMI,
  `btg_empresas_api`, aguardando credenciais).
- **Conector BTG** (`src/lib/btg/`): `config.ts` (env vars por prefixo, ex. `BTG_PJ_*`),
  `auth.ts` (OAuth2 client_credentials + Authorization Code com `state` assinado HMAC),
  `statement.ts` (fetch + normalização defensiva do extrato), `csv-import.ts` (parser de
  CSV de extrato BR — funciona hoje, sem depender da API).
- **Motor de conciliação** (`src/lib/finance/matching.ts`): score por valor
  exato/aproximado + janela de data + documento/nome da contraparte.
- **Rotas** (`src/app/api/finance/`): `bank-accounts` (CRUD, admin), `.../test-connection`,
  `.../sync`, `.../authorize` (+ `finance/btg/callback`), `bank-transactions` (list +
  `import` CSV), `commissions/reconciliation` (GET sugestões + POST
  confirm/reject/auto_match — reutiliza `commission_repasses` já existente).
- **UI**: `/backoffice/financeiro/comissoes` — KPIs, painel de contas BTG (testar/conectar/
  sincronizar/importar CSV), lista de repasses pendentes com sugestões de match e
  confirmação, histórico conciliado. Nav atualizado.
- **Docs**: `docs/BTG_INTEGRATION_GUIDE.md` — passo a passo de conexão + aviso honesto
  sobre o que não pôde ser verificado (ver abaixo).
- **Testes**: 27 novos (parser CSV, motor de match, auth-gating + fluxo de confirmação das
  rotas). Suite completa: 68 suítes / 916 passed (5 skipped) — sem regressão.

## ⚠️ Limitação desta sessão (transparência)
`developers.empresas.btgpactual.com` foi **bloqueado pela política de rede do ambiente**
(403 no proxy) — não foi possível abrir a doc oficial para confirmar o path exato do
endpoint de extrato nem o formato exato da resposta. O conector foi implementado com o que
é publicamente conhecido do BTG Id (OAuth2) e ficou configurável via env var
(`BTG_PJ_STATEMENT_PATH` etc.) para ajuste sem mudar código assim que o dono tiver acesso
ao portal. **A importação manual de CSV funciona hoje, sem essa dependência**, para PF e PJ.

## Gates
tsc ✅ · lint ✅ · jest 68 suítes / 916 passed (5 skipped) ✅

## Pendências (ação do dono)
1. **Aplicar a migration em produção** — não foi aplicada nesta sessão (mudança de banco
   exige aprovação explícita, invariante do projeto). Rodar via Supabase MCP/CLI:
   `supabase/migrations/20260706_commission_bank_reconciliation.sql`.
2. Confirmar no portal BTG o path real do endpoint de extrato PJ e ajustar
   `BTG_PJ_STATEMENT_PATH` se divergir do default.
3. Quando o CNPJ da IMI abrir conta PJ no BTG: registrar app no developer portal, configurar
   `BTG_PJ_CLIENT_ID`/`SECRET`/`REDIRECT_URI` na Vercel, clicar "Conectar" na UI.
4. Até lá: usar "Importar extrato (CSV)" nas duas contas (PF já cadastrada) para conciliar.
