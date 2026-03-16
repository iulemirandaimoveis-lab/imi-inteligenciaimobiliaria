'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    ArrowLeft, Plus, Search, Download, CheckCircle,
    Clock, XCircle, Home, Ruler, DollarSign, User,
    Star, Loader2, Building2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui/PageIntelHeader'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileAppBar, MobileBottomNav } from '../../mobile-ui'

// ─── Shared Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    available:  { label: 'Disponível', color: '#10B981', bg: 'rgba(16,185,129,0.14)', icon: CheckCircle },
    disponivel: { label: 'Disponível', color: '#10B981', bg: 'rgba(16,185,129,0.14)', icon: CheckCircle },
    reserved:   { label: 'Reservada',  color: '#F59E0B', bg: 'rgba(245,158,11,0.14)',  icon: Clock },
    reservada:  { label: 'Reservada',  color: '#F59E0B', bg: 'rgba(245,158,11,0.14)',  icon: Clock },
    sold:       { label: 'Vendida',    color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: XCircle },
    vendida:    { label: 'Vendida',    color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: XCircle },
}

function formatPrice(price: number) {
    if (!price) return '—'
    if (price >= 1000000) return `R$ ${(price / 1000000).toFixed(2).replace('.', ',')}M`
    if (price >= 1000) return `R$ ${Math.floor(price / 1000)}k`
    return `R$ ${price.toLocaleString('pt-BR')}`
}

// ─── Mobile Loading ────────────────────────────────────────────────────────────

function MobileUnidadesLoading() {
    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MobileGlobalStyles />
            <Loader2 size={28} style={{ color: 'var(--imi-gold-500)', animation: 'spin 1s linear infinite' }} />
            <style suppressHydrationWarning>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
    )
}

// ─── Desktop Loading ───────────────────────────────────────────────────────────

function DesktopLoading() {
    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.accent }} />
        </div>
    )
}

// ─── Mobile Unidades ──────────────────────────────────────────────────────────

interface MobileUnidadesProps {
    id: string
    development: any
    filtered: any[]
    unidades: any[]
    stats: { total: number; disponiveis: number; reservadas: number; vendidas: number }
    searchTerm: string
    setSearchTerm: (v: string) => void
    statusFilter: string
    setStatusFilter: (v: string) => void
    router: ReturnType<typeof useRouter>
}

function MobileUnidades({
    id,
    development,
    filtered,
    unidades,
    stats,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    router,
}: MobileUnidadesProps) {
    const [searchFocused, setSearchFocused] = useState(false)

    const subtitle = development?.name
        ? `${development.name} · ${stats.total} unidades`
        : `${stats.total} unidades`

    const statusChips = [
        { value: 'all',       label: 'Todos' },
        { value: 'available', label: 'Disponível' },
        { value: 'reserved',  label: 'Reservada' },
        { value: 'sold',      label: 'Vendida' },
    ]

    const statCards = [
        { label: 'Total',       value: stats.total,       color: '#EBE7E0' },
        { label: 'Disponíveis', value: stats.disponiveis, color: '#10B981' },
        { label: 'Reservadas',  value: stats.reservadas,  color: '#F59E0B' },
        { label: 'Vendidas',    value: stats.vendidas,    color: '#6B7280' },
    ]

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 72, paddingBottom: 80 }}>
            <MobileGlobalStyles />

            {/* AppBar */}
            <MobileAppBar
                title="Unidades"
                subtitle={subtitle}
                onBack={() => router.push(`/backoffice/imoveis/${id}`)}
            />

            {/* Stats Strip — 2×2 grid */}
            <div style={{ padding: '0 14px', marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {statCards.map(card => (
                        <div
                            key={card.label}
                            style={{
                                background: 'var(--bg-elevated)',
                                borderRadius: 12,
                                padding: 14,
                                border: '1px solid rgba(184,148,58,0.10)',
                            }}
                        >
                            <div style={{
                                fontFamily: 'var(--font-dm-mono, monospace)',
                                fontSize: 24,
                                fontWeight: 400,
                                color: card.color,
                                lineHeight: 1,
                                marginBottom: 6,
                                fontVariantNumeric: 'tabular-nums',
                            }}>
                                {card.value}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                fontSize: 9,
                                fontWeight: 600,
                                letterSpacing: '1.2px',
                                textTransform: 'uppercase',
                                color: '#5C6B7D',
                            }}>
                                {card.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '0 14px', marginBottom: 12 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    height: 44,
                    background: 'var(--bg-elevated)',
                    border: `1px solid ${searchFocused ? 'rgba(184,148,58,0.5)' : 'rgba(184,148,58,0.15)'}`,
                    borderRadius: 10,
                    padding: '0 14px',
                    transition: 'border-color 150ms ease',
                }}>
                    <svg
                        width="16" height="16"
                        viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                        style={{ color: searchFocused ? 'var(--imi-gold-500)' : '#5C6B7D', flexShrink: 0, transition: 'color 150ms ease' }}
                    >
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Buscar unidade..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            fontFamily: 'var(--font-montserrat, sans-serif)',
                            fontSize: 14,
                            color: '#EBE7E0',
                        }}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mob-btn-tap"
                            style={{
                                width: 20, height: 20, borderRadius: 999,
                                background: '#5C6B7D', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                padding: 0,
                            }}
                        >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0B1120" strokeWidth="3" strokeLinecap="round">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Status Filter Chips */}
            <div style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                padding: '0 14px',
                marginBottom: 16,
                scrollbarWidth: 'none',
            }}>
                <style suppressHydrationWarning>{`.mob-chips-scroll::-webkit-scrollbar{display:none}`}</style>
                {statusChips.map(chip => {
                    const isActive = statusFilter === chip.value
                    return (
                        <button
                            key={chip.value}
                            onClick={() => setStatusFilter(chip.value)}
                            className="mob-chip-tap"
                            style={{
                                flexShrink: 0,
                                height: 32,
                                padding: '0 14px',
                                borderRadius: 999,
                                background: isActive ? 'var(--imi-gold-500)' : 'transparent',
                                border: `1px solid ${isActive ? 'var(--imi-gold-500)' : 'rgba(184,148,58,0.3)'}`,
                                color: isActive ? '#0B1120' : '#9FAAB8',
                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                fontSize: 12,
                                fontWeight: isActive ? 700 : 500,
                                cursor: 'pointer',
                                transition: 'all 150ms ease',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {chip.label}
                        </button>
                    )
                })}
            </div>

            {/* Unit Cards */}
            <div style={{ padding: '0 14px' }}>
                {filtered.length === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '60px 0',
                        gap: 12,
                        textAlign: 'center',
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: 16,
                            background: 'rgba(184,148,58,0.06)',
                            border: '1px solid rgba(184,148,58,0.18)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Building2 size={28} style={{ color: 'rgba(184,148,58,0.35)' }} />
                        </div>
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-playfair, serif)',
                                fontSize: 18, fontWeight: 500, color: '#EBE7E0', marginBottom: 6,
                            }}>
                                Nenhuma unidade encontrada
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                fontSize: 13, color: '#5C6B7D', lineHeight: 1.5,
                            }}>
                                {unidades.length === 0
                                    ? 'Cadastre a primeira unidade deste empreendimento'
                                    : 'Ajuste os filtros para ver mais resultados'}
                            </div>
                        </div>
                        {unidades.length === 0 && (
                            <button
                                onClick={() => router.push(`/backoffice/imoveis/${id}/unidades/nova`)}
                                className="mob-btn-tap"
                                style={{
                                    height: 44, padding: '0 24px', borderRadius: 10,
                                    background: 'var(--imi-gold-500)', border: 'none', cursor: 'pointer',
                                    fontFamily: 'var(--font-montserrat, sans-serif)',
                                    fontSize: 12, fontWeight: 700, letterSpacing: '1px',
                                    textTransform: 'uppercase', color: '#0B1120',
                                }}
                            >
                                + Nova Unidade
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {filtered.map(unidade => {
                            const st = STATUS_CONFIG[unidade.status] || STATUS_CONFIG.available
                            return (
                                <div
                                    key={unidade.id}
                                    className="mob-btn-tap"
                                    onClick={() => router.push(`/backoffice/imoveis/${id}/unidades/${unidade.id}`)}
                                    style={{
                                        background: 'var(--bg-elevated)',
                                        borderRadius: 12,
                                        padding: 14,
                                        border: unidade.is_highlighted
                                            ? '1px solid rgba(184,148,58,0.55)'
                                            : '1px solid rgba(184,148,58,0.12)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {/* Top row: name + status badge */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                                <span style={{
                                                    fontFamily: 'var(--font-playfair, serif)',
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: '#EBE7E0',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {unidade.unit_name || 'Unidade'}
                                                </span>
                                                {unidade.is_highlighted && (
                                                    <Star size={11} style={{ fill: 'var(--imi-gold-500)', color: 'var(--imi-gold-500)', flexShrink: 0 }} />
                                                )}
                                            </div>
                                            <div style={{
                                                fontFamily: 'var(--font-montserrat, sans-serif)',
                                                fontSize: 11,
                                                color: '#5C6B7D',
                                            }}>
                                                {unidade.unit_type || 'Apartamento'}
                                                {unidade.position ? ` · ${unidade.position}` : ''}
                                                {unidade.tower ? ` · Torre ${unidade.tower}` : ''}
                                            </div>
                                        </div>

                                        {/* Status pill */}
                                        <span style={{
                                            flexShrink: 0,
                                            marginLeft: 10,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '4px 9px',
                                            borderRadius: 999,
                                            background: st.bg,
                                            color: st.color,
                                            fontFamily: 'var(--font-montserrat, sans-serif)',
                                            fontSize: 10,
                                            fontWeight: 700,
                                            letterSpacing: '0.2px',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            <st.icon size={9} />
                                            {st.label}
                                        </span>
                                    </div>

                                    {/* Specs row: area, bedrooms, bathrooms */}
                                    {(unidade.area > 0 || unidade.bedrooms > 0 || unidade.bathrooms > 0) && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 14,
                                            marginBottom: 10,
                                            paddingBottom: 10,
                                            borderBottom: '1px solid rgba(184,148,58,0.08)',
                                        }}>
                                            {unidade.area > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Ruler size={12} style={{ color: '#5C6B7D', flexShrink: 0 }} />
                                                    <span style={{
                                                        fontFamily: 'var(--font-dm-mono, monospace)',
                                                        fontSize: 12,
                                                        color: '#9FAAB8',
                                                    }}>{unidade.area}m²</span>
                                                </div>
                                            )}
                                            {unidade.bedrooms > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <Home size={12} style={{ color: '#5C6B7D', flexShrink: 0 }} />
                                                    <span style={{
                                                        fontFamily: 'var(--font-dm-mono, monospace)',
                                                        fontSize: 12,
                                                        color: '#9FAAB8',
                                                    }}>{unidade.bedrooms} qts</span>
                                                </div>
                                            )}
                                            {unidade.bathrooms > 0 && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#5C6B7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                                        <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" x2="8" y1="5" y2="7"/><line x1="2" x2="22" y1="12" y2="12"/>
                                                    </svg>
                                                    <span style={{
                                                        fontFamily: 'var(--font-dm-mono, monospace)',
                                                        fontSize: 12,
                                                        color: '#9FAAB8',
                                                    }}>{unidade.bathrooms} ban</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Price row */}
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                        <span style={{
                                            fontFamily: 'var(--font-montserrat, sans-serif)',
                                            fontSize: 9,
                                            fontWeight: 600,
                                            letterSpacing: '1px',
                                            textTransform: 'uppercase',
                                            color: '#5C6B7D',
                                        }}>Valor</span>
                                        <span style={{
                                            fontFamily: 'var(--font-dm-mono, monospace)',
                                            fontSize: 18,
                                            fontWeight: 400,
                                            color: 'var(--imi-gold-500)',
                                            fontVariantNumeric: 'tabular-nums',
                                        }}>
                                            {formatPrice(unidade.total_price)}
                                        </span>
                                    </div>

                                    {/* Notes */}
                                    {unidade.notes && (
                                        <div style={{
                                            marginTop: 8,
                                            fontFamily: 'var(--font-montserrat, sans-serif)',
                                            fontSize: 11,
                                            color: '#5C6B7D',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {unidade.notes}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* FAB — Nova Unidade */}
            <button
                onClick={() => router.push(`/backoffice/imoveis/${id}/unidades/nova`)}
                className="mob-btn-tap"
                style={{
                    position: 'fixed',
                    right: 16,
                    bottom: `calc(72px + env(safe-area-inset-bottom, 0px))`,
                    height: 52,
                    padding: '0 20px',
                    borderRadius: 26,
                    background: 'var(--imi-gold-500)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: '#0B1120',
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: '0 4px 20px rgba(184,148,58,0.35)',
                    zIndex: 90,
                    letterSpacing: '0.2px',
                }}
            >
                <Plus size={18} />
                Nova Unidade
            </button>

            <MobileBottomNav />
        </div>
    )
}

// ─── Desktop Unidades ─────────────────────────────────────────────────────────

interface DesktopUnidadesProps {
    id: string
    development: any
    filtered: any[]
    unidades: any[]
    stats: { total: number; disponiveis: number; reservadas: number; vendidas: number }
    tipos: string[]
    searchTerm: string
    setSearchTerm: (v: string) => void
    statusFilter: string
    setStatusFilter: (v: string) => void
    tipoFilter: string
    setTipoFilter: (v: string) => void
    router: ReturnType<typeof useRouter>
}

function DesktopUnidades({
    id,
    development,
    filtered,
    unidades,
    stats,
    tipos,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    tipoFilter,
    setTipoFilter,
    router,
}: DesktopUnidadesProps) {
    const availPct = stats.total > 0 ? Math.round((stats.disponiveis / stats.total) * 100) : 0
    const soldPct  = stats.total > 0 ? Math.round((stats.vendidas  / stats.total) * 100) : 0

    return (
        <div className="space-y-6 pb-24">
            {/* Back nav */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.push(`/backoffice/imoveis/${id}`)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textDim }}
                >
                    <ArrowLeft size={17} />
                </button>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: T.textMuted }}>
                    {development?.name || 'Imóvel'} / Unidades
                </span>
            </div>

            {/* Header */}
            <PageIntelHeader
                moduleLabel="INVENTÁRIO DE UNIDADES"
                title={development?.name || 'Unidades'}
                subtitle="Gestão de unidades e disponibilidade do empreendimento"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            className="flex items-center gap-2 h-10 px-4 rounded-xl font-medium text-sm transition-colors"
                            style={{ border: `1px solid ${T.border}`, color: T.text, background: T.surface }}
                            onClick={() => toast.info('Export em desenvolvimento')}
                        >
                            <Download size={15} />
                            <span className="hidden sm:inline">Exportar</span>
                        </button>
                        <button
                            onClick={() => router.push(`/backoffice/imoveis/${id}/unidades/nova`)}
                            className="flex items-center gap-2 h-10 px-5 text-white rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
                            style={{ background: T.accent }}
                        >
                            <Plus size={15} />
                            <span className="hidden sm:inline">Nova Unidade</span>
                        </button>
                    </div>
                }
            />

            {/* Stats Strip */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
                {[
                    { label: 'Total', value: stats.total, color: T.text, sub: 'unidades' },
                    {
                        label: 'Disponíveis', value: stats.disponiveis, color: '#10B981',
                        sub: `${availPct}% do total`,
                        bar: availPct, barColor: '#10B981',
                    },
                    { label: 'Reservadas', value: stats.reservadas, color: '#F59E0B', sub: 'pendente contrato' },
                    {
                        label: 'Vendidas', value: stats.vendidas, color: T.textMuted,
                        sub: `${soldPct}% do total`,
                        bar: soldPct, barColor: T.textMuted,
                    },
                ].map(s => (
                    <div
                        key={s.label}
                        className="rounded-2xl p-4"
                        style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    >
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: T.textMuted }}>
                            {s.label}
                        </p>
                        <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: T.textMuted }}>{s.sub}</p>
                        {s.bar !== undefined && (
                            <div className="h-1 rounded-full overflow-hidden mt-2" style={{ background: T.elevated }}>
                                <div
                                    className="h-full transition-all"
                                    style={{ width: `${s.bar}%`, background: s.barColor }}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-4"
                style={{ background: T.surface, border: `1px solid ${T.border}` }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={15} style={{ color: T.textMuted }} />
                        <input
                            type="text"
                            placeholder="Buscar unidade..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full h-10 pl-10 pr-4 rounded-xl focus:outline-none text-sm"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="h-10 px-4 rounded-xl focus:outline-none text-sm"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    >
                        <option value="all">Todos os status</option>
                        <option value="available">Disponível</option>
                        <option value="reserved">Reservada</option>
                        <option value="sold">Vendida</option>
                    </select>
                    <select
                        value={tipoFilter}
                        onChange={e => setTipoFilter(e.target.value)}
                        className="h-10 px-4 rounded-xl focus:outline-none text-sm"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.text }}
                    >
                        <option value="all">Todos os tipos</option>
                        {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </motion.div>

            {/* Unit Cards Grid */}
            {filtered.length === 0 ? (
                <div
                    className="text-center py-20 rounded-2xl"
                    style={{ background: T.surface, border: `1px dashed ${T.border}` }}
                >
                    <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                    >
                        <Building2 size={28} style={{ color: T.textMuted, opacity: 0.4 }} />
                    </div>
                    <p className="font-semibold mb-1" style={{ color: T.text }}>
                        Nenhuma unidade encontrada
                    </p>
                    <p className="text-sm" style={{ color: T.textMuted }}>
                        {unidades.length === 0
                            ? 'Cadastre a primeira unidade deste empreendimento'
                            : 'Ajuste os filtros para ver mais resultados'}
                    </p>
                    {unidades.length === 0 && (
                        <button
                            onClick={() => router.push(`/backoffice/imoveis/${id}/unidades/nova`)}
                            className="mt-5 h-10 px-6 rounded-xl font-semibold text-sm text-white transition-all hover:scale-[1.02]"
                            style={{ background: T.accent }}
                        >
                            + Nova Unidade
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((unidade, index) => {
                        const st = STATUS_CONFIG[unidade.status] || STATUS_CONFIG.available
                        const StatusIcon = st.icon
                        return (
                            <motion.div
                                key={unidade.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.04, duration: 0.3 }}
                                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                                className="rounded-2xl p-4 cursor-pointer transition-shadow hover:shadow-lg"
                                style={{
                                    background: T.surface,
                                    border: unidade.is_highlighted
                                        ? `2px solid ${T.accent}`
                                        : `1px solid ${T.border}`,
                                }}
                                onClick={() => router.push(`/backoffice/imoveis/${id}/unidades/${unidade.id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <h3 className="font-bold text-sm" style={{ color: T.text }}>
                                                {unidade.unit_name || 'Unidade'}
                                            </h3>
                                            {unidade.is_highlighted && (
                                                <Star size={11} style={{ fill: T.accent, color: T.accent }} />
                                            )}
                                        </div>
                                        <p className="text-xs" style={{ color: T.textMuted }}>
                                            {unidade.unit_type || 'Apartamento'}
                                            {unidade.position ? ` · ${unidade.position}` : ''}
                                            {unidade.tower ? ` · Torre ${unidade.tower}` : ''}
                                        </p>
                                    </div>
                                    <span
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 flex-shrink-0"
                                        style={{ background: st.bg, color: st.color }}
                                    >
                                        <StatusIcon size={9} />
                                        {st.label}
                                    </span>
                                </div>

                                <div
                                    className="grid grid-cols-2 gap-2 mb-3 pb-3"
                                    style={{ borderBottom: `1px solid ${T.border}` }}
                                >
                                    {unidade.area > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
                                            <Ruler size={11} />
                                            <span>{unidade.area}m²</span>
                                        </div>
                                    )}
                                    {(unidade.bedrooms > 0 || unidade.bathrooms > 0) && (
                                        <div className="flex items-center gap-1.5 text-xs" style={{ color: T.textMuted }}>
                                            <Home size={11} />
                                            <span>
                                                {unidade.bedrooms > 0 ? `${unidade.bedrooms}Q` : ''}
                                                {unidade.bathrooms > 0 ? ` ${unidade.bathrooms}B` : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: T.textMuted }}>Valor</p>
                                    <p className="text-lg font-bold" style={{ color: T.text }}>
                                        {formatPrice(unidade.total_price)}
                                    </p>
                                </div>

                                {unidade.notes && (
                                    <p className="text-[11px] mt-2 line-clamp-1" style={{ color: T.textMuted }}>
                                        {unidade.notes}
                                    </p>
                                )}
                            </motion.div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ─── Page Entry Point ─────────────────────────────────────────────────────────

export default function ImoveisUnidadesPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string
    const isMobile = useIsMobile()

    const [development, setDevelopment] = useState<any>(null)
    const [unidades, setUnidades] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [tipoFilter, setTipoFilter] = useState('all')

    useEffect(() => {
        if (!id) return
        const supabase = createClient()
        Promise.all([
            supabase
                .from('developments')
                .select('id, name, slug')
                .eq('id', id)
                .single(),
            supabase
                .from('development_units')
                .select('*')
                .eq('development_id', id)
                .order('created_at', { ascending: true }),
        ]).then(([{ data: dev }, { data: units }]) => {
            setDevelopment(dev)
            setUnidades(units || [])
            setLoading(false)
        })
    }, [id])

    const filtered = unidades.filter(u => {
        const q = searchTerm.toLowerCase()
        const matchSearch = !q ||
            (u.unit_name || '').toLowerCase().includes(q) ||
            (u.notes || '').toLowerCase().includes(q)
        const st = u.status || 'available'
        const matchStatus = statusFilter === 'all' || st === statusFilter
        const matchTipo = tipoFilter === 'all' || (u.unit_type || '') === tipoFilter
        return matchSearch && matchStatus && matchTipo
    })

    const tipos = [...new Set(unidades.map(u => u.unit_type).filter(Boolean))]

    const stats = {
        total: unidades.length,
        disponiveis: unidades.filter(u => !u.status || u.status === 'available' || u.status === 'disponivel').length,
        reservadas: unidades.filter(u => u.status === 'reserved' || u.status === 'reservada').length,
        vendidas: unidades.filter(u => u.status === 'sold' || u.status === 'vendida').length,
    }

    if (loading) return isMobile ? <MobileUnidadesLoading /> : <DesktopLoading />

    return isMobile
        ? (
            <MobileUnidades
                id={id}
                development={development}
                filtered={filtered}
                unidades={unidades}
                stats={stats}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                router={router}
            />
        )
        : (
            <DesktopUnidades
                id={id}
                development={development}
                filtered={filtered}
                unidades={unidades}
                stats={stats}
                tipos={tipos}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                tipoFilter={tipoFilter}
                setTipoFilter={setTipoFilter}
                router={router}
            />
        )
}
