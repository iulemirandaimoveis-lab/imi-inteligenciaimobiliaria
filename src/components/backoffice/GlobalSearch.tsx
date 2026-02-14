'use client'

import { useState, useEffect } from 'react'
import {
    Search,
    Building2,
    Users,
    FileText,
    MessageSquare,
    TrendingUp,
    ArrowRight,
    Loader
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const supabase = createClient()

interface SearchResult {
    id: string
    type: 'development' | 'lead' | 'evaluation' | 'consultation'
    title: string
    subtitle?: string
    url: string
    icon: any
    color: string
}

export default function GlobalSearch() {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Atalho Cmd+K / Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(true)
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
                setQuery('')
                setResults([])
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Navigation com Arrow Keys
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % (results.length || 1)) // Avoid division by zero if empty
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + (results.length || 1)) % (results.length || 1))
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex])
                } else if (query) {
                    // Maybe trigger full search page if implemented?
                }
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, results, selectedIndex, query])

    // Debounced search
    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const timer = setTimeout(() => {
            performSearch(query)
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const performSearch = async (searchQuery: string) => {
        setLoading(true)
        const allResults: SearchResult[] = []

        try {
            // Buscar empreendimentos
            const { data: developments } = await supabase
                .from('developments')
                .select('id, name, city, status')
                .or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
                .limit(5)

            developments?.forEach(dev => {
                allResults.push({
                    id: dev.id,
                    type: 'development',
                    title: dev.name,
                    subtitle: `${dev.city} • ${dev.status}`,
                    url: `/backoffice/imoveis/${dev.id}`,
                    icon: Building2,
                    color: 'text-blue-600'
                })
            })

            // Buscar leads
            const { data: leads } = await supabase
                .from('leads')
                .select('id, name, email, status, score')
                .or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
                .limit(5)

            leads?.forEach(lead => {
                allResults.push({
                    id: lead.id,
                    type: 'lead',
                    title: lead.name,
                    subtitle: `${lead.email} • Score: ${lead.score}`,
                    url: `/backoffice/leads/${lead.id}`,
                    icon: Users,
                    color: 'text-purple-600'
                })
            })

            // Buscar avaliações
            const { data: evaluations } = await supabase
                .from('property_evaluations')
                .select('id, property_address, client_name, status')
                .or(`property_address.ilike.%${searchQuery}%,client_name.ilike.%${searchQuery}%`)
                .limit(5)

            evaluations?.forEach(evaluationItem => {
                allResults.push({
                    id: evaluationItem.id,
                    type: 'evaluation',
                    title: evaluationItem.property_address,
                    subtitle: `${evaluationItem.client_name} • ${evaluationItem.status}`,
                    url: `/backoffice/avaliacoes/${evaluationItem.id}`,
                    icon: FileText,
                    color: 'text-pink-600'
                })
            })

            // Buscar consultorias
            const { data: consultations } = await supabase
                .from('consultations')
                .select('id, client_name, consultation_type, status')
                .ilike('client_name', `%${searchQuery}%`)
                .limit(5)

            consultations?.forEach(cons => {
                allResults.push({
                    id: cons.id,
                    type: 'consultation',
                    title: cons.client_name,
                    subtitle: `${cons.consultation_type} • ${cons.status}`,
                    url: `/backoffice/consultorias/${cons.id}`,
                    icon: MessageSquare,
                    color: 'text-orange-600'
                })
            })

            setResults(allResults)
            setSelectedIndex(0)

        } catch (error) {
            console.error('Erro na busca:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (result: SearchResult) => {
        router.push(result.url)
        setIsOpen(false)
        setQuery('')
        setResults([])
        toast.success(`Abrindo ${result.title}`)
    }

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            development: 'Empreendimento',
            lead: 'Lead',
            evaluation: 'Avaliação',
            consultation: 'Consultoria'
        }
        return labels[type] || type
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-[#0A0B0D]/80 backdrop-blur-xl z-[9999] flex items-start justify-center p-4 pt-[15vh]">
            <div
                className="bg-white rounded-3xl shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] max-w-3xl w-full overflow-hidden animate-in fade-in slide-in-from-top-8 duration-500 border border-imi-100"
                role="dialog"
                aria-modal="true"
            >
                {/* Search Input - Powerful & Minimal */}
                <div className="flex items-center gap-8 px-10 py-10 border-b border-imi-50 relative bg-white">
                    <Search size={28} className="text-imi-600 flex-shrink-0" strokeWidth={1.5} />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Pesquisar inteligência imobiliária..."
                        className="flex-1 text-2xl font-display font-medium focus:outline-none placeholder:text-imi-200 bg-transparent text-imi-950 tracking-tight"
                        autoFocus
                    />
                    <div className="flex items-center gap-4">
                        {loading && <Loader size={20} className="text-imi-500 animate-spin" />}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-imi-50 text-[10px] font-bold text-imi-500 border border-imi-100 uppercase tracking-widest hover:bg-imi-100 transition-colors"
                        >
                            Esc
                        </button>
                    </div>
                </div>

                {/* Content - Structured & Elegant */}
                <div className="max-h-[50vh] overflow-y-auto custom-scrollbar bg-white">
                    {query && results.length === 0 && !loading && (
                        <div className="py-24 text-center animate-in fade-in duration-300 px-10">
                            <div className="w-20 h-20 bg-imi-50 rounded-3xl flex items-center justify-center mx-auto mb-8 text-imi-200">
                                <Search size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-imi-950 mb-2">Sem correspondências estratégicas</h3>
                            <p className="text-base text-imi-500 font-medium">Refine seus termos de busca institucional.</p>
                        </div>
                    )}

                    {!query && !loading && (
                        <div className="p-10 border-b border-imi-50">
                            <p className="text-[10px] font-bold text-imi-400 uppercase tracking-[0.2em] mb-8">Fluxos Estratégicos</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { label: 'Gestão de Inventário', url: '/backoffice/imoveis', icon: Building2 },
                                    { label: 'Pipeline de Capital', url: '/backoffice/leads/pipeline', icon: TrendingUp },
                                    { label: 'Auditoria de Avaliações', url: '/backoffice/avaliacoes', icon: FileText },
                                    { label: 'Estruturação Patrimonial', url: '/backoffice/consultorias', icon: MessageSquare }
                                ].map((shortcut) => {
                                    const Icon = shortcut.icon
                                    return (
                                        <button
                                            key={shortcut.url}
                                            onClick={() => {
                                                router.push(shortcut.url)
                                                setIsOpen(false)
                                            }}
                                            className="flex items-center gap-5 p-5 rounded-2xl hover:bg-imi-50 transition-all text-left group border border-transparent hover:border-imi-100 shadow-sm hover:shadow-md"
                                        >
                                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-imi-100 flex items-center justify-center text-imi-500 group-hover:text-imi-600 transition-all">
                                                <Icon size={20} strokeWidth={1.5} />
                                            </div>
                                            <span className="text-sm font-bold text-imi-700 group-hover:text-imi-950">{shortcut.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="py-6">
                            <p className="px-10 py-4 text-[10px] font-bold text-imi-400 uppercase tracking-[0.2em]">Resultados da Auditoria</p>
                            {results.map((result, index) => {
                                const Icon = result.icon
                                const isSelected = index === selectedIndex

                                return (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-6 px-10 py-6 transition-all relative ${isSelected ? 'bg-imi-50/50' : 'hover:bg-imi-50/30'}`}
                                    >
                                        {isSelected && (
                                            <div className="absolute left-0 w-1.5 h-12 bg-imi-500 rounded-full ml-2" />
                                        )}

                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all border duration-300 ${isSelected ? 'bg-white shadow-md border-imi-100' : 'bg-imi-50 border-transparent shadow-inner'}`}>
                                            <Icon size={20} className="text-imi-600" strokeWidth={1.5} />
                                        </div>

                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className="text-[9px] font-bold text-imi-500 uppercase tracking-[0.1em] px-2 py-0.5 bg-white border border-imi-100 rounded-md shadow-sm">
                                                    {getTypeLabel(result.type)}
                                                </span>
                                            </div>
                                            <div className="text-lg font-bold text-imi-900 tracking-tight truncate leading-none mb-1">
                                                {result.title}
                                            </div>
                                            {result.subtitle && (
                                                <div className="text-sm text-imi-400 truncate tracking-tight font-medium">
                                                    {result.subtitle}
                                                </div>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <div className="flex items-center gap-3 text-imi-600 px-4 py-2 bg-white rounded-xl border border-imi-100 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                                                <span className="text-[10px] font-bold tracking-widest uppercase">Consultar</span>
                                                <ArrowRight size={14} />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer - Institutional Stability */}
                <div className="px-10 py-6 border-t border-imi-50 bg-imi-50/30 flex items-center justify-between text-[11px] font-bold text-imi-400 uppercase tracking-widest">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1">
                                <kbd className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-imi-100 shadow-sm font-sans">↑</kbd>
                                <kbd className="w-6 h-6 flex items-center justify-center bg-white rounded-lg border border-imi-100 shadow-sm font-sans">↓</kbd>
                            </div>
                            <span>Navegar</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <kbd className="w-8 h-6 flex items-center justify-center bg-white rounded-lg border border-imi-100 shadow-sm font-sans text-[10px]">↵</kbd>
                            <span>Selecionar Ativo</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
