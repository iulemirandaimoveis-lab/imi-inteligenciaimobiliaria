'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, Palette, Globe, Shield,
  Upload, Check, Save, AlertCircle, Search,
} from 'lucide-react'
import { PageIntelHeader, Btn } from '../../components/ui'
import { T, inputStyle } from '../../lib/theme'
import { createClient } from '@/lib/supabase/client'

/* ─── TYPES ─────────────────────────────────────────────────────── */
interface OrgForm {
  // Perfil
  razaoSocial: string
  nomeFantasia: string
  cnpj: string
  website: string
  telefone: string
  emailComercial: string
  // Endereço
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  // Identidade visual
  corPrimaria: string
  corSecundaria: string
  fonte: 'libre' | 'playfair' | 'georgia'
  // Regionais
  moeda: 'BRL' | 'USD' | 'AED'
  idioma: 'pt' | 'en'
  formatoData: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd'
  fusoHorario: string
  // Licença (read-only)
  creci: string
  cnai: string
  validadeLicenca: string
}

const DEFAULT_FORM: OrgForm = {
  razaoSocial: 'IMI Inteligência Imobiliária Ltda.',
  nomeFantasia: 'IMI Imóveis',
  cnpj: '12.345.678/0001-99',
  website: 'https://imi.com.br',
  telefone: '(11) 3000-0000',
  emailComercial: 'contato@imi.com.br',
  cep: '01310-100',
  logradouro: 'Av. Paulista',
  numero: '1000',
  complemento: 'Cj. 101',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  corPrimaria: '#2550E8',
  corSecundaria: '#0B1120',
  fonte: 'libre',
  moeda: 'BRL',
  idioma: 'pt',
  formatoData: 'dd/mm/yyyy',
  fusoHorario: 'America/Sao_Paulo',
  creci: 'CRECI-J 12345/SP',
  cnai: 'CNAI 00987',
  validadeLicenca: '31/12/2026',
}

/* ─── SECTION CARD ───────────────────────────────────────────────── */
function SectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string
  subtitle: string
  icon: React.ElementType
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: T.radius.xl,
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'color-mix(in srgb, var(--bg-elevated) 50%, transparent)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: T.radius.md, flexShrink: 0,
          background: 'color-mix(in srgb, var(--accent-400) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--accent-400) 22%, transparent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color: 'var(--accent-400)' }} />
        </div>
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: T.text, fontFamily: T.font.sans, margin: 0 }}>
            {title}
          </h2>
          <p style={{ fontSize: 12, color: T.textMuted, margin: '1px 0 0' }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding: '20px 24px' }}>
        {children}
      </div>
    </motion.div>
  )
}

/* ─── FIELD ──────────────────────────────────────────────────────── */
function Field({ label, children, readOnly }: { label: string; children: React.ReactNode; readOnly?: boolean }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700,
        color: readOnly ? 'var(--accent-400)' : T.textMuted,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

/* ─── GRID ───────────────────────────────────────────────────────── */
function Grid({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 16 }}>
      {children}
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────────── */
export default function OrganizacaoPage() {
  const [form, setForm] = useState<OrgForm>(DEFAULT_FORM)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedOk, setSavedOk] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('tenant_users')
        .select('tenant_id, tenants(*)')
        .eq('user_id', user.id)
        .single()
      if (data?.tenant_id) {
        setTenantId(data.tenant_id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tenant = (data as any).tenants as Record<string, any> | null
        if (tenant) {
          setForm(prev => ({
            ...prev,
            razaoSocial: tenant.name || prev.razaoSocial,
            nomeFantasia: tenant.trade_name || tenant.name || prev.nomeFantasia,
            website: tenant.website || prev.website,
            emailComercial: tenant.email || prev.emailComercial,
            telefone: tenant.phone || prev.telefone,
            moeda: tenant.currency || prev.moeda,
            idioma: tenant.language || prev.idioma,
          }))
        }
      }
    })
  }, [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fI: React.CSSProperties = {
    ...inputStyle,
    background: T.elevated,
    border: `1.5px solid ${T.border}`,
  }

  const readonlyI: React.CSSProperties = {
    ...fI,
    opacity: 0.7,
    cursor: 'not-allowed',
    background: 'color-mix(in srgb, var(--accent-400) 5%, var(--bg-elevated))',
    border: '1.5px solid color-mix(in srgb, var(--accent-400) 20%, var(--border-default))',
  }

  const update = <K extends keyof OrgForm>(key: K, value: OrgForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem deve ter no máximo 2MB')
      return
    }
    // Preview
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
    setIsDirty(true)
    // Upload to /api/upload
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'org')
      await fetch('/api/upload', { method: 'POST', body: fd })
    } catch {
      // silently ignore
    }
  }

  const handleCepSearch = async () => {
    const raw = form.cep.replace(/\D/g, '')
    if (raw.length !== 8) return
    setCepLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }))
        setIsDirty(true)
      }
    } catch {
      // silently ignore
    } finally {
      setCepLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      if (tenantId) {
        await supabase.from('tenants').update({
          name: form.razaoSocial,
          trade_name: form.nomeFantasia,
          website: form.website,
          email: form.emailComercial,
          phone: form.telefone,
          currency: form.moeda,
          language: form.idioma,
          updated_at: new Date().toISOString(),
        }).eq('id', tenantId)
      }
      setSavedOk(true)
      setIsDirty(false)
      setTimeout(() => setSavedOk(false), 2000)
    } catch {
      // silently ignore
    } finally {
      setSaving(false)
    }
  }

  const FONT_OPTIONS: { id: OrgForm['fonte']; label: string; family: string }[] = [
    { id: 'libre', label: 'Libre Baskerville', family: 'Georgia, serif' },
    { id: 'playfair', label: 'Playfair Display', family: '"Playfair Display", Georgia, serif' },
    { id: 'georgia', label: 'Georgia', family: 'Georgia, serif' },
  ]

  return (
    <div style={{ maxWidth: 800, paddingBottom: 100 }}>
      <PageIntelHeader
        moduleLabel="CONFIGURAÇÕES · EMPRESA"
        title="Organização"
        subtitle="Perfil, identidade visual e configurações gerais da empresa"
        breadcrumbs={[{ label: 'Configurações', href: '/backoffice/settings' }, { label: 'Organização' }]}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── 1. PERFIL DA EMPRESA ──────────────────────────────── */}
        <SectionCard
          title="Perfil da Empresa"
          subtitle="Dados cadastrais e informações públicas"
          icon={Building2}
          delay={0}
        >
          {/* Logo upload zone */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Logotipo
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {/* Upload zone */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 120, height: 80,
                  borderRadius: T.radius.lg,
                  border: `2px dashed ${T.border}`,
                  background: T.elevated,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 8, cursor: 'pointer',
                  transition: 'all 0.15s',
                  overflow: 'hidden',
                  padding: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--accent-400)'
                  e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-400) 5%, var(--bg-elevated))'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = T.border
                  e.currentTarget.style.background = T.elevated
                }}
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
                ) : (
                  <>
                    <Upload size={18} style={{ color: T.textDim }} />
                    <span style={{ fontSize: 11, color: T.textDim, textAlign: 'center', lineHeight: 1.3, fontFamily: T.font.sans, padding: '0 6px' }}>
                      Clique ou arraste o logo
                    </span>
                  </>
                )}
              </button>
              <input
                id="logo-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleLogoChange}
              />
              <div>
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>PNG, SVG ou JPG · Máx. 2 MB</p>
                <p style={{ fontSize: 12, color: T.textDim, margin: '3px 0 0' }}>Recomendado: 400 × 200 px, fundo transparente</p>
                {logoPreview && (
                  <button
                    onClick={() => { setLogoPreview(null); setIsDirty(true) }}
                    style={{ marginTop: 8, fontSize: 12, color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    Remover logo
                  </button>
                )}
              </div>
            </div>
          </div>

          <Grid cols={2}>
            <Field label="Razão Social">
              <input type="text" value={form.razaoSocial} onChange={e => update('razaoSocial', e.target.value)} style={fI} />
            </Field>
            <Field label="Nome Fantasia">
              <input type="text" value={form.nomeFantasia} onChange={e => update('nomeFantasia', e.target.value)} style={fI} />
            </Field>
          </Grid>

          <Grid cols={2}>
            <Field label="CNPJ">
              <input type="text" value={form.cnpj} onChange={e => update('cnpj', e.target.value)} placeholder="00.000.000/0001-00" style={fI} />
            </Field>
            <Field label="Website">
              <input type="url" value={form.website} onChange={e => update('website', e.target.value)} placeholder="https://" style={fI} />
            </Field>
          </Grid>

          <Grid cols={2}>
            <Field label="Telefone">
              <input type="tel" value={form.telefone} onChange={e => update('telefone', e.target.value)} style={fI} />
            </Field>
            <Field label="Email Comercial">
              <input type="email" value={form.emailComercial} onChange={e => update('emailComercial', e.target.value)} style={fI} />
            </Field>
          </Grid>
        </SectionCard>

        {/* ── 2. ENDEREÇO ───────────────────────────────────────── */}
        <SectionCard
          title="Endereço"
          subtitle="Localização física da empresa"
          icon={MapPin}
          delay={0.05}
        >
          {/* CEP with auto-fill */}
          <div style={{ marginBottom: 16 }}>
            <Field label="CEP">
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={form.cep}
                  onChange={e => update('cep', e.target.value)}
                  placeholder="00000-000"
                  style={{ ...fI, flex: 1 }}
                  onKeyDown={e => { if (e.key === 'Enter') handleCepSearch() }}
                />
                <button
                  onClick={handleCepSearch}
                  disabled={cepLoading}
                  style={{
                    height: 40, padding: '0 14px', borderRadius: T.radius.md,
                    background: T.elevated, border: `1.5px solid ${T.border}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, fontWeight: 500, color: T.text, cursor: 'pointer',
                    fontFamily: T.font.sans, whiteSpace: 'nowrap',
                    opacity: cepLoading ? 0.6 : 1,
                  }}
                >
                  <Search size={13} style={{ color: 'var(--accent-400)' }} />
                  {cepLoading ? 'Buscando...' : 'Auto-preencher'}
                </button>
              </div>
            </Field>
          </div>

          <Grid cols={3}>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Logradouro">
                <input type="text" value={form.logradouro} onChange={e => update('logradouro', e.target.value)} style={fI} />
              </Field>
            </div>
            <Field label="Número">
              <input type="text" value={form.numero} onChange={e => update('numero', e.target.value)} style={fI} />
            </Field>
          </Grid>

          <Grid cols={3}>
            <Field label="Complemento">
              <input type="text" value={form.complemento} onChange={e => update('complemento', e.target.value)} placeholder="Apto, sala..." style={fI} />
            </Field>
            <Field label="Bairro">
              <input type="text" value={form.bairro} onChange={e => update('bairro', e.target.value)} style={fI} />
            </Field>
            <Field label="Cidade">
              <input type="text" value={form.cidade} onChange={e => update('cidade', e.target.value)} style={fI} />
            </Field>
          </Grid>

          <div style={{ maxWidth: 120 }}>
            <Field label="Estado (UF)">
              <input type="text" value={form.estado} onChange={e => update('estado', e.target.value)} maxLength={2} placeholder="SP" style={fI} />
            </Field>
          </div>
        </SectionCard>

        {/* ── 3. IDENTIDADE VISUAL ──────────────────────────────── */}
        <SectionCard
          title="Identidade Visual"
          subtitle="Cores da marca, tipografia e preview do brandkit"
          icon={Palette}
          delay={0.1}
        >
          {/* Colors */}
          <Grid cols={2}>
            <Field label="Cor Primária (Brand)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={form.corPrimaria}
                  onChange={e => update('corPrimaria', e.target.value)}
                  style={{
                    width: 42, height: 42, borderRadius: T.radius.md,
                    border: `1.5px solid ${T.border}`, cursor: 'pointer',
                    background: 'none', padding: 2, flexShrink: 0,
                  }}
                />
                <input
                  type="text"
                  value={form.corPrimaria}
                  onChange={e => update('corPrimaria', e.target.value)}
                  style={{ ...fI, fontFamily: 'var(--font-mono)', fontSize: 13, flex: 1 }}
                />
              </div>
            </Field>
            <Field label="Cor Secundária">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={form.corSecundaria}
                  onChange={e => update('corSecundaria', e.target.value)}
                  style={{
                    width: 42, height: 42, borderRadius: T.radius.md,
                    border: `1.5px solid ${T.border}`, cursor: 'pointer',
                    background: 'none', padding: 2, flexShrink: 0,
                  }}
                />
                <input
                  type="text"
                  value={form.corSecundaria}
                  onChange={e => update('corSecundaria', e.target.value)}
                  style={{ ...fI, fontFamily: 'var(--font-mono)', fontSize: 13, flex: 1 }}
                />
              </div>
            </Field>
          </Grid>

          {/* Font selection */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Tipografia Display
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FONT_OPTIONS.map(opt => (
                <label
                  key={opt.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: T.radius.lg,
                    border: `1.5px solid ${form.fonte === opt.id ? 'var(--accent-400)' : T.border}`,
                    background: form.fonte === opt.id ? 'color-mix(in srgb, var(--accent-400) 5%, var(--bg-elevated))' : T.elevated,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="radio"
                    name="fonte"
                    value={opt.id}
                    checked={form.fonte === opt.id}
                    onChange={() => update('fonte', opt.id)}
                    style={{ accentColor: 'var(--accent-400)', width: 16, height: 16, flexShrink: 0 }}
                  />
                  <div>
                    <span style={{ fontSize: 15, fontFamily: opt.family, fontWeight: 700, color: T.text }}>
                      {opt.label}
                    </span>
                    <p style={{ fontSize: 11, color: T.textDim, margin: '2px 0 0', fontFamily: T.font.sans }}>
                      Imóveis de Alto Padrão
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Brand preview */}
          <div style={{ borderRadius: T.radius.lg, overflow: 'hidden', border: `1px solid ${T.border}` }}>
            <div style={{ background: form.corSecundaria, padding: '14px 20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', fontFamily: T.font.mono }}>
                PREVIEW · BRANDKIT
              </div>
              <div style={{
                fontSize: 20, fontWeight: 700, color: 'var(--text-inverse)', marginTop: 4,
                fontFamily: FONT_OPTIONS.find(f => f.id === form.fonte)?.family ?? 'Georgia, serif',
              }}>
                {form.nomeFantasia || 'IMI Imóveis'}
              </div>
            </div>
            <div style={{ padding: '14px 20px', background: T.elevated, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                height: 34, padding: '0 16px', borderRadius: T.radius.md,
                background: form.corPrimaria,
                display: 'inline-flex', alignItems: 'center',
                fontSize: 13, fontWeight: 600, color: 'var(--text-inverse)', fontFamily: T.font.sans,
              }}>
                Ver Imóveis
              </div>
              <span style={{ fontSize: 13, color: form.corPrimaria, fontWeight: 600, fontFamily: T.font.sans }}>
                Saiba mais →
              </span>
            </div>
          </div>
        </SectionCard>

        {/* ── 4. CONFIGURAÇÕES REGIONAIS ────────────────────────── */}
        <SectionCard
          title="Configurações Regionais"
          subtitle="Moeda, idioma, formato de data e fuso horário"
          icon={Globe}
          delay={0.15}
        >
          <Grid cols={2}>
            <Field label="Moeda">
              <select
                value={form.moeda}
                onChange={e => update('moeda', e.target.value as OrgForm['moeda'])}
                style={{ ...fI, cursor: 'pointer' }}
              >
                <option value="BRL">BRL — Real Brasileiro (R$)</option>
                <option value="USD">USD — Dólar Americano ($)</option>
                <option value="AED">AED — Dirham Emirados (AED)</option>
              </select>
            </Field>
            <Field label="Idioma Padrão">
              <select
                value={form.idioma}
                onChange={e => update('idioma', e.target.value as OrgForm['idioma'])}
                style={{ ...fI, cursor: 'pointer' }}
              >
                <option value="pt">Português (Brasil)</option>
                <option value="en">English (US)</option>
              </select>
            </Field>
          </Grid>

          <Grid cols={2}>
            <Field label="Formato de Data">
              <select
                value={form.formatoData}
                onChange={e => update('formatoData', e.target.value as OrgForm['formatoData'])}
                style={{ ...fI, cursor: 'pointer' }}
              >
                <option value="dd/mm/yyyy">DD/MM/AAAA (padrão BR)</option>
                <option value="mm/dd/yyyy">MM/DD/YYYY (padrão US)</option>
                <option value="yyyy-mm-dd">AAAA-MM-DD (ISO)</option>
              </select>
            </Field>
            <Field label="Fuso Horário">
              <select
                value={form.fusoHorario}
                onChange={e => update('fusoHorario', e.target.value)}
                style={{ ...fI, cursor: 'pointer' }}
              >
                <option value="America/Sao_Paulo">America/Sao_Paulo (BRT −3)</option>
                <option value="America/Manaus">America/Manaus (AMT −4)</option>
                <option value="America/Belem">America/Belem (BRT −3)</option>
                <option value="America/Fortaleza">America/Fortaleza (BRT −3)</option>
                <option value="America/New_York">America/New_York (EST −5)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST +4)</option>
                <option value="Europe/Lisbon">Europe/Lisbon (WET +0)</option>
                <option value="UTC">UTC +0</option>
              </select>
            </Field>
          </Grid>
        </SectionCard>

        {/* ── 5. DADOS DA LICENÇA ───────────────────────────────── */}
        <SectionCard
          title="Dados da Licença"
          subtitle="Registros profissionais — apenas leitura"
          icon={Shield}
          delay={0.2}
        >
          {/* Gold badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginBottom: 18, padding: '5px 14px', borderRadius: T.radius.full,
            background: 'color-mix(in srgb, var(--accent-400) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent-400) 25%, transparent)',
            color: 'var(--accent-400)', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.04em',
          }}>
            <Shield size={12} />
            LICENÇA VERIFICADA
          </div>

          <Grid cols={3}>
            <Field label="CRECI" readOnly>
              <div style={{ position: 'relative' }}>
                <input type="text" value={form.creci} readOnly style={readonlyI} />
                <AlertCircle size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-400)', pointerEvents: 'none' }} />
              </div>
            </Field>
            <Field label="CNAI" readOnly>
              <div style={{ position: 'relative' }}>
                <input type="text" value={form.cnai} readOnly style={readonlyI} />
                <AlertCircle size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-400)', pointerEvents: 'none' }} />
              </div>
            </Field>
            <Field label="Validade da Licença" readOnly>
              <div style={{ position: 'relative' }}>
                <input type="text" value={form.validadeLicenca} readOnly style={readonlyI} />
                <AlertCircle size={13} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-400)', pointerEvents: 'none' }} />
              </div>
            </Field>
          </Grid>

          <p style={{ fontSize: 12, color: T.textDim, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Shield size={11} style={{ color: T.textDim }} />
            Para atualizar os dados de licença, entre em contato com o suporte IMI.
          </p>
        </SectionCard>

      </div>

      {/* ── STICKY SAVE BAR ──────────────────────────────────────── */}
      <AnimatePresence>
        {(isDirty || savedOk) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 8000,
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 20px',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: T.radius.xl,
              boxShadow: 'var(--shadow-lg)',
              minWidth: 340,
              backdropFilter: 'blur(8px)',
            }}
          >
            {savedOk ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--success)', fontFamily: T.font.sans }}>
                <Check size={16} /> Salvo com sucesso!
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textMuted, fontFamily: T.font.sans }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }} />
                Alterações não salvas
              </span>
            )}

            {!savedOk && (
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <Btn
                  variant="outline"
                  size="sm"
                  onClick={() => { setForm(DEFAULT_FORM); setLogoPreview(null); setIsDirty(false) }}
                >
                  Descartar
                </Btn>
                <Btn
                  variant="primary"
                  size="sm"
                  loading={saving}
                  icon={saving ? undefined : <Save size={13} />}
                  onClick={handleSave}
                >
                  Salvar Alterações
                </Btn>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
