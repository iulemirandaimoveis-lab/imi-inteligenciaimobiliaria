'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Users, Settings, Brain, Zap, Crown, Shield, User,
  Plus, Trash2, Save, Check, AlertCircle, TrendingUp, Activity,
  Palette, Globe, Hash, Sparkles, ChevronRight, Copy, RefreshCw,
  X
} from 'lucide-react'
import { T } from '../../lib/theme'
import { PageIntelHeader } from '../../components/ui/PageIntelHeader'
import { KPICard } from '../../components/ui/KPICard'
import { SectionHeader } from '../../components/ui/SectionHeader'

const NICHES = [
  { value: 'imoveis_premium', label: 'Imóveis Premium' },
  { value: 'imoveis_comerciais', label: 'Imóveis Comerciais' },
  { value: 'imoveis_lancamentos', label: 'Lançamentos Imobiliários' },
  { value: 'avaliacao_pericial', label: 'Avaliação Pericial' },
  { value: 'consultoria_imobiliaria', label: 'Consultoria Imobiliária' },
  { value: 'gestao_patrimonial', label: 'Gestão Patrimonial' },
  { value: 'fintech_imobiliaria', label: 'Fintech Imobiliária' },
]

const AI_MODELS = [
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recomendado)' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Rápido)' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Máxima Qualidade)' },
]

const TONE_OPTIONS = [
  { value: 'professional', label: 'Profissional' },
  { value: 'consultivo', label: 'Consultivo' },
  { value: 'premium', label: 'Premium & Exclusivo' },
  { value: 'tecnico', label: 'Técnico & Preciso' },
  { value: 'proximidade', label: 'Próximo & Acessível' },
]

const ROLE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  owner:  { label: 'Proprietário', icon: Crown,  color: '#F59E0B' },
  admin:  { label: 'Administrador', icon: Shield, color: '#3B82F6' },
  member: { label: 'Membro',        icon: User,   color: '#10B981' },
  viewer: { label: 'Visualizador',  icon: User,   color: '#6B7280' },
}

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  starter:      { label: 'Starter',       color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
  professional: { label: 'Professional',  color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  enterprise:   { label: 'Enterprise',    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
}

function OrgSkeleton() {
  const bar = (w: string, h = 14, r = 8) => (
    <div style={{ width: w, height: h, background: 'var(--bo-elevated)', borderRadius: r, opacity: 0.6 }} className="animate-pulse" />
  )
  return (
    <div className="space-y-5">
      <div style={{ height: 120, background: 'var(--bo-card)', borderRadius: 18, opacity: 0.5 }} className="animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} style={{ height: 90, background: 'var(--bo-card)', borderRadius: 14, opacity: 0.4 }} className="animate-pulse" />
        ))}
      </div>
      <div style={{ height: 280, background: 'var(--bo-card)', borderRadius: 18, opacity: 0.4 }} className="animate-pulse" />
    </div>
  )
}

function CreateOrgForm({ onCreate }: { onCreate: (data: any) => Promise<void> }) {
  const [form, setForm] = useState({ name: '', niche: 'imoveis_premium', slug: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleNameChange = (name: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setForm(f => ({ ...f, name, slug }))
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError('')
    try {
      await onCreate(form)
    } catch (e: any) {
      setError(e.message || 'Erro ao criar organização')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] py-12"
    >
      <div
        className="w-full max-w-lg rounded-2xl p-8"
        style={{ background: 'var(--bo-card)', border: `1px solid ${T.border}` }}
      >
        {/* Icon */}
        <div className="flex items-center justify-center mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, var(--imi-blue) 0%, var(--imi-blue-bright) 100%)' }}
          >
            <Building2 size={28} className="text-white" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center mb-2" style={{ color: T.text }}>Criar Organização</h2>
        <p className="text-sm text-center mb-8" style={{ color: T.textMuted }}>
          Configure sua organização para gerenciar equipes, IA e brand identity
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.textMuted }}>
              Nome da Organização
            </label>
            <input
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Ex: IMI Inteligência Imobiliária"
              className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none focus:ring-2"
              style={{
                background: T.elevated, border: `1px solid ${T.border}`, color: T.text,
                '--tw-ring-color': 'var(--imi-blue)',
              } as React.CSSProperties}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.textMuted }}>
              Nicho de Mercado
            </label>
            <select
              value={form.niche}
              onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
              className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none"
              style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
            >
              {NICHES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.textMuted }}>
              Slug (URL)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono shrink-0" style={{ color: T.textDim }}>imi.com.br/</span>
              <input
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="minha-imobiliaria"
                className="flex-1 h-11 px-4 rounded-xl text-sm font-mono focus:outline-none"
                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!form.name || !form.slug || saving}
            className="w-full h-11 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, var(--imi-blue) 0%, var(--imi-blue-bright) 100%)' }}
          >
            {saving ? 'Criando...' : 'Criar Organização'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function OrganizacaoPage() {
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<any>(null)
  const [role, setRole] = useState<string>('member')
  const [members, setMembers] = useState<any[]>([])
  const [aiUsage, setAiUsage] = useState({ totalTokens: 0, totalCost: '0.0000', requests: 0 })

  // Settings state
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    tone_of_voice: 'professional',
    ai_model: 'claude-3-5-sonnet-20241022',
    ai_temperature: 0.7,
    ai_max_tokens: 2000,
  })

  // Members
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [orgRes, membersRes] = await Promise.all([
        fetch('/api/organizacao'),
        fetch('/api/organizacao/members'),
      ])

      const orgData = await orgRes.json()
      const membersData = await membersRes.json()

      if (orgData.tenant) {
        setTenant(orgData.tenant)
        setRole(orgData.role)
        setAiUsage(orgData.aiUsage || { totalTokens: 0, totalCost: '0.0000', requests: 0 })
        setSettingsForm({
          name: orgData.tenant.name || '',
          tone_of_voice: orgData.tenant.tone_of_voice || 'professional',
          ai_model: orgData.tenant.ai_model || 'claude-3-5-sonnet-20241022',
          ai_temperature: orgData.tenant.ai_temperature ?? 0.7,
          ai_max_tokens: orgData.tenant.ai_max_tokens ?? 2000,
        })
      }

      setMembers(membersData.members || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreateOrg = async (data: any) => {
    const res = await fetch('/api/organizacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Erro ao criar organização')
    setTenant(json.tenant)
    setRole('owner')
    await loadData()
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/organizacao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setTenant(json.tenant)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleInvite = async () => {
    setInviting(true)
    setInviteError('')
    setInviteSuccess(false)
    try {
      const res = await fetch('/api/organizacao/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setInviteSuccess(true)
      setInviteEmail('')
      await loadData()
      setTimeout(() => { setInviteSuccess(false); setShowInviteModal(false) }, 1500)
    } catch (e: any) {
      setInviteError(e.message || 'Erro ao convidar')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remover este membro da organização?')) return
    await fetch(`/api/organizacao/members?member_id=${memberId}`, { method: 'DELETE' })
    await loadData()
  }

  if (loading) return <OrgSkeleton />

  if (!tenant) {
    return <CreateOrgForm onCreate={handleCreateOrg} />
  }

  const plan = PLAN_CONFIG[tenant.subscription_tier] || PLAN_CONFIG.starter
  const isOwnerOrAdmin = ['owner', 'admin'].includes(role)

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="ORGANIZAÇÃO"
        title={tenant.name}
        subtitle={`${tenant.slug} · Plano ${plan.label}`}
        actions={
          isOwnerOrAdmin ? (
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bo-btn bo-btn-primary"
              style={{ background: 'linear-gradient(135deg, var(--imi-blue) 0%, var(--imi-blue-bright) 100%)', opacity: saving ? 0.7 : 1 }}
            >
              {saved ? <Check size={15} /> : saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span className="hidden sm:inline">{saved ? 'Salvo!' : 'Salvar'}</span>
            </button>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Membros" value={members.length} accent="blue" size="sm" icon={<Users size={11} />} />
        <KPICard label="Requisições IA (30d)" value={aiUsage.requests} accent="ai" size="sm" icon={<Brain size={11} />} />
        <KPICard label="Tokens Usados" value={Number(aiUsage.totalTokens).toLocaleString('pt-BR')} accent="warm" size="sm" icon={<Zap size={11} />} />
        <KPICard label="Custo IA (30d)" value={`$${aiUsage.totalCost}`} accent="green" size="sm" icon={<TrendingUp size={11} />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* LEFT: Settings */}
        <div className="xl:col-span-3 space-y-4">

          {/* Identidade */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bo-card)', border: `1px solid ${T.border}` }}>
            <SectionHeader title="Identidade & Marca" />

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.textMuted }}>
                  Nome da Organização
                </label>
                <input
                  value={settingsForm.name}
                  onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))}
                  disabled={!isOwnerOrAdmin}
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 disabled:opacity-50"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text, '--tw-ring-color': 'var(--imi-blue)' } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.textMuted }}>
                  Tom de Voz da IA
                </label>
                <select
                  value={settingsForm.tone_of_voice}
                  onChange={e => setSettingsForm(f => ({ ...f, tone_of_voice: e.target.value }))}
                  disabled={!isOwnerOrAdmin}
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none disabled:opacity-50"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                >
                  {TONE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2 pb-1">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: plan.bg, border: `1px solid ${plan.color}30` }}>
                  <Crown size={13} style={{ color: plan.color }} />
                  <span className="text-xs font-bold" style={{ color: plan.color }}>Plano {plan.label}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--bo-elevated)', border: `1px solid ${T.border}` }}>
                  <Hash size={12} style={{ color: T.textMuted }} />
                  <span className="text-xs font-mono" style={{ color: T.textMuted }}>{tenant.slug}</span>
                </div>
              </div>
            </div>
          </div>

          {/* IA Config */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--bo-card)', border: `1px solid ${T.border}` }}>
            <SectionHeader title="Configurações da IA" />

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.textMuted }}>
                  Modelo de IA
                </label>
                <select
                  value={settingsForm.ai_model}
                  onChange={e => setSettingsForm(f => ({ ...f, ai_model: e.target.value }))}
                  disabled={!isOwnerOrAdmin}
                  className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none disabled:opacity-50"
                  style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                >
                  {AI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center justify-between" style={{ color: T.textMuted }}>
                    Temperatura
                    <span className="font-mono" style={{ color: T.text }}>{settingsForm.ai_temperature}</span>
                  </label>
                  <input
                    type="range" min="0" max="1" step="0.1"
                    value={settingsForm.ai_temperature}
                    onChange={e => setSettingsForm(f => ({ ...f, ai_temperature: parseFloat(e.target.value) }))}
                    disabled={!isOwnerOrAdmin}
                    className="w-full accent-blue-500 disabled:opacity-50"
                  />
                  <div className="flex justify-between text-[10px] mt-1" style={{ color: T.textDim }}>
                    <span>Preciso</span><span>Criativo</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.textMuted }}>
                    Max Tokens
                  </label>
                  <input
                    type="number" min="500" max="8000" step="500"
                    value={settingsForm.ai_max_tokens}
                    onChange={e => setSettingsForm(f => ({ ...f, ai_max_tokens: parseInt(e.target.value) }))}
                    disabled={!isOwnerOrAdmin}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none disabled:opacity-50"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>
              </div>

              {/* AI Usage bar */}
              <div className="p-3 rounded-xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: T.textMuted }}>Uso do mês (tokens)</p>
                  <p className="text-xs font-mono font-bold" style={{ color: T.text }}>{Number(aiUsage.totalTokens).toLocaleString('pt-BR')}</p>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min((aiUsage.totalTokens / 100000) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, var(--imi-blue), var(--imi-blue-bright))',
                    }}
                  />
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: T.textDim }}>
                  {aiUsage.requests} requisições · ${aiUsage.totalCost} USD
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Members */}
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-2xl p-5" style={{ background: 'var(--bo-card)', border: `1px solid ${T.border}` }}>
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Membros da Equipe" />
              {isOwnerOrAdmin && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--imi-blue), var(--imi-blue-bright))' }}
                >
                  <Plus size={12} /> Convidar
                </button>
              )}
            </div>

            <div className="space-y-2">
              {members.length === 0 && (
                <div className="py-8 text-center">
                  <Users size={28} className="mx-auto mb-2 opacity-20" style={{ color: T.textMuted }} />
                  <p className="text-xs" style={{ color: T.textMuted }}>Nenhum membro ainda</p>
                </div>
              )}

              {members.map((member) => {
                const rc = ROLE_CONFIG[member.role] || ROLE_CONFIG.member
                const RoleIcon = rc.icon
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-xl group"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: rc.color + '25', color: rc.color, border: `1px solid ${rc.color}30` }}
                    >
                      <RoleIcon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate font-mono" style={{ color: T.textMuted }}>
                        {member.user_id?.slice(0, 8)}...
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: rc.color + '20', color: rc.color }}
                        >
                          {rc.label}
                        </span>
                        <span className="text-[10px]" style={{ color: T.textDim }}>
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {isOwnerOrAdmin && member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--bo-error)' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--bo-card)', border: `1px solid ${T.border}` }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: T.textMuted }}>
              Ações Rápidas
            </p>
            {[
              { label: 'Ver logs da IA', href: '/backoffice/settings/logs', icon: Activity },
              { label: 'Configurar integrações', href: '/backoffice/integracoes', icon: Zap },
              { label: 'Gerenciar playbooks', href: '/backoffice/playbooks', icon: Sparkles },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-3 p-3 rounded-xl transition-all group"
                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--imi-blue)20' }}
                >
                  <Icon size={13} style={{ color: 'var(--imi-blue)' }} />
                </div>
                <span className="flex-1 text-xs font-medium">{label}</span>
                <ChevronRight size={13} className="opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: T.textMuted }} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: 'var(--bo-card)', border: `1px solid ${T.border}` }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base" style={{ color: T.text }}>Convidar Membro</h3>
                <button onClick={() => setShowInviteModal(false)} style={{ color: T.textMuted }}>
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.textMuted }}>
                    Email do usuário
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="corretor@imobiliaria.com.br"
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider mb-1.5 block" style={{ color: T.textMuted }}>
                    Função
                  </label>
                  <select
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl text-sm focus:outline-none"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  >
                    <option value="admin">Administrador</option>
                    <option value="member">Membro</option>
                    <option value="viewer">Visualizador</option>
                  </select>
                </div>

                {inviteError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    <AlertCircle size={13} className="text-red-400" />
                    <p className="text-xs text-red-400">{inviteError}</p>
                  </div>
                )}

                {inviteSuccess && (
                  <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <Check size={13} className="text-emerald-400" />
                    <p className="text-xs text-emerald-400">Membro adicionado com sucesso!</p>
                  </div>
                )}

                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail || inviting}
                  className="w-full h-10 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, var(--imi-blue), var(--imi-blue-bright))' }}
                >
                  {inviting ? 'Adicionando...' : 'Adicionar à Equipe'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
