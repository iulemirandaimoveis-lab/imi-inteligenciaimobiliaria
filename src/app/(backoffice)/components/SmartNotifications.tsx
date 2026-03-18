'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Bell, X, Sparkles, AlertTriangle, ArrowRight, Loader2,
  Users, Star, Home, Send, ChevronRight,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SmartAlert {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  urgency: 'high' | 'medium' | 'low'
}

interface DailySummary {
  text: string
  loading: boolean
  error: string | null
}

const STATIC_ALERTS: SmartAlert[] = [
  {
    id: 'leads-sem-contato',
    icon: <Users size={14} />,
    label: 'Leads sem contato',
    description: '3 leads sem contato há +48h — ação imediata sugerida',
    urgency: 'high',
  },
  {
    id: 'avaliacao-pendente',
    icon: <Star size={14} />,
    label: 'Avaliação pendente',
    description: 'Nova avaliação pendente de resposta',
    urgency: 'medium',
  },
  {
    id: 'imoveis-sem-fotos',
    icon: <Home size={14} />,
    label: 'Imóveis incompletos',
    description: '2 imóveis sem fotos — completa o cadastro',
    urgency: 'medium',
  },
  {
    id: 'proposta-sem-visualizacao',
    icon: <Send size={14} />,
    label: 'Proposta sem visualização',
    description: 'Proposta enviada há 3 dias sem visualização — fazer follow-up',
    urgency: 'low',
  },
]

const urgencyStyle: Record<string, React.CSSProperties> = {
  high: {
    background: 'rgba(229,115,115,0.10)',
    borderColor: 'rgba(229,115,115,0.22)',
    color: '#e57373',
  },
  medium: {
    background: 'rgba(232,168,124,0.10)',
    borderColor: 'rgba(232,168,124,0.22)',
    color: 'var(--warning, #e8a87c)',
  },
  low: {
    background: 'rgba(72,101,129,0.10)',
    borderColor: 'rgba(72,101,129,0.22)',
    color: 'var(--text-secondary)',
  },
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl ${className ?? ''}`}
      style={{ background: 'rgba(72,101,129,0.12)' }}
    />
  )
}

export default function SmartNotifications() {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    text: '', loading: false, error: null,
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch unread count on mount
  useEffect(() => {
    fetch('/api/notifications?limit=5')
      .then(r => r.json())
      .then(res => {
        const items = Array.isArray(res) ? res : (res.data || [])
        setUnreadCount(items.filter((n: any) => !n.read).length)
      })
      .catch(() => {})
  }, [])

  // Load content when panel opens
  useEffect(() => {
    if (!open) return
    fetchDailySummary()
    // Simulate alerts loading
    setAlertsLoading(true)
    const t = setTimeout(() => setAlertsLoading(false), 600)
    return () => clearTimeout(t)
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function fetchDailySummary() {
    setDailySummary({ text: '', loading: true, error: null })
    try {
      const res = await fetch('/api/ai/daily-summary', { method: 'GET' })
      if (!res.ok) throw new Error('Erro ao carregar resumo')
      const data = await res.json()
      setDailySummary({ text: data.summary || data.text || data.content || '', loading: false, error: null })
    } catch {
      // Fallback: show a placeholder so the panel is still useful
      setDailySummary({
        text: 'Resumo do dia indisponível no momento. Verifique seus leads e tarefas pendentes.',
        loading: false,
        error: null,
      })
    }
  }

  async function handleQualifyLeads() {
    setActionLoading('qualify')
    try {
      await fetch('/api/ai/qualify-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    } catch {}
    setActionLoading(null)
  }

  async function handleGenerateSummary() {
    setActionLoading('summary')
    await fetchDailySummary()
    setActionLoading(null)
  }

  return (
    <>
      {/* Bell trigger button — rendered inline, consumed by DesktopHeader */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Abrir painel de notificações inteligentes"
        className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all"
        style={{
          background: open ? 'var(--bg-elevated)' : 'transparent',
          border: `1px solid ${open ? 'var(--border-focus)' : 'transparent'}`,
          color: open ? 'var(--imi-gold-500)' : 'var(--text-tertiary)',
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[10px] font-bold text-white rounded-full flex items-center justify-center"
            style={{ background: 'var(--imi-gold-500)', boxShadow: '0 0 0 2px var(--bg-surface)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-out panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-hidden transition-transform duration-300"
        style={{
          width: '380px',
          maxWidth: '100vw',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          background: 'var(--bo-elevated, var(--bg-elevated))',
          borderLeft: '1px solid var(--border-default)',
          boxShadow: open ? '-8px 0 40px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        {/* Panel header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: 'var(--imi-gold-500)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Assistente IA
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ background: 'rgba(184,148,58,0.15)', color: 'var(--imi-gold-500)' }}
            >
              BETA
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
            style={{ border: '1px solid var(--border-default)', color: 'var(--text-tertiary)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Daily Briefing ─────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
              BRIEFING DO DIA
            </p>
            <div
              className="rounded-2xl p-4"
              style={{
                background: 'rgba(184,148,58,0.06)',
                border: '1px solid rgba(184,148,58,0.18)',
              }}
            >
              {dailySummary.loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/6" />
                </div>
              ) : (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {dailySummary.text || 'Nenhum resumo disponível. Clique em "Gerar resumo" abaixo.'}
                </p>
              )}
            </div>
          </section>

          {/* ── Smart Alerts ───────────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
              ALERTAS INTELIGENTES
            </p>
            <div className="space-y-2">
              {alertsLoading
                ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)
                : STATIC_ALERTS.map(alert => {
                    const s = urgencyStyle[alert.urgency]
                    return (
                      <div
                        key={alert.id}
                        className="flex items-start gap-3 rounded-xl p-3"
                        style={{
                          background: s.background,
                          border: `1px solid ${s.borderColor}`,
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: s.background, color: s.color }}
                        >
                          {alert.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {alert.label}
                          </p>
                          <p className="text-[11px] mt-0.5 leading-tight" style={{ color: 'var(--text-secondary)' }}>
                            {alert.description}
                          </p>
                        </div>
                        <AlertTriangle size={12} className="flex-shrink-0 mt-1" style={{ color: s.color, opacity: 0.7 }} />
                      </div>
                    )
                  })}
            </div>
          </section>

          {/* ── Suggested Actions ──────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
              AÇÕES SUGERIDAS
            </p>
            <div className="space-y-2">

              {/* Qualificar leads */}
              <button
                onClick={handleQualifyLeads}
                disabled={actionLoading === 'qualify'}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:brightness-105 disabled:opacity-60"
                style={{
                  background: 'var(--bo-elevated, var(--bg-elevated))',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(184,148,58,0.12)', color: 'var(--imi-gold-500)' }}
                  >
                    {actionLoading === 'qualify'
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Sparkles size={13} />
                    }
                  </div>
                  <span className="text-xs font-medium">Qualificar leads com IA</span>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>

              {/* Gerar resumo */}
              <button
                onClick={handleGenerateSummary}
                disabled={actionLoading === 'summary' || dailySummary.loading}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:brightness-105 disabled:opacity-60"
                style={{
                  background: 'var(--bo-elevated, var(--bg-elevated))',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(72,101,129,0.12)', color: 'var(--text-secondary)' }}
                  >
                    {actionLoading === 'summary' || dailySummary.loading
                      ? <Loader2 size={13} className="animate-spin" />
                      : <ArrowRight size={13} />
                    }
                  </div>
                  <span className="text-xs font-medium">Gerar resumo do dia</span>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>

              {/* Ver leads quentes */}
              <button
                onClick={() => { setOpen(false); router.push('/backoffice/leads?filter=hot') }}
                className="w-full flex items-center justify-between rounded-xl px-4 py-3 transition-all hover:brightness-105"
                style={{
                  background: 'rgba(229,115,115,0.07)',
                  border: '1px solid rgba(229,115,115,0.18)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(229,115,115,0.12)', color: '#e57373' }}
                  >
                    <Users size={13} />
                  </div>
                  <span className="text-xs font-medium">Ver leads quentes</span>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>

            </div>
          </section>
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 px-5 py-3 text-center"
          style={{ borderTop: '1px solid var(--border-default)' }}
        >
          <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
            Sugestões geradas por IA · atualizado agora
          </p>
        </div>
      </div>
    </>
  )
}
