'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Link2, Plus, Copy, QrCode, ExternalLink,
    Trash2, Download, Check, Loader2, Search, RefreshCw,
    Filter, BarChart3, MessageCircle,
} from 'lucide-react'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
export default function TrackingLinksPage() {
    const router = useRouter()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [links, setLinks] = useState<Record<string, any>[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [search, setSearch] = useState('')
    const [sourceFilter, setSourceFilter] = useState<string>('all')
    const [sortBy, setSortBy] = useState<'recent' | 'clicks'>('recent')
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
    const [secondsAgo, setSecondsAgo] = useState(0)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const loadLinks = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const res = await fetch('/api/qr/links')
            const data = await res.json()
            if (res.ok) {
                setLinks(data.links || [])
                setLastUpdated(new Date())
                setSecondsAgo(0)
            }
        } catch (err) {
        } finally {
            if (!silent) setLoading(false)
        }
    }, [])
    // Initial load
    useEffect(() => { loadLinks() }, [loadLinks])
    // Auto-refresh every 30s when page is visible
    useEffect(() => {
        const refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadLinks(true) // silent refresh
            }
        }, 30_000)
        return () => clearInterval(refreshInterval)
    }, [loadLinks])
    // Update "seconds ago" counter every second
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            if (lastUpdated) {
                setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
            }
        }, 1000)
        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [lastUpdated])
    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedId(id)
        toast.success('Link copiado!')
        setTimeout(() => setCopiedId(null), 2000)
    }
    const handleDelete = async (id: string, campaignName: string) => {
        toast.warning(`Excluir "${campaignName || 'este link'}"?`, {
            action: {
                label: 'Sim, excluir',
                onClick: async () => {
                    try {
                        const res = await fetch(`/api/qr/links?id=${id}`, { method: 'DELETE' })
                        if (res.ok) {
                            setLinks(prev => prev.filter(l => l.id !== id))
                            toast.success('Link excluído')
                        } else {
                            toast.error('Erro ao excluir link')
                        }
                    } catch {
                        toast.error('Erro ao excluir link')
                    }
                },
            },
            duration: 6000,
        })
    }
    const handleDownloadQR = async (url: string, name: string) => {
        try {
            const qr = await QRCode.toDataURL(url, {
                width: 600,
                margin: 2,
                color: { dark: '#0A0A0A', light: '#FFFFFF' },
                errorCorrectionLevel: 'H'
            })
            const a = document.createElement('a')
            a.href = qr
            a.download = `qrcode-${name}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            toast.success('QR Code baixado!')
        } catch {
            toast.error('Erro ao gerar QR Code')
        }
    }
    // Derive unique sources for filter dropdown
    const sources = Array.from(new Set(links.map(l => l.utm_params?.source).filter(Boolean)))

    const filtered = links
        .filter(l =>
            (!search || (l.campaign_name || '').toLowerCase().includes(search.toLowerCase()) ||
            (l.short_code || '').toLowerCase().includes(search.toLowerCase()))
            && (sourceFilter === 'all' || l.utm_params?.source === sourceFilter)
        )
        .sort((a, b) => {
            if (sortBy === 'clicks') return (b.clicks || 0) - (a.clicks || 0)
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="TRACKING · LINKS"
                title="Links Rastreáveis"
                subtitle={`${links.length} links gerados`}
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.push('/backoffice/tracking')}
                            className="w-10 h-10 rounded flex items-center justify-center transition-all hover:opacity-80"
                            style={{ background: T.card, border: `1px solid ${T.border}` }}
                        >
                            <ArrowLeft size={18} style={{ color: T.text }} />
                        </button>
                        <button
                            onClick={() => router.push('/backoffice/tracking/qr')}
                            className="h-10 px-4 rounded text-sm font-semibold flex items-center gap-2"
                            style={{ background: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
                        >
                            <QrCode size={16} />
                            Novo QR Code
                        </button>
                    </div>
                }
            />
            {/* Search + Refresh */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por campanha ou código..."
                        className="w-full h-10 pl-10 pr-4 rounded-lg text-sm"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                </div>
                {lastUpdated && (
                    <span className="text-[10px] whitespace-nowrap self-center" style={{ color: T.textMuted }}>
                        {secondsAgo < 5 ? 'agora' : secondsAgo < 60 ? `${secondsAgo}s atrás` : `${Math.floor(secondsAgo / 60)}min atrás`}
                    </span>
                )}
                <button
                    onClick={() => loadLinks()}
                    className="h-10 w-10 rounded flex items-center justify-center"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <RefreshCw size={14} style={{ color: T.textMuted }} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            {/* Filters Row */}
            {!loading && links.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {/* Source Filter */}
                    <div className="flex items-center gap-1.5">
                        <Filter size={12} style={{ color: T.textMuted }} />
                        <select
                            value={sourceFilter}
                            onChange={e => setSourceFilter(e.target.value)}
                            className="h-8 px-2 rounded text-[11px] font-medium cursor-pointer"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                        >
                            <option value="all">Todas as fontes</option>
                            {sources.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    {/* Sort */}
                    <div className="flex items-center gap-1.5">
                        <BarChart3 size={12} style={{ color: T.textMuted }} />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value as 'recent' | 'clicks')}
                            className="h-8 px-2 rounded text-[11px] font-medium cursor-pointer"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                        >
                            <option value="recent">Mais recentes</option>
                            <option value="clicks">Mais cliques</option>
                        </select>
                    </div>
                    {/* Results count */}
                    <span className="text-[10px] ml-auto" style={{ color: T.textMuted }}>
                        {filtered.length} de {links.length} links
                    </span>
                </div>
            )}

            {/* Links List */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <Loader2 size={24} className="animate-spin" style={{ color: T.accent }} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Link2 size={32} className="opacity-30" style={{ color: T.textMuted }} />
                    <p className="text-sm" style={{ color: T.textMuted }}>
                        {search ? 'Nenhum link encontrado' : 'Nenhum link gerado ainda'}
                    </p>
                    {!search && (
                        <button
                            onClick={() => router.push('/backoffice/tracking/qr')}
                            className="text-sm font-semibold"
                            style={{ color: T.accent }}
                        >
                            Criar primeiro link
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(link => (
                        <div
                            key={link.id}
                            className="rounded-lg p-4 transition-all"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate" style={{ color: T.text }}>
                                        {link.campaign_name || 'Sem nome'}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {link.short_code && (
                                            <code
                                                className="text-[10px] font-bold px-2 py-0.5 rounded"
                                                style={{ background: T.accentBg, color: T.accent }}
                                            >
                                                /l/{link.short_code}
                                            </code>
                                        )}
                                        {link.utm_params?.source && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: T.hover, color: T.textMuted }}>
                                                {link.utm_params.source}
                                            </span>
                                        )}
                                        {link.utm_params?.medium && (
                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: T.hover, color: T.textMuted }}>
                                                {link.utm_params.medium}
                                            </span>
                                        )}
                                        <span className="text-[10px]" style={{ color: T.textMuted }}>
                                            {new Date(link.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                </div>
                                {/* Stats */}
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <p className="text-lg font-bold" style={{ color: T.text }}>{link.clicks || 0}</p>
                                        <p className="text-[10px] uppercase font-bold tracking-wider" style={{ color: T.textMuted }}>Cliques</p>
                                    </div>
                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleCopy(link.short_url || link.url || '', link.id)}
                                            className="w-8 h-8 rounded flex items-center justify-center transition-all hover:opacity-70"
                                            style={{ background: T.hover }}
                                            title="Copiar link"
                                        >
                                            {copiedId === link.id ? (
                                                <Check size={14} style={{ color: 'var(--success)' }} />
                                            ) : (
                                                <Copy size={14} style={{ color: T.textMuted }} />
                                            )}
                                        </button>
                                        {link.short_url && (
                                            <button
                                                onClick={() => handleDownloadQR(link.short_url, link.campaign_name || link.short_code)}
                                                className="w-8 h-8 rounded flex items-center justify-center transition-all hover:opacity-70"
                                                style={{ background: T.hover }}
                                                title="Baixar QR Code"
                                            >
                                                <Download size={14} style={{ color: T.textMuted }} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => router.push(`/backoffice/tracking/${link.id}`)}
                                            className="w-8 h-8 rounded flex items-center justify-center transition-all hover:opacity-70"
                                            style={{ background: T.hover }}
                                            title="Ver analytics"
                                        >
                                            <BarChart3 size={14} style={{ color: T.accent }} />
                                        </button>
                                        <a
                                            href={`https://wa.me/?text=${encodeURIComponent(`${link.campaign_name || 'Confira'}: ${link.short_url || link.url}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-8 h-8 rounded flex items-center justify-center transition-all hover:opacity-70"
                                            style={{ background: T.hover }}
                                            title="Compartilhar via WhatsApp"
                                        >
                                            <MessageCircle size={14} style={{ color: '#25D366' }} />
                                        </a>
                                        <button
                                            onClick={() => window.open(link.short_url || link.url, '_blank')}
                                            className="w-8 h-8 rounded flex items-center justify-center transition-all hover:opacity-70"
                                            style={{ background: T.hover }}
                                            title="Abrir link"
                                        >
                                            <ExternalLink size={14} style={{ color: T.textMuted }} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(link.id, link.campaign_name)}
                                            className="w-8 h-8 rounded flex items-center justify-center transition-all hover:opacity-70"
                                            style={{ background: T.hover }}
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} style={{ color: 'var(--text-tertiary)' }} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
