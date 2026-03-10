'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import {
    Building2, Copy, Check, Link2,
    QrCode, Sparkles,
    ChevronDown, Loader2, Globe, Trash2, MapPin,
    Download, RefreshCw, Eye, BarChart2, ExternalLink,
    TrendingUp, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import { T } from '@/app/(backoffice)/lib/theme'

const supabase = createClient()

const SOURCES = [
    {
        value: 'meta',
        label: 'Meta',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0 0 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
            </svg>
        ),
        color: '#1877F2',
        bg: 'rgba(24,119,242,0.12)',
    },
    {
        value: 'whatsapp',
        label: 'WhatsApp',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
        ),
        color: '#25D366',
        bg: 'rgba(37,211,102,0.12)',
    },
    {
        value: 'google',
        label: 'Google',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5c-.2 1.3-1 2.4-2.1 3.1v2.6h3.4c2-1.8 3-4.5 3-7.5z" fill="#4285F4" />
                <path d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.6c-.9.6-2 1-3.3 1-2.6 0-4.8-1.7-5.6-4.1H2.9v2.7C4.6 19.9 8.1 22 12 22z" fill="#34A853" />
                <path d="M6.4 13.9c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9V7.4H2.9C2.3 8.7 2 10.3 2 12s.3 3.3.9 4.6l3.5-2.7z" fill="#FBBC04" />
                <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8C16.9 2.9 14.6 2 12 2 8.1 2 4.6 4.1 2.9 7.4l3.5 2.7C7.2 7.6 9.4 5.9 12 5.9z" fill="#EA4335" />
            </svg>
        ),
        color: '#4285F4',
        bg: 'rgba(66,133,244,0.12)',
    },
    {
        value: 'placa',
        label: 'Placa Física',
        icon: <MapPin size={20} />,
        color: '#F59E0B',
        bg: 'rgba(245,158,11,0.12)',
    },
    {
        value: 'email',
        label: 'Email',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
        ),
        color: '#8B5CF6',
        bg: 'rgba(139,92,246,0.12)',
    },
    {
        value: 'instagram',
        label: 'Instagram',
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
        ),
        color: '#E1306C',
        bg: 'rgba(225,48,108,0.12)',
    },
]

function sourceIcon(value: string) {
    const s = SOURCES.find(s => s.value === value)
    return s ? (
        <div style={{ color: s.color }}>{s.icon}</div>
    ) : <Globe size={16} />
}

function sourceBg(value: string) {
    return SOURCES.find(s => s.value === value)?.bg || 'rgba(255,255,255,0.06)'
}

function sourceColor(value: string) {
    return SOURCES.find(s => s.value === value)?.color || '#60A5FA'
}

function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'agora'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
}

export default function QRGeneratorPage() {
    const searchParams = useSearchParams()
    const prefilledPropertyId = searchParams.get('propertyId')
    const prefilledPropertyName = searchParams.get('propertyName')

    const [developments, setDevelopments] = useState<any[]>([])
    const [selectedDev, setSelectedDev] = useState<any>(null)
    const [showDevDropdown, setShowDevDropdown] = useState(false)
    const [selectedSource, setSelectedSource] = useState(SOURCES[0])
    const [campaign, setCampaign] = useState('')
    const [medium, setMedium] = useState('')
    const [loading, setLoading] = useState(false)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [shortUrl, setShortUrl] = useState('')
    const [generatedLinkId, setGeneratedLinkId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null)

    // Real tracked links from DB
    const [recentLinks, setRecentLinks] = useState<any[]>([])
    const [linksLoading, setLinksLoading] = useState(true)
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    const fetchLinks = useCallback(async (silent = false) => {
        if (!silent) setLinksLoading(true)
        else setRefreshing(true)
        try {
            const res = await fetch('/api/qr/links')
            const data = await res.json()
            setRecentLinks(data.links || [])
            setLastRefresh(new Date())
        } catch {
            setRecentLinks([])
        } finally {
            setLinksLoading(false)
            setRefreshing(false)
        }
    }, [])

    // Auto-refresh every 30s to show updated click counts
    useEffect(() => {
        pollRef.current = setInterval(() => {
            fetchLinks(true)
        }, 30000)
        return () => {
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [fetchLinks])

    useEffect(() => {
        supabase.from('developments').select('id, name, slug').order('name').then(({ data }) => {
            const devs = data || []
            setDevelopments(devs)
            if (prefilledPropertyId) {
                const match = devs.find((d: any) => d.id === prefilledPropertyId)
                if (match) {
                    setSelectedDev(match)
                    return
                }
            }
            if (devs.length > 0) setSelectedDev(devs[0])
        })
        fetchLinks()
    }, [prefilledPropertyId, fetchLinks])

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
                    utm_medium: medium || 'social',
                    utm_campaign: (campaign || 'imi-qr').toLowerCase().replace(/\s+/g, '-'),
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Erro ao gerar link')

            const url = data.link?.short_url || `https://www.iulemirandaimoveis.com.br/imoveis/${selectedDev.slug}`
            setShortUrl(url)
            setGeneratedLinkId(data.link?.id || null)

            const qr = await QRCode.toDataURL(url, {
                width: 400,
                margin: 2,
                color: { dark: '#0A0A0A', light: '#FFFFFF' },
                errorCorrectionLevel: 'H',
            })
            setQrDataUrl(qr)
            toast.success('Link trackeado gerado!')
            fetchLinks()
        } catch (err: any) {
            toast.error(err.message || 'Erro ao gerar link trackeado')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadQR = () => {
        if (!qrDataUrl) return
        const a = document.createElement('a')
        a.href = qrDataUrl
        a.download = `qr-${selectedDev?.name?.toLowerCase().replace(/\s+/g, '-') || 'link'}-${selectedSource.value}.png`
        a.click()
        toast.success('QR Code baixado!')
    }

    const handleDeleteLink = async (id: string) => {
        try {
            await fetch(`/api/qr/links?id=${id}`, { method: 'DELETE' })
            setRecentLinks(prev => prev.filter(l => l.id !== id))
            toast.success('Link removido')
        } catch {
            toast.error('Erro ao remover link')
        }
    }

    const copyUrl = () => {
        if (!shortUrl) return
        navigator.clipboard.writeText(shortUrl)
        setCopied(true)
        toast.success('Link copiado!')
        setTimeout(() => setCopied(false), 2000)
    }

    const copyLinkUrl = (linkId: string, url: string) => {
        navigator.clipboard.writeText(url)
        setCopiedLinkId(linkId)
        toast.success('Link copiado!')
        setTimeout(() => setCopiedLinkId(null), 2000)
    }

    // Totals
    const totalClicks = recentLinks.reduce((sum, l) => sum + (l.clicks || 0), 0)
    const topSource = recentLinks.length > 0
        ? recentLinks.reduce((best, l) => (l.clicks || 0) > (best.clicks || 0) ? l : best, recentLinks[0])
        : null

    return (
        <div style={{ maxWidth: 560, margin: '0 auto', paddingBottom: 40 }}>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: 28 }}
            >
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: T.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>
                    Engine de Rastreamento
                </p>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, letterSpacing: '-0.5px' }}>
                    QR Tracking
                </h1>
            </motion.div>

            {/* Stats strip — only show if there are links */}
            {recentLinks.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}
                >
                    {[
                        { label: 'Links Ativos', value: recentLinks.length, icon: <QrCode size={14} />, color: '#60A5FA' },
                        { label: 'Total Cliques', value: totalClicks, icon: <Eye size={14} />, color: '#4ADE80' },
                        { label: 'Melhor Canal', value: topSource ? (SOURCES.find(s => s.value === topSource.utm_source)?.label || topSource.utm_source || '—') : '—', icon: <TrendingUp size={14} />, color: '#F59E0B' },
                    ].map(stat => (
                        <div key={stat.label} style={{
                            padding: '12px 14px', borderRadius: 14,
                            background: T.elevated, border: `1px solid ${T.border}`,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <span style={{ color: stat.color }}>{stat.icon}</span>
                                <p style={{ fontSize: 9, fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</p>
                            </div>
                            <p style={{ fontSize: 18, fontWeight: 800, color: T.text }}>{stat.value}</p>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Pre-fill banner */}
            {prefilledPropertyId && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                        marginBottom: 20, padding: '10px 16px', borderRadius: 12,
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                        display: 'flex', alignItems: 'center', gap: 10,
                    }}
                >
                    <Building2 size={14} style={{ color: '#3B82F6', flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: '#3B82F6', fontWeight: 500 }}>
                        Gerando QR para: <strong>{prefilledPropertyName ? decodeURIComponent(prefilledPropertyName) : 'Imóvel selecionado'}</strong>
                    </p>
                </motion.div>
            )}

            {/* SELECT PROPERTY */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: T.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>
                    Imóvel
                </p>
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowDevDropdown(!showDevDropdown)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                            padding: '14px 16px', borderRadius: 16,
                            background: T.elevated, border: `1px solid ${T.border}`,
                            cursor: 'pointer',
                        }}
                    >
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={18} style={{ color: '#3B82F6' }} />
                        </div>
                        <span style={{ flex: 1, textAlign: 'left', fontSize: 14, fontWeight: 600, color: T.text }}>
                            {selectedDev ? selectedDev.name : 'Selecionar imóvel...'}
                        </span>
                        <ChevronDown size={16} style={{ color: T.textMuted, flexShrink: 0 }} />
                    </button>

                    {showDevDropdown && developments.length > 0 && (
                        <div style={{
                            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
                            background: T.card || T.surface, border: `1px solid ${T.border}`,
                            borderRadius: 16, padding: 6, zIndex: 50,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                            maxHeight: 240, overflowY: 'auto',
                        }}>
                            {developments.map(dev => (
                                <button
                                    key={dev.id}
                                    onClick={() => { setSelectedDev(dev); setShowDevDropdown(false) }}
                                    style={{
                                        width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                                        background: selectedDev?.id === dev.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                                        border: 'none', cursor: 'pointer',
                                        fontSize: 13, fontWeight: 500, color: T.text,
                                    }}
                                >
                                    {dev.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>

            {/* MARKETING SOURCE */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: T.textMuted, textTransform: 'uppercase', marginBottom: 8 }}>
                    Canal de Marketing
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {SOURCES.map(src => {
                        const isActive = selectedSource.value === src.value
                        return (
                            <button
                                key={src.value}
                                onClick={() => setSelectedSource(src)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                                    padding: '14px 8px', borderRadius: 14,
                                    background: isActive ? src.bg : T.elevated,
                                    border: `1.5px solid ${isActive ? src.color : T.border}`,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                <div style={{ color: src.color }}>{src.icon}</div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? src.color : T.textMuted }}>
                                    {src.label}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </motion.div>

            {/* CAMPAIGN + MEDIUM */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ marginBottom: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: T.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Campanha</p>
                    <input
                        value={campaign}
                        onChange={e => setCampaign(e.target.value)}
                        placeholder="Ex: Verão 2025"
                        style={{
                            width: '100%', height: 48, padding: '0 14px', borderRadius: 12,
                            background: T.elevated, border: `1px solid ${T.border}`,
                            color: T.text, fontSize: 13, outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
                <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: T.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Meio</p>
                    <input
                        value={medium}
                        onChange={e => setMedium(e.target.value)}
                        placeholder="CPC / Social"
                        style={{
                            width: '100%', height: 48, padding: '0 14px', borderRadius: 12,
                            background: T.elevated, border: `1px solid ${T.border}`,
                            color: T.text, fontSize: 13, outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
            </motion.div>

            {/* QR PREVIEW CARD */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                    marginBottom: 14,
                    borderRadius: 24,
                    overflow: 'hidden',
                    background: '#0d1520',
                    border: `1px solid rgba(255,255,255,0.07)`,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    minHeight: 240,
                    justifyContent: 'center',
                    position: 'relative',
                }}
            >
                {/* Subtle color glow from selected source */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${selectedSource.color}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

                {/* QR Code */}
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    padding: 12,
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                    position: 'relative',
                }}>
                    {qrDataUrl ? (
                        <img src={qrDataUrl} alt="QR Code" style={{ width: 160, height: 160, display: 'block', borderRadius: 4 }} />
                    ) : (
                        <div style={{ width: 160, height: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <div style={{ opacity: 0.15, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4 }}>
                                {Array.from({ length: 25 }).map((_, i) => (
                                    <div key={i} style={{ width: 24, height: 24, background: Math.random() > 0.5 ? '#333' : 'transparent', borderRadius: 3 }} />
                                ))}
                            </div>
                            <p style={{ position: 'absolute', fontSize: 11, color: '#aaa', textAlign: 'center', fontWeight: 500 }}>Selecione e gere</p>
                        </div>
                    )}
                    {/* IMI watermark */}
                    {qrDataUrl && (
                        <div style={{ position: 'absolute', bottom: 16, right: 16, background: '#486581', color: '#fff', fontSize: 8, fontWeight: 900, padding: '2px 5px', borderRadius: 3, letterSpacing: '0.05em' }}>
                            IMI
                        </div>
                    )}
                </div>

                {/* Short URL display */}
                {shortUrl ? (
                    <div style={{ width: '100%' }}>
                        <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', textAlign: 'center', marginBottom: 8 }}>
                            Link Trackeado · Ativo
                        </p>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            background: 'rgba(255,255,255,0.06)', borderRadius: 12,
                            padding: '10px 14px',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}>
                            <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#60A5FA', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {shortUrl.replace('https://www.iulemirandaimoveis.com.br', 'imi.com.br')}
                            </span>
                            <button
                                onClick={copyUrl}
                                style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Copiar link"
                            >
                                {copied ? <Check size={13} style={{ color: '#4ade80' }} /> : <Copy size={13} style={{ color: '#60A5FA' }} />}
                            </button>
                            <button
                                onClick={handleDownloadQR}
                                disabled={!qrDataUrl}
                                style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: qrDataUrl ? 1 : 0.4 }}
                                title="Baixar QR Code"
                            >
                                <Download size={13} style={{ color: '#4ade80' }} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                        Configure e gere seu link rastreado abaixo
                    </p>
                )}
            </motion.div>

            {/* GENERATE BUTTON */}
            <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                onClick={handleGenerate}
                disabled={loading || !selectedDev}
                style={{
                    width: '100%', height: 56, borderRadius: 18,
                    background: loading || !selectedDev ? 'rgba(59,130,246,0.4)' : T.accent,
                    color: '#fff', fontSize: 15, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    border: 'none', cursor: loading || !selectedDev ? 'not-allowed' : 'pointer',
                    marginBottom: 32,
                    transition: 'all 0.15s',
                }}
            >
                {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <Sparkles size={20} />
                )}
                {loading ? 'Gerando...' : 'Gerar Link + QR Code'}
            </motion.button>

            {/* RECENT LINKS */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: T.textMuted, textTransform: 'uppercase' }}>
                        Links Rastreados
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {lastRefresh && (
                            <span style={{ fontSize: 10, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Clock size={10} />
                                {timeAgo(lastRefresh.toISOString())}
                            </span>
                        )}
                        <button
                            onClick={() => fetchLinks(true)}
                            disabled={refreshing}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center' }}
                            title="Atualizar"
                        >
                            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                        {recentLinks.length > 0 && (
                            <span style={{ fontSize: 11, color: T.textMuted }}>
                                {recentLinks.length} link{recentLinks.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                {linksLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                        <Loader2 size={20} style={{ color: T.textMuted }} className="animate-spin" />
                    </div>
                ) : recentLinks.length === 0 ? (
                    <div style={{
                        padding: '32px 24px', borderRadius: 16,
                        background: T.elevated, border: `1px solid ${T.border}`,
                        textAlign: 'center',
                    }}>
                        <QrCode size={28} style={{ color: T.textMuted, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>
                            Nenhum link gerado ainda
                        </p>
                        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 4, opacity: 0.7 }}>
                            Gere seu primeiro link rastreado acima
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <AnimatePresence>
                            {recentLinks.slice(0, 10).map((link, i) => {
                                const isNew = generatedLinkId === link.id
                                return (
                                    <motion.div
                                        key={link.id}
                                        initial={{ opacity: 0, x: isNew ? 0 : -8, scale: isNew ? 0.96 : 1 }}
                                        animate={{ opacity: 1, x: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: 8 }}
                                        transition={{ delay: isNew ? 0 : 0.3 + i * 0.04 }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '12px 14px', borderRadius: 16,
                                            background: isNew ? `${sourceColor(link.utm_source)}10` : T.elevated,
                                            border: `1px solid ${isNew ? `${sourceColor(link.utm_source)}30` : T.border}`,
                                            transition: 'background 0.3s',
                                        }}
                                    >
                                        {/* Source icon */}
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                            background: sourceBg(link.utm_source),
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {sourceIcon(link.utm_source)}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {link.campaign_name || link.utm_campaign || 'Sem nome'}
                                            </p>
                                            <p style={{ fontSize: 11, color: T.textMuted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                imi.com.br/l/{link.short_code}
                                            </p>
                                        </div>

                                        {/* Clicks + actions */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                            {/* Click count with bar */}
                                            <div style={{ textAlign: 'center', minWidth: 36 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                                                    <BarChart2 size={10} style={{ color: link.clicks > 0 ? '#4ADE80' : T.textMuted }} />
                                                    <p style={{ fontSize: 14, fontWeight: 800, color: link.clicks > 0 ? '#4ADE80' : T.text, lineHeight: 1 }}>{link.clicks ?? 0}</p>
                                                </div>
                                                <p style={{ fontSize: 9, color: T.textMuted, marginTop: 1 }}>cliques</p>
                                            </div>

                                            {/* Copy */}
                                            <button
                                                onClick={() => copyLinkUrl(link.id, link.short_url || '')}
                                                style={{
                                                    width: 28, height: 28, borderRadius: 8,
                                                    background: copiedLinkId === link.id ? 'rgba(34,197,94,0.15)' : T.hover,
                                                    border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}
                                                title="Copiar link"
                                            >
                                                {copiedLinkId === link.id
                                                    ? <Check size={12} style={{ color: '#22c55e' }} />
                                                    : <Copy size={12} style={{ color: T.textMuted }} />
                                                }
                                            </button>

                                            {/* Open link */}
                                            <a
                                                href={link.short_url || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    width: 28, height: 28, borderRadius: 8,
                                                    background: T.hover,
                                                    border: 'none', cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    textDecoration: 'none',
                                                }}
                                                title="Abrir link"
                                            >
                                                <ExternalLink size={12} style={{ color: T.textMuted }} />
                                            </a>

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDeleteLink(link.id)}
                                                style={{ width: 28, height: 28, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.35 }}
                                                title="Remover link"
                                            >
                                                <Trash2 size={12} style={{ color: T.text }} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
