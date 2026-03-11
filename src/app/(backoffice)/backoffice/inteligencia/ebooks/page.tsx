'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen, Pencil, Trash2, Eye, EyeOff, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

type Ebook = {
    id: string
    title: string
    subtitle: string | null
    description: string | null
    cover_image: string | null
    amazon_url: string | null
    slug: string | null
    is_published: boolean
    sort_order: number
    created_at: string
}

export default function EbooksPage() {
    const [ebooks, setEbooks] = useState<Ebook[]>([])
    const [loading, setLoading] = useState(true)

    async function load() {
        setLoading(true)
        const supabase = createClient()
        const { data } = await supabase
            .from('ebooks')
            .select('*')
            .order('sort_order', { ascending: true })
        setEbooks(data ?? [])
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function togglePublish(id: string, current: boolean) {
        const supabase = createClient()
        await supabase.from('ebooks').update({ is_published: !current }).eq('id', id)
        load()
    }

    async function deleteEbook(id: string) {
        toast.warning('Remover este ebook?', {
            action: {
                label: 'Sim, remover',
                onClick: async () => {
                    const supabase = createClient()
                    await supabase.from('ebooks').delete().eq('id', id)
                    toast.success('Ebook removido')
                    load()
                },
            },
            duration: 6000,
        })
    }

    const published = ebooks.filter(e => e.is_published).length
    const drafts = ebooks.filter(e => !e.is_published).length

    return (
        <div className="space-y-5">
            {/* Header */}
            <PageIntelHeader
                moduleLabel="BIBLIOTECA IMI"
                title="Ebooks"
                subtitle="Gestão da biblioteca de publicações e conteúdo premium"
                actions={
                    <Link
                        href="/backoffice/inteligencia/ebooks/novo"
                        className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{ background: 'var(--bo-accent)' }}
                    >
                        <Plus size={15} />
                        Novo Ebook
                    </Link>
                }
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Total', value: ebooks.length, color: T.text },
                    { label: 'Publicados', value: published, color: '#34d399' },
                    { label: 'Rascunhos', value: drafts, color: T.textMuted },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl p-4" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: T.textMuted }}>{s.label}</p>
                        <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ background: T.elevated, border: `1px solid ${T.border}` }}
            >
                {loading ? (
                    <div className="space-y-0">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse"
                                style={{ borderBottom: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                                <div className="w-8 h-8 rounded-xl flex-shrink-0" style={{ background: 'var(--bo-hover)' }} />
                                <div className="flex-1">
                                    <div className="h-3 rounded mb-2" style={{ background: 'var(--bo-hover)', width: '40%' }} />
                                    <div className="h-2.5 rounded" style={{ background: 'var(--bo-hover)', width: '25%' }} />
                                </div>
                                <div className="h-5 w-16 rounded-full" style={{ background: 'var(--bo-hover)' }} />
                            </div>
                        ))}
                    </div>
                ) : ebooks.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen size={40} style={{ color: T.textMuted, opacity: 0.25 }} className="mx-auto mb-4" />
                        <p className="text-sm font-semibold mb-1" style={{ color: T.text }}>Nenhum ebook cadastrado</p>
                        <p className="text-xs mb-4" style={{ color: T.textMuted }}>Adicione publicações à biblioteca da IMI</p>
                        <Link
                            href="/backoffice/inteligencia/ebooks/novo"
                            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-xs font-semibold text-white"
                            style={{ background: 'var(--bo-accent)' }}
                        >
                            <Plus size={13} /> Cadastrar primeiro ebook
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                    {['Publicação', 'Status', 'Ordem', 'Amazon', 'Ações'].map(h => (
                                        <th
                                            key={h}
                                            className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap"
                                            style={{ color: T.textMuted }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ebooks.map((e, idx) => (
                                    <tr
                                        key={e.id}
                                        style={{ borderBottom: idx < ebooks.length - 1 ? `1px solid ${T.border}` : 'none' }}
                                        className="transition-colors hover:opacity-90"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                                    style={{ background: 'rgba(72,101,129,0.18)' }}
                                                >
                                                    <BookOpen size={14} style={{ color: 'var(--bo-accent)' }} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm" style={{ color: T.text }}>{e.title}</p>
                                                    {e.subtitle && (
                                                        <p className="text-xs mt-0.5" style={{ color: T.textMuted }}>{e.subtitle}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full whitespace-nowrap"
                                                style={e.is_published
                                                    ? { color: '#34d399', background: 'rgba(52,211,153,0.1)' }
                                                    : { color: T.textMuted, background: 'rgba(255,255,255,0.05)' }
                                                }
                                            >
                                                {e.is_published ? 'Publicado' : 'Rascunho'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="text-xs font-mono" style={{ color: T.textMuted }}>{e.sort_order}</span>
                                        </td>
                                        <td className="px-5 py-4">
                                            {e.amazon_url ? (
                                                <a
                                                    href={e.amazon_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs font-semibold"
                                                    style={{ color: 'var(--bo-accent)' }}
                                                >
                                                    <ExternalLink size={12} /> Link
                                                </a>
                                            ) : (
                                                <span className="text-xs" style={{ color: T.textMuted }}>—</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => togglePublish(e.id, e.is_published)}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:opacity-70"
                                                    title={e.is_published ? 'Despublicar' : 'Publicar'}
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}
                                                >
                                                    {e.is_published
                                                        ? <EyeOff size={13} style={{ color: T.textMuted }} />
                                                        : <Eye size={13} style={{ color: 'var(--bo-accent)' }} />
                                                    }
                                                </button>
                                                <Link
                                                    href={`/backoffice/inteligencia/ebooks/${e.id}/editar`}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:opacity-70"
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}
                                                >
                                                    <Pencil size={13} style={{ color: T.textMuted }} />
                                                </Link>
                                                <button
                                                    onClick={() => deleteEbook(e.id)}
                                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors hover:bg-red-500/10"
                                                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}` }}
                                                >
                                                    <Trash2 size={13} style={{ color: '#ef4444' }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
