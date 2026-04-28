'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, BookOpen, Award, ChevronRight, Lock, CheckCircle,
  Clock, Star, Play, Medal, Zap, Globe, Leaf, Link, Scale, BarChart2,
  Wheat, Bot, Settings, Building2, Trophy, Target, Filter
} from 'lucide-react'
import { T } from '../../lib/theme'
import { createClient } from '@/lib/supabase/client'

// ─── Static Data (used while DB tables are not yet available) ───────────────

const CIA_CERTS = [
  {
    code: 'CIA-1', name: 'CIA-1', fullName: 'Certified IMI Advisor — Nível 1',
    color: '#C8A44A', bgColor: 'rgba(200,164,74,0.10)',
    equiv: 'Equiv. CPA-10', questions: 60, minutes: 90, passing: 70,
    desc: 'Fundamentos do mercado, backoffice IMI, ética, atendimento e IA básica.',
    unlocks: 'Advisor Júnior',
  },
  {
    code: 'CIA-2', name: 'CIA-2', fullName: 'Certified IMI Advisor — Nível 2',
    color: '#D9BC82', bgColor: 'rgba(217,188,130,0.10)',
    equiv: 'Equiv. CPA-20', questions: 80, minutes: 90, passing: 70,
    desc: 'Especializações residencial/corporativo, jurídico, tributação e mercados internacionais.',
    unlocks: 'Advisor Pleno',
  },
  {
    code: 'CIA-3', name: 'CIA-3', fullName: 'Certified IMI Advisor — Nível 3',
    color: '#E8D08A', bgColor: 'rgba(232,208,138,0.10)',
    equiv: 'Equiv. CEA', questions: 100, minutes: 120, passing: 75,
    desc: 'Estruturação patrimonial, fundos/SPE, tokenização básica e crédito de carbono.',
    unlocks: 'Advisor Sênior',
  },
  {
    code: 'CIA-4', name: 'CIA-4', fullName: 'Certified IMI Advisor — Nível 4',
    color: '#F0C060', bgColor: 'rgba(240,192,96,0.10)',
    equiv: 'Equiv. CFP', questions: 100, minutes: 120, passing: 75,
    desc: 'Deals avançados, tributação internacional, M&A rural e tokenização avançada.',
    unlocks: 'Advisor Sênior (Elite)',
  },
  {
    code: 'CIA-M', name: 'CIA-M', fullName: 'Certified IMI Advisor — Master',
    color: '#FFD700', bgColor: 'rgba(255,215,0,0.10)',
    equiv: 'Equiv. CFP+CGA', questions: 80, minutes: 180, passing: 80,
    desc: 'Compliance cripto-imobiliário, cases reais, masterclasses com Master Partners.',
    unlocks: 'Master Partner',
  },
]

const PILLARS = [
  { code: 'foundations',    name: 'Fundamentos IMI',         icon: Building2, color: '#C8A44A', weeks: 6,  courses: 5 },
  { code: 'backoffice',     name: 'Plataforma IMI',          icon: Settings,  color: '#3B82F6', weeks: 2,  courses: 2 },
  { code: 'ai_llm',         name: 'IA & LLMs',               icon: Bot,       color: '#8B5CF6', weeks: 2,  courses: 2 },
  { code: 'specialization', name: 'Especializações',         icon: Target,    color: '#EC4899', weeks: 8,  courses: 4 },
  { code: 'legal',          name: 'Jurídico Profundo',       icon: Scale,     color: '#F59E0B', weeks: 5,  courses: 3 },
  { code: 'tax',            name: 'Tributário Avançado',     icon: BarChart2, color: '#10B981', weeks: 6,  courses: 3 },
  { code: 'agro',           name: 'Agronegócio e Rural',     icon: Wheat,     color: '#84CC16', weeks: 8,  courses: 3 },
  { code: 'tokenization',   name: 'Tokenização & RWA',       icon: Link,      color: '#06B6D4', weeks: 16, courses: 3 },
  { code: 'international',  name: 'Mercados Internacionais', icon: Globe,     color: '#6366F1', weeks: 8,  courses: 4 },
  { code: 'advanced',       name: 'Deals Avançados',         icon: Trophy,    color: '#FFD700', weeks: 4,  courses: 2 },
]

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 56, stroke = 5, color }: { pct: number; size?: number; stroke?: number; color: string }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

function CertCard({ cert, awarded, inProgress }: { cert: typeof CIA_CERTS[0]; awarded: boolean; inProgress: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: T.surface,
        border: `1px solid ${awarded ? cert.color + '50' : T.border}`,
        borderRadius: 16,
        padding: '20px 20px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* glow top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: awarded ? cert.color : inProgress ? cert.color + '80' : 'transparent',
        transition: 'background 0.3s',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        {/* badge */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: cert.bgColor,
          border: `1.5px solid ${cert.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {awarded
            ? <Medal size={24} color={cert.color} />
            : inProgress
            ? <BookOpen size={24} color={cert.color} />
            : <Lock size={22} color={T.textMuted} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: 20, color: cert.color, fontWeight: 400 }}>
              {cert.code}
            </span>
            {awarded && (
              <span style={{ fontSize: 11, fontWeight: 600, color: cert.color, background: cert.bgColor, padding: '2px 8px', borderRadius: 99 }}>
                CONQUISTADO
              </span>
            )}
            {inProgress && !awarded && (
              <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6', background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 99 }}>
                EM ANDAMENTO
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>{cert.equiv}</div>
        </div>
      </div>

      <p style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.55, marginBottom: 14 }}>
        {cert.desc}
      </p>

      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        {[
          { label: 'Questões', value: cert.questions },
          { label: 'Tempo', value: `${cert.minutes}min` },
          { label: 'Aprovação', value: `${cert.passing}%` },
        ].map(({ label, value }) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: T.textDim, marginBottom: 1 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: T.textMuted }}>
          Desbloqueia: <strong style={{ color: T.text }}>{cert.unlocks}</strong>
        </span>
        {awarded ? (
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
            color: cert.color, background: cert.bgColor, border: 'none',
            padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
          }}>
            <Award size={14} /> Ver Certificado
          </button>
        ) : (
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
            color: inProgress ? '#3B82F6' : T.textMuted,
            background: inProgress ? 'rgba(59,130,246,0.12)' : T.elevated,
            border: 'none', padding: '6px 14px', borderRadius: 8, cursor: inProgress ? 'pointer' : 'default',
          }}>
            {inProgress ? <><Play size={13} /> Fazer Prova</> : <><Lock size={13} /> Bloqueado</>}
          </button>
        )}
      </div>
    </motion.div>
  )
}

function PillarCard({ pillar, progress = 0 }: { pillar: typeof PILLARS[0]; progress?: number }) {
  const Icon = pillar.icon
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        padding: '18px 16px',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: progress > 0 ? pillar.color : 'transparent',
        borderRadius: '3px 0 0 3px',
        transition: 'background 0.3s',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: pillar.color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} color={pillar.color} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 1 }}>{pillar.name}</div>
          <div style={{ fontSize: 11, color: T.textMuted }}>{pillar.weeks}w · {pillar.courses} cursos</div>
        </div>
        {progress > 0 && (
          <ProgressRing pct={progress} size={36} stroke={3} color={pillar.color} />
        )}
      </div>

      {progress > 0 && (
        <div style={{ height: 3, background: T.elevated, borderRadius: 99 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: pillar.color, borderRadius: 99, transition: 'width 0.8s ease' }} />
        </div>
      )}
    </motion.div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AcademyPage() {
  const [tab, setTab] = useState<'certifications' | 'courses' | 'progress'>('certifications')
  const [awardedCerts, setAwardedCerts] = useState<string[]>([])
  const [inProgressCerts, setInProgressCerts] = useState<string[]>(['CIA-1'])
  const [pillarsProgress, setPillarsProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const sb = createClient()
        const { data: { user } } = await sb.auth.getUser()
        if (!user) { setLoading(false); return }

        const [{ data: awarded }, { data: enrollments }] = await Promise.all([
          sb.from('academy_certifications_awarded').select('cert_code').eq('user_id', user.id),
          sb.from('academy_enrollments').select('course_id, progress_pct, status, academy_courses(pillar)').eq('user_id', user.id),
        ])

        if (awarded) setAwardedCerts(awarded.map((a: { cert_code: string }) => a.cert_code))

        if (enrollments && enrollments.length > 0) {
          const byPillar: Record<string, number[]> = {}
          enrollments.forEach((e: { progress_pct: number; academy_courses: { pillar: string } | null }) => {
            const pillar = (e.academy_courses as { pillar: string } | null)?.pillar
            if (pillar) {
              if (!byPillar[pillar]) byPillar[pillar] = []
              byPillar[pillar].push(e.progress_pct || 0)
            }
          })
          const avg: Record<string, number> = {}
          Object.entries(byPillar).forEach(([k, v]) => {
            avg[k] = Math.round(v.reduce((a, b) => a + b, 0) / v.length)
          })
          setPillarsProgress(avg)

          // derive in-progress certs from enrollments
          const hasAny = enrollments.some((e: { status: string }) => e.status !== 'not_started')
          if (!hasAny) setInProgressCerts(['CIA-1'])
        }
      } catch {
        // graceful: use static defaults
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tabs = [
    { id: 'certifications', label: 'Certificações CIA', icon: Award },
    { id: 'courses',        label: 'Trilhas de Curso',  icon: BookOpen },
    { id: 'progress',       label: 'Meu Progresso',     icon: Star },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: T.base, padding: '24px 20px 100px' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'rgba(200,164,74,0.12)',
            border: '1px solid rgba(200,164,74,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={22} color={T.accent} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 26, color: T.text, margin: 0 }}>
              IMI Academy
            </h1>
            <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Sua jornada de formação como Advisor IMI</p>
          </div>
        </div>

        {/* quick stats */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          {[
            { label: 'Certificações',    value: `${awardedCerts.length}/5`, color: T.accent },
            { label: 'Horas estimadas',  value: '520h',                     color: '#3B82F6' },
            { label: 'Módulos',          value: '31',                       color: '#8B5CF6' },
            { label: 'Trilhas',          value: '10',                       color: '#10B981' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              flex: '1 1 calc(25% - 10px)', minWidth: 80,
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '12px 14px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 20, fontWeight: 700, color, marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 24,
        background: T.surface, borderRadius: 12, padding: 4,
        border: `1px solid ${T.border}`,
      }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '9px 10px', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === id ? 600 : 400,
              background: tab === id ? T.elevated : 'transparent',
              color: tab === id ? T.text : T.textMuted,
              transition: 'all 0.2s',
            }}
          >
            <Icon size={15} /> <span style={{ display: 'none', '@media(min-width:400px)': { display: 'inline' } } as React.CSSProperties}>{label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'certifications' && (
          <motion.div key="certs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ marginBottom: 4 }}>
              <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 18, color: T.text, margin: '0 0 4px' }}>
                Certificações CIA
              </h2>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                O IMI Certification Pathway — equivalente ao sistema ANBIMA do mercado financeiro
              </p>
            </div>

            {CIA_CERTS.map((cert, i) => (
              <motion.div key={cert.code} transition={{ delay: i * 0.06 }}>
                <CertCard
                  cert={cert}
                  awarded={awardedCerts.includes(cert.code)}
                  inProgress={inProgressCerts.includes(cert.code)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {tab === 'courses' && (
          <motion.div key="courses" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 18, color: T.text, margin: '0 0 4px' }}>
                Trilhas de Formação
              </h2>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                10 pilares · 31 módulos · ~520h de conteúdo especializado
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {PILLARS.map((pillar, i) => (
                <motion.div key={pillar.code} transition={{ delay: i * 0.04 }}>
                  <PillarCard pillar={pillar} progress={pillarsProgress[pillar.code] ?? 0} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {tab === 'progress' && (
          <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ fontFamily: 'Instrument Serif, serif', fontSize: 18, color: T.text, margin: '0 0 4px' }}>
                Meu Progresso
              </h2>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                Acompanhe sua evolução no caminho para CIA-M
              </p>
            </div>

            {/* CIA Progress Timeline */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 20 }}>
                Caminho de Certificação
              </h3>
              <div style={{ position: 'relative', paddingLeft: 28 }}>
                {/* vertical line */}
                <div style={{
                  position: 'absolute', left: 10, top: 10, bottom: 10, width: 2,
                  background: `linear-gradient(to bottom, ${T.accent}, transparent)`,
                  borderRadius: 1,
                }} />

                {CIA_CERTS.map((cert, i) => {
                  const awarded = awardedCerts.includes(cert.code)
                  const active = inProgressCerts.includes(cert.code) && !awarded
                  return (
                    <div key={cert.code} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: i < CIA_CERTS.length - 1 ? 20 : 0 }}>
                      {/* dot */}
                      <div style={{
                        position: 'absolute', left: 4, width: 14, height: 14, borderRadius: '50%',
                        background: awarded ? cert.color : active ? cert.color + '60' : T.elevated,
                        border: `2px solid ${awarded ? cert.color : active ? cert.color : T.border}`,
                        marginTop: 2,
                        transition: 'all 0.3s',
                      }} />
                      <div style={{ marginLeft: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: awarded ? cert.color : active ? cert.color : T.textMuted }}>
                            {cert.code}
                          </span>
                          {awarded && <CheckCircle size={14} color={cert.color} />}
                          {active && <Clock size={14} color="#3B82F6" />}
                        </div>
                        <div style={{ fontSize: 12, color: T.textMuted }}>{cert.equiv} · Desbloqueia {cert.unlocks}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pillars progress */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 }}>
                Progresso por Trilha
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {PILLARS.map(pillar => {
                  const pct = pillarsProgress[pillar.code] ?? 0
                  const Icon = pillar.icon
                  return (
                    <div key={pillar.code}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Icon size={14} color={pillar.color} />
                          <span style={{ fontSize: 13, color: T.text }}>{pillar.name}</span>
                        </div>
                        <span style={{ fontSize: 12, color: pct > 0 ? pillar.color : T.textDim, fontWeight: 600 }}>
                          {pct > 0 ? `${pct}%` : '—'}
                        </span>
                      </div>
                      <div style={{ height: 4, background: T.elevated, borderRadius: 99 }}>
                        <div style={{
                          height: '100%', width: `${pct}%`,
                          background: `linear-gradient(to right, ${pillar.color}, ${pillar.color}aa)`,
                          borderRadius: 99, transition: 'width 0.8s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
