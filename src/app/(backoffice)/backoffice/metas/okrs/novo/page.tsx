'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plus, Trash2, Loader2, Save, Target,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '../../../../lib/theme'
import { PageIntelHeader } from '../../../../components/ui'

/* ── types ─────────────────────────────────────────────────── */
interface KRDraft {
  title: string
  metric_type: string
  start_value: string
  target_value: string
  unit: string
  direction: string
  due_date: string
}

interface ParentObjective {
  id: string
  title: string
}

/* ── constants ─────────────────────────────────────────────── */
const DEPARTMENTS = ['Vendas', 'Marketing', 'Produto', 'Financeiro', 'Operações']
const LEVELS = [
  { value: 'company', label: 'Empresa' },
  { value: 'department', label: 'Departamento' },
  { value: 'individual', label: 'Individual' },
]
const QUARTERS = ['Q1-2026', 'Q2-2026', 'Q3-2026', 'Q4-2026']
const METRIC_TYPES = ['percentage', 'number', 'currency', 'boolean']
const DIRECTIONS = [
  { value: 'increase', label: 'Aumentar' },
  { value: 'decrease', label: 'Diminuir' },
  { value: 'maintain', label: 'Manter' },
]

const emptyKR = (): KRDraft => ({
  title: '',
  metric_type: 'number',
  start_value: '0',
  target_value: '',
  unit: '',
  direction: 'increase',
  due_date: '',
})

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '14px',
  background: T.surface,
  border: `1px solid ${T.border}`,
  color: T.text,
  outline: 'none',
  transition: 'border-color 200ms ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 500,
  color: T.textMuted,
  marginBottom: '6px',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
}

/* ── component ─────────────────────────────────────────────── */
export default function NovoOKRPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [parents, setParents] = useState<ParentObjective[]>([])

  // Objective form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [level, setLevel] = useState('company')
  const [quarter, setQuarter] = useState('Q1-2026')
  const [parentId, setParentId] = useState('')

  // Key Results
  const [krs, setKrs] = useState<KRDraft[]>([emptyKR()])

  useEffect(() => {
    async function loadParents() {
      const supabase = createClient()
      const { data } = await supabase
        .from('okr_objectives')
        .select('id, title')
        .eq('level', 'company')
        .order('created_at', { ascending: false })
      setParents(data ?? [])
    }
    loadParents()
  }, [])

  function addKR() {
    setKrs(prev => [...prev, emptyKR()])
  }

  function removeKR(idx: number) {
    setKrs(prev => prev.filter((_, i) => i !== idx))
  }

  function updateKR(idx: number, field: keyof KRDraft, value: string) {
    setKrs(prev => prev.map((kr, i) => i === idx ? { ...kr, [field]: value } : kr))
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Preencha o título do objetivo.')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()

      // Create objective
      const { data: obj, error: objErr } = await supabase
        .from('okr_objectives')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          department,
          level,
          quarter,
          parent_id: parentId || null,
          status: 'active',
        })
        .select()
        .single()

      if (objErr) throw objErr

      // Create key results
      const validKRs = krs.filter(kr => kr.title.trim() && kr.target_value)
      if (validKRs.length > 0) {
        const krInserts = validKRs.map(kr => ({
          objective_id: obj.id,
          title: kr.title.trim(),
          metric_type: kr.metric_type,
          start_value: parseFloat(kr.start_value) || 0,
          target_value: parseFloat(kr.target_value) || 0,
          current_value: parseFloat(kr.start_value) || 0,
          unit: kr.unit || null,
          direction: kr.direction,
          due_date: kr.due_date || null,
        }))

        const { error: krErr } = await supabase.from('okr_key_results').insert(krInserts)
        if (krErr) throw krErr
      }

      toast.success('OKR criado com sucesso!')
      router.push(`/backoffice/metas/okrs/${obj.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="METAS · OKR"
        title="Novo OKR"
        subtitle="Defina o objetivo e seus key results"
        breadcrumbs={[
          { label: 'Metas', href: '/backoffice/metas' },
          { label: 'OKRs', href: '/backoffice/metas/okrs' },
        ]}
      />

      {/* Objective Form */}
      <div
        className="rounded-lg p-6 space-y-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4" style={{ color: T.accent }} />
          <h2 className="text-sm font-semibold" style={{ color: T.text }}>Objetivo</h2>
        </div>

        <div>
          <label style={labelStyle}>Título *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex: Aumentar receita recorrente em 40%"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Descrição</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Contexto adicional sobre o objetivo..."
            rows={3}
            style={{ ...inputStyle, resize: 'none' as const }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Departamento</label>
            <select value={department} onChange={e => setDepartment(e.target.value)} style={selectStyle}>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d} style={{ background: 'var(--bg-base)' }}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Nível</label>
            <select value={level} onChange={e => setLevel(e.target.value)} style={selectStyle}>
              {LEVELS.map(l => (
                <option key={l.value} value={l.value} style={{ background: 'var(--bg-base)' }}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Quarter</label>
            <select value={quarter} onChange={e => setQuarter(e.target.value)} style={selectStyle}>
              {QUARTERS.map(q => (
                <option key={q} value={q} style={{ background: 'var(--bg-base)' }}>{q}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Objetivo Pai (opcional)</label>
            <select value={parentId} onChange={e => setParentId(e.target.value)} style={selectStyle}>
              <option value="" style={{ background: 'var(--bg-base)' }}>Nenhum</option>
              {parents.map(p => (
                <option key={p.id} value={p.id} style={{ background: 'var(--bg-base)' }}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Results */}
      <div
        className="rounded-lg p-6 space-y-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4" style={{ color: T.accent }} />
            <h2 className="text-sm font-semibold" style={{ color: T.text }}>Key Results</h2>
          </div>
          <button
            onClick={addKR}
            className="flex items-center gap-1 text-xs transition-colors"
            style={{ color: T.accent }}
          >
            <Plus className="w-3 h-3" />
            Adicionar KR
          </button>
        </div>

        {krs.map((kr, idx) => (
          <div
            key={idx}
            className="rounded-lg p-4 space-y-4"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ color: T.textDim }}>KR {idx + 1}</span>
              {krs.length > 1 && (
                <button onClick={() => removeKR(idx)} className="text-red-400/60 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div>
              <label style={labelStyle}>Título *</label>
              <input
                type="text"
                value={kr.title}
                onChange={e => updateKR(idx, 'title', e.target.value)}
                placeholder="Ex: Atingir R$ 500k de MRR"
                style={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label style={labelStyle}>Tipo de Métrica</label>
                <select value={kr.metric_type} onChange={e => updateKR(idx, 'metric_type', e.target.value)} style={selectStyle}>
                  {METRIC_TYPES.map(t => (
                    <option key={t} value={t} style={{ background: 'var(--bg-base)' }}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Valor Inicial</label>
                <input
                  type="number"
                  value={kr.start_value}
                  onChange={e => updateKR(idx, 'start_value', e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Meta *</label>
                <input
                  type="number"
                  value={kr.target_value}
                  onChange={e => updateKR(idx, 'target_value', e.target.value)}
                  placeholder="100"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Unidade</label>
                <input
                  type="text"
                  value={kr.unit}
                  onChange={e => updateKR(idx, 'unit', e.target.value)}
                  placeholder="%, R$, unidades..."
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Direção</label>
                <select value={kr.direction} onChange={e => updateKR(idx, 'direction', e.target.value)} style={selectStyle}>
                  {DIRECTIONS.map(d => (
                    <option key={d.value} value={d.value} style={{ background: 'var(--bg-base)' }}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Data Limite</label>
                <input
                  type="date"
                  value={kr.due_date}
                  onChange={e => updateKR(idx, 'due_date', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Link
          href="/backoffice/metas/okrs"
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ color: T.textMuted }}
        >
          Cancelar
        </Link>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: T.accent, color: '#0B1928' }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar OKR
        </button>
      </div>
    </div>
  )
}
