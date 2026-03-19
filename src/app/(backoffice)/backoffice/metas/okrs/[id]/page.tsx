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
  if (score >= 0.7) return { bg: 'bg-gold/20', text: 'text-gold', bar: '#C8A44A' }
  if (score >= 0.6) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', bar: '#34d399' }
  if (score >= 0.3) return { bg: 'bg-amber-500/20', text: 'text-amber-400', bar: '#fbbf24' }
  return { bg: 'bg-red-500/20', text: 'text-red-400', bar: '#f87171' }
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v)
const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

const inputCls = 'w-full px-3 py-2 rounded-[6px] text-sm bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 transition-colors'

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

  useEffect(() => { loadData() }, [id])

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
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  if (!obj) {
    return (
      <div className="rounded-lg border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <Target className="w-8 h-8 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 text-sm">OKR não encontrado.</p>
        <Link href="/backoffice/metas/okrs" className="text-gold text-sm mt-2 inline-block hover:underline">
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
        <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
          <Link href="/backoffice/metas" className="hover:text-white/60 transition-colors">Metas</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/backoffice/metas/okrs" className="hover:text-white/60 transition-colors">OKRs</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60 truncate max-w-[200px]">{obj.title}</span>
        </div>
      </div>

      {/* Objective Header */}
      <div className="rounded-lg border border-white/10 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{obj.title}</h1>
            {obj.description && <p className="text-sm text-white/50 mt-2">{obj.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              <span className="px-2 py-0.5 rounded-[6px] text-xs bg-white/[0.06] text-white/50">{obj.department}</span>
              <span className="px-2 py-0.5 rounded-[6px] text-xs bg-white/[0.06] text-white/40">{obj.quarter}</span>
              <span className="px-2 py-0.5 rounded-[6px] text-xs bg-white/[0.06] text-white/40">{obj.level}</span>
            </div>
          </div>
          <div className="text-right ml-4">
            <p className={`text-3xl font-bold ${sc.text}`} style={{ fontFamily: 'DM Mono, monospace' }}>
              {Math.round(avgScore * 100)}%
            </p>
            <span className={`px-2 py-0.5 rounded-[6px] text-xs ${sc.bg} ${sc.text}`}>
              Score
            </span>
          </div>
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${avgScore * 100}%`, background: sc.bar }}
          />
        </div>
      </div>

      {/* Key Results */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Key Results</h2>
        {krs.length === 0 ? (
          <div className="rounded-lg border border-white/10 p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-white/50 text-sm">Nenhum Key Result definido.</p>
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
                  className="rounded-lg border border-white/10 p-5"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{kr.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                        {kr.unit && <span>Unidade: {kr.unit}</span>}
                        {kr.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {fmtDate(kr.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${krSc.text}`} style={{ fontFamily: 'DM Mono, monospace' }}>
                      {Math.round(score * 100)}%
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-white/40 w-16" style={{ fontFamily: 'DM Mono, monospace' }}>
                      {fmt(kr.start_value)}
                    </span>
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${score * 100}%`, background: krSc.bar }}
                      />
                    </div>
                    <span className="text-xs text-white/40 w-16 text-right" style={{ fontFamily: 'DM Mono, monospace' }}>
                      {fmt(kr.target_value)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/40 mb-4">
                    <span>Atual: <span className="text-white font-medium" style={{ fontFamily: 'DM Mono, monospace' }}>{fmt(kr.current_value)}</span></span>
                    <button
                      onClick={() => setCheckInKR(checkInKR === kr.id ? null : kr.id)}
                      className="flex items-center gap-1 text-gold hover:text-gold-400 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Novo Check-in
                    </button>
                  </div>

                  {/* Inline check-in form */}
                  {checkInKR === kr.id && (
                    <div className="rounded-lg border border-gold/20 p-4 mb-4 space-y-3" style={{ background: 'rgba(200,164,74,0.05)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gold">Novo Check-in</span>
                        <button onClick={() => setCheckInKR(null)} className="text-white/30 hover:text-white/60">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-white/50 mb-1">Valor Atual</label>
                          <input
                            type="number"
                            value={checkInValue}
                            onChange={e => setCheckInValue(e.target.value)}
                            placeholder={String(kr.current_value)}
                            className={inputCls}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/50 mb-1">Nota (opcional)</label>
                          <input
                            type="text"
                            value={checkInNote}
                            onChange={e => setCheckInNote(e.target.value)}
                            placeholder="O que mudou?"
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleCheckIn}
                        disabled={savingCheckIn || !checkInValue}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-[#0B1928] disabled:opacity-50"
                        style={{ background: '#C8A44A' }}
                      >
                        {savingCheckIn ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Registrar
                      </button>
                    </div>
                  )}

                  {/* Check-in history */}
                  {krCheckIns.length > 0 && (
                    <div className="border-t border-white/[0.06] pt-3 mt-3">
                      <p className="text-xs text-white/40 mb-2">Histórico de Check-ins</p>
                      <div className="space-y-1.5">
                        {krCheckIns.slice(0, 5).map(ci => (
                          <div key={ci.id} className="flex items-center justify-between text-xs">
                            <span className="text-white/50">{fmtDate(ci.created_at)}</span>
                            <div className="flex items-center gap-2">
                              {ci.note && <span className="text-white/30 truncate max-w-[200px]">{ci.note}</span>}
                              <span className="text-white font-medium" style={{ fontFamily: 'DM Mono, monospace' }}>
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
