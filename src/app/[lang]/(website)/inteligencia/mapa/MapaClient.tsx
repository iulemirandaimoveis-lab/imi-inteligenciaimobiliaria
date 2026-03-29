'use client'

import { useState, useMemo } from 'react'
import { Map, SlidersHorizontal, X } from 'lucide-react'
import type { Development } from '@/app/[lang]/(website)/imoveis/types/development'
import dynamic from 'next/dynamic'

const PropertyMap = dynamic(() => import('@/components/maps/PropertyMap'), {
    ssr: false,
    loading: () => (
        <div style={{ height: '100%', minHeight: 500, background: '#0B1928', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#6B7280', fontSize: 14 }}>Carregando mapa...</span>
        </div>
    ),
})

interface MapaClientProps {
    developments: Development[]
}

export default function MapaClient({ developments }: MapaClientProps) {
    const [selectedCity, setSelectedCity] = useState<string | null>(null)
    const [selectedType, setSelectedType] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    const cities = useMemo(() => {
        const set = new Set(developments.map(d => d.location.city).filter(Boolean))
        return Array.from(set).sort()
    }, [developments])

    const neighborhoods = useMemo(() => {
        const set = new Set(developments.map(d => d.location.neighborhood).filter(Boolean))
        return Array.from(set).sort()
    }, [developments])

    const filtered = useMemo(() => {
        let result = developments
        if (selectedCity) result = result.filter(d => d.location.city === selectedCity)
        if (selectedType) result = result.filter(d => d.tags.includes(selectedType))
        return result
    }, [developments, selectedCity, selectedType])

    const activeFilters = (selectedCity ? 1 : 0) + (selectedType ? 1 : 0)

    return (
        <main className="bg-navy-950 min-h-screen">
            {/* Compact hero */}
            <section className="relative bg-navy-950 text-white pt-24 pb-8 md:pt-28 md:pb-10 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-px bg-navy-600" />
                                <span className="text-navy-300 font-bold uppercase tracking-[0.25em] text-[11px]">Inteligência · Mapa</span>
                            </div>
                            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white">
                                Mapa <span className="text-navy-300 italic">Interativo</span>
                            </h1>
                            <p className="text-white/40 text-sm font-light mt-2">
                                {filtered.length} empreendimento{filtered.length !== 1 ? 's' : ''} disponíve{filtered.length !== 1 ? 'is' : 'l'}
                            </p>
                        </div>

                        {/* Filter toggle */}
                        <button
                            onClick={() => setShowFilters(v => !v)}
                            className="flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition-all"
                            style={{
                                background: showFilters ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
                                color: showFilters ? '#60A5FA' : 'rgba(255,255,255,0.6)',
                                border: `1px solid ${showFilters ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
                            }}
                        >
                            <SlidersHorizontal size={15} />
                            Filtros
                            {activeFilters > 0 && (
                                <span className="ml-1 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                                    {activeFilters}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Filter bar */}
                    {showFilters && (
                        <div className="mt-5 flex flex-wrap gap-3 items-center">
                            <select
                                value={selectedCity || ''}
                                onChange={e => setSelectedCity(e.target.value || null)}
                                className="h-9 px-3 rounded-lg text-xs font-semibold bg-navy-800 text-white/80 border border-white/[0.08] outline-none"
                            >
                                <option value="">Todas as cidades</option>
                                {cities.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>

                            {activeFilters > 0 && (
                                <button
                                    onClick={() => { setSelectedCity(null); setSelectedType(null) }}
                                    className="flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20"
                                >
                                    <X size={12} /> Limpar filtros
                                </button>
                            )}

                            <div className="ml-auto text-[10px] text-white/30 font-mono">
                                {neighborhoods.length} bairros · {cities.length} cidades
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Map */}
            <section className="relative" style={{ height: 'calc(100vh - 200px)', minHeight: 500 }}>
                {filtered.length > 0 ? (
                    <PropertyMap
                        developments={filtered}
                        height="100%"
                        darkMode={true}
                        lang="pt"
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4" style={{ background: '#0B1928' }}>
                        <div className="w-16 h-16 bg-navy-800 border border-white/[0.08] rounded-2xl flex items-center justify-center">
                            <Map className="w-7 h-7 text-navy-300" strokeWidth={1.5} />
                        </div>
                        <p className="text-white/50 text-sm font-light">Nenhum empreendimento encontrado com os filtros selecionados.</p>
                        <button
                            onClick={() => { setSelectedCity(null); setSelectedType(null) }}
                            className="text-xs font-semibold text-blue-400 hover:underline"
                        >
                            Limpar filtros
                        </button>
                    </div>
                )}
            </section>
        </main>
    )
}
