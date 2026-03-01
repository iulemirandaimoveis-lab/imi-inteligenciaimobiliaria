'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  Instagram,
  Linkedin,
  Upload,
  X,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'

// Design tokens
const T = {
  surface: 'var(--bo-surface)',
  surfaceAlt: 'var(--bo-surface-alt)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  accent: 'var(--bo-accent)',
}

export default function EditarConstrutoraPage() {
  const params = useParams()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    cnpj: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    description: '',
    notes: '',
    instagram: '',
    linkedin: '',
    logo_url: '',
    is_active: true,
    display_order: 0,
  })

  useEffect(() => {
    async function fetchDeveloper() {
      try {
        const res = await fetch(`/api/developers?id=${params.id}`)
        if (!res.ok) throw new Error('Falha ao carregar')
        const data = await res.json()

        setFormData({
          name: data.name || '',
          legal_name: data.legal_name || '',
          cnpj: data.cnpj || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          description: data.description || '',
          notes: data.notes || '',
          instagram: data.instagram || '',
          linkedin: data.linkedin || '',
          logo_url: data.logo_url || '',
          is_active: data.is_active ?? true,
          display_order: data.display_order || 0,
        })

        if (data.logo_url) {
          setLogoPreview(data.logo_url)
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDeveloper()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setLogoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setFormData(prev => ({ ...prev, logo_url: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      let logoUrl = formData.logo_url

      // Upload new logo if selected
      if (logoFile) {
        const { uploadFile } = await import('@/lib/supabase-storage')
        const result = await uploadFile(logoFile, 'developers', `${params.id}`)
        if (result.error) {
          toast.error(`Erro no upload do logo: ${result.error}`)
        } else {
          logoUrl = result.url
        }
      }

      const updatePayload = {
        id: params.id,
        name: formData.name,
        legal_name: formData.legal_name || null,
        cnpj: formData.cnpj || null,
        email: formData.email || null,
        phone: formData.phone || null,
        website: formData.website || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        description: formData.description || null,
        notes: formData.notes || null,
        instagram: formData.instagram || null,
        linkedin: formData.linkedin || null,
        logo_url: logoUrl || null,
        is_active: formData.is_active,
        display_order: formData.display_order,
      }

      const res = await fetch('/api/developers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao salvar')
      }

      toast.success('Construtora atualizada com sucesso!')
      router.push(`/backoffice/construtoras/${params.id}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.accent }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <p style={{ color: T.text }}>{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 rounded-xl text-white text-sm"
            style={{ backgroundColor: T.accent }}
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  const inputStyle = {
    backgroundColor: T.surfaceAlt,
    border: `1px solid ${T.border}`,
    color: T.text,
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
          style={{ border: `1px solid ${T.border}`, color: T.text }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: T.text }}>Editar Construtora</h1>
          <p className="text-sm mt-1" style={{ color: T.textMuted }}>{formData.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-6">
            <ImageIcon size={20} style={{ color: T.accent }} />
            <h2 className="text-lg font-bold" style={{ color: T.text }}>Logo</h2>
          </div>
          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden relative"
              style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}` }}
            >
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <Building2 size={32} style={{ color: T.textMuted }} />
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
                style={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.text }}
              >
                <Upload size={16} />
                {logoPreview ? 'Trocar Logo' : 'Upload Logo'}
              </button>
              <p className="text-xs mt-2" style={{ color: T.textMuted }}>PNG, JPG ou SVG. Máx 2MB.</p>
            </div>
          </div>
        </div>

        {/* Dados da Empresa */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-6">
            <Building2 size={20} style={{ color: T.accent }} />
            <h2 className="text-lg font-bold" style={{ color: T.text }}>Dados da Empresa</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Nome *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Razão Social</label>
              <input
                type="text"
                name="legal_name"
                value={formData.legal_name}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>CNPJ</label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Status</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="w-5 h-5 rounded accent-[#334E68]"
                  />
                  <span className="text-sm" style={{ color: T.text }}>
                    {formData.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </label>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Ordem</label>
                <input
                  type="number"
                  name="display_order"
                  value={formData.display_order}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-6">
            <Phone size={20} style={{ color: T.accent }} />
            <h2 className="text-lg font-bold" style={{ color: T.text }}>Contato</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Telefone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Website</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-6">
            <MapPin size={20} style={{ color: T.accent }} />
            <h2 className="text-lg font-bold" style={{ color: T.text }}>Endereço</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-3">
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Endereço Completo</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Cidade</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Estado</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
                maxLength={2}
              />
            </div>
          </div>
        </div>

        {/* Redes Sociais */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-6">
            <Globe size={20} style={{ color: T.accent }} />
            <h2 className="text-lg font-bold" style={{ color: T.text }}>Redes Sociais</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Instagram</label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
                placeholder="@construtora"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>LinkedIn</label>
              <input
                type="text"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68]"
                style={inputStyle}
                placeholder="URL ou nome da página"
              />
            </div>
          </div>
        </div>

        {/* Descrição e Observações */}
        <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-6">
            <FileText size={20} style={{ color: T.accent }} />
            <h2 className="text-lg font-bold" style={{ color: T.text }}>Descrição e Observações</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68] resize-none"
                style={inputStyle}
                placeholder="Descrição da construtora para exibição pública..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: T.text }}>Observações internas</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#334E68] resize-none"
                style={inputStyle}
                placeholder="Notas internas sobre a construtora..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-11 px-6 rounded-xl font-medium transition-colors hover:opacity-80"
            style={{ border: `1px solid ${T.border}`, color: T.text }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 h-11 px-6 rounded-xl text-white font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: T.accent }}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
