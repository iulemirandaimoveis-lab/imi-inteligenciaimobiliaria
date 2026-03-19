// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrackedLink } from '../types'
import { ExternalLink, Copy, Check, MousePointer2, Calendar, Plus, Link as LinkIcon, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import TrackingLinkModal from './TrackingLinkModal'

interface TrackedLinksListProps {
    propertyId: string
    property: Record<string, unknown>
}

export default function TrackedLinksList({ propertyId, property }: TrackedLinksListProps) {
    const supabase = createClient()
    const [links, setLinks] = useState<TrackedLink[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    async function fetchLinks() {
        setIsLoading(true)
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
        setTimeout(() => setCopiedId(null), 2000)
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <Loader2 className="w-8 h-8 text-imi-400 animate-spin mb-4" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronizando Links...</p>
            </div>
        )
    }

    return (
        <section className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="max-w-xl">
                    <h2 className="font-display text-3xl text-imi-900 mb-4 font-bold tracking-tight">Performance de Links</h2>
                    <p className="text-imi-500 text-lg">
                        Rastreie cada clique e conversão originado de suas campanhas e canais externos.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="h-14 px-8 bg-imi-900 text-white rounded-2xl shadow-elevated group active:scale-95 transition-all">
                    <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform" />
                    Gerar Link Rastreado
                </Button>
            </div>

            {links.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-imi-100 italic text-slate-400">
                    Nenhum link gerado para este ativo imobiliário até o momento.
                </div>
            ) : (
                <div className="grid gap-4">
                    {links.map((link) => (
                        <div key={link.id} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-imi-50 rounded-xl flex items-center justify-center text-imi-400 group-hover:bg-imi-900 group-hover:text-white transition-colors">
                                    <LinkIcon size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-imi-900 uppercase tracking-tight">
                                            {link.short_code}
                                        </h3>
                                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-400 uppercase tracking-widest">
                                            ID: {link.id.split('-')[0]}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate max-w-md font-mono">
                                        {link.original_url}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 w-full md:w-auto">
                                <div className="text-center md:border-r border-slate-50 pr-8">
                                    <div className="flex items-center gap-2 text-imi-900 font-black text-xl">
                                        <MousePointer2 size={16} className="text-imi-400" />
                                        {link.clicks || 0}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Cliques Totais</div>
                                </div>

                                <div className="text-center">
                                    <div className="flex items-center gap-2 text-imi-500 font-bold text-sm">
                                        <Calendar size={14} className="text-imi-200" />
                                        {new Date(link.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Data de Criação</div>
                                </div>

                                <div className="flex gap-2 ml-auto">
                                    <button
                                        onClick={() => handleCopy(link)}
                                        className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${copiedId === link.id
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-slate-100 text-slate-400 hover:text-imi-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        {copiedId === link.id ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                    <a
                                        href={link.original_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 rounded-2xl border border-slate-100 flex items-center justify-center text-slate-400 hover:text-imi-900 hover:bg-slate-50 transition-all active:scale-95"
                                    >
                                        <ExternalLink size={20} />
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
