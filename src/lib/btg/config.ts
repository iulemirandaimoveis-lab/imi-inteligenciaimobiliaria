import 'server-only'

/**
 * BTG Empresas API — configuração via env vars.
 *
 * A IMI opera hoje só com conta PF no BTG (sem API pública de extrato — ver
 * `csv-import.ts`). Este módulo prepara a conexão da futura conta PJ (CNPJ da
 * IMI) via BTG Empresas, seguindo os docs de auth de developers.empresas.btgpactual.com
 * (BTG Id / OAuth2). As URLs de token/API abaixo são os valores documentados
 * publicamente para o fluxo "Client Credentials" (id.btgpactual.com); o path
 * exato do endpoint de saldo/extrato deve ser confirmado no portal do
 * desenvolvedor ao ativar a conta PJ e pode ser ajustado via
 * `${prefix}_STATEMENT_PATH` sem alterar código.
 *
 * Env por conta (prefixo definido em `bank_accounts.env_prefix`, ex. BTG_PJ):
 *   ${prefix}_CLIENT_ID           — obrigatório para conectar
 *   ${prefix}_CLIENT_SECRET       — obrigatório para conectar
 *   ${prefix}_SANDBOX             — 'true' para usar ambiente sandbox
 *   ${prefix}_SCOPE               — escopos solicitados (default abaixo)
 *   ${prefix}_REDIRECT_URI        — obrigatório para o fluxo Authorization Code
 *   ${prefix}_TOKEN_URL           — override do endpoint de token
 *   ${prefix}_API_BASE_URL        — override da base da API de contas
 *   ${prefix}_STATEMENT_PATH      — override do path do extrato
 */

export interface BtgAccountConfig {
  prefix: string
  clientId: string
  clientSecret: string
  sandbox: boolean
  tokenUrl: string
  authorizeUrl: string
  apiBaseUrl: string
  statementPath: string
  scope: string
  redirectUri: string | null
}

const DEFAULT_SCOPE = 'accounts.read statements.read'

export function readBtgConfig(prefix: string): BtgAccountConfig | null {
  const clientId = process.env[`${prefix}_CLIENT_ID`]
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`]
  if (!clientId || !clientSecret) return null

  const sandbox = process.env[`${prefix}_SANDBOX`] === 'true'
  const idBase = sandbox ? 'https://id.sandbox.btgpactual.com' : 'https://id.btgpactual.com'
  const apiBase = sandbox ? 'https://api.sandbox.empresas.btgpactual.com' : 'https://api.empresas.btgpactual.com'

  return {
    prefix,
    clientId,
    clientSecret,
    sandbox,
    tokenUrl: process.env[`${prefix}_TOKEN_URL`] || `${idBase}/oauth2/token`,
    authorizeUrl: process.env[`${prefix}_AUTHORIZE_URL`] || `${idBase}/oauth2/authorize`,
    apiBaseUrl: process.env[`${prefix}_API_BASE_URL`] || apiBase,
    statementPath: process.env[`${prefix}_STATEMENT_PATH`] || '/v1/conta-pj/extrato',
    scope: process.env[`${prefix}_SCOPE`] || DEFAULT_SCOPE,
    redirectUri: process.env[`${prefix}_REDIRECT_URI`] || null,
  }
}
