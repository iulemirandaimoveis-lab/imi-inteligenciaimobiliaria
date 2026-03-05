'use client'

import { useState, useEffect } from 'react'
import { Plus, FileText, Pencil, Trash2, Eye, EyeOff, Download, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

export default function RelatoriosBackofficePage() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)

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

    return (
        <div className="p-6 lg:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--bo-text)', fontFamily: "'Playfair Display', serif" }}>
                        Relatórios de Mercado
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--bo-text-muted)' }}>
                        Gestão de estudos técnicos e dossiês
                    </p>
                </div>
                <Link
                    href="/backoffice/inteligencia/relatorios/novo"
                    className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))' }}
                >
                    <Plus size={15} />
                    Novo Relatório
                </Link>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin" size={22} style={{ color: 'var(--bo-text-muted)' }} />
                    </div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-20">
                        <FileText size={36} style={{ color: 'var(--bo-text-muted)', opacity: 0.4 }} className="mx-auto mb-4" />
                        <p className="text-sm" style={{ color: 'var(--bo-text-muted)' }}>Nenhum relatório cadastrado</p>
                        <Link href="/backoffice/inteligencia/relatorios/novo" className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold" style={{ color: 'var(--accent-500)' }}>
                            <Plus size={13} /> Cadastrar primeiro relatório
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--bo-border)' }}>
                                {['Título', 'Categoria', 'Publicação', 'PDF', 'Status', 'Ações'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--bo-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((r) => (
                                <tr key={r.id} style={{ borderBottom: '1px solid var(--bo-border-subtle)' }} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bo-icon-bg)' }}>
                                                <FileText size={14} style={{ color: 'var(--accent-500)' }} />
                                            </div>
                                            <p className="font-medium max-w-[220px] truncate" style={{ color: 'var(--bo-text)' }}>{r.title}</p>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>{r.category ?? '—'}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>{formatDate(r.published_at)}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {r.pdf_url ? (
                                            <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent-500)' }}>
                                                <Download size={12} /> PDF
                                            </a>
                                        ) : (
                                            <span className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                            style={r.is_published
                                                ? { color: '#34d399', background: 'rgba(52,211,153,0.1)' }
                                                : { color: 'var(--bo-text-muted)', background: 'var(--bo-icon-bg)' }
                                            }
                                        >
                                            {r.is_published ? 'Publicado' : 'Rascunho'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => togglePublish(r.id, r.is_published)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
                                                {r.is_published ? <EyeOff size={13} style={{ color: 'var(--bo-text-muted)' }} /> : <Eye size={13} style={{ color: 'var(--accent-500)' }} />}
                                            </button>
                                            <Link href={`/backoffice/inteligencia/relatorios/${r.id}/editar`} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10">
                                                <Pencil size={13} style={{ color: 'var(--bo-text-muted)' }} />
                                            </Link>
                                            <button onClick={() => deleteReport(r.id)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/10">
                                                <Trash2 size={13} style={{ color: '#ef4444' }} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
