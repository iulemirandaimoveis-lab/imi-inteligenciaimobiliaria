'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target, Loader2, BookOpen,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '../../../lib/theme'
import { PageIntelHeader } from '../../../components/ui'

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
  if (score >= 0.7) return { bg: T.activeBg, text: T.accent, label: 'Ouro', border: T.borderActive, barColor: 'var(--accent-400)' }
  if (score >= 0.6) return { bg: 'rgba(52,211,153,0.15)', text: '#34d399', label: 'Verde', border: 'rgba(52,211,153,0.3)', barColor: '#34d399' }
  if (score >= 0.3) return { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', label: 'Amarelo', border: 'rgba(251,191,36,0.3)', barColor: '#fbbf24' }
  return { bg: 'rgba(248,113,113,0.15)', text: '#f87171', label: 'Vermelho', border: 'rgba(248,113,113,0.3)', barColor: '#f87171' }
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
    load().catch(() => { toast.error('Erro ao carregar dados'); setLoading(false) })
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
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.accent }} />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="METAS \u00b7 RETRO"
        title="Retrospectiva"
        subtitle="Revis\u00e3o de resultados do quarter"
        breadcrumbs={[{ label: 'Metas', href: '/backoffice/metas' }]}
        actions={
          <select
            value={quarter}
            onChange={e => setQuarter(e.target.value)}
            className="px-3 py-1.5 rounded-[6px] text-sm focus:outline-none transition-colors"
            style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              color: T.text,
            }}
          >
            {QUARTERS.map(q => (
              <option key={q} value={q} style={{ background: 'var(--bg-base)' }}>{q}</option>
            ))}
          </select>
        }
      />

      {/* Company Average */}
      <div
        className="rounded-lg p-6"
        style={{ background: T.surface, border: `1px solid ${companyStyle.border}` }}
      >
        <div className="flex items-center gap-3 mb-3">
          <Target className="w-5 h-5" style={{ color: companyStyle.text }} />
          <span className="text-sm font-medium" style={{ color: T.text }}>Score M\u00e9dio da Empresa</span>
        </div>
        <div className="flex items-baseline gap-3">
          <p className="text-4xl font-bold" style={{ color: companyStyle.text, fontFamily: T.font.data }}>
            {(companyAvg * 100).toFixed(0)}%
          </p>
          <span
            className="px-2 py-0.5 rounded-[6px] text-xs"
            style={{ background: companyStyle.bg, color: companyStyle.text }}
          >
            {companyStyle.label}
          </span>
        </div>
        <div className="h-3 rounded-full overflow-hidden mt-4" style={{ background: T.hover }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${companyAvg * 100}%`,
              background: companyStyle.barColor,
            }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: T.textDim }}>{objScores.length} objetivos avaliados</p>
      </div>

      {/* OKRs with final scores */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: T.text }}>Resultados por Objetivo</h2>
        {objScores.length === 0 ? (
          <div className="rounded-lg p-8 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <p className="text-sm" style={{ color: T.textMuted }}>Nenhum OKR encontrado para {quarter}.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {objScores.sort((a, b) => b.score - a.score).map(obj => {
              const st = scoreStyle(obj.score)
              return (
                <div
                  key={obj.id}
                  className="rounded-lg p-4"
                  style={{ background: T.surface, border: `1px solid ${st.border}` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-sm font-semibold" style={{ color: T.text }}>{obj.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-[6px] text-xs" style={{ background: T.hover, color: T.textMuted }}>{obj.department}</span>
                        <span className="text-xs" style={{ color: T.textDim }}>{obj.krCount} KRs</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold" style={{ color: st.text, fontFamily: T.font.data }}>
                        {(obj.score * 100).toFixed(0)}%
                      </p>
                      <span
                        className="px-2 py-0.5 rounded-[6px] text-xs"
                        style={{ background: st.bg, color: st.text }}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: T.hover }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${obj.score * 100}%`,
                        background: st.barColor,
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
          { title: 'O que funcionou', emoji: '\u2705', field: 'worked', value: worked, placeholder: 'Descreva o que deu certo neste quarter...' },
          { title: 'O que n\u00e3o funcionou', emoji: '\u274c', field: 'didnt', value: didntWork, placeholder: 'O que n\u00e3o atingiu as expectativas...' },
          { title: 'Li\u00e7\u00f5es aprendidas', emoji: '\ud83d\udca1', field: 'lessons', value: lessons, placeholder: 'Aprendizados para o pr\u00f3ximo quarter...' },
        ].map(section => (
          <div
            key={section.field}
            className="rounded-lg p-5"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4" style={{ color: T.accent }} />
              <h3 className="text-sm font-semibold" style={{ color: T.text }}>{section.title}</h3>
            </div>
            <textarea
              value={section.value}
              onChange={e => saveText(section.field, e.target.value)}
              placeholder={section.placeholder}
              rows={4}
              className="w-full px-3 py-2 rounded-[6px] text-sm placeholder:opacity-40 focus:outline-none resize-none transition-colors"
              style={{
                background: T.surface,
                border: `1px solid ${T.borderSubtle}`,
                color: T.text,
              }}
            />
            <p className="text-[10px] mt-1" style={{ color: T.textDim }}>Salvo automaticamente no navegador</p>
          </div>
        ))}
      </div>
    </div>
  )
}
