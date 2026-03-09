'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Bot, Zap, Calendar, AlertTriangle, Check,
  MessageSquare, Smile, Briefcase, Loader2,
  ChevronRight, Info, Sliders, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

const T = {
  surface: 'var(--bo-surface)',
  elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  accent: '#3B82F6',
}

interface ScoreWeights {
  timeOnSite: number
  propertiesViewed: number
  formCompletion: number
  whatsappEngagement: number
  budgetMatch: number
}

interface AutoSchedulingRules {
  enableAutoMeetings: boolean
  minScoreThreshold: number
  autoReplyWhatsApp: boolean
}

export default function IASettingsPage() {
  const [saving, setSaving] = useState(false)
  const [tone, setTone] = useState<'formal' | 'casual'>('formal')
  const [weights, setWeights] = useState<ScoreWeights>({
    timeOnSite: 65,
    propertiesViewed: 80,
    formCompletion: 40,
    whatsappEngagement: 55,
    budgetMatch: 70,
  })
  const [rules, setRules] = useState<AutoSchedulingRules>({
    enableAutoMeetings: true,
    minScoreThreshold: 80,
    autoReplyWhatsApp: false,
  })
  const [contentAutomation, setContentAutomation] = useState({
    weeklyNewsletter: true,
    dailyInstaPost: true,
    linkedinReport: false,
  })

  // Load saved AI config on mount
  useEffect(() => {
    async function loadAIConfig() {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) return
        const { settings } = await res.json()
        if (settings?.aiConfig && Object.keys(settings.aiConfig).length > 0) {
          const ai = settings.aiConfig
          if (ai.tone) setTone(ai.tone)
          if (ai.weights) setWeights(ai.weights)
          if (ai.rules) setRules(ai.rules)
          if (ai.contentAutomation) setContentAutomation(ai.contentAutomation)
        }
      } catch { /* keep defaults */ }
    }
    loadAIConfig()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiConfig: { tone, weights, rules, contentAutomation },
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success('Configuração de IA salva com sucesso!')
    } catch {
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const ScoreSlider = ({
    label, value, onChange, icon: Icon, color,
  }: {
    label: string
    value: number
    onChange: (v: number) => void
    icon: React.ElementType
    color: string
  }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} color={color} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: T.text }}>{label}</span>
        </div>
        <span style={{ fontSize: '15px', fontWeight: 800, color }}>{value}%</span>
      </div>
      <div style={{ position: 'relative', height: '8px', borderRadius: '4px', background: T.elevated, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '4px', background: `${color}30` }} />
        <motion.div
          style={{ height: '100%', borderRadius: '4px', background: color, width: `${value}%` }}
          transition={{ duration: 0.3 }}
        />
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={e => onChange(parseInt(e.target.value))}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0,
          }}
        />
      </div>
    </div>
  )

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      style={{
        width: '46px', height: '26px', borderRadius: '13px', border: 'none', cursor: 'pointer',
        position: 'relative', transition: 'background 0.2s',
        background: checked ? '#3B82F6' : T.elevated,
        outline: checked ? 'none' : `1px solid ${T.border}`,
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '3px',
        left: checked ? '23px' : '3px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--bo-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: T.text, lineHeight: 1.2 }}>AI Settings</h1>
              <p style={{ fontSize: '12px', color: T.textMuted, marginTop: '2px' }}>
                Configuração do sistema de inteligência
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── System Status Banner ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '16px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px rgba(74,222,128,0.6)', flexShrink: 0, animation: 'pulse 2s infinite' }} />
          <div>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>
              System Core: Active
            </p>
            <p style={{ fontSize: '12px', color: T.textMuted }}>
              Processando 124 leads em tempo real
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
            <Zap size={13} color="#4ADE80" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#4ADE80' }}>Online</span>
          </div>
        </div>
      </motion.div>

      {/* ── Lead Scoring Logic ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '18px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sliders size={16} color="#3B82F6" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Lead Scoring Logic
              </span>
            </div>
            <button style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', background: T.elevated, border: `1px solid ${T.border}`, cursor: 'pointer' }}>
              <Info size={13} color={T.textMuted} />
            </button>
          </div>

          <ScoreSlider label="Tempo no Site" value={weights.timeOnSite} onChange={v => setWeights(w => ({ ...w, timeOnSite: v }))} icon={Zap} color="#3B82F6" />
          <ScoreSlider label="Imóveis Visualizados" value={weights.propertiesViewed} onChange={v => setWeights(w => ({ ...w, propertiesViewed: v }))} icon={Briefcase} color="#A78BFA" />
          <ScoreSlider label="Formulário Completo" value={weights.formCompletion} onChange={v => setWeights(w => ({ ...w, formCompletion: v }))} icon={Check} color="#4ADE80" />
          <ScoreSlider label="Engajamento WhatsApp" value={weights.whatsappEngagement} onChange={v => setWeights(w => ({ ...w, whatsappEngagement: v }))} icon={MessageSquare} color="#FBBF24" />
          <ScoreSlider label="Match de Budget" value={weights.budgetMatch} onChange={v => setWeights(w => ({ ...w, budgetMatch: v }))} icon={AlertTriangle} color="#F472B6" />

          <div style={{ padding: '12px 14px', borderRadius: '12px', background: T.elevated, display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <Info size={13} color={T.textMuted} />
            <p style={{ fontSize: '11px', color: T.textMuted, lineHeight: 1.4 }}>
              A soma dos pesos define a prioridade de cada sinal. Ajuste conforme o perfil do seu pipeline.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── AI Conversation Tone ─────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '18px', padding: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px' }}>
            AI Conversation Tone
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { id: 'formal', label: 'Formal', icon: Briefcase, desc: 'Linguagem corporativa e institucional' },
              { id: 'casual', label: 'Casual', icon: Smile, desc: 'Tom amigável e descontraído' },
            ].map(opt => {
              const Icon = opt.icon
              const isActive = tone === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => setTone(opt.id as 'formal' | 'casual')}
                  style={{
                    padding: '16px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.2s',
                    background: isActive ? 'rgba(59,130,246,0.12)' : T.elevated,
                    outline: isActive ? '2px solid #3B82F6' : `1px solid ${T.border}`,
                  }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', margin: '0 auto 10px', background: isActive ? 'rgba(59,130,246,0.2)' : T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} color={isActive ? '#3B82F6' : T.textMuted} />
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: isActive ? '#3B82F6' : T.text, marginBottom: '4px' }}>{opt.label}</p>
                  <p style={{ fontSize: '10px', color: T.textMuted }}>{opt.desc}</p>
                  {isActive && (
                    <div style={{ marginTop: '8px', width: '20px', height: '20px', borderRadius: '50%', background: '#3B82F6', margin: '8px auto 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={12} color="#fff" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Auto-Scheduling Rules ────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '18px', padding: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px' }}>
            Auto-Scheduling Rules
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Enable Auto-Meetings */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '12px', background: T.elevated }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={15} color="#3B82F6" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: T.text }}>Enable Auto-Meetings</p>
                  <p style={{ fontSize: '11px', color: T.textMuted }}>Agenda reuniões automaticamente para leads quentes</p>
                </div>
              </div>
              <Toggle checked={rules.enableAutoMeetings} onChange={() => setRules(r => ({ ...r, enableAutoMeetings: !r.enableAutoMeetings }))} />
            </div>

            {/* Min Score Threshold */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '12px', background: T.elevated }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={15} color="#FBBF24" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: T.text }}>Min. Score Threshold</p>
                  <p style={{ fontSize: '11px', color: T.textMuted }}>Score mínimo para acionamento automático</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setRules(r => ({ ...r, minScoreThreshold: Math.max(0, r.minScoreThreshold - 5) }))}
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: '16px', color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                >
                  −
                </button>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#3B82F6', minWidth: '36px', textAlign: 'center' }}>{rules.minScoreThreshold}</span>
                <button
                  onClick={() => setRules(r => ({ ...r, minScoreThreshold: Math.min(100, r.minScoreThreshold + 5) }))}
                  style={{ width: '28px', height: '28px', borderRadius: '8px', background: T.surface, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: '16px', color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Auto-Reply WhatsApp */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', borderRadius: '12px', background: T.elevated }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={15} color="#4ADE80" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: T.text }}>Auto-Reply WhatsApp</p>
                  <p style={{ fontSize: '11px', color: T.textMuted }}>IA responde leads novos em até 2 minutos</p>
                </div>
              </div>
              <Toggle checked={rules.autoReplyWhatsApp} onChange={() => setRules(r => ({ ...r, autoReplyWhatsApp: !r.autoReplyWhatsApp }))} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Content Automation ───────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.21 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: '18px', padding: '20px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: T.text, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '16px' }}>
            Content Automation
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { key: 'weeklyNewsletter', label: 'Newsletter Semanal', desc: 'Resumo do mercado toda segunda 08:00', color: '#3B82F6' },
              { key: 'dailyInstaPost', label: 'Post Diário Instagram', desc: 'Publicação automática 10:00 dias úteis', color: '#F472B6' },
              { key: 'linkedinReport', label: 'Report LinkedIn Mensal', desc: 'Análise trimestral de dados do mercado', color: '#60A5FA' },
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '12px', background: T.elevated }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: T.text }}>{item.label}</p>
                  <p style={{ fontSize: '11px', color: T.textMuted, marginTop: '2px' }}>{item.desc}</p>
                </div>
                <Toggle
                  checked={contentAutomation[item.key as keyof typeof contentAutomation]}
                  onChange={() => setContentAutomation(c => ({ ...c, [item.key]: !c[item.key as keyof typeof contentAutomation] }))}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Save Button ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%', height: '52px', borderRadius: '16px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            background: 'var(--bo-accent)',
            color: '#fff', fontSize: '15px', fontWeight: 800, letterSpacing: '0.02em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 0 24px rgba(59,130,246,0.4)',
            opacity: saving ? 0.8 : 1,
          }}
        >
          {saving
            ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
            : <><Check size={18} /> Salvar Configuração do Sistema</>
          }
        </button>
      </motion.div>

    </div>
  )
}
