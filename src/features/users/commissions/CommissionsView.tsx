'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coins, Trophy, Settings2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow, Button } from '../ui/primitives'
import { formatBRL } from '@/lib/imi-proposals/status'
import type {
  CommissionsData,
  LedgerEntry,
  CommissionProfileView,
  CommissionRuleView,
} from './data'

const STATUS_LABEL: Record<string, string> = {
  forecast: 'Previsto',
  pending: 'Pendente',
  approved: 'Aprovado',
  paid: 'Pago',
  cancelled: 'Cancelado',
}
const STATUS_TONE: Record<string, string> = {
  forecast: T.t2,
  pending: T.amber,
  approved: T.blue,
  paid: T.green,
  cancelled: T.t4,
}

interface MemberOption { id: string; name: string }
interface ProjectOption { id: string; name: string }

export function CommissionsView({
  data,
  projects,
  members,
}: {
  data: CommissionsData
  projects: ProjectOption[]
  members: MemberOption[]
}) {
  const { totals, split, ranking, ledger, rules, profiles, canManage } = data

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 24px 64px' }}>
      <div style={{ marginBottom: 22 }}>
        <Eyebrow style={{ color: T.gold }}>Comissões</Eyebrow>
        <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 30, color: T.t1, margin: '8px 0 4px' }}>
          Comissões
        </h1>
        <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>
          {canManage
            ? 'Defina percentuais e metas por corretor. Cada venda gera um lançamento auditável.'
            : 'Suas comissões previstas e recebidas, atualizadas a cada venda registrada.'}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 18 }}>
        <Kpi label="Previsto" value={formatBRL(totals.forecast)} tone={T.gold} />
        <Kpi label="Recebido" value={formatBRL(totals.received)} tone={T.green} />
        <Kpi label="Parte empresa" value={formatBRL(totals.companyShare)} tone={T.t1} />
        <Kpi label="Parte corretores" value={formatBRL(totals.brokerShare)} tone={T.t1} />
        <Kpi label="Bonificações" value={formatBRL(totals.bonusTotal)} tone={T.blue} />
      </div>

      {/* Split + Regras */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1fr)', gap: 14, marginBottom: 26 }} className="imi-comm-grid">
        <GlassCard>
          <Eyebrow style={{ marginBottom: 14 }}>Split empresa / corretor</Eyebrow>
          <div style={{ display: 'flex', height: 12, borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${split.company}%`, background: `linear-gradient(90deg, ${T.glassBorderStrong}, rgba(244,242,236,0.4))` }} />
            <div style={{ width: `${split.broker}%`, background: `linear-gradient(90deg, ${T.goldBorder}, ${T.gold})` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Legend color={T.t2} label={`Empresa ${split.company}%`} />
            <Legend color={T.gold} label={`Corretor ${split.broker}%`} />
          </div>
        </GlassCard>

        <GlassCard>
          <Eyebrow style={{ marginBottom: 14 }}>Regras de comissão</Eyebrow>
          {rules.length === 0 ? (
            <p style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.t3, margin: 0 }}>Nenhuma regra cadastrada.</p>
          ) : (
            rules.map((r: CommissionRuleView) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.glassBorder}` }}>
                <span style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.t1 }}>{r.name}</span>
                <span style={{ fontFamily: T.fMono, fontSize: 11.5, color: T.t3 }}>
                  {r.baseRate}% · {r.companyShare}/{r.brokerShare}
                  {!r.active && ' · inativa'}
                </span>
              </div>
            ))
          )}
        </GlassCard>
      </div>

      {/* Manager: profiles editor */}
      {canManage && (
        <ProfilesEditor profiles={profiles} projects={projects} members={members} />
      )}

      {/* Ranking */}
      <SectionTitle icon={<Trophy size={15} />} label="Ranking de comissão (parte do corretor)" />
      {ranking.length === 0 ? (
        <EmptyHint text="Ainda não há comissões lançadas." />
      ) : (
        <GlassCard padding={8} style={{ marginBottom: 26 }}>
          {ranking.map((r, i) => (
            <div key={r.userId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i === ranking.length - 1 ? 'none' : `1px solid ${T.glassBorder}` }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fSans, fontSize: 12, fontWeight: 700, color: i < 3 ? '#1A1206' : T.t2, background: i < 3 ? T.gold : 'rgba(255,255,255,0.05)' }}>{i + 1}</span>
              <span style={{ flex: 1, fontFamily: T.fSans, fontSize: 13.5, fontWeight: 600, color: T.t1 }}>{r.name}</span>
              <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.green, minWidth: 70, textAlign: 'right' }}>{formatBRL(r.received)}</span>
              <span style={{ fontFamily: T.fSans, fontSize: 13.5, fontWeight: 700, color: T.gold, minWidth: 90, textAlign: 'right' }}>{formatBRL(r.forecast)}</span>
            </div>
          ))}
        </GlassCard>
      )}

      {/* Ledger */}
      <SectionTitle icon={<Coins size={15} />} label="Lançamentos (auditável)" />
      {ledger.length === 0 ? (
        <EmptyHint text="Sem lançamentos de comissão." />
      ) : (
        <GlassCard padding={8}>
          {ledger.slice(0, 50).map((l: LedgerEntry, i) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: i === Math.min(ledger.length, 50) - 1 ? 'none' : `1px solid ${T.glassBorder}`, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 120, flex: 1 }}>
                <p style={{ fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.t1, margin: 0 }}>{l.brokerName}</p>
                <p style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t4, margin: '2px 0 0' }}>
                  {[l.projectName, l.saleReference].filter(Boolean).join(' · ') || 'venda'} · {new Date(l.computedAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span style={{ fontFamily: T.fSans, fontSize: 11, color: STATUS_TONE[l.status] ?? T.t2 }}>{STATUS_LABEL[l.status] ?? l.status}</span>
              <span style={{ fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.gold, minWidth: 90, textAlign: 'right' }}>{formatBRL(l.brokerAmount)}</span>
            </div>
          ))}
        </GlassCard>
      )}

      <style>{`@media (max-width: 640px){ .imi-comm-grid{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

function ProfilesEditor({
  profiles,
  projects,
  members,
}: {
  profiles: CommissionProfileView[]
  projects: ProjectOption[]
  members: MemberOption[]
}) {
  const router = useRouter()
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const [userId, setUserId] = useState(members[0]?.id ?? '')
  const [brokerRate, setBrokerRate] = useState('')
  const [bonusRate, setBonusRate] = useState('')
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  function num(v: string): number | null {
    if (!v.trim()) return null
    const n = Number(v.replace(/[^\d,.-]/g, '').replace(',', '.'))
    return Number.isFinite(n) ? n : null
  }

  async function save() {
    setMsg(null)
    if (!userId) return setMsg({ kind: 'err', text: 'Selecione um corretor.' })
    setBusy(true)
    try {
      const res = await fetch('/api/users/commissions/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          project_id: projectId,
          broker_rate: num(brokerRate),
          bonus_rate: num(bonusRate),
          target_amount: num(target),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setMsg({ kind: 'err', text: json.error ?? 'Falha ao salvar.' })
        setBusy(false)
        return
      }
      setMsg({ kind: 'ok', text: 'Perfil de comissão atualizado.' })
      setBusy(false)
      router.refresh()
    } catch {
      setMsg({ kind: 'err', text: 'Erro técnico.' })
      setBusy(false)
    }
  }

  const field = {
    height: 42, padding: '0 12px', borderRadius: T.rSm, background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${T.glassBorder}`, color: T.t1, fontFamily: T.fSans, fontSize: 13.5,
    outline: 'none', width: '100%', colorScheme: 'dark' as const,
  }

  return (
    <GlassCard style={{ marginBottom: 26, border: `1px solid ${T.goldBorder}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <Settings2 size={15} color={T.gold} />
        <Eyebrow style={{ color: T.gold }}>Perfil de comissão por corretor</Eyebrow>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <Labeled label="Empreendimento">
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={field}>
            {projects.map((p) => <option key={p.id} value={p.id} style={{ background: T.bgElevated }}>{p.name}</option>)}
          </select>
        </Labeled>
        <Labeled label="Corretor">
          <select value={userId} onChange={(e) => setUserId(e.target.value)} style={field}>
            {members.length === 0 && <option value="">Nenhum corretor</option>}
            {members.map((m) => <option key={m.id} value={m.id} style={{ background: T.bgElevated }}>{m.name}</option>)}
          </select>
        </Labeled>
        <Labeled label="% Corretor"><input value={brokerRate} onChange={(e) => setBrokerRate(e.target.value)} inputMode="decimal" placeholder="60" style={field} /></Labeled>
        <Labeled label="% Bônus"><input value={bonusRate} onChange={(e) => setBonusRate(e.target.value)} inputMode="decimal" placeholder="0" style={field} /></Labeled>
        <Labeled label="Meta (R$)"><input value={target} onChange={(e) => setTarget(e.target.value)} inputMode="decimal" placeholder="500.000" style={field} /></Labeled>
      </div>

      {msg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 12, color: msg.kind === 'ok' ? T.green : T.red, fontFamily: T.fSans, fontSize: 12.5 }}>
          {msg.kind === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {msg.text}
        </div>
      )}

      <div style={{ maxWidth: 220, marginTop: 16 }}>
        <Button variant="primary" onClick={save} loading={busy}>Salvar perfil</Button>
      </div>

      {profiles.length > 0 && (
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${T.glassBorder}` }}>
          <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, margin: '0 0 8px', letterSpacing: '0.04em' }}>PERFIS DEFINIDOS</p>
          {profiles.map((p) => (
            <div key={p.id ?? p.userId} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontFamily: T.fSans, fontSize: 12.5 }}>
              <span style={{ color: T.t1 }}>{p.name}</span>
              <span style={{ color: T.t3, fontFamily: T.fMono, fontSize: 11.5 }}>
                {p.brokerRate != null ? `${p.brokerRate}%` : '—'}{p.targetAmount != null ? ` · meta ${formatBRL(p.targetAmount)}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}

function Kpi({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <GlassCard padding={14}>
      <p style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t3, margin: 0, letterSpacing: '0.04em', fontWeight: 600 }}>{label}</p>
      <p style={{ fontFamily: T.fSans, fontWeight: 700, fontSize: 18, color: tone, margin: '6px 0 0' }}>{value}</p>
    </GlassCard>
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
    <GlassCard padding={20} style={{ marginBottom: 26 }}>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0, textAlign: 'center' }}>{text}</p>
    </GlassCard>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t2 }}>{label}</span>
    </span>
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
