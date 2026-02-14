'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink, Copy, Check, MousePointer2, Calendar, Plus, Link as LinkIcon, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import TrackingLinkModal from './TrackingLinkModal'
import { Development } from '@/types/development'
import { useToast } from '@/components/ui/Toast'

interface TrackedLinksListProps {
    propertyId: string
    property: Development
}

interface TrackedLink {
    id: string
    short_code: string
    original_url: string
    clicks: number
    created_at: string
}

export default function TrackedLinksList({ propertyId, property }: TrackedLinksListProps) {
    const supabase = createClient()
    const { showToast } = useToast()
    const [links, setLinks] = useState<TrackedLink[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    async function fetchLinks() {
        // setIsLoading(true) // Don't reset full loading on refresh, maybe just use SWR next time
        const { data, error } = await supabase
            .from('tracked_links')
            .select('*')
            .eq('property_id', propertyId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setLinks(data)
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchLinks()
    }, [propertyId])

    const handleCopy = async (link: TrackedLink) => {
        const url = `${window.location.origin}/l/${link.short_code}`
        await navigator.clipboard.writeText(url)
        setCopiedId(link.id)
        showToast('Link copiado', 'success')
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-imi-50 rounded-3xl border border-dashed border-imi-100 animate-pulse">
                <Loader2 className="w-8 h-8 text-imi-400 animate-spin mb-4" />
                <p className="text-imi-400 font-bold text-xs uppercase tracking-widest">Sincronizando Links...</p>
            </div>
        )
    }

    return (
        <section className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-xl">
                    <h2 className="font-display text-2xl text-imi-900 mb-2 font-bold tracking-tight">Campanhas & Rastreamento</h2>
                    <p className="text-imi-500 text-sm font-medium">
                        Gerencie links exclusivos para identificar a origem dos leads e otimizar suas campanhas.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="h-12 px-6 bg-imi-900 text-white rounded-xl shadow-elevated group active:scale-95 transition-all font-bold uppercase tracking-widest text-xs hover:bg-black">
                    <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                    Novo Rastreador
                </Button>
            </div>

            {links.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-imi-100">
                    <LinkIcon className="w-12 h-12 mx-auto mb-4 text-imi-100" />
                    <h3 className="text-imi-900 font-bold mb-1">Nenhum link ativo</h3>
                    <p className="text-xs text-imi-400 font-medium">Gere links parametrizados para rastrear seus anúncios.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {links.map((link) => (
                        <div key={link.id} className="bg-white rounded-2xl p-6 border border-imi-100 shadow-soft hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-imi-50 rounded-xl flex items-center justify-center text-imi-400 group-hover:bg-imi-900 group-hover:text-white transition-colors">
                                    <LinkIcon size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-imi-900 uppercase tracking-tight text-sm font-mono bg-imi-50 px-2 py-1 rounded-lg border border-imi-100">
                                            /l/{link.short_code}
                                        </h3>
                                    </div>
                                    <p className="text-[10px] text-imi-400 truncate max-w-md font-medium uppercase tracking-wider">
                                        {link.original_url.split('?')[1]?.replace(/&/g, ' • ') || 'Link Direto'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 w-full md:w-auto">
                                <div className="text-center md:border-r border-imi-50 pr-8">
                                    <div className="flex items-center justify-center gap-2 text-imi-900 font-black text-xl">
                                        <MousePointer2 size={16} className="text-imi-300" />
                                        {link.clicks || 0}
                                    </div>
                                    <div className="text-[9px] font-black text-imi-300 uppercase tracking-widest">Cliques</div>
                                </div>

                                <div className="text-center hidden sm:block">
                                    <div className="flex items-center justify-center gap-2 text-imi-500 font-bold text-sm">
                                        <Calendar size={14} className="text-imi-200" />
                                        {new Date(link.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="text-[9px] font-black text-imi-300 uppercase tracking-widest">Criado em</div>
                                </div>

                                <div className="flex gap-2 ml-auto">
                                    <button
                                        onClick={() => handleCopy(link)}
                                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${copiedId === link.id
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'border-imi-100 text-imi-400 hover:text-imi-900 hover:bg-imi-50 bg-white'
                                            }`}
                                    >
                                        {copiedId === link.id ? <Check size={18} /> : <Copy size={18} />}
                                    </button>
                                    <a
                                        href={link.original_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-10 h-10 rounded-xl border border-imi-100 flex items-center justify-center text-imi-400 hover:text-imi-900 hover:bg-imi-50 bg-white transition-all active:scale-95"
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <TrackingLinkModal
                    property={property}
                    onClose={() => {
                        setIsModalOpen(false)
                        fetchLinks()
                    }}
                />
            )}
        </section>
    )
}
