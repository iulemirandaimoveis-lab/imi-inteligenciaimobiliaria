'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronRight, Target, TrendingUp, Loader2,
  Plus, Calendar, CheckCircle, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '../../../../lib/theme'

/* ── types ─────────────────────────────────────────────────── */
interface Objective {
  id: string
  title: string
  description: string | null
  department: string
  quarter: string
  level: string
  owner: string | null
  status: string
}
interface KeyResult {
  id: string
  objective_id: string
  title: string
  metric_type: string
  current_value: number
  target_value: number
  start_value: number
  unit: string | null
  direction: string
  due_date: string | null
}
interface CheckIn {
  id: string
  key_result_id: string
  value: number
  note: string | null
  created_at: string
}

/* ── helpers ───────────────────────────────────────────────── */
function calcScore(kr: KeyResult) {
  const range = kr.target_value - kr.start_value
  if (range === 0) return 0
  return Math.max(0, Math.min(1, (kr.current_value - kr.start_value) / range))
}

function scoreColor(score: number) {
  if (score >= 0.7) return { bg: T.activeBg, text: T.accent, bar: 'var(--accent-400)' }
  if (score >= 0.6) return { bg: 'rgba(52,211,153,0.15)', text: '#34d399', bar: '#34d399' }
  if (score >= 0.3) return { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', bar: '#fbbf24' }
  return { bg: 'rgba(248,113,113,0.15)', text: '#f87171', bar: '#f87171' }
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

/* ── component ─────────────────────────────────────────────── */
export default function OKRDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [obj, setObj] = useState<Objective | null>(null)
  const [krs, setKrs] = useState<KeyResult[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])

  // Check-in form
  const [checkInKR, setCheckInKR] = useState<string | null>(null)
  const [checkInValue, setCheckInValue] = useState('')
  const [checkInNote, setCheckInNote] = useState('')
  const [savingCheckIn, setSavingCheckIn] = useState(false)

  async function loadData() {
    const supabase = createClient()
    const [objRes, krRes, ciRes] = await Promise.all([
      supabase.from('okr_objectives').select('*').eq('id', id).single(),
      supabase.from('okr_key_results').select('*').eq('objective_id', id),
      supabase.from('okr_check_ins').select('*').order('created_at', { ascending: false }),
    ])
    setObj(objRes.data)
    setKrs(krRes.data ?? [])
    // Filter check-ins for this objective's KRs
    const krIds = new Set((krRes.data ?? []).map((kr: KeyResult) => kr.id))
    setCheckIns((ciRes.data ?? []).filter((ci: CheckIn) => krIds.has(ci.key_result_id)))
    setLoading(false)
  }

  useEffect(() => { loadData().catch(() => { toast.error('Erro ao carregar dados'); setLoading(false) }) }, [id])

  async function handleCheckIn() {
    if (!checkInKR || !checkInValue) return
    setSavingCheckIn(true)
    try {
      const supabase = createClient()
      const numValue = parseFloat(checkInValue)

      // Insert check-in
      const { error: ciErr } = await supabase.from('okr_check_ins').insert({
        key_result_id: checkInKR,
        value: numValue,
        note: checkInNote.trim() || null,
      })
      if (ciErr) throw ciErr

      // Update KR current_value
      const { error: krErr } = await supabase
        .from('okr_key_results')
        .update({ current_value: numValue })
        .eq('id', checkInKR)
      if (krErr) throw krErr

      toast.success('Check-in registrado!')
      setCheckInKR(null)
      setCheckInValue('')
      setCheckInNote('')
      loadData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      toast.error(message)
    } finally {
      setSavingCheckIn(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.accent }} />
      </div>
    )
  }

  if (!obj) {
    return (
      <div className="rounded-lg p-12 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <Target className="w-8 h-8 mx-auto mb-3" style={{ color: T.textDim }} />
        <p className="text-sm" style={{ color: T.textMuted }}>OKR n\u00e3o encontrado.</p>
        <Link href="/backoffice/metas/okrs" className="text-sm mt-2 inline-block hover:underline" style={{ color: T.accent }}>
          Voltar para OKRs
        </Link>
      </div>
    )
  }

  const avgScore = krs.length > 0
    ? krs.reduce((s, kr) => s + calcScore(kr), 0) / krs.length
    : 0
  const sc = scoreColor(avgScore)

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Breadcrumb */}
      <div>
        <div className="flex items-center gap-2 text-xs mb-1" style={{ color: T.textMuted }}>
          <Link href="/backoffice/metas" className="hover:opacity-80 transition-colors">Metas</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/backoffice/metas/okrs" className="hover:opacity-80 transition-colors">OKRs</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="truncate max-w-[200px]" style={{ color: T.textMuted }}>{obj.title}</span>
        </div>
      </div>

      {/* Objective Header */}
      <div className="rounded-lg p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: T.text }}>{obj.title}</h1>
            {obj.description && <p className="text-sm mt-2" style={{ color: T.textMuted }}>{obj.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-0.5 rounded-[6px] text-xs" style={{ background: T.hover, color: T.textMuted }}>{obj.department}</span>
              <span className="px-2 py-0.5 rounded-[6px] text-xs" style={{ background: T.hover, color: T.textMuted }}>{obj.quarter}</span>
              <span className="px-2 py-0.5 rounded-[6px] text-xs" style={{ background: T.hover, color: T.textMuted }}>{obj.level}</span>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-3xl font-bold" style={{ color: sc.text, fontFamily: T.font.data }}>
              {Math.round(avgScore * 100)}%
            </p>
            <span className="px-2 py-0.5 rounded-[6px] text-xs" style={{ background: sc.bg, color: sc.text }}>
              Score
            </span>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: T.hover }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${avgScore * 100}%`, background: sc.bar }}
          />
        </div>
      </div>

      {/* Key Results */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: T.text }}>Key Results</h2>
        {krs.length === 0 ? (
          <div className="rounded-lg p-8 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <p className="text-sm" style={{ color: T.textMuted }}>Nenhum Key Result definido.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {krs.map(kr => {
              const score = calcScore(kr)
              const krSc = scoreColor(score)
              const krCheckIns = checkIns.filter(ci => ci.key_result_id === kr.id)

              return (
                <div
                  key={kr.id}
                  className="rounded-lg p-5"
                  style={{ background: T.surface, border: `1px solid ${T.border}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: T.text }}>{kr.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: T.textMuted }}>
                        {kr.unit && <span>Unidade: {kr.unit}</span>}
                        {kr.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {fmtDate(kr.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-lg font-bold" style={{ color: krSc.text, fontFamily: T.font.data }}>
                      {Math.round(score * 100)}%
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs w-16" style={{ color: T.textMuted, fontFamily: T.font.data }}>
                      {fmt(kr.start_value)}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: T.hover }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score * 100}%`, background: krSc.bar }}
                      />
                    </div>
                    <span className="text-xs w-16 text-right" style={{ color: T.textMuted, fontFamily: T.font.data }}>
                      {fmt(kr.target_value)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-4" style={{ color: T.textMuted }}>
                    <span>Atual: <span className="font-medium" style={{ color: T.text, fontFamily: T.font.data }}>{fmt(kr.current_value)}</span></span>
                    <button
                      onClick={() => setCheckInKR(checkInKR === kr.id ? null : kr.id)}
                      className="flex items-center gap-1 transition-colors hover:opacity-80"
                      style={{ color: T.accent }}
                    >
                      <Plus className="w-3 h-3" />
                      Novo Check-in
                    </button>
                  </div>

                  {/* Inline check-in form */}
                  {checkInKR === kr.id && (
                    <div className="rounded-lg p-4 mb-4 space-y-3" style={{ background: T.activeBg, border: `1px solid ${T.borderActive}` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium" style={{ color: T.accent }}>Novo Check-in</span>
                        <button onClick={() => setCheckInKR(null)} className="hover:opacity-80" style={{ color: T.textDim }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs mb-1" style={{ color: T.textMuted }}>Valor Atual</label>
                          <input
                            type="number"
                            value={checkInValue}
                            onChange={e => setCheckInValue(e.target.value)}
                            placeholder={String(kr.current_value)}
                            className="w-full px-3 py-2 rounded-[6px] text-sm focus:outline-none transition-colors"
                            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1" style={{ color: T.textMuted }}>Nota (opcional)</label>
                          <input
                            type="text"
                            value={checkInNote}
                            onChange={e => setCheckInNote(e.target.value)}
                            placeholder="O que mudou?"
                            className="w-full px-3 py-2 rounded-[6px] text-sm focus:outline-none transition-colors"
                            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleCheckIn}
                        disabled={savingCheckIn || !checkInValue}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
                        style={{ background: T.accent, color: '#0B1928' }}
                      >
                        {savingCheckIn ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Registrar
                      </button>
                    </div>
                  )}

                  {/* Check-in history */}
                  {krCheckIns.length > 0 && (
                    <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${T.borderSubtle}` }}>
                      <p className="text-xs mb-2" style={{ color: T.textMuted }}>Hist\u00f3rico de Check-ins</p>
                      <div className="space-y-1.5">
                        {krCheckIns.slice(0, 5).map(ci => (
                          <div key={ci.id} className="flex items-center justify-between text-xs">
                            <span style={{ color: T.textMuted }}>{fmtDate(ci.created_at)}</span>
                            <div className="flex items-center gap-2">
                              {ci.note && <span className="truncate max-w-[200px]" style={{ color: T.textDim }}>{ci.note}</span>}
                              <span className="font-medium" style={{ color: T.text, fontFamily: T.font.data }}>
                                {fmt(ci.value)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
