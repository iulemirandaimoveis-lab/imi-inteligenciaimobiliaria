'use client'

import { useState, useEffect } from 'react'
import { Plus, BookOpen, Pencil, Trash2, Eye, EyeOff, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const T = {
    surface: 'var(--bo-surface)', elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)', borderGold: 'var(--bo-border-gold)',
    text: 'var(--bo-text)', textSub: 'var(--bo-text-muted)',
    gold: 'var(--bo-accent)',
}

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

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--bo-text)', fontFamily: "'Playfair Display', serif" }}>
                        Ebooks
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--bo-text-muted)' }}>
                        Gestão da biblioteca de publicações da IMI
                    </p>
                </div>
                <Link
                    href="/backoffice/inteligencia/ebooks/novo"
                    className="flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white transition-all"
                    style={{ background: 'var(--accent-500)' }}
                >
                    <Plus size={15} />
                    Novo Ebook
                </Link>
            </div>

            {/* Table */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--bo-card)', border: '1px solid var(--bo-border)' }}
            >
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin" size={22} style={{ color: 'var(--bo-text-muted)' }} />
                    </div>
                ) : ebooks.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen size={36} style={{ color: 'var(--bo-text-muted)', opacity: 0.4 }} className="mx-auto mb-4" />
                        <p className="text-sm" style={{ color: 'var(--bo-text-muted)' }}>Nenhum ebook cadastrado</p>
                        <Link
                            href="/backoffice/inteligencia/ebooks/novo"
                            className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold"
                            style={{ color: 'var(--accent-500)' }}
                        >
                            <Plus size={13} /> Cadastrar primeiro ebook
                        </Link>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--bo-border)' }}>
                                {['Título', 'Status', 'Ordem', 'Amazon', 'Ações'].map(h => (
                                    <th
                                        key={h}
                                        className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider"
                                        style={{ color: 'var(--bo-text-muted)' }}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {ebooks.map((e) => (
                                <tr
                                    key={e.id}
                                    style={{ borderBottom: '1px solid var(--bo-border-subtle)' }}
                                    className="hover:bg-[var(--bo-hover)] transition-colors"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ background: 'var(--bo-icon-bg)' }}
                                            >
                                                <BookOpen size={14} style={{ color: 'var(--accent-500)' }} />
                                            </div>
                                            <div>
                                                <p className="font-medium" style={{ color: 'var(--bo-text)' }}>{e.title}</p>
                                                {e.subtitle && (
                                                    <p className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>{e.subtitle}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                                            style={e.is_published
                                                ? { color: '#34d399', background: 'rgba(52,211,153,0.1)' }
                                                : { color: 'var(--bo-text-muted)', background: 'var(--bo-icon-bg)' }
                                            }
                                        >
                                            {e.is_published ? 'Publicado' : 'Rascunho'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>{e.sort_order}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {e.amazon_url ? (
                                            <a
                                                href={e.amazon_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs font-medium"
                                                style={{ color: 'var(--accent-500)' }}
                                            >
                                                <ExternalLink size={12} /> Link
                                            </a>
                                        ) : (
                                            <span className="text-xs" style={{ color: 'var(--bo-text-muted)' }}>—</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => togglePublish(e.id, e.is_published)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bo-hover)]"
                                                title={e.is_published ? 'Despublicar' : 'Publicar'}
                                            >
                                                {e.is_published
                                                    ? <EyeOff size={13} style={{ color: 'var(--bo-text-muted)' }} />
                                                    : <Eye size={13} style={{ color: 'var(--accent-500)' }} />
                                                }
                                            </button>
                                            <Link
                                                href={`/backoffice/inteligencia/ebooks/${e.id}/editar`}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-[var(--bo-hover)]"
                                            >
                                                <Pencil size={13} style={{ color: 'var(--bo-text-muted)' }} />
                                            </Link>
                                            <button
                                                onClick={() => deleteEbook(e.id)}
                                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                                            >
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
