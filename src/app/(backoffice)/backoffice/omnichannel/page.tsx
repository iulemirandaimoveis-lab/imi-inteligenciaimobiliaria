'use client'

import { useState, useEffect } from 'react'
import { Layers, MessageSquare, Mail, Phone, Instagram, ExternalLink, RefreshCw } from 'lucide-react'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    hover: 'var(--bo-hover)',
    border: 'var(--bo-border)',
    borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
    textTertiary: 'var(--bo-text-tertiary, var(--bo-text-muted))',
    gold: '#486581',
    shadow: 'var(--bo-shadow)',
}

const channels = [
    { name: 'WhatsApp', icon: MessageSquare, status: 'Ativo', color: '#25D366', href: '/backoffice/whatsapp' },
    { name: 'E-mail', icon: Mail, status: 'Ativo', color: '#4A90D9', href: null },
    { name: 'Telefone', icon: Phone, status: 'Em breve', color: '#8B93A7', href: null },
    { name: 'Instagram', icon: Instagram, status: 'Em breve', color: '#E1306C', href: null },
]

// Chatwoot config — update with your instance URL when deployed
const CHATWOOT_URL = process.env.NEXT_PUBLIC_CHATWOOT_URL || ''

export default function OmniChannelPage() {
    const [activeView, setActiveView] = useState<'overview' | 'chatwoot'>('overview')
    const [iframeKey, setIframeKey] = useState(0)
    const [realStats, setRealStats] = useState({ hoje: 0, pendentes: 0 })

    const hasChatwoot = !!CHATWOOT_URL

    useEffect(() => {
        // Fetch real lead stats for the summary cards
        fetch('/api/leads')
            .then(r => r.json())
            .then((data: any[]) => {
                if (!Array.isArray(data)) return
                const today = new Date().toDateString()
                const hoje = data.filter(l => new Date(l.created_at || '').toDateString() === today).length
                const pendentes = data.filter(l => l.status === 'new' || l.status === 'warm' || !l.status).length
                setRealStats({ hoje, pendentes: Math.min(pendentes, 99) })
            })
            .catch(() => {})
    }, [])

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold" style={{ color: T.text }}>
                        Omni Channel
                    </h1>
                    <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                        Central unificada de comunicação com leads e clientes.
                    </p>
                </div>
                {hasChatwoot && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveView('overview')}
                            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                            style={{
                                background: activeView === 'overview' ? T.gold : T.hover,
                                color: activeView === 'overview' ? '#fff' : T.textMuted,
                                border: `1px solid ${activeView === 'overview' ? T.gold : T.border}`,
                            }}
                        >
                            Canais
                        </button>
                        <button
                            onClick={() => setActiveView('chatwoot')}
                            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                            style={{
                                background: activeView === 'chatwoot' ? T.gold : T.hover,
                                color: activeView === 'chatwoot' ? '#fff' : T.textMuted,
                                border: `1px solid ${activeView === 'chatwoot' ? T.gold : T.border}`,
                            }}
                        >
                            <Layers size={14} /> Chatwoot
                        </button>
                    </div>
                )}
            </div>

            {/* ═══════ OVERVIEW VIEW ═══════ */}
            {activeView === 'overview' && (
                <>
                    {/* Channel Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {channels.map(ch => (
                            <div
                                key={ch.name}
                                className="rounded-2xl p-5 flex items-center gap-4 transition-all"
                                style={{
                                    background: T.elevated,
                                    border: `1px solid ${T.border}`,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = ch.status === 'Ativo' ? `${ch.color}40` : T.border)}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                            >
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${ch.color}15` }}
                                >
                                    <ch.icon size={22} style={{ color: ch.color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold" style={{ color: T.text }}>
                                        {ch.name}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>
                                        Canal de comunicação
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span
                                        className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full"
                                        style={{
                                            background: ch.status === 'Ativo' ? 'var(--s-done-bg)' : T.hover,
                                            color: ch.status === 'Ativo' ? 'var(--s-done)' : T.textTertiary,
                                        }}
                                    >
                                        {ch.status}
                                    </span>
                                    {ch.href && (
                                        <a href={ch.href} className="p-1.5 rounded-lg transition-colors"
                                            style={{ color: T.textMuted }}
                                            onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                            <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chatwoot Connection Card */}
                    <div className="rounded-2xl p-6" style={{ background: T.elevated, border: `1px solid ${T.borderGold}` }}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(26,26,46,0.12)' }}>
                                <Layers size={24} style={{ color: T.gold }} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-bold" style={{ color: T.text }}>
                                    {hasChatwoot ? 'Chatwoot Conectado' : 'Conectar Chatwoot'}
                                </h3>
                                <p className="text-xs mt-1" style={{ color: T.textMuted }}>
                                    {hasChatwoot
                                        ? 'Plataforma de atendimento omnichannel integrada. Clique em "Chatwoot" acima para acessar.'
                                        : 'Configure a variável NEXT_PUBLIC_CHATWOOT_URL no ambiente para conectar sua instância Chatwoot.'
                                    }
                                </p>
                            </div>
                            {hasChatwoot ? (
                                <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full flex-shrink-0"
                                    style={{ background: 'var(--s-done-bg)', color: 'var(--s-done)' }}>
                                    ● Conectado
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold uppercase px-3 py-1.5 rounded-full flex-shrink-0"
                                    style={{ background: 'var(--s-warm-bg)', color: 'var(--s-warm)' }}>
                                    Aguardando Config
                                </span>
                            )}
                        </div>

                        {!hasChatwoot && (
                            <div className="mt-4 p-4 rounded-xl" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                                <p className="text-xs font-mono mb-2" style={{ color: T.textMuted }}>
                                    # No seu .env.local ou Vercel Environment Variables:
                                </p>
                                <code className="text-xs font-mono block p-3 rounded-lg"
                                    style={{ background: T.elevated, color: T.gold, border: `1px solid ${T.border}` }}>
                                    NEXT_PUBLIC_CHATWOOT_URL=https://seu-chatwoot.exemplo.com
                                </code>
                            </div>
                        )}
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Leads Hoje', value: String(realStats.hoje), color: T.gold },
                            { label: 'Tempo Médio', value: '—', color: 'var(--s-cold)' },
                            { label: 'Satisfação', value: '—', color: 'var(--s-done)' },
                            { label: 'Pendentes', value: String(realStats.pendentes), color: 'var(--s-hot)' },
                        ].map(stat => (
                            <div key={stat.label} className="rounded-xl p-4"
                                style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                                <p className="text-lg sm:text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                                <p className="text-[10px] font-medium mt-0.5" style={{ color: T.textMuted }}>{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ═══════ CHATWOOT VIEW ═══════ */}
            {activeView === 'chatwoot' && hasChatwoot && (
                <div className="rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${T.border}`, background: T.elevated }}>
                    <div className="flex items-center justify-between px-4 py-2"
                        style={{ borderBottom: `1px solid ${T.border}` }}>
                        <div className="flex items-center gap-2">
                            <Layers size={14} style={{ color: T.gold }} />
                            <span className="text-xs font-semibold" style={{ color: T.text }}>Chatwoot Dashboard</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIframeKey(k => k + 1)}
                                className="p-1.5 rounded-lg transition-colors" style={{ color: T.textMuted }}
                                onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                title="Recarregar">
                                <RefreshCw size={14} />
                            </button>
                            <a href={CHATWOOT_URL} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg transition-colors" style={{ color: T.textMuted }}
                                onMouseEnter={e => (e.currentTarget.style.background = T.hover)}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                title="Abrir em nova aba">
                                <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                    <iframe
                        key={iframeKey}
                        src={CHATWOOT_URL}
                        className="w-full border-0"
                        style={{ height: 'calc(100vh - 260px)', minHeight: '500px' }}
                        title="Chatwoot"
                        allow="camera; microphone; clipboard-write"
                    />
                </div>
            )}
        </div>
    )
}
