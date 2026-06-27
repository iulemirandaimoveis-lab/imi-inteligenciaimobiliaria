'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trophy, Users, User as UserIcon, AlertCircle, Trash2 } from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow, Button, Spinner } from '../ui/primitives'
import { formatBRL } from '@/lib/imi-proposals/status'
import type { GoalView, RankingRow } from './data'

interface ProjectOption { id: string; name: string }
interface TeamOption { id: string; name: string }
interface MemberOption { id: string; name: string }

export function GoalsView({
  teamGoals,
  individualGoals,
  ranking,
  canManage,
  projects,
  teams,
  members,
}: {
  teamGoals: GoalView[]
  individualGoals: GoalView[]
  ranking: RankingRow[]
  canManage: boolean
  projects: ProjectOption[]
  teams: TeamOption[]
  members: MemberOption[]
}) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 22 }}>
        <div>
          <Eyebrow style={{ color: T.gold }}>Metas & Desempenho</Eyebrow>
          <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 30, color: T.t1, margin: '8px 0 4px' }}>
            Metas & Desempenho
          </h1>
          <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>
            Realizado calculado em tempo real a partir das propostas aprovadas.
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 44, padding: '0 18px', borderRadius: T.rMd, background: showForm ? 'rgba(255,255,255,0.05)' : T.gold, color: showForm ? T.t1 : '#1A1206', fontFamily: T.fSans, fontSize: 13, fontWeight: 600, border: showForm ? `1px solid ${T.glassBorderStrong}` : 'none', cursor: 'pointer', boxShadow: showForm ? 'none' : `0 6px 20px ${T.goldGlow}` }}
          >
            <Plus size={16} /> {showForm ? 'Fechar' : 'Nova meta'}
          </button>
        )}
      </div>

      {showForm && canManage && (
        <GoalForm projects={projects} teams={teams} members={members} onClose={() => setShowForm(false)} />
      )}

      {/* Metas de equipe */}
      <SectionTitle icon={<Users size={15} />} label="Metas de equipe" />
      {teamGoals.length === 0 ? (
        <EmptyHint text="Nenhuma meta de equipe definida." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 28 }}>
          {teamGoals.map((g) => (
            <GoalCard key={g.id} goal={g} canManage={canManage} />
          ))}
        </div>
      )}

      {/* Metas individuais */}
      <SectionTitle icon={<UserIcon size={15} />} label="Metas individuais" />
      {individualGoals.length === 0 ? (
        <EmptyHint text="Nenhuma meta individual definida." />
      ) : (
        <GlassCard padding={8} style={{ marginBottom: 28 }}>
          {individualGoals.map((g, i) => (
            <GoalRow key={g.id} goal={g} canManage={canManage} last={i === individualGoals.length - 1} />
          ))}
        </GlassCard>
      )}

      {/* Ranking */}
      <SectionTitle icon={<Trophy size={15} />} label="Ranking de vendas (propostas aprovadas)" />
      {ranking.length === 0 ? (
        <EmptyHint text="Ainda não há vendas aprovadas para ranquear." />
      ) : (
        <GlassCard padding={8}>
          {ranking.map((r, i) => (
            <RankingItem key={r.userId} row={r} pos={i + 1} last={i === ranking.length - 1} />
          ))}
        </GlassCard>
      )}
    </div>
  )
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 14px' }}>
      <span style={{ color: T.gold, display: 'flex' }}>{icon}</span>
      <h2 style={{ fontFamily: T.fSans, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: T.t2, margin: 0, textTransform: 'uppercase' }}>{label}</h2>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <GlassCard padding={20} style={{ marginBottom: 28 }}>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0, textAlign: 'center' }}>{text}</p>
    </GlassCard>
  )
}

function ProgressBar({ pct, tone = T.gold }: { pct: number; tone?: string }) {
  return (
    <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: tone, transition: `width 600ms ${T.ease}` }} />
    </div>
  )
}

function toneForPct(pct: number): string {
  if (pct >= 100) return T.green
  if (pct >= 60) return T.gold
  if (pct >= 30) return T.amber
  return T.red
}

function GoalCard({ goal, canManage }: { goal: GoalView; canManage: boolean }) {
  const tone = toneForPct(goal.progressPct)
  return (
    <GlassCard>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
        <div>
          <p style={{ fontFamily: T.fSans, fontSize: 15, fontWeight: 600, color: T.t1, margin: 0 }}>{goal.subjectName}</p>
          <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, margin: '2px 0 0' }}>{goal.title || periodLabel(goal)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: T.fSans, fontSize: 22, fontWeight: 700, color: tone }}>{goal.progressPct}%</span>
          {canManage && <DeleteGoalButton id={goal.id} />}
        </div>
      </div>
      <ProgressBar pct={goal.progressPct} tone={tone} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
        <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.t2 }}>{formatBRL(goal.realized)}</span>
        <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.t4 }}>de {formatBRL(goal.targetAmount)}</span>
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.glassBorder}` }}>
        <Metric label="Vendas" value={String(goal.salesCount)} />
        <Metric label="Ticket médio" value={formatBRL(goal.avgTicket)} />
      </div>
    </GlassCard>
  )
}

function GoalRow({ goal, canManage, last }: { goal: GoalView; canManage: boolean; last: boolean }) {
  const tone = toneForPct(goal.progressPct)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: last ? 'none' : `1px solid ${T.glassBorder}`, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 140, flex: 1 }}>
        <p style={{ fontFamily: T.fSans, fontSize: 13.5, fontWeight: 600, color: T.t1, margin: 0 }}>{goal.subjectName}</p>
        <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, margin: '2px 0 0' }}>{goal.title || periodLabel(goal)}</p>
      </div>
      <div style={{ flex: 2, minWidth: 180 }}>
        <ProgressBar pct={goal.progressPct} tone={tone} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t2 }}>{formatBRL(goal.realized)}</span>
          <span style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t4 }}>de {formatBRL(goal.targetAmount)}</span>
        </div>
      </div>
      <span style={{ fontFamily: T.fSans, fontSize: 16, fontWeight: 700, color: tone, minWidth: 50, textAlign: 'right' }}>{goal.progressPct}%</span>
      {canManage && <DeleteGoalButton id={goal.id} />}
    </div>
  )
}

function RankingItem({ row, pos, last }: { row: RankingRow; pos: number; last: boolean }) {
  const medal = pos === 1 ? T.gold : pos === 2 ? '#C0C7D1' : pos === 3 ? '#CD7F32' : T.t4
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: last ? 'none' : `1px solid ${T.glassBorder}` }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fSans, fontSize: 12, fontWeight: 700, color: pos <= 3 ? '#1A1206' : T.t2, background: pos <= 3 ? medal : 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
        {pos}
      </span>
      <span style={{ flex: 1, fontFamily: T.fSans, fontSize: 13.5, fontWeight: 600, color: T.t1 }}>{row.name}</span>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <Metric label="Vendas" value={String(row.salesCount)} compact />
        <Metric label="Ticket" value={formatBRL(row.avgTicket)} compact />
        <span style={{ fontFamily: T.fSans, fontSize: 14, fontWeight: 700, color: T.gold, minWidth: 90, textAlign: 'right' }}>{formatBRL(row.realized)}</span>
      </div>
    </div>
  )
}

function Metric({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div style={{ textAlign: compact ? 'right' : 'left' }}>
      <p style={{ fontFamily: T.fSans, fontSize: 10, color: T.t4, margin: 0, letterSpacing: '0.04em' }}>{label}</p>
      <p style={{ fontFamily: T.fSans, fontSize: compact ? 12.5 : 14, fontWeight: 600, color: T.t1, margin: '2px 0 0' }}>{value}</p>
    </div>
  )
}

function DeleteGoalButton({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function remove() {
    if (!confirm('Remover esta meta?')) return
    setBusy(true)
    try {
      const res = await fetch(`/api/users/goals/${id}`, { method: 'DELETE' })
      if (res.ok) router.refresh()
    } finally {
      setBusy(false)
    }
  }
  return (
    <button type="button" onClick={remove} disabled={busy} aria-label="Remover meta" style={{ background: 'none', border: 'none', cursor: busy ? 'wait' : 'pointer', color: T.t3, display: 'flex', padding: 4 }}>
      {busy ? <Spinner size={13} /> : <Trash2 size={14} />}
    </button>
  )
}

function periodLabel(g: GoalView): string {
  const f = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  return `${f(g.periodStart)} – ${f(g.periodEnd)}`
}

function GoalForm({
  projects,
  teams,
  members,
  onClose,
}: {
  projects: ProjectOption[]
  teams: TeamOption[]
  members: MemberOption[]
  onClose: () => void
}) {
  const router = useRouter()
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)

  const [scope, setScope] = useState<'team' | 'individual'>('team')
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '')
  const [userId, setUserId] = useState(members[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [start, setStart] = useState(firstDay)
  const [end, setEnd] = useState(lastDay)
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setError('')
    const targetNum = Number(String(target).replace(/[^\d,.-]/g, '').replace(',', '.'))
    if (!projectId) return setError('Selecione um empreendimento.')
    if (scope === 'team' && !teamId) return setError('Selecione uma equipe.')
    if (scope === 'individual' && !userId) return setError('Selecione um corretor.')
    if (!Number.isFinite(targetNum) || targetNum <= 0) return setError('Informe um valor de meta válido.')

    setBusy(true)
    try {
      const res = await fetch('/api/users/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          scope,
          team_id: scope === 'team' ? teamId : null,
          user_id: scope === 'individual' ? userId : null,
          title: title || undefined,
          period_start: start,
          period_end: end,
          target_amount: targetNum,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Falha ao criar meta.')
        setBusy(false)
        return
      }
      onClose()
      router.refresh()
    } catch {
      setError('Erro técnico.')
      setBusy(false)
    }
  }

  const fieldStyle = {
    height: 42,
    padding: '0 12px',
    borderRadius: T.rSm,
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${T.glassBorder}`,
    color: T.t1,
    fontFamily: T.fSans,
    fontSize: 13.5,
    outline: 'none',
    colorScheme: 'dark' as const,
    width: '100%',
  }

  return (
    <GlassCard style={{ marginBottom: 28, border: `1px solid ${T.goldBorder}` }}>
      <Eyebrow style={{ marginBottom: 14, color: T.gold }}>Nova meta</Eyebrow>

      <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: T.rSm, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.glassBorder}`, marginBottom: 14, width: 'fit-content' }}>
        {(['team', 'individual'] as const).map((s) => (
          <button key={s} type="button" onClick={() => setScope(s)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: T.fSans, fontSize: 12, fontWeight: 600, color: scope === s ? '#1A1206' : T.t2, background: scope === s ? T.gold : 'transparent' }}>
            {s === 'team' ? 'Equipe' : 'Individual'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <Labeled label="Empreendimento">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={fieldStyle}>
            {projects.map((p) => <option key={p.id} value={p.id} style={{ background: T.bgElevated }}>{p.name}</option>)}
          </select>
        </Labeled>
        {scope === 'team' ? (
          <Labeled label="Equipe">
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} style={fieldStyle}>
              {teams.length === 0 && <option value="">Nenhuma equipe</option>}
              {teams.map((t) => <option key={t.id} value={t.id} style={{ background: T.bgElevated }}>{t.name}</option>)}
            </select>
          </Labeled>
        ) : (
          <Labeled label="Corretor">
            <select value={userId} onChange={(e) => setUserId(e.target.value)} style={fieldStyle}>
              {members.length === 0 && <option value="">Nenhum corretor</option>}
              {members.map((m) => <option key={m.id} value={m.id} style={{ background: T.bgElevated }}>{m.name}</option>)}
            </select>
          </Labeled>
        )}
        <Labeled label="Meta (R$)">
          <input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" placeholder="5.000.000" style={fieldStyle} />
        </Labeled>
        <Labeled label="Início">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={fieldStyle} />
        </Labeled>
        <Labeled label="Fim">
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={fieldStyle} />
        </Labeled>
        <Labeled label="Título (opcional)">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meta do mês" style={fieldStyle} />
        </Labeled>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, color: T.red, fontFamily: T.fSans, fontSize: 12.5 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16, maxWidth: 360 }}>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button>
        <Button variant="primary" onClick={submit} loading={busy}>Criar meta</Button>
      </div>
    </GlassCard>
  )
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t3, fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  )
}
