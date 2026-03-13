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
  TrendingUp, DollarSign, Sparkles, Send, MessageSquare, Copy,
  Instagram, Mail, Phone, Users, Eye, Zap, Brain, ScanLine, Play,
} from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import PropertyInsightsPanel from '@/app/(backoffice)/components/PropertyInsightsPanel'
import Image from 'next/image'

const STATUS_MAP = Object.fromEntries(
  ['disponivel', 'em_negociacao', 'reservado', 'vendido', 'lancamento', 'em_construcao', 'arquivado'].map(key => {
    const cfg = getStatusConfig(key)
    return [key, { label: cfg.label, color: cfg.dot, bg: `${cfg.dot}1f`, dot: cfg.dot }]
  })
) as Record<string, { label: string; color: string; bg: string; dot: string }>

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

const getYouTubeEmbedUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1` : null
}

type TabKey = 'overview' | 'gallery' | 'mapa' | 'info' | 'tour'

export default function ImovelDetalhesPage() {
  const router = useRouter()
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [lightbox, setLightbox] = useState<{ open: boolean; idx: number }>({ open: false, idx: 0 })

  // ── Smart Action modals ──
  const [showContentPanel, setShowContentPanel] = useState(false)
  const [showLeadPanel, setShowLeadPanel] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentType, setContentType] = useState<'instagram' | 'whatsapp' | 'email'>('instagram')
  const [generatedContent, setGeneratedContent] = useState('')
  const [leads, setLeads] = useState<any[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [scanCount, setScanCount] = useState<number | null>(null)
  // Property-specific leads for overview tab
  const [propertyLeads, setPropertyLeads] = useState<any[]>([])
  const [propertyLeadsLoading, setPropertyLeadsLoading] = useState(false)

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

  // Fetch QR scan count + property-specific leads (in parallel, after data loads)
  useEffect(() => {
    if (!params.id || !data) return
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      // QR scan count
      supabase.from('qr_scans').select('id', { count: 'exact', head: true })
        .eq('property_id', params.id)
        .then(({ count }) => setScanCount(count ?? 0))
      // Property leads
      setPropertyLeadsLoading(true)
      supabase
        .from('leads')
        .select('id, name, email, phone, status, created_at, source')
        .eq('development_id', params.id)
        .order('created_at', { ascending: false })
        .limit(6)
        .then(({ data: ld }) => {
          setPropertyLeads(ld || [])
          setPropertyLeadsLoading(false)
        })
    })
  }, [params.id, data])

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

  // ── Generate content via AI ──
  const handleGenerateContent = async () => {
    if (!data) return
    setContentLoading(true)
    setGeneratedContent('')
    const prompts: Record<typeof contentType, string> = {
      instagram: `Crie uma legenda para Instagram para o imóvel: ${data.name || 'Empreendimento'}, ${data.type || ''}, localizado em ${data.neighborhood || data.city || ''}, com ${data.bedrooms || ''} quartos, ${data.bathrooms || ''} banheiros, área de ${data.area || ''}m². Preço a partir de R$ ${data.price_min ? (data.price_min / 1000).toFixed(0) + 'k' : 'consulte'}. Use emojis, seja persuasivo, máx 300 caracteres + hashtags.`,
      whatsapp: `Crie uma mensagem de WhatsApp para oferecer o imóvel: ${data.name || 'Empreendimento'}, ${data.type || ''}, em ${data.neighborhood || data.city || ''}. ${data.bedrooms || ''} quartos, ${data.area || ''}m². Preço: R$ ${data.price_min ? (data.price_min / 1000).toFixed(0) + 'k' : 'consulte'}. Tom pessoal, curto, com CTA.`,
      email: `Crie um e-mail de prospecção para o imóvel: ${data.name || 'Empreendimento'}, ${data.type || ''}, em ${data.neighborhood || data.city || ''}. ${data.bedrooms || ''} quartos, ${data.bathrooms || ''} banheiros, ${data.area || ''}m². Preço a partir de R$ ${data.price_min ? (data.price_min / 1000).toFixed(0) + 'k' : 'consulte'}. Tom profissional, com assunto e corpo.`,
    }
    try {
      const res = await fetch('/api/ia/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompts[contentType], type: contentType }),
      })
      if (!res.ok) throw new Error('Erro IA')
      const { content } = await res.json()
      setGeneratedContent(content || 'Conteúdo gerado com sucesso.')
    } catch {
      setGeneratedContent(`📍 ${data.name}\n\n${data.description || 'Empreendimento de alto padrão com localização privilegiada.'}\n\n${data.bedrooms ? `🛏 ${data.bedrooms} quartos` : ''} ${data.bathrooms ? `🚿 ${data.bathrooms} banheiros` : ''} ${data.area ? `📐 ${data.area}m²` : ''}\n\nR$ ${data.price_min ? (data.price_min / 1000000).toFixed(1).replace('.', ',') + 'M' : 'Consulte'}\n\n📲 Entre em contato para mais informações!`)
    }
    setContentLoading(false)
  }

  // ── Load hot leads for "Enviar Lead" panel ──
  const openLeadPanel = async () => {
    setShowLeadPanel(true)
    if (leads.length > 0) return
    setLeadsLoading(true)
    try {
      const res = await fetch('/api/leads?limit=20')
      const d = await res.json()
      setLeads(d?.data || [])
    } catch { /* silent */ }
    setLeadsLoading(false)
  }

  const handleSendToLead = (lead: any) => {
    const name = data?.name || 'Imóvel'
    const price = data?.price_min ? `R$ ${(data.price_min / 1000).toFixed(0)}k` : ''
    const area = data?.area ? `${data.area}m²` : ''
    const msg = encodeURIComponent(`Olá ${lead.name?.split(' ')[0] || ''}! Pensei em você para este imóvel:\n\n*${name}* ${area ? '· ' + area : ''} ${price ? '· a partir de ' + price : ''}\n\nGostaria de saber mais detalhes?`)
    const phone = (lead.phone || '').replace(/\D/g, '')
    if (phone) {
      window.open(`https://wa.me/55${phone}?text=${msg}`, '_blank')
    } else {
      toast.error('Lead sem telefone cadastrado')
    }
    setShowLeadPanel(false)
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
    ...(data.virtual_tour_url ? [{ key: 'tour' as TabKey, label: 'Tour Virtual' }] : []),
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

      <PageIntelHeader
        moduleLabel="IMÓVEIS"
        title={data.name}
        subtitle={[data.neighborhood, data.city].filter(Boolean).join(', ') || 'Empreendimento'}
        breadcrumbs={[
          { label: 'Imóveis', href: '/backoffice/imoveis' },
          { label: data.name },
        ]}
      />

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
          { icon: Ruler, label: 'Área Privativa', value: data.private_area ? `${data.private_area}m²` : 'N/A', color: 'var(--bo-success)' },
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
          className="bo-btn bo-btn-secondary bo-btn-sm"
        >
          <BarChart2 size={13} /> Analytics
        </button>
        <button
          onClick={() => router.push(`/backoffice/imoveis/${params.id}/unidades`)}
          className="bo-btn bo-btn-secondary bo-btn-sm"
        >
          <Layers size={13} /> Unidades
        </button>
        <button
          onClick={() => router.push(`/backoffice/imoveis/${params.id}/timeline`)}
          className="bo-btn bo-btn-secondary bo-btn-sm"
        >
          <Clock size={13} /> Timeline
        </button>

        <div className="flex-1" />

        {/* ── Criar Proposta ── */}
        <button
          onClick={() => router.push(`/backoffice/propostas/nova?property_id=${params.id}`)}
          className="bo-btn bo-btn-sm"
          style={{ background: 'rgba(201,168,76,0.12)', color: '#C9A84C', borderColor: 'rgba(201,168,76,0.25)' }}
          title="Criar Proposta"
        >
          <FileText size={13} />
          <span className="hidden sm:inline">Criar Proposta</span>
        </button>

        {/* ── Smart Actions ── */}
        <button
          onClick={() => setShowContentPanel(true)}
          className="bo-btn bo-btn-sm"
          style={{ background: 'rgba(139,92,246,0.12)', color: '#A78BFA', borderColor: 'rgba(139,92,246,0.25)' }}
          title="Gerar Conteúdo IA"
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">Conteúdo IA</span>
        </button>

        <button
          onClick={openLeadPanel}
          className="bo-btn bo-btn-sm"
          style={{ background: 'rgba(52,211,153,0.10)', color: 'var(--bo-success)', borderColor: 'rgba(52,211,153,0.25)' }}
          title="Enviar para Lead"
        >
          <Send size={13} />
          <span className="hidden sm:inline">Enviar Lead</span>
        </button>

        <button
          onClick={() => {
            const propertyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.iulemirandaimoveis.com.br'}/pt/imoveis/${data.slug || params.id}`
            const name = encodeURIComponent(data.name || 'Imóvel')
            router.push(`/backoffice/tracking/qr?propertyId=${params.id}&propertyName=${name}&propertyUrl=${encodeURIComponent(propertyUrl)}`)
          }}
          className="bo-btn bo-btn-secondary bo-btn-sm"
          title="QR Tracking"
        >
          <QrCode size={13} />
          <span className="hidden sm:inline">QR</span>
          {scanCount !== null && scanCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(96,165,250,0.15)', color: '#60A5FA', padding: '1px 5px', borderRadius: 4 }}>
              {scanCount}
            </span>
          )}
        </button>

        {data.status !== 'vendido' && (
          <button
            onClick={() => handleStatusChange('vendido')}
            className="bo-btn bo-btn-sm"
            style={{ background: 'rgba(96,165,250,0.10)', color: 'var(--bo-info)', borderColor: 'rgba(96,165,250,0.25)' }}
          >
            <ShoppingCart size={13} />
            <span className="hidden sm:inline">Vendido</span>
          </button>
        )}
        {data.status === 'arquivado' && (
          <button
            onClick={() => handleStatusChange('disponivel')}
            className="bo-btn bo-btn-sm"
            style={{ background: 'rgba(52,211,153,0.10)', color: 'var(--bo-success)', borderColor: 'rgba(52,211,153,0.25)' }}
          >
            <RotateCcw size={13} />
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
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="h-9 px-5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab.key ? T.elevated : 'transparent',
              border: activeTab === tab.key ? `1px solid ${T.borderStrong}` : '1px solid transparent',
              color: activeTab === tab.key ? T.text : T.textMuted,
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

              {/* ── Vídeo do Empreendimento ── */}
              {(() => {
                const embedUrl = getYouTubeEmbedUrl(data.video_url)
                if (!embedUrl) return null
                return (
                  <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                    <div className="p-4 flex items-center gap-2" style={{ background: T.surface }}>
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(239,68,68,0.12)' }}
                      >
                        <Play size={13} style={{ color: 'var(--bo-error)' }} />
                      </div>
                      <p className="text-sm font-semibold" style={{ color: T.text }}>Vídeo do Empreendimento</p>
                      <a
                        href={data.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex items-center gap-1 text-xs"
                        style={{ color: T.accent }}
                      >
                        YouTube <ExternalLink size={11} />
                      </a>
                    </div>
                    <div className="relative" style={{ paddingBottom: '56.25%' }}>
                      <iframe
                        src={embedUrl}
                        className="absolute inset-0 w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        style={{ border: 0 }}
                      />
                    </div>
                  </div>
                )
              })()}

              {/* ── Leads Interessados ── */}
              {(propertyLeadsLoading || propertyLeads.length > 0) && (
                <div className="rounded-2xl p-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.textMuted }}>
                      Leads Interessados
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold px-2 py-[2px] rounded-full"
                        style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--bo-error)', border: '1px solid rgba(248,113,113,0.2)' }}
                      >
                        {propertyLeads.length}
                      </span>
                      <button
                        onClick={() => router.push('/backoffice/leads')}
                        className="text-[10px] font-semibold transition-opacity hover:opacity-70"
                        style={{ color: T.accent }}
                      >
                        Ver todos →
                      </button>
                    </div>
                  </div>

                  {propertyLeadsLoading ? (
                    <div className="flex items-center justify-center py-5">
                      <Loader2 size={16} className="animate-spin" style={{ color: T.textMuted }} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {propertyLeads.map((lead) => {
                        const isHot = lead.status === 'hot' || lead.status === 'negotiating'
                        const isCold = lead.status === 'cold' || lead.status === 'lost'
                        const dotColor = isHot ? 'var(--bo-error)' : isCold ? '#9ca3af' : 'var(--bo-warning)'
                        return (
                          <div
                            key={lead.id}
                            className="flex items-center gap-3 p-2.5 rounded-xl"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{ background: isHot ? 'rgba(248,113,113,0.15)' : 'rgba(96,165,250,0.12)', color: isHot ? 'var(--bo-error)' : '#60A5FA' }}
                            >
                              {(lead.name || 'L').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-semibold truncate" style={{ color: T.text }}>{lead.name || 'Sem nome'}</p>
                              <p className="text-[10px] truncate" style={{ color: T.textMuted }}>
                                {lead.source || 'Direto'} · {new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span
                                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                                style={{ background: dotColor }}
                              />
                              <span className="text-[9px] font-bold capitalize" style={{ color: dotColor }}>
                                {lead.status || 'novo'}
                              </span>
                              {lead.phone && (
                                <a
                                  href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                                  target="_blank" rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                                  style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.2)', color: '#25D366' }}
                                >
                                  <Phone size={10} />
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-page links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Analytics', icon: BarChart2, color: '#A89EC4', href: `/backoffice/imoveis/${params.id}/analytics`, desc: 'Cliques, leads, conversões' },
                  { label: 'Unidades', icon: Layers, color: 'var(--bo-success)', href: `/backoffice/imoveis/${params.id}/unidades`, desc: 'Inventário de unidades' },
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

              {/* AI Insights */}
              <PropertyInsightsPanel developmentId={params.id as string} data={data} />

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
                      <span className="text-sm font-bold" style={{ color: 'var(--bo-success)' }}>{data.available_units}</span>
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

              {/* ── Dados Inteligentes ── */}
              <div
                className="rounded-2xl p-5"
                style={{ background: T.surface, border: '1px solid rgba(139,92,246,0.22)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#A78BFA' }}>
                    Dados Inteligentes
                  </p>
                  <span style={{
                    padding: '2px 7px', borderRadius: 5,
                    background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.20)',
                    fontSize: 9, fontWeight: 800, color: '#A78BFA', letterSpacing: '0.06em',
                  }}>IA</span>
                </div>

                <div className="space-y-3">
                  {/* QR Scans */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ScanLine size={13} style={{ color: '#60A5FA' }} />
                      </div>
                      <span className="text-xs" style={{ color: T.textDim }}>Scans QR</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: T.text }}>
                      {scanCount !== null ? scanCount : '—'}
                    </span>
                  </div>

                  {/* Days on market */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={13} style={{ color: 'var(--bo-warning)' }} />
                      </div>
                      <span className="text-xs" style={{ color: T.textDim }}>Dias no mercado</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums" style={{ color: T.text }}>
                      {data.created_at
                        ? Math.floor((Date.now() - new Date(data.created_at).getTime()) / 86400000)
                        : '—'}
                    </span>
                  </div>

                  {/* Liquidity score */}
                  {(() => {
                    const score = data.price_min
                      ? (data.price_min < 800000 ? 87 : data.price_min < 2000000 ? 72 : 61)
                      : 68
                    const scoreColor = score >= 80 ? 'var(--bo-success)' : score >= 65 ? 'var(--bo-warning)' : 'var(--bo-error)'
                    return (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${scoreColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Zap size={13} style={{ color: scoreColor }} />
                            </div>
                            <span className="text-xs" style={{ color: T.textDim }}>Liquidez estimada</span>
                          </div>
                          <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor }}>
                            {score}/100
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: T.elevated }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${score}%`,
                              background: `linear-gradient(90deg, ${scoreColor}99, ${scoreColor})`,
                              transition: 'width 0.8s ease',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })()}

                  {/* AI insight tip */}
                  <div className="rounded-xl p-3" style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.14)' }}>
                    <div className="flex items-start gap-2">
                      <Brain size={12} style={{ color: '#A78BFA', flexShrink: 0, marginTop: 2 }} />
                      <p className="text-[11px] leading-relaxed" style={{ color: T.textMuted }}>
                        {data.price_min && data.price_min < 1000000
                          ? 'Alta demanda nesta faixa. Recomendamos campanhas no Instagram e WhatsApp para acelerar a venda.'
                          : 'Perfil premium. Use o painel "Enviar Lead" para contato direto com leads qualificados.'}
                      </p>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setShowContentPanel(true)}
                      style={{
                        padding: '9px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                        background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.22)',
                        color: '#A78BFA', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 5,
                      }}
                    >
                      <Sparkles size={12} /> Gerar conteúdo
                    </button>
                    <button
                      onClick={openLeadPanel}
                      style={{
                        padding: '9px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                        background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.22)',
                        color: 'var(--bo-success)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: 5,
                      }}
                    >
                      <Send size={12} /> Enviar lead
                    </button>
                  </div>
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

        {activeTab === 'tour' && (
          <motion.div
            key="tour"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${T.border}` }}
          >
            {data.virtual_tour_url ? (
              <>
                <div className="p-4 flex items-center gap-2" style={{ background: T.surface }}>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.12)' }}
                  >
                    <Globe size={13} style={{ color: T.accent }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: T.text }}>Tour Virtual 360°</p>
                  <a
                    href={data.virtual_tour_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs"
                    style={{ color: T.accent }}
                  >
                    Abrir em nova aba <ExternalLink size={11} />
                  </a>
                </div>
                <iframe
                  src={data.virtual_tour_url}
                  className="w-full"
                  height="560"
                  style={{ border: 0 }}
                  allowFullScreen
                  allow="xr-spatial-tracking; gyroscope; accelerometer"
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4" style={{ background: T.surface }}>
                <Globe size={48} style={{ color: T.textDim }} />
                <div className="text-center">
                  <p className="text-sm font-medium mb-1" style={{ color: T.text }}>Tour virtual não cadastrado</p>
                  <p className="text-xs" style={{ color: T.textDim }}>Adicione um link de tour virtual para visualizar aqui</p>
                </div>
                <button
                  onClick={() => router.push(`/backoffice/imoveis/${params.id}/editar`)}
                  className="h-9 px-4 rounded-xl text-sm font-medium"
                  style={{ background: T.accent, color: 'white' }}
                >
                  Adicionar tour
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STICKY BOTTOM ACTION BAR ── */}
      <div
        className="fixed bottom-20 lg:bottom-0 left-0 right-0 lg:left-60 z-40 flex items-center justify-end gap-2 px-6 py-3"
        style={{
          background: `${T.elevated}f0`,
          backdropFilter: 'blur(16px)',
          borderTop: `1px solid ${T.border}`,
        }}
      >
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bo-btn bo-btn-danger bo-btn-sm"
        >
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
          {deleting ? 'Arquivando...' : 'Arquivar'}
        </button>
        <button
          onClick={() => router.push(`/backoffice/imoveis/${params.id}/editar`)}
          className="bo-btn bo-btn-primary bo-btn-sm"
        >
          <Edit size={13} />
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

      {/* ══════════════════════════════════════════════
          CONTEÚDO IA — slide panel
         ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showContentPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setShowContentPanel(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full z-50 overflow-y-auto"
              style={{ width: 'min(420px, 100vw)', background: 'var(--bo-elevated)', borderLeft: '1px solid var(--bo-border)' }}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={16} style={{ color: '#A78BFA' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--bo-text)' }}>Gerar Conteúdo IA</p>
                      <p style={{ fontSize: 11, color: 'var(--bo-text-muted)' }}>{data?.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowContentPanel(false)} style={{ color: 'var(--bo-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Type selector */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {([
                    { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: '#25D366' },
                    { id: 'email', label: 'E-mail', icon: Mail, color: '#60A5FA' },
                  ] as const).map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setContentType(opt.id); setGeneratedContent('') }}
                      style={{
                        padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                        background: contentType === opt.id ? `rgba(${opt.id === 'instagram' ? '225,48,108' : opt.id === 'whatsapp' ? '37,211,102' : '96,165,250'},0.12)` : 'var(--bo-surface)',
                        border: `1px solid ${contentType === opt.id ? `rgba(${opt.id === 'instagram' ? '225,48,108' : opt.id === 'whatsapp' ? '37,211,102' : '96,165,250'},0.35)` : 'var(--bo-border)'}`,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      }}
                    >
                      <opt.icon size={18} style={{ color: opt.color }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--bo-text)' }}>{opt.label}</span>
                    </button>
                  ))}
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerateContent}
                  disabled={contentLoading}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 12, marginBottom: 16,
                    background: 'var(--bo-accent)', color: '#fff', border: 'none',
                    fontSize: 13, fontWeight: 700, cursor: contentLoading ? 'not-allowed' : 'pointer',
                    opacity: contentLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {contentLoading ? (
                    <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Gerando…</>
                  ) : (
                    <><Brain size={14} /> Gerar com IA</>
                  )}
                </button>

                {/* Generated content */}
                {generatedContent && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Conteúdo gerado</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(generatedContent); toast.success('Copiado!') }}
                        style={{ fontSize: 11, fontWeight: 600, color: 'var(--bo-accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Copy size={12} /> Copiar
                      </button>
                    </div>
                    <div
                      style={{
                        padding: 14, borderRadius: 12, fontSize: 13, lineHeight: 1.6,
                        background: 'var(--bo-surface)', border: '1px solid var(--bo-border)',
                        color: 'var(--bo-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}
                    >
                      {generatedContent}
                    </div>

                    {/* Quick share */}
                    <div className="flex gap-2 mt-3">
                      {contentType === 'whatsapp' && (
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(generatedContent)}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ flex: 1, padding: '10px', borderRadius: 10, textAlign: 'center', fontSize: 12, fontWeight: 700, background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)', textDecoration: 'none' }}
                        >
                          Abrir WhatsApp
                        </a>
                      )}
                      {contentType === 'instagram' && (
                        <button
                          onClick={() => { navigator.clipboard.writeText(generatedContent); toast.success('Legenda copiada — cole no Instagram!') }}
                          style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 700, background: 'rgba(225,48,108,0.10)', color: '#E1306C', border: '1px solid rgba(225,48,108,0.25)', cursor: 'pointer' }}
                        >
                          Copiar para Instagram
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Property summary at bottom */}
                <div className="mt-6 rounded-xl p-4" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Dados do imóvel</p>
                  <div className="space-y-1">
                    {[
                      ['Tipo', data?.type],
                      ['Bairro', data?.neighborhood],
                      ['Área', data?.area ? `${data.area}m²` : null],
                      ['Quartos', data?.bedrooms],
                      ['Preço', data?.price_min ? `R$ ${(data.price_min / 1000).toFixed(0)}k` : null],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={String(k)} className="flex justify-between">
                        <span style={{ fontSize: 11, color: 'var(--bo-text-muted)' }}>{k}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--bo-text)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════
          ENVIAR LEAD — slide panel
         ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {showLeadPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setShowLeadPanel(false)}
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 h-full z-50 overflow-y-auto"
              style={{ width: 'min(380px, 100vw)', background: 'var(--bo-elevated)', borderLeft: '1px solid var(--bo-border)' }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={15} style={{ color: 'var(--bo-success)' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--bo-text)' }}>Enviar para Lead</p>
                      <p style={{ fontSize: 11, color: 'var(--bo-text-muted)' }}>Via WhatsApp com tracking</p>
                    </div>
                  </div>
                  <button onClick={() => setShowLeadPanel(false)} style={{ color: 'var(--bo-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>

                {/* Property pill */}
                <div className="rounded-xl p-3 mb-4 flex items-center gap-3" style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)' }}>
                  <Building2 size={16} style={{ color: 'var(--bo-accent)', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--bo-text)' }}>{data?.name}</p>
                    <p style={{ fontSize: 10, color: 'var(--bo-text-muted)' }}>{data?.neighborhood} · {data?.price_min ? `R$ ${(data.price_min / 1000).toFixed(0)}k` : ''}</p>
                  </div>
                </div>

                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--bo-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Selecionar lead
                </p>

                {leadsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 size={20} className="animate-spin" style={{ color: 'var(--bo-text-muted)' }} />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leads.slice(0, 15).map(lead => (
                      <button
                        key={lead.id}
                        onClick={() => handleSendToLead(lead)}
                        className="w-full flex items-center gap-3 rounded-xl p-3 transition-all text-left"
                        style={{ background: 'var(--bo-surface)', border: '1px solid var(--bo-border)', cursor: 'pointer' }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: lead.status === 'hot' ? 'rgba(248,113,113,0.15)' : 'rgba(96,165,250,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, color: lead.status === 'hot' ? 'var(--bo-error)' : '#60A5FA',
                        }}>
                          {(lead.name || 'L').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--bo-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name || 'Sem nome'}</p>
                          <p style={{ fontSize: 10, color: 'var(--bo-text-muted)' }}>{lead.phone || 'Sem telefone'} · {lead.source || 'Direto'}</p>
                        </div>
                        <div style={{
                          fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                          background: lead.status === 'hot' ? 'rgba(248,113,113,0.15)' : 'rgba(251,191,36,0.12)',
                          color: lead.status === 'hot' ? 'var(--bo-error)' : 'var(--bo-warning)',
                        }}>
                          {lead.status === 'hot' ? '🔥' : '●'} {lead.status || 'warm'}
                        </div>
                      </button>
                    ))}

                    {leads.length === 0 && (
                      <div className="text-center py-8">
                        <Users size={24} style={{ color: 'var(--bo-text-muted)', opacity: 0.3, margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 12, color: 'var(--bo-text-muted)' }}>Nenhum lead encontrado</p>
                      </div>
                    )}

                    <button
                      onClick={() => router.push('/backoffice/leads')}
                      style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 600, background: 'none', border: `1px solid var(--bo-border)`, color: 'var(--bo-text-muted)', cursor: 'pointer' }}
                    >
                      Ver todos os leads →
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
