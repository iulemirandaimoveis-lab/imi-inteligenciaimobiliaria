'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Star,
  Edit,
  Home,
  Trash2,
  ExternalLink,
  Instagram,
  Linkedin,
  Calendar,
  FileText,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'

// Design tokens using --bo-* CSS variables
const T = {
  surface: 'var(--bo-surface)',
  surfaceAlt: 'var(--bo-surface-alt)',
  border: 'var(--bo-border)',
  text: 'var(--bo-text)',
  textMuted: 'var(--bo-text-muted)',
  accent: 'var(--bo-accent)',
}

interface Development {
  id: string
  name: string
  slug: string
  status: string
  status_comercial: string
  image: string | null
  city: string | null
  state: string | null
  min_price: number | null
  max_price: number | null
  total_units: number | null
  available_units: number | null
}

interface Developer {
  id: string
  slug: string
  name: string
  legal_name: string | null
  cnpj: string | null
  logo_url: string | null
  website: string | null
  email: string | null
  phone: string | null
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  instagram: string | null
  linkedin: string | null
  is_active: boolean
  display_order: number
  notes: string | null
  created_at: string
  updated_at: string
  developments: Development[]
}

export default function ConstrutoraDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<Developer | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'empreendimentos' | 'info'>('overview')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function fetchDeveloper() {
      try {
        const res = await fetch(`/api/developers?id=${params.id}`)
        if (!res.ok) throw new Error('Falha ao carregar construtora')
        const result = await res.json()
        setData(result)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDeveloper()
  }, [params.id])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/developers?id=${params.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao desativar')
      toast.success('Construtora desativada com sucesso')
      router.push('/backoffice/construtoras')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(1)}M`
    if (price >= 1000) return `R$ ${(price / 1000).toFixed(0)}k`
    return `R$ ${price.toLocaleString('pt-BR')}`
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      lancamento: 'var(--bo-accent)',
      em_construcao: '#F59E0B',
      pronto: '#10B981',
      em_obras: '#F59E0B',
      archived: '#6B7280',
    }
    return colors[status] || '#6B7280'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      lancamento: 'Lançamento',
      em_construcao: 'Em Construção',
      em_obras: 'Em Obras',
      pronto: 'Pronto',
      archived: 'Arquivado',
    }
    return labels[status] || status
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: T.accent }} />
          <p style={{ color: T.textMuted }}>Carregando construtora...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-400" />
          <h2 className="text-lg font-bold mb-2" style={{ color: T.text }}>Erro ao carregar</h2>
          <p className="text-sm mb-4" style={{ color: T.textMuted }}>{error || 'Construtora não encontrada'}</p>
          <button
            onClick={() => router.push('/backoffice/construtoras')}
            className="px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: T.accent }}
          >
            Voltar para lista
          </button>
        </div>
      </div>
    )
  }

  const developments = data.developments || []
  const activeDevelopments = developments.filter(d => d.status_comercial !== 'archived')
  const totalUnits = developments.reduce((acc, d) => acc + (d.total_units || 0), 0)
  const availableUnits = developments.reduce((acc, d) => acc + (d.available_units || 0), 0)
  const soldUnits = totalUnits - availableUnits

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 hover:opacity-80"
            style={{ border: `1px solid ${T.border}`, color: T.text }}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ border: `1px solid ${T.border}`, background: T.surfaceAlt }}
            >
              {data.logo_url ? (
                <img src={data.logo_url} alt={data.name} className="w-full h-full object-contain p-1" />
              ) : (
                <Building2 size={28} style={{ color: T.textMuted }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold" style={{ color: T.text }}>{data.name}</h1>
                <span
                  className="px-3 py-1 rounded-lg text-xs font-medium"
                  style={{
                    backgroundColor: data.is_active ? 'rgba(16,185,129,0.15)' : 'rgba(107,114,128,0.15)',
                    color: data.is_active ? '#10B981' : '#6B7280',
                  }}
                >
                  {data.is_active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              {data.legal_name && (
                <p className="text-sm" style={{ color: T.textMuted }}>{data.legal_name}</p>
              )}
              {data.cnpj && (
                <p className="text-xs font-mono mt-1" style={{ color: T.textMuted }}>{data.cnpj}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/backoffice/construtoras/${params.id}/editar`}
            className="flex items-center gap-2 h-10 px-5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-colors"
            style={{ backgroundColor: T.accent }}
          >
            <Edit size={16} />
            Editar
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-medium transition-colors hover:bg-red-500/20"
            style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-400" />
            <p className="text-sm" style={{ color: T.text }}>
              Tem certeza que deseja desativar <strong>{data.name}</strong>?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ color: T.textMuted }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium bg-red-500 hover:bg-red-600 disabled:opacity-50"
            >
              {deleting ? 'Desativando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <p className="text-xs mb-1" style={{ color: T.textMuted }}>Empreendimentos</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--bo-accent)' }}>{activeDevelopments.length}</p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <p className="text-xs mb-1" style={{ color: T.textMuted }}>Total Unidades</p>
          <p className="text-2xl font-bold" style={{ color: T.text }}>{totalUnits}</p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <p className="text-xs mb-1" style={{ color: T.textMuted }}>Vendidas</p>
          <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{soldUnits}</p>
        </div>
        <div className="rounded-xl p-4" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <p className="text-xs mb-1" style={{ color: T.textMuted }}>Disponíveis</p>
          <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{availableUnits}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex gap-6">
          {([
            { key: 'overview', label: 'Visão Geral' },
            { key: 'empreendimentos', label: `Empreendimentos (${activeDevelopments.length})` },
            { key: 'info', label: 'Informações' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="pb-4 px-2 text-sm font-medium transition-colors"
              style={{
                borderBottom: `2px solid ${activeTab === tab.key ? T.accent : 'transparent'}`,
                color: activeTab === tab.key ? T.accent : T.textMuted,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Dados Cadastrais */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
              <h2 className="text-lg font-bold mb-6" style={{ color: T.text }}>Dados Cadastrais</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {data.cnpj && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>CNPJ</p>
                    <p className="text-sm font-medium font-mono" style={{ color: T.text }}>{data.cnpj}</p>
                  </div>
                )}
                {data.email && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Email</p>
                    <p className="text-sm font-medium" style={{ color: T.text }}>{data.email}</p>
                  </div>
                )}
                {data.phone && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Telefone</p>
                    <p className="text-sm font-medium" style={{ color: T.text }}>{data.phone}</p>
                  </div>
                )}
                {data.website && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Website</p>
                    <a
                      href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium flex items-center gap-1 hover:underline"
                      style={{ color: T.accent }}
                    >
                      {data.website}
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
                {data.address && (
                  <div className="md:col-span-2">
                    <p className="text-xs mb-1" style={{ color: T.textMuted }}>Endereço</p>
                    <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: T.text }}>
                      <MapPin size={14} style={{ color: T.textMuted }} />
                      {data.address}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description / Notes */}
            {(data.description || data.notes) && (
              <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>
                  {data.description ? 'Descrição' : 'Observações'}
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: T.textMuted }}>
                  {data.description || data.notes}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Links */}
            {(data.instagram || data.linkedin || data.website) && (
              <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
                <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>Links</h2>
                <div className="space-y-3">
                  {data.instagram && (
                    <a
                      href={data.instagram.startsWith('http') ? data.instagram : `https://instagram.com/${data.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm hover:underline"
                      style={{ color: T.accent }}
                    >
                      <Instagram size={16} />
                      {data.instagram}
                    </a>
                  )}
                  {data.linkedin && (
                    <a
                      href={data.linkedin.startsWith('http') ? data.linkedin : `https://linkedin.com/company/${data.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm hover:underline"
                      style={{ color: T.accent }}
                    >
                      <Linkedin size={16} />
                      LinkedIn
                    </a>
                  )}
                  {data.website && (
                    <a
                      href={data.website.startsWith('http') ? data.website : `https://${data.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm hover:underline"
                      style={{ color: T.accent }}
                    >
                      <Globe size={16} />
                      {data.website}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>Timeline</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs mb-1" style={{ color: T.textMuted }}>Cadastrado em</p>
                  <p className="text-sm font-medium" style={{ color: T.text }}>
                    {new Date(data.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: T.textMuted }}>Última atualização</p>
                  <p className="text-sm font-medium" style={{ color: T.text }}>
                    {new Date(data.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.text }}>Ações Rápidas</h2>
              <div className="space-y-2">
                <Link
                  href={`/backoffice/construtoras/${params.id}/editar`}
                  className="flex items-center gap-2.5 text-sm p-2.5 rounded-lg hover:opacity-80 transition-colors"
                  style={{ backgroundColor: T.surfaceAlt, color: T.text }}
                >
                  <Edit size={16} style={{ color: T.accent }} />
                  Editar dados
                </Link>
                <Link
                  href="/backoffice/imoveis/novo"
                  className="flex items-center gap-2.5 text-sm p-2.5 rounded-lg hover:opacity-80 transition-colors"
                  style={{ backgroundColor: T.surfaceAlt, color: T.text }}
                >
                  <Home size={16} style={{ color: T.accent }} />
                  Criar novo empreendimento
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === EMPREENDIMENTOS TAB === */}
      {activeTab === 'empreendimentos' && (
        <div className="space-y-4">
          {activeDevelopments.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{ backgroundColor: T.surface, border: `1px dashed ${T.border}` }}
            >
              <Home size={32} className="mx-auto mb-3" style={{ color: T.textMuted }} />
              <h3 className="text-sm font-bold mb-1" style={{ color: T.text }}>Nenhum empreendimento</h3>
              <p className="text-xs mb-4" style={{ color: T.textMuted }}>
                Esta construtora ainda não possui empreendimentos vinculados.
              </p>
              <Link
                href="/backoffice/imoveis/novo"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: T.accent }}
              >
                Criar Empreendimento
              </Link>
            </div>
          ) : (
            activeDevelopments.map((dev) => (
              <Link
                key={dev.id}
                href={`/backoffice/imoveis/${dev.id}`}
                className="block rounded-2xl p-5 hover:opacity-90 transition-all"
                style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div
                    className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: T.surfaceAlt }}
                  >
                    {dev.image ? (
                      <img src={dev.image} alt={dev.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={24} style={{ color: T.textMuted }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-bold" style={{ color: T.text }}>{dev.name}</h3>
                        {(dev.city || dev.state) && (
                          <p className="text-xs" style={{ color: T.textMuted }}>
                            {[dev.city, dev.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0"
                        style={{
                          backgroundColor: `${getStatusColor(dev.status_comercial || dev.status)}20`,
                          color: getStatusColor(dev.status_comercial || dev.status),
                        }}
                      >
                        {getStatusLabel(dev.status_comercial || dev.status)}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 mt-2">
                      {dev.total_units != null && (
                        <div>
                          <span className="text-xs" style={{ color: T.textMuted }}>Unidades: </span>
                          <span className="text-sm font-bold" style={{ color: T.text }}>{dev.total_units}</span>
                        </div>
                      )}
                      {dev.available_units != null && (
                        <div>
                          <span className="text-xs" style={{ color: T.textMuted }}>Disponíveis: </span>
                          <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>{dev.available_units}</span>
                        </div>
                      )}
                      {dev.min_price != null && (
                        <div>
                          <span className="text-xs" style={{ color: T.textMuted }}>A partir de </span>
                          <span className="text-sm font-bold" style={{ color: '#10B981' }}>{formatPrice(dev.min_price)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* === INFO TAB === */}
      {activeTab === 'info' && (
        <div className="rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
          <h2 className="text-lg font-bold mb-6" style={{ color: T.text }}>Todas as Informações</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries({
              'ID': data.id,
              'Slug': data.slug,
              'Nome': data.name,
              'Razão Social': data.legal_name,
              'CNPJ': data.cnpj,
              'Email': data.email,
              'Telefone': data.phone,
              'Website': data.website,
              'Endereço': data.address,
              'Cidade': data.city,
              'Estado': data.state,
              'Instagram': data.instagram,
              'LinkedIn': data.linkedin,
              'Status': data.is_active ? 'Ativa' : 'Inativa',
              'Ordem de Exibição': data.display_order,
              'Descrição': data.description,
              'Observações': data.notes,
              'Criado em': new Date(data.created_at).toLocaleString('pt-BR'),
              'Atualizado em': new Date(data.updated_at).toLocaleString('pt-BR'),
            }).map(([key, value]) => (
              value != null && value !== '' && (
                <div key={key} className={key === 'Descrição' || key === 'Observações' || key === 'Endereço' ? 'md:col-span-2' : ''}>
                  <p className="text-xs mb-1" style={{ color: T.textMuted }}>{key}</p>
                  <p className="text-sm font-medium break-all" style={{ color: T.text }}>
                    {String(value)}
                  </p>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
