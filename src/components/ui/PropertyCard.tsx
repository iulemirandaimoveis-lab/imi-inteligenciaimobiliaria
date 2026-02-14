'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Property } from '@/types/property'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { Bed, Move, MapPin, ChevronRight } from 'lucide-react'

interface PropertyCardProps {
    property: Property
}

export default function PropertyCard({ property }: PropertyCardProps) {
    const primaryImage = property.images.find(img => img.isPrimary) || property.images[0]

    return (
        <Card hover className="overflow-hidden group flex flex-col h-full bg-white border-imi-200/60 shadow-soft hover:shadow-card-hover transition-all duration-300 rounded-3xl">
            <Link href={`/imoveis/${property.slug}`} className="relative block overflow-hidden aspect-[4/3] sm:aspect-video lg:aspect-[4/3]">
                {primaryImage ? (
                    <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-imi-100">
                        <MapPin className="w-12 h-12 text-imi-300" />
                    </div>
                )}

                {/* Badges Overlay */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {property.status === 'lancamento' && (
                        <Badge variant="info" className="bg-blue-600 text-white border-none px-3 py-1 shadow-lg">Lançamento</Badge>
                    )}
                    {property.technicalAnalysisAvailable && (
                        <Badge variant="success" className="bg-emerald-600 text-white border-none px-3 py-1 shadow-lg">Análise Técnica</Badge>
                    )}
                </div>
            </Link>

            <div className="p-6 sm:p-8 flex flex-col flex-grow">
                <div className="mb-2 flex items-center gap-1.5 text-imi-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                        {property.neighborhood}, {property.city}
                    </span>
                </div>

                <Link href={`/imoveis/${property.slug}`}>
                    <h3 className="text-xl font-bold text-imi-900 mb-4 group-hover:text-accent-600 transition-colors line-clamp-2 leading-tight font-display">
                        {property.title}
                    </h3>
                </Link>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    {property.bedrooms && (
                        <div className="flex items-center gap-2.5 text-imi-500 bg-imi-50 p-3 rounded-2xl">
                            <Bed className="w-4 h-4 text-imi-900" />
                            <span className="text-sm font-medium">{property.bedrooms} Quartos</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2.5 text-imi-500 bg-imi-50 p-3 rounded-2xl">
                        <Move className="w-4 h-4 text-imi-900" />
                        <span className="text-sm font-medium">{property.area}m²</span>
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-imi-100 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] text-imi-400 font-bold uppercase tracking-[0.1em] mb-1">
                            Investimento
                        </p>
                        {property.priceOnRequest ? (
                            <p className="text-xl font-bold text-imi-900 italic">Sob consulta</p>
                        ) : (
                            <p className="text-xl font-bold text-imi-900">{formatCurrency(property.price!)}</p>
                        )}
                    </div>

                    <Link
                        href={`/imoveis/${property.slug}`}
                        className="w-12 h-12 rounded-full bg-imi-900 flex items-center justify-center text-white hover:bg-accent-600 transition-all active:scale-95 shadow-lg"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </Card>
    )
}
