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
        <div className="fixed inset-0 bg-imi-900/50 backdrop-blur-sm z-[9999] flex items-start justify-center p-4 pt-[10vh]">
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 border border-imi-200"
                role="dialog"
                aria-modal="true"
            >
                {/* Search Input */}
                <div className="flex items-center gap-4 p-6 border-b border-imi-100 relative">
                    <Search size={24} className="text-imi-400 flex-shrink-0" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Buscar empreendimentos, leads, avaliações..."
                        className="flex-1 text-lg focus:outline-none placeholder:text-imi-300 bg-transparent"
                        autoFocus
                    />
                    {loading && <Loader size={20} className="text-accent-500 animate-spin absolute right-6" />}
                    {!loading && (
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hidden md:inline-block px-2 py-1 text-xs font-semibold text-imi-600 bg-imi-100 rounded border border-imi-200 hover:bg-imi-200 transition-colors"
                            aria-label="Close"
                        >
                            ESC
                        </button>
                    )}
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {query && results.length === 0 && !loading && (
                        <div className="p-12 text-center animate-in fade-in duration-300">
                            <div className="text-imi-300 mb-3 flex justify-center">
                                <Search size={48} />
                            </div>
                            <p className="text-imi-600 font-medium">Nenhum resultado encontrado</p>
                            <p className="text-sm text-imi-500 mt-1">Tente outros termos de busca</p>
                        </div>
                    )}

                    {!query && !loading && (
                        <div className="p-8">
                            <p className="text-xs font-bold text-imi-400 uppercase tracking-wider mb-4">Atalhos Rápidos</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { label: 'Todos Imóveis', url: '/backoffice/imoveis', icon: Building2 },
                                    { label: 'Pipeline Leads', url: '/backoffice/leads/pipeline', icon: TrendingUp },
                                    { label: 'Avaliações', url: '/backoffice/avaliacoes', icon: FileText },
                                    { label: 'Consultorias', url: '/backoffice/consultorias', icon: MessageSquare }
                                ].map((shortcut) => {
                                    const Icon = shortcut.icon
                                    return (
                                        <button
                                            key={shortcut.url}
                                            onClick={() => {
                                                router.push(shortcut.url)
                                                setIsOpen(false)
                                            }}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-imi-50 transition-colors text-left group border border-transparent hover:border-imi-100"
                                        >
                                            <div className="p-2 bg-imi-50 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                                                <Icon size={20} className="text-imi-500 group-hover:text-accent-500" />
                                            </div>
                                            <span className="text-sm font-medium text-imi-700 group-hover:text-imi-900">{shortcut.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="py-2">
                            <p className="px-6 py-2 text-xs font-bold text-imi-400 uppercase tracking-wider">Resultados</p>
                            {results.map((result, index) => {
                                const Icon = result.icon
                                const isSelected = index === selectedIndex

                                return (
                                    <button
                                        key={`${result.type}-${result.id}`}
                                        onClick={() => handleSelect(result)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center gap-4 px-6 py-4 transition-all border-l-4 ${isSelected ? 'bg-accent-50/50 border-accent-500' : 'border-transparent hover:bg-imi-50'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? 'bg-white shadow-sm' : 'bg-imi-50'
                                            }`}>
                                            <Icon size={20} className={result.color} />
                                        </div>

                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-bold text-imi-400 uppercase tracking-wider px-1.5 py-0.5 bg-imi-100 rounded">
                                                    {getTypeLabel(result.type)}
                                                </span>
                                            </div>
                                            <div className="font-medium text-imi-900 truncate">
                                                {result.title}
                                            </div>
                                            {result.subtitle && (
                                                <div className="text-sm text-imi-500 truncate mt-0.5">
                                                    {result.subtitle}
                                                </div>
                                            )}
                                        </div>

                                        {isSelected && (
                                            <div className="flex items-center gap-2 text-accent-600 animate-in fade-in slide-in-from-left-2 duration-200">
                                                <span className="text-xs font-bold">ABRIR</span>
                                                <ArrowRight size={16} />
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-imi-100 bg-imi-50/50 flex items-center justify-between text-xs text-imi-500">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded border border-imi-200 shadow-sm font-sans">↑</kbd>
                            <kbd className="px-1.5 py-0.5 bg-white rounded border border-imi-200 shadow-sm font-sans">↓</kbd>
                            <span className="ml-1">navegar</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-white rounded border border-imi-200 shadow-sm font-sans">↵</kbd>
                            <span className="ml-1">selecionar</span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center gap-1">
                        <kbd className="px-1.5 py-0.5 bg-white rounded border border-imi-200 shadow-sm font-sans">⌘ K</kbd>
                        <span className="ml-1">para abrir</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
