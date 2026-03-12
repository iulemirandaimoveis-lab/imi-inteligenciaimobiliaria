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

export default function ImoveisUnidadesPage() {
    const params = useParams()
    const router = useRouter()
    const id = params?.id as string

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: T.accent }} />
            </div>
        )
    }

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
