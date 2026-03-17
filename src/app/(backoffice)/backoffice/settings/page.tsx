'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Bell, Shield, Palette, Database, Save, Loader2,
  CheckCircle, Upload, Building2, Sun, Moon, Monitor,
  Key, Clock, AlertTriangle, Mail, MessageSquare,
  BarChart2, Facebook, Map, Zap, ChevronRight,
  Globe, Lock, Eye, EyeOff, Smartphone, Camera, Phone, FileText,
  Briefcase,
} from 'lucide-react'
import { PageIntelHeader } from '../../components/ui'

// ── DS3 inline style helpers ─────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--r-xl, 4px)',
  boxShadow: 'var(--shadow-xs)',
}

const elevated: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--r-lg, 4px)',
}

const inputBase: React.CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 14px',
  background: 'var(--bg-elevated)',
  border: '1.5px solid var(--border-default)',
  borderRadius: 'var(--r-md, 4px)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 180ms ease',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block', marginBottom: 6,
      fontFamily: 'var(--font-mono)', fontSize: 10,
      fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.08em', color: 'var(--text-tertiary)',
    }}>
      {children}
    </label>
  )
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{
        fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700,
        color: 'var(--text-primary)', margin: 0,
      }}>{children}</h3>
      {sub && <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      style={{
        width: 44, height: 24, borderRadius: 4, position: 'relative',
        background: checked ? 'var(--imi-gold-500)' : 'var(--bg-muted)',
        border: checked ? 'none' : '1.5px solid var(--border-default)',
        cursor: 'pointer', transition: 'all 200ms ease', flexShrink: 0,
        outline: 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: checked ? 2 : 1,
        left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: 4,
        background: checked ? '#fff' : 'var(--text-tertiary)',
        transition: 'all 200ms ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

function SettingRow({
  icon: Icon, label, desc, children, danger
}: {
  icon?: React.ElementType
  label: string
  desc?: string
  children: React.ReactNode
  danger?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16, padding: '14px 16px', ...elevated,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        {Icon && (
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--r-md)',
            background: danger ? 'var(--error-bg)' : 'var(--bg-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={16} style={{ color: danger ? 'var(--error)' : 'var(--text-tertiary)' }} />
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 14, fontWeight: 500, color: danger ? 'var(--error)' : 'var(--text-primary)',
            fontFamily: 'var(--font-sans)', margin: 0,
          }}>{label}</p>
          {desc && <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '2px 0 0', fontFamily: 'var(--font-sans)' }}>{desc}</p>}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

interface SettingsData {
  companyName: string
  companyEmail: string
  companyPhone: string
  companyAddress: string
  logoUrl: string
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyReport: boolean
  leadAlerts: boolean
  theme: 'light' | 'dark' | 'system'
  language: string
  twoFactorAuth: boolean
  sessionTimeout: string
  googleAnalytics: string
  facebookPixel: string
  whatsappApi: string
}

const TABS = [
  { id: 'personal',      label: 'Meu Perfil',   icon: User      },
  { id: 'profile',       label: 'Empresa',      icon: Building2 },
  { id: 'appearance',    label: 'Aparência',     icon: Palette   },
  { id: 'notifications', label: 'Notificações',  icon: Bell      },
  { id: 'security',      label: 'Segurança',     icon: Shield    },
  { id: 'integrations',  label: 'Integrações',   icon: Database  },
]

interface PersonalProfile {
  fullName: string
  email: string
  role: string
  phone: string
  creci: string
  bio: string
  avatarUrl: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const logoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // ── Personal Profile ──
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [personal, setPersonal] = useState<PersonalProfile>({
    fullName: 'Iule Miranda',
    email: 'iulemirandaimoveis@gmail.com',
    role: 'Corretora de Imóveis',
    phone: '+55 81 9 9723-0455',
    creci: 'CRECI-PE 12345',
    bio: 'Especialista em imóveis de alto padrão em Recife e mercados internacionais. Mais de 10 anos de experiência.',
    avatarUrl: '',
  })

  const setP = (field: keyof PersonalProfile, value: string) => {
    setPersonal(prev => ({ ...prev, [field]: value }))
  }

  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() ?? '').join('')

  const handleAvatarUpload = async (file: File) => {
    if (!file?.type.startsWith('image/')) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload?folder=avatars', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Falha no upload')
      const json = await res.json()
      const url = json.data?.url || json.url || json.publicUrl || json.path
      if (url) {
        setP('avatarUrl', url)
      } else {
        throw new Error('URL não retornada')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido'
      setSaveError('Erro no upload: ' + msg)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const [settings, setSettings] = useState<SettingsData>({
    companyName: 'Iule Miranda Imóveis',
    companyEmail: 'iulemirandaimoveis@gmail.com',
    companyPhone: '+55 81 9 9723-0455',
    companyAddress: 'Av. Boa Viagem, Recife - PE',
    logoUrl: '',
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    leadAlerts: true,
    theme: 'dark',
    language: 'pt-BR',
    twoFactorAuth: false,
    sessionTimeout: '30',
    googleAnalytics: 'G-XXXXXXXXXX',
    facebookPixel: '',
    whatsappApi: '',
  })

  const set = (field: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSaveError('')
  }

  const handleLogoUpload = async (file: File) => {
    if (!file?.type.startsWith('image/')) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload?folder=company', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Falha no upload')
      const json = await res.json()
      const url = json.data?.url || json.url || json.publicUrl || json.path
      if (url) {
        set('logoUrl', url)
        try { localStorage.setItem('imi-company-logo', url) } catch {}
      } else throw new Error('URL não retornada')
    } catch (e: any) {
      setSaveError('Erro no upload: ' + (e.message || ''))
    } finally {
      setUploadingLogo(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetch('/api/settings').then(r => r.ok ? r.json() : null).then(data => {
      if (data?.settings && Object.keys(data.settings).length > 0) {
        setSettings(prev => ({ ...prev, ...data.settings }))
        if (data.settings.logoUrl) {
          try { localStorage.setItem('imi-company-logo', data.settings.logoUrl) } catch {}
        }
      }
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || 'Falha ao salvar')
      }
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (e: any) {
      setSaveError(e.message || 'Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  if (!mounted) return null

  const currentTheme = theme || 'dark'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header ── */}
      <PageIntelHeader
        moduleLabel="SISTEMA"
        title="Configurações"
        subtitle="Perfil, aparência, segurança e integrações"
        actions={
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              height: 40, padding: '0 18px',
              borderRadius: 'var(--r-md)',
              background: showSuccess ? 'var(--success)' : 'var(--imi-gold-500)',
              color: '#fff', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
              transition: 'all 200ms ease',
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : showSuccess ? <CheckCircle size={15} /> : <Save size={15} />}
            <span className="hidden sm:inline">
              {isSaving ? 'Salvando...' : showSuccess ? 'Salvo!' : 'Salvar'}
            </span>
          </button>
        }
      />

      {/* ── Error ── */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', borderRadius: 'var(--r-lg)',
              background: 'var(--error-bg)', border: '1px solid rgba(240,88,88,0.25)',
              color: 'var(--error)', fontSize: 13, fontFamily: 'var(--font-sans)',
            }}
          >
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            {saveError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tabs ── */}
      <div style={{
        ...card,
        padding: 6,
        display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 'var(--r-lg)',
                background: active ? 'var(--bg-elevated)' : 'transparent',
                color: active ? 'var(--imi-gold-500)' : 'var(--text-secondary)',
                border: active ? '1px solid var(--border-default)' : '1px solid transparent',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 180ms ease',
                flexShrink: 0,
              }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        style={{ ...card, padding: '28px 28px' }}
        className="sm:p-8"
      >

        {/* ══ MEU PERFIL ══ */}
        {activeTab === 'personal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <SectionTitle sub="Suas informações pessoais e profissionais">
              Meu Perfil
            </SectionTitle>

            {/* ── Avatar Upload ── */}
            <div>
              <Label>Foto de Perfil</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                {/* Avatar Circle */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 4,
                    overflow: 'hidden',
                    background: 'rgba(184,148,58,0.15)',
                    border: '2.5px solid rgba(184,148,58,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {personal.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={personal.avatarUrl}
                        alt="Avatar"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 24, fontWeight: 700,
                        color: 'var(--imi-gold-500)',
                      }}>
                        {getInitials(personal.fullName) || 'IM'}
                      </span>
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 4,
                      background: 'rgba(0,0,0,0.50)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Loader2 size={20} className="animate-spin" style={{ color: '#fff' }} />
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]) }}
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      height: 38, padding: '0 16px',
                      borderRadius: 'var(--r-md)',
                      background: 'var(--imi-gold-500)',
                      color: '#fff', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                      opacity: uploadingAvatar ? 0.6 : 1,
                      transition: 'opacity 180ms ease',
                    }}
                  >
                    {uploadingAvatar
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Camera size={14} />
                    }
                    {uploadingAvatar ? 'Enviando...' : 'Trocar foto'}
                  </button>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                    JPG, PNG ou WebP · Máx. 5 MB · Recomendado 400×400px
                  </p>
                  {personal.avatarUrl && (
                    <button
                      onClick={() => setP('avatarUrl', '')}
                      style={{ fontSize: 11, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, fontFamily: 'var(--font-sans)', padding: 0 }}
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Profile Fields ── */}
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
              {/* Nome completo */}
              <div>
                <Label>Nome Completo</Label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{
                    position: 'absolute', left: 13, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    value={personal.fullName}
                    onChange={e => setP('fullName', e.target.value)}
                    style={{ ...inputBase, paddingLeft: 38 }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <Label>Email</Label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{
                    position: 'absolute', left: 13, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    type="email"
                    value={personal.email}
                    onChange={e => setP('email', e.target.value)}
                    style={{ ...inputBase, paddingLeft: 38 }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  />
                </div>
              </div>

              {/* Cargo / Função */}
              <div>
                <Label>Cargo / Função</Label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={14} style={{
                    position: 'absolute', left: 13, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    value={personal.role}
                    onChange={e => setP('role', e.target.value)}
                    placeholder="Ex: Corretora, Gerente, Sócio..."
                    style={{ ...inputBase, paddingLeft: 38 }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  />
                </div>
              </div>

              {/* Telefone */}
              <div>
                <Label>Telefone</Label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{
                    position: 'absolute', left: 13, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    type="tel"
                    value={personal.phone}
                    onChange={e => setP('phone', e.target.value)}
                    placeholder="+55 11 9 9999-9999"
                    style={{ ...inputBase, paddingLeft: 38 }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  />
                </div>
              </div>

              {/* CRECI */}
              <div className="md:col-span-1">
                <Label>CRECI <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 10 }}>(opcional)</span></Label>
                <div style={{ position: 'relative' }}>
                  <FileText size={14} style={{
                    position: 'absolute', left: 13, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-tertiary)', pointerEvents: 'none',
                  }} />
                  <input
                    type="text"
                    value={personal.creci}
                    onChange={e => setP('creci', e.target.value)}
                    placeholder="Ex: CRECI-PE 12345"
                    style={{ ...inputBase, paddingLeft: 38 }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  />
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <Label>Bio / Apresentação</Label>
              <textarea
                value={personal.bio}
                onChange={e => setP('bio', e.target.value)}
                rows={3}
                placeholder="Escreva uma breve apresentação profissional..."
                style={{
                  ...inputBase,
                  height: 'auto', padding: '10px 14px',
                  resize: 'vertical', lineHeight: 1.6,
                  fontFamily: 'var(--font-sans)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
              />
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, fontFamily: 'var(--font-sans)' }}>
                Aparece no seu cartão de apresentação e nas propostas enviadas a clientes.
              </p>
            </div>

            {/* Save */}
            <div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  height: 42, padding: '0 20px',
                  borderRadius: 'var(--r-md)',
                  background: showSuccess ? 'var(--success)' : 'var(--imi-gold-500)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
                  opacity: isSaving ? 0.7 : 1,
                  transition: 'all 200ms ease',
                }}
              >
                {isSaving
                  ? <Loader2 size={15} className="animate-spin" />
                  : showSuccess
                    ? <CheckCircle size={15} />
                    : <Save size={15} />
                }
                {isSaving ? 'Salvando...' : showSuccess ? 'Perfil salvo!' : 'Salvar Perfil'}
              </button>
            </div>
          </div>
        )}

        {/* ══ EMPRESA ══ */}
        {activeTab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionTitle sub="Dados da sua imobiliária · preparado para white-label">
              Informações da Empresa
            </SectionTitle>

            {/* Logo */}
            <div>
              <Label>Logo da Empresa</Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 'var(--r-xl)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, overflow: 'hidden', ...elevated,
                }}>
                  {settings.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6 }} />
                  ) : (
                    <Building2 size={28} style={{ color: 'var(--text-tertiary)' }} />
                  )}
                </div>
                <div>
                  <input
                    ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]) }}
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      height: 36, padding: '0 14px', ...elevated,
                      color: 'var(--text-primary)', cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
                    }}
                  >
                    {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {settings.logoUrl ? 'Trocar Logo' : 'Fazer Upload'}
                  </button>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, fontFamily: 'var(--font-sans)' }}>
                    PNG, SVG ou JPG · Aparece no header e documentos
                  </p>
                  {settings.logoUrl && (
                    <button
                      onClick={() => { set('logoUrl', ''); try { localStorage.removeItem('imi-company-logo') } catch {} }}
                      style={{ fontSize: 11, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4, fontFamily: 'var(--font-sans)' }}
                    >
                      Remover logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
              {[
                { key: 'companyName',    label: 'Nome da Empresa',   type: 'text',  icon: Building2 },
                { key: 'companyEmail',   label: 'Email Corporativo', type: 'email', icon: Mail      },
                { key: 'companyPhone',   label: 'Telefone',          type: 'tel',   icon: Smartphone },
                { key: 'companyAddress', label: 'Endereço',          type: 'text',  icon: Map       },
              ].map(f => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <input
                    type={f.type}
                    value={(settings as any)[f.key]}
                    onChange={e => set(f.key as keyof SettingsData, e.target.value)}
                    style={inputBase}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  />
                </div>
              ))}
            </div>

            {/* Multi-market info */}
            <div style={{
              padding: '14px 16px', borderRadius: 'var(--r-lg)',
              background: 'rgba(184,148,58,0.06)', border: '1px solid rgba(184,148,58,0.20)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Globe size={16} style={{ color: 'var(--imi-gold-500)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', margin: 0 }}>
                  Mercados Ativos
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)', margin: '2px 0 0' }}>
                  🇧🇷 Brasil · 🇺🇸 Estados Unidos · 🇦🇪 Emirados Árabes — gerencie imóveis nos 3 mercados
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ APARÊNCIA ══ */}
        {activeTab === 'appearance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <SectionTitle sub="Personalize a interface visual do sistema">
              Aparência e Idioma
            </SectionTitle>

            {/* Theme Selector — DS3 pill style */}
            <div>
              <Label>Tema da Interface</Label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { id: 'dark',   label: 'Escuro',      icon: Moon,    desc: 'Navy × Gold — padrão IMI' },
                  { id: 'light',  label: 'Claro',       icon: Sun,     desc: 'Branco × Navy — alta legibilidade' },
                  { id: 'system', label: 'Automático',  icon: Monitor, desc: 'Segue o sistema operacional' },
                ].map(opt => {
                  const Icon = opt.icon
                  const isSelected = currentTheme === opt.id
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        set('theme', opt.id as any)
                        setTheme(opt.id)
                      }}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        gap: 8, padding: '16px 18px', minWidth: 140, flex: 1,
                        borderRadius: 'var(--r-xl)',
                        background: isSelected ? 'rgba(184,148,58,0.08)' : 'var(--bg-elevated)',
                        border: isSelected ? '2px solid var(--imi-gold-500)' : '1.5px solid var(--border-subtle)',
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 180ms ease',
                        boxShadow: isSelected ? 'var(--shadow-gold)' : 'none',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--r-md)',
                        background: isSelected ? 'rgba(184,148,58,0.15)' : 'var(--bg-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={18} style={{ color: isSelected ? 'var(--imi-gold-500)' : 'var(--text-tertiary)' }} />
                      </div>
                      <div>
                        <p style={{
                          fontSize: 13, fontWeight: 600, margin: 0,
                          color: isSelected ? 'var(--imi-gold-500)' : 'var(--text-primary)',
                          fontFamily: 'var(--font-sans)',
                        }}>{opt.label}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '3px 0 0', fontFamily: 'var(--font-sans)', lineHeight: 1.4 }}>
                          {opt.desc}
                        </p>
                      </div>
                      {isSelected && (
                        <div style={{
                          alignSelf: 'flex-end', width: 8, height: 8, borderRadius: 4,
                          background: 'var(--imi-gold-500)',
                          position: 'absolute', top: 10, right: 10,
                        }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Language */}
            <div>
              <Label>Idioma</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 10 }}>
                {[
                  { id: 'pt-BR', flag: '🇧🇷', label: 'Português (Brasil)' },
                  { id: 'en-US', flag: '🇺🇸', label: 'English (US)'       },
                  { id: 'ar-AE', flag: '🇦🇪', label: 'العربية (UAE)'       },
                ].map(lang => {
                  const active = settings.language === lang.id
                  return (
                    <button
                      key={lang.id}
                      onClick={() => set('language', lang.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 14px', borderRadius: 'var(--r-lg)',
                        background: active ? 'rgba(184,148,58,0.08)' : 'var(--bg-elevated)',
                        border: active ? '1.5px solid var(--imi-gold-500)' : '1.5px solid var(--border-subtle)',
                        color: active ? 'var(--imi-gold-500)' : 'var(--text-secondary)',
                        cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: 13,
                        fontWeight: active ? 600 : 400, transition: 'all 180ms ease',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{lang.flag}</span>
                      {lang.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Font preview */}
            <div style={{ ...elevated, padding: 20 }}>
              <Label>Tipografia DS3</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>IMI</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Libre Baskerville — Títulos e brand</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 500, color: 'var(--text-primary)' }}>Inteligência Imobiliária</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Figtree — Corpo de texto</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--imi-gold-500)' }}>R$ 24.800/m²</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>JetBrains Mono — Dados e métricas</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ NOTIFICAÇÕES ══ */}
        {activeTab === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <SectionTitle sub="Escolha como deseja receber atualizações">
              Preferências de Notificações
            </SectionTitle>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SettingRow icon={Mail} label="Notificações por Email" desc="Receba atualizações importantes por email">
                <Toggle checked={settings.emailNotifications} onChange={() => set('emailNotifications', !settings.emailNotifications)} />
              </SettingRow>
              <SettingRow icon={Smartphone} label="Notificações Push" desc="Alertas em tempo real no navegador e dispositivo móvel">
                <Toggle checked={settings.pushNotifications} onChange={() => set('pushNotifications', !settings.pushNotifications)} />
              </SettingRow>
              <SettingRow icon={BarChart2} label="Relatório Semanal" desc="Resumo de performance toda segunda-feira via email">
                <Toggle checked={settings.weeklyReport} onChange={() => set('weeklyReport', !settings.weeklyReport)} />
              </SettingRow>
              <SettingRow icon={Bell} label="Alertas de Novos Leads" desc="Notificação imediata quando um novo lead chegar">
                <Toggle checked={settings.leadAlerts} onChange={() => set('leadAlerts', !settings.leadAlerts)} />
              </SettingRow>
            </div>

            {/* Push permission info */}
            <div style={{
              padding: '14px 16px', borderRadius: 'var(--r-lg)',
              background: 'var(--info-bg)', border: '1px solid rgba(96,168,248,0.25)',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <Bell size={15} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', margin: 0 }}>
                  Notificações Push (PWA)
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Para receber alertas no celular, instale o app (Adicionar à tela inicial) e permita notificações quando solicitado.
                  Funciona em Android e iOS 16.4+.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ SEGURANÇA ══ */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionTitle sub="Proteja sua conta e dados dos clientes">
              Segurança e Privacidade
            </SectionTitle>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SettingRow icon={Key} label="Autenticação de Dois Fatores" desc="Adiciona uma camada extra de proteção no login">
                <Toggle checked={settings.twoFactorAuth} onChange={() => set('twoFactorAuth', !settings.twoFactorAuth)} />
              </SettingRow>
            </div>

            {/* Session Timeout */}
            <div>
              <Label>Tempo de Sessão Automática</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 8 }}>
                {[
                  { value: '15',  label: '15 min' },
                  { value: '30',  label: '30 min' },
                  { value: '60',  label: '1 hora'  },
                  { value: '120', label: '2 horas' },
                ].map(opt => {
                  const active = settings.sessionTimeout === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => set('sessionTimeout', opt.value)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        height: 40, borderRadius: 'var(--r-md)',
                        background: active ? 'rgba(184,148,58,0.10)' : 'var(--bg-elevated)',
                        border: active ? '1.5px solid var(--imi-gold-500)' : '1.5px solid var(--border-subtle)',
                        color: active ? 'var(--imi-gold-500)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: active ? 700 : 500,
                        cursor: 'pointer', transition: 'all 180ms ease',
                      }}
                    >
                      <Clock size={13} />
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Change password */}
            <div>
              <Label>Alterar Senha</Label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nova senha (mín. 8 caracteres)"
                  style={{ ...inputBase, paddingRight: 44 }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-tertiary)', padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6, fontFamily: 'var(--font-sans)' }}>
                Deixe em branco para manter a senha atual
              </p>
            </div>

            {/* LGPD info */}
            <div style={{
              padding: '14px 16px', borderRadius: 'var(--r-lg)',
              background: 'var(--success-bg)', border: '1px solid rgba(52,196,117,0.20)',
              display: 'flex', gap: 12,
            }}>
              <Lock size={15} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', margin: 0 }}>
                  LGPD Compliance
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', margin: '4px 0 0', lineHeight: 1.5 }}>
                  Dados armazenados em servidores brasileiros via Supabase. Encriptação AES-256 em trânsito e repouso.
                  Conforme LGPD Art. 46.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ══ INTEGRAÇÕES ══ */}
        {activeTab === 'integrations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <SectionTitle sub="Conecte com ferramentas externas de marketing e operações">
              Integrações e APIs
            </SectionTitle>

            {/* Quick fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'googleAnalytics', label: 'Google Analytics ID', placeholder: 'G-XXXXXXXXXX',      icon: BarChart2    },
                { key: 'facebookPixel',   label: 'Meta / Facebook Pixel', placeholder: '123456789012345', icon: Facebook     },
                { key: 'whatsappApi',     label: 'WhatsApp API Token',   placeholder: 'EAAxxxxxxxxxx',     icon: MessageSquare },
              ].map(f => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <div style={{ position: 'relative' }}>
                    <f.icon size={15} style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      color: 'var(--text-tertiary)', pointerEvents: 'none',
                    }} />
                    <input
                      type="text"
                      value={(settings as any)[f.key]}
                      onChange={e => set(f.key as keyof SettingsData, e.target.value)}
                      placeholder={f.placeholder}
                      style={{ ...inputBase, paddingLeft: 38, fontFamily: 'var(--font-mono)', fontSize: 13 }}
                      onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-focus)')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Integration cards */}
            {[
              {
                emoji: '🗺️', title: 'Mapa Imobiliário', desc: 'Provedor de mapas nas páginas de empreendimentos',
                badge: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'Mapbox Ativo' : 'MapLibre Ativo',
                badgeColor: 'var(--success)',
                items: [
                  { env: 'NEXT_PUBLIC_MAPBOX_TOKEN', hint: 'Token Mapbox (pk.ey…) — opcional, MapLibre é padrão gratuito' },
                ],
              },
              {
                emoji: '📣', title: 'Meta Ads · Facebook & Instagram', desc: 'Sincronize campanhas do Meta Business com o painel',
                items: [
                  { env: 'META_ACCESS_TOKEN',  hint: 'Token de acesso do sistema Meta Business (nunca expira)' },
                  { env: 'META_AD_ACCOUNT_ID', hint: 'ID da conta de anúncios — formato: act_XXXXXXXXX' },
                ],
              },
              {
                emoji: '⚡', title: 'Pix & Fintech (Asaas)', desc: 'Cobranças Pix via Asaas — QR Code e boleto',
                items: [
                  { env: 'ASAAS_API_KEY',      hint: 'Chave da API Asaas ($aact_…)' },
                  { env: 'PIX_KEY',            hint: 'Chave Pix — email, CPF, CNPJ ou aleatória' },
                  { env: 'PIX_MERCHANT_NAME',  hint: 'Nome do recebedor (máx. 25 chars)' },
                  { env: 'PIX_MERCHANT_CITY',  hint: 'Cidade (máx. 15 chars)' },
                ],
              },
              {
                emoji: '🥑', title: 'AbacatePay', desc: 'Pix + Cartão via link de cobrança — prioridade sobre Asaas',
                items: [
                  { env: 'ABACATEPAY_TOKEN', hint: 'Bearer token do painel AbacatePay' },
                ],
              },
            ].map(section => (
              <div key={section.title} style={{ ...elevated, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', margin: 0 }}>
                      {section.emoji} {section.title}
                    </p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '3px 0 0', fontFamily: 'var(--font-sans)' }}>
                      {section.desc}
                    </p>
                  </div>
                  {section.badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-full)',
                      background: 'var(--success-bg)', color: section.badgeColor,
                      border: '1px solid rgba(52,196,117,0.25)', textTransform: 'uppercase',
                      letterSpacing: '0.08em', fontFamily: 'var(--font-mono)', flexShrink: 0,
                    }}>
                      {section.badge}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 8 }}>
                  {section.items.map(item => (
                    <div key={item.env} style={{
                      padding: '10px 12px', borderRadius: 'var(--r-md)',
                      background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)',
                    }}>
                      <code style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--imi-gold-500)', fontWeight: 700, display: 'block', marginBottom: 3 }}>
                        {item.env}
                      </code>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                        {item.hint}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Vercel tip */}
            <div style={{
              padding: '12px 16px', borderRadius: 'var(--r-lg)',
              background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Zap size={14} style={{ color: 'var(--imi-gold-500)', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
                Configure todas as variáveis em{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Vercel → Settings → Environment Variables</strong>
                {' '}e faça redeploy para ativar.
              </p>
              <a
                href="https://vercel.com/iulemirandaimoveis-labs-projects/youthful-fermi/settings/environment-variables"
                target="_blank" rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                  fontSize: 12, color: 'var(--imi-gold-500)', fontFamily: 'var(--font-sans)',
                  textDecoration: 'none', fontWeight: 600,
                }}
              >
                Abrir <ChevronRight size={12} />
              </a>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
