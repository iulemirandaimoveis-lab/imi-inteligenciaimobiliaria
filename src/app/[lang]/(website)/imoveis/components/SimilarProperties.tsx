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
        <section className="border-t border-gray-100 bg-[#F5F7FA] py-14 md:py-20">
            <div className="container-custom">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-1 h-5 rounded-full bg-[#334E68]" />
                    <h2
                        className="text-xl md:text-2xl text-gray-900 font-bold tracking-tight"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
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
                                className="group block rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Image */}
                                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
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
                                            <Building2 className="w-8 h-8 text-gray-200" />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4">
                                    <h3 className="text-sm font-bold text-gray-900 truncate mb-1 group-hover:text-[#334E68] transition-colors">
                                        {dev.name}
                                    </h3>
                                    <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                                        <MapPin size={10} />
                                        <span className="truncate">{dev.location.neighborhood}, {dev.location.city}</span>
                                    </div>

                                    {/* Specs */}
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                                        {dev.specs?.bedroomsRange && dev.specs.bedroomsRange !== '—' && (
                                            <span className="flex items-center gap-1">
                                                <Bed size={11} /> {dev.specs.bedroomsRange}
                                            </span>
                                        )}
                                        {dev.specs?.areaRange && dev.specs.areaRange !== '—' && (
                                            <span className="flex items-center gap-1">
                                                <Ruler size={11} /> {dev.specs.areaRange}
                                            </span>
                                        )}
                                    </div>

                                    {/* Price */}
                                    {dev.priceRange.min > 0 && (
                                        <div>
                                            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">A partir de</p>
                                            <p className="text-base font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
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
