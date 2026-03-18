'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronRight, Target, Loader2, BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ── types ─────────────────────────────────────────────────── */
interface Objective {
  id: string
  title: string
  department: string
  quarter: string
  level: string
}
interface KeyResult {
  id: string
  objective_id: string
  current_value: number
  target_value: number
  start_value: number
}

/* ── helpers ───────────────────────────────────────────────── */
const QUARTERS = ['Q1-2026', 'Q2-2026', 'Q3-2026', 'Q4-2026']

function calcScore(kr: KeyResult) {
  const range = kr.target_value - kr.start_value
  if (range === 0) return 0
  return Math.max(0, Math.min(1, (kr.current_value - kr.start_value) / range))
}

function scoreStyle(score: number) {
  if (score >= 0.7) return { bg: 'bg-[#C8A44A]/20', text: 'text-[#C8A44A]', label: 'Ouro', border: 'border-[#C8A44A]/30' }
  if (score >= 0.6) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Verde', border: 'border-emerald-500/30' }
  if (score >= 0.3) return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Amarelo', border: 'border-amber-500/30' }
  return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Vermelho', border: 'border-red-500/30' }
}

const STORAGE_KEY = 'imi_retro_'

/* ── component ─────────────────────────────────────────────── */
export default function RetrospectivaPage() {
  const [loading, setLoading] = useState(true)
  const [quarter, setQuarter] = useState('Q1-2026')
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])

  // Editable text areas with localStorage
  const [worked, setWorked] = useState('')
  const [didntWork, setDidntWork] = useState('')
  const [lessons, setLessons] = useState('')

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

      // Load from localStorage
      const key = STORAGE_KEY + quarter
      setWorked(localStorage.getItem(key + '_worked') || '')
      setDidntWork(localStorage.getItem(key + '_didnt') || '')
      setLessons(localStorage.getItem(key + '_lessons') || '')

      setLoading(false)
    }
    load()
  }, [quarter])

  function saveText(field: string, value: string) {
    const key = STORAGE_KEY + quarter
    localStorage.setItem(key + '_' + field, value)
    if (field === 'worked') setWorked(value)
    if (field === 'didnt') setDidntWork(value)
    if (field === 'lessons') setLessons(value)
  }

  // Calculate scores per objective
  const objScores = objectives.map(obj => {
    const krs = keyResults.filter(kr => kr.objective_id === obj.id)
    const avg = krs.length > 0
      ? krs.reduce((s, kr) => s + calcScore(kr), 0) / krs.length
      : 0
    return { ...obj, score: avg, krCount: krs.length }
  })

  // Company average
  const companyAvg = objScores.length > 0
    ? objScores.reduce((s, o) => s + o.score, 0) / objScores.length
    : 0
  const companyStyle = scoreStyle(companyAvg)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-[#C8A44A] animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
          <Link href="/backoffice/metas" className="hover:text-white/60 transition-colors">Metas</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60">Retrospectiva</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
              Retrospectiva
            </h1>
            <p className="text-sm text-white/50 mt-1">Revisão de resultados do quarter</p>
          </div>
          <select
            value={quarter}
            onChange={e => setQuarter(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-[#C8A44A]/50"
          >
            {QUARTERS.map(q => (
              <option key={q} value={q} className="bg-[#0B1928]">{q}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Company Average */}
      <div className={`rounded-xl border ${companyStyle.border} p-6`} style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-center gap-3 mb-3">
          <Target className={`w-5 h-5 ${companyStyle.text}`} />
          <span className="text-sm font-medium text-white">Score Médio da Empresa</span>
        </div>
        <div className="flex items-baseline gap-3">
          <p className={`text-4xl font-bold ${companyStyle.text}`} style={{ fontFamily: 'DM Mono, monospace' }}>
            {(companyAvg * 100).toFixed(0)}%
          </p>
          <span className={`px-2 py-0.5 rounded-[6px] text-xs ${companyStyle.bg} ${companyStyle.text}`}>
            {companyStyle.label}
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-white/10 mt-4">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${companyAvg * 100}%`,
              background: companyAvg >= 0.7 ? '#C8A44A' : companyAvg >= 0.6 ? '#34d399' : companyAvg >= 0.3 ? '#fbbf24' : '#f87171',
            }}
          />
        </div>
        <p className="text-xs text-white/30 mt-2">{objScores.length} objetivos avaliados</p>
      </div>

      {/* OKRs with final scores */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Resultados por Objetivo</h2>
        {objScores.length === 0 ? (
          <div className="rounded-xl border border-white/10 p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-white/50 text-sm">Nenhum OKR encontrado para {quarter}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {objScores.sort((a, b) => b.score - a.score).map(obj => {
              const st = scoreStyle(obj.score)
              return (
                <div
                  key={obj.id}
                  className={`rounded-xl border ${st.border} p-4`}
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{obj.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-[6px] text-xs bg-white/[0.06] text-white/50">{obj.department}</span>
                        <span className="text-xs text-white/30">{obj.krCount} KRs</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${st.text}`} style={{ fontFamily: 'DM Mono, monospace' }}>
                        {(obj.score * 100).toFixed(0)}%
                      </p>
                      <span className={`px-2 py-0.5 rounded-[6px] text-xs ${st.bg} ${st.text}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${obj.score * 100}%`,
                        background: obj.score >= 0.7 ? '#C8A44A' : obj.score >= 0.6 ? '#34d399' : obj.score >= 0.3 ? '#fbbf24' : '#f87171',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reflection sections */}
      <div className="space-y-6">
        {[
          { title: 'O que funcionou', emoji: '✅', field: 'worked', value: worked, placeholder: 'Descreva o que deu certo neste quarter...' },
          { title: 'O que não funcionou', emoji: '❌', field: 'didnt', value: didntWork, placeholder: 'O que não atingiu as expectativas...' },
          { title: 'Lições aprendidas', emoji: '💡', field: 'lessons', value: lessons, placeholder: 'Aprendizados para o próximo quarter...' },
        ].map(section => (
          <div
            key={section.field}
            className="rounded-xl border border-white/10 p-5"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-[#C8A44A]" />
              <h3 className="text-sm font-semibold text-white">{section.title}</h3>
            </div>
            <textarea
              value={section.value}
              onChange={e => saveText(section.field, e.target.value)}
              placeholder={section.placeholder}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm bg-white/[0.03] border border-white/[0.06] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#C8A44A]/30 resize-none transition-colors"
            />
            <p className="text-[10px] text-white/20 mt-1">Salvo automaticamente no navegador</p>
          </div>
        ))}
      </div>
    </div>
  )
}
