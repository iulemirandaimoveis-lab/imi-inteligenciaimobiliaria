'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Award, CheckCircle, Circle, Star, Crown,
  Home, DollarSign, Globe, HandshakeIcon, Leaf, Link2,
  Medal, ChevronRight, Lock, Flame
} from 'lucide-react'
import { T } from '../../lib/theme'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// ─── Static Data ─────────────────────────────────────────────────────────────

const LEVELS = [
  {
    code: 'candidate', name: 'Candidato',      subtitle: 'Aprovado no Discovery Day',
    icon: '🔍', color: '#6B7280', order: 0, commission: 0,
    requirements: ['Aprovação no Discovery Day IMI', 'Assinatura do Contrato de Parceria'],
    gradient: 'linear-gradient(135deg, #4B5563, #374151)',
  },
  {
    code: 'trainee',   name: 'Trainee',         subtitle: 'Em formação — T1 + T3',
    icon: '🌱', color: '#A3A3A3', order: 1, commission: 50,
    requirements: ['Concluir T1 — Fundamentos IMI', 'Concluir T3 — Plataforma Backoffice', 'Aprovação na avaliação interna IMI'],
    gradient: 'linear-gradient(135deg, #737373, #525252)',
  },
  {
    code: 'junior',    name: 'Advisor Júnior',   subtitle: 'CIA-1 Certificado',
    icon: '⭐', color: '#C8A44A', order: 2, commission: 65,
    requirements: ['Certificação CIA-1 aprovada', 'Ao menos 1 operação concluída', 'Nota mínima de atendimento: 4,5/5'],
    gradient: 'linear-gradient(135deg, #C8A44A, #A07830)',
  },
  {
    code: 'pleno',     name: 'Advisor Pleno',    subtitle: 'CIA-2 Certificado',
    icon: '⭐⭐', color: '#D9BC82', order: 3, commission: 75,
    requirements: ['Certificação CIA-2 aprovada', 'Ao menos 3 operações concluídas', 'VGV acumulado ≥ R$1M', 'Nota mínima de atendimento: 4,7/5'],
    gradient: 'linear-gradient(135deg, #D9BC82, #B89040)',
  },
  {
    code: 'senior',    name: 'Advisor Sênior',   subtitle: 'CIA-3 ou CIA-4',
    icon: '⭐⭐⭐', color: '#E8D08A', order: 4, commission: 80,
    requirements: ['CIA-3 ou CIA-4 aprovada', 'Ao menos 10 operações concluídas', 'VGV acumulado ≥ R$5M', '1 operação internacional', 'NPS de clientes ≥ 9'],
    gradient: 'linear-gradient(135deg, #E8D08A, #C4A850)',
  },
  {
    code: 'master',    name: 'Master Partner',   subtitle: 'CIA-M — Elite IMI',
    icon: '👑', color: '#FFD700', order: 5, commission: 85,
    requirements: ['CIA-M aprovada', 'Ao menos 25 operações concluídas', 'VGV acumulado ≥ R$25M', '3+ operações internacionais', 'NPS de clientes ≥ 9,5', 'Aprovação pela Diretoria IMI'],
    gradient: 'linear-gradient(135deg, #FFD700, #C8A44A)',
  },
]

const MILESTONES = [
  { code: 'first_deal',          title: 'Primeira Operação',               icon: Home,    category: 'deal',        color: '#C8A44A' },
  { code: 'first_million',       title: 'R$1M em VGV',                     icon: DollarSign, category: 'deal',     color: '#10B981' },
  { code: 'ten_deals',           title: '10 Operações',                    icon: Flame,   category: 'deal',        color: '#F59E0B' },
  { code: 'first_international', title: 'Primeira Op. Internacional',      icon: Globe,   category: 'deal',        color: '#6366F1' },
  { code: 'first_referral',      title: 'Primeiro Referral',               icon: HandshakeIcon, category: 'network', color: '#3B82F6' },
  { code: 'five_star_rating',    title: '5 Avaliações 5 Estrelas',         icon: Star,    category: 'performance', color: '#F59E0B' },
  { code: 'cia1_earned',         title: 'CIA-1 Conquistado',               icon: Medal,   category: 'learning',    color: '#C8A44A' },
  { code: 'cia2_earned',         title: 'CIA-2 Conquistado',               icon: Medal,   category: 'learning',    color: '#D9BC82' },
  { code: 'cia3_earned',         title: 'CIA-3 Conquistado',               icon: Medal,   category: 'learning',    color: '#E8D08A' },
  { code: 'carbon_deal',         title: 'Primeiro Deal de Carbono',        icon: Leaf,    category: 'special',     color: '#84CC16' },
  { code: 'token_deal',          title: 'Primeira Tokenização',            icon: Link2,   category: 'special',     color: '#06B6D4' },
  { code: 'first_partnership',   title: 'Primeira Parceria Ativa',         icon: Globe,   category: 'network',     color: '#8B5CF6' },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function LevelBadge({ level, current, isNext }: {
  level: typeof LEVELS[0]
  current: boolean
  isNext: boolean
}) {
  const locked = !current && !isNext && level.order > 1
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        background: current ? T.surface : T.elevated,
        border: `1.5px solid ${current ? level.color + '60' : isNext ? level.color + '30' : T.border}`,
        borderRadius: 16,
        padding: '18px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {current && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: level.gradient,
        }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16,
          background: current ? level.gradient : `${level.color}18`,
          border: `1.5px solid ${level.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24,
          boxShadow: current ? `0 0 24px ${level.color}30` : 'none',
        }}>
          {level.icon}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: 18, color: current ? level.color : T.text }}>
              {level.name}
            </span>
            {current && (
              <span style={{ fontSize: 11, fontWeight: 700, color: level.color, background: `${level.color}18`, padding: '2px 8px', borderRadius: 99 }}>
                NÍVEL ATUAL
              </span>
            )}
            {isNext && !current && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 99 }}>
                PRÓXIMO
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>{level.subtitle}</div>
          {level.commission > 0 && (
            <div style={{ fontSize: 13, fontWeight: 600, color: level.color, marginTop: 4 }}>
              {level.commission}% de comissão
            </div>
          )}
        </div>

        {locked && <Lock size={16} color={T.textDim} />}
      </div>

      {(current || isNext) && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {current ? 'Você já conquistou' : 'Requisitos para avançar'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {level.requirements.map((req, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                {current
                  ? <CheckCircle size={14} color={level.color} style={{ flexShrink: 0, marginTop: 1 }} />
                  : <Circle size={14} color={T.textDim} style={{ flexShrink: 0, marginTop: 1 }} />}
                <span style={{ fontSize: 13, color: current ? T.text : T.textMuted }}>{req}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function MilestoneChip({ milestone, earned }: { milestone: typeof MILESTONES[0]; earned: boolean }) {
  const Icon = milestone.icon
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: earned ? `${milestone.color}12` : T.elevated,
        border: `1px solid ${earned ? milestone.color + '40' : T.border}`,
        borderRadius: 12,
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        opacity: earned ? 1 : 0.5,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: earned ? `${milestone.color}20` : T.surface,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={17} color={earned ? milestone.color : T.textDim} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: earned ? T.text : T.textMuted, marginBottom: 1 }}>
          {milestone.title}
        </div>
        <div style={{ fontSize: 11, color: T.textDim, textTransform: 'capitalize' }}>{milestone.category}</div>
      </div>
      {earned && <CheckCircle size={14} color={milestone.color} style={{ flexShrink: 0, marginLeft: 'auto' }} />}
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CarreiraPage() {
  const [tab, setTab] = useState<'journey' | 'milestones'>('journey')
  const [currentLevel, setCurrentLevel] = useState('trainee')
  const [earnedMilestones, setEarnedMilestones] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const sb = createClientComponentClient()
        const { data: { user } } = await sb.auth.getUser()
        if (!user) { setLoading(false); return }

        const [profileRes, milestonesRes] = await Promise.all([
          sb.from('team_members').select('career_level').eq('user_id', user.id).single(),
          sb.from('advisor_milestones').select('milestone_code').eq('user_id', user.id),
        ])

        if (profileRes.data?.career_level) setCurrentLevel(profileRes.data.career_level)
        if (milestonesRes.data) setEarnedMilestones(milestonesRes.data.map((m: { milestone_code: string }) => m.milestone_code))
      } catch {
        // graceful fallback
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const currentLevelIdx = LEVELS.findIndex(l => l.code === currentLevel)
  const nextLevel = LEVELS[currentLevelIdx + 1]

  const tabs = [
    { id: 'journey',    label: 'Jornada',    icon: TrendingUp },
    { id: 'milestones', label: 'Conquistas', icon: Award },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: T.base, padding: '24px 20px 100px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'rgba(200,164,74,0.12)',
            border: '1px solid rgba(200,164,74,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUp size={22} color={T.accent} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 26, color: T.text, margin: 0 }}>
              Minha Carreira
            </h1>
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Evolução profissional como Advisor IMI</p>
          </div>
        </div>

        {/* Current level banner */}
        {(() => {
          const lvl = LEVELS.find(l => l.code === currentLevel) ?? LEVELS[1]
          return (
            <div style={{
              background: `${lvl.color}10`,
              border: `1px solid ${lvl.color}40`,
              borderRadius: 16, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ fontSize: 32 }}>{lvl.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                  Nível atual
                </div>
                <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, color: lvl.color }}>
                  {lvl.name}
                </div>
                <div style={{ fontSize: 12, color: T.textMuted }}>{lvl.subtitle}</div>
              </div>
              {lvl.commission > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 2 }}>Comissão</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: lvl.color }}>{lvl.commission}%</div>
                </div>
              )}
            </div>
          )
        })()}

        {/* Next level teaser */}
        {nextLevel && (
          <div style={{
            marginTop: 8, background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <ChevronRight size={14} color={T.textMuted} />
            <span style={{ fontSize: 13, color: T.textMuted }}>
              Próximo: <strong style={{ color: nextLevel.color }}>{nextLevel.name}</strong>
              {nextLevel.commission > 0 && ` → ${nextLevel.commission}% comissão`}
            </span>
          </div>
        )}
        {!nextLevel && (
          <div style={{
            marginTop: 8, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)',
            borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Crown size={14} color="#FFD700" />
            <span style={{ fontSize: 13, color: '#FFD700', fontWeight: 600 }}>Você é um Master Partner IMI — Elite!</span>
          </div>
        )}
      </motion.div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: T.surface, borderRadius: 12, padding: 4,
        border: `1px solid ${T.border}`,
      }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '9px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: tab === id ? 600 : 400,
            background: tab === id ? T.elevated : 'transparent',
            color: tab === id ? T.text : T.textMuted,
            transition: 'all 0.2s',
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'journey' && (
          <motion.div key="journey" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {LEVELS.map((level, i) => (
              <motion.div key={level.code} transition={{ delay: i * 0.06 }}>
                <LevelBadge
                  level={level}
                  current={level.code === currentLevel}
                  isNext={nextLevel?.code === level.code}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'milestones' && (
          <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: T.textMuted }}>
                {earnedMilestones.length}/{MILESTONES.length} conquistas desbloqueadas
              </div>
            </div>

            {/* Category groups */}
            {['deal', 'network', 'performance', 'learning', 'special'].map(cat => {
              const items = MILESTONES.filter(m => m.category === cat)
              const catLabels: Record<string, string> = {
                deal: 'Operações', network: 'Rede', performance: 'Performance',
                learning: 'Formação', special: 'Especial',
              }
              return (
                <div key={cat} style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {catLabels[cat]}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map((m, i) => (
                      <motion.div key={m.code} transition={{ delay: i * 0.05 }}>
                        <MilestoneChip milestone={m} earned={earnedMilestones.includes(m.code)} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
