// =============================================================================
// POST /api/analytics/event — Coletor Universal de Eventos
// =============================================================================
// Substitui: GA4 Measurement Protocol, GTM server-side (Stape), Meta CAPI, CDPs
//
// Eventos suportados:
//   page_view         — Visualização de página (website público)
//   click             — Clique genérico
//   cta_click         — Clique em CTA (data-imi-event attribute)
//   form_submit       — Envio de formulário
//   scroll            — Milestone de scroll (25/50/75/100%)
//   engagement        — Heartbeat de engajamento (duração + scroll)
//   external_link     — Clique em link externo
//   lead              — Geração de lead
//   backoffice_action — Ação de usuário autenticado no backoffice
//   custom            — Evento customizado
//
// Design:
//   • Enriquecimento 100% server-side (UA parse, geo via Vercel headers)
//   • IP hash SHA-256 com salt — LGPD compliant (sem IP raw)
//   • Rate limiting silencioso (nunca quebra o client-side tracking)
//   • Bot detection multi-camada
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { limiters, getClientIP } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'

// ── Constantes ────────────────────────────────────────────────────────────────

const VALID_EVENT_TYPES = new Set([
    'page_view', 'click', 'cta_click', 'form_submit', 'scroll',
    'engagement', 'external_link', 'lead', 'backoffice_action', 'custom',
])

// Padrão expandido de bots (40+ assinaturas)
const BOT_PATTERN = new RegExp(
    'bot|crawl|spider|slurp|bingpreview|mediapartners|facebookexternalhit|' +
    'bytespider|headless|phantom|selenium|playwright|puppeteer|lighthouse|pingdom|' +
    'gtmetrix|newrelic|datadog|statuscake|uptime|nagios|zabbix|node-fetch|python-requests|' +
    'curl\\/|wget\\/|axios\\/|go-http|java\\/|okhttp|httpx|scrapy|nutch|ahrefsbot|semrushbot|' +
    'mj12bot|dotbot|rogerbot|archive\\.org',
    'i'
)

function isBot(ua: string): boolean {
    return BOT_PATTERN.test(ua)
}

// ── IP Hash (LGPD) ────────────────────────────────────────────────────────────

async function hashIP(ip: string): Promise<string> {
    const salt = process.env.IP_HASH_SALT || 'imi-analytics-2026'
    const data = `${salt}|${ip}`
    const encoder = new TextEncoder()
    const buf = await crypto.subtle.digest('SHA-256', encoder.encode(data))
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
}

// ── UA Parser (server-side, sem dependência de terceiros) ────────────────────

function parseUA(ua: string): { deviceType: string; browser: string; os: string } {
    const u = ua.toLowerCase()

    let deviceType = 'desktop'
    if (/mobile|android(?!.*tablet)|iphone|ipod|blackberry|windows phone/.test(u)) {
        deviceType = 'mobile'
    } else if (/tablet|ipad|kindle|silk/.test(u)) {
        deviceType = 'tablet'
    }

    let browser = 'other'
    if (/edg\//.test(u))                             browser = 'Edge'
    else if (/opr\/|opera/.test(u))                  browser = 'Opera'
    else if (/chrome\//.test(u) && !/edg/.test(u))   browser = 'Chrome'
    else if (/firefox\//.test(u))                    browser = 'Firefox'
    else if (/safari\//.test(u) && !/chrome/.test(u)) browser = 'Safari'
    else if (/msie|trident/.test(u))                 browser = 'IE'
    else if (/samsungbrowser/.test(u))               browser = 'Samsung'

    let os = 'other'
    if (/windows/.test(u))                           os = 'Windows'
    else if (/iphone|ipad|ipod/.test(u))             os = 'iOS'
    else if (/mac os x|macintosh/.test(u) && !/iphone|ipad/.test(u)) os = 'macOS'
    else if (/android/.test(u))                      os = 'Android'
    else if (/linux/.test(u))                        os = 'Linux'
    else if (/cros/.test(u))                         os = 'ChromeOS'

    return { deviceType, browser, os }
}

// ── Validação de Comprimento ──────────────────────────────────────────────────

const s = (v: unknown, max = 500): string | null => {
    if (v == null || v === '') return null
    return String(v).slice(0, max)
}

const n = (v: unknown, min = 0, max = 86400): number | null => {
    if (v == null) return null
    const num = Number(v)
    if (!isFinite(num)) return null
    return Math.min(Math.max(num, min), max)
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    const ip = getClientIP(request)

    // 1. Rate limiting silencioso — nunca quebra o tracking do cliente
    try {
        // Limite generoso: 30 eventos / 10s por IP (comportamento normal de usuário)
        const rl = await limiters.public(ip)
        if (!rl.success) {
            return NextResponse.json({ ok: true }) // Drop silencioso
        }
    } catch {
        // Se Redis falhar, prossegue (tracking não pode ser bloqueado por infra)
    }

    try {
        const body = await request.json()

        const {
            eventType,
            eventName,
            sessionId,
            visitorId,
            pageUrl,
            pagePath,
            pageTitle,
            referrer,
            utmSource, utmMedium, utmCampaign, utmContent, utmTerm,
            screenWidth,
            durationSeconds,
            scrollDepth,
            developmentSlug,
            trackedLinkId,
            properties,
        } = body

        // 2. Validação básica
        if (!eventType || !sessionId) {
            return NextResponse.json({ error: 'eventType e sessionId são obrigatórios' }, { status: 400 })
        }
        if (!VALID_EVENT_TYPES.has(eventType)) {
            return NextResponse.json({ error: 'eventType inválido' }, { status: 400 })
        }
        if (typeof sessionId !== 'string' || sessionId.length > 100) {
            return NextResponse.json({ error: 'sessionId inválido' }, { status: 400 })
        }

        // 3. Enriquecimento server-side
        const ua = request.headers.get('user-agent') || ''
        const bot = isBot(ua)
        const { deviceType, browser, os } = parseUA(ua)

        // Geo via Vercel Edge headers (gratuito, sem API externa)
        const country = request.headers.get('x-vercel-ip-country') || null
        const region  = request.headers.get('x-vercel-ip-country-region') || null
        const rawCity = request.headers.get('x-vercel-ip-city')
        const city    = rawCity ? decodeURIComponent(rawCity) : null

        const ipHash = await hashIP(ip)

        // 4. Usuário autenticado (apenas para ações de backoffice)
        let userId: string | null = null
        if (eventType === 'backoffice_action') {
            try {
                const supabase = await createClient()
                const { data: { user } } = await supabase.auth.getUser()
                userId = user?.id ?? null
            } catch {
                // Não bloquear tracking se auth falhar
            }
        }

        // 5. Sanitize properties (evitar injeção de dados excessivos)
        let safeProperties: Record<string, unknown> = {}
        if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
            // Limitar a 20 chaves, cada valor até 200 chars
            const keys = Object.keys(properties).slice(0, 20)
            for (const k of keys) {
                const v = properties[k]
                if (typeof v === 'string') safeProperties[k] = v.slice(0, 200)
                else if (typeof v === 'number' || typeof v === 'boolean') safeProperties[k] = v
            }
        }

        // 6. Insert no analytics_events
        const { error } = await supabaseAdmin
            .from('analytics_events')
            .insert({
                event_type:      eventType,
                event_name:      s(eventName, 100),
                session_id:      String(sessionId).slice(0, 100),
                visitor_id:      visitorId ? s(visitorId, 100) : null,
                user_id:         userId,
                page_url:        s(pageUrl, 1000),
                page_path:       s(pagePath, 500),
                page_title:      s(pageTitle, 200),
                referrer:        s(referrer, 500),
                utm_source:      s(utmSource, 100),
                utm_medium:      s(utmMedium, 100),
                utm_campaign:    s(utmCampaign, 200),
                utm_content:     s(utmContent, 200),
                utm_term:        s(utmTerm, 200),
                device_type:     deviceType,
                browser:         browser,
                os:              os,
                screen_width:    n(screenWidth, 0, 10000),
                country:         country,
                region:          region,
                city:            city,
                ip_hash:         ipHash,
                duration_seconds: n(durationSeconds, 0, 86400),
                scroll_depth:    n(scrollDepth, 0, 100),
                tracked_link_id: trackedLinkId || null,
                development_slug: s(developmentSlug, 200),
                properties:      safeProperties,
                is_bot:          bot,
            })

        if (error) {
            // Log mas não expõe erro ao cliente
            console.error('[Analytics/event] Supabase error:', error.message)
            return NextResponse.json({ ok: false }, { status: 500 })
        }

        return NextResponse.json({ ok: true })

    } catch (err) {
        console.error('[Analytics/event] Unexpected error:', err)
        // NUNCA retornar erro ao cliente — tracking não pode quebrar a UX
        return NextResponse.json({ ok: true })
    }
}

// CORS para permite chamadas de domínios próprios (sem third-party)
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin':  process.env.NEXT_PUBLIC_SITE_URL || '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age':       '86400',
        },
    })
}
