'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    ArrowLeft, Building2, Copy, Check, QrCode, Sparkles,
    ChevronDown, Loader2, Globe, Trash2, MapPin,
    Download, RefreshCw, Eye, BarChart2, ExternalLink,
    TrendingUp, Clock, User, Users, ChevronRight,
    ScanLine, MousePointer, Link2,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

const supabase = createClient()

const SOURCES = [
    {
        value: 'meta', label: 'Meta', color: '#1877F2', bg: 'rgba(24,119,242,0.12)',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" /></svg>,
    },
    {
        value: 'whatsapp', label: 'WhatsApp', color: '#25D366', bg: 'rgba(37,211,102,0.12)',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>,
    },
    {
        value: 'google', label: 'Google', color: '#4285F4', bg: 'rgba(66,133,244,0.12)',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3-4.5 3-7.5z" fill="#4285F4" /><path d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-.9.6-2 1-3.3 1-2.6 0-4.8-1.7-5.6-4.1H2.9v2.7C4.6 19.9 8.1 22 12 22z" fill="#34A853" /><path d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.4H2.9C2.3 8.7 2 10.3 2 12s.3 3.3.9 4.6l3.5-2.7z" fill="#FBBC04" /><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.6 2 12 2 8.1 2 4.6 4.1 2.9 7.4l3.5 2.7C7.2 7.6 9.4 5.9 12 5.9z" fill="#EA4335" /></svg>,
    },
    {
        value: 'placa', label: 'Placa Física', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',
        icon: <MapPin size={18} />,
    },
    {
        value: 'instagram', label: 'Instagram', color: '#E1306C', bg: 'rgba(225,48,108,0.12)',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>,
    },
    {
        value: 'email', label: 'E-mail', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
    },
    {
        value: 'linkedin', label: 'LinkedIn', color: '#0A66C2', bg: 'rgba(10,102,194,0.12)',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg>,
    },
    {
        value: 'youtube', label: 'YouTube', color: '#FF0000', bg: 'rgba(255,0,0,0.10)',
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20.06 12 20.06 12 20.06s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" /></svg>,
    },
]

function srcInfo(val: string) {
    return SOURCES.find(s => s.value === val) ?? { color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', icon: <Globe size={16} />, label: val }
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'agora'
    if (m < 60) return `${m}m atrás`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h atrás`
    return `${Math.floor(h / 24)}d atrás`
}

const BASE = 'https://www.iulemirandaimoveis.com.br'

export default function QRGeneratorPage() {
    const searchParams = useSearchParams()
    const prefilledId = searchParams.get('propertyId')
    const prefilledName = searchParams.get('propertyName')

    // Form state
    const [developments, setDevelopments] = useState<any[]>([])
    const [selectedDev, setSelectedDev] = useState<any>(null)
    const [showDevDD, setShowDevDD] = useState(false)
    const [brokers, setBrokers] = useState<any[]>([])
    const [selectedBroker, setSelectedBroker] = useState<any>(null)
    const [showBrokerDD, setShowBrokerDD] = useState(false)
    const [teamLabel, setTeamLabel] = useState('')
    const [selectedSource, setSelectedSource] = useState(SOURCES[0])
    const [campaign, setCampaign] = useState('')
    const [customSlug, setCustomSlug] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)

    // Output state
    const [loading, setLoading] = useState(false)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [shortUrl, setShortUrl] = useState('')
    const [generatedLinkId, setGeneratedLinkId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    // Links list
    const [links, setLinks] = useState<any[]>([])
    const [linksLoading, setLinksLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
    const [expandedLink, setExpandedLink] = useState<string | null>(null)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    const fetchLinks = useCallback(async (silent = false) => {
        silent ? setRefreshing(true) : setLinksLoading(true)
        try {
            const res = await fetch('/api/qr/links')
            const data = await res.json()
            setLinks(data.links || [])
            setLastRefresh(new Date())
        } catch { setLinks([]) }
        finally { setLinksLoading(false); setRefreshing(false) }
    }, [])

    useEffect(() => {
        // Load developments (all — the QR tool is internal, no status filter needed)
        supabase.from('developments').select('id, name, slug').order('name')
            .then(({ data }) => {
                const devs = data || []
                setDevelopments(devs)
                if (prefilledId) {
                    const match = devs.find((d: any) => d.id === prefilledId)
                    if (match) { setSelectedDev(match); return }
                }
                if (devs.length > 0) setSelectedDev(devs[0])
            })

        // Load brokers
        supabase.from('brokers').select('id, name, email, avatar_url').eq('status', 'active').order('name')
            .then(({ data }) => setBrokers(data || []))

        fetchLinks()
        pollRef.current = setInterval(() => fetchLinks(true), 30000)
        return () => { if (pollRef.current) clearInterval(pollRef.current) }
    }, [prefilledId, fetchLinks])

    const handleGenerate = async () => {
        if (!selectedDev) { toast.error('Selecione um imóvel'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/qr/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    development_id: selectedDev.id,
                    campaign_name: campaign || `${selectedSource.value}-qr`,
                    utm_source: selectedSource.value,
                    utm_medium: 'qr',
                    utm_campaign: (campaign || 'imi-qr').toLowerCase().replace(/\s+/g, '-'),
                    custom_slug: customSlug || undefined,
                    broker_id: selectedBroker?.id || null,
                    team_label: teamLabel || null,
                    label: campaign || null,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao gerar link')

            const url = data.link?.short_url || `${BASE}/l/${data.link?.short_code}`
            setShortUrl(url)
            setGeneratedLinkId(data.link?.id || null)

            const qr = await QRCode.toDataURL(url, {
                width: 400, margin: 2,
                color: { dark: '#0A0A0A', light: '#FFFFFF' },
                errorCorrectionLevel: 'H',
            })
            setQrDataUrl(qr)
            toast.success('Link rastreado gerado! QR pronto para usar.')
            fetchLinks()
        } catch (err: any) {
            toast.error(err.message || 'Erro ao gerar link')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = () => {
        if (!qrDataUrl) return
        const a = document.createElement('a')
        a.href = qrDataUrl
        a.download = `qr-${selectedDev?.name?.toLowerCase().replace(/\s+/g, '-') || 'link'}-${selectedSource.value}.png`
        a.click()
        toast.success('QR Code baixado!')
    }

    const handleDelete = async (id: string) => {
        try {
            await fetch(`/api/qr/links?id=${id}`, { method: 'DELETE' })
            setLinks(prev => prev.filter(l => l.id !== id))
            toast.success('Link removido')
        } catch { toast.error('Erro ao remover link') }
    }

    const copyUrl = (url: string, id?: string) => {
        navigator.clipboard.writeText(url)
        if (id) { setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) }
        else { setCopied(true); setTimeout(() => setCopied(false), 2000) }
        toast.success('Link copiado!')
    }

    // Stats
    const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0)
    const topSourceLink = links.length > 0 ? [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0] : null
    const activeLinks = links.filter(l => l.is_active !== false).length

    return (
        <div className="space-y-6 max-w-[640px] mx-auto pb-12">

            {/* Header */}
            <PageIntelHeader
                moduleLabel="TRACKING · QR CODES"
                title="QR Tracking"
                subtitle="Engine de rastreamento — gere links UTM + QR Codes por canal e imóvel"
                actions={
                    <div className="flex items-center gap-2">
                        <a href="/backoffice/tracking"
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: T.card, border: `1px solid ${T.border}`, textDecoration: 'none' }}>
                            <ArrowLeft size={18} style={{ color: T.text }} />
                        </a>
                        <a href="/backoffice/tracking/links"
                            className="h-10 px-4 rounded-xl flex items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-opacity"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.accent, textDecoration: 'none' }}>
                            Todos os links <ChevronRight size={13} />
                        </a>
                    </div>
                }
            />

            {/* Stats — only when there are links */}
            {links.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Links Ativos', value: activeLinks, icon: <QrCode size={13} />, color: '#60A5FA' },
                        { label: 'Total Cliques', value: totalClicks, icon: <MousePointer size={13} />, color: 'var(--bo-success)' },
                        { label: 'Melhor Canal', value: topSourceLink ? (srcInfo(topSourceLink.utm_source).label || '—') : '—', icon: <TrendingUp size={13} />, color: '#F59E0B' },
                    ].map(s => (
                        <div key={s.label} className="rounded-2xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                            <div className="flex items-center gap-1.5 mb-2">
                                <span style={{ color: s.color }}>{s.icon}</span>
                                <p className="text-[9px] font-bold uppercase tracking-[0.1em]" style={{ color: T.textMuted }}>{s.label}</p>
                            </div>
                            <p className="text-lg font-bold truncate" style={{ color: T.text }}>{s.value}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Pre-fill banner */}
            {prefilledId && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <Building2 size={14} style={{ color: '#3B82F6' }} />
                    <p className="text-xs font-medium" style={{ color: '#3B82F6' }}>
                        Imóvel selecionado: <strong>{prefilledName ? decodeURIComponent(prefilledName) : 'Carregando...'}</strong>
                    </p>
                </div>
            )}

            {/* Form card */}
            <div className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}` }}>

                {/* Property selector */}
                <div className="p-5 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>Imóvel</p>
                    <div className="relative">
                        <button
                            onClick={() => { setShowDevDD(v => !v); setShowBrokerDD(false) }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
                            style={{ background: T.elevated, border: `1px solid ${showDevDD ? T.borderGold : T.border}` }}
                        >
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
                                <Building2 size={15} style={{ color: '#3B82F6' }} />
                            </div>
                            <span className="flex-1 text-left text-sm font-semibold truncate" style={{ color: T.text }}>
                                {selectedDev ? selectedDev.name : 'Selecionar imóvel...'}
                            </span>
                            <ChevronDown size={14} style={{ color: T.textMuted, transform: showDevDD ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                        </button>
                        <AnimatePresence>
                            {showDevDD && developments.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute left-0 right-0 z-50 rounded-2xl overflow-hidden mt-1.5"
                                    style={{ background: T.elevated, border: `1px solid ${T.border}`, boxShadow: '0 12px 40px rgba(0,0,0,0.3)', maxHeight: 240, overflowY: 'auto' }}
                                >
                                    {developments.map(dev => (
                                        <button key={dev.id}
                                            onClick={() => { setSelectedDev(dev); setShowDevDD(false) }}
                                            className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bo-hover)]"
                                            style={{ color: selectedDev?.id === dev.id ? T.accent : T.text }}
                                        >
                                            {dev.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Channel picker */}
                <div className="p-5 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>Canal de Marketing</p>
                    <div className="grid grid-cols-4 gap-2">
                        {SOURCES.map(src => {
                            const active = selectedSource.value === src.value
                            return (
                                <button key={src.value}
                                    onClick={() => setSelectedSource(src)}
                                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                                    style={{
                                        background: active ? src.bg : T.elevated,
                                        border: `1.5px solid ${active ? src.color + '80' : T.border}`,
                                    }}
                                >
                                    <span style={{ color: src.color }}>{src.icon}</span>
                                    <span className="text-[10px] font-bold leading-tight text-center" style={{ color: active ? src.color : T.textMuted }}>
                                        {src.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Campaign */}
                <div className="p-5 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>Nome da Campanha</p>
                    <input
                        value={campaign}
                        onChange={e => setCampaign(e.target.value)}
                        placeholder="Ex: Lançamento Verão 2025"
                        className="w-full h-11 px-4 rounded-xl text-sm outline-none"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                        onFocus={e => e.currentTarget.style.border = `1px solid ${T.borderGold}`}
                        onBlur={e => e.currentTarget.style.border = `1px solid ${T.border}`}
                    />
                </div>

                {/* Corretor + Equipe */}
                <div className="p-5 pb-4" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: T.textMuted }}>Atribuição</p>
                    <div className="grid grid-cols-2 gap-3">
                        {/* Broker selector */}
                        <div className="relative">
                            <p className="text-[10px] font-semibold mb-1.5" style={{ color: T.textMuted }}>Corretor</p>
                            <button
                                onClick={() => { setShowBrokerDD(v => !v); setShowDevDD(false) }}
                                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all"
                                style={{ background: T.elevated, border: `1px solid ${showBrokerDD ? T.borderGold : T.border}` }}
                            >
                                <User size={13} style={{ color: T.textMuted, flexShrink: 0 }} />
                                <span className="flex-1 text-left text-xs font-medium truncate" style={{ color: selectedBroker ? T.text : T.textMuted }}>
                                    {selectedBroker ? selectedBroker.name : 'Nenhum'}
                                </span>
                                <ChevronDown size={12} style={{ color: T.textMuted, transform: showBrokerDD ? 'rotate(180deg)' : 'none', transition: 'transform .15s', flexShrink: 0 }} />
                            </button>
                            <AnimatePresence>
                                {showBrokerDD && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        transition={{ duration: 0.1 }}
                                        className="absolute left-0 right-0 z-50 rounded-xl overflow-hidden mt-1"
                                        style={{ background: T.elevated, border: `1px solid ${T.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', maxHeight: 180, overflowY: 'auto' }}
                                    >
                                        <button
                                            onClick={() => { setSelectedBroker(null); setShowBrokerDD(false) }}
                                            className="w-full text-left px-3 py-2.5 text-xs font-medium transition-colors hover:bg-[var(--bo-hover)]"
                                            style={{ color: T.textMuted }}
                                        >Nenhum (geral)</button>
                                        {brokers.map(b => (
                                            <button key={b.id}
                                                onClick={() => { setSelectedBroker(b); setShowBrokerDD(false) }}
                                                className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--bo-hover)]"
                                                style={{ color: selectedBroker?.id === b.id ? T.accent : T.text }}
                                            >{b.name}</button>
                                        ))}
                                        {brokers.length === 0 && (
                                            <p className="px-3 py-2 text-xs" style={{ color: T.textMuted }}>Nenhum corretor cadastrado</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Team label */}
                        <div>
                            <p className="text-[10px] font-semibold mb-1.5" style={{ color: T.textMuted }}>Equipe</p>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                <Users size={13} style={{ color: T.textMuted, flexShrink: 0 }} />
                                <input
                                    value={teamLabel}
                                    onChange={e => setTeamLabel(e.target.value)}
                                    placeholder="Ex: equipe_sul"
                                    className="flex-1 text-xs bg-transparent outline-none"
                                    style={{ color: T.text }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Advanced (custom slug) */}
                <div className="px-5 pt-3 pb-4">
                    <button
                        onClick={() => setShowAdvanced(v => !v)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold transition-opacity hover:opacity-70"
                        style={{ color: T.textMuted }}
                    >
                        <ChevronRight size={12} style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }} />
                        Configurações avançadas
                    </button>
                    <AnimatePresence>
                        {showAdvanced && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-3">
                                    <p className="text-[10px] font-semibold mb-1.5" style={{ color: T.textMuted }}>URL Personalizada (opcional)</p>
                                    <div className="flex items-center gap-0 rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}`, background: T.elevated }}>
                                        <span className="px-3 text-xs font-mono" style={{ color: T.textMuted, borderRight: `1px solid ${T.border}`, padding: '0 10px', height: 40, display: 'flex', alignItems: 'center' }}>imi.com.br/l/</span>
                                        <input
                                            value={customSlug}
                                            onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            placeholder="ex: verao25-meta"
                                            className="flex-1 px-3 h-10 text-xs bg-transparent outline-none"
                                            style={{ color: T.text }}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* QR Preview */}
            <div className="rounded-3xl overflow-hidden relative" style={{ background: '#0d1520', border: '1px solid rgba(255,255,255,0.07)' }}>
                {/* Glow */}
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: `radial-gradient(circle, ${selectedSource.color}14 0%, transparent 70%)`, pointerEvents: 'none' }} />

                <div className="flex flex-col items-center gap-5 p-8">
                    {/* QR */}
                    <div className="relative" style={{ background: '#fff', borderRadius: 20, padding: 14, boxShadow: '0 12px 48px rgba(0,0,0,0.5)' }}>
                        {qrDataUrl ? (
                            <>
                                <img src={qrDataUrl} alt="QR Code" style={{ width: 168, height: 168, display: 'block', borderRadius: 6 }} />
                                <div style={{ position: 'absolute', bottom: 18, right: 18, background: '#486581', color: '#fff', fontSize: 7, fontWeight: 900, padding: '2px 5px', borderRadius: 3, letterSpacing: '0.05em' }}>IMI</div>
                            </>
                        ) : (
                            <div style={{ width: 168, height: 168, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                                <ScanLine size={40} style={{ color: '#ccc', opacity: 0.4 }} />
                                <p style={{ fontSize: 11, color: '#999', fontWeight: 500 }}>Configure e gere</p>
                            </div>
                        )}
                    </div>

                    {/* Short URL */}
                    {shortUrl ? (
                        <div className="w-full">
                            <p className="text-[9px] font-bold tracking-[0.15em] uppercase text-center mb-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                Link Rastreado · Ativo
                            </p>
                            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Link2 size={13} style={{ color: '#60A5FA', flexShrink: 0 }} />
                                <span className="flex-1 text-xs font-bold font-mono truncate" style={{ color: '#60A5FA' }}>
                                    {shortUrl.replace('https://www.iulemirandaimoveis.com.br', 'imi.com.br')}
                                </span>
                                <button onClick={() => copyUrl(shortUrl)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                                    style={{ background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}` }}
                                >
                                    {copied ? <Check size={13} style={{ color: '#4ade80' }} /> : <Copy size={13} style={{ color: '#60A5FA' }} />}
                                </button>
                                <button onClick={handleDownload} disabled={!qrDataUrl}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                                    style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}
                                >
                                    <Download size={13} style={{ color: '#4ade80' }} />
                                </button>
                            </div>
                            {(selectedBroker || teamLabel) && (
                                <div className="flex items-center gap-3 mt-2 justify-center">
                                    {selectedBroker && (
                                        <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            <User size={9} /> {selectedBroker.name}
                                        </span>
                                    )}
                                    {teamLabel && (
                                        <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            <Users size={9} /> {teamLabel}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            Configure acima e gere seu link rastreado
                        </p>
                    )}
                </div>
            </div>

            {/* Generate button */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={loading || !selectedDev}
                className="w-full h-14 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all disabled:opacity-40"
                style={{ background: T.accent }}
            >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                {loading ? 'Gerando...' : 'Gerar Link + QR Code'}
            </motion.button>

            {/* Links list */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>Links Rastreados</p>
                    <div className="flex items-center gap-3">
                        {lastRefresh && (
                            <span className="flex items-center gap-1 text-[10px]" style={{ color: T.textMuted }}>
                                <Clock size={10} />
                                {timeAgo(lastRefresh.toISOString())}
                            </span>
                        )}
                        <button onClick={() => fetchLinks(true)} disabled={refreshing}
                            className="flex items-center gap-1.5 text-[11px] font-semibold transition-opacity hover:opacity-70"
                            style={{ color: T.textMuted }}
                        >
                            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                            Atualizar
                        </button>
                    </div>
                </div>

                {linksLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 size={22} className="animate-spin" style={{ color: T.accent }} />
                    </div>
                ) : links.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-3xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                        <QrCode size={32} className="mb-3 opacity-20" style={{ color: T.textMuted }} />
                        <p className="text-sm font-semibold" style={{ color: T.text }}>Nenhum link gerado ainda</p>
                        <p className="text-xs mt-1" style={{ color: T.textMuted }}>Configure um imóvel e canal acima para gerar o primeiro link</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {links.slice(0, 20).map((link, i) => {
                                const src = srcInfo(link.utm_source)
                                const isNew = generatedLinkId === link.id
                                const isExpanded = expandedLink === link.id
                                const linkShortUrl = link.short_url || (link.short_code ? `${BASE}/l/${link.short_code}` : null)

                                return (
                                    <motion.div
                                        key={link.id}
                                        initial={{ opacity: 0, y: isNew ? -4 : 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: 8 }}
                                        transition={{ delay: isNew ? 0 : i * 0.03 }}
                                        className="rounded-2xl overflow-hidden transition-all"
                                        style={{
                                            background: isNew ? `${src.color}0d` : T.surface,
                                            border: `1px solid ${isNew ? src.color + '30' : T.border}`,
                                        }}
                                    >
                                        {/* Main row */}
                                        <div className="flex items-center gap-3 p-3.5">
                                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: src.bg }}>
                                                <span style={{ color: src.color, fontSize: 15 }}>{src.icon}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate" style={{ color: T.text }}>
                                                    {link.campaign_name || link.utm_campaign || 'Sem nome'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[10px] font-mono truncate" style={{ color: T.textMuted }}>
                                                        imi.com.br/l/{link.short_code}
                                                    </p>
                                                    {link.team_label && (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: T.elevated, color: T.textMuted }}>
                                                            {link.team_label}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                <div className="text-center mr-1">
                                                    <div className="flex items-center gap-1">
                                                        <BarChart2 size={10} style={{ color: (link.clicks || 0) > 0 ? 'var(--bo-success)' : T.textMuted }} />
                                                        <p className="text-sm font-bold" style={{ color: (link.clicks || 0) > 0 ? 'var(--bo-success)' : T.text }}>{link.clicks ?? 0}</p>
                                                    </div>
                                                    <p className="text-[9px]" style={{ color: T.textMuted }}>cliques</p>
                                                </div>

                                                {linkShortUrl && (
                                                    <button onClick={() => copyUrl(linkShortUrl, link.id)}
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                                        style={{ background: copiedId === link.id ? 'rgba(34,197,94,0.12)' : T.elevated, border: 'none' }}
                                                    >
                                                        {copiedId === link.id
                                                            ? <Check size={11} style={{ color: '#22c55e' }} />
                                                            : <Copy size={11} style={{ color: T.textMuted }} />}
                                                    </button>
                                                )}

                                                {linkShortUrl && (
                                                    <a href={linkShortUrl} target="_blank" rel="noopener noreferrer"
                                                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                                        style={{ background: T.elevated, textDecoration: 'none' }}
                                                    >
                                                        <ExternalLink size={11} style={{ color: T.textMuted }} />
                                                    </a>
                                                )}

                                                <button
                                                    onClick={() => setExpandedLink(isExpanded ? null : link.id)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                                    style={{ background: isExpanded ? 'rgba(96,165,250,0.12)' : T.elevated }}
                                                    title="Ver analytics"
                                                >
                                                    <Eye size={11} style={{ color: isExpanded ? '#60A5FA' : T.textMuted }} />
                                                </button>

                                                <button onClick={() => handleDelete(link.id)}
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center opacity-30 hover:opacity-70 transition-opacity"
                                                    style={{ background: 'transparent' }}
                                                >
                                                    <Trash2 size={11} style={{ color: T.text }} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded analytics */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.18 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 pt-1" style={{ borderTop: `1px solid ${T.border}` }}>
                                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                                            {[
                                                                { label: 'Total cliques', value: link.clicks ?? 0, color: 'var(--bo-success)' },
                                                                { label: 'Cliques únicos', value: link.unique_clicks ?? 0, color: '#60A5FA' },
                                                                { label: 'Criado', value: link.created_at ? new Date(link.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '—', color: T.textMuted as string },
                                                            ].map(s => (
                                                                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: T.elevated }}>
                                                                    <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                                                                    <p className="text-[9px] mt-0.5" style={{ color: T.textMuted }}>{s.label}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {link.last_click_at && (
                                                            <p className="text-[10px] mt-2.5 text-center" style={{ color: T.textMuted }}>
                                                                Último clique: {timeAgo(link.last_click_at)}
                                                            </p>
                                                        )}
                                                        <a href={`/backoffice/tracking?link=${link.id}`}
                                                            className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold transition-opacity hover:opacity-70"
                                                            style={{ color: T.accent }}
                                                        >
                                                            Ver analytics completo <ChevronRight size={12} />
                                                        </a>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>

                        {links.length > 20 && (
                            <a href="/backoffice/tracking/links"
                                className="flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold transition-opacity hover:opacity-70"
                                style={{ background: T.elevated, color: T.textMuted }}
                            >
                                Ver todos os {links.length} links <ChevronRight size={13} />
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
