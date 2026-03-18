'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Building2, MapPin, Bed, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Development } from '../types/development';

interface SimilarPropertiesProps {
    developments: Development[];
    lang: string;
}

const formatPrice = (price: number) => {
    if (price >= 1000000) {
        const m = price / 1000000;
        return `R$ ${m % 1 === 0 ? m : m.toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (price >= 1000) return `R$ ${Math.floor(price / 1000)}k`;
    return `R$ ${price.toLocaleString('pt-BR')}`;
};

export default function SimilarProperties({ developments, lang }: SimilarPropertiesProps) {
    if (!developments.length) return null;

    return (
        <section className="py-14 md:py-20" style={{ background: '#0B1928', borderTop: '1px solid rgba(200,164,74,0.08)' }}>
            <div className="container-custom">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1 h-6 rounded-full" style={{ background: '#C8A44A' }} />
                    <h2
                        className="text-xl md:text-2xl font-bold tracking-tight"
                        style={{ fontFamily: "'Libre Baskerville', 'Playfair Display', Georgia, serif", color: '#EBE7E0' }}
                    >
                        Empreendimentos semelhantes
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {developments.map((dev, i) => (
                        <motion.div
                            key={dev.id}
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                        >
                            <Link
                                href={`/${lang}/imoveis/${dev.slug}`}
                                className="group block rounded-2xl overflow-hidden transition-all duration-200"
                                style={{ background: '#0F2035', border: '1px solid rgba(200,164,74,0.12)' }}
                            >
                                {/* Image */}
                                <div className="relative aspect-[16/10] overflow-hidden" style={{ background: '#142840' }}>
                                    {dev.images.main ? (
                                        <Image
                                            src={dev.images.main}
                                            alt={dev.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Building2 className="w-8 h-8" style={{ color: '#5C6B7D', opacity: 0.4 }} />
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,25,40,0.7) 0%, transparent 50%)' }} />
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="text-sm font-bold truncate mb-1 transition-colors" style={{ color: '#EBE7E0', fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                                        {dev.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs mb-3" style={{ color: '#627D98' }}>
                                        <MapPin size={10} style={{ color: '#C8A44A', opacity: 0.6 }} />
                                        <span className="truncate">{dev.location.neighborhood}, {dev.location.city}</span>
                                    </div>

                                    {/* Specs */}
                                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: '#9FB3C8' }}>
                                        {dev.specs?.bedroomsRange && dev.specs.bedroomsRange !== '—' && (
                                            <span className="flex items-center gap-1">
                                                <Bed size={11} style={{ color: '#5C6B7D' }} /> {dev.specs.bedroomsRange}
                                            </span>
                                        )}
                                        {dev.specs?.areaRange && dev.specs.areaRange !== '—' && (
                                            <span className="flex items-center gap-1">
                                                <Ruler size={11} style={{ color: '#5C6B7D' }} /> {dev.specs.areaRange}
                                            </span>
                                        )}
                                    </div>

                                    {/* Price */}
                                    {dev.priceRange.min > 0 && (
                                        <div>
                                            <p className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#C8A44A', opacity: 0.6 }}>A partir de</p>
                                            <p className="text-base font-bold" style={{ color: '#EBE7E0', fontFamily: "'Libre Baskerville', Georgia, serif" }}>
                                                {formatPrice(dev.priceRange.min)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
