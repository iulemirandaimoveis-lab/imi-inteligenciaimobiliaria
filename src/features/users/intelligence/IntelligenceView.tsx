'use client'

import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  Gauge,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { tokens as T } from '../ui/tokens'
import { GlassCard, Eyebrow } from '../ui/primitives'
import { AnimatedNumber, Reveal, Stagger, StaggerItem, ActivityPulse } from './motion'
import { ClientMatchPanel } from './ClientMatchPanel'
import type { IntelligenceModel } from '@/lib/imi-intelligence/service'

const SEV: Record<string, { color: string; soft: string }> = {
  positive: { color: T.green, soft: T.greenSoft },
  warning: { color: T.amber, soft: T.amberSoft },
  critical: { color: T.red, soft: T.redSoft },
  info: { color: T.blue, soft: T.blueSoft },
}

export function IntelligenceView({ model }: { model: IntelligenceModel }) {
  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 72px' }}>
      <Header projectName={model.projectName} live={model.live} />

      {/* 1 — Executive Overview */}
      <Section icon={<Gauge size={15} />} title="Executive Overview" subtitle="Interpretação, não apenas números">
        <Stagger style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {model.executive.map((m) => (
            <StaggerItem key={m.label}>
              <ExecutiveCard metric={m} />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* 2 — IMI Insights */}
      <Section icon={<Brain size={15} />} title="IMI Insights" subtitle="Inteligência analítica gerada automaticamente">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          {model.insights.map((ins, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <InsightCard insight={ins} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 2b — Match de Cliente (motor de intenção sobre o inventário real) */}
      <Section
        icon={<Target size={15} />}
        title="Match de Cliente"
        subtitle="Descreva o que o cliente procura — o IMI devolve os lotes certos"
      >
        <Reveal>
          <ClientMatchPanel />
        </Reveal>
      </Section>

      <div className="imi-intel-grid">
        {/* 3 — Sales Intelligence */}
        <Reveal style={{ gridColumn: 'span 12' }}>
          <GlassCard padding={22}>
            <ModuleHead icon={<TrendingUp size={15} />} title="Sales Intelligence" hint="funil + tendência de receita" />
            <div className="imi-intel-split">
              <Funnel funnel={model.funnel} />
              <RevenueTrend series={model.series} />
            </div>
          </GlassCard>
        </Reveal>

        {/* 4 — Broker Intelligence */}
        <Reveal style={{ gridColumn: 'span 7' }}>
          <GlassCard padding={22}>
            <ModuleHead icon={<Trophy size={15} />} title="Broker Intelligence" hint="Broker Performance Index" />
            <BrokerRanking brokers={model.brokers} />
          </GlassCard>
        </Reveal>

        {/* Radar */}
        <Reveal style={{ gridColumn: 'span 5' }}>
          <GlassCard padding={22}>
            <ModuleHead icon={<Activity size={15} />} title="Destaque × Equipe" hint="perfil de desempenho" />
            <PerformanceRadar radar={model.radar} />
          </GlassCard>
        </Reveal>

        {/* 5 — Inventory Intelligence */}
        <Reveal style={{ gridColumn: 'span 7' }}>
          <GlassCard padding={22}>
            <ModuleHead icon={<Activity size={15} />} title="Inventory Intelligence" hint="mapa de demanda por quadra" />
            <InventoryHeat inventory={model.inventory} />
          </GlassCard>
        </Reveal>

        {/* 6 — Predictive Analytics */}
        <Reveal style={{ gridColumn: 'span 5' }}>
          <GlassCard padding={22}>
            <ModuleHead icon={<Sparkles size={15} />} title="Predictive Analytics" hint="previsão 30 dias" />
            <Predictive predictive={model.predictive} />
          </GlassCard>
        </Reveal>

        {/* 7 — Realtime Activity Center */}
        <Reveal style={{ gridColumn: 'span 7' }}>
          <GlassCard padding={22}>
            <ModuleHead icon={<Activity size={15} />} title="Real Time Activity Center" hint="ao vivo" live />
            <RealtimeActivity />
          </GlassCard>
        </Reveal>

        {/* 8 — Commission Intelligence */}
        <Reveal style={{ gridColumn: 'span 5' }}>
          <GlassCard padding={22}>
            <ModuleHead icon={<Trophy size={15} />} title="Commission Intelligence" hint="previsão & ranking" />
            <CommissionIntel commission={model.commission} />
          </GlassCard>
        </Reveal>
      </div>

      <style>{`
        .imi-intel-grid { display:grid; grid-template-columns: repeat(12, 1fr); gap:16px; margin-top:8px; }
        .imi-intel-grid > div { grid-column: span 12 !important; }
        .imi-intel-split { display:grid; grid-template-columns: 1fr; gap:24px; }
        @media (min-width: 1024px) {
          .imi-intel-grid > div { grid-column: var(--col, span 12); }
          .imi-intel-grid > div:nth-child(2) { grid-column: span 7; }
          .imi-intel-grid > div:nth-child(3) { grid-column: span 5; }
          .imi-intel-grid > div:nth-child(4) { grid-column: span 7; }
          .imi-intel-grid > div:nth-child(5) { grid-column: span 5; }
          .imi-intel-grid > div:nth-child(6) { grid-column: span 7; }
          .imi-intel-grid > div:nth-child(7) { grid-column: span 5; }
          .imi-intel-split { grid-template-columns: 1fr 1.3fr; }
        }
      `}</style>
    </div>
  )
}

/* ── Header ───────────────────────────────────────────────────────────────── */
function Header({ projectName, live }: { projectName: string; live: boolean }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
      <div>
        <Eyebrow style={{ color: T.gold }}>Intelligence Layer</Eyebrow>
        <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 32, color: T.t1, margin: '8px 0 4px', letterSpacing: '-0.01em' }}>
          {projectName} · Centro de Inteligência
        </h1>
        <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, margin: 0 }}>
          Análise preditiva, BI executivo e atividade em tempo real.
        </p>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <ActivityPulse color={live ? T.green : T.amber} />
        <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t3 }}>
          {live ? 'Event stream ativo' : 'Pré-visualização · event stream aguardando dados'}
        </span>
      </div>
    </div>
  )
}

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ color: T.gold, display: 'flex' }}>{icon}</span>
        <h2 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 19, color: T.t1, margin: 0 }}>{title}</h2>
        <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.t4 }}>· {subtitle}</span>
      </div>
      {children}
    </section>
  )
}

function ModuleHead({ icon, title, hint, live }: { icon: React.ReactNode; title: string; hint?: string; live?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ color: T.gold, display: 'flex' }}>{icon}</span>
        <h3 style={{ fontFamily: T.fSans, fontSize: 14.5, fontWeight: 600, color: T.t1, margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        {live && <ActivityPulse color={T.green} />}
        {hint && <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4 }}>{hint}</span>}
      </div>
    </div>
  )
}

/* ── 1. Executive card ───────────────────────────────────────────────────── */
function ExecutiveCard({ metric }: { metric: IntelligenceModel['executive'][number] }) {
  const numeric = parseFloat(metric.value.replace(/[^\d.,-]/g, '').replace('.', '').replace(',', '.'))
  const isNumeric = !Number.isNaN(numeric) && /\d/.test(metric.value)
  return (
    <GlassCard padding={18} style={{ borderRadius: T.rMd, height: '100%' }}>
      <Eyebrow style={{ marginBottom: 12 }}>{metric.label}</Eyebrow>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        {isNumeric && /^[\d.,]+$/.test(metric.value.trim()) ? (
          <AnimatedNumber
            value={numeric}
            style={{ fontFamily: T.fMono, fontSize: 24, fontWeight: 600, color: T.t1 }}
          />
        ) : (
          <span style={{ fontFamily: T.fMono, fontSize: 22, fontWeight: 600, color: T.t1 }}>{metric.value}</span>
        )}
        {metric.delta && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              fontFamily: T.fSans,
              fontSize: 11.5,
              fontWeight: 600,
              color: metric.deltaPositive ? T.green : T.red,
            }}
          >
            {metric.deltaPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {metric.delta}
          </span>
        )}
      </div>
      {metric.hint && <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, margin: '8px 0 0' }}>{metric.hint}</p>}
    </GlassCard>
  )
}

/* ── 2. Insight card ─────────────────────────────────────────────────────── */
function InsightCard({ insight }: { insight: IntelligenceModel['insights'][number] }) {
  const sev = SEV[insight.severity] ?? SEV.info
  return (
    <div
      style={{
        height: '100%',
        background: T.glass,
        border: `1px solid ${T.glassBorder}`,
        borderLeft: `2px solid ${sev.color}`,
        borderRadius: T.rMd,
        padding: 16,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: T.fSans, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: sev.color }}>
          {insight.kind}
        </span>
        <span style={{ fontFamily: T.fMono, fontSize: 10, color: T.t4 }}>conf {(insight.confidence * 100).toFixed(0)}%</span>
      </div>
      <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t1, margin: 0, lineHeight: 1.5 }}>{insight.title}</p>
    </div>
  )
}

/* ── 3. Funnel ───────────────────────────────────────────────────────────── */
function Funnel({ funnel }: { funnel: IntelligenceModel['funnel'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <Eyebrow style={{ marginBottom: 4 }}>Funil comercial</Eyebrow>
      {funnel.map((s, i) => (
        <div key={s.key}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.t2 }}>{s.label}</span>
            <span style={{ fontFamily: T.fMono, fontSize: 11.5, color: T.t3 }}>
              {s.value} · {s.stepConversion.toFixed(0)}%
            </span>
          </div>
          <div style={{ height: 22, borderRadius: 7, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.max(6, s.ofTop)}%`,
                background: `linear-gradient(90deg, rgba(200,164,74,${0.25 + i * 0.1}), ${T.gold})`,
                transition: `width 0.8s ${T.ease}`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Revenue trend (area chart) ──────────────────────────────────────────── */
function RevenueTrend({ series }: { series: IntelligenceModel['series'] }) {
  const data = series.map((d) => ({ date: d.date.slice(5), receita: Math.round(d.revenue / 1_000_000) }))
  return (
    <div>
      <Eyebrow style={{ marginBottom: 10 }}>Receita (R$ M · 30 dias)</Eyebrow>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
            <defs>
              <linearGradient id="imiRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.gold} stopOpacity={0.4} />
                <stop offset="100%" stopColor={T.gold} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: T.t4, fontSize: 9 }} interval={5} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: T.bgElevated, border: `1px solid ${T.glassBorder}`, borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: T.t3 }}
              itemStyle={{ color: T.gold }}
              cursor={{ stroke: T.glassBorderStrong }}
            />
            <Area type="monotone" dataKey="receita" stroke={T.gold} strokeWidth={2} fill="url(#imiRev)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

/* ── 4. Broker ranking (BPI) ─────────────────────────────────────────────── */
function BrokerRanking({ brokers }: { brokers: IntelligenceModel['brokers'] }) {
  const max = Math.max(...brokers.map((b) => b.bpi), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {brokers.map((b, i) => (
        <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: T.fMono, fontSize: 12, color: i === 0 ? T.gold : T.t4, width: 18 }}>{i + 1}</span>
          <span style={{ width: 78, fontFamily: T.fSans, fontSize: 13, color: T.t1 }}>{b.name}</span>
          <div style={{ flex: 1, height: 8, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(b.bpi / max) * 100}%`, borderRadius: 99, background: i === 0 ? `linear-gradient(90deg, ${T.goldBorder}, ${T.gold})` : 'rgba(96,165,250,0.5)' }} />
          </div>
          <span style={{ fontFamily: T.fMono, fontSize: 12.5, color: T.t1, fontWeight: 600, width: 30, textAlign: 'right' }}>{b.bpi}</span>
          <span style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t4, width: 92, textAlign: 'right' }}>
            {b.conversion.toFixed(0)}% · {b.avgResponseMin}min
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Radar ───────────────────────────────────────────────────────────────── */
function PerformanceRadar({ radar }: { radar: IntelligenceModel['radar'] }) {
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={radar} outerRadius="72%">
          <PolarGrid stroke={T.glassBorder} />
          <PolarAngleAxis dataKey="metric" tick={{ fill: T.t3, fontSize: 10 }} />
          <Radar name="Equipe" dataKey="team" stroke={T.blue} fill={T.blue} fillOpacity={0.12} />
          <Radar name="Destaque" dataKey="top" stroke={T.gold} fill={T.gold} fillOpacity={0.22} />
          <Tooltip contentStyle={{ background: T.bgElevated, border: `1px solid ${T.glassBorder}`, borderRadius: 10, fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ── 5. Inventory heat ───────────────────────────────────────────────────── */
function InventoryHeat({ inventory }: { inventory: IntelligenceModel['inventory'] }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <Pill label="Disponíveis" value={inventory.available} color={T.green} />
        <Pill label="Reservados" value={inventory.reserved} color={T.amber} />
        <Pill label="Vendidos" value={inventory.sold} color={T.gold} />
        <Pill label="Dias médio" value={inventory.avgDaysInStock} color={T.blue} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: 10 }}>
        {inventory.blocks.map((b) => (
          <div key={b.block} style={{ padding: 12, borderRadius: T.rSm, background: `rgba(200,164,74,${0.04 + (b.demand / 100) * 0.18})`, border: `1px solid ${T.glassBorder}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: T.fSans, fontSize: 12.5, fontWeight: 600, color: T.t1 }}>{b.block}</span>
              <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.gold }}>{b.demand}%</span>
            </div>
            <div style={{ display: 'flex', gap: 4, fontFamily: T.fMono, fontSize: 10.5, color: T.t3 }}>
              <span style={{ color: T.green }}>{b.available}</span>·
              <span style={{ color: T.amber }}>{b.reserved}</span>·
              <span style={{ color: T.gold }}>{b.sold}</span>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: T.fSans, fontSize: 11.5, color: T.t3, margin: '14px 0 0' }}>
        Maior demanda: <strong style={{ color: T.gold }}>{inventory.hottestBlock}</strong> · alerta automático quando estoque premium desacelera.
      </p>
    </div>
  )
}

function Pill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1, padding: '10px 12px', borderRadius: T.rSm, background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.glassBorder}` }}>
      <Eyebrow style={{ marginBottom: 6 }}>{label}</Eyebrow>
      <AnimatedNumber value={value} style={{ fontFamily: T.fMono, fontSize: 18, fontWeight: 600, color }} />
    </div>
  )
}

/* ── 6. Predictive ───────────────────────────────────────────────────────── */
function Predictive({ predictive }: { predictive: IntelligenceModel['predictive'] }) {
  const conf = Math.round(predictive.confidence * 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ConfidenceRing value={conf} />
        <div>
          <Eyebrow style={{ marginBottom: 6 }}>Receita prevista (30d)</Eyebrow>
          <p style={{ fontFamily: T.fMono, fontSize: 24, fontWeight: 600, color: T.gold, margin: 0 }}>{predictive.revenue30d}</p>
          <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t4, margin: '4px 0 0' }}>Confidence score {conf}%</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <MiniStat label="Vendas (30d)" value={String(predictive.sales30d)} />
        <MiniStat label="VGV projetado" value={predictive.vgvForecast} />
        <MiniStat label="Risco de estoque" value={predictive.riskLevel} accent={predictive.riskLevel === 'Alto' ? T.amber : T.green} />
        <MiniStat label="Sazonalidade" value="Estável" />
      </div>
    </div>
  )
}

function ConfidenceRing({ value }: { value: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  return (
    <svg width={76} height={76} viewBox="0 0 76 76">
      <circle cx={38} cy={38} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6} />
      <circle
        cx={38}
        cy={38}
        r={r}
        fill="none"
        stroke={T.gold}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * value) / 100}
        transform="rotate(-90 38 38)"
      />
      <text x={38} y={42} textAnchor="middle" fontFamily={T.fMono} fontSize={15} fontWeight={600} fill={T.t1}>
        {value}%
      </text>
    </svg>
  )
}

function MiniStat({ label, value, accent = T.t1 }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: T.rSm, background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.glassBorder}` }}>
      <Eyebrow style={{ marginBottom: 5 }}>{label}</Eyebrow>
      <p style={{ fontFamily: T.fMono, fontSize: 14, fontWeight: 600, color: accent, margin: 0 }}>{value}</p>
    </div>
  )
}

/* ── 7. Realtime activity (simulated live stream) ────────────────────────── */
const FEED = [
  { who: 'João', text: 'iniciou proposta · Casa 22', accent: 'proposal' as const },
  { who: 'Lucas', text: 'reservou lote · Casa 09', accent: 'reserve' as const },
  { who: 'Visitante', text: 'nova visita registrada · Quadra B', accent: 'view' as const },
  { who: 'Allysson', text: 'proposta aprovada · Casa 14', accent: 'sale' as const },
  { who: 'Anderson', text: 'novo lead capturado', accent: 'lead' as const },
  { who: 'Douglas', text: 'cliente avançou para negociação', accent: 'proposal' as const },
]
const ACCENT: Record<string, string> = { sale: T.gold, proposal: T.blue, lead: T.green, reserve: T.amber, view: T.t3 }

function RealtimeActivity() {
  const [items, setItems] = useState(() => FEED.slice(0, 4).map((f, i) => ({ ...f, id: i, ago: `${i + 1} min` })))

  useEffect(() => {
    let n = items.length
    const id = setInterval(() => {
      const next = FEED[n % FEED.length]
      n += 1
      setItems((prev) => [{ ...next, id: n, ago: 'agora' }, ...prev].slice(0, 6))
    }, 3600)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((it, i) => (
        <div
          key={it.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            opacity: 1 - i * 0.08,
            animation: i === 0 ? 'imiRise 0.5s ease both' : undefined,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: ACCENT[it.accent], flexShrink: 0 }} />
          <p style={{ flex: 1, fontFamily: T.fSans, fontSize: 12.5, color: T.t1, margin: 0 }}>
            <strong style={{ fontWeight: 600 }}>{it.who}</strong> {it.text}
          </p>
          <span style={{ fontFamily: T.fSans, fontSize: 10.5, color: T.t4, flexShrink: 0 }}>{it.ago}</span>
        </div>
      ))}
    </div>
  )
}

/* ── 8. Commission intelligence ──────────────────────────────────────────── */
function CommissionIntel({ commission }: { commission: IntelligenceModel['commission'] }) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <MiniStat label="Prevista" value={commission.forecast} accent={T.gold} />
        <MiniStat label="Recebida" value={commission.received} accent={T.green} />
        <MiniStat label="Projeção mensal" value={commission.monthlyProjection} accent={T.blue} />
        <MiniStat label="Split corretor" value="60%" />
      </div>
      <Eyebrow style={{ marginBottom: 10 }}>Ranking de comissão</Eyebrow>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {commission.ranking.map((r, i) => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.t4, width: 16 }}>{i + 1}</span>
            <span style={{ flex: 1, fontFamily: T.fSans, fontSize: 12.5, color: T.t1 }}>{r.name}</span>
            <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.gold, fontWeight: 600 }}>{r.forecast}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
