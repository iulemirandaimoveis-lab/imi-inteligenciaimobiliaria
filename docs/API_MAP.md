# API_MAP — Mapa da Superfície de API

> 275 route handlers em `src/app/api`. Complementa `docs/API_REFERENCE.md` (contratos detalhados).
> Regenerar lista: `find src/app/api -name "route.ts" | sed 's|/route.ts||;s|src/app/api/||' | sort`

---

## Convenções de Segurança

| Classe | Autenticação | Exemplo |
|---|---|---|
| Autenticada (padrão) | `supabase.auth.getUser()` → 401; tenant/role → 403 | `ai/generate-content` |
| Admin | sessão + role em `profiles` (admin/manager/super_admin/owner) + `supabaseAdmin` | `admin/reset-password` |
| Cron | `Authorization: Bearer ${CRON_SECRET}` | `cron/*` (todas as 9) |
| Pública | sem auth (por design) | `contact`, `cep/[cep]`, `cnpj/[cnpj]`, webhooks |
| Webhook | validação de assinatura/secret do provedor | `abacate-pay/webhook` |
| **Parceiro (v1)** | `Authorization: Bearer imi_pk_…` → hash SHA-256 vs `partner_api_keys` + escopos + RL 120/min por chave (`withPartnerAuth`, `src/lib/partner-api/`) | `v1/developments`, `v1/availability` |

**Wrapper centralizado**: `apiHandler` (`src/lib/api-helpers.ts`) — auth (`getUser`) + rate limit + audit por padrão (`auth: true`, RL `'auth'`/`'public'`). Usado por avaliacoes, pix, plantao/*, frota/*, developments, financeiro… **Rotas novas devem usá-lo** em vez de repetir o boilerplate.

**Rate limiting**: `src/lib/rate-limit.ts` (Upstash Redis; fallback in-memory). Cobertura: rotas com `apiHandler` (automático) + `ai/*` + públicas de escrita (`contact`, `consultation`, `lots/proposal`, `intelligence/simulate`, `proposals/respond`) + credenciais (`auth/login`, `first-access` x2, 5/min por IP desde 2026-07-02).

## Grupos Funcionais (principais)

| Grupo | Prefixo | Rotas | Notas |
|---|---|---|---|
| IA | `ai/*`, `claude/*`, `ai-chat` | ~24 | Anthropic; auth+RL no padrão; custo por chamada |
| Auth & OAuth social | `auth/*` | ~14 | google, meta, linkedin, tiktok, twitter (+callbacks), login/logout, first-access, set-password |
| Avaliações (PTAM) | `avaliacoes/*` | ~12 | cálculo, KB (index/query/feedback), export, QR |
| Crons | `cron/*` | 9 | daily orquestra os demais; CRON_SECRET |
| BPO Financeiro | `bpo/*` | 6 | DRE, conciliação, transações |
| Financeiro | `financeiro/*`, `contratos/*` | ~9 | comissões, notas, repasses, assinatura |
| Empreendimentos | `developments/*`, `developers` | ~7 | availability Alto Bellevue, POIs, amenities |
| Comunicação | `connect/*`, `channels/*`, `chat/*` | ~8 | mensagens, presence, realtime |
| CRM/Leads | `brokers/*`, `equipe/*`, `campanhas`, `agenda` | ~8 | |
| Dados BR públicos | `cep/[cep]`, `cnpj/[cnpj]` | 2 | ViaCEP/BrasilAPI/ReceitaWS (`src/services/brazil-apis`) |
| Backoffice util | `backoffice/*`, `analytics/*`, `export`, `audit` | ~7 | |
| Console IMI | `users/*` | vários | schema `imi`; RBAC próprio |

## Padrão Obrigatório para Novas Rotas

```ts
export const runtime = 'nodejs' // se usar libs Node
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rl = await limiters.<tipo>(user.id)
  if (!rl.success) return NextResponse.json({ error: '...' }, { status: 429 })
  const body = schema.parse(await request.json()) // zod
  // checagem de tenant/role → 403
  // lógica; supabaseAdmin apenas com justificativa
}
```

Preferir `getUser()` a `getSession()` em decisões de autorização (getUser valida o JWT no servidor; ver SECURITY_AUDIT F-02).

## CORS

Definido no middleware para `/api/*`: allowlist (`NEXT_PUBLIC_SITE_URL`, domínios iulemirandaimoveis.com.br, localhost em dev). Preflight OPTIONS → 204.

---
**Última atualização**: 2026-07-02
