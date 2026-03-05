'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    ArrowLeft, Link2, Plus, Copy, QrCode, ExternalLink,
    Trash2, Download, Check, Loader2, Search, RefreshCw
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import QRCode from 'qrcode'
import { toast } from 'sonner'

const supabase = createClient()

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    border: 'var(--bo-border)',
    hover: 'var(--bo-hover)',
    accent: '#486581',
    accentBg: 'rgba(26,26,46,0.10)',
}

export default function TrackingLinksPage() {
    const router = useRouter()
    const [links, setLinks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [search, setSearch] = useState('')

    useEffect(() => { loadLinks() }, [])

    const loadLinks = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/qr/links')
            const data = await res.json()
            if (res.ok) setLinks(data.links || [])
        } catch (err) {
            console.error('Error loading links:', err)
        } finally {
            setLoading(false)
        }
    }

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

    const filtered = links.filter(l =>
        !search || (l.campaign_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.short_code || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/backoffice/tracking')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                    >
                        <ArrowLeft size={18} style={{ color: T.accent }} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: T.text }}>Links Rastreáveis</h1>
                        <p className="text-xs" style={{ color: T.textMuted }}>{links.length} links gerados</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/backoffice/tracking/qr')}
                        className="h-10 px-4 rounded-xl text-sm font-semibold flex items-center gap-2 text-white"
                        style={{ background: T.accent }}
                    >
                        <QrCode size={16} />
                        Novo QR Code
                    </button>
                </div>
            </div>

            {/* Search + Refresh */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Buscar por campanha ou código..."
                        className="w-full h-10 pl-10 pr-4 rounded-xl text-sm"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    />
                </div>
                <button
                    onClick={loadLinks}
                    className="h-10 w-10 rounded-xl flex items-center justify-center"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <RefreshCw size={14} style={{ color: T.textMuted }} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

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
                            className="rounded-xl p-4 transition-all"
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
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                                            style={{ background: T.hover }}
                                            title="Copiar link"
                                        >
                                            {copiedId === link.id ? (
                                                <Check size={14} style={{ color: 'var(--s-done, #34d399)' }} />
                                            ) : (
                                                <Copy size={14} style={{ color: T.textMuted }} />
                                            )}
                                        </button>
                                        {link.short_url && (
                                            <button
                                                onClick={() => handleDownloadQR(link.short_url, link.campaign_name || link.short_code)}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                                                style={{ background: T.hover }}
                                                title="Baixar QR Code"
                                            >
                                                <Download size={14} style={{ color: T.textMuted }} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => window.open(link.url || link.short_url, '_blank')}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                                            style={{ background: T.hover }}
                                            title="Abrir link"
                                        >
                                            <ExternalLink size={14} style={{ color: T.textMuted }} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(link.id, link.campaign_name)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                                            style={{ background: T.hover }}
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} style={{ color: 'var(--s-cancel, #ef4444)' }} />
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
