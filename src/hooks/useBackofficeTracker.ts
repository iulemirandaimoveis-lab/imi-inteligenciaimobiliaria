'use client'

// =============================================================================
// useBackofficeTracker — Hook de Rastreamento de Ações no Backoffice
// =============================================================================
// Substitui: GTM dataLayer.push() para eventos de usuário autenticado
//
// Rastreia ações dos corretores/admins no backoffice:
//   • Navegações entre seções
//   • Criação / edição / exclusão de registros
//   • Geração de links, QR codes, propostas
//   • Acesso a módulos sensíveis (contratos, financeiro)
//   • Eventos customizados
//
// Uso:
//   const { track } = useBackofficeTracker()
//   track('lead_created', { leadId: '...', source: 'manual' })
//   track('link_generated', { linkId: '...', channel: 'whatsapp' })
//   track('contract_viewed', { contractId: '...' })
// =============================================================================

import { useCallback } from 'react'
import { usePathname } from 'next/navigation'

// Session ID compartilhado com o AnalyticsProvider
function getSessionId(): string {
    if (typeof window === 'undefined') return ''
    try {
        let sid = sessionStorage.getItem('imi_sid') || sessionStorage.getItem('imi_session_id')
        if (!sid) {
            sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`
            sessionStorage.setItem('imi_sid', sid)
        }
        return sid
    } catch { return '' }
}

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

export interface BackofficeEvent {
    /** Nome semântico do evento: 'lead_created', 'link_generated', etc. */
    name: string
    /** Propriedades contextuais (IDs, tipos, valores — sem dados pessoais) */
    properties?: Record<string, string | number | boolean | null>
}

export function useBackofficeTracker() {
    const pathname = usePathname()

    /**
     * Dispara um evento de ação no backoffice para analytics_events.
     * O user_id é resolvido server-side via sessão autenticada.
     */
    const track = useCallback((
        name: string,
        properties?: Record<string, string | number | boolean | null>
    ) => {
        const sessionId = getSessionId()
        if (!sessionId || !name) return

        fetch('/api/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                eventType:  'backoffice_action',
                eventName:  name.slice(0, 100),
                sessionId,
                visitorId:  getVisitorId(),
                pagePath:   pathname,
                properties: properties ?? {},
            }),
            keepalive: true,
        }).catch(() => { /* tracking nunca quebra o backoffice */ })
    }, [pathname])

    /**
     * Track um evento de criação de registro.
     * Ex: trackCreate('lead', { source: 'manual', development: 'reserva-imperial' })
     */
    const trackCreate = useCallback((
        entity: string,
        properties?: Record<string, string | number | boolean | null>
    ) => {
        track(`${entity}_created`, properties)
    }, [track])

    /**
     * Track um evento de atualização de registro.
     */
    const trackUpdate = useCallback((
        entity: string,
        properties?: Record<string, string | number | boolean | null>
    ) => {
        track(`${entity}_updated`, properties)
    }, [track])

    /**
     * Track um evento de exclusão de registro.
     */
    const trackDelete = useCallback((
        entity: string,
        properties?: Record<string, string | number | boolean | null>
    ) => {
        track(`${entity}_deleted`, properties)
    }, [track])

    /**
     * Track acesso a um módulo ou seção sensível.
     */
    const trackModuleAccess = useCallback((
        module: string,
        properties?: Record<string, string | number | boolean | null>
    ) => {
        track(`module_${module}_accessed`, properties)
    }, [track])

    return {
        track,
        trackCreate,
        trackUpdate,
        trackDelete,
        trackModuleAccess,
    }
}

// ── Eventos pré-definidos (constantes para evitar typos) ──────────────────────
// Use: import { BACKOFFICE_EVENTS } from '@/hooks/useBackofficeTracker'
//      track(BACKOFFICE_EVENTS.LEAD_CREATED, { ... })

export const BACKOFFICE_EVENTS = {
    // Leads
    LEAD_CREATED:        'lead_created',
    LEAD_UPDATED:        'lead_updated',
    LEAD_CONVERTED:      'lead_converted',
    LEAD_LOST:           'lead_lost',

    // Links & QR
    LINK_GENERATED:      'link_generated',
    QR_GENERATED:        'qr_generated',
    LINK_COPIED:         'link_copied',

    // Imóveis / Lançamentos
    PROPERTY_VIEWED:     'property_viewed',
    PROPERTY_PUBLISHED:  'property_published',

    // Propostas / Contratos
    PROPOSAL_CREATED:    'proposal_created',
    CONTRACT_VIEWED:     'contract_viewed',
    CONTRACT_SIGNED:     'contract_signed',

    // Comunicação
    WHATSAPP_SENT:       'whatsapp_sent',
    EMAIL_SENT:          'email_sent',

    // Relatórios
    REPORT_EXPORTED:     'report_exported',
    ANALYTICS_VIEWED:    'analytics_viewed',

    // Configurações
    SETTINGS_CHANGED:    'settings_changed',
} as const

export type BackofficeEventName = typeof BACKOFFICE_EVENTS[keyof typeof BACKOFFICE_EVENTS]
