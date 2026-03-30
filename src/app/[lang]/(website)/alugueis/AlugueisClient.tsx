'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Bed, Bath, Users, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'

interface RentalProperty {
    id: string
    name: string
    address: string | null
    property_type: string
    listing_mode: string
    daily_rate: number | null
    monthly_rate: number | null
    bedrooms: number | null
    bathrooms: number | null
    max_guests: number | null
    photos: string[] | null
    amenities: string[] | null
    status: string
    cleaning_fee: number | null
    check_in_time: string | null
    check_out_time: string | null
    rules: string | null
    development_id: string | null
}

interface Props {
    properties: RentalProperty[]
    lang: string
}

const t: Record<string, Record<string, string>> = {
    pt: {
        title: 'Aluguéis',
        subtitle: 'Imóveis disponíveis para temporada e locação',
        search: 'Buscar por nome ou endereço...',
        filters: 'Filtros',
        all: 'Todos',
        perDay: '/dia',
        perMonth: '/mês',
        bedrooms: 'quartos',
        bathrooms: 'banheiros',
        guests: 'hóspedes',
        noResults: 'Nenhum imóvel encontrado com os filtros selecionados.',
        shortStay: 'Temporada',
        traditional: 'Mensal/Anual',
        hybrid: 'Híbrido',
        seasonal: 'Sazonal',
        seeDetails: 'Ver detalhes',
        apartment: 'Apartamento',
        house: 'Casa',
        studio: 'Studio',
        penthouse: 'Cobertura',
        room: 'Quarto',
        commercial: 'Comercial',
    },
    en: {
        title: 'Rentals',
        subtitle: 'Properties available for vacation and long-term rental',
        search: 'Search by name or address...',
        filters: 'Filters',
        all: 'All',
        perDay: '/day',
        perMonth: '/month',
        bedrooms: 'bedrooms',
        bathrooms: 'bathrooms',
        guests: 'guests',
        noResults: 'No properties found matching your filters.',
        shortStay: 'Short Stay',
        traditional: 'Monthly/Yearly',
        hybrid: 'Hybrid',
        seasonal: 'Seasonal',
        seeDetails: 'See details',
        apartment: 'Apartment',
        house: 'House',
        studio: 'Studio',
        penthouse: 'Penthouse',
        room: 'Room',
        commercial: 'Commercial',
    },
    es: {
        title: 'Alquileres',
        subtitle: 'Propiedades disponibles para temporada y alquiler',
        search: 'Buscar por nombre o dirección...',
        filters: 'Filtros',
        all: 'Todos',
        perDay: '/día',
        perMonth: '/mes',
        bedrooms: 'dormitorios',
        bathrooms: 'baños',
        guests: 'huéspedes',
        noResults: 'No se encontraron propiedades con los filtros seleccionados.',
        shortStay: 'Temporada Corta',
        traditional: 'Mensual/Anual',
        hybrid: 'Híbrido',
        seasonal: 'Estacional',
        seeDetails: 'Ver detalles',
        apartment: 'Apartamento',
        house: 'Casa',
        studio: 'Studio',
        penthouse: 'Penthouse',
        room: 'Habitación',
        commercial: 'Comercial',
    },
}

const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export default function AlugueisClient({ properties, lang }: Props) {
    const i = t[lang] || t.pt
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [modeFilter, setModeFilter] = useState('')
    const [showFilters, setShowFilters] = useState(false)

    const filtered = useMemo(() => {
        return properties.filter(p => {
            if (search) {
                const q = search.toLowerCase()
                if (!p.name.toLowerCase().includes(q) && !(p.address || '').toLowerCase().includes(q)) return false
            }
            if (typeFilter && p.property_type !== typeFilter) return false
            if (modeFilter && p.listing_mode !== modeFilter) return false
            return true
        })
    }, [properties, search, typeFilter, modeFilter])

    const types = [...new Set(properties.map(p => p.property_type))].sort()
    const modes = [...new Set(properties.map(p => p.listing_mode))].sort()

    return (
        <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
            {/* Hero */}
            <section
                className="relative py-16 md:py-24"
                style={{
                    background: 'linear-gradient(135deg, #0B1928 0%, #162a42 100%)',
                    color: '#fff',
                }}
            >
                <div className="max-w-6xl mx-auto px-4 text-center">
                    <h1
                        className="text-3xl md:text-5xl font-bold mb-3"
                        style={{ fontFamily: "var(--font-heading, 'Playfair Display', serif)" }}
                    >
                        {i.title}
                    </h1>
                    <p className="text-base md:text-lg opacity-80 mb-8">{i.subtitle}</p>

                    <div className="max-w-xl mx-auto relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder={i.search}
                            className="w-full pl-11 pr-4 py-3.5 rounded-lg text-sm text-gray-900 bg-white shadow-lg outline-none"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </section>

            {/* Filters + Grid */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
                        style={{
                            background: showFilters ? '#0B1928' : '#fff',
                            color: showFilters ? '#fff' : '#333',
                            border: '1px solid #ddd',
                        }}
                    >
                        <SlidersHorizontal size={14} />
                        {i.filters}
                    </button>
                    <span className="text-sm text-gray-500">
                        {filtered.length} {filtered.length === 1 ? 'imóvel' : 'imóveis'}
                    </span>
                    {(typeFilter || modeFilter) && (
                        <button
                            onClick={() => { setTypeFilter(''); setModeFilter('') }}
                            className="text-xs text-red-500 hover:underline"
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</label>
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                            >
                                <option value="">{i.all}</option>
                                {types.map(tp => (
                                    <option key={tp} value={tp}>{(i as Record<string, string>)[tp] || tp}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Modalidade</label>
                            <select
                                value={modeFilter}
                                onChange={e => setModeFilter(e.target.value)}
                                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-white"
                            >
                                <option value="">{i.all}</option>
                                {modes.map(m => (
                                    <option key={m} value={m}>{(i as Record<string, string>)[m === 'short_stay' ? 'shortStay' : m] || m}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                {/* Grid */}
                {filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500">{i.noResults}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(prop => (
                            <Link
                                key={prop.id}
                                href={`/${lang}/alugueis/${prop.id}`}
                                className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-100"
                            >
                                {/* Image */}
                                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                    {prop.photos && prop.photos.length > 0 ? (
                                        <Image
                                            src={prop.photos[0]}
                                            alt={prop.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <MapPin size={48} />
                                        </div>
                                    )}
                                    {/* Type badge */}
                                    <span
                                        className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold"
                                        style={{ background: 'rgba(11, 25, 40, 0.85)', color: '#C8A44A' }}
                                    >
                                        {(i as Record<string, string>)[prop.property_type] || prop.property_type}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#C8A44A] transition-colors line-clamp-1">
                                        {prop.name}
                                    </h3>
                                    {prop.address && (
                                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1 line-clamp-1">
                                            <MapPin size={12} />
                                            {prop.address}
                                        </p>
                                    )}

                                    {/* Specs */}
                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                                        {prop.bedrooms != null && (
                                            <span className="inline-flex items-center gap-1">
                                                <Bed size={13} /> {prop.bedrooms}
                                            </span>
                                        )}
                                        {prop.bathrooms != null && (
                                            <span className="inline-flex items-center gap-1">
                                                <Bath size={13} /> {prop.bathrooms}
                                            </span>
                                        )}
                                        {prop.max_guests != null && (
                                            <span className="inline-flex items-center gap-1">
                                                <Users size={13} /> {prop.max_guests}
                                            </span>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-baseline gap-2">
                                        {prop.daily_rate != null && (
                                            <span className="text-lg font-bold" style={{ color: '#0B1928' }}>
                                                {fmtCurrency(prop.daily_rate)}
                                                <span className="text-xs font-normal text-gray-500">{i.perDay}</span>
                                            </span>
                                        )}
                                        {prop.monthly_rate != null && (
                                            <span className="text-sm text-gray-500">
                                                {fmtCurrency(prop.monthly_rate)}{i.perMonth}
                                            </span>
                                        )}
                                        {!prop.daily_rate && !prop.monthly_rate && (
                                            <span className="text-sm text-gray-400">Consultar valor</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
