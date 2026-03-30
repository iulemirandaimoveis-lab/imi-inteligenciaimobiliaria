'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight, Activity, Loader2, TrendingUp, TrendingDown,
  Plus, X, CheckCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '../../../../lib/theme'

/* ── types ─────────────────────────────────────────────────── */
interface KpiDef {
  id: string
  name: string
  description: string | null
  department: string
  direction: string
  unit: string | null
  target_value: number
  warning_threshold: number
  critical_threshold: number
}
interface KpiReading {
  id: string
  kpi_id: string
  value: number
  recorded_at: string
}

/* ── helpers ───────────────────────────────────────────────── */
function kpiStatus(kpi: KpiDef, value: number): 'green' | 'yellow' | 'red' {
  if (kpi.direction === 'increase') {
    if (value >= kpi.target_value) return 'green'
    if (value >= kpi.warning_threshold) return 'yellow'
    return 'red'
  }
  if (value <= kpi.target_value) return 'green'
  if (value <= kpi.warning_threshold) return 'yellow'
  return 'red'
}

const statusStyles = {
  green: { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: 'Saud\u00e1vel', barColor: '#34d399' },
  yellow: { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', label: 'Aten\u00e7\u00e3o', barColor: '#fbbf24' },
  red: { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'Cr\u00edtico', barColor: '#f87171' },
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

/* ── component ─────────────────────────────────────────────── */
export default function KPIDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [kpi, setKpi] = useState<KpiDef | null>(null)
  const [readings, setReadings] = useState<KpiReading[]>([])

  // New reading form
  const [showForm, setShowForm] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [saving, setSaving] = useState(false)

  async function loadData() {
    const supabase = createClient()
    const [defRes, readRes] = await Promise.all([
      supabase.from('kpi_definitions').select('*').eq('id', id).single(),
      supabase.from('kpi_readings').select('*').eq('kpi_id', id).order('recorded_at', { ascending: true }).limit(30),
    ])
    setKpi(defRes.data)
    setReadings(readRes.data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadData().catch(() => { toast.error('Erro ao carregar dados'); setLoading(false) }) }, [id])

  async function handleNewReading() {
    if (!newValue) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('kpi_readings').insert({
        kpi_id: id,
        value: parseFloat(newValue),
      })
      if (error) throw error
      toast.success('Leitura registrada!')
      setNewValue('')
      setShowForm(false)
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.accent }} />
      </div>
    )
  }

  if (!kpi) {
    return (
      <div className="rounded-lg p-12 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <Activity className="w-8 h-8 mx-auto mb-3" style={{ color: T.textDim }} />
        <p className="text-sm" style={{ color: T.textMuted }}>KPI n\u00e3o encontrado.</p>
        <Link href="/backoffice/metas/kpis" className="text-sm mt-2 inline-block hover:underline" style={{ color: T.accent }}>
          Voltar para KPIs
        </Link>
      </div>
    )
  }

  const currentValue = readings.length > 0 ? readings[readings.length - 1].value : 0
  const prevValue = readings.length >= 2 ? readings[readings.length - 2].value : currentValue
  const trendUp = currentValue >= prevValue
  const status = kpiStatus(kpi, currentValue)
  const st = statusStyles[status]
  const maxVal = Math.max(...readings.map(r => r.value), kpi.target_value, 1)

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs mb-1" style={{ color: T.textMuted }}>
          <Link href="/backoffice/metas" className="hover:opacity-80 transition-colors">Metas</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/backoffice/metas/kpis" className="hover:opacity-80 transition-colors">KPIs</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="truncate max-w-[200px]" style={{ color: T.textMuted }}>{kpi.name}</span>
        </div>
      </div>

      {/* KPI Header */}
      <div className="rounded-lg p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: T.text }}>{kpi.name}</h1>
            {kpi.description && <p className="text-sm mt-1" style={{ color: T.textMuted }}>{kpi.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-0.5 rounded-[6px] text-xs" style={{ background: T.hover, color: T.textMuted }}>{kpi.department}</span>
              <span className="px-2 py-0.5 rounded-[6px] text-xs" style={{ background: st.bg, color: st.text }}>{st.label}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold" style={{ color: T.text, fontFamily: T.font.data }}>
                {fmt(currentValue)}
              </p>
              {kpi.unit && <span className="text-sm" style={{ color: T.textMuted }}>{kpi.unit}</span>}
            </div>
            {readings.length >= 2 && (
              <span className={`flex items-center gap-1 justify-end text-xs mt-1 ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trendUp ? '+' : ''}{fmt(currentValue - prevValue)}
              </span>
            )}
          </div>
        </div>

        {/* Thresholds */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSubtle}` }}>
          <div>
            <p className="text-xs mb-1" style={{ color: T.textMuted }}>Meta</p>
            <p className="text-sm font-bold text-emerald-400" style={{ fontFamily: T.font.data }}>
              {fmt(kpi.target_value)}
            </p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: T.textMuted }}>Alerta</p>
            <p className="text-sm font-bold text-amber-400" style={{ fontFamily: T.font.data }}>
              {fmt(kpi.warning_threshold)}
            </p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: T.textMuted }}>Cr\u00edtico</p>
            <p className="text-sm font-bold text-red-400" style={{ fontFamily: T.font.data }}>
              {fmt(kpi.critical_threshold)}
            </p>
          </div>
        </div>
      </div>

      {/* Registrar Leitura */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: T.accent, color: '#0B1928' }}
        >
          <Plus className="w-4 h-4" />
          Registrar Leitura
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg p-5 space-y-4" style={{ background: T.activeBg, border: `1px solid ${T.borderActive}` }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: T.accent }}>Nova Leitura</span>
            <button onClick={() => setShowForm(false)} className="hover:opacity-80" style={{ color: T.textDim }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: T.textMuted }}>Valor</label>
              <input
                type="number"
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-[6px] text-sm focus:outline-none transition-colors"
                style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
              />
            </div>
            <button
              onClick={handleNewReading}
              disabled={saving || !newValue}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ background: T.accent, color: '#0B1928' }}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Historical Chart (CSS bars) */}
      <div className="rounded-lg p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: T.text }}>Hist\u00f3rico ({readings.length} leituras)</h2>
        {readings.length === 0 ? (
          <p className="text-sm text-center py-8" style={{ color: T.textMuted }}>Nenhuma leitura registrada.</p>
        ) : (
          <div>
            {/* Target line reference */}
            <div className="relative">
              <div className="flex items-end gap-1 h-40">
                {readings.map((r, i) => {
                  const pct = (r.value / maxVal) * 100
                  const barStatus = kpiStatus(kpi, r.value)
                  const barSt = statusStyles[barStatus]
                  return (
                    <div key={r.id} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div
                        className="w-full rounded-t-sm min-h-[2px] transition-all duration-300"
                        style={{
                          height: `${Math.max(pct, 2)}%`,
                          background: barSt.barColor,
                          opacity: 0.5 + (i / readings.length) * 0.5,
                        }}
                      />
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                        <div className="px-2 py-1 rounded text-xs whitespace-nowrap" style={{ background: 'var(--bg-base)', border: `1px solid ${T.border}`, color: T.text }}>
                          <span style={{ fontFamily: T.font.data }}>{fmt(r.value)}</span>
                          <br />
                          <span style={{ color: T.textMuted }}>{fmtDate(r.recorded_at)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {/* Target line */}
              <div
                className="absolute left-0 right-0 border-t border-dashed border-emerald-400/30"
                style={{ bottom: `${(kpi.target_value / maxVal) * 100}%` }}
              >
                <span className="absolute right-0 -top-4 text-[10px] text-emerald-400/50">Meta</span>
              </div>
            </div>
            {/* Date labels */}
            <div className="flex justify-between mt-2 text-[10px]" style={{ color: T.textDim }}>
              {readings.length > 0 && <span>{fmtDate(readings[0].recorded_at)}</span>}
              {readings.length > 1 && <span>{fmtDate(readings[readings.length - 1].recorded_at)}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
