import 'server-only'
import { randomBytes, createHmac, timingSafeEqual } from 'crypto'
import type { BtgAccountConfig } from './config'

export class BtgAuthError extends Error {}

interface TokenCacheEntry { token: string; expiresAt: number }
const clientCredentialsCache = new Map<string, TokenCacheEntry>()

/**
 * Client Credentials — server-to-server, sem intervenção do titular da conta.
 * ⚠️ Conforme a doc oficial do BTG Id, este fluxo NÃO dá acesso às Banking APIs
 * (saldo/extrato/PIX) — serve para endpoints não-financeiros. Mantido aqui
 * para "testar conexão" (valida client_id/secret) e para APIs que a conta
 * eventualmente habilitar sob este fluxo. Para extrato, use o Authorization
 * Code (`buildAuthorizationUrl` + `exchangeAuthorizationCode`).
 */
export async function getClientCredentialsToken(config: BtgAccountConfig): Promise<string> {
  const cached = clientCredentialsCache.get(config.prefix)
  if (cached && cached.expiresAt > Date.now() + 5_000) return cached.token

  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope: config.scope }),
  })

  const json: Record<string, unknown> = await res.json().catch(() => ({}))
  if (!res.ok || typeof json.access_token !== 'string') {
    const detail = (json.error_description as string) || (json.error as string) || JSON.stringify(json)
    throw new BtgAuthError(`BTG token error (HTTP ${res.status}): ${detail}`)
  }

  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 300
  clientCredentialsCache.set(config.prefix, { token: json.access_token, expiresAt: Date.now() + expiresIn * 1000 })
  return json.access_token
}

/** Segredo para assinar o `state` do OAuth Authorization Code (CSRF + integridade). */
function stateSecret(): string {
  return process.env.BTG_OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'imi-btg-oauth-state-fallback'
}

/** Gera a URL de consentimento (Authorization Code) para o titular autorizar a leitura da conta. */
export function buildAuthorizationUrl(config: BtgAccountConfig, bankAccountId: string): string {
  if (!config.redirectUri) {
    throw new BtgAuthError(`${config.prefix}_REDIRECT_URI não configurado`)
  }
  const nonce = randomBytes(8).toString('hex')
  const payload = `${bankAccountId}.${nonce}`
  const sig = createHmac('sha256', stateSecret()).update(payload).digest('hex')
  const state = `${payload}.${sig}`

  const url = new URL(config.authorizeUrl)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', config.clientId)
  url.searchParams.set('redirect_uri', config.redirectUri)
  url.searchParams.set('scope', config.scope)
  url.searchParams.set('state', state)
  return url.toString()
}

/** Valida o `state` recebido no callback e extrai o bank_account_id de origem. */
export function verifyOAuthState(state: string): string | null {
  const parts = state.split('.')
  if (parts.length !== 3) return null
  const [bankAccountId, nonce, sig] = parts
  const expected = createHmac('sha256', stateSecret()).update(`${bankAccountId}.${nonce}`).digest('hex')
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  } catch {
    return null
  }
  return bankAccountId
}

export interface OAuthTokenSet {
  accessToken: string
  refreshToken: string | null
  expiresAt: string
  scope: string | null
}

export async function exchangeAuthorizationCode(config: BtgAccountConfig, code: string): Promise<OAuthTokenSet> {
  if (!config.redirectUri) {
    throw new BtgAuthError(`${config.prefix}_REDIRECT_URI não configurado`)
  }
  return requestToken(config, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
  })
}

export async function refreshAccessToken(config: BtgAccountConfig, refreshToken: string): Promise<OAuthTokenSet> {
  return requestToken(config, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })
}

async function requestToken(config: BtgAccountConfig, params: Record<string, string>): Promise<OAuthTokenSet> {
  const basic = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')
  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  })
  const json: Record<string, unknown> = await res.json().catch(() => ({}))
  if (!res.ok || typeof json.access_token !== 'string') {
    const detail = (json.error_description as string) || (json.error as string) || JSON.stringify(json)
    throw new BtgAuthError(`BTG token error (HTTP ${res.status}): ${detail}`)
  }
  const expiresIn = typeof json.expires_in === 'number' ? json.expires_in : 3600
  return {
    accessToken: json.access_token,
    refreshToken: typeof json.refresh_token === 'string' ? json.refresh_token : null,
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    scope: typeof json.scope === 'string' ? json.scope : null,
  }
}
