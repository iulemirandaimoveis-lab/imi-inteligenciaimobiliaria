'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft, MapPin, Building2, Bed, Bath, Ruler, Car, Edit,
  CheckCircle, Calendar, Loader2, Image as ImageIcon, ExternalLink,
  Tag, Star, Globe, FileText, QrCode, ShoppingCart, Archive, RotateCcw,
  ChevronLeft, ChevronRight, X, ZoomIn, BarChart2, Layers, Clock,
  TrendingUp, DollarSign,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import Image from 'next/image'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  disponivel:    { label: 'Disponível',    color: '#6BB87B', bg: 'rgba(107,184,123,0.12)', dot: '#6BB87B' },
  em_negociacao: { label: 'Negociação',    color: 'var(--bo-accent)', bg: 'var(--bo-active-bg)', dot: 'var(--bo-accent)' },
  reservado:     { label: 'Reservado',     color: '#A89EC4', bg: 'rgba(168,158,196,0.12)', dot: '#A89EC4' },
  vendido:       { label: 'Vendido',       color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', dot: '#F59E0B' },
  lancamento:    { label: 'Lançamento',    color: '#E8A87C', bg: 'rgba(232,168,124,0.12)', dot: '#E8A87C' },
  em_construcao: { label: 'Em Construção', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', dot: '#a78bfa' },
  arquivado:     { label: 'Arquivado',     color: '#6B7280', bg: 'rgba(107,114,128,0.12)', dot: '#6B7280' },
}

const DB_STATUS_TO_DISPLAY: Record<string, string> = {
  launch: 'lancamento', available: 'disponivel', under_construction: 'em_construcao',
  ready: 'disponivel', sold: 'vendido', reserved: 'reservado', negotiating: 'em_negociacao',
  published: 'disponivel', draft: 'arquivado', campaign: 'lancamento', private: 'arquivado',
  disponivel: 'disponivel', em_negociacao: 'em_negociacao', reservado: 'reservado',
  vendido: 'vendido', lancamento: 'lancamento', em_construcao: 'em_construcao', arquivado: 'arquivado',
}

const formatPrice = (price: number) => {
  if (!price) return 'N/A'
  if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(1).replace('.', ',')}M`
  if (price >= 1000) return `R$ ${Math.floor(price / 1000)}k`
  return `R$ ${price.toLocaleString('pt-BR')}`
}

type TabKey = 'overview' | 'gallery' | 'mapa' | 'info'

export default function ImovelDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [lightbox, setLightbox] = useState<{ open: boolean; idx: number }>({ open: false, idx: 0 })

  useEffect(() => {
    const fetchDevelopment = async () => {
      try {
        const res = await fetch(`/api/developments?id=${params.id}`)
        if (!res.ok) throw new Error('Erro ao carregar')
        const d = await res.json()
        setData({
          ...d,
          status: DB_STATUS_TO_DISPLAY[d.status] || DB_STATUS_TO_DISPLAY[d.status_commercial] || 'disponivel',
        })
      } catch (err: any) {
        console.error(err)
        toast.error('Erro ao carregar empreendimento')
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchDevelopment()
  }, [params.id])

  const handleStatusChange = async (newStatus: string) => {
    const labelMap: Record<string, string> = {
      vendido: 'Vendido', arquivado: 'Arquivado', disponivel: 'Disponível',
      em_negociacao: 'Em Negociação', lancamento: 'Lançamento', reservado: 'Reservado',
    }
    try {
      const res = await fetch('/api/developments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: params.id, status: newStatus }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Erro ao atualizar status')
        return
      }
      setData((prev: any) => ({ ...prev, status: newStatus }))
      toast.success(`Imóvel marcado como ${labelMap[newStatus] || newStatus}`)
    } catch {
      toast.error('Erro de conexão')
    }
  }

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
          <Loader2 size={48} className="animate-spin mx-auto mb-4" style={{ color: T.accent }} />
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
          <button onClick={() => router.push('/backoffice/imoveis')} className="text-sm underline" style={{ color: T.accent }}>
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

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Visão Geral' },
    { key: 'gallery', label: `Galeria${galleryImages.length > 0 ? ` (${galleryImages.length})` : ''}` },
    { key: 'mapa', label: 'Mapa' },
    { key: 'info', label: 'Informações' },
  ]

  const priceDisplay = (data.price_min || data.price_max)
    ? (data.price_min && data.price_max
      ? `${formatPrice(data.price_min)} – ${formatPrice(data.price_max)}`
      : formatPrice(data.price_min || data.price_max))
    : null

  const pricePerSqm = data.price_per_sqm
    ? `${formatPrice(data.price_per_sqm)}/m²`
    : (data.price_min && data.private_area && data.private_area > 0)
      ? `${formatPrice(Math.round(data.price_min / data.private_area))}/m²`
      : null

  return (
    <div className="space-y-0 max-w-7xl mx-auto pb-32">

      {/* Back button + page label */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
          style={{ border: `1px solid ${T.border}`, background: T.surface }}
        >
          <ArrowLeft size={17} style={{ color: T.text }} />
        </button>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.textMuted }}>
          Imóveis / Detalhe
        </span>
      </div>

      {/* ── HERO SECTION ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-2xl overflow-hidden mb-6"
        style={{ border: `1px solid ${T.border}` }}
      >
        {/* Hero image */}
        <div className="relative w-full" style={{ height: 380 }}>
          {coverImage ? (
            <Image
              src={coverImage}
              alt={data.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: T.elevated }}>
              <ImageIcon size={72} style={{ color: T.textDim, opacity: 0.3 }} />
            </div>
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)' }}
          />
          {/* Status badge — top left */}
          <div className="absolute top-4 left-4">
            <div
              className="flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-md"
              style={{ background: `${status.bg}`, border: `1px solid ${status.color}55` }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: status.dot }}
              />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: status.color }}>
                {status.label}
              </span>
            </div>
          </div>
          {/* Highlighted star — top right */}
          {data.is_highlighted && (
            <div className="absolute top-4 right-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md"
                style={{ background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)' }}>
                <Star size={16} style={{ fill: '#F59E0B', color: '#F59E0B' }} />
              </div>
            </div>
          )}
          {/* Bottom hero content */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            {/* Property name */}
            <h1 className="text-3xl font-bold text-white mb-1 leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              {data.name}
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              {(data.address || data.neighborhood) && (
                <span className="flex items-center gap-1.5 text-sm text-white/70">
                  <MapPin size={13} />
                  {data.address}{data.neighborhood ? `, ${data.neighborhood}` : ''}
                </span>
              )}
              {(developerInfo?.name || data.developer) && (
                <span className="flex items-center gap-1.5 text-sm text-white/70">
                  <Building2 size={13} />
                  {developerInfo?.name || data.developer}
                </span>
              )}
            </div>
            {/* Price — large and prominent */}
            {priceDisplay && (
              <div className="mt-3">
                <span
                  className="text-4xl font-bold"
                  style={{ color: T.accent, textShadow: '0 0 24px rgba(59,130,246,0.4)' }}
                >
                  {priceDisplay}
                </span>
                {pricePerSqm && (
                  <span className="ml-3 text-sm font-medium text-white/50">{pricePerSqm}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── KPI STRIP ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
      >
        {[
          { icon: Ruler, label: 'Área Privativa', value: data.private_area ? `${data.private_area}m²` : 'N/A', color: '#6BB87B' },
          { icon: Bed, label: 'Quartos', value: data.bedrooms ?? 'N/A', color: '#7B9EC4' },
          { icon: Bath, label: 'Banheiros', value: data.bathrooms ?? 'N/A', color: '#A89EC4' },
          { icon: Car, label: 'Vagas', value: data.parking_spaces ?? 'N/A', color: '#E8A87C' },
        ].map((kpi, i) => (
          <div
            key={i}
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${kpi.color}18` }}
            >
              <kpi.icon size={18} style={{ color: kpi.color }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>{kpi.label}</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: T.text }}>{kpi.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── ACTION BAR ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex items-center gap-2 flex-wrap mb-6"
      >
        {/* Analytics sub-nav */}
        <button
          onClick={() => router.push(`/backoffice/imoveis/${params.id}/analytics`)}
          className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted }}
        >
          <BarChart2 size={15} /> Analytics
        </button>
        <button
          onClick={() => router.push(`/backoffice/imoveis/${params.id}/unidades`)}
          className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted }}
        >
          <Layers size={15} /> Unidades
        </button>
        <button
          onClick={() => router.push(`/backoffice/imoveis/${params.id}/timeline`)}
          className="h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ border: `1px solid ${T.border}`, background: T.surface, color: T.textMuted }}
        >
          <Clock size={15} /> Timeline
        </button>

        <div className="flex-1" />

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

        {data.status !== 'vendido' && (
          <button
            onClick={() => handleStatusChange('vendido')}
            className="h-10 px-4 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            style={{ border: '1px solid rgba(96,165,250,0.3)', color: '#60A5FA', background: 'rgba(96,165,250,0.08)' }}
          >
            <ShoppingCart size={16} />
            <span className="hidden sm:inline">Vendido</span>
          </button>
        )}
        {data.status === 'arquivado' && (
          <button
            onClick={() => handleStatusChange('disponivel')}
            className="h-10 px-4 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
            style={{ border: '1px solid rgba(107,184,123,0.3)', color: '#6BB87B', background: 'rgba(107,184,123,0.08)' }}
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Restaurar</span>
          </button>
        )}
      </motion.div>

      {/* ── PILL TABS ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 mb-6 p-1 rounded-2xl w-fit"
        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="h-9 px-5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab.key ? T.surface : 'transparent',
              border: activeTab === tab.key ? `1px solid ${T.border}` : '1px solid transparent',
              color: activeTab === tab.key ? T.text : T.textMuted,
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ── TAB CONTENT ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-5">
              {/* Description */}
              {data.description && (
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: T.textMuted }}>
                    Sobre o Empreendimento
                  </p>
                  <div className="leading-relaxed whitespace-pre-line text-sm" style={{ color: T.textMuted }}>
                    {data.description}
                  </div>
                </div>
              )}

              {/* Features */}
              {features.length > 0 && (
                <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: T.textMuted }}>
                    Diferenciais
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {features.map((f: string, i: number) => (
                      <span
                        key={i}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                      >
                        <CheckCircle size={12} style={{ color: T.accent }} />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-page links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Analytics', icon: BarChart2, color: '#A89EC4', href: `/backoffice/imoveis/${params.id}/analytics`, desc: 'Cliques, leads, conversões' },
                  { label: 'Unidades', icon: Layers, color: '#6BB87B', href: `/backoffice/imoveis/${params.id}/unidades`, desc: 'Inventário de unidades' },
                  { label: 'Timeline', icon: TrendingUp, color: '#E8A87C', href: `/backoffice/imoveis/${params.id}/timeline`, desc: 'Histórico do ativo' },
                ].map(link => (
                  <button
                    key={link.label}
                    onClick={() => router.push(link.href)}
                    className="rounded-2xl p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                  >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                      style={{ background: `${link.color}18` }}>
                      <link.icon size={16} style={{ color: link.color }} />
                    </div>
                    <p className="text-sm font-bold mb-0.5" style={{ color: T.text }}>{link.label}</p>
                    <p className="text-[11px]" style={{ color: T.textMuted }}>{link.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              {/* Developer Card */}
              {(developerInfo || data.developer) && (
                <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: T.accent }}>Construtora</p>
                  <div className="flex items-center gap-3 mb-3">
                    {developerInfo?.logo_url ? (
                      <Image src={developerInfo.logo_url} alt={developerInfo.name} width={40} height={40}
                        className="w-10 h-10 rounded-lg object-contain" style={{ background: T.elevated }} />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: T.elevated }}>
                        <Building2 size={18} style={{ color: T.accent }} />
                      </div>
                    )}
                    <p className="font-bold text-sm" style={{ color: T.text }}>{developerInfo?.name || data.developer}</p>
                  </div>
                  {developerInfo?.email && <p className="text-xs mb-1" style={{ color: T.textMuted }}>{developerInfo.email}</p>}
                  {developerInfo?.phone && <p className="text-xs" style={{ color: T.textMuted }}>{developerInfo.phone}</p>}
                </div>
              )}

              {/* Pricing */}
              <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: T.accent }}>Valores</p>
                <div className="space-y-3">
                  {data.price_min && (
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: T.textDim }}>Preço Mínimo</span>
                      <span className="text-sm font-bold" style={{ color: T.text }}>{formatPrice(data.price_min)}</span>
                    </div>
                  )}
                  {data.price_max && (
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: T.textDim }}>Preço Máximo</span>
                      <span className="text-sm font-bold" style={{ color: T.text }}>{formatPrice(data.price_max)}</span>
                    </div>
                  )}
                  {pricePerSqm && (
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: T.textDim }}>Preço/m²</span>
                      <span className="text-sm font-bold" style={{ color: T.text }}>{pricePerSqm}</span>
                    </div>
                  )}
                  {data.units_count && (
                    <div className="flex justify-between pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
                      <span className="text-xs" style={{ color: T.textDim }}>Total Unidades</span>
                      <span className="text-sm font-bold" style={{ color: T.text }}>{data.units_count}</span>
                    </div>
                  )}
                  {data.available_units != null && (
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: T.textDim }}>Disponíveis</span>
                      <span className="text-sm font-bold" style={{ color: '#6BB87B' }}>{data.available_units}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cronograma */}
              <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: T.accent }}>Cronograma</p>
                <div className="space-y-3">
                  {data.delivery_date && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.textDim }}>Entrega Prevista</p>
                      <p className="text-sm font-semibold flex items-center gap-1.5" style={{ color: T.text }}>
                        <Calendar size={13} style={{ color: T.accent }} />
                        {new Date(data.delivery_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                  {data.created_at && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: T.textDim }}>Cadastrado em</p>
                      <p className="text-sm font-medium" style={{ color: T.text }}>
                        {new Date(data.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Links */}
              <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-4" style={{ color: T.accent }}>Links Rápidos</p>
                <div className="space-y-2">
                  {data.slug && (
                    <a
                      href={`/pt/imoveis/${data.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm p-2.5 rounded-xl transition-colors"
                      style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                    >
                      <Globe size={13} style={{ color: T.accent }} />
                      Ver no site público
                      <ExternalLink size={11} className="ml-auto" />
                    </a>
                  )}
                  {data.brochure_url && (
                    <a
                      href={data.brochure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm p-2.5 rounded-xl transition-colors"
                      style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}
                    >
                      <FileText size={13} style={{ color: T.accent }} />
                      Download Brochure
                      <ExternalLink size={11} className="ml-auto" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'gallery' && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-2xl p-6"
            style={{ background: T.surface, border: `1px solid ${T.border}` }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-5" style={{ color: T.textMuted }}>
              Galeria de Imagens
            </p>
            {galleryImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {galleryImages.map((url: string, i: number) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setLightbox({ open: true, idx: i })}
                    className="relative group rounded-xl overflow-hidden cursor-pointer"
                    style={{ border: `1px solid ${T.border}` }}
                  >
                    <Image
                      src={url}
                      alt={`${data.name} ${i + 1}`}
                      width={400}
                      height={192}
                      className="w-full h-48 object-cover group-hover:brightness-90 transition-all duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm"
                        style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <ZoomIn size={18} color="white" />
                      </div>
                    </div>
                    {i === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: T.accent, color: 'white' }}>
                        Capa
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <ImageIcon size={48} className="mx-auto mb-3" style={{ color: T.textDim }} />
                <p className="text-sm" style={{ color: T.textDim }}>Nenhuma imagem cadastrada</p>
                <button
                  onClick={() => router.push(`/backoffice/imoveis/${params.id}/editar`)}
                  className="text-sm mt-3 underline"
                  style={{ color: T.accent }}
                >
                  Adicionar imagens
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'mapa' && (
          <motion.div
            key="mapa"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${T.border}` }}
          >
            {(data.address || data.neighborhood) ? (
              <>
                <div className="p-4 flex items-center gap-2" style={{ background: T.surface }}>
                  <MapPin size={15} style={{ color: T.accent }} />
                  <p className="text-sm font-medium" style={{ color: T.text }}>
                    {[data.address, data.neighborhood, data.city || 'Recife', data.state || 'PE'].filter(Boolean).join(', ')}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([data.address, data.neighborhood, data.city || 'Recife', 'PE'].filter(Boolean).join(', '))}`}
                    target="_blank"
                    rel="noopener"
                    className="ml-auto flex items-center gap-1 text-xs"
                    style={{ color: T.accent }}
                  >
                    Abrir no Maps <ExternalLink size={12} />
                  </a>
                </div>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent([data.address, data.neighborhood, data.city || 'Recife', 'PE, Brasil'].filter(Boolean).join(', '))}&output=embed&z=16`}
                  className="w-full"
                  height="420"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4" style={{ background: T.surface }}>
                <MapPin size={48} style={{ color: T.textDim }} />
                <div className="text-center">
                  <p className="text-sm font-medium mb-1" style={{ color: T.text }}>Endereço não cadastrado</p>
                  <p className="text-xs" style={{ color: T.textDim }}>Adicione um endereço para ver o mapa</p>
                </div>
                <button
                  onClick={() => router.push(`/backoffice/imoveis/${params.id}/editar`)}
                  className="h-9 px-4 rounded-xl text-sm font-medium"
                  style={{ background: T.accent, color: 'white' }}
                >
                  Adicionar endereço
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-5" style={{ color: T.textMuted }}>Dados Completos</p>
              <div className="space-y-0">
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
                ].filter(([, v]) => v !== null && v !== undefined && v !== '').map(([label, value], i, arr) => (
                  <div
                    key={i}
                    className="flex justify-between py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none' }}
                  >
                    <span className="text-xs" style={{ color: T.textDim }}>{label}</span>
                    <span className="text-xs font-medium text-right max-w-[55%] truncate" style={{ color: T.text }}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-5" style={{ color: T.textMuted }}>Metadata</p>
              {data.amenities && typeof data.amenities === 'object' && (
                <div className="mb-5">
                  <p className="text-xs font-semibold mb-2" style={{ color: T.textMuted }}>Amenities</p>
                  <pre className="text-xs p-3 rounded-xl overflow-auto max-h-40"
                    style={{ background: T.elevated, color: T.textMuted }}>
                    {JSON.stringify(data.amenities, null, 2)}
                  </pre>
                </div>
              )}
              {data.tags && Array.isArray(data.tags) && data.tags.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold mb-2" style={{ color: T.textMuted }}>Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.specs && typeof data.specs === 'object' && (
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: T.textMuted }}>Specs</p>
                  <pre className="text-xs p-3 rounded-xl overflow-auto max-h-40"
                    style={{ background: T.elevated, color: T.textMuted }}>
                    {JSON.stringify(data.specs, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STICKY BOTTOM ACTION BAR ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-end gap-3 px-6 py-4"
        style={{
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="h-10 px-4 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium"
          style={{ border: `1px solid rgba(239,68,68,0.3)`, color: '#EF4444', background: 'rgba(239,68,68,0.08)' }}
        >
          {deleting ? <Loader2 size={15} className="animate-spin" /> : <Archive size={15} />}
          {deleting ? 'Arquivando...' : 'Arquivar'}
        </button>
        <button
          onClick={() => router.push(`/backoffice/imoveis/${params.id}/editar`)}
          className="h-10 px-6 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold text-white"
          style={{ background: T.accent, boxShadow: '0 4px 16px rgba(59,130,246,0.35)' }}
        >
          <Edit size={15} />
          Editar Imóvel
        </button>
      </div>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightbox.open && galleryImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.92)' }}
            onClick={() => setLightbox({ open: false, idx: 0 })}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox({ open: false, idx: 0 }) }}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
            >
              <X size={20} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setLightbox(p => ({ ...p, idx: (p.idx - 1 + galleryImages.length) % galleryImages.length })) }}
              className="absolute left-4 w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
            >
              <ChevronLeft size={24} />
            </button>
            <motion.img
              key={lightbox.idx}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={galleryImages[lightbox.idx]}
              alt={`${data.name} ${lightbox.idx + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
            <button
              onClick={e => { e.stopPropagation(); setLightbox(p => ({ ...p, idx: (p.idx + 1) % galleryImages.length })) }}
              className="absolute right-4 w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }}
            >
              <ChevronRight size={24} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {galleryImages.map((_: string, i: number) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightbox(p => ({ ...p, idx: i })) }}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ background: i === lightbox.idx ? 'white' : 'rgba(255,255,255,0.4)' }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
