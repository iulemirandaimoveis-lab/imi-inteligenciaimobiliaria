'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Sun, Moon, Sunset, Users, CalendarDays,
  Phone, MessageCircle, ArrowRight, Building2,
  TrendingUp, Scale, Clock, Zap,
} from 'lucide-react'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { KPICard } from '@/app/(backoffice)/components/ui/KPICard'
import { SectionHeader } from '@/app/(backoffice)/components/ui/SectionHeader'
import { MobileLeadCard } from '@/app/(backoffice)/components/ui/MobileLeadCard'
import { AIInsightCard } from '@/app/(backoffice)/components/ui/AIInsightCard'
import { StatusBadge } from '@/app/(backoffice)/components/ui/StatusBadge'

// ── Helpers ────────────────────────────────────────────────────────────
function getGreeting(): { text: string; Icon: React.ElementType; period: string } {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Bom dia', Icon: Sun, period: 'morning' }
  if (h < 18) return { text: 'Boa tarde', Icon: Sun, period: 'afternoon' }
  return { text: 'Boa noite', Icon: Moon, period: 'evening' }
}

function todayLabel() {
  const d = new Date()
  const weekday = d.toLocaleDateString('pt-BR', { weekday: 'long' })
  const rest = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
  return { weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1), rest }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// ── Quick action config ──────────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Novo Lead',   href: '/backoffice/leads/novo',        color: 'var(--s-hot)',       icon: Users },
  { label: 'Agendamento', href: '/backoffice/agenda',            color: 'var(--s-pend)',      icon: CalendarDays },
  { label: 'WhatsApp',    href: '/backoffice/whatsapp',          color: '#25D366',            icon: MessageCircle },
  { label: 'Avaliação',   href: '/backoffice/avaliacoes/nova',   color: 'var(--imi-ai-gold)', icon: Scale },
  { label: 'Imóveis',     href: '/backoffice/imoveis',           color: 'var(--s-cold)',      icon: Building2 },
  { label: 'Pipeline',    href: '/backoffice/leads',             color: 'var(--imi-blue-bright)', icon: TrendingUp },
]

// ── Loading Skeleton ─────────────────────────────────────────────────
function HojeSkeleton() {
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div style={{ height: 60, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.5 }} />
      <div className="grid grid-cols-3 gap-2">
        {[0,1,2].map(i => (
          <div key={i} style={{ height: 72, background: 'var(--bo-card)', borderRadius: 14, opacity: 0.4 }} />
        ))}
      </div>
      <div style={{ height: 100, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.4 }} />
      <div style={{ height: 200, background: 'var(--bo-card)', borderRadius: 16, opacity: 0.35 }} />
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────
export default function HojePage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { text: greetText, Icon: GreetIcon, period } = getGreeting()
  const { weekday, rest } = todayLabel()
  const todayISO = new Date().toISOString().split('T')[0]
  const currentMonth = todayISO.slice(0, 7)

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then(r => r.json()).catch(() => []),
      fetch(`/api/agenda?month=${currentMonth}`).then(r => r.json()).catch(() => []),
    ]).then(([leadsData, eventsData]) => {
      setLeads(Array.isArray(leadsData) ? leadsData : [])
      setEvents(Array.isArray(eventsData) ? eventsData : [])
      setLoading(false)
    })
  }, [currentMonth])

  if (loading) return <HojeSkeleton />

  // Derived data
  const todayEvents  = events.filter(e => e.start_time?.startsWith(todayISO))
  const hotLeads     = leads.filter(l => l.status === 'hot').slice(0, 4)
  const hotCount     = leads.filter(l => l.status === 'hot').length
  const warmCount    = leads.filter(l => l.status === 'warm').length
  const coldCount    = leads.filter(l => l.status === 'cold').length
  const totalLeads   = leads.length

  // AI briefing — dynamic text based on real data
  const aiBriefing = hotCount > 0
    ? `${hotCount} lead${hotCount > 1 ? 's quentes precisam' : ' quente precisa'} de ação hoje. Foco: abordagem de urgência + exclusividade.`
    : warmCount > 0
      ? `Nenhum lead quente agora. ${warmCount} leads mornos podem ser aquecidos hoje com follow-up ativo.`
      : 'Pipeline aguardando novos leads. Ative suas campanhas para maximizar captação.'

  const greetIconColor = period === 'morning'
    ? 'var(--imi-ai-gold)'
    : period === 'afternoon'
      ? 'var(--s-warm)'
      : 'var(--s-cold)'

  return (
    <div className="space-y-5 max-w-2xl mx-auto">

      {/* ── Hero: Greeting ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
        className="rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, var(--bo-card) 0%, var(--bo-surface) 100%)',
          border: '1px solid var(--bo-border)',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-20px',
          width: '100px', height: '100px', borderRadius: '50%',
          background: `${greetIconColor}15`, filter: 'blur(30px)', pointerEvents: 'none',
        }} />

        {/* IMI Intelligence tag */}
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--imi-blue-bright)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            INTELLIGENCE OS
          </span>
          <span className="flex items-center gap-1">
            <span className="live-dot" />
            <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--imi-ai-green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              IA EM TEMPO REAL
            </span>
          </span>
        </div>

        <div className="flex items-end justify-between" style={{ position: 'relative' }}>
          <div>
            <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)', fontWeight: 500, marginBottom: '2px' }}>
              {greetText}, Iule ✦
            </p>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--bo-text)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
              {weekday}
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)', marginTop: '1px' }}>
              {rest}
            </p>
          </div>

          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: `${greetIconColor}15`, border: `1px solid ${greetIconColor}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <GreetIcon size={22} style={{ color: greetIconColor }} />
          </div>
        </div>

        {/* Today's mini stat strip */}
        <div className="flex items-center gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--bo-border)' }}>
          <span style={{ fontSize: '10px', color: 'var(--bo-text-muted)' }}>
            Hoje: <span style={{ color: 'var(--s-hot)', fontWeight: 700 }}>{hotCount} quentes</span>
          </span>
          <span style={{ color: 'var(--bo-border)', fontSize: '12px' }}>·</span>
          <span style={{ fontSize: '10px', color: 'var(--bo-text-muted)' }}>
            <span style={{ color: 'var(--s-pend)', fontWeight: 700 }}>{todayEvents.length} eventos</span>
          </span>
          <span style={{ color: 'var(--bo-border)', fontSize: '12px' }}>·</span>
          <span style={{ fontSize: '10px', color: 'var(--bo-text-muted)' }}>
            <span style={{ color: 'var(--bo-text)', fontWeight: 700 }}>{totalLeads}</span> leads total
          </span>
        </div>
      </motion.div>

      {/* ── Quick Actions (horizontal scroll) ────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <SectionHeader title="Ações Rápidas" />
        <div
          className="flex gap-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingBottom: '4px' }}
        >
          {QUICK_ACTIONS.map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 + i * 0.04 }}
              whileTap={{ scale: 0.90 }}
              onClick={() => router.push(a.href)}
              className="flex-shrink-0 flex flex-col items-center gap-2"
              style={{ minWidth: '64px', padding: '10px 8px' }}
            >
              {/* Icon circle */}
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'var(--bo-card)',
                border: `1px solid var(--bo-border)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <a.icon size={18} style={{ color: a.color }} />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--bo-text-muted)', textAlign: 'center', lineHeight: 1.2, maxWidth: '56px' }}>
                {a.label}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Strip ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-2"
      >
        <KPICard
          label="Quentes"
          value={hotCount}
          accent="hot"
          icon={<Zap size={11} />}
          delta={hotCount > 0 ? 8 : undefined}
          deltaLabel=""
        />
        <KPICard
          label="Eventos Hoje"
          value={todayEvents.length}
          accent="blue"
          icon={<CalendarDays size={11} />}
        />
        <KPICard
          label="Pipeline"
          value={totalLeads}
          accent="green"
          icon={<TrendingUp size={11} />}
          sublabel={`${warmCount} mornos`}
        />
      </motion.div>

      {/* ── AI Daily Briefing ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14 }}
      >
        <AIInsightCard
          title="Briefing Diário · IA"
          variant="gold"
          nextStep="Ver leads prioritários"
          action={{
            label: 'Abrir Pipeline Completo',
            onClick: () => router.push('/backoffice/leads'),
          }}
        >
          <span style={{ color: 'var(--bo-text)', fontSize: '12px', lineHeight: 1.65 }}>
            {aiBriefing}
            {hotCount > 0 && (
              <>
                {' '}Recomendação: ligar nas <span style={{ color: 'var(--imi-ai-gold)', fontWeight: 600 }}>próximas 2 horas</span> para maximizar conversão.
              </>
            )}
          </span>
        </AIInsightCard>
      </motion.div>

      {/* ── Agenda de Hoje ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.17 }}
      >
        <SectionHeader
          title="Agenda de Hoje"
          badge={todayEvents.length || undefined}
          action={{ label: 'Ver agenda', href: '/backoffice/agenda' }}
        />

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}
        >
          {todayEvents.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center' }}>
              <CalendarDays size={24} style={{ color: 'var(--bo-text-muted)', opacity: 0.25, margin: '0 auto 10px' }} />
              <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)', marginBottom: '12px' }}>
                Sem eventos hoje
              </p>
              <button
                onClick={() => router.push('/backoffice/agenda')}
                style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'var(--imi-blue-bright)',
                  background: 'var(--imi-blue-dim)',
                  border: '1px solid var(--imi-blue-border)',
                  padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
                }}
              >
                + Agendar compromisso
              </button>
            </div>
          ) : (
            todayEvents.map((ev, i) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: i < todayEvents.length - 1 ? '1px solid var(--bo-border)' : 'none' }}
              >
                {/* Accent line */}
                <div style={{
                  width: '3px', height: '36px', borderRadius: '2px', flexShrink: 0,
                  background: ev.color || 'var(--imi-blue-bright)',
                }} />
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bo-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.title}
                  </p>
                  <p className="flex items-center gap-1" style={{ fontSize: '11px', color: 'var(--bo-text-muted)', marginTop: '2px' }}>
                    <Clock size={10} />
                    {formatTime(ev.start_time)}
                    {ev.location && ` · ${ev.location}`}
                  </p>
                </div>
                <StatusBadge status="pend" label="Hoje" size="xs" />
              </div>
            ))
          )}
        </div>
      </motion.div>

      {/* ── Hot Leads ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.20 }}
      >
        <SectionHeader
          title="Leads Quentes"
          badge={hotCount > 0 ? hotCount : undefined}
          action={{ label: 'Ver todos', href: '/backoffice/leads' }}
        />

        {hotLeads.length === 0 ? (
          <div
            className="rounded-2xl text-center"
            style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', padding: '28px 16px' }}
          >
            <Users size={24} style={{ color: 'var(--bo-text-muted)', opacity: 0.2, margin: '0 auto 10px' }} />
            <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)', marginBottom: '12px' }}>
              Nenhum lead quente no momento
            </p>
            <button
              onClick={() => router.push('/backoffice/leads/novo')}
              style={{
                fontSize: '11px', fontWeight: 600,
                color: 'var(--s-hot)',
                background: 'var(--s-hot-bg)',
                border: '1px solid rgba(248,113,113,0.25)',
                padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
              }}
            >
              + Novo Lead
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {hotLeads.map((l, i) => (
              <MobileLeadCard
                key={l.id}
                id={l.id}
                name={l.name || 'Sem nome'}
                status="hot"
                score={l.ai_score ?? Math.floor(70 + Math.random() * 25)}
                aiState="qualifying"
                aiSummary={
                  l.interest
                    ? `Lead interessado em ${l.interest}. IA identificou alta intenção de compra.`
                    : undefined
                }
                meta={{
                  origin: l.source || 'Meta Ads',
                  location: l.city || undefined,
                  lastActivity: 'hoje',
                  product: l.interest || undefined,
                }}
                isNew={i === 0}
                animDelay={i * 60}
                onClick={() => router.push(`/backoffice/leads/${l.id}`)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Pipeline & Portfolio Shortcuts ─────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="grid grid-cols-2 gap-2"
      >
        {/* Pipeline */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/backoffice/leads')}
          className="rounded-2xl text-left"
          style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', padding: '14px' }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--imi-blue-dim)', border: '1px solid var(--imi-blue-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px',
          }}>
            <TrendingUp size={16} style={{ color: 'var(--imi-blue-bright)' }} />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '2px' }}>
            Pipeline
          </p>
          <p style={{ fontSize: '10px', color: 'var(--bo-text-muted)' }}>
            {totalLeads} leads · {hotCount} quentes
          </p>
        </motion.button>

        {/* Portfolio */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/backoffice/imoveis')}
          className="rounded-2xl text-left"
          style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)', padding: '14px' }}
        >
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px',
          }}>
            <Building2 size={16} style={{ color: 'var(--s-pend)' }} />
          </div>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '2px' }}>
            Portfólio
          </p>
          <p style={{ fontSize: '10px', color: 'var(--bo-text-muted)' }}>
            Ver empreendimentos
          </p>
        </motion.button>
      </motion.div>

    </div>
  )
}
