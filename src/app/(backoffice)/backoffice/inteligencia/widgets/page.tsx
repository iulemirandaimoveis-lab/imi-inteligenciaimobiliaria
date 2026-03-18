'use client'

import { useState, useEffect, useCallback } from 'react'

interface WidgetConfig {
  id: string
  widget_id: string
  name: string
  description: string | null
  category: string
  enabled: boolean
  display_order: number
  config: Record<string, any>
}

type Toast = { type: 'success' | 'error'; message: string } | null

const CATEGORY_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  market:  { bg: 'rgba(184,148,58,0.12)',  color: 'var(--bo-accent,var(--imi-gold-500))', label: 'Mercado'   },
  finance: { bg: 'rgba(59,130,246,0.12)',  color: 'var(--info)',                  label: 'Finanças'  },
  compare: { bg: 'rgba(139,92,246,0.12)',  color: 'var(--imi-gold-500)',                  label: 'Comparação' },
  risk:    { bg: 'rgba(239,68,68,0.12)',   color: '#EF4444',                  label: 'Risco'     },
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      style={{
        width: 44, height: 24, borderRadius: 6, border: 'none', cursor: 'pointer',
        background: enabled ? 'var(--bo-accent,var(--imi-gold-500))' : 'var(--bo-border,#2a3a4a)',
        position: 'relative', transition: 'background 200ms', flexShrink: 0,
      }}
      aria-checked={enabled}
      role="switch"
      aria-label={enabled ? 'Desativar widget' : 'Ativar widget'}
    >
      <div style={{
        position: 'absolute', top: 3, left: enabled ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: 'white', transition: 'left 200ms',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const style = CATEGORY_STYLE[category] ?? { bg: 'rgba(128,128,128,0.12)', color: '#888', label: category }
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase' as const,
      background: style.bg,
      color: style.color,
      fontFamily: 'var(--font-ui,"Figtree",sans-serif)',
    }}>
      {style.label}
    </span>
  )
}

function WidgetCardSkeleton() {
  return (
    <div style={{
      background: 'var(--bo-surface)',
      border: '1px solid var(--bo-border)',
      borderRadius: 'var(--r-sm,4px)',
      padding: 20,
      height: 140,
      opacity: 0.6,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
}

function ToastMessage({ toast, onDismiss }: { toast: NonNullable<Toast>; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      padding: '12px 20px',
      borderRadius: 'var(--r-sm,4px)',
      background: toast.type === 'success' ? 'var(--bo-accent,var(--imi-gold-500))' : '#EF4444',
      color: toast.type === 'success' ? '#1a1a1a' : '#fff',
      fontFamily: 'var(--font-ui,"Figtree",sans-serif)',
      fontSize: 14,
      fontWeight: 600,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 12,
      cursor: 'pointer',
    }} onClick={onDismiss}>
      <span>{toast.type === 'success' ? '✓' : '✕'}</span>
      {toast.message}
    </div>
  )
}

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<WidgetConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [error, setError] = useState<string | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
  }, [])

  useEffect(() => {
    async function fetchWidgets() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/widgets/config')
        if (!res.ok) throw new Error(`Erro ${res.status}: Falha ao carregar widgets`)
        const data = await res.json()
        const list: WidgetConfig[] = Array.isArray(data) ? data : (data.widgets ?? data.data ?? [])
        list.sort((a, b) => a.display_order - b.display_order)
        setWidgets(list)
      } catch (err: any) {
        setError(err.message ?? 'Erro ao carregar widgets')
      } finally {
        setLoading(false)
      }
    }
    fetchWidgets()
  }, [])

  async function handleToggle(id: string, enabled: boolean) {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, enabled } : w))
    try {
      const res = await fetch('/api/widgets/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgets: [{ id, enabled, display_order: widgets.find(w => w.id === id)?.display_order ?? 0 }],
        }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar')
      showToast('success', enabled ? 'Widget ativado' : 'Widget desativado')
    } catch {
      // Revert on failure
      setWidgets(prev => prev.map(w => w.id === id ? { ...w, enabled: !enabled } : w))
      showToast('error', 'Erro ao atualizar widget')
    }
  }

  async function handleSaveOrder() {
    setSaving(true)
    try {
      const payload = widgets.map((w, i) => ({ id: w.id, enabled: w.enabled, display_order: i + 1 }))
      const res = await fetch('/api/widgets/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgets: payload }),
      })
      if (!res.ok) throw new Error('Falha ao salvar')
      setWidgets(prev => prev.map((w, i) => ({ ...w, display_order: i + 1 })))
      showToast('success', 'Ordem salva com sucesso')
    } catch {
      showToast('error', 'Erro ao salvar ordem')
    } finally {
      setSaving(false)
    }
  }

  const activeCount = widgets.filter(w => w.enabled).length
  const totalCount = widgets.length

  return (
    <div style={{
      padding: '32px 24px',
      minHeight: '100vh',
      fontFamily: 'var(--font-ui,"Figtree",sans-serif)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap' as const,
        gap: 16,
        marginBottom: 28,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display,"Figtree",sans-serif)',
            fontSize: 24,
            fontWeight: 700,
            margin: '0 0 4px',
            color: 'var(--bo-text-primary,#f0f0f0)',
            letterSpacing: '-0.01em',
          }}>
            Widgets de Inteligência
          </h1>
          <p style={{
            fontSize: 13,
            color: 'var(--bo-text-muted,#8899aa)',
            margin: 0,
          }}>
            Gerencie os widgets da página /inteligencia
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {!loading && !error && (
            <span style={{
              fontSize: 13,
              color: 'var(--bo-text-muted,#8899aa)',
              background: 'var(--bo-surface)',
              border: '1px solid var(--bo-border)',
              borderRadius: 'var(--r-sm,4px)',
              padding: '6px 14px',
            }}>
              <span style={{ color: 'var(--bo-accent,var(--imi-gold-500))', fontWeight: 700 }}>{activeCount}</span>
              <span style={{ margin: '0 4px' }}>de</span>
              <span style={{ fontWeight: 600 }}>{totalCount}</span>
              <span style={{ marginLeft: 4 }}>widgets ativos</span>
            </span>
          )}
          <button
            className="bo-btn-primary"
            onClick={handleSaveOrder}
            disabled={saving || loading}
            style={{ opacity: saving || loading ? 0.6 : 1 }}
          >
            {saving ? 'Salvando...' : 'Salvar Ordem'}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--r-sm,4px)',
          padding: '16px 20px',
          color: '#EF4444',
          fontSize: 14,
          marginBottom: 24,
        }}>
          {error}
        </div>
      )}

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 16,
      }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <WidgetCardSkeleton key={i} />)
          : widgets.map((widget, index) => (
              <WidgetCard
                key={widget.id}
                widget={widget}
                index={index}
                onToggle={handleToggle}
              />
            ))
        }
      </div>

      {!loading && !error && widgets.length === 0 && (
        <div style={{
          textAlign: 'center' as const,
          padding: '64px 24px',
          color: 'var(--bo-text-muted,#8899aa)',
          fontSize: 14,
        }}>
          Nenhum widget configurado.
        </div>
      )}

      {/* Toast */}
      {toast && <ToastMessage toast={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

function WidgetCard({
  widget,
  index,
  onToggle,
}: {
  widget: WidgetConfig
  index: number
  onToggle: (id: string, enabled: boolean) => void
}) {
  return (
    <div style={{
      background: 'var(--bo-surface)',
      border: '1px solid var(--bo-border)',
      borderRadius: 'var(--r-sm,4px)',
      padding: 20,
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 12,
      transition: 'border-color 200ms',
      opacity: widget.enabled ? 1 : 0.65,
    }}>
      {/* Top row: order + toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--bo-text-muted,#8899aa)',
          letterSpacing: '0.06em',
          background: 'var(--bo-bg,#0f1923)',
          border: '1px solid var(--bo-border)',
          borderRadius: 6,
          padding: '2px 9px',
        }}>
          #{index + 1}
        </span>
        <ToggleSwitch enabled={widget.enabled} onChange={(v) => onToggle(widget.id, v)} />
      </div>

      {/* Name + description */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--bo-text-primary,#f0f0f0)',
          marginBottom: 4,
          lineHeight: 1.3,
        }}>
          {widget.name}
        </div>
        {widget.description && (
          <div style={{
            fontSize: 12,
            color: 'var(--bo-text-muted,#8899aa)',
            lineHeight: 1.5,
          }}>
            {widget.description}
          </div>
        )}
      </div>

      {/* Category badge */}
      <div>
        <CategoryBadge category={widget.category} />
      </div>
    </div>
  )
}
