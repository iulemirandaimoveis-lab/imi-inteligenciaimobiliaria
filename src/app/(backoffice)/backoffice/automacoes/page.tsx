'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Plus, ToggleLeft, ToggleRight,
  Bell, Mail, Kanban, ClipboardList, AlertTriangle,
  CheckCircle2, XCircle, Clock, Edit2, Trash2, ChevronRight,
  User, TrendingUp, FileText, MessageSquare, Activity,
  X, ArrowRight, Settings2, Send, UserCheck, Tag,
} from 'lucide-react'
import { PageIntelHeader, KPICard, Btn } from '../../components/ui'
import { T } from '../../lib/theme'

export const dynamic = 'force-dynamic'

/* ─── TYPES ─────────────────────────────────────────────────────── */
interface AutomationRule {
  id: string
  name: string
  triggerLabel: string
  actionLabel: string
  status: 'active' | 'paused'
  firedToday: number
  firedTotal: number
  conversionRate: number
  category: string
  triggerIcon: any
  actionIcon: any
  lastFired: string
}

/* ─── MOCK DATA ──────────────────────────────────────────────────── */
const MOCK_RULES: AutomationRule[] = [
  {
    id: '1',
    name: 'Follow-up Automático',
    triggerLabel: 'Sem Contato há 3 dias',
    actionLabel: 'Notificar Corretor',
    status: 'active',
    firedToday: 4,
    firedTotal: 47,
    conversionRate: 38,
    category: 'Leads',
    triggerIcon: Clock,
    actionIcon: Bell,
    lastFired: 'há 2h',
  },
  {
    id: '2',
    name: 'Lead Quente Prioritário',
    triggerLabel: 'Lead Quente (score > 80)',
    actionLabel: 'Criar Tarefa + WhatsApp',
    status: 'active',
    firedToday: 2,
    firedTotal: 23,
    conversionRate: 61,
    category: 'Leads',
    triggerIcon: TrendingUp,
    actionIcon: MessageSquare,
    lastFired: 'há 5h',
  },
  {
    id: '3',
    name: 'Avaliação Vencendo',
    triggerLabel: 'Avaliação Concluída',
    actionLabel: 'Enviar Email',
    status: 'active',
    firedToday: 1,
    firedTotal: 12,
    conversionRate: 42,
    category: 'Avaliações',
    triggerIcon: AlertTriangle,
    actionIcon: Mail,
    lastFired: 'ontem',
  },
  {
    id: '4',
    name: 'Novo Lead WhatsApp',
    triggerLabel: 'Novo Lead',
    actionLabel: 'Enviar WhatsApp Template',
    status: 'active',
    firedToday: 5,
    firedTotal: 89,
    conversionRate: 29,
    category: 'Distribuição',
    triggerIcon: User,
    actionIcon: MessageSquare,
    lastFired: 'há 30 min',
  },
  {
    id: '5',
    name: 'Campanha Inativa',
    triggerLabel: 'Sem Contato há 7 dias',
    actionLabel: 'Notificar Equipe',
    status: 'paused',
    firedToday: 0,
    firedTotal: 5,
    conversionRate: 12,
    category: 'Campanhas',
    triggerIcon: Activity,
    actionIcon: Bell,
    lastFired: 'há 3 dias',
  },
  {
    id: '6',
    name: 'Proposta Visualizada',
    triggerLabel: 'Proposta Aceita',
    actionLabel: 'Criar Tarefa',
    status: 'paused',
    firedToday: 0,
    firedTotal: 0,
    conversionRate: 0,
    category: 'Propostas',
    triggerIcon: FileText,
    actionIcon: ClipboardList,
    lastFired: 'nunca',
  },
]

/* ─── TRIGGER OPTIONS ────────────────────────────────────────────── */
const TRIGGER_OPTIONS = [
  { id: 'novo_lead', label: 'Novo Lead', icon: User, desc: 'Quando um lead é criado no sistema' },
  { id: 'lead_atualizado', label: 'Lead Atualizado', icon: TrendingUp, desc: 'Quando os dados de um lead mudam' },
  { id: 'sem_contato', label: 'Sem Contato', icon: Clock, desc: 'Lead sem resposta por X dias' },
  { id: 'avaliacao_concluida', label: 'Avaliação Concluída', icon: CheckCircle2, desc: 'Após finalizar uma avaliação' },
  { id: 'proposta_aceita', label: 'Proposta Aceita', icon: FileText, desc: 'Quando cliente aceita uma proposta' },
  { id: 'lead_quente', label: 'Lead Quente', icon: AlertTriangle, desc: 'Score de lead ultrapassa 80 pontos' },
]

/* ─── ACTION OPTIONS ─────────────────────────────────────────────── */
const ACTION_OPTIONS = [
  { id: 'whatsapp', label: 'Enviar WhatsApp Template', icon: MessageSquare, desc: 'Mensagem automática via WhatsApp' },
  { id: 'email', label: 'Enviar Email', icon: Mail, desc: 'Email automático para o lead ou corretor' },
  { id: 'criar_tarefa', label: 'Criar Tarefa', icon: ClipboardList, desc: 'Adiciona tarefa ao corretor responsável' },
  { id: 'notificar_equipe', label: 'Notificar Equipe', icon: Bell, desc: 'Push/alerta para a equipe' },
  { id: 'mover_kanban', label: 'Mover no Kanban', icon: Kanban, desc: 'Atualiza coluna do lead no Kanban' },
  { id: 'atribuir_corretor', label: 'Atribuir Corretor', icon: UserCheck, desc: 'Distribui lead para corretor disponível' },
  { id: 'adicionar_tag', label: 'Adicionar Tag', icon: Tag, desc: 'Etiqueta o lead automaticamente' },
]

/* ─── RULE CARD ──────────────────────────────────────────────────── */
function RuleCard({
  rule,
  index,
  onToggle,
  onDelete,
}: {
  rule: AutomationRule
  index: number
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const TrigIcon = rule.triggerIcon
  const ActIcon = rule.actionIcon
  const isActive = rule.status === 'active'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: T.surface,
        border: `1px solid ${isActive ? 'color-mix(in srgb, var(--imi-gold-500) 22%, var(--border-default))' : T.border}`,
        borderRadius: T.radius.xl,
        padding: '16px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: isActive ? 'linear-gradient(90deg, var(--imi-gold-500), transparent)' : 'transparent',
        transition: 'opacity 0.3s',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Trigger icon */}
        <div style={{
          width: 40, height: 40, borderRadius: T.radius.lg, flexShrink: 0,
          background: isActive ? 'color-mix(in srgb, var(--imi-gold-500) 10%, transparent)' : T.elevated,
          border: `1px solid ${isActive ? 'color-mix(in srgb, var(--imi-gold-500) 20%, transparent)' : T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <TrigIcon size={17} style={{ color: isActive ? 'var(--imi-gold-500)' : T.textDim }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name row + toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font.sans }}>
                {rule.name}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: T.radius.full,
                background: T.elevated, color: T.textDim, letterSpacing: '0.04em',
              }}>
                {rule.category}
              </span>
              {/* Status badge */}
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: T.radius.full,
                background: isActive ? 'var(--success-bg)' : T.elevated,
                color: isActive ? 'var(--success)' : T.textDim,
                border: `1px solid ${isActive ? 'color-mix(in srgb, var(--success) 20%, transparent)' : T.border}`,
              }}>
                {isActive ? 'Ativa' : 'Pausada'}
              </span>
            </div>

            {/* Toggle switch */}
            <button
              onClick={() => onToggle(rule.id)}
              title={isActive ? 'Pausar automação' : 'Ativar automação'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
            >
              {isActive
                ? <ToggleRight size={28} style={{ color: 'var(--imi-gold-500)' }} />
                : <ToggleLeft size={28} style={{ color: T.textDim }} />
              }
            </button>
          </div>

          {/* Trigger → Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, padding: '4px 10px', borderRadius: T.radius.full, fontWeight: 500,
              background: 'color-mix(in srgb, var(--info) 10%, transparent)',
              color: 'var(--info)',
              border: '1px solid color-mix(in srgb, var(--info) 20%, transparent)',
            }}>
              <TrigIcon size={10} />
              {rule.triggerLabel}
            </div>
            <ArrowRight size={12} style={{ color: T.textDim, flexShrink: 0 }} />
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, padding: '4px 10px', borderRadius: T.radius.full, fontWeight: 500,
              background: isActive
                ? 'color-mix(in srgb, var(--imi-gold-500) 10%, transparent)'
                : T.elevated,
              color: isActive ? 'var(--imi-gold-500)' : T.textDim,
              border: `1px solid ${isActive ? 'color-mix(in srgb, var(--imi-gold-500) 20%, transparent)' : T.border}`,
            }}>
              <ActIcon size={10} />
              {rule.actionLabel}
            </div>
          </div>

          {/* Footer stats + actions */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 10, borderTop: `1px solid ${T.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 11, color: T.textDim, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Zap size={11} style={{ color: 'var(--imi-gold-500)' }} />
                {rule.firedToday} disparos hoje
              </span>
              <span style={{ fontSize: 11, color: T.textDim }}>
                {rule.firedTotal} total
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: rule.conversionRate > 40 ? 'var(--success)' : rule.conversionRate > 20 ? 'var(--warning)' : T.textDim,
              }}>
                {rule.conversionRate}% convertidos
              </span>
              <span style={{ fontSize: 11, color: T.textDim, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Clock size={10} /> {rule.lastFired}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 4 }}>
              <button
                style={{
                  background: T.elevated, border: `1px solid ${T.border}`,
                  borderRadius: T.radius.sm, width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: T.textMuted,
                }}
                title="Editar regra"
              >
                <Edit2 size={12} />
              </button>
              <button
                style={{
                  background: 'var(--error-bg)', border: '1px solid transparent',
                  borderRadius: T.radius.sm, width: 28, height: 28,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'var(--error)',
                }}
                title="Excluir regra"
                onClick={() => onDelete(rule.id)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── NOVA AUTOMAÇÃO MODAL ───────────────────────────────────────── */
function NovaAutomacaoModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [delay, setDelay] = useState('immediately')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const canNext1 = !!selectedTrigger
  const canNext2 = !!selectedAction
  const canSave = !!name.trim()

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 700))
    setSaving(false)
    onSave()
  }

  const inputS: React.CSSProperties = {
    width: '100%', height: 40, padding: '0 14px',
    background: T.elevated, border: `1.5px solid ${T.border}`,
    borderRadius: T.radius.md, color: T.text,
    fontFamily: T.font.sans, fontSize: 14, outline: 'none',
    boxSizing: 'border-box',
  }

  const selectS: React.CSSProperties = {
    ...inputS, cursor: 'pointer',
  }

  const stepLabels = ['Gatilho', 'Ação', 'Configurar']

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
      }} />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 640,
          background: T.surface,
          border: `1px solid ${T.border}`,
          borderRadius: T.radius.xl,
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text, fontFamily: T.font.sans, margin: 0 }}>
              Nova Automação
            </h2>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '2px 0 0' }}>
              Configure um fluxo automático de ações
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: T.elevated, border: `1px solid ${T.border}`,
              borderRadius: T.radius.md, width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T.textDim, flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Step indicator */}
        <div style={{
          padding: '16px 24px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 0,
          flexShrink: 0,
        }}>
          {stepLabels.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3
            const done = step > n
            const active = step === n
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : undefined }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    background: active ? 'var(--imi-gold-500)' : done ? 'var(--success-bg)' : T.elevated,
                    color: active ? '#fff' : done ? 'var(--success)' : T.textDim,
                    border: active ? '2px solid var(--imi-gold-500)' : done ? '2px solid color-mix(in srgb, var(--success) 30%, transparent)' : `2px solid ${T.border}`,
                  }}>
                    {done ? <CheckCircle2 size={14} /> : n}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? T.text : T.textDim, fontFamily: T.font.sans }}>
                    {label}
                  </span>
                </div>
                {i < 2 && (
                  <div style={{
                    flex: 1, height: 1, margin: '0 10px',
                    background: done ? 'var(--success)' : T.border,
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.18 }}
            >
              {/* STEP 1: Trigger grid */}
              {step === 1 && (
                <div>
                  <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
                    Quando deve esta automação ser disparada?
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {TRIGGER_OPTIONS.map(opt => {
                      const Icon = opt.icon
                      const sel = selectedTrigger === opt.id
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedTrigger(opt.id)}
                          style={{
                            background: sel ? 'color-mix(in srgb, var(--imi-gold-500) 10%, transparent)' : T.elevated,
                            border: `1.5px solid ${sel ? 'var(--imi-gold-500)' : T.border}`,
                            borderRadius: T.radius.lg,
                            padding: '14px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <Icon size={16} style={{ color: sel ? 'var(--imi-gold-500)' : T.textMuted, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: sel ? 'var(--imi-gold-500)' : T.text, fontFamily: T.font.sans }}>
                              {opt.label}
                            </span>
                          </div>
                          <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.4, paddingLeft: 26 }}>
                            {opt.desc}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: Action grid */}
              {step === 2 && (
                <div>
                  <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
                    O que deve acontecer quando o gatilho for acionado?
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                    {ACTION_OPTIONS.map(opt => {
                      const Icon = opt.icon
                      const sel = selectedAction === opt.id
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedAction(opt.id)}
                          style={{
                            background: sel ? 'color-mix(in srgb, var(--imi-gold-500) 10%, transparent)' : T.elevated,
                            border: `1.5px solid ${sel ? 'var(--imi-gold-500)' : T.border}`,
                            borderRadius: T.radius.lg,
                            padding: '14px',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <Icon size={16} style={{ color: sel ? 'var(--imi-gold-500)' : T.textMuted, flexShrink: 0 }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: sel ? 'var(--imi-gold-500)' : T.text, fontFamily: T.font.sans }}>
                              {opt.label}
                            </span>
                          </div>
                          <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.4, paddingLeft: 26 }}>
                            {opt.desc}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Configure */}
              {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                    Configure os detalhes da automação.
                  </p>

                  {/* Summary */}
                  {selectedTrigger && selectedAction && (() => {
                    const trig = TRIGGER_OPTIONS.find(o => o.id === selectedTrigger)
                    const act = ACTION_OPTIONS.find(o => o.id === selectedAction)
                    const TrigI = trig?.icon ?? Zap
                    const ActI = act?.icon ?? Send
                    return (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '12px 14px', borderRadius: T.radius.lg,
                        background: T.elevated, border: `1px solid ${T.border}`,
                        flexWrap: 'wrap',
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--info)', fontWeight: 500 }}>
                          <TrigI size={12} /> {trig?.label}
                        </span>
                        <ArrowRight size={12} style={{ color: T.textDim }} />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--imi-gold-500)', fontWeight: 500 }}>
                          <ActI size={12} /> {act?.label}
                        </span>
                      </div>
                    )
                  })()}

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Nome da Automação *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ex: Follow-up para leads inativos"
                      style={inputS}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Atraso na Execução
                    </label>
                    <select value={delay} onChange={e => setDelay(e.target.value)} style={selectS}>
                      <option value="immediately">Imediatamente</option>
                      <option value="15min">Após 15 minutos</option>
                      <option value="1h">Após 1 hora</option>
                      <option value="3h">Após 3 horas</option>
                      <option value="1d">Após 1 dia útil</option>
                      <option value="3d">Após 3 dias úteis</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                      Observações (opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Descreva o objetivo desta automação..."
                      style={{
                        ...inputS, height: 'auto', padding: '10px 14px',
                        resize: 'vertical', lineHeight: 1.5,
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Modal footer */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <Btn variant="outline" onClick={onClose}>
            Cancelar
          </Btn>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 1 && (
              <Btn variant="outline" onClick={() => setStep((step - 1) as 1 | 2 | 3)}>
                Voltar
              </Btn>
            )}
            {step < 3 ? (
              <Btn
                variant="primary"
                disabled={step === 1 ? !canNext1 : !canNext2}
                onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                icon={<ChevronRight size={14} />}
              >
                Próximo
              </Btn>
            ) : (
              <Btn
                variant="primary"
                disabled={!canSave}
                loading={saving}
                onClick={handleSave}
                icon={<Zap size={14} />}
              >
                Salvar Automação
              </Btn>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function AutomacoesPage() {
  const [rules, setRules] = useState<AutomationRule[]>(MOCK_RULES)
  const [modalOpen, setModalOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  const activeCount = rules.filter(r => r.status === 'active').length
  const todayFired = rules.reduce((acc, r) => acc + r.firedToday, 0)
  const avgConversion = rules.length > 0
    ? Math.round(rules.reduce((acc, r) => acc + r.conversionRate, 0) / rules.length)
    : 0

  const handleToggle = (id: string) => {
    setRules(prev => prev.map(r =>
      r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r
    ))
  }

  const handleDelete = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id))
  }

  const handleSaveNew = () => {
    setModalOpen(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <PageIntelHeader
        moduleLabel="CRM · AUTOMAÇÕES"
        title="Automações"
        subtitle="Fluxos inteligentes de nutrição, follow-up e distribuição de leads"
        live
        breadcrumbs={[{ label: 'Automações' }]}
        actions={
          <Btn
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => setModalOpen(true)}
          >
            Nova Automação
          </Btn>
        }
      />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <KPICard
          label="Total Ativos"
          value={activeCount}
          sublabel={`de ${rules.length} regras`}
          accent="gold"
          icon={<Zap size={18} />}
        />
        <KPICard
          label="Disparos Hoje"
          value={todayFired}
          sublabel="execuções nas últimas 24h"
          accent="success"
          icon={<Activity size={18} />}
        />
        <KPICard
          label="Taxa de Conversão"
          value={`${avgConversion}%`}
          sublabel="média de todas as regras"
          accent="info"
          icon={<TrendingUp size={18} />}
        />
        <KPICard
          label="Pausadas"
          value={rules.length - activeCount}
          sublabel="aguardando reativação"
          accent="warning"
          icon={<Settings2 size={18} />}
        />
      </div>

      {/* Toast-style saved feedback */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: T.radius.lg,
              background: 'var(--success-bg)',
              border: '1px solid color-mix(in srgb, var(--success) 20%, transparent)',
              color: 'var(--success)', fontSize: 13, fontWeight: 600,
              fontFamily: T.font.sans,
            }}
          >
            <CheckCircle2 size={15} /> Automação criada com sucesso!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rules list */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font.sans, margin: 0 }}>
            Regras de Automação
          </h2>
          <span style={{ fontSize: 12, color: T.textDim }}>
            {activeCount} ativas · {rules.length - activeCount} pausadas
          </span>
        </div>

        {rules.length === 0 ? (
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: T.radius.xl, padding: '48px 24px', textAlign: 'center',
          }}>
            <Zap size={32} style={{ color: T.textDim, margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 16px' }}>
              Nenhuma automação criada ainda
            </p>
            <Btn variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
              Criar primeira automação
            </Btn>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rules.map((rule, i) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                index={i}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Execution history strip */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.radius.xl, overflow: 'hidden',
      }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: T.text, fontFamily: T.font.sans, margin: 0 }}>
              Histórico de Execuções
            </h3>
            <p style={{ fontSize: 11, color: T.textMuted, margin: '2px 0 0' }}>Últimas execuções registradas</p>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Horário', 'Regra', 'Entidade', 'Resultado'].map(h => (
                  <th key={h} style={{
                    padding: '10px 16px', textAlign: 'left',
                    fontSize: 10, fontWeight: 700, color: T.textDim,
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { time: '14:32', rule: 'Follow-up Automático', entity: 'Lead #1043', ok: true },
                { time: '13:17', rule: 'Novo Lead WhatsApp', entity: 'Lead #1044', ok: true },
                { time: '11:45', rule: 'Lead Quente Prioritário', entity: 'Lead #1040', ok: true },
                { time: '09:22', rule: 'Avaliação Vencendo', entity: 'Aval. #203', ok: true },
                { time: '08:50', rule: 'Follow-up Automático', entity: 'Lead #1038', ok: false },
              ].map((entry, i, arr) => (
                <tr key={i} style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: T.textDim, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {entry.time}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>
                    {entry.rule}
                  </td>
                  <td style={{ padding: '11px 16px', fontSize: 12, color: T.textDim, whiteSpace: 'nowrap' }}>
                    {entry.entity}
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: T.radius.full,
                      background: entry.ok ? 'var(--success-bg)' : 'var(--error-bg)',
                      color: entry.ok ? 'var(--success)' : 'var(--error)',
                    }}>
                      {entry.ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {entry.ok ? 'Sucesso' : 'Erro'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <NovaAutomacaoModal
            onClose={() => setModalOpen(false)}
            onSave={handleSaveNew}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
