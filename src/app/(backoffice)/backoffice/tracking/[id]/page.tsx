'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts'
import {
    PageIntelHeader, KPICard, ChartShell,
    chartTooltipStyle, chartCursorStyle, chartAxisTickStyle
} from '@/app/(backoffice)/components/ui'
import { T } from '@/app/(backoffice)/lib/theme'
import { toast } from 'sonner'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
    MousePointerClick, Smartphone, Globe,
    Copy, ExternalLink, QrCode, Loader2, ArrowLeft,
    TrendingUp, Tablet, Clock, Users, Monitor, Share2, MessageCircle,
    Bell, BellOff, Download,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────── */

interface TrackedLink {
    id: string
    short_code: string
    destination_url: string
    campaign_name: string | null
    source: string | null
    created_at: string
    clicks: number
    development_id: string | null
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

/* ── Constants ─────────────────────────────────────────────── */

const DEVICE_COLORS: Record<string, string> = {
    mobile: '#C49D5B',
    desktop: 'var(--success)',
    tablet: 'var(--warning)',
    unknown: 'var(--text-tertiary)',
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
    mobile: <Smartphone size={13} />,
    desktop: <Monitor size={13} />,
    tablet: <Tablet size={13} />,
}

const fadeUp = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
}

/* ── Helpers ───────────────────────────────────────────────── */

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatDay(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

/* ── Component ─────────────────────────────────────────────── */

export default function LinkDetailPage() {
    const { id } = useParams<{ id: string }>()
    const [link, setLink] = useState<TrackedLink | null>(null)
    const [events, setEvents] = useState<LinkEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [alertMode, setAlertMode] = useState<string>('off')
    const [alertLoading, setAlertLoading] = useState(false)

    /* ── Data fetch ──────────────────────────────────────── */
    useEffect(() => {
        if (!id) return
        const supabase = createClient()
        async function load() {
            setLoading(true)
            const [linkRes, eventsRes] = await Promise.all([
                supabase
                    .from('tracked_links')
                    .select('*, developments(name, slug)')
                    .eq('id', id)
                    .single(),
                supabase
                    .from('link_events')
                    .select('*')
                    .eq('tracked_link_id', id)
                    .order('created_at', { ascending: false })
                    .limit(200),
            ])
            if (linkRes.data) setLink(linkRes.data as TrackedLink)
            if (eventsRes.data) setEvents(eventsRes.data as LinkEvent[])
            setLoading(false)
        }
        load()

        // Load alert settings
        fetch(`/api/tracking/alerts?link_id=${id}`)
            .then(r => r.json())
            .then(d => {
                if (d.alerts?.length > 0) setAlertMode(d.alerts[0].alert_mode)
            })
            .catch(() => {})

        // Realtime: live click feed for THIS link
        const channel = supabase
            .channel(`link-detail-${id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'link_events',
                filter: `tracked_link_id=eq.${id}`,
            }, (payload) => {
                const evt = payload.new as any
                setEvents(prev => [{
                    id: evt.id,
                    created_at: evt.created_at,
                    device_type: evt.device_type,
                    browser: evt.browser,
                    os: evt.os,
                    city: evt.metadata?.city || null,
                    region: evt.metadata?.region || null,
                    country: evt.metadata?.country || null,
                    referrer: evt.referrer,
                    ip_hash: evt.ip_address,
                }, ...prev])
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [id])

    /* ── Derived data ────────────────────────────────────── */

    const uniqueVisitors = useMemo(() => {
        const hashes = new Set(events.map(e => e.ip_hash).filter(Boolean))
        return hashes.size || events.length
    }, [events])

    const engagementRate = useMemo(() => {
        if (uniqueVisitors === 0) return '0%'
        // Avg clicks per visitor — higher = more engaged
        const avgClicks = (events.length / uniqueVisitors).toFixed(1)
        return `${avgClicks}x`
    }, [events, uniqueVisitors])

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
            .sort((a, b) => b.value - a.value)
    }, [events])

    const topDevice = useMemo(() => {
        if (!deviceData.length) return '-'
        const top = deviceData.reduce((a, b) => (b.value > a.value ? b : a))
        return top.name.charAt(0).toUpperCase() + top.name.slice(1)
    }, [deviceData])

    const trackingBaseUrl = 'https://www.iulemirandaimoveis.com.br'
    const shortUrl = link ? `${trackingBaseUrl}/l/${link.short_code}` : ''

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success('Copiado!')
    }

    /* ── Alert handler ───────────────────────────────────── */
    const saveAlert = useCallback(async (mode: string) => {
        setAlertLoading(true)
        try {
            const res = await fetch('/api/tracking/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracked_link_id: id, alert_mode: mode }),
            })
            if (res.ok) {
                setAlertMode(mode)
                toast.success(mode === 'off' ? 'Alertas desativados' : `Alertas: ${mode === 'every' ? 'cada clique' : mode === 'hourly' ? 'resumo horário' : 'resumo diário'}`)
            }
        } catch { toast.error('Erro ao salvar alerta') }
        setAlertLoading(false)
    }, [id])

    /* ── Export handler ──────────────────────────────────── */
    const handleExport = useCallback(() => {
        toast.loading('Exportando...')
        fetch(`/api/tracking/export?link_id=${id}&format=csv`)
            .then(r => { if (!r.ok) throw new Error(); return r.blob() })
            .then(blob => {
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = `link-${link?.short_code || id}-export.csv`; a.click()
                URL.revokeObjectURL(url); toast.dismiss(); toast.success('Exportado!')
            })
            .catch(() => { toast.dismiss(); toast.error('Erro ao exportar') })
    }, [id, link?.short_code])

    /* ── Loading state ───────────────────────────────────── */
    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: 400 }}>
                <Loader2 size={32} className="animate-spin" style={{ color: T.accent }} />
            </div>
        )
    }

    /* ── Not found state ─────────────────────────────────── */
    if (!link) {
        return (
            <div className="flex flex-col items-center justify-center gap-4" style={{ minHeight: 400 }}>
                <p style={{ color: T.textMuted, fontFamily: 'var(--font-sans)', fontSize: 14 }}>
                    Link n&atilde;o encontrado.
                </p>
                <Link href="/backoffice/tracking" style={{ color: T.accent, fontSize: 13 }}>
                    Voltar
                </Link>
            </div>
        )
    }

    const campaignTitle = link.campaign_name || link.developments?.name || 'Link rastreado'

    /* ── Render ───────────────────────────────────────────── */
    return (
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* ── Header ─────────────────────────────────── */}
            <PageIntelHeader
                moduleLabel="TRACKING &middot; LINK DETAIL"
                title={campaignTitle}
                subtitle={shortUrl}
                breadcrumbs={[
                    { label: 'Tracking', href: '/backoffice/tracking' },
                    { label: 'Links', href: '/backoffice/tracking/links' },
                    { label: campaignTitle },
                ]}
                actions={
                    <Link
                        href="/backoffice/tracking"
                        className="inline-flex items-center gap-2"
                        style={{
                            padding: '8px 16px', borderRadius: T.radius.md,
                            background: T.surface, border: `1px solid ${T.border}`,
                            color: T.textMuted, fontSize: 13, fontFamily: 'var(--font-sans)',
                            textDecoration: 'none',
                        }}
                    >
                        <ArrowLeft size={14} /> Voltar
                    </Link>
                }
            />

            {/* ── KPI Grid (4 cards) ─────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>
                {[
                    { label: 'Total Cliques', value: events.length, icon: <MousePointerClick size={18} />, accent: 'gold' as const },
                    { label: 'Visitantes Unicos', value: uniqueVisitors, icon: <Users size={18} />, accent: 'info' as const },
                    { label: 'Engajamento', value: engagementRate, icon: <TrendingUp size={18} />, accent: 'success' as const },
                    { label: 'Dispositivo Principal', value: topDevice, icon: <Smartphone size={18} />, accent: 'warning' as const },
                ].map((kpi, i) => (
                    <motion.div
                        key={kpi.label}
                        variants={fadeUp}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                    >
                        <KPICard {...kpi} />
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* ── Main Content (2/3) ─────────────────── */}
                <div className="lg:col-span-2 flex flex-col gap-5">

                    {/* ── Area Chart — Cliques por dia ────── */}
                    <motion.div
                        variants={fadeUp} initial="hidden" animate="visible" custom={4}
                    >
                        <ChartShell
                            label="Evolucao"
                            title="Cliques por Dia"
                            subtitle="Historico de cliques no periodo"
                            height={220}
                            legend={[
                                { label: 'Cliques', color: '#C49D5B' },
                            ]}
                        >
                            {dailyData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#C49D5B" stopOpacity={0.3} />
                                                <stop offset="100%" stopColor="#C49D5B" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                                        <XAxis
                                            dataKey="day"
                                            tickFormatter={formatDay}
                                            tick={chartAxisTickStyle as any}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            tick={chartAxisTickStyle as any}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <Tooltip
                                            contentStyle={chartTooltipStyle}
                                            cursor={chartCursorStyle}
                                            labelFormatter={(v) => formatDay(v as string)}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="clicks"
                                            stroke="#C49D5B"
                                            strokeWidth={2}
                                            fill="url(#clickGrad)"
                                            name="Cliques"
                                            animationDuration={800}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p style={{ color: T.textDim, fontSize: 13 }}>Sem dados ainda</p>
                                </div>
                            )}
                        </ChartShell>
                    </motion.div>

                    {/* ── Bar Chart — Dispositivos ────────── */}
                    <motion.div
                        variants={fadeUp} initial="hidden" animate="visible" custom={5}
                    >
                        <ChartShell
                            label="Dispositivos"
                            title="Breakdown por Dispositivo"
                            height={180}
                            legend={deviceData.map(d => ({
                                label: d.name.charAt(0).toUpperCase() + d.name.slice(1),
                                color: DEVICE_COLORS[d.name] || DEVICE_COLORS.unknown,
                                value: d.value,
                            }))}
                        >
                            {deviceData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={deviceData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                                        <XAxis
                                            type="number"
                                            tick={chartAxisTickStyle as any}
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                        />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            tick={{ ...chartAxisTickStyle, textTransform: 'capitalize' } as any}
                                            axisLine={false}
                                            tickLine={false}
                                            width={70}
                                        />
                                        <Tooltip
                                            contentStyle={chartTooltipStyle}
                                            cursor={{ fill: 'rgba(200,164,74,0.06)' }}
                                        />
                                        <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Cliques" animationDuration={800}>
                                            {deviceData.map((entry) => (
                                                <Cell key={entry.name} fill={DEVICE_COLORS[entry.name] || DEVICE_COLORS.unknown} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p style={{ color: T.textDim, fontSize: 13 }}>Sem dados ainda</p>
                                </div>
                            )}
                        </ChartShell>
                    </motion.div>

                    {/* ── Events Table ────────────────────── */}
                    <motion.div
                        variants={fadeUp} initial="hidden" animate="visible" custom={6}
                        style={{
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: T.radius.lg,
                            padding: 20,
                            overflow: 'hidden',
                        }}
                    >
                        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                            <h3 style={{
                                fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600,
                                color: T.text, margin: 0,
                            }}>
                                Eventos Recentes
                            </h3>
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 11,
                                color: T.textDim, letterSpacing: '0.04em',
                            }}>
                                {events.length} evento{events.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'var(--font-sans)' }}>
                                <thead>
                                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                        {['Data', 'Dispositivo', 'Browser', 'OS', 'Cidade'].map(h => (
                                            <th key={h} style={{
                                                padding: '8px 12px', textAlign: 'left', fontWeight: 600,
                                                color: T.textMuted, fontSize: 11, textTransform: 'uppercase',
                                                letterSpacing: '0.06em', fontFamily: 'var(--font-mono)',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.slice(0, 25).map((ev, i) => (
                                        <motion.tr
                                            key={ev.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 + i * 0.02 }}
                                            style={{
                                                borderBottom: `1px solid ${T.borderLight}`,
                                                transition: 'background 150ms ease',
                                            }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.hover }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                                        >
                                            <td style={{ padding: '10px 12px', color: T.text, whiteSpace: 'nowrap' }}>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Clock size={12} style={{ color: T.textDim, flexShrink: 0 }} />
                                                    {formatDate(ev.created_at)}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', color: T.textMuted, textTransform: 'capitalize' }}>
                                                <span className="inline-flex items-center gap-1.5">
                                                    {DEVICE_ICONS[(ev.device_type || '').toLowerCase()] || <Globe size={13} />}
                                                    {ev.device_type || '-'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', color: T.textMuted }}>{ev.browser || '-'}</td>
                                            <td style={{ padding: '10px 12px', color: T.textMuted }}>{ev.os || '-'}</td>
                                            <td style={{ padding: '10px 12px', color: T.textMuted }}>
                                                {ev.city || '-'}
                                            </td>
                                        </motion.tr>
                                    ))}
                                    {events.length === 0 && (
                                        <tr>
                                            <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: T.textDim }}>
                                                Nenhum evento registrado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>

                {/* ── Sidebar (1/3) ───────────────────────── */}
                <div className="flex flex-col gap-4">
                    {/* Link Info Card */}
                    <motion.div
                        variants={fadeUp} initial="hidden" animate="visible" custom={4}
                        style={{
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: T.radius.lg,
                            padding: 20,
                        }}
                    >
                        <h3 style={{
                            fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600,
                            color: T.text, marginBottom: 16,
                        }}>
                            Informacoes do Link
                        </h3>

                        <div className="flex flex-col gap-4">
                            {/* Short URL */}
                            <SidebarField label="Short URL">
                                <div className="flex items-center gap-2">
                                    <code style={{
                                        fontSize: 12, fontFamily: 'var(--font-mono)',
                                        color: T.accent, background: T.activeBg,
                                        padding: '4px 8px', borderRadius: T.radius.sm,
                                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                        {shortUrl}
                                    </code>
                                    <button
                                        onClick={() => copyToClipboard(shortUrl)}
                                        style={{
                                            padding: 6, borderRadius: T.radius.sm,
                                            border: `1px solid ${T.border}`, background: T.surface,
                                            cursor: 'pointer', color: T.textMuted,
                                        }}
                                    >
                                        <Copy size={13} />
                                    </button>
                                </div>
                            </SidebarField>

                            {/* Destination */}
                            <SidebarField label="Destino">
                                <div className="flex items-center gap-2">
                                    <span style={{
                                        fontSize: 12, fontFamily: 'var(--font-mono)',
                                        color: T.textDim, overflow: 'hidden',
                                        textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                                    }}>
                                        {link.destination_url}
                                    </span>
                                    <a href={link.destination_url} target="_blank" rel="noopener noreferrer" style={{ color: T.accent, flexShrink: 0 }}>
                                        <ExternalLink size={13} />
                                    </a>
                                </div>
                            </SidebarField>

                            {/* Campaign */}
                            {link.campaign_name && (
                                <SidebarField label="Campanha">
                                    <p style={{ fontSize: 13, color: T.text, margin: 0, fontFamily: 'var(--font-sans)' }}>
                                        {link.campaign_name}
                                    </p>
                                </SidebarField>
                            )}

                            {/* Source */}
                            {link.source && (
                                <SidebarField label="Fonte">
                                    <p style={{ fontSize: 13, color: T.text, margin: 0, fontFamily: 'var(--font-sans)', textTransform: 'capitalize' }}>
                                        {link.source}
                                    </p>
                                </SidebarField>
                            )}

                            {/* Property */}
                            {link.developments?.name && (
                                <SidebarField label="Empreendimento">
                                    <p style={{ fontSize: 13, color: T.text, margin: 0, fontFamily: 'var(--font-sans)' }}>
                                        {link.developments.name}
                                    </p>
                                </SidebarField>
                            )}

                            {/* Created */}
                            <SidebarField label="Criado em">
                                <p style={{ fontSize: 13, color: T.text, margin: 0, fontFamily: 'var(--font-sans)' }}>
                                    {new Date(link.created_at).toLocaleDateString('pt-BR', {
                                        day: '2-digit', month: 'long', year: 'numeric',
                                    })}
                                </p>
                            </SidebarField>
                        </div>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5} className="flex flex-col gap-2">
                        {/* Share via WhatsApp */}
                        <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Confira: ${campaignTitle}\n${shortUrl}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3"
                            style={{
                                padding: '14px 16px', borderRadius: T.radius.lg,
                                background: '#25D366', border: 'none',
                                color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                                fontFamily: 'var(--font-sans)', textDecoration: 'none',
                                transition: 'opacity 150ms ease',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                            <MessageCircle size={18} />
                            Compartilhar via WhatsApp
                        </a>

                        {/* Copy Link */}
                        <button
                            onClick={() => copyToClipboard(shortUrl)}
                            className="flex items-center gap-3 w-full"
                            style={{
                                padding: '14px 16px', borderRadius: T.radius.lg,
                                background: T.elevated, border: `1px solid ${T.border}`,
                                color: T.text, fontSize: 13, fontWeight: 600,
                                fontFamily: 'var(--font-sans)', cursor: 'pointer',
                                transition: 'all 150ms ease',
                            }}
                        >
                            <Copy size={18} />
                            Copiar Link Curto
                        </button>

                        {/* Print QR Code */}
                        <Link
                            href={`/backoffice/tracking/qr/${id}/print`}
                            className="flex items-center gap-3"
                            style={{
                                padding: '14px 16px', borderRadius: T.radius.lg,
                                background: T.activeBg, border: `1px solid ${T.borderGold}`,
                                color: T.accent, fontSize: 13, fontWeight: 600,
                                fontFamily: 'var(--font-sans)', textDecoration: 'none',
                                transition: 'background 150ms ease',
                            }}
                        >
                            <QrCode size={18} />
                            Imprimir QR Code
                        </Link>

                        {/* Export CSV */}
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-3 w-full"
                            style={{
                                padding: '14px 16px', borderRadius: T.radius.lg,
                                background: T.elevated, border: `1px solid ${T.border}`,
                                color: T.textMuted, fontSize: 13, fontWeight: 600,
                                fontFamily: 'var(--font-sans)', cursor: 'pointer',
                            }}
                        >
                            <Download size={18} />
                            Exportar CSV
                        </button>
                    </motion.div>

                    {/* Alert Configuration */}
                    <motion.div
                        variants={fadeUp} initial="hidden" animate="visible" custom={6}
                        style={{
                            background: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: T.radius.lg,
                            padding: 20,
                        }}
                    >
                        <h3 style={{
                            fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600,
                            color: T.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <Bell size={16} style={{ color: T.accent }} />
                            Configurar Alertas
                        </h3>
                        <p style={{ fontSize: 11, color: T.textDim, marginBottom: 12 }}>
                            Receba notificação quando alguém clicar neste link
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { value: 'every', label: 'Cada clique', desc: 'Notificação instantânea' },
                                { value: 'hourly', label: 'Resumo horário', desc: 'Consolidado por hora' },
                                { value: 'daily', label: 'Resumo diário', desc: 'Consolidado por dia' },
                                { value: 'off', label: 'Desativado', desc: 'Sem alertas' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => saveAlert(opt.value)}
                                    disabled={alertLoading}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '10px 12px', borderRadius: T.radius.md, cursor: 'pointer',
                                        background: alertMode === opt.value ? T.activeBg : 'transparent',
                                        border: `1px solid ${alertMode === opt.value ? T.borderGold : T.borderLight}`,
                                        transition: 'all 150ms ease',
                                    }}
                                >
                                    <div style={{ textAlign: 'left' }}>
                                        <span style={{
                                            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-sans)',
                                            color: alertMode === opt.value ? T.accent : T.text,
                                        }}>
                                            {opt.label}
                                        </span>
                                        <span style={{ fontSize: 10, color: T.textDim, display: 'block', marginTop: 1 }}>
                                            {opt.desc}
                                        </span>
                                    </div>
                                    {alertMode === opt.value && (
                                        <span style={{
                                            width: 8, height: 8, borderRadius: '50%', background: T.accent, flexShrink: 0,
                                        }} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Back to Tracking */}
                    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7}>
                        <Link
                            href="/backoffice/tracking"
                            className="flex items-center gap-2 justify-center"
                            style={{
                                padding: '12px 16px', borderRadius: T.radius.lg,
                                background: 'transparent', border: `1px solid ${T.borderLight}`,
                                color: T.textMuted, fontSize: 13, fontWeight: 500,
                                fontFamily: 'var(--font-sans)', textDecoration: 'none',
                                transition: 'all 150ms ease',
                            }}
                        >
                            <ArrowLeft size={14} />
                            Voltar para Tracking
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

/* ── Sidebar Field Helper ────────────────────────────────── */

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <span style={{
                fontSize: 11, fontWeight: 600, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                fontFamily: 'var(--font-mono)', display: 'block', marginBottom: 4,
            }}>
                {label}
            </span>
            {children}
        </div>
    )
}
