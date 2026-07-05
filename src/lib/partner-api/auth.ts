/**
 * Partner API v1 (D-15) — autenticação por API key com escopos.
 *
 * Contrato de segurança (espelho de P15/D-11): a rota só toca `supabaseAdmin`
 * DEPOIS que a chave provou identidade — o hash SHA-256 do Bearer token é
 * comparado por igualdade indexada contra `partner_api_keys` (RLS on, sem
 * policies; somente service_role lê). A chave completa nunca é armazenada
 * nem logada; em logs aparece apenas o `key_prefix`.
 */

import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import type { PartnerAuthContext, PartnerScope } from './types'

export const PARTNER_KEY_PREFIX = 'imi_pk_'
export const PARTNER_API_VERSION = 'v1'

// D-09: classe própria de rate limit — por CHAVE, não por IP.
const PARTNER_RATE_LIMIT = { limit: 120, windowMs: 60_000 }

export function hashPartnerKey(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex')
}

export function partnerError(
    status: number,
    code: string,
    message: string,
    extraHeaders?: Record<string, string>,
): NextResponse {
    return NextResponse.json(
        { error: { code, message } },
        { status, headers: { 'X-IMI-API-Version': PARTNER_API_VERSION, ...extraHeaders } },
    )
}

type RouteContext = { params: Record<string, string> }

export type PartnerHandler = (
    request: NextRequest,
    partner: PartnerAuthContext,
    routeCtx: RouteContext,
) => Promise<Response>

/**
 * Envolve um route handler `/api/v1/*` com: Bearer key → hash lookup →
 * active/revoked → escopos → rate limit por chave. 401/403/429 padronizados
 * no formato `{ error: { code, message } }`.
 */
export function withPartnerAuth(requiredScopes: PartnerScope[], handler: PartnerHandler) {
    return async (request: NextRequest, routeCtx?: RouteContext): Promise<Response> => {
        const authorization = request.headers.get('authorization') || ''
        const rawKey = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : ''

        if (!rawKey || !rawKey.startsWith(PARTNER_KEY_PREFIX)) {
            return partnerError(
                401,
                'missing_api_key',
                'Envie a chave no header Authorization: Bearer imi_pk_...',
            )
        }

        const keyHash = hashPartnerKey(rawKey)
        const { data: key, error } = await supabaseAdmin
            .from('partner_api_keys')
            .select('id, partner_name, scopes, active, revoked_at')
            .eq('key_hash', keyHash)
            .maybeSingle()

        if (error) {
            return partnerError(503, 'auth_unavailable', 'Falha ao validar credenciais. Tente novamente.')
        }
        if (!key || !key.active || key.revoked_at) {
            // Mesma resposta para inexistente/inativa/revogada — não vazar qual caso é.
            return partnerError(401, 'invalid_api_key', 'Chave de API inválida ou revogada.')
        }

        const scopes: string[] = Array.isArray(key.scopes) ? key.scopes : []
        const missing = requiredScopes.filter((s) => !scopes.includes(s))
        if (missing.length > 0) {
            return partnerError(
                403,
                'insufficient_scope',
                `Escopo(s) necessário(s): ${missing.join(', ')}`,
            )
        }

        const rl = await rateLimit(`partner:${key.id}`, PARTNER_RATE_LIMIT)
        if (!rl.success) {
            const retryAfterSec = Math.max(1, Math.ceil((rl.resetTime - Date.now()) / 1000))
            return partnerError(429, 'rate_limited', 'Limite de requisições excedido para esta chave.', {
                'Retry-After': String(retryAfterSec),
            })
        }

        // Telemetria de uso — nunca bloqueia nem falha a requisição.
        supabaseAdmin
            .from('partner_api_keys')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', key.id)
            .then(
                () => {},
                () => {},
            )

        const partner: PartnerAuthContext = {
            keyId: key.id,
            partnerName: key.partner_name,
            scopes,
        }
        return handler(request, partner, routeCtx ?? { params: {} })
    }
}
