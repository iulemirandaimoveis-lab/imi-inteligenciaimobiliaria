'use client'

import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow } from '../ui/primitives'
import { useImiSession } from '../session-context'
import { PERMISSIONS } from '@/lib/imi-auth/rbac'
import type { CommissionSummary } from './data'

/**
 * Comissões module for the Alto Bellevue dashboard. Rendered only for users
 * holding `commissions.read` (brokers see it; the manager/backoffice manage it).
 * The authoritative gate is RLS on imi.broker_commissions — this is UI gating.
 */
export function CommissionGate({ commissions }: { commissions: CommissionSummary }) {
  const { can } = useImiSession()
  if (!can(PERMISSIONS.COMMISSIONS_READ)) return null
  return <CommissionModule commissions={commissions} />
}

function CommissionModule({ commissions: c }: { commissions: CommissionSummary }) {
  const { can } = useImiSession()
  const canManage = can(PERMISSIONS.COMMISSIONS_MANAGE)

  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 20, color: T.t1, margin: 0 }}>Comissões</h2>
          <span
            style={{
              fontFamily: T.fSans,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: T.gold,
              background: T.goldSoft,
              border: `1px solid ${T.goldBorder}`,
              borderRadius: 99,
              padding: '3px 9px',
            }}
          >
            {canManage ? 'Gestão' : 'Visualização'}
          </span>
        </div>
        <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4 }}>Regra padrão · 5% · split 60/40</span>
      </div>

      {/* Headline metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 16 }}>
        <Metric label="Comissão prevista" value={c.forecast} accent={T.gold} />
        <Metric label="Comissão recebida" value={c.received} accent={T.green} />
        <Metric label="Projeção mensal" value={c.monthlyProjection} accent={T.blue} />
        <Metric label="Parte empresa" value={c.companyShare} accent={T.t1} />
        <Metric label="Parte corretores" value={c.brokerShare} accent={T.t1} />
      </div>

      <div className="imi-dash-grid">
        {/* Split bar */}
        <GlassCard className="imi-span-2" padding={20}>
          <Eyebrow style={{ marginBottom: 14 }}>Split empresa / corretor</Eyebrow>
          <div style={{ display: 'flex', height: 12, borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: '40%', background: `linear-gradient(90deg, ${T.glassBorderStrong}, rgba(244,242,236,0.4))` }} />
            <div style={{ width: '60%', background: `linear-gradient(90deg, ${T.goldBorder}, ${T.gold})` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <LegendDot color={T.t2} label="Empresa 40%" />
            <LegendDot color={T.gold} label="Corretor 60%" />
          </div>
          <p style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t3, lineHeight: 1.6, margin: '16px 0 0' }}>
            {canManage
              ? 'Como gestor, você define o percentual base, o percentual por corretor e por empreendimento. Cada venda gera um lançamento auditável em broker_commissions.'
              : 'Percentuais definidos pelo gestor. Cada venda registrada gera automaticamente sua comissão prevista.'}
          </p>
        </GlassCard>

        {/* Ranking */}
        <GlassCard className="imi-span-4" padding={20}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontFamily: T.fSans, fontSize: 14, fontWeight: 600, color: T.t1, margin: 0 }}>Ranking de comissão</h3>
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4 }}>prevista · recebida</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {c.ranking.map((b, i) => (
              <div
                key={b.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: i < c.ranking.length - 1 ? `1px solid ${T.glassBorder}` : 'none',
                }}
              >
                <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.t4, width: 18 }}>{i + 1}</span>
                <span style={{ flex: 1, fontFamily: T.fSans, fontSize: 13, color: T.t1 }}>{b.name}</span>
                <span style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t3 }}>{b.rate}%</span>
                <span style={{ fontFamily: T.fMono, fontSize: 12.5, color: T.gold, fontWeight: 600, width: 70, textAlign: 'right' }}>
                  {b.forecast}
                </span>
                <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.green, width: 64, textAlign: 'right' }}>
                  {b.received}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </section>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <GlassCard padding={18} style={{ borderRadius: T.rMd }}>
      <Eyebrow style={{ marginBottom: 12 }}>{label}</Eyebrow>
      <p style={{ fontFamily: T.fMono, fontSize: 22, fontWeight: 600, color: accent, margin: 0, lineHeight: 1 }}>{value}</p>
    </GlassCard>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t2 }}>{label}</span>
    </span>
  )
}
