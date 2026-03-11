'use client'

import { useState, useEffect } from 'react'
import { Layers, MessageSquare, Mail, Phone, Instagram, ExternalLink, RefreshCw, Users, Clock, Star, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PageIntelHeader, KPICard } from '../../components/ui'
import { T } from '../../lib/theme'

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
    const [loading, setLoading] = useState(true)

    const hasChatwoot = !!CHATWOOT_URL

    useEffect(() => {
        fetch('/api/leads')
            .then(r => r.json())
            .then((json: any) => {
                const data = json?.data || (Array.isArray(json) ? json : [])
                const today = new Date().toDateString()
                const hoje = data.filter((l: any) => new Date(l.created_at || '').toDateString() === today).length
                const pendentes = data.filter((l: any) => l.status === 'new' || l.status === 'warm' || !l.status).length
                setRealStats({ hoje, pendentes: Math.min(pendentes, 99) })
            })
            .catch(() => { toast.error('Erro ao carregar dados') })
            .finally(() => setLoading(false))
    }, [])

    if (loading) return (
        <div className="space-y-5">
            <div>
                <div className="h-2.5 rounded mb-2 animate-pulse" style={{ background: T.elevated, width: 160 }} />
                <div className="h-7 rounded mb-2 animate-pulse" style={{ background: T.elevated, width: 240 }} />
                <div className="h-3 rounded animate-pulse" style={{ background: T.elevated, width: 320 }} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ background: T.elevated, border: `1px solid ${T.border}`, animationDelay: `${i * 100}ms`, height: 88 }}>
                        <div className="h-2.5 rounded mb-3" style={{ background: 'var(--bo-hover)', width: '60%' }} />
                        <div className="h-7 rounded" style={{ background: 'var(--bo-hover)', width: '40%' }} />
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl p-5 animate-pulse" style={{ background: T.elevated, border: `1px solid ${T.border}`, animationDelay: `${i * 80}ms`, height: 76 }}>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl" style={{ background: 'var(--bo-hover)' }} />
                            <div>
                                <div className="h-3.5 rounded mb-1.5" style={{ background: 'var(--bo-hover)', width: 96 }} />
                                <div className="h-2.5 rounded" style={{ background: 'var(--bo-hover)', width: 64 }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )

    return (
        <div className="space-y-5">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="OMNICHANNEL"
                title="Omni Channel"
                subtitle="Central unificada de comunicação com leads e clientes"
                actions={
                    hasChatwoot ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setActiveView('overview')}
                                className="h-10 px-4 rounded-xl text-xs font-semibold transition-all"
                                style={{
                                    background: activeView === 'overview' ? T.accent : T.elevated,
                                    color: activeView === 'overview' ? '#fff' : T.textMuted,
                                    border: `1px solid ${activeView === 'overview' ? T.accent : T.border}`,
                                }}
                            >
                                Canais
                            </button>
                            <button
                                onClick={() => setActiveView('chatwoot')}
                                className="h-10 px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                                style={{
                                    background: activeView === 'chatwoot' ? T.accent : T.elevated,
                                    color: activeView === 'chatwoot' ? '#fff' : T.textMuted,
                                    border: `1px solid ${activeView === 'chatwoot' ? T.accent : T.border}`,
                                }}
                            >
                                <Layers size={13} /> Chatwoot
                            </button>
                        </div>
                    ) : undefined
                }
            />

            {/* OVERVIEW VIEW */}
            {activeView === 'overview' && (
                <>
                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <KPICard label="Leads Hoje" value={String(realStats.hoje)} icon={<Users size={16} />} accent="blue" size="sm" />
                        <KPICard label="Tempo Médio" value="—" icon={<Clock size={16} />} accent="cold" size="sm" />
                        <KPICard label="Satisfação" value="—" icon={<Star size={16} />} accent="green" size="sm" />
                        <KPICard label="Pendentes" value={String(realStats.pendentes)} icon={<AlertCircle size={16} />} accent="hot" size="sm" />
                    </div>

                    {/* Channel Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {channels.map(ch => (
                            <div
                                key={ch.name}
                                className="rounded-2xl p-5 flex items-center gap-4 transition-all hover-card"
                                style={{
                                    background: T.elevated,
                                    border: `1px solid ${T.border}`,
                                }}
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
                                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                        style={{
                                            background: ch.status === 'Ativo' ? 'var(--s-done-bg)' : T.hover,
                                            color: ch.status === 'Ativo' ? 'var(--s-done)' : T.textMuted,
                                        }}
                                    >
                                        {ch.status}
                                    </span>
                                    {ch.href && (
                                        <a href={ch.href} className="p-1.5 rounded-xl transition-colors hover-card"
                                            style={{ color: T.textMuted }}>
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
                                style={{ background: 'var(--bo-active-bg)' }}>
                                <Layers size={24} style={{ color: T.accent }} />
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
                                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex-shrink-0"
                                    style={{ background: 'var(--s-done-bg)', color: 'var(--s-done)' }}>
                                    Conectado
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full flex-shrink-0"
                                    style={{ background: 'var(--s-warm-bg)', color: 'var(--s-warm)' }}>
                                    Aguardando Config
                                </span>
                            )}
                        </div>

                        {!hasChatwoot && (
                            <div className="mt-4 p-4 rounded-xl" style={{ background: T.surface ?? 'rgba(0,0,0,0.2)', border: `1px solid ${T.border}` }}>
                                <p className="text-xs font-mono mb-2" style={{ color: T.textMuted }}>
                                    # No seu .env.local ou Vercel Environment Variables:
                                </p>
                                <code className="text-xs font-mono block p-3 rounded-xl"
                                    style={{ background: T.elevated, color: T.accent, border: `1px solid ${T.border}` }}>
                                    NEXT_PUBLIC_CHATWOOT_URL=https://seu-chatwoot.exemplo.com
                                </code>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* CHATWOOT VIEW */}
            {activeView === 'chatwoot' && hasChatwoot && (
                <div className="rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${T.border}`, background: T.elevated }}>
                    <div className="flex items-center justify-between px-4 py-3"
                        style={{ borderBottom: `1px solid ${T.border}` }}>
                        <div className="flex items-center gap-2">
                            <Layers size={14} style={{ color: T.accent }} />
                            <span className="text-xs font-semibold" style={{ color: T.text }}>Chatwoot Dashboard</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setIframeKey(k => k + 1)}
                                className="p-2 rounded-xl transition-colors hover-card" style={{ color: T.textMuted }}
                                title="Recarregar">
                                <RefreshCw size={13} />
                            </button>
                            <a href={CHATWOOT_URL} target="_blank" rel="noopener noreferrer"
                                className="p-2 rounded-xl transition-colors hover-card" style={{ color: T.textMuted }}
                                title="Abrir em nova aba">
                                <ExternalLink size={13} />
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
