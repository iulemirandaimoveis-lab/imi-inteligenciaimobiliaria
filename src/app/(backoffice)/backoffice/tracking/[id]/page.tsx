'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts'
import { PageIntelHeader, KPICard } from '@/app/(backoffice)/components/ui'
import { T } from '@/app/(backoffice)/lib/theme'
import { toast } from 'sonner'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    MousePointerClick, Link2, Smartphone, Monitor, Globe,
    Calendar, Copy, ExternalLink, QrCode, Loader2, ArrowLeft,
    TrendingUp, MapPin, Tablet, Clock, Users
} from 'lucide-react'

interface TrackedLink {
    id: string
    short_code: string
    destination_url: string
    campaign_name: string | null
    source: string | null
    created_at: string
    developments: { name: string; slug: string } | null
}

interface LinkEvent {
    id: string
    created_at: string
    device_type: string | null
    browser: string | null
    os: string | null
    city: string | null
    region: string | null
    country: string | null
    referrer: string | null
    ip_hash: string | null
}

const DEVICE_COLORS: Record<string, string> = {
    mobile: 'var(--accent-400)',
    desktop: 'var(--success)',
    tablet: 'var(--warning)',
    unknown: 'var(--text-tertiary)',
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatDay(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function LinkDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [link, setLink] = useState<TrackedLink | null>(null)
    const [events, setEvents] = useState<LinkEvent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        const supabase = createClient()
        async function load() {
            setLoading(true)
            const [linkRes, eventsRes] = await Promise.all([
                supabase.from('tracked_links').select('*, developments(name, slug)').eq('id', id).single(),
                supabase.from('link_events').select('*').eq('tracked_link_id', id).order('created_at', { ascending: false }).limit(50),
            ])
            if (linkRes.data) setLink(linkRes.data as TrackedLink)
            if (eventsRes.data) setEvents(eventsRes.data as LinkEvent[])
            setLoading(false)
        }
        load()
    }, [id])

    const uniqueVisitors = useMemo(() => {
        const hashes = new Set(events.map(e => e.ip_hash).filter(Boolean))
        return hashes.size || events.length
    }, [events])

    const dailyData = useMemo(() => {
        const map: Record<string, number> = {}
        events.forEach(e => {
            const day = e.created_at.slice(0, 10)
            map[day] = (map[day] || 0) + 1
        })
        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, clicks]) => ({ day, clicks }))
    }, [events])

    const deviceData = useMemo(() => {
        const map: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 }
        events.forEach(e => {
            const d = (e.device_type || 'unknown').toLowerCase()
            if (d in map) map[d]++
            else map.unknown = (map.unknown || 0) + 1
        })
        return Object.entries(map)
            .filter(([, v]) => v > 0)
            .map(([name, value]) => ({ name, value }))
    }, [events])

    const topDevice = useMemo(() => {
        if (!deviceData.length) return '-'
        const top = deviceData.reduce((a, b) => (b.value > a.value ? b : a))
        return top.name.charAt(0).toUpperCase() + top.name.slice(1)
    }, [deviceData])

    const lastActivity = events.length > 0 ? formatDate(events[0].created_at) : '-'

    const trackingBaseUrl = 'https://www.iulemirandaimoveis.com.br'
    const shortUrl = link ? `${trackingBaseUrl}/l/${link.short_code}` : ''

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copiado!')
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
                <Loader2 size={32} className="animate-spin" style={{ color: T.accent }} />
            </div>
        )
    }

    if (!link) {
        return (
            <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: 400 }}>
                <p style={{ color: T.textMuted, fontFamily: 'var(--font-sans)', fontSize: 14 }}>Link n&atilde;o encontrado.</p>
                <Link href="/backoffice/tracking/links" style={{ color: T.accent, fontSize: 13 }}>Voltar</Link>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <PageIntelHeader
                moduleLabel="TRACKING"
                title="Detalhe do Link"
                subtitle={link.campaign_name || link.developments?.name || 'Link rastreado'}
                breadcrumbs={[
                    { label: 'Tracking', href: '/backoffice/tracking' },
                    { label: 'Links', href: '/backoffice/tracking/links' },
                    { label: 'Detalhe' },
                ]}
                actions={
                    <Link
                        href="/backoffice/tracking/links"
                        className="inline-flex items-center gap-2"
                        style={{
                            padding: '8px 16px', borderRadius: T.radius.md,
                            background: T.surface, border: `1px solid ${T.border}`,
                            color: T.textMuted, fontSize: 13, fontFamily: 'var(--font-sans)',
                        }}
                    >
                        <ArrowLeft size={14} /> Voltar
                    </Link>
                }
            />

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>
                <KPICard label="Total Cliques" value={events.length} icon={<MousePointerClick size={18} />} accent="gold" />
                <KPICard label="Visitantes Únicos" value={uniqueVisitors} icon={<Users size={18} />} accent="info" />
                <KPICard label="Dispositivo Principal" value={topDevice} icon={<Smartphone size={18} />} accent="success" />
                <KPICard label="Última Atividade" value={lastActivity} icon={<Clock size={18} />} accent="navy" size="sm" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Main Content */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                    {/* Area Chart — Cliques por dia */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius.lg, padding: 20 }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 16 }}>
                            Cliques por Dia
                        </h3>
                        {dailyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <AreaChart data={dailyData}>
                                    <defs>
                                        <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="var(--accent-400)" stopOpacity={0.3} />
                                            <stop offset="100%" stopColor="var(--accent-400)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" tickFormatter={formatDay} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-sans)' }} />
                                    <Area type="monotone" dataKey="clicks" stroke="var(--accent-400)" strokeWidth={2} fill="url(#clickGrad)" name="Cliques" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ color: T.textDim, fontSize: 13, textAlign: 'center', padding: 40 }}>Sem dados ainda</p>
                        )}
                    </div>

                    {/* Bar Chart — Por dispositivo */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius.lg, padding: 20 }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 16 }}>
                            Por Dispositivo
                        </h3>
                        {deviceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={deviceData} layout="vertical">
                                    <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'var(--text-secondary)', textTransform: 'capitalize' } as any} axisLine={false} tickLine={false} width={70} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12, fontFamily: 'var(--font-sans)' }} />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Cliques">
                                        {deviceData.map((entry) => (
                                            <Cell key={entry.name} fill={DEVICE_COLORS[entry.name] || DEVICE_COLORS.unknown} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ color: T.textDim, fontSize: 13, textAlign: 'center', padding: 40 }}>Sem dados ainda</p>
                        )}
                    </div>

                    {/* Recent Events Table */}
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius.lg, padding: 20 }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 16 }}>
                            Eventos Recentes
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                        {['Data', 'Dispositivo', 'Browser', 'Local', 'Referrer'].map(h => (
                                            <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: T.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.slice(0, 20).map(ev => (
                                        <tr key={ev.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                                            <td style={{ padding: '10px 12px', color: T.text, whiteSpace: 'nowrap' }}>{formatDate(ev.created_at)}</td>
                                            <td style={{ padding: '10px 12px', color: T.textMuted, textTransform: 'capitalize' }}>{ev.device_type || '-'}</td>
                                            <td style={{ padding: '10px 12px', color: T.textMuted }}>{ev.browser || '-'}</td>
                                            <td style={{ padding: '10px 12px', color: T.textMuted }}>{[ev.city, ev.region].filter(Boolean).join(', ') || '-'}</td>
                                            <td style={{ padding: '10px 12px', color: T.textDim, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.referrer || 'direto'}</td>
                                        </tr>
                                    ))}
                                    {events.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: T.textDim }}>Nenhum evento registrado</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="flex flex-col gap-4">
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius.lg, padding: 20 }}>
                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 16 }}>
                            Informa&ccedil;&otilde;es do Link
                        </h3>

                        <div className="flex flex-col gap-4">
                            {/* Short URL */}
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>Short URL</span>
                                <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                                    <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: T.accent, background: T.activeBg, padding: '4px 8px', borderRadius: T.radius.sm, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {shortUrl}
                                    </code>
                                    <button onClick={() => copyToClipboard(shortUrl)} style={{ padding: 6, borderRadius: T.radius.sm, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer', color: T.textMuted }}>
                                        <Copy size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Destination */}
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>Destino</span>
                                <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: T.textDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                                        {link.destination_url}
                                    </span>
                                    <a href={link.destination_url} target="_blank" rel="noopener noreferrer" style={{ color: T.accent, flexShrink: 0 }}>
                                        <ExternalLink size={13} />
                                    </a>
                                </div>
                            </div>

                            {/* Campaign */}
                            {link.campaign_name && (
                                <div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>Campanha</span>
                                    <p style={{ fontSize: 13, color: T.text, marginTop: 4, fontFamily: 'var(--font-sans)' }}>{link.campaign_name}</p>
                                </div>
                            )}

                            {/* Source */}
                            {link.source && (
                                <div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>Fonte</span>
                                    <p style={{ fontSize: 13, color: T.text, marginTop: 4, fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>{link.source}</p>
                                </div>
                            )}

                            {/* Property */}
                            {link.developments?.name && (
                                <div>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>Empreendimento</span>
                                    <p style={{ fontSize: 13, color: T.text, marginTop: 4, fontFamily: 'var(--font-sans)' }}>{link.developments.name}</p>
                                </div>
                            )}

                            {/* Created */}
                            <div>
                                <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-sans)' }}>Criado em</span>
                                <p style={{ fontSize: 13, color: T.text, marginTop: 4, fontFamily: 'var(--font-sans)' }}>
                                    {new Date(link.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* QR Quick Action */}
                    <Link
                        href={`/backoffice/tracking/qr/${id}/print`}
                        className="flex items-center gap-3"
                        style={{
                            padding: '14px 16px', borderRadius: T.radius.lg,
                            background: T.activeBg, border: `1px solid ${T.borderGold}`,
                            color: T.accent, fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-sans)',
                            textDecoration: 'none', transition: 'background 150ms ease',
                        }}
                    >
                        <QrCode size={18} />
                        Imprimir QR Code
                    </Link>
                </div>
            </div>
        </div>
    )
}
