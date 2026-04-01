'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target, Loader2, Building2, Users, User,
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
  if (score >= 0.7) return 'var(--accent-400)'
  if (score >= 0.6) return '#34d399'
  if (score >= 0.3) return '#fbbf24'
  return '#f87171'
}

function scoreTextStyle(score: number): React.CSSProperties {
  if (score >= 0.7) return { color: T.accent }
  if (score >= 0.6) return { color: '#34d399' }
  if (score >= 0.3) return { color: '#fbbf24' }
  return { color: '#f87171' }
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
        className="block rounded-lg p-4 transition-colors group"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
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
              <h3 className="text-sm font-medium truncate transition-colors" style={{ color: T.text }}>
                {obj.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs" style={{ color: T.textMuted }}>{obj.department}</span>
                <span className="text-xs" style={{ color: T.textDim }}>{levelLabels[obj.level] || obj.level}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: T.hover }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${score * 100}%`, background: color }}
              />
            </div>
            <span className="text-sm font-bold" style={{ ...scoreTextStyle(score), fontFamily: T.font.data }}>
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
            style={{ background: T.borderSubtle }}
          />
          {childObjs.map(child => (
            <div key={child.id} className="relative pl-6">
              {/* Horizontal connector */}
              <div
                className="absolute left-4 top-5 w-4 h-px"
                style={{ background: T.borderSubtle }}
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
    load().catch(() => { toast.error('Erro ao carregar dados'); setLoading(false) })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: T.accent }} />
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
      <PageIntelHeader
        moduleLabel="METAS \u00b7 ALINHAMENTO"
        title="Mapa de Alinhamento"
        subtitle={`${QUARTER} \u2014 Visualiza\u00e7\u00e3o hier\u00e1rquica dos OKRs`}
        breadcrumbs={[{ label: 'Metas', href: '/backoffice/metas' }]}
      />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs" style={{ color: T.textMuted }}>
        <span className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" style={{ color: T.accent }} />
          Empresa
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-[var(--info)]" />
          Departamento
        </span>
        <span className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-navy-400" />
          Individual
        </span>
        <span style={{ color: T.textDim }}>|</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: T.accent }} /> 70%+
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
        <div className="rounded-lg p-12 text-center" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <Target className="w-8 h-8 mx-auto mb-3" style={{ color: T.textDim }} />
          <p className="text-sm" style={{ color: T.textMuted }}>Nenhum OKR encontrado para {QUARTER}.</p>
          <p className="text-xs mt-1" style={{ color: T.textDim }}>Crie OKRs com relacionamento pai/filho para visualizar o alinhamento.</p>
          <Link
            href="/backoffice/metas/okrs/novo"
            className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: T.accent, color: '#0B1928' }}
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
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: T.textDim }}>
                Departamento (sem v\u00ednculo)
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
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: T.textDim }}>
                Individual (sem v\u00ednculo)
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
