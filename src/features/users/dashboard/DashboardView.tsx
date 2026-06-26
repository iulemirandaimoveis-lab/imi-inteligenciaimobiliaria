import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow, StatusDot } from '../ui/primitives'
import { LiveBadge } from './DashboardChrome'
import type {
  ActivityItem,
  AvailabilityRow,
  DashboardData,
  PerformanceBar,
  PipelineStage,
  TeamMember,
} from './data'

const STATUS_COLOR: Record<string, string> = {
  available: T.green,
  reserved: T.amber,
  sold: T.t3,
}
const STATUS_LABEL: Record<string, string> = {
  available: 'Disponível',
  reserved: 'Reservado',
  sold: 'Vendido',
}
const KIND_COLOR: Record<ActivityItem['kind'], string> = {
  sale: T.gold,
  proposal: T.blue,
  lead: T.green,
  availability: T.amber,
}

export function DashboardView({ data }: { data: DashboardData }) {
  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 24px 64px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <Eyebrow style={{ color: T.gold }}>Empreendimento atual</Eyebrow>
          <h1
            style={{
              fontFamily: T.fSerif,
              fontWeight: 500,
              fontSize: 32,
              color: T.t1,
              margin: '8px 0 4px',
              letterSpacing: '-0.01em',
            }}
          >
            {data.projectName}
          </h1>
          <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>{data.projectCity}</p>
        </div>
        <LiveBadge live={data.live} />
      </div>

      {/* KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 14,
          marginBottom: 16,
        }}
      >
        <StatCard label="Disponíveis" value={data.kpis.available} accent={T.green} />
        <StatCard label="Reservados" value={data.kpis.reserved} accent={T.amber} />
        <StatCard label="Vendidos" value={data.kpis.sold} accent={T.gold} />
        <StatCard label="VGV" value={data.kpis.vgv} accent={T.t1} />
        <StatCard label="Corretores online" value={data.kpis.brokersOnline} accent={T.green} dot />
        <StatCard label="Propostas abertas" value={data.kpis.openProposals} accent={T.blue} />
      </div>

      {/* Lower grid */}
      <div className="imi-dash-grid">
        <TeamCard team={data.team} />
        <PerformanceCard rows={data.performance} />
        <ActivityCard items={data.activity} />
        <PipelineCard stages={data.pipeline} />
        <AvailabilityCard rows={data.availability} />
      </div>

      <style>{`
        .imi-dash-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 720px) {
          .imi-dash-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 1080px) {
          .imi-dash-grid { grid-template-columns: repeat(6, 1fr); }
          .imi-span-2 { grid-column: span 2; }
          .imi-span-3 { grid-column: span 3; }
          .imi-span-4 { grid-column: span 4; }
          .imi-span-6 { grid-column: span 6; }
        }
      `}</style>
    </div>
  )
}

/* ── KPI ───────────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  accent,
  dot,
}: {
  label: string
  value: string | number
  accent: string
  dot?: boolean
}) {
  return (
    <GlassCard padding={18} style={{ borderRadius: T.rMd }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        {dot && <StatusDot color={accent} />}
        <Eyebrow>{label}</Eyebrow>
      </div>
      <p
        style={{
          fontFamily: T.fMono,
          fontSize: 26,
          fontWeight: 600,
          color: accent,
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </GlassCard>
  )
}

/* ── Section header ────────────────────────────────────────────────────── */
function SectionHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <h3 style={{ fontFamily: T.fSans, fontSize: 14, fontWeight: 600, color: T.t1, margin: 0 }}>{title}</h3>
      {hint && <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4 }}>{hint}</span>}
    </div>
  )
}

/* ── Team ──────────────────────────────────────────────────────────────── */
function TeamCard({ team }: { team: TeamMember[] }) {
  return (
    <GlassCard className="imi-span-2" padding={20}>
      <SectionHead title="Equipe" hint={`${team.length} membros`} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {team.slice(0, 8).map((m) => (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                position: 'relative',
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${T.glassBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: T.fSans,
                fontSize: 11,
                fontWeight: 700,
                color: T.t2,
                flexShrink: 0,
              }}
            >
              {m.initials}
              {m.online && (
                <span
                  style={{
                    position: 'absolute',
                    right: -1,
                    bottom: -1,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: T.green,
                    border: `2px solid ${T.bg}`,
                  }}
                />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontFamily: T.fSans,
                  fontSize: 13,
                  fontWeight: 500,
                  color: T.t1,
                  margin: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {m.name}
              </p>
            </div>
            <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t3, flexShrink: 0 }}>{m.role}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ── Performance ───────────────────────────────────────────────────────── */
function PerformanceCard({ rows }: { rows: PerformanceBar[] }) {
  return (
    <GlassCard className="imi-span-2" padding={20}>
      <SectionHead title="Performance" hint="vendas / corretor" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {rows.map((r) => (
          <div key={r.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.t2 }}>{r.name}</span>
              <span style={{ fontFamily: T.fMono, fontSize: 12.5, color: T.t1, fontWeight: 600 }}>{r.sales}</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${r.pct}%`,
                  borderRadius: 99,
                  background: `linear-gradient(90deg, ${T.goldBorder}, ${T.gold})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ── Activity ──────────────────────────────────────────────────────────── */
function ActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <GlassCard className="imi-span-2" padding={20}>
      <SectionHead title="Atividade recente" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 10 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: KIND_COLOR[it.kind],
                marginTop: 5,
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: T.fSans, fontSize: 12.5, color: T.t1, margin: 0, lineHeight: 1.45 }}>
                <strong style={{ fontWeight: 600 }}>{it.who}</strong> {it.action}
              </p>
              <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, margin: '2px 0 0' }}>{it.when}</p>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ── Pipeline ──────────────────────────────────────────────────────────── */
function PipelineCard({ stages }: { stages: PipelineStage[] }) {
  const max = Math.max(...stages.map((s) => s.count), 1)
  return (
    <GlassCard className="imi-span-3" padding={20}>
      <SectionHead title="Pipeline comercial" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {stages.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 96, fontFamily: T.fSans, fontSize: 12.5, color: T.t2, flexShrink: 0 }}>
              {s.label}
            </span>
            <div style={{ flex: 1, height: 26, borderRadius: T.rSm, background: 'rgba(255,255,255,0.04)', position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(s.count / max) * 100}%`,
                  background: `linear-gradient(90deg, ${T.blueSoft}, rgba(96,165,250,0.32))`,
                  borderRight: `1px solid rgba(96,165,250,0.4)`,
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: T.fMono,
                  fontSize: 12,
                  fontWeight: 600,
                  color: T.t1,
                }}
              >
                {s.count}
              </span>
            </div>
            <span style={{ width: 78, textAlign: 'right', fontFamily: T.fMono, fontSize: 11.5, color: T.t3, flexShrink: 0 }}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}

/* ── Availability (real-time) ──────────────────────────────────────────── */
function AvailabilityCard({ rows }: { rows: AvailabilityRow[] }) {
  return (
    <GlassCard className="imi-span-3" padding={20}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontFamily: T.fSans, fontSize: 14, fontWeight: 600, color: T.t1, margin: 0 }}>
          Disponibilidade em tempo real
        </h3>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <StatusDot color={T.green} />
          <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t3 }}>ao vivo</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {rows.map((r) => (
          <div
            key={r.unit}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '11px 13px',
              borderRadius: T.rSm,
              background: 'rgba(255,255,255,0.025)',
              border: `1px solid ${T.glassBorder}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[r.status], flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontFamily: T.fSans, fontSize: 12.5, fontWeight: 600, color: T.t1, margin: 0 }}>{r.unit}</p>
                <p style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t3, margin: 0 }}>{STATUS_LABEL[r.status]}</p>
              </div>
            </div>
            <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.t2, flexShrink: 0 }}>{r.price}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
