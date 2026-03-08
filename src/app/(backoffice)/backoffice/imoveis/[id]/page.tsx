'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MapPin,
  Building2,
  Bed,
  Bath,
  Ruler,
  Car,
  Edit,
  Trash2,
  CheckCircle,
  Calendar,
  Loader2,
  Image as ImageIcon,
  ExternalLink,
  Tag,
  Star,
  Globe,
  FileText,
  QrCode,
} from 'lucide-react'

const T = {
  bg: 'transparent', surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
  border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
  text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)', textDim: 'var(--bo-text-muted)',
  gold: 'var(--bo-accent)',
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  disponivel: { label: 'Disponível', color: '#6BB87B', bg: 'rgba(107,184,123,0.12)' },
  em_negociacao: { label: 'Negociação', color: 'var(--bo-accent)', bg: 'var(--bo-active-bg)' },
  reservado: { label: 'Reservado', color: '#A89EC4', bg: 'rgba(168,158,196,0.12)' },
  vendido: { label: 'Vendido', color: '#7B9EC4', bg: 'rgba(123,158,196,0.12)' },
  lancamento: { label: 'Lançamento', color: '#E8A87C', bg: 'rgba(232,168,124,0.12)' },
  arquivado: { label: 'Arquivado', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
}

const formatPrice = (price: number) => {
  if (!price) return 'N/A'
  if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(1).replace('.', ',')}M`
  if (price >= 1000) return `R$ ${Math.floor(price / 1000)}k`
  return `R$ ${price.toLocaleString('pt-BR')}`
}

export default function ImovelDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'gallery' | 'info'>('overview')

  useEffect(() => {
    const fetchDevelopment = async () => {
      try {
        const res = await fetch(`/api/developments?id=${params.id}`)
        if (!res.ok) throw new Error('Erro ao carregar')
        const d = await res.json()
        setData(d)
      } catch (err: any) {
        console.error(err)
        toast.error('Erro ao carregar empreendimento')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchDevelopment()
  }, [params.id])

  const handleDelete = async () => {
    toast.warning('Arquivar este empreendimento?', {
      action: {
        label: 'Sim, arquivar',
        onClick: async () => {
          setDeleting(true)
          try {
            const res = await fetch(`/api/developments?id=${params.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Erro ao arquivar')
            toast.success('Empreendimento arquivado com sucesso')
            router.push('/backoffice/imoveis')
          } catch (err: any) {
            toast.error(err.message)
          } finally {
            setDeleting(false)
          }
        },
      },
      duration: 6000,
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: T.gold }} />
          <p style={{ color: T.textDim }}>Carregando empreendimento...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Building2 size={48} className="mx-auto mb-4" style={{ color: T.textDim }} />
          <p className="text-lg font-semibold mb-2" style={{ color: T.text }}>Empreendimento não encontrado</p>
          <button onClick={() => router.push('/backoffice/imoveis')} className="text-sm underline" style={{ color: T.gold }}>
            Voltar à lista
          </button>
        </div>
      </div>
    )
  }

  const status = STATUS_MAP[data.status] || STATUS_MAP.disponivel
  const features = Array.isArray(data.features) ? data.features : []
  const galleryImages = Array.isArray(data.gallery_images) ? data.gallery_images : (Array.isArray(data.images) ? (typeof data.images[0] === 'string' ? data.images : []) : [])
  const coverImage = data.image || (galleryImages.length > 0 ? galleryImages[0] : null)
  const developerInfo = data.developers || null

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ border: `1px solid ${T.border}`, background: T.surface }}
          >
            <ArrowLeft size={20} style={{ color: T.text }} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold" style={{ color: T.text }}>
                {data.name}
              </h1>
              {data.is_highlighted && <Star size={18} style={{ fill: T.gold, color: T.gold }} />}
            </div>
            <div className="flex items-center gap-4 text-sm" style={{ color: T.textDim }}>
              {data.address && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {data.address}{data.neighborhood ? `, ${data.neighborhood}` : ''}
                </span>
              )}
              {(developerInfo?.name || data.developer) && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Building2 size={14} />
                    {developerInfo?.name || data.developer}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const propertyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'}/pt/imoveis/${data.slug || params.id}`
              const name = encodeURIComponent(data.name || 'Imóvel')
              router.push(`/backoffice/tracking/qr?propertyId=${params.id}&propertyName=${name}&propertyUrl=${encodeURIComponent(propertyUrl)}`)
            }}
            className="h-10 px-4 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.text }}
            title="QR Tracking"
          >
            <QrCode size={16} />
            <span className="hidden sm:inline">QR</span>
          </button>
          <button
            onClick={() => router.push(`/backoffice/imoveis/${params.id}/editar`)}
            className="h-10 px-4 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold text-white"
            style={{ background: T.gold }}
          >
            <Edit size={16} />
            <span className="hidden sm:inline">Editar</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="h-10 px-4 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            style={{ border: `1px solid ${T.border}`, color: '#EF4444', background: T.surface }}
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span className="hidden sm:inline">{deleting ? 'Arquivando...' : 'Arquivar'}</span>
          </button>
        </div>
      </div>

      {/* Status & Price Badges */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="px-4 py-2 rounded-xl" style={{ background: status.bg, border: `1px solid ${status.color}33` }}>
          <span className="text-sm font-medium" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>
        {(data.tipo || data.property_type) && (
          <div className="px-4 py-2 rounded-xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
            <span className="text-sm font-medium flex items-center gap-1.5" style={{ color: T.textSub }}>
              <Tag size={13} /> {data.tipo || data.property_type}
            </span>
          </div>
        )}
        {(data.price_min || data.price_max) && (
          <div className="px-4 py-2 rounded-xl" style={{ background: 'var(--bo-active-bg)', border: `1px solid ${T.borderGold}` }}>
            <span className="text-sm font-bold" style={{ color: T.gold }}>
              {data.price_min && data.price_max
                ? `${formatPrice(data.price_min)} - ${formatPrice(data.price_max)}`
                : formatPrice(data.price_min || data.price_max)}
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Ruler, label: 'Área', value: data.private_area ? `${data.private_area}m²` : 'N/A', color: '#6BB87B' },
          { icon: Bed, label: 'Quartos', value: data.bedrooms || 'N/A', color: '#7B9EC4' },
          { icon: Bath, label: 'Banheiros', value: data.bathrooms || 'N/A', color: '#A89EC4' },
          { icon: Car, label: 'Vagas', value: data.parking_spaces || 'N/A', color: '#E8A87C' },
        ].map((kpi, i) => (
          <div key={i} className="rounded-2xl p-4" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={16} style={{ color: kpi.color }} />
              <p className="text-xs" style={{ color: T.textDim }}>{kpi.label}</p>
            </div>
            <p className="text-2xl font-bold" style={{ color: T.text }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: `1px solid ${T.border}` }}>
        <div className="flex gap-6">
          {[
            { key: 'overview', label: 'Visão Geral' },
            { key: 'gallery', label: 'Galeria' },
            { key: 'info', label: 'Informações' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="pb-4 px-2 text-sm font-medium transition-colors"
              style={{
                borderBottom: `2px solid ${activeTab === tab.key ? T.gold : 'transparent'}`,
                color: activeTab === tab.key ? T.gold : T.textDim,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
              {coverImage ? (
                <img src={coverImage} alt={data.name} className="w-full h-80 object-cover" />
              ) : (
                <div className="h-80 flex items-center justify-center" style={{ background: T.elevated }}>
                  <ImageIcon size={64} style={{ color: T.textDim }} />
                </div>
              )}
            </div>

            {/* Description */}
            {data.description && (
              <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Sobre o Empreendimento</h2>
                <div className="prose prose-sm max-w-none leading-relaxed whitespace-pre-line" style={{ color: T.textSub }}>
                  {data.description}
                </div>
              </div>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Diferenciais</h2>
                <div className="flex flex-wrap gap-2">
                  {features.map((f: string, i: number) => (
                    <span key={i} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl" style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub }}>
                      <CheckCircle size={13} style={{ color: T.gold }} />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Developer Card */}
            {(developerInfo || data.developer) && (
              <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: T.gold }}>Construtora</h3>
                <div className="flex items-center gap-3 mb-4">
                  {developerInfo?.logo_url ? (
                    <img src={developerInfo.logo_url} alt={developerInfo.name} className="w-10 h-10 rounded-lg object-contain" style={{ background: T.elevated }} />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: T.elevated }}>
                      <Building2 size={18} style={{ color: T.gold }} />
                    </div>
                  )}
                  <p className="font-bold" style={{ color: T.text }}>{developerInfo?.name || data.developer}</p>
                </div>
                {developerInfo?.email && <p className="text-sm mb-1" style={{ color: T.textSub }}>{developerInfo.email}</p>}
                {developerInfo?.phone && <p className="text-sm" style={{ color: T.textSub }}>{developerInfo.phone}</p>}
              </div>
            )}

            {/* Timeline */}
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: T.gold }}>Cronograma</h3>
              <div className="space-y-4">
                {data.delivery_date && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: T.textDim }}>Entrega Prevista</p>
                    <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: T.text }}>
                      <Calendar size={14} />
                      {new Date(data.delivery_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}
                {data.created_at && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: T.textDim }}>Cadastrado em</p>
                    <p className="text-sm font-medium" style={{ color: T.text }}>{new Date(data.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing */}
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: T.gold }}>Valores</h3>
              <div className="space-y-3">
                {data.price_min && <div className="flex justify-between"><span className="text-sm" style={{ color: T.textDim }}>Preço Mínimo</span><span className="text-sm font-bold" style={{ color: T.text }}>{formatPrice(data.price_min)}</span></div>}
                {data.price_max && <div className="flex justify-between"><span className="text-sm" style={{ color: T.textDim }}>Preço Máximo</span><span className="text-sm font-bold" style={{ color: T.text }}>{formatPrice(data.price_max)}</span></div>}
                {data.price_per_sqm && <div className="flex justify-between"><span className="text-sm" style={{ color: T.textDim }}>Preço/m²</span><span className="text-sm font-bold" style={{ color: T.text }}>{formatPrice(data.price_per_sqm)}</span></div>}
                {data.units_count && <div className="flex justify-between pt-3" style={{ borderTop: `1px solid ${T.border}` }}><span className="text-sm" style={{ color: T.textDim }}>Total Unidades</span><span className="text-sm font-bold" style={{ color: T.text }}>{data.units_count}</span></div>}
                {data.available_units && <div className="flex justify-between"><span className="text-sm" style={{ color: T.textDim }}>Disponíveis</span><span className="text-sm font-bold" style={{ color: '#6BB87B' }}>{data.available_units}</span></div>}
              </div>
            </div>

            {/* Quick Links */}
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4" style={{ color: T.gold }}>Links Rápidos</h3>
              <div className="space-y-2">
                {data.slug && (
                  <a href={`/pt/imoveis/${data.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm p-2.5 rounded-xl transition-colors" style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub }}>
                    <Globe size={14} style={{ color: T.gold }} /> Ver no site público <ExternalLink size={12} className="ml-auto" />
                  </a>
                )}
                {data.brochure_url && (
                  <a href={data.brochure_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm p-2.5 rounded-xl transition-colors" style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub }}>
                    <FileText size={14} style={{ color: T.gold }} /> Download Brochure <ExternalLink size={12} className="ml-auto" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          <h2 className="text-lg font-bold mb-6" style={{ color: T.text }}>Galeria de Imagens</h2>
          {galleryImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((url: string, i: number) => (
                <div key={i} className="relative group rounded-xl overflow-hidden cursor-pointer" style={{ border: `1px solid ${T.border}` }}>
                  <img src={url} alt={`${data.name} ${i + 1}`} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <ImageIcon size={48} className="mx-auto mb-3" style={{ color: T.textDim }} />
              <p className="text-sm" style={{ color: T.textDim }}>Nenhuma imagem cadastrada</p>
              <button onClick={() => router.push(`/backoffice/imoveis/${params.id}/editar`)} className="text-sm mt-3 underline" style={{ color: T.gold }}>
                Adicionar imagens
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <h2 className="text-lg font-bold mb-6" style={{ color: T.text }}>Dados Completos</h2>
            <div className="space-y-3">
              {[
                ['ID', data.id],
                ['Slug', data.slug],
                ['Nome', data.name],
                ['Tipo', data.tipo || data.property_type],
                ['Status', data.status],
                ['Status Comercial', data.status_comercial],
                ['Endereço', data.address],
                ['Bairro', data.neighborhood],
                ['Cidade', data.city],
                ['Estado', data.state],
                ['País', data.country],
                ['Área Privativa', data.private_area ? `${data.private_area}m²` : null],
                ['Quartos', data.bedrooms],
                ['Banheiros', data.bathrooms],
                ['Vagas', data.parking_spaces],
                ['Preço Mín.', data.price_min ? `R$ ${data.price_min.toLocaleString('pt-BR')}` : null],
                ['Preço Máx.', data.price_max ? `R$ ${data.price_max.toLocaleString('pt-BR')}` : null],
                ['Preço/m²', data.price_per_sqm ? `R$ ${data.price_per_sqm.toLocaleString('pt-BR')}` : null],
                ['Unidades Total', data.units_count],
                ['Disponíveis', data.available_units],
                ['Entrega', data.delivery_date ? new Date(data.delivery_date).toLocaleDateString('pt-BR') : null],
                ['Construtora', developerInfo?.name || data.developer],
                ['Destacado', data.is_highlighted ? 'Sim' : 'Não'],
                ['Criado em', data.created_at ? new Date(data.created_at).toLocaleString('pt-BR') : null],
                ['Atualizado', data.updated_at ? new Date(data.updated_at).toLocaleString('pt-BR') : null],
              ].filter(([, v]) => v !== null && v !== undefined && v !== '').map(([label, value], i) => (
                <div key={i} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.border}` }}>
                  <span className="text-sm" style={{ color: T.textDim }}>{label}</span>
                  <span className="text-sm font-medium text-right max-w-[60%] truncate" style={{ color: T.text }}>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: T.text }}>Metadata</h2>
            {data.amenities && typeof data.amenities === 'object' && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2" style={{ color: T.textSub }}>Amenities</h3>
                <pre className="text-xs p-3 rounded-xl overflow-auto max-h-40" style={{ background: T.elevated, color: T.textSub }}>{JSON.stringify(data.amenities, null, 2)}</pre>
              </div>
            )}
            {data.tags && Array.isArray(data.tags) && data.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-2" style={{ color: T.textSub }}>Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {data.tags.map((tag: string, i: number) => (
                    <span key={i} className="text-xs px-2 py-1 rounded-lg" style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textSub }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}
            {data.specs && typeof data.specs === 'object' && (
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: T.textSub }}>Specs</h3>
                <pre className="text-xs p-3 rounded-xl overflow-auto max-h-40" style={{ background: T.elevated, color: T.textSub }}>{JSON.stringify(data.specs, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
