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
import { T } from '../../lib/theme'

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
            style={{ background: T.accent }}
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

            {/* Map Provider Section */}
            <div style={{
              marginTop: '28px', padding: '20px', borderRadius: '16px',
              background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '3px' }}>
                    🗺️ Mapa Imobiliário
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)' }}>
                    Provedor de mapas usado nas páginas de empreendimentos
                  </p>
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '8px',
                  background: 'rgba(0,178,127,0.15)', color: '#00B27F',
                  border: '1px solid rgba(0,178,127,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'Mapbox Ativo' : 'MapLibre Ativo'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* MapLibre option */}
                <div style={{
                  padding: '14px', borderRadius: '12px',
                  background: !process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'rgba(0,178,127,0.08)' : 'var(--bo-surface)',
                  border: `1px solid ${!process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'rgba(0,178,127,0.3)' : 'var(--bo-border)'}`,
                }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '4px' }}>
                    MapLibre + CARTO
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', lineHeight: '1.5' }}>
                    Open source, gratuito, sem API key. Tiles CARTO dark-matter. Recomendado.
                  </p>
                  <p style={{ fontSize: '10px', color: '#00B27F', marginTop: '6px', fontWeight: 600 }}>✓ Ativo por padrão</p>
                </div>

                {/* Mapbox option */}
                <div style={{
                  padding: '14px', borderRadius: '12px',
                  background: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'rgba(59,130,246,0.08)' : 'var(--bo-surface)',
                  border: `1px solid ${process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'rgba(59,130,246,0.3)' : 'var(--bo-border)'}`,
                }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '4px' }}>
                    Mapbox GL
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', lineHeight: '1.5' }}>
                    Estilos premium. Requer conta Mapbox e token.
                  </p>
                  <p style={{ fontSize: '10px', color: 'var(--bo-text-muted)', marginTop: '6px', fontWeight: 600, fontFamily: 'monospace' }}>
                    NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey…
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', marginTop: '10px', lineHeight: '1.6' }}>
                Para usar Mapbox, defina a variável <code style={{ fontFamily: 'monospace', background: 'var(--bo-surface)', padding: '1px 5px', borderRadius: '4px' }}>NEXT_PUBLIC_MAPBOX_TOKEN</code> no Vercel.
                Sem ela, o mapa usa MapLibre + OpenStreetMap automaticamente.
              </p>
            </div>

            {/* Meta Ads Section */}
            <div style={{
              marginTop: '16px', padding: '20px', borderRadius: '16px',
              background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '3px' }}>
                📣 Meta Ads — Facebook & Instagram
              </p>
              <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)', marginBottom: '14px' }}>
                Sincronize campanhas reais do Meta Business com o painel de campanhas
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'META_ACCESS_TOKEN', hint: 'Token de acesso do sistema Meta Business (nunca expira)' },
                  { label: 'META_AD_ACCOUNT_ID', hint: 'ID da conta de anúncios — formato: act_XXXXXXXXX' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '10px 12px', borderRadius: '10px',
                    background: 'var(--bo-surface)', border: '1px solid var(--bo-border)',
                  }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--bo-accent)', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)' }}>{item.hint}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', marginTop: '10px', lineHeight: '1.6' }}>
                Configure em <em>Vercel → Settings → Environment Variables</em>. Após configurar, o botão{' '}
                <strong style={{ color: 'var(--bo-text)' }}>Sincronizar Meta</strong> aparece na página de Campanhas
                e importa dados reais de impressões, cliques, leads e gastos via Graph API v20.0.
              </p>
            </div>

            {/* Pix / Fintech Section */}
            <div style={{
              marginTop: '16px', padding: '20px', borderRadius: '16px',
              background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)',
            }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '3px' }}>
                ⚡ Pix &amp; Fintech
              </p>
              <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)', marginBottom: '14px' }}>
                Configuração do provedor de cobranças Pix
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'ASAAS_API_KEY', hint: 'Chave da API Asaas ($aact_…)' },
                  { label: 'PIX_KEY', hint: 'Chave Pix (email, CPF, CNPJ, aleatória)' },
                  { label: 'PIX_MERCHANT_NAME', hint: 'Nome do recebedor (máx. 25 chars)' },
                  { label: 'PIX_MERCHANT_CITY', hint: 'Cidade do recebedor (máx. 15 chars)' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '10px 12px', borderRadius: '10px',
                    background: 'var(--bo-surface)', border: '1px solid var(--bo-border)',
                  }}>
                    <p style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--bo-accent)', marginBottom: '2px' }}>{item.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)' }}>{item.hint}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', marginTop: '10px' }}>
                Configure no painel Vercel em <em>Settings → Environment Variables</em>. Sem <code style={{ fontFamily: 'monospace', background: 'var(--bo-surface)', padding: '1px 5px', borderRadius: '4px' }}>ASAAS_API_KEY</code>, o Pix gera QR localmente (EMV).
              </p>
            </div>

            {/* AbacatePay Section */}
            <div style={{
              marginTop: '16px', padding: '20px', borderRadius: '16px',
              background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                <span style={{ fontSize: '16px' }}>🥑</span>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bo-text)' }}>
                  AbacatePay
                </p>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)', marginBottom: '14px' }}>
                Gateway nacional — Pix QR Code + link de cobrança com Pix e Cartão. Prioridade sobre Asaas quando configurado.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'ABACATEPAY_TOKEN', hint: 'Bearer token do painel AbacatePay' },
                ].map(({ label, hint }) => (
                  <div key={label} style={{
                    padding: '12px 14px', borderRadius: '10px',
                    background: 'var(--bo-surface)', border: '1px solid var(--bo-border)',
                  }}>
                    <code style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--bo-accent)' }}>{label}</code>
                    <p style={{ fontSize: '10px', color: 'var(--bo-text-muted)', marginTop: '2px' }}>{hint}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--bo-text-muted)', marginTop: '10px' }}>
                Endpoints usados: <code style={{ fontFamily: 'monospace', background: 'var(--bo-surface)', padding: '1px 5px', borderRadius: '4px' }}>POST /v1/pixQrCode/create</code> (Pix direto) e{' '}
                <code style={{ fontFamily: 'monospace', background: 'var(--bo-surface)', padding: '1px 5px', borderRadius: '4px' }}>POST /v1/billing/create</code> (link com Pix+Cartão via <code style={{ fontFamily: 'monospace', background: 'var(--bo-surface)', padding: '1px 5px', borderRadius: '4px' }}>/api/abacate-pay</code>).
                Webhook: aponte <strong>billing.paid</strong> e <strong>pix.paid</strong> para <code style={{ fontFamily: 'monospace', background: 'var(--bo-surface)', padding: '1px 5px', borderRadius: '4px' }}>https://www.iulemirandaimoveis.com.br/api/pix/webhook</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
