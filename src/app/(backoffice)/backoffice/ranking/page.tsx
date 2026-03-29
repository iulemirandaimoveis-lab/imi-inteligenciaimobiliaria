'use client'

import { useState, useEffect, useMemo } from 'react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { useIsMobile } from '@/hooks/use-is-mobile'
import {
  Trophy, Crown, Medal, Star, TrendingUp, Users,
  Target, Zap, Award, ChevronRight, Flame,
} from 'lucide-react'

/* ── types ─────────────────────────────────────────────────── */
interface Broker {
  id: string
  name: string
  email: string
  avatar_url: string | null
  team_id: string | null
  level: string | null
  performance_score: number
  deals_closed: number
  vgv_total: number
  vgv_month: number
  streak_months: number
  badges: string[] | null
  rank_position: number | null
}

interface Team {
  id: string
  name: string
  color: string | null
  computed_member_count: number
}

interface KPIs {
  totalBrokers: number
  totalVGV: number
  avgScore: number
  topPerformer: { name: string; score: number; avatar_url: string | null } | null
}

interface RankingData {
  brokers: Broker[]
  teams: Team[]
  kpis: KPIs
  badges: { broker_id: string; badge_type: string }[]
  challenges: { id: string; title: string; status: string }[]
}

/* ── helpers ───────────────────────────────────────────────── */
const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)

const fmtNumber = (v: number) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(v)

/* Level system */
const LEVELS = [
  { name: 'Bronze', min: 0, max: 199, color: '#CD7F32' },
  { name: 'Prata', min: 200, max: 399, color: '#C0C0C0' },
  { name: 'Ouro', min: 400, max: 599, color: '#C8A44A' },
  { name: 'Platina', min: 600, max: 799, color: '#4FC3F7' },
  { name: 'Diamante', min: 800, max: 1000, color: '#E040FB' },
] as const

function getLevelInfo(score: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (score >= LEVELS[i].min) return LEVELS[i]
  }
  return LEVELS[0]
}

function getLevelProgress(score: number) {
  const level = getLevelInfo(score)
  const range = level.max - level.min + 1
  return Math.min(1, (score - level.min) / range)
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

/* ── styles ───────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: 'rgba(14,28,48,.52)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: `1px solid ${T.border}`,
  borderRadius: T.radius.lg,
  boxShadow: '0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.04)',
}

const goldGradient = 'linear-gradient(135deg, #C8A44A 0%, #D4B86A 50%, #C8A44A 100%)'
const goldGradientText = 'linear-gradient(135deg, #D4B86A 0%, #F0D78C 50%, #C8A44A 100%)'

/* ── component ────────────────────────────────────────────── */
export default function RankingPage() {
  const [data, setData] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTeam, setActiveTeam] = useState<string | null>(null)
  const mobile = useIsMobile()

  /* Fetch ranking data */
  useEffect(() => {
    async function load() {
      try {
        const now = new Date()
        const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const params = new URLSearchParams({ period })
        if (activeTeam) params.set('team_id', activeTeam)
        const res = await fetch(`/api/ranking?${params}`)
        if (!res.ok) throw new Error('Falha ao carregar ranking')
        const json = await res.json()
        setData(json)
      } catch (err) {
        toast.error('Erro ao carregar dados do ranking')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    setLoading(true)
    load()
  }, [activeTeam])

  /* Derived */
  const brokers = data?.brokers ?? []
  const teams = data?.teams ?? []
  const kpis = data?.kpis
  const podium = brokers.slice(0, 3)
  const teamMap = useMemo(() => {
    const m: Record<string, Team> = {}
    teams.forEach(t => { m[t.id] = t })
    return m
  }, [teams])

  /* badge count per broker */
  const badgeCounts = useMemo(() => {
    const m: Record<string, number> = {}
    ;(data?.badges ?? []).forEach(b => {
      m[b.broker_id] = (m[b.broker_id] || 0) + 1
    })
    return m
  }, [data?.badges])

  /* ── Skeleton ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ padding: mobile ? 16 : 32, maxWidth: 1400, margin: '0 auto' }}>
        <PageIntelHeader
          moduleLabel="COMERCIAL · RANKING"
          title="Ranking & Performance"
          subtitle="Leaderboard, metas e gamificação da equipe comercial"
        />
        <div style={{ display: 'grid', gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: 16, marginTop: 28 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ ...card, padding: 24, minHeight: 100 }}>
              <div style={{ width: '60%', height: 12, borderRadius: 6, background: T.surfaceAlt, marginBottom: 12 }} />
              <div style={{ width: '40%', height: 24, borderRadius: 6, background: T.surfaceAlt }} />
            </div>
          ))}
        </div>
        <div style={{ ...card, marginTop: 24, padding: 32, minHeight: 240 }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 80, height: 120, borderRadius: 12, background: T.surfaceAlt }} />
            ))}
          </div>
        </div>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ ...card, marginTop: 8, padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: T.surfaceAlt }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '30%', height: 12, borderRadius: 6, background: T.surfaceAlt }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  /* ── Empty state ───────────────────────────────────────── */
  if (!data || brokers.length === 0) {
    return (
      <div style={{ padding: mobile ? 16 : 32, maxWidth: 1400, margin: '0 auto' }}>
        <PageIntelHeader
          moduleLabel="COMERCIAL · RANKING"
          title="Ranking & Performance"
          subtitle="Leaderboard, metas e gamificação da equipe comercial"
        />
        <div style={{ ...card, marginTop: 40, padding: 64, textAlign: 'center' as const }}>
          <Trophy size={48} style={{ color: T.textDim, margin: '0 auto 16px' }} />
          <p style={{ color: T.text, fontSize: 18, fontFamily: T.font.sans, margin: 0 }}>
            Nenhum corretor encontrado
          </p>
          <p style={{ color: T.textMuted, fontSize: 14, fontFamily: T.font.sans, marginTop: 8 }}>
            Cadastre corretores e equipes para ativar o ranking
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: mobile ? 16 : 32, maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Header ──────────────────────────────────────────── */}
      <PageIntelHeader
        moduleLabel="COMERCIAL · RANKING"
        title="Ranking & Performance"
        subtitle="Leaderboard, metas e gamificação da equipe comercial"
      />

      {/* ── KPI Row ─────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: mobile ? '1fr 1fr' : 'repeat(4,1fr)',
        gap: 16,
        marginTop: 28,
      }}>
        <KPICard icon={<Users size={20} />} label="Total Corretores" value={String(kpis?.totalBrokers ?? 0)} />
        <KPICard icon={<TrendingUp size={20} />} label="VGV do Mês" value={fmtCurrency(kpis?.totalVGV ?? 0)} />
        <KPICard icon={<Target size={20} />} label="Score Médio" value={fmtNumber(kpis?.avgScore ?? 0)} />
        <KPICard
          icon={<Crown size={20} />}
          label="Top Performer"
          value={kpis?.topPerformer?.name?.split(' ')[0] ?? '---'}
          accent
          sub={kpis?.topPerformer ? `${kpis.topPerformer.score} pts` : undefined}
        />
      </div>

      {/* ── Team Filter Tabs ────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 24,
        overflowX: 'auto',
        paddingBottom: 4,
      }}>
        <TabButton active={activeTeam === null} onClick={() => setActiveTeam(null)} color={T.gold}>
          Todos
        </TabButton>
        {teams.filter(t => t.computed_member_count > 0).map(t => (
          <TabButton
            key={t.id}
            active={activeTeam === t.id}
            onClick={() => setActiveTeam(t.id)}
            color={t.color || T.gold}
          >
            <span style={{
              display: 'inline-block',
              width: 8, height: 8, borderRadius: '50%',
              background: t.color || T.gold,
              marginRight: 6,
            }} />
            {t.name}
          </TabButton>
        ))}
      </div>

      {/* ── Podium ──────────────────────────────────────────── */}
      {podium.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            ...card,
            marginTop: 24,
            padding: mobile ? '28px 12px' : '40px 32px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            gap: mobile ? 12 : 32,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* ambient glow behind podium */}
          <div style={{
            position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
            width: 320, height: 320, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,164,74,.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          {/* 2nd place */}
          <PodiumSlot broker={podium[1]} rank={2} mobile={mobile} teamMap={teamMap} />
          {/* 1st place */}
          <PodiumSlot broker={podium[0]} rank={1} mobile={mobile} teamMap={teamMap} />
          {/* 3rd place */}
          <PodiumSlot broker={podium[2]} rank={3} mobile={mobile} teamMap={teamMap} />
        </motion.div>
      )}

      {/* ── Leaderboard ─────────────────────────────────────── */}
      <div style={{ marginTop: 24 }}>
        {mobile ? (
          /* Mobile: compact cards */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {brokers.map((b, i) => (
              <MobileRow key={b.id} broker={b} rank={i + 1} teamMap={teamMap} badgeCount={badgeCounts[b.id] || 0} />
            ))}
          </div>
        ) : (
          /* Desktop: table */
          <div style={{ ...card, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.font.sans }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['#', '', 'Nome', 'Equipe', 'N\u00edvel', 'Score', 'VGV M\u00eas', 'Deals', 'Streak', 'Badges'].map(h => (
                    <th key={h} style={{
                      padding: '14px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                      color: T.textMuted, letterSpacing: '.04em', textTransform: 'uppercase',
                      fontFamily: T.font.sans,
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brokers.map((b, i) => (
                  <LeaderboardRow key={b.id} broker={b} rank={i + 1} teamMap={teamMap} badgeCount={badgeCounts[b.id] || 0} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── KPICard ──────────────────────────────────────────────── */
function KPICard({ icon, label, value, accent, sub }: {
  icon: React.ReactNode; label: string; value: string; accent?: boolean; sub?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        ...card,
        padding: '20px 20px 18px',
        position: 'relative',
        overflow: 'hidden',
        ...(accent ? { borderColor: 'rgba(200,164,74,.30)' } : {}),
      }}
    >
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: goldGradient,
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ color: accent ? T.gold : T.textMuted }}>{icon}</div>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, letterSpacing: '.04em', textTransform: 'uppercase', fontFamily: T.font.sans }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: 22, fontWeight: 700, fontFamily: T.font.data,
        color: accent ? T.gold : T.text,
        ...(accent ? {
          background: goldGradientText,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        } : {}),
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font.sans, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </motion.div>
  )
}

/* ── PodiumSlot ───────────────────────────────────────────── */
function PodiumSlot({ broker, rank, mobile, teamMap }: {
  broker: Broker; rank: 1 | 2 | 3; mobile: boolean; teamMap: Record<string, Team>
}) {
  const isFirst = rank === 1
  const heights = { 1: mobile ? 140 : 170, 2: mobile ? 100 : 120, 3: mobile ? 80 : 100 }
  const avatarSize = isFirst ? (mobile ? 56 : 72) : (mobile ? 44 : 56)
  const level = getLevelInfo(broker.performance_score)
  const team = broker.team_id ? teamMap[broker.team_id] : null
  const delay = { 1: 0.2, 2: 0.1, 3: 0.3 }

  const rankIcon = rank === 1
    ? <Crown size={isFirst ? 24 : 18} style={{ color: '#C8A44A' }} />
    : rank === 2
      ? <Medal size={18} style={{ color: '#C0C0C0' }} />
      : <Medal size={18} style={{ color: '#CD7F32' }} />

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay[rank], duration: 0.5, ease: 'easeOut' }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        width: mobile ? (isFirst ? 110 : 90) : (isFirst ? 160 : 130),
        position: 'relative', zIndex: 1,
      }}
    >
      {/* Crown / Medal icon */}
      <div style={{ marginBottom: 8 }}>{rankIcon}</div>

      {/* Avatar */}
      <div style={{
        width: avatarSize, height: avatarSize, borderRadius: '50%',
        background: isFirst ? goldGradient : T.surfaceAlt,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: isFirst ? '3px solid #C8A44A' : `2px solid ${T.border}`,
        boxShadow: isFirst ? '0 0 24px rgba(200,164,74,.25)' : 'none',
        overflow: 'hidden',
        fontSize: isFirst ? 22 : 16, fontWeight: 700,
        color: isFirst ? T.base : T.textMuted,
        fontFamily: T.font.sans,
      }}>
        {broker.avatar_url ? (
          <img src={broker.avatar_url} alt={broker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          getInitials(broker.name)
        )}
      </div>

      {/* Name */}
      <p style={{
        fontSize: isFirst ? 14 : 12, fontWeight: 600, color: T.text,
        fontFamily: T.font.sans, marginTop: 10, textAlign: 'center',
        maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {broker.name.split(' ').slice(0, 2).join(' ')}
      </p>

      {/* Score */}
      <p style={{
        fontSize: isFirst ? 20 : 16, fontWeight: 700, margin: '4px 0 0',
        fontFamily: T.font.data,
        ...(isFirst ? {
          background: goldGradientText,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        } : { color: T.textMuted }),
      }}>
        {broker.performance_score}
      </p>

      {/* Level badge */}
      <div style={{
        marginTop: 6,
        padding: '3px 10px', borderRadius: T.radius.full,
        background: `${level.color}18`,
        border: `1px solid ${level.color}40`,
        fontSize: 10, fontWeight: 600, color: level.color,
        fontFamily: T.font.sans, letterSpacing: '.03em',
      }}>
        {level.name}
      </div>

      {/* Team */}
      {team && (
        <p style={{ fontSize: 10, color: T.textDim, fontFamily: T.font.sans, marginTop: 4 }}>
          {team.name}
        </p>
      )}

      {/* Pedestal */}
      <div style={{
        width: '100%', height: heights[rank], marginTop: 12,
        borderRadius: `${T.radius.md} ${T.radius.md} 0 0`,
        background: isFirst
          ? 'linear-gradient(180deg, rgba(200,164,74,.18) 0%, rgba(200,164,74,.04) 100%)'
          : `linear-gradient(180deg, ${T.surfaceAlt} 0%, rgba(14,28,48,.3) 100%)`,
        border: `1px solid ${isFirst ? 'rgba(200,164,74,.25)' : T.border}`,
        borderBottom: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 32, fontWeight: 800, color: isFirst ? T.gold : T.textDim,
        fontFamily: T.font.display,
      }}>
        {rank}
      </div>
    </motion.div>
  )
}

/* ── LeaderboardRow (desktop) ─────────────────────────────── */
function LeaderboardRow({ broker, rank, teamMap, badgeCount }: {
  broker: Broker; rank: number; teamMap: Record<string, Team>; badgeCount: number
}) {
  const level = getLevelInfo(broker.performance_score)
  const progress = getLevelProgress(broker.performance_score)
  const team = broker.team_id ? teamMap[broker.team_id] : null
  const isTop3 = rank <= 3

  return (
    <motion.tr
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.03, duration: 0.3 }}
      style={{
        borderBottom: `1px solid ${T.borderLight}`,
        background: isTop3 ? 'rgba(200,164,74,.03)' : 'transparent',
        transition: 'background .15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(200,164,74,.06)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isTop3 ? 'rgba(200,164,74,.03)' : 'transparent' }}
    >
      {/* Rank */}
      <td style={{ padding: '14px 16px', width: 50 }}>
        {isTop3 ? (
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: rank === 1 ? 'rgba(200,164,74,.2)' : rank === 2 ? 'rgba(192,192,192,.15)' : 'rgba(205,127,50,.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            color: rank === 1 ? '#C8A44A' : rank === 2 ? '#C0C0C0' : '#CD7F32',
            fontFamily: T.font.data,
          }}>
            {rank}
          </div>
        ) : (
          <span style={{ fontSize: 13, color: T.textDim, fontFamily: T.font.data }}>
            {rank}
          </span>
        )}
      </td>

      {/* Avatar */}
      <td style={{ padding: '14px 8px', width: 48 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: T.surfaceAlt,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: T.textMuted, fontFamily: T.font.sans,
          overflow: 'hidden',
          border: isTop3 ? `2px solid ${level.color}40` : `1px solid ${T.border}`,
        }}>
          {broker.avatar_url ? (
            <img src={broker.avatar_url} alt={broker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            getInitials(broker.name)
          )}
        </div>
      </td>

      {/* Name */}
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font.sans,
          ...(rank === 1 ? {
            background: goldGradientText,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          } : {}),
        }}>
          {broker.name}
        </span>
      </td>

      {/* Team */}
      <td style={{ padding: '14px 16px' }}>
        {team ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: team.color || T.gold, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font.sans }}>{team.name}</span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: T.textDim }}>---</span>
        )}
      </td>

      {/* Level */}
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '3px 10px', borderRadius: T.radius.full, fontSize: 10, fontWeight: 600,
            background: `${level.color}18`, border: `1px solid ${level.color}40`, color: level.color,
            fontFamily: T.font.sans, letterSpacing: '.03em', whiteSpace: 'nowrap',
          }}>
            {level.name}
          </span>
          {/* mini progress bar */}
          <div style={{ width: 40, height: 3, borderRadius: 2, background: T.surfaceAlt, overflow: 'hidden' }}>
            <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 2, background: level.color, transition: 'width .4s' }} />
          </div>
        </div>
      </td>

      {/* Score */}
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          fontSize: 14, fontWeight: 700, fontFamily: T.font.data,
          color: isTop3 ? T.gold : T.text,
        }}>
          {broker.performance_score}
        </span>
      </td>

      {/* VGV */}
      <td style={{ padding: '14px 16px' }}>
        <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font.data }}>
          {fmtCurrency(broker.vgv_month || 0)}
        </span>
      </td>

      {/* Deals */}
      <td style={{ padding: '14px 16px' }}>
        <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font.data }}>
          {broker.deals_closed || 0}
        </span>
      </td>

      {/* Streak */}
      <td style={{ padding: '14px 16px' }}>
        {(broker.streak_months || 0) > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Flame size={14} style={{ color: '#FF6B35' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: '#FF6B35', fontFamily: T.font.data }}>
              {broker.streak_months}m
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: T.textDim }}>---</span>
        )}
      </td>

      {/* Badges */}
      <td style={{ padding: '14px 16px' }}>
        {badgeCount > 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: T.radius.full,
            background: T.accentBg,
          }}>
            <Award size={12} style={{ color: T.gold }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: T.gold, fontFamily: T.font.data }}>
              {badgeCount}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: T.textDim }}>---</span>
        )}
      </td>
    </motion.tr>
  )
}

/* ── MobileRow ────────────────────────────────────────────── */
function MobileRow({ broker, rank, teamMap, badgeCount }: {
  broker: Broker; rank: number; teamMap: Record<string, Team>; badgeCount: number
}) {
  const level = getLevelInfo(broker.performance_score)
  const progress = getLevelProgress(broker.performance_score)
  const team = broker.team_id ? teamMap[broker.team_id] : null
  const isTop3 = rank <= 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.03, duration: 0.25 }}
      style={{
        ...card,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 12,
        ...(isTop3 ? { borderColor: 'rgba(200,164,74,.20)' } : {}),
      }}
    >
      {/* Rank */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        background: isTop3
          ? rank === 1 ? 'rgba(200,164,74,.2)' : rank === 2 ? 'rgba(192,192,192,.15)' : 'rgba(205,127,50,.15)'
          : T.surfaceAlt,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        color: isTop3
          ? rank === 1 ? '#C8A44A' : rank === 2 ? '#C0C0C0' : '#CD7F32'
          : T.textDim,
        fontFamily: T.font.data,
      }}>
        {rank}
      </div>

      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
        background: T.surfaceAlt,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 600, color: T.textMuted, fontFamily: T.font.sans,
        overflow: 'hidden',
        border: `1px solid ${T.border}`,
      }}>
        {broker.avatar_url ? (
          <img src={broker.avatar_url} alt={broker.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          getInitials(broker.name)
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font.sans,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {broker.name.split(' ').slice(0, 2).join(' ')}
          </span>
          <span style={{
            padding: '1px 7px', borderRadius: T.radius.full, fontSize: 9, fontWeight: 600,
            background: `${level.color}18`, border: `1px solid ${level.color}40`, color: level.color,
            fontFamily: T.font.sans, flexShrink: 0,
          }}>
            {level.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {team && (
            <span style={{ fontSize: 10, color: T.textDim, fontFamily: T.font.sans }}>
              {team.name}
            </span>
          )}
          {(broker.streak_months || 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Flame size={10} style={{ color: '#FF6B35' }} />
              <span style={{ fontSize: 10, color: '#FF6B35', fontFamily: T.font.data }}>{broker.streak_months}m</span>
            </div>
          )}
          {badgeCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Award size={10} style={{ color: T.gold }} />
              <span style={{ fontSize: 10, color: T.gold, fontFamily: T.font.data }}>{badgeCount}</span>
            </div>
          )}
        </div>
        {/* progress bar */}
        <div style={{ width: '100%', height: 2, borderRadius: 1, background: T.surfaceAlt, marginTop: 6 }}>
          <div style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 1, background: level.color }} />
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: 16, fontWeight: 700, fontFamily: T.font.data,
          color: isTop3 ? T.gold : T.text,
        }}>
          {broker.performance_score}
        </div>
        <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.font.data }}>
          {fmtCurrency(broker.vgv_month || 0)}
        </div>
      </div>

      <ChevronRight size={14} style={{ color: T.textDim, flexShrink: 0 }} />
    </motion.div>
  )
}

/* ── TabButton ────────────────────────────────────────────── */
function TabButton({ active, onClick, color, children }: {
  active: boolean; onClick: () => void; color: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 16px',
        borderRadius: T.radius.full,
        border: active ? `1px solid ${color}` : `1px solid ${T.border}`,
        background: active ? `${color}18` : 'transparent',
        color: active ? T.text : T.textMuted,
        fontSize: 12, fontWeight: 600, fontFamily: T.font.sans,
        cursor: 'pointer',
        transition: 'all .15s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}
