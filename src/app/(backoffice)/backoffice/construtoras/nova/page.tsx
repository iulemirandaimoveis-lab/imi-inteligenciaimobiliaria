'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Building2, FileText, User, Phone,
  Mail, MapPin, Save, Upload, X, Loader2, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

const T = {
  surface: 'var(--bo-surface)',
  elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  accent: 'var(--bo-accent)',
}

const inputStyle: React.CSSProperties = {
  background: T.elevated,
  border: `1px solid ${T.border}`,
  color: T.text,
  width: '100%',
  height: '44px',
  borderRadius: '12px',
  padding: '0 14px',
  fontSize: '14px',
  outline: 'none',
}

const cardStyle: React.CSSProperties = {
  background: T.surface,
  border: `1px solid ${T.border}`,
  borderRadius: '16px',
  padding: '24px',
}

export default function NovaConstrutora() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    razaoSocial: '', nomeFantasia: '', cnpj: '',
    inscricaoEstadual: '', inscricaoMunicipal: '',
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: 'Recife', estado: 'PE', pais: 'Brasil',
    telefone: '', celular: '', email: '', website: '',
    nomeResponsavel: '', cargoResponsavel: '', emailResponsavel: '', telefoneResponsavel: '',
    observacoes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n })
  }

  const validateForm = () => {
    const e: Record<string, string> = {}
    if (!formData.razaoSocial.trim()) e.razaoSocial = 'Razão social é obrigatória'
    if (!formData.nomeFantasia.trim()) e.nomeFantasia = 'Nome fantasia é obrigatório'
    if (!formData.cnpj.trim()) e.cnpj = 'CNPJ é obrigatório'
    if (!formData.telefone.trim()) e.telefone = 'Telefone é obrigatório'
    if (!formData.email.trim()) e.email = 'Email é obrigatório'
    if (!formData.cep.trim()) e.cep = 'CEP é obrigatório'
    if (!formData.logradouro.trim()) e.logradouro = 'Logradouro é obrigatório'
    if (!formData.bairro.trim()) e.bairro = 'Bairro é obrigatório'
    if (!formData.nomeResponsavel.trim()) e.nomeResponsavel = 'Nome do responsável é obrigatório'
    if (!formData.telefoneResponsavel.trim()) e.telefoneResponsavel = 'Telefone do responsável é obrigatório'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Email inválido'
    if (formData.cnpj && formData.cnpj.replace(/\D/g, '').length !== 14) e.cnpj = 'CNPJ deve ter 14 dígitos'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validateForm()) return
    setLoading(true)
    try {
      let logoUrl: string | null = null
      if (logoFile) {
        const { uploadFile } = await import('@/lib/supabase-storage')
        const result = await uploadFile(logoFile, 'developers', `new-${Date.now()}`)
        if (result.error) toast.error(`Erro no upload do logo: ${result.error}`)
        else logoUrl = result.url
      }
      const response = await fetch('/api/developers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, logo_url: logoUrl }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Erro ao salvar')
      toast.success('Construtora criada com sucesso!')
      router.push('/backoffice/construtoras')
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar construtora')
    } finally {
      setLoading(false)
    }
  }

  const formatCNPJ = (v: string) => v.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d)/, '$1-$2')

  const formatCEP = (v: string) => v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2')

  const formatPhone = (v: string) => v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')

  const field = (name: string, label: string, opts?: { required?: boolean; type?: string; placeholder?: string; mask?: (v: string) => string }) => (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>
        {label}{opts?.required && ' *'}
      </label>
      <input
        type={opts?.type || 'text'}
        name={name}
        value={(formData as any)[name]}
        onChange={opts?.mask ? e => setFormData(p => ({ ...p, [name]: opts.mask!(e.target.value) })) : handleChange}
        placeholder={opts?.placeholder}
        style={{ ...inputStyle, border: errors[name] ? '1px solid #ef4444' : `1px solid ${T.border}` }}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{errors[name]}</p>}
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
          <ArrowLeft size={18} style={{ color: T.textMuted }} />
        </button>
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Nova Construtora</h1>
          <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>Cadastre uma nova parceira</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={18} style={{ color: T.accent }} />
            <h2 className="text-base font-bold" style={{ color: T.text }}>Logo da Construtora</h2>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl flex items-center justify-center overflow-hidden relative"
              style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                  <button type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white"
                    style={{ background: '#ef4444' }}>
                    <X size={11} />
                  </button>
                </>
              ) : (
                <Building2 size={28} className="opacity-30" style={{ color: T.textMuted }} />
              )}
            </div>
            <div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setLogoFile(file)
                  const reader = new FileReader()
                  reader.onloadend = () => setLogoPreview(reader.result as string)
                  reader.readAsDataURL(file)
                }} />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                <Upload size={14} /> {logoPreview ? 'Trocar Logo' : 'Upload Logo'}
              </button>
              <p className="text-xs mt-2" style={{ color: T.textMuted }}>PNG, JPG ou SVG. Máx 2MB.</p>
            </div>
          </div>
        </div>

        {/* Dados da Empresa */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={18} style={{ color: T.accent }} />
            <h2 className="text-base font-bold" style={{ color: T.text }}>Dados da Empresa</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {field('razaoSocial', 'Razão Social', { required: true, placeholder: 'Ex: Construtora Central LTDA' })}
            {field('nomeFantasia', 'Nome Fantasia', { required: true, placeholder: 'Ex: Central Empreendimentos' })}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>CNPJ *</label>
              <input type="text" name="cnpj" value={formData.cnpj}
                onChange={e => setFormData(p => ({ ...p, cnpj: formatCNPJ(e.target.value) }))}
                placeholder="00.000.000/0000-00" maxLength={18}
                style={{ ...inputStyle, border: errors.cnpj ? '1px solid #ef4444' : `1px solid ${T.border}` }} />
              {errors.cnpj && <p className="mt-1 text-xs text-red-400 flex items-center gap-1"><AlertCircle size={11} />{errors.cnpj}</p>}
            </div>
            {field('inscricaoEstadual', 'Inscrição Estadual', { placeholder: '000.000.000.000' })}
            {field('inscricaoMunicipal', 'Inscrição Municipal', { placeholder: '000000-0' })}
          </div>
        </div>

        {/* Endereço */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <MapPin size={18} style={{ color: T.accent }} />
            <h2 className="text-base font-bold" style={{ color: T.text }}>Endereço</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>CEP *</label>
              <input type="text" name="cep" value={formData.cep} placeholder="00000-000" maxLength={9}
                onChange={e => setFormData(p => ({ ...p, cep: formatCEP(e.target.value) }))}
                style={{ ...inputStyle, border: errors.cep ? '1px solid #ef4444' : `1px solid ${T.border}` }} />
              {errors.cep && <p className="mt-1 text-xs text-red-400">{errors.cep}</p>}
            </div>
            <div className="md:col-span-2">
              {field('logradouro', 'Logradouro', { required: true, placeholder: 'Ex: Av. Boa Viagem' })}
            </div>
            {field('numero', 'Número', { placeholder: 'Ex: 4000' })}
            {field('complemento', 'Complemento', { placeholder: 'Ex: Sala 201' })}
            {field('bairro', 'Bairro', { required: true, placeholder: 'Ex: Boa Viagem' })}
            {field('cidade', 'Cidade')}
            {field('estado', 'Estado')}
            {field('pais', 'País')}
          </div>
        </div>

        {/* Contatos */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <Phone size={18} style={{ color: T.accent }} />
            <h2 className="text-base font-bold" style={{ color: T.text }}>Contatos</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Telefone *</label>
              <input type="text" name="telefone" value={formData.telefone} placeholder="(81) 3456-7890" maxLength={15}
                onChange={e => setFormData(p => ({ ...p, telefone: formatPhone(e.target.value) }))}
                style={{ ...inputStyle, border: errors.telefone ? '1px solid #ef4444' : `1px solid ${T.border}` }} />
              {errors.telefone && <p className="mt-1 text-xs text-red-400">{errors.telefone}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Celular</label>
              <input type="text" name="celular" value={formData.celular} placeholder="(81) 99876-5432" maxLength={15}
                onChange={e => setFormData(p => ({ ...p, celular: formatPhone(e.target.value) }))}
                style={inputStyle} />
            </div>
            {field('email', 'Email', { required: true, type: 'email', placeholder: 'contato@construtora.com.br' })}
            {field('website', 'Website', { type: 'url', placeholder: 'https://www.construtora.com.br' })}
          </div>
        </div>

        {/* Responsável */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-5">
            <User size={18} style={{ color: T.accent }} />
            <h2 className="text-base font-bold" style={{ color: T.text }}>Responsável</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {field('nomeResponsavel', 'Nome Completo', { required: true, placeholder: 'Ex: Carlos Mendonça' })}
            {field('cargoResponsavel', 'Cargo', { placeholder: 'Ex: Diretor Comercial' })}
            {field('emailResponsavel', 'Email', { type: 'email', placeholder: 'carlos@construtora.com.br' })}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: T.textMuted }}>Telefone *</label>
              <input type="text" name="telefoneResponsavel" value={formData.telefoneResponsavel} placeholder="(81) 99876-5432" maxLength={15}
                onChange={e => setFormData(p => ({ ...p, telefoneResponsavel: formatPhone(e.target.value) }))}
                style={{ ...inputStyle, border: errors.telefoneResponsavel ? '1px solid #ef4444' : `1px solid ${T.border}` }} />
              {errors.telefoneResponsavel && <p className="mt-1 text-xs text-red-400">{errors.telefoneResponsavel}</p>}
            </div>
          </div>
        </div>

        {/* Observações */}
        <div style={cardStyle}>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} style={{ color: T.accent }} />
            <h2 className="text-base font-bold" style={{ color: T.text }}>Observações</h2>
          </div>
          <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={4}
            placeholder="Informações adicionais sobre a construtora..."
            style={{
              background: T.elevated, border: `1px solid ${T.border}`, color: T.text,
              width: '100%', borderRadius: '12px', padding: '12px 14px', fontSize: '14px',
              outline: 'none', resize: 'vertical',
            }} />
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => router.back()}
            className="h-11 px-6 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
            Cancelar
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
            style={{ background: '#1E3A5F' }}>
            {loading ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : <><Save size={15} /> Salvar Construtora</>}
          </button>
        </div>
      </form>
    </div>
  )
}
