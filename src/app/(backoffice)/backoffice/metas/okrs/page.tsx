'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target, Plus, Loader2, ChevronRight, Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ── types ─────────────────────────────────────────────────── */
interface Objective {
  id: string
  title: string
  department: string
  quarter: string
  level: string
  owner: string | null
  status: string
}
interface KeyResult {
  id: string
  objective_id: string
  current_value: number
  target_value: number
  start_value: number
}

/* ── helpers ───────────────────────────────────────────────── */
const DEPARTMENTS = ['Todos', 'Vendas', 'Marketing', 'Produto', 'Financeiro', 'Operações']
const QUARTERS = ['Q1-2026', 'Q2-2026', 'Q3-2026', 'Q4-2026']

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

const levelLabel: Record<string, string> = {
  company: 'Empresa',
  department: 'Departamento',
  individual: 'Individual',
}

const statusBadge: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Ativo' },
  on_track: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'No caminho' },
  at_risk: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Em risco' },
  behind: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Atrasado' },
  completed: { bg: 'bg-gold/20', text: 'text-gold', label: 'Concluído' },
}

/* ── component ─────────────────────────────────────────────── */
export default function OKRsListPage() {
  const [loading, setLoading] = useState(true)
  const [quarter, setQuarter] = useState('Q1-2026')
  const [dept, setDept] = useState('Todos')
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const [objRes, krRes] = await Promise.all([
        supabase.from('okr_objectives').select('*').eq('quarter', quarter),
        supabase.from('okr_key_results').select('*'),
      ])
      setObjectives(objRes.data ?? [])
      setKeyResults(krRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [quarter])

  const filtered = dept === 'Todos' ? objectives : objectives.filter(o => o.department === dept)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
            <Link href="/backoffice/metas" className="hover:text-white/60 transition-colors">Metas</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">OKRs</span>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
            OKRs
          </h1>
          <p className="text-sm text-white/50 mt-1">Objetivos e Key Results do quarter</p>
        </div>
        <Link
          href="/backoffice/metas/okrs/novo"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-navy-900"
          style={{ background: '#C8A44A' }}
        >
          <Plus className="w-4 h-4" />
          Novo OKR
        </Link>
      </div>

      {/* Quarter selector */}
      <div className="flex items-center gap-4">
        <select
          value={quarter}
          onChange={e => setQuarter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-gold/50"
        >
          {QUARTERS.map(q => (
            <option key={q} value={q} className="bg-navy-900">{q}</option>
          ))}
        </select>
      </div>

      {/* Department filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DEPARTMENTS.map(d => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium whitespace-nowrap transition-colors ${
              dept === d
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'bg-white/[0.03] text-white/50 border border-white/10 hover:text-white/70'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* OKR Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <Target className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">Nenhum OKR encontrado para {quarter}.</p>
          <p className="text-white/30 text-xs mt-1">Crie o primeiro objetivo do quarter.</p>
          <Link
            href="/backoffice/metas/okrs/novo"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium text-navy-900"
            style={{ background: '#C8A44A' }}
          >
            <Plus className="w-4 h-4" />
            Novo OKR
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(obj => {
            const krs = keyResults.filter(kr => kr.objective_id === obj.id)
            const avgScore = krs.length > 0
              ? krs.reduce((s, kr) => s + calcScore(kr), 0) / krs.length
              : 0
            const sc = scoreColor(avgScore)
            const badge = statusBadge[obj.status] || statusBadge.active

            return (
              <Link
                key={obj.id}
                href={`/backoffice/metas/okrs/${obj.id}`}
                className="block rounded-xl border border-white/10 p-5 hover:border-white/20 transition-colors group"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white group-hover:text-gold transition-colors truncate">
                      {obj.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded-[6px] text-xs bg-white/[0.06] text-white/50">
                        {obj.department}
                      </span>
                      <span className="px-2 py-0.5 rounded-[6px] text-xs bg-white/[0.06] text-white/40">
                        {levelLabel[obj.level] || obj.level}
                      </span>
                      <span className={`px-2 py-0.5 rounded-[6px] text-xs ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className={`text-lg font-bold ${sc.text}`} style={{ fontFamily: 'DM Mono, monospace' }}>
                      {Math.round(avgScore * 100)}%
                    </p>
                  </div>
                </div>

                {obj.owner && (
                  <div className="flex items-center gap-1.5 mb-3 text-xs text-white/40">
                    <Users className="w-3 h-3" />
                    {obj.owner}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${avgScore * 100}%`, background: sc.bar }}
                    />
                  </div>
                  <span className="text-xs text-white/40 flex-shrink-0">
                    {krs.length} KR{krs.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
