'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bell, X, Sparkles, AlertTriangle, ArrowRight, Loader2,
  Users, Star, Home, Send, ChevronRight, Check, Building2,
  FileText, MessageSquare, Info, Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  read: boolean
  created_at: string
  data: Record<string, unknown> | null
}

interface DailySummary {
  text: string
  loading: boolean
  error: string | null
}

function notifIcon(type: string) {
  switch (type) {
    case 'lead': case 'lead_novo': return <Users size={13} />
    case 'development': case 'imovel': return <Building2 size={13} />
    case 'evaluation': case 'avaliacao': return <Star size={13} />
    case 'consultation': return <FileText size={13} />
    case 'comment': return <MessageSquare size={13} />
    case 'update': return <Zap size={13} />
    default: return <Info size={13} />
  }
}

function notifColor(type: string): { bg: string; color: string; border: string } {
  switch (type) {
    case 'lead': case 'lead_novo':
      return { bg: 'rgba(229,115,115,0.10)', color: '#e57373', border: 'rgba(229,115,115,0.22)' }
    case 'development': case 'imovel':
      return { bg: 'rgba(96,165,250,0.10)', color: '#60a5fa', border: 'rgba(96,165,250,0.22)' }
    case 'evaluation': case 'avaliacao':
      return { bg: 'rgba(201,168,76,0.10)', color: '#c9a84c', border: 'rgba(201,168,76,0.22)' }
    default:
      return { bg: 'rgba(72,101,129,0.10)', color: 'var(--text-secondary)', border: 'rgba(72,101,129,0.22)' }
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className ?? ''}`}
      style={{ background: 'rgba(72,101,129,0.12)' }}
    />
  )
}

export default function SmartNotifications() {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifsLoading, setNotifsLoading] = useState(false)
  const [dailySummary, setDailySummary] = useState<DailySummary>({
    text: '', loading: false, error: null,
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20')
      const json = await res.json()
      const items: Notification[] = Array.isArray(json) ? json : (json.data || [])
      setNotifications(items)
      setUnreadCount(items.filter(n => !n.read).length)
    } catch { /* silent */ }
  }, [])

  // Fetch on mount + setup Realtime
  useEffect(() => {
    fetchNotifications()

    const supabase = createClient()
    const channel = supabase
      .channel('notif-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        const n = payload.new as Notification
        setNotifications(prev => [n, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchNotifications])

  // Refetch when panel opens
  useEffect(() => {
    if (!open) return
    setNotifsLoading(true)
    fetchNotifications().then(() => setNotifsLoading(false))
    fetchDailySummary()
  }, [open, fetchNotifications])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function markAsRead(id: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* silent */ }
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read_all: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
  }

  async function fetchDailySummary() {
    setDailySummary({ text: '', loading: true, error: null })
    try {
      const res = await fetch('/api/ai/daily-summary', { method: 'GET' })
      if (!res.ok) throw new Error('Erro ao carregar resumo')
      const data = await res.json()
      setDailySummary({ text: data.summary || data.text || data.content || '', loading: false, error: null })
    } catch {
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
    } catch (err) { console.error('[qualify-leads]', err) }
    setActionLoading(null)
  }

  async function handleGenerateSummary() {
    setActionLoading('summary')
    await fetchDailySummary()
    setActionLoading(null)
  }

  return (
    <>
      {/* Bell trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Abrir painel de notificações"
        className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-all"
        style={{
          background: open ? 'var(--bg-elevated)' : 'transparent',
          border: `1px solid ${open ? 'var(--border-focus)' : 'transparent'}`,
          color: open ? 'var(--accent-400)' : 'var(--text-tertiary)',
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] text-[11px] font-bold text-white flex items-center justify-center"
            style={{
              background: '#FF3B30',
              borderRadius: 999,
              padding: unreadCount > 9 ? '0 5px' : '0',
              boxShadow: '0 0 0 2px var(--bg-surface)',
              lineHeight: 1,
              letterSpacing: '-0.01em',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
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
          background: 'var(--bg-elevated)',
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
            <Bell size={16} style={{ color: 'var(--accent-400)' }} />
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              Notificações
            </span>
            {unreadCount > 0 && (
              <span
                className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold"
                style={{ background: 'rgba(229,115,115,0.15)', color: '#e57373' }}
              >
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] font-medium px-2 py-1 rounded-md transition-all hover:opacity-70"
                style={{ color: 'var(--accent-400)' }}
              >
                <Check size={12} className="inline mr-1" />
                Marcar todas
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-[6px] flex items-center justify-center transition-all hover:opacity-70"
              style={{ border: '1px solid var(--border-default)', color: 'var(--text-tertiary)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Real Notifications ─────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
              NOTIFICAÇÕES
            </p>
            <div className="space-y-2">
              {notifsLoading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)
              ) : notifications.length === 0 ? (
                <div
                  className="rounded-lg p-4 text-center"
                  style={{ background: 'rgba(72,101,129,0.06)', border: '1px solid rgba(72,101,129,0.12)' }}
                >
                  <Bell size={20} className="mx-auto mb-2" style={{ color: 'var(--text-tertiary)', opacity: 0.5 }} />
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Nenhuma notificação ainda
                  </p>
                </div>
              ) : (
                notifications.slice(0, 10).map(n => {
                  const colors = notifColor(n.type)
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.read) markAsRead(n.id)
                        // Navigate based on type
                        if (n.data?.url) {
                          setOpen(false)
                          router.push(n.data.url as string)
                        }
                      }}
                      className="w-full flex items-start gap-3 rounded-lg p-3 text-left transition-all hover:brightness-105"
                      style={{
                        background: n.read ? 'transparent' : colors.bg,
                        border: `1px solid ${n.read ? 'var(--border-default)' : colors.border}`,
                        borderLeft: n.read ? '1px solid var(--border-default)' : `3px solid ${colors.color}`,
                      }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: colors.bg, color: colors.color }}
                      >
                        {notifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-[11px] mt-0.5 leading-tight truncate" style={{ color: 'var(--text-secondary)' }}>
                            {n.message}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>
                          {timeAgo(n.created_at)}
                        </span>
                        {!n.read && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: colors.color }}
                          />
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </section>

          {/* ── Daily Briefing ─────────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
              BRIEFING DO DIA
            </p>
            <div
              className="rounded-lg p-4"
              style={{
                background: 'rgba(61,111,255,0.06)',
                border: '1px solid rgba(61,111,255,0.18)',
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

          {/* ── Suggested Actions ──────────────────────────────── */}
          <section>
            <p className="text-[10px] font-bold tracking-widest mb-3" style={{ color: 'var(--text-tertiary)' }}>
              AÇÕES RÁPIDAS
            </p>
            <div className="space-y-2">
              <button
                onClick={handleQualifyLeads}
                disabled={actionLoading === 'qualify'}
                className="w-full flex items-center justify-between rounded-lg px-4 py-3 transition-all hover:brightness-105 disabled:opacity-60"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(61,111,255,0.12)', color: 'var(--accent-400)' }}>
                    {actionLoading === 'qualify' ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  </div>
                  <span className="text-xs font-medium">Qualificar leads com IA</span>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>

              <button
                onClick={handleGenerateSummary}
                disabled={actionLoading === 'summary' || dailySummary.loading}
                className="w-full flex items-center justify-between rounded-lg px-4 py-3 transition-all hover:brightness-105 disabled:opacity-60"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(72,101,129,0.12)', color: 'var(--text-secondary)' }}>
                    {actionLoading === 'summary' || dailySummary.loading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                  </div>
                  <span className="text-xs font-medium">Gerar resumo do dia</span>
                </div>
                <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
              </button>

              <button
                onClick={() => { setOpen(false); router.push('/backoffice/leads?filter=hot') }}
                className="w-full flex items-center justify-between rounded-lg px-4 py-3 transition-all hover:brightness-105"
                style={{
                  background: 'rgba(229,115,115,0.07)',
                  border: '1px solid rgba(229,115,115,0.18)',
                  color: 'var(--text-primary)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(229,115,115,0.12)', color: '#e57373' }}>
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
            Atualizado em tempo real via Supabase
          </p>
        </div>
      </div>
    </>
  )
}
