'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import { QrCode, Link2, Copy, Download, Check, Trash2, Plus, ExternalLink, BarChart2 } from 'lucide-react'
import { toast } from 'sonner'

/* ── Design tokens ─────────────────────────── */
const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    accent: 'var(--bo-accent)',
}

interface TrackedLink {
    id: string
    label: string
    originalUrl: string
    shortUrl: string
    clicks: number
    createdAt: string
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://www.iulemirandaimoveis.com.br'

export default function QRPage() {
    const [url, setUrl] = useState('')
    const [label, setLabel] = useState('')
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [generating, setGenerating] = useState(false)
    const [copied, setCopied] = useState(false)
    const [links, setLinks] = useState<TrackedLink[]>([])
    const [activeTab, setActiveTab] = useState<'qr' | 'links'>('qr')
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // Load saved links from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('imi-tracked-links')
            if (saved) setLinks(JSON.parse(saved))
        } catch {}
    }, [])

    const saveLinks = (updated: TrackedLink[]) => {
        setLinks(updated)
        localStorage.setItem('imi-tracked-links', JSON.stringify(updated))
    }

    const generateQR = useCallback(async () => {
        if (!url.trim()) return
        setGenerating(true)
        try {
            const target = url.startsWith('http') ? url : `https://${url}`
            const dataUrl = await QRCode.toDataURL(target, {
                width: 400,
                margin: 2,
                color: { dark: '#0D1117', light: '#FFFFFF' },
                errorCorrectionLevel: 'H',
            })
            setQrDataUrl(dataUrl)
            toast.success('QR Code gerado!')
        } catch {
            toast.error('Erro ao gerar QR Code')
        } finally {
            setGenerating(false)
        }
    }, [url])

    const downloadQR = () => {
        if (!qrDataUrl) return
        const a = document.createElement('a')
        a.href = qrDataUrl
        a.download = `qrcode-imi-${Date.now()}.png`
        a.click()
        toast.success('QR Code baixado!')
    }

    const copyQR = async () => {
        if (!qrDataUrl) return
        try {
            const blob = await (await fetch(qrDataUrl)).blob()
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.success('Imagem copiada!')
        } catch {
            // Fallback: copy URL
            await navigator.clipboard.writeText(url)
            toast.success('URL copiada!')
        }
    }

    const createTrackedLink = () => {
        if (!url.trim()) { toast.error('Insira uma URL'); return }
        const id = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
        const target = url.startsWith('http') ? url : `https://${url}`
        const newLink: TrackedLink = {
            id,
            label: label.trim() || `Link ${id}`,
            originalUrl: target,
            shortUrl: `${BASE_URL}/r/${id}`,
            clicks: 0,
            createdAt: new Date().toISOString(),
        }
        saveLinks([newLink, ...links])
        toast.success('Link trackeado criado!')
        setLabel('')
    }

    const copyLink = async (shortUrl: string) => {
        await navigator.clipboard.writeText(shortUrl)
        toast.success('Link copiado!')
    }

    const deleteLink = (id: string) => {
        saveLinks(links.filter(l => l.id !== id))
        toast.success('Link removido')
    }

    const totalClicks = links.reduce((a, l) => a + l.clicks, 0)

    return (
        <div className="space-y-5 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-[22px] font-bold" style={{ color: T.text }}>QR Code & Links Trackeados</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>Gere QR Codes e links com tracking de cliques</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold" style={{ background: T.elevated, color: T.accent, border: `1px solid var(--bo-border)` }}>
                    <BarChart2 size={14} />
                    {totalClicks} cliques
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ background: T.surface, border: `1px solid var(--bo-border)` }}>
                {[
                    { key: 'qr', label: 'QR Code', icon: QrCode },
                    { key: 'links', label: 'Links Trackeados', icon: Link2 },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as 'qr' | 'links')}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: activeTab === tab.key ? T.elevated : 'transparent',
                            color: activeTab === tab.key ? T.text : T.textMuted,
                            border: activeTab === tab.key ? `1px solid var(--bo-border)` : '1px solid transparent',
                        }}
                    >
                        <tab.icon size={15} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* QR Code Tab */}
            {activeTab === 'qr' && (
                <div className="grid lg:grid-cols-2 gap-5">
                    {/* Input panel */}
                    <div className="rounded-3xl p-6 space-y-4" style={{ background: T.surface, border: `1px solid var(--bo-border)` }}>
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Gerar QR Code</h2>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold" style={{ color: T.textMuted }}>URL de Destino</label>
                            <input
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && generateQR()}
                                placeholder="https://www.iulemirandaimoveis.com.br/..."
                                className="w-full h-12 px-4 rounded-2xl text-sm font-medium outline-none transition-all"
                                style={{ background: T.elevated, border: `1px solid var(--bo-border)`, color: T.text }}
                                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--bo-border)'}
                            />
                        </div>

                        <button
                            onClick={generateQR}
                            disabled={!url.trim() || generating}
                            className="w-full h-12 rounded-2xl font-bold text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                            style={{ background: T.accent, color: '#0D1117' }}
                        >
                            {generating ? 'Gerando...' : (
                                <><QrCode size={16} /> Gerar QR Code</>
                            )}
                        </button>

                        {/* Tips */}
                        <div className="space-y-2 pt-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.textMuted }}>Exemplos rápidos</p>
                            {[
                                { label: 'Site Principal', url: 'https://www.iulemirandaimoveis.com.br' },
                                { label: 'Página de Imóveis', url: 'https://www.iulemirandaimoveis.com.br/pt/imoveis' },
                                { label: 'WhatsApp', url: 'https://wa.me/5581997230455' },
                            ].map(ex => (
                                <button
                                    key={ex.url}
                                    onClick={() => setUrl(ex.url)}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs transition-all"
                                    style={{ background: T.elevated, color: T.textMuted, border: `1px solid var(--bo-border)` }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = T.text }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = T.textMuted }}
                                >
                                    <Link2 size={12} style={{ color: T.accent }} />
                                    <span className="font-semibold" style={{ color: T.text }}>{ex.label}</span>
                                    <span className="ml-auto truncate max-w-[140px] opacity-60">{ex.url.replace('https://', '')}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* QR Preview */}
                    <div className="rounded-3xl p-6 flex flex-col items-center justify-center gap-5" style={{ background: T.surface, border: `1px solid var(--bo-border)` }}>
                        {qrDataUrl ? (
                            <>
                                <div className="p-4 rounded-3xl shadow-2xl" style={{ background: '#fff' }}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={qrDataUrl} alt="QR Code" className="w-52 h-52" />
                                </div>
                                <p className="text-xs text-center max-w-[200px] truncate" style={{ color: T.textMuted }}>{url}</p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={copyQR}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                                        style={{ background: T.elevated, color: T.text, border: `1px solid var(--bo-border)` }}
                                    >
                                        {copied ? <Check size={15} /> : <Copy size={15} />}
                                        Copiar
                                    </button>
                                    <button
                                        onClick={downloadQR}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all"
                                        style={{ background: T.accent, color: '#0D1117' }}
                                    >
                                        <Download size={15} />
                                        Baixar PNG
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: T.elevated, border: `1px solid var(--bo-border)` }}>
                                    <QrCode size={32} style={{ color: T.accent }} />
                                </div>
                                <p className="text-sm text-center" style={{ color: T.textMuted }}>
                                    Insira uma URL e clique em<br />
                                    <strong style={{ color: T.text }}>Gerar QR Code</strong>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Links Trackeados Tab */}
            {activeTab === 'links' && (
                <div className="space-y-4">
                    {/* Create link */}
                    <div className="rounded-3xl p-6" style={{ background: T.surface, border: `1px solid var(--bo-border)` }}>
                        <h2 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: T.textMuted }}>Criar Link Trackeado</h2>
                        <div className="grid sm:grid-cols-3 gap-3">
                            <input
                                value={label}
                                onChange={e => setLabel(e.target.value)}
                                placeholder="Nome do link (ex: Post Instagram)"
                                className="h-11 px-4 rounded-2xl text-sm outline-none transition-all"
                                style={{ background: T.elevated, border: `1px solid var(--bo-border)`, color: T.text }}
                                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--bo-border)'}
                            />
                            <input
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://..."
                                className="h-11 px-4 rounded-2xl text-sm outline-none transition-all"
                                style={{ background: T.elevated, border: `1px solid var(--bo-border)`, color: T.text }}
                                onFocus={e => e.currentTarget.style.borderColor = T.accent}
                                onBlur={e => e.currentTarget.style.borderColor = 'var(--bo-border)'}
                            />
                            <button
                                onClick={createTrackedLink}
                                className="h-11 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                style={{ background: T.accent, color: '#0D1117' }}
                            >
                                <Plus size={16} />
                                Criar Link
                            </button>
                        </div>
                    </div>

                    {/* Links list */}
                    {links.length === 0 ? (
                        <div className="rounded-3xl p-12 flex flex-col items-center gap-3 text-center" style={{ background: T.surface, border: `1px solid var(--bo-border)` }}>
                            <Link2 size={32} style={{ color: T.accent, opacity: 0.5 }} />
                            <p className="text-sm" style={{ color: T.textMuted }}>Nenhum link trackeado ainda.<br />Crie um acima para começar.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {links.map(link => (
                                <div key={link.id} className="rounded-2xl p-4 flex items-center gap-4" style={{ background: T.surface, border: `1px solid var(--bo-border)` }}>
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: T.elevated }}>
                                        <Link2 size={16} style={{ color: T.accent }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{link.label}</p>
                                        <p className="text-xs truncate mt-0.5" style={{ color: T.textMuted }}>{link.originalUrl}</p>
                                        <p className="text-xs font-mono mt-1" style={{ color: T.accent }}>{link.shortUrl}</p>
                                    </div>
                                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0" style={{ background: T.elevated, color: T.text }}>
                                        <BarChart2 size={12} style={{ color: T.accent }} />
                                        {link.clicks}
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                        <button
                                            onClick={() => copyLink(link.shortUrl)}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                            style={{ background: T.elevated, color: T.textMuted }}
                                            title="Copiar link"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <a
                                            href={link.originalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                            style={{ background: T.elevated, color: T.textMuted }}
                                            title="Abrir URL original"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                        <button
                                            onClick={() => deleteLink(link.id)}
                                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                                            style={{ background: T.elevated, color: '#EF4444' }}
                                            title="Deletar"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
