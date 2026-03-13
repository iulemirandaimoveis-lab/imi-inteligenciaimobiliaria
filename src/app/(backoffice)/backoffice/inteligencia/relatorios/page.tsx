'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Pencil, Trash2, Eye, EyeOff, Download, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { getStatusConfig } from '@/app/(backoffice)/lib/constants'
import { PageIntelHeader, KPICard, FilterTabs, StatusBadge } from '@/app/(backoffice)/components/ui'
import type { FilterTab } from '@/app/(backoffice)/components/ui'

type Report = {
    id: string
    title: string
    summary: string | null
    pdf_url: string | null
    published_at: string | null
    category: string | null
    is_published: boolean
    slug: string | null
    created_at: string
}

function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {
    mercado: { color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
    residencial: { color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
    comercial: { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
    luxo: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)' },
    macro: { color: '#EC4899', bg: 'rgba(236,72,153,0.1)' },
}

function getCategoryStyle(cat: string | null) {
    if (!cat) return { color: T.textMuted, bg: 'rgba(255,255,255,0.05)' }
    return CATEGORY_COLORS[cat.toLowerCase()] ?? { color: '#8CA4B8', bg: 'rgba(72,101,129,0.1)' }
}

export default function RelatoriosBackofficePage() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [filterTab, setFilterTab] = useState('todos')

    async function load() {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('market_reports')
            .select('*')
            .order('published_at', { ascending: false })
        setReports(data ?? [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function togglePublish(id: string, current: boolean) {
        const supabase = createClient()
        await supabase.from('market_reports').update({ is_published: !current }).eq('id', id)
        load()
    }

    async function deleteReport(id: string) {
        toast.warning('Remover este relatório?', {
            action: {
                label: 'Sim, remover',
                onClick: async () => {
                    const supabase = createClient()
                    await supabase.from('market_reports').delete().eq('id', id)
                    toast.success('Relatório removido')
                    load()
                },
            },
            duration: 6000,
        })
    }

    const published = reports.filter(r => r.is_published).length
    const drafts = reports.filter(r => !r.is_published).length
    const filtered = reports.filter(r => {
        if (filterTab === 'publicados') return r.is_published
        if (filterTab === 'rascunhos') return !r.is_published
        return true
    })

    return (
        <div className="space-y-5">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="INTELIGÊNCIA DE MERCADO"
                title="Relatórios de Mercado"
                subtitle="Estudos técnicos, dossiês e análises proprietárias da IMI"
                actions={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={load}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                            style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                        >
                            <RefreshCw size={14} style={{ color: T.textMuted }} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <Link
                            href="/backoffice/inteligencia/relatorios/novo"
                            className="bo-btn bo-btn-primary"
                            style={{ background: 'var(--bo-accent)' }}
                        >
                            <Plus size={15} />
                            Novo Relatório
                        </Link>
                    </div>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <KPICard label="Total" value={String(reports.length)} icon={<FileText size={14} />} size="sm" />
                <KPICard label="Publicados" value={String(published)} icon={<Eye size={14} />} accent="green" size="sm" />
                <KPICard label="Rascunhos" value={String(drafts)} icon={<EyeOff size={14} />} size="sm" />
            </div>

            {/* Filter tabs */}
            <FilterTabs
                tabs={[
                    { id: 'todos',      label: 'Todos',      count: reports.length },
                    { id: 'publicados', label: 'Publicados', count: published,  dotColor: getStatusConfig('publicado').dot },
                    { id: 'rascunhos',  label: 'Rascunhos',  count: drafts,     dotColor: getStatusConfig('rascunho').dot },
                ] as FilterTab[]}
                active={filterTab}
                onChange={setFilterTab}
            />

            {/* Table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                {loading ? (
                    <div className="space-y-0">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse"
                                style={{ borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                                <div className="w-9 h-9 rounded-xl flex-shrink-0" style={{ background: 'var(--bo-hover)' }} />
                                <div className="flex-1">
                                    <div className="h-3.5 rounded mb-1.5" style={{ background: 'var(--bo-hover)', width: '45%' }} />
                                    <div className="h-2.5 rounded" style={{ background: 'var(--bo-hover)', width: '25%' }} />
                                </div>
                                <div className="h-5 w-20 rounded-full" style={{ background: 'var(--bo-hover)' }} />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText size={40} style={{ color: T.textMuted, opacity: 0.25 }} className="mx-auto mb-4" />
                        <p className="text-sm font-semibold mb-1" style={{ color: T.text }}>Nenhum relatório cadastrado</p>
                        <p className="text-xs mb-4" style={{ color: T.textMuted }}>Publique estudos e dossiês de mercado</p>
                        <Link
                            href="/backoffice/inteligencia/relatorios/novo"
                            className="bo-btn bo-btn-primary"
                            style={{ background: 'var(--bo-accent)' }}
                        >
                            <Plus size={13} /> Cadastrar primeiro relatório
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                    {['Relatório', 'Categoria', 'Publicação', 'PDF', 'Status', 'Ações'].map(h => (
                                        <th key={h}
                                            className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                                            style={{ color: T.textMuted }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r, idx) => {
                                    const catStyle = getCategoryStyle(r.category)
                                    return (
                                        <tr key={r.id}
                                            style={{ borderBottom: idx < filtered.length - 1 ? `1px solid ${T.border}` : 'none' }}
                                            className="transition-colors hover:opacity-90">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                        style={{ background: 'rgba(72,101,129,0.15)' }}>
                                                        <FileText size={14} style={{ color: 'var(--bo-accent)' }} />
                                                    </div>
                                                    <p className="font-semibold max-w-[220px] truncate" style={{ color: T.text }}>{r.title}</p>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {r.category ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                                                        style={{ background: catStyle.bg, color: catStyle.color }}>
                                                        {r.category}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs" style={{ color: T.textMuted }}>—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs whitespace-nowrap" style={{ color: T.textMuted }}>{formatDate(r.published_at)}</span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {r.pdf_url ? (
                                                    <a href={r.pdf_url} target="_blank" rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-xs font-semibold"
                                                        style={{ color: 'var(--bo-accent)' }}>
                                                        <Download size={12} /> PDF
                                                    </a>
                                                ) : (
                                                    <span className="text-xs" style={{ color: T.textMuted }}>—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusBadge statusKey={r.is_published ? 'publicado' : 'rascunho'} size="xs" />
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => togglePublish(r.id, r.is_published)}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
                                                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}
                                                    >
                                                        {r.is_published
                                                            ? <EyeOff size={13} style={{ color: T.textMuted }} />
                                                            : <Eye size={13} style={{ color: 'var(--bo-accent)' }} />
                                                        }
                                                    </button>
                                                    <Link
                                                        href={`/backoffice/inteligencia/relatorios/${r.id}/editar`}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:opacity-70 transition-opacity"
                                                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}
                                                    >
                                                        <Pencil size={13} style={{ color: T.textMuted }} />
                                                    </Link>
                                                    <button
                                                        onClick={() => deleteReport(r.id)}
                                                        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-500/10 transition-colors"
                                                        style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}
                                                    >
                                                        <Trash2 size={13} style={{ color: 'var(--bo-error)' }} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
