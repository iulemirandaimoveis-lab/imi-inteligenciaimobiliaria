'use client'

// =============================================================================
// IMI Analytics Provider — Plataforma Própria
// =============================================================================
// Substitui: GA4, GTM, Meta Pixel, Google Tag Manager, Stape (server-side GTM)
//
// Coleta (100% first-party, zero cookies de terceiros):
//   • page_view       — Toda mudança de rota
//   • scroll          — Milestones 25/50/75/100%
//   • engagement      — Heartbeat a cada 15s (duração + scroll atual)
//   • cta_click       — Qualquer elemento com data-imi-event="nome_do_cta"
//   • form_submit     — Todos os <form> do site
//   • external_link   — Cliques em links para domínios externos
//   • (lead)          — Emitido pelos forms de contato ao confirmar envio
//
// Atribuição:
//   • First-touch cookie (imi_attr_ft) — 180 dias
//   • Last-touch cookie  (imi_attr_lt) — 30 dias
//   • Visitor ID persistente (imi_vid) — localStorage, 1 ano
//   • Session ID (imi_sid) — sessionStorage, por aba
//
// Transporte:
//   • Beacon API (navigator.sendBeacon) para eventos de unload — nunca perde dados
//   • fetch com keepalive para todos os outros
//
// Compatibilidade retroativa:
//   • Props googleAnalytics e facebookPixel aceitas mas ignoradas intencionalmente
//   • O sistema agora é 100% first-party — sem dependência de scripts externos
// =============================================================================

import { useEffect, useRef, useCallback } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

// ── Constantes ─────────────────────────────────────────────────────────────────

const COLLECTOR_URL = '/api/analytics/event'
const LEGACY_PAGEVIEW_URL = '/api/tracking/pageview' // manter retrocompatibilidade
const LEGACY_SESSION_URL = '/api/tracking/session'   // manter retrocompatibilidade
const SCROLL_MILESTONES = [25, 50, 75, 100]
const HEARTBEAT_INTERVAL_MS = 15_000

// ── Visitor ID (localStorage — persistente 1 ano) ────────────────────────────

function getVisitorId(): string {
    if (typeof window === 'undefined') return ''
    try {
        let vid = localStorage.getItem('imi_vid')
        if (!vid) {
            vid = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`
            localStorage.setItem('imi_vid', vid)
        }
        return vid
    } catch { return '' }
}

// ── Session ID (sessionStorage — por aba/sessão) ─────────────────────────────

function getSessionId(): string {
    if (typeof window === 'undefined') return ''
    try {
        // Compatibilidade com chave legada
        let sid = sessionStorage.getItem('imi_sid') || sessionStorage.getItem('imi_session_id')
        if (!sid) {
            sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`
            sessionStorage.setItem('imi_sid', sid)
        }
        return sid
    } catch { return '' }
}

// ── Attribution Cookies ───────────────────────────────────────────────────────

function persistAttribution(params: URLSearchParams) {
    const source = params.get('utm_source')
    const medium = params.get('utm_medium')
    const campaign = params.get('utm_campaign')
    if (!source && !medium && !campaign) return

    const payload = {
        source:   source   || undefined,
        medium:   medium   || undefined,
        campaign: campaign || undefined,
        content:  params.get('utm_content')  || undefined,
        term:     params.get('utm_term')     || undefined,
        landed:   Date.now(),
    }
    const encoded = encodeURIComponent(JSON.stringify(payload))

    // First-touch: só grava se ainda não existir (180 dias)
    if (!document.cookie.includes('imi_attr_ft=')) {
        const exp = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toUTCString()
        document.cookie = `imi_attr_ft=${encoded}; path=/; expires=${exp}; SameSite=Lax`
    }

    // Last-touch: sempre atualiza (30 dias)
    const exp30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `imi_attr_lt=${encoded}; path=/; expires=${exp30}; SameSite=Lax`
}

function readAttribution(): Record<string, string | null> {
    if (typeof window === 'undefined') return {}

    const params = new URLSearchParams(window.location.search)
    persistAttribution(params)

    // Preferência: UTM na URL → cookie last-touch
    let lt: Record<string, string> = {}
    try {
        const raw = document.cookie.split(';').find(c => c.trim().startsWith('imi_attr_lt='))
        if (raw) lt = JSON.parse(decodeURIComponent(raw.split('=').slice(1).join('=')))
    } catch { }

    return {
        utmSource:   params.get('utm_source')   || lt.source   || null,
        utmMedium:   params.get('utm_medium')   || lt.medium   || null,
        utmCampaign: params.get('utm_campaign') || lt.campaign || null,
        utmContent:  params.get('utm_content')  || lt.content  || null,
        utmTerm:     params.get('utm_term')     || lt.term     || null,
    }
}

// ── Slug do imóvel / lançamento ───────────────────────────────────────────────

function extractDevSlug(path: string): string | null {
    const m = path.match(/\/imoveis\/([^/?\s]+)/)
    return m ? m[1] : null
}

// ── Envio de Evento (Beacon API com fallback fetch) ───────────────────────────

function sendEvent(data: Record<string, unknown>, useBeacon = false): void {
    const payload = JSON.stringify(data)
    const url = COLLECTOR_URL

    if (useBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
            const blob = new Blob([payload], { type: 'application/json' })
            navigator.sendBeacon(url, blob)
            return
        } catch { /* fallback para fetch */ }
    }

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
    }).catch(() => { /* tracking nunca quebra a UX */ })
}

// ── Debounce util ─────────────────────────────────────────────────────────────

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
    let timer: ReturnType<typeof setTimeout>
    return ((...args: Parameters<T>) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), ms)
    }) as T
}

// ── Props (retrocompatibilidade) ──────────────────────────────────────────────

interface AnalyticsProviderProps {
    /** @deprecated Ignorado — sistema agora é 100% first-party */
    googleAnalytics?: string
    /** @deprecated Ignorado — sistema agora é 100% first-party */
    facebookPixel?: string
}

// ── Componente Principal ──────────────────────────────────────────────────────

export default function AnalyticsProvider(_props: AnalyticsProviderProps) {
    const pathname    = usePathname()
    const searchParams = useSearchParams()

    const pageStartRef       = useRef(Date.now())
    const scrollMaxRef       = useRef(0)
    const heartbeatRef       = useRef<ReturnType<typeof setInterval> | null>(null)
    const scrollMilestonesRef = useRef<Set<number>>(new Set())

    // ── Enviar Page View ────────────────────────────────────────────────────
    const sendPageView = useCallback(() => {
        const sessionId = getSessionId()
        const visitorId = getVisitorId()
        if (!sessionId) return

        pageStartRef.current        = Date.now()
        scrollMaxRef.current        = 0
        scrollMilestonesRef.current = new Set()

        const attribution = readAttribution()
        const devSlug     = extractDevSlug(pathname)

        // 1. Novo endpoint (plataforma própria)
        sendEvent({
            eventType: 'page_view',
            sessionId,
            visitorId,
            pageUrl:          window.location.href,
            pagePath:         pathname,
            pageTitle:        document.title,
            referrer:         document.referrer || null,
            ...attribution,
            screenWidth:      window.innerWidth,
            developmentSlug:  devSlug,
        })

        // 2. Manter retrocompatibilidade com tabela page_views existente
        fetch(LEGACY_PAGEVIEW_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionId,
                pageUrl:         window.location.href,
                pagePath:        pathname,
                referrer:        document.referrer || null,
                ...attribution,
                screenWidth:     window.innerWidth,
                developmentSlug: devSlug,
            }),
            keepalive: true,
        }).catch(() => { })
    }, [pathname])

    // ── Page View + Heartbeat por rota ──────────────────────────────────────
    useEffect(() => {
        sendPageView()

        if (heartbeatRef.current) clearInterval(heartbeatRef.current)

        heartbeatRef.current = setInterval(() => {
            const sessionId   = getSessionId()
            const durationSec = Math.round((Date.now() - pageStartRef.current) / 1000)
            const scrollDepth = scrollMaxRef.current

            // Heartbeat de engajamento → novo endpoint
            sendEvent({
                eventType:       'engagement',
                sessionId,
                visitorId:       getVisitorId(),
                pagePath:        pathname,
                durationSeconds: durationSec,
                scrollDepth,
            })

            // Retrocompatibilidade → session heartbeat legado
            fetch(LEGACY_SESSION_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    duration:   durationSec,
                    scrollDepth: Math.min(scrollDepth, 100),
                    pagePath:   pathname,
                }),
                keepalive: true,
            }).catch(() => { })
        }, HEARTBEAT_INTERVAL_MS)

        // Enviar engajamento final ao sair da página (Beacon API — mais confiável)
        const sendFinalEngagement = () => {
            const sessionId   = getSessionId()
            const durationSec = Math.round((Date.now() - pageStartRef.current) / 1000)
            if (durationSec < 1) return

            sendEvent({
                eventType:       'engagement',
                sessionId,
                visitorId:       getVisitorId(),
                pagePath:        pathname,
                durationSeconds: durationSec,
                scrollDepth:     scrollMaxRef.current,
            }, true /* useBeacon */)
        }

        const handlePageHide = () => sendFinalEngagement()
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') sendFinalEngagement()
        }

        window.addEventListener('pagehide', handlePageHide)
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            if (heartbeatRef.current) clearInterval(heartbeatRef.current)
            window.removeEventListener('pagehide', handlePageHide)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [pathname, searchParams, sendPageView])

    // ── Scroll Depth Tracking ────────────────────────────────────────────────
    useEffect(() => {
        const onScroll = () => {
            const scrolled = window.scrollY
            const total    = document.documentElement.scrollHeight - window.innerHeight
            if (total <= 0) return

            const pct = Math.min(Math.round((scrolled / total) * 100), 100)
            scrollMaxRef.current = Math.max(scrollMaxRef.current, pct)

            for (const milestone of SCROLL_MILESTONES) {
                if (pct >= milestone && !scrollMilestonesRef.current.has(milestone)) {
                    scrollMilestonesRef.current.add(milestone)
                    sendEvent({
                        eventType:   'scroll',
                        eventName:   `scroll_${milestone}`,
                        sessionId:   getSessionId(),
                        visitorId:   getVisitorId(),
                        pagePath:    pathname,
                        scrollDepth: milestone,
                    })
                }
            }
        }

        const debouncedScroll = debounce(onScroll, 200)
        window.addEventListener('scroll', debouncedScroll, { passive: true })
        return () => window.removeEventListener('scroll', debouncedScroll)
    }, [pathname])

    // ── CTA Click Tracking (data-imi-event="nome_do_cta") ───────────────────
    // Exemplo de uso: <button data-imi-event="hero_cta_whatsapp">Falar</button>
    // Propriedades extras: data-imi-prop-imovel="reserva-imperial"
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest('[data-imi-event]') as HTMLElement | null
            if (!target) return

            const eventName  = target.dataset.imiEvent || 'cta_click'
            const properties: Record<string, string> = {}
            Object.keys(target.dataset).forEach(k => {
                if (k.startsWith('imiProp')) {
                    // data-imi-prop-imovel → 'imovel'
                    const propKey = k.replace('imiProp', '').replace(/^./, c => c.toLowerCase())
                    properties[propKey] = target.dataset[k] || ''
                }
            })

            sendEvent({
                eventType:  'cta_click',
                eventName,
                sessionId:  getSessionId(),
                visitorId:  getVisitorId(),
                pagePath:   pathname,
                properties,
            })
        }

        document.addEventListener('click', onClick)
        return () => document.removeEventListener('click', onClick)
    }, [pathname])

    // ── Link Externo Tracking ────────────────────────────────────────────────
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            const anchor = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null
            if (!anchor?.href) return
            try {
                const url = new URL(anchor.href)
                if (url.hostname === window.location.hostname) return
                // Links externos (whatsapp, instagram, parceiros, etc.)
                sendEvent({
                    eventType: 'external_link',
                    eventName: `external_${url.hostname.replace(/\./g, '_')}`,
                    sessionId: getSessionId(),
                    visitorId: getVisitorId(),
                    pagePath:  pathname,
                    properties: {
                        href:     anchor.href.slice(0, 300),
                        hostname: url.hostname,
                        text:     (anchor.textContent || '').trim().slice(0, 100),
                    },
                })
            } catch { }
        }

        document.addEventListener('click', onClick)
        return () => document.removeEventListener('click', onClick)
    }, [pathname])

    // ── Form Submit Tracking ─────────────────────────────────────────────────
    useEffect(() => {
        const onSubmit = (e: SubmitEvent) => {
            const form = e.target as HTMLFormElement
            const formId = (
                form.dataset.imiForm ||
                form.id ||
                form.action?.split('/').pop() ||
                'form'
            ).slice(0, 80)

            sendEvent({
                eventType: 'form_submit',
                eventName: `form_${formId}`,
                sessionId: getSessionId(),
                visitorId: getVisitorId(),
                pagePath:  pathname,
                properties: { formId },
            })
        }

        document.addEventListener('submit', onSubmit)
        return () => document.removeEventListener('submit', onSubmit)
    }, [pathname])

    // Componente puro de tracking — sem renderização
    return null
}
