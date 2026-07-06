# Guia — Conectar as contas BTG (PF e PJ) à conciliação de comissões

> Módulo: `Backoffice → Financeiro → Comissões (BTG)` (`/backoffice/financeiro/comissoes`)
> Objetivo: confirmar que os repasses de comissão da IMI (recebidos via imobiliárias
> parceiras, ex. Mano Imóveis) efetivamente caíram na conta bancária.

## ⚠️ Aviso importante sobre esta implementação

O acesso a `developers.empresas.btgpactual.com` foi **bloqueado pela política de rede**
do ambiente onde este módulo foi construído (erro 403 no proxy da sessão) — não foi
possível abrir a documentação oficial para confirmar 100% dos nomes de campos e paths
exatos da API. O conector foi implementado com base no que é publicamente conhecido do
fluxo de auth do BTG Id (OAuth2) via busca, e ficou **pronto para conectar, com os pontos
abaixo para você confirmar/ajustar** ao acessar o portal do desenvolvedor:

1. **Client Credentials não dá acesso às Banking APIs.** A doc do BTG Id afirma que o
   fluxo `client_credentials` (server-to-server, sem login do titular) **não** libera
   saldo/extrato/PIX — só endpoints não-financeiros. Para ler o extrato, o fluxo correto é
   **Authorization Code** (o titular da conta faz login uma vez e autoriza o app).
   O módulo já implementa os dois fluxos — veja "Como conectar a conta PJ" abaixo.
2. **Path exato do endpoint de extrato.** Configurável via `BTG_PJ_STATEMENT_PATH`
   (default atual: `/v1/conta-pj/extrato` — ajuste assim que confirmar no portal, sem
   precisar mexer em código).
3. **Nomes dos campos da resposta.** O normalizador (`src/lib/btg/statement.ts`) tenta as
   variantes mais comuns (`valor`/`amount`, `data`/`date`, `pagador.documento`/
   `counterpartyDocument` etc.). Se a resposta real usar outros nomes, ajuste só a função
   `normalizeEntry()` — o resto do pipeline (dedupe, matching, UI) não muda.

Enquanto isso não é confirmado, **a importação manual de extrato (CSV) funciona hoje**,
para as duas contas (PF e PJ), e é o caminho recomendado até a API estar validada.

## Contas já cadastradas

| Conta | Titular | Conector | Status |
|---|---|---|---|
| BTG PF — Jule Miranda (Ag 819 / Cc 870658-4) | Pessoa física | Manual (CSV) | BTG não tem API pública de extrato para conta PF |
| BTG PJ — IMI | Pessoa jurídica (CNPJ a abrir) | BTG Empresas API (OAuth2) | Aguardando `BTG_PJ_CLIENT_ID`/`SECRET` |

## Como importar o extrato manualmente (funciona hoje, PF ou PJ)

1. No internet banking do BTG, exporte o extrato do período em **CSV**.
2. Em `/backoffice/financeiro/comissoes`, no card da conta, clique **"Importar extrato (CSV)"**.
3. Selecione o arquivo. O parser aceita `;` ou `,` como separador e reconhece colunas
   `Data`, `Descrição`/`Histórico`, `Valor` (com vírgula decimal), `Tipo` (opcional),
   `Documento`/`CPF/CNPJ` (opcional), `Pagador`/`Nome` (opcional).
4. Linhas que não puderem ser lidas aparecem como aviso — o restante é importado normalmente.
5. Volte à lista de repasses pendentes e clique **"Auto-conciliar"** (ou confirme manualmente
   as sugestões que aparecerem).

## Como conectar a conta PJ via API (quando o CNPJ da IMI estiver aberto no BTG Empresas)

1. Acesse `developers.empresas.btgpactual.com` e registre um aplicativo para a conta PJ da IMI.
2. Anote `client_id` e `client_secret`, e configure a **redirect URI** do app como:
   `https://<seu-domínio>/api/finance/btg/callback`
3. Defina as variáveis de ambiente (Vercel → Settings → Environment Variables):

   ```
   BTG_PJ_CLIENT_ID=...
   BTG_PJ_CLIENT_SECRET=...
   BTG_PJ_REDIRECT_URI=https://<seu-domínio>/api/finance/btg/callback
   # Opcionais (têm default sensato):
   BTG_PJ_SANDBOX=false
   BTG_PJ_SCOPE=accounts.read statements.read
   BTG_PJ_STATEMENT_PATH=/v1/conta-pj/extrato   # ajuste se o path real for outro
   BTG_OAUTH_STATE_SECRET=<uma string aleatória só sua>
   ```

4. Em `/backoffice/financeiro/comissoes`, no card **BTG PJ — IMI**, clique **"Testar"** para
   validar `client_id`/`client_secret` (client_credentials).
5. Clique **"Conectar"** — isso abre a tela de login/consentimento do BTG. Após autorizar,
   você volta para a página com o status **Conectado**.
6. Clique **"Sincronizar"** para puxar o extrato dos últimos 30 dias. Repita periodicamente
   (ou automatize depois com um cron, seguindo o padrão `P11` do projeto).

## Segurança

- Nenhum `client_secret` ou token fica salvo no banco em texto puro acessível por rota:
  - `client_id`/`client_secret` só existem como variável de ambiente (nunca em tabela).
  - `access_token`/`refresh_token` do fluxo OAuth ficam em `bank_oauth_tokens`, tabela com
    RLS habilitada e **sem nenhuma policy** — só o service role (`supabaseAdmin`) do
    servidor acessa, nunca uma rota exposta ao cliente.
- O `state` do OAuth é assinado com HMAC-SHA256 (`BTG_OAUTH_STATE_SECRET`) para evitar CSRF
  e amarrar o callback à conta bancária certa.
- Todas as rotas de gestão de conta bancária (`/api/finance/bank-accounts/*`) exigem papel
  `admin`/`super_admin`; as de conciliação do dia a dia (`/api/finance/commissions/*`,
  `/api/finance/bank-transactions/*`) aceitam também `broker_manager`.

## Arquivos relevantes

- `supabase/migrations/20260706_commission_bank_reconciliation.sql` — schema
- `src/lib/btg/` — conector (config, auth OAuth2, extrato, importação CSV)
- `src/lib/finance/matching.ts` — motor de pontuação da conciliação
- `src/app/api/finance/` — rotas (contas bancárias, transações, conciliação)
- `src/app/(backoffice)/backoffice/financeiro/comissoes/` — interface
