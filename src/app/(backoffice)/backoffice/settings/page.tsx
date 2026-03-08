'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Save,
  Loader2,
  CheckCircle,
  Upload,
  Building2,
} from 'lucide-react'
import { PageIntelHeader } from '../../components/ui'
import { T, ctaGradient, ctaShadow } from '../../lib/theme'

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
  theme: 'light' | 'dark' | 'auto' | 'system'
  language: string
  twoFactorAuth: boolean
  sessionTimeout: string
  googleAnalytics: string
  facebookPixel: string
  whatsappApi: string
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saveError, setSaveError] = useState('')

  const logoInputRef = useRef<HTMLInputElement>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

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

  const handleChange = (field: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSaveError('')
  }

  const handleLogoUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      // upload to media bucket under company/ folder
      const res = await fetch('/api/upload?folder=company', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Falha no upload')
      const json = await res.json()
      // API returns { success, data: { url, fileName, ... } }
      const url = json.data?.url || json.url || json.publicUrl || json.path
      if (url) {
        handleChange('logoUrl', url)
        try { localStorage.setItem('imi-company-logo', url) } catch {}
      } else {
        throw new Error('URL da imagem não retornada')
      }
    } catch (e: any) {
      setSaveError('Erro ao fazer upload da logo: ' + (e.message || ''))
    } finally {
      setUploadingLogo(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.settings && Object.keys(data.settings).length > 0) {
            setSettings(prev => ({ ...prev, ...data.settings }))
            // NOTE: Do NOT call setTheme() here — it would change the user's
            // current theme just by visiting this page (the bug). Theme is
            // only applied when the user explicitly changes it in the dropdown.
            // Cache logo in localStorage for the mobile header
            if (data.settings.logoUrl) {
              try { localStorage.setItem('imi-company-logo', data.settings.logoUrl) } catch {}
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch settings', e)
      }
    }
    fetchSettings()
  }, [])

  if (!mounted) return null

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError('')

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Falha ao salvar')
      }
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (e: any) {
      console.error('Error saving settings:', e)
      setSaveError(e.message || 'Erro ao salvar configurações')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Perfil da Empresa', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'integrations', label: 'Integrações', icon: Database },
  ]

  const inputStyle = {
    background: T.elevated,
    border: `1px solid ${T.border}`,
    color: T.text,
  }

  const toggleCheckedStyle = {
    background: T.accent,
  }

  const toggleUncheckedStyle = {
    background: T.elevated,
    border: `1px solid ${T.border}`,
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageIntelHeader
        moduleLabel="CONFIGURAÇÕES"
        title="Configurações"
        subtitle="Gerencie as preferências e configurações do sistema"
        actions={
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all disabled:opacity-50"
            style={{ background: ctaGradient, boxShadow: ctaShadow }}
          >
            {isSaving ? (
              <><Loader2 size={16} className="animate-spin" /> <span className="hidden sm:inline">Salvando...</span></>
            ) : showSuccess ? (
              <><CheckCircle size={16} /> <span className="hidden sm:inline">Salvo!</span></>
            ) : (
              <><Save size={16} /> <span className="hidden sm:inline">Salvar Alterações</span></>
            )}
          </button>
        }
      />

      {/* Error banner */}
      {saveError && (
        <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(229,115,115,0.10)', border: '1px solid rgba(229,115,115,0.25)', color: '#E57373' }}>
          ⚠ {saveError}
        </div>
      )}

      {/* Tabs */}
      <div className="rounded-2xl p-2 flex gap-2 overflow-x-auto"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
              style={{
                background: activeTab === tab.id ? T.elevated : 'transparent',
                color: activeTab === tab.id ? T.accent : T.textMuted,
                border: activeTab === tab.id ? `1px solid ${T.border}` : '1px solid transparent',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="rounded-2xl p-6 sm:p-8" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: T.text }}>Informações da Empresa</h3>
              <p className="text-sm" style={{ color: T.textMuted }}>Dados básicos da sua imobiliária · preparado para white-label</p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: T.textMuted }}>
                Logo da Empresa
              </label>
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                  {settings.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 size={28} style={{ color: T.textMuted, opacity: 0.4 }} />
                  )}
                </div>
                {/* Upload button */}
                <div className="flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]) }}
                  />
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                  >
                    {uploadingLogo ? (
                      <><Loader2 size={15} className="animate-spin" /> Enviando...</>
                    ) : (
                      <><Upload size={15} /> {settings.logoUrl ? 'Trocar Logo' : 'Fazer Upload'}</>
                    )}
                  </button>
                  <p className="text-xs mt-1.5" style={{ color: T.textMuted }}>
                    PNG, SVG ou JPG. Aparece no header mobile e futuramente em documentos.
                  </p>
                  {settings.logoUrl && (
                    <button
                      onClick={() => {
                        handleChange('logoUrl', '')
                        try { localStorage.removeItem('imi-company-logo') } catch {}
                      }}
                      className="text-xs mt-1"
                      style={{ color: '#E57373' }}
                    >
                      Remover logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'companyName', label: 'Nome da Empresa', type: 'text' },
                { key: 'companyEmail', label: 'Email Corporativo', type: 'email' },
                { key: 'companyPhone', label: 'Telefone', type: 'tel' },
                { key: 'companyAddress', label: 'Endereço', type: 'text' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={(settings as any)[field.key]}
                    onChange={(e) => handleChange(field.key as keyof SettingsData, e.target.value)}
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.border = `1px solid ${T.accent}`)}
                    onBlur={e => (e.currentTarget.style.border = `1px solid ${T.border}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: T.text }}>Preferências de Notificações</h3>
              <p className="text-sm" style={{ color: T.textMuted }}>Escolha como deseja receber atualizações</p>
            </div>

            <div className="space-y-3">
              {[
                { key: 'emailNotifications', label: 'Notificações por Email', desc: 'Receba atualizações importantes por email' },
                { key: 'pushNotifications', label: 'Notificações Push', desc: 'Alertas em tempo real no navegador' },
                { key: 'weeklyReport', label: 'Relatório Semanal', desc: 'Resumo de performance toda segunda-feira' },
                { key: 'leadAlerts', label: 'Alertas de Novos Leads', desc: 'Notificação imediata quando um lead chegar' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: T.text }}>{item.label}</p>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleChange(item.key as keyof SettingsData, !(settings as any)[item.key])}
                    className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
                    style={(settings as any)[item.key] ? toggleCheckedStyle : toggleUncheckedStyle}
                  >
                    <span
                      className="absolute top-[2px] w-5 h-5 rounded-full transition-all"
                      style={{ background: '#E8EDF2', left: (settings as any)[item.key] ? '22px' : '2px' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: T.text }}>Aparência e Idioma</h3>
              <p className="text-sm" style={{ color: T.textMuted }}>Personalize a interface do sistema</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>
                  Tema
                </label>
                {/* FIX: use settings.theme (not `theme` from next-themes) so ThemeToggle
                    in the header doesn't hijack this dropdown. setTheme() only on explicit
                    user selection here. It's applied permanently on "Salvar". */}
                <select
                  value={settings.theme}
                  onChange={(e) => {
                    handleChange('theme', e.target.value as SettingsData['theme'])
                    setTheme(e.target.value)
                  }}
                  className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                  <option value="system">Automático (Sistema)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>
                  Idioma
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleChange('language', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en-US">English (US)</option>
                  <option value="es-ES">Español</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: T.text }}>Segurança e Privacidade</h3>
              <p className="text-sm" style={{ color: T.textMuted }}>Proteja sua conta e dados</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: T.text }}>Autenticação de Dois Fatores</p>
                  <p className="text-xs mt-1" style={{ color: T.textMuted }}>Adicione uma camada extra de segurança</p>
                </div>
                <button
                  onClick={() => handleChange('twoFactorAuth', !settings.twoFactorAuth)}
                  className="w-11 h-6 rounded-full relative transition-all flex-shrink-0"
                  style={settings.twoFactorAuth ? toggleCheckedStyle : toggleUncheckedStyle}
                >
                  <span
                    className="absolute top-[2px] w-5 h-5 rounded-full transition-all"
                    style={{ background: '#E8EDF2', left: settings.twoFactorAuth ? '22px' : '2px' }}
                  />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>
                  Tempo de Sessão (minutos)
                </label>
                <select
                  value={settings.sessionTimeout}
                  onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="120">2 horas</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-1" style={{ color: T.text }}>Integrações Externas</h3>
              <p className="text-sm" style={{ color: T.textMuted }}>Conecte com ferramentas de terceiros</p>
            </div>

            <div className="space-y-4">
              {[
                { key: 'googleAnalytics', label: 'Google Analytics ID', placeholder: 'G-XXXXXXXXXX' },
                { key: 'facebookPixel', label: 'Facebook Pixel ID', placeholder: '123456789012345' },
                { key: 'whatsappApi', label: 'WhatsApp API Token', placeholder: 'EAAxxxxxxxxxx' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>
                    {field.label}
                  </label>
                  <input
                    type="text"
                    value={(settings as any)[field.key]}
                    onChange={(e) => handleChange(field.key as keyof SettingsData, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full h-11 px-4 rounded-xl text-sm outline-none font-mono transition-all"
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.border = `1px solid ${T.accent}`)}
                    onBlur={e => (e.currentTarget.style.border = `1px solid ${T.border}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
