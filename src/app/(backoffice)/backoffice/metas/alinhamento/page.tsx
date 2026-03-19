'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ChevronRight, Target, Loader2, Building2, Users, User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ── types ─────────────────────────────────────────────────── */
interface Objective {
  id: string
  title: string
  department: string
  quarter: string
  level: string
  parent_id: string | null
}
interface KeyResult {
  id: string
  objective_id: string
  current_value: number
  target_value: number
  start_value: number
}

/* ── helpers ───────────────────────────────────────────────── */
const QUARTER = 'Q1-2026'

function calcScore(krs: KeyResult[]) {
  if (krs.length === 0) return 0
  return krs.reduce((s, kr) => {
    const range = kr.target_value - kr.start_value
    if (range === 0) return s
    return s + Math.max(0, Math.min(1, (kr.current_value - kr.start_value) / range))
  }, 0) / krs.length
}

function scoreColor(score: number) {
  if (score >= 0.7) return '#C8A44A'
  if (score >= 0.6) return '#34d399'
  if (score >= 0.3) return '#fbbf24'
  return '#f87171'
}

function scoreTextClass(score: number) {
  if (score >= 0.7) return 'text-[#C8A44A]'
  if (score >= 0.6) return 'text-emerald-400'
  if (score >= 0.3) return 'text-amber-400'
  return 'text-red-400'
}

const levelIcons: Record<string, typeof Building2> = {
  company: Building2,
  department: Users,
  individual: User,
}

const levelLabels: Record<string, string> = {
  company: 'Empresa',
  department: 'Departamento',
  individual: 'Individual',
}

/* ── tree node component ───────────────────────────────────── */
function TreeNode({
  obj,
  allNodes,
  keyResults,
  depth,
}: {
  obj: Objective
  allNodes: Objective[]
  keyResults: KeyResult[]
  depth: number
}) {
  const krs = keyResults.filter(kr => kr.objective_id === obj.id)
  const score = calcScore(krs)
  const color = scoreColor(score)
  const Icon = levelIcons[obj.level] || Target

  // Find children of this node
  const childObjs = allNodes.filter(c => c.parent_id === obj.id)

  return (
    <div className="relative">
      {/* Node */}
      <Link
        href={`/backoffice/metas/okrs/${obj.id}`}
        className="block rounded-lg border border-white/10 p-4 hover:border-white/20 transition-colors group"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${color}15` }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-white group-hover:text-[#C8A44A] transition-colors truncate">
                {obj.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-white/40">{obj.department}</span>
                <span className="text-xs text-white/30">{levelLabels[obj.level] || obj.level}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <div className="w-12 h-1.5 rounded-full overflow-hidden bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${score * 100}%`, background: color }}
              />
            </div>
            <span className={`text-sm font-bold ${scoreTextClass(score)}`} style={{ fontFamily: 'DM Mono, monospace' }}>
              {Math.round(score * 100)}%
            </span>
          </div>
        </div>
      </Link>

      {/* Children */}
      {childObjs.length > 0 && (
        <div className="ml-6 mt-2 space-y-2 relative">
          {/* Connecting line */}
          <div
            className="absolute left-4 top-0 bottom-4 w-px"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
          {childObjs.map(child => (
            <div key={child.id} className="relative pl-6">
              {/* Horizontal connector */}
              <div
                className="absolute left-4 top-5 w-4 h-px"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              />
              <TreeNode
                obj={child}
                allNodes={allNodes}
                keyResults={keyResults}
                depth={depth + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── main component ────────────────────────────────────────── */
export default function AlinhamentoPage() {
  const [loading, setLoading] = useState(true)
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [keyResults, setKeyResults] = useState<KeyResult[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [objRes, krRes] = await Promise.all([
        supabase.from('okr_objectives').select('*').eq('quarter', QUARTER),
        supabase.from('okr_key_results').select('*'),
      ])
      setObjectives(objRes.data ?? [])
      setKeyResults(krRes.data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 text-[#C8A44A] animate-spin" />
      </div>
    )
  }

  // Separate levels
  const companyObjs = objectives.filter(o => o.level === 'company')
  const deptObjs = objectives.filter(o => o.level === 'department')
  const individualObjs = objectives.filter(o => o.level === 'individual')

  // Root nodes: company-level or orphans
  const rootNodes = companyObjs.length > 0
    ? companyObjs
    : objectives.filter(o => !o.parent_id)

  // All non-root nodes
  const allChildren = objectives.filter(o => o.parent_id || (companyObjs.length > 0 && o.level !== 'company'))

  // Orphan dept/individual nodes (not connected to a parent)
  const connectedIds = new Set<string>()
  function markConnected(objs: Objective[]) {
    objs.forEach(o => {
      connectedIds.add(o.id)
      const children = objectives.filter(c => c.parent_id === o.id)
      markConnected(children)
    })
  }
  markConnected(rootNodes)
  const orphanDept = deptObjs.filter(o => !connectedIds.has(o.id) && !rootNodes.includes(o))
  const orphanIndividual = individualObjs.filter(o => !connectedIds.has(o.id) && !rootNodes.includes(o))

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
          <Link href="/backoffice/metas" className="hover:text-white/60 transition-colors">Metas</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60">Alinhamento</span>
        </div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-editorial, serif)' }}>
          Mapa de Alinhamento
        </h1>
        <p className="text-sm text-white/50 mt-1">{QUARTER} — Visualização hierárquica dos OKRs</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#C8A44A]" />
          Empresa
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          Departamento
        </span>
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-purple-400" />
          Individual
        </span>
        <span className="text-white/30">|</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#C8A44A]" /> 70%+
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> 60-69%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> 30-59%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-400" /> &lt;30%
        </span>
      </div>

      {/* Tree */}
      {objectives.length === 0 ? (
        <div className="rounded-lg border border-white/10 p-12 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <Target className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm">Nenhum OKR encontrado para {QUARTER}.</p>
          <p className="text-white/30 text-xs mt-1">Crie OKRs com relacionamento pai/filho para visualizar o alinhamento.</p>
          <Link
            href="/backoffice/metas/okrs/novo"
            className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium text-[#0B1928]"
            style={{ background: '#C8A44A' }}
          >
            Criar OKR
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected tree */}
          {rootNodes.map(root => (
            <TreeNode
              key={root.id}
              obj={root}
              allNodes={allChildren}
              keyResults={keyResults}
              depth={0}
            />
          ))}

          {/* Orphan department OKRs */}
          {orphanDept.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">
                Departamento (sem vínculo)
              </h3>
              <div className="space-y-2">
                {orphanDept.map(obj => (
                  <TreeNode
                    key={obj.id}
                    obj={obj}
                    allNodes={objectives}
                    keyResults={keyResults}
                    depth={0}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Orphan individual OKRs */}
          {orphanIndividual.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">
                Individual (sem vínculo)
              </h3>
              <div className="space-y-2">
                {orphanIndividual.map(obj => (
                  <TreeNode
                    key={obj.id}
                    obj={obj}
                    allNodes={objectives}
                    keyResults={keyResults}
                    depth={0}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
