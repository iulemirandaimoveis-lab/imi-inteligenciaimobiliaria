'use client';

import { Development } from '../types/development';
import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { slideUp } from '@/lib/animations';

interface DevelopmentLocationProps {
    development: Development;
}

export default function DevelopmentLocation({ development }: DevelopmentLocationProps) {
    const { lat, lng } = development.location.coordinates;
    const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-5 rounded-full bg-[#334E68]" />
                <h2
                    className="text-xl text-gray-900 font-bold tracking-tight"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                    Localização
                </h2>
            </div>

            <p className="text-gray-500 font-light text-[15px] mb-6 max-w-xl">
                Situado em uma das regiões mais valorizadas, com acesso privilegiado a serviços e infraestrutura completa.
            </p>

            {/* Map */}
            <motion.div
                variants={slideUp}
                className="aspect-[16/9] rounded-2xl overflow-hidden mb-3 border border-gray-100 shadow-sm relative group"
            >
                <iframe
                    src={mapSrc}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale contrast-110 hover:grayscale-0 transition-all duration-700"
                />
                {/* Street View button overlay */}
                <div className="absolute bottom-3 right-3">
                    <a
                        href={streetViewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg transition-all duration-200 hover:scale-105"
                        style={{ background: 'rgba(255,255,255,0.95)', color: '#102A43', border: '1px solid rgba(0,0,0,0.08)' }}
                    >
                        <Navigation className="w-3.5 h-3.5 text-[#4285F4]" />
                        Street View
                    </a>
                </div>
            </motion.div>

            {/* Address */}
            <motion.div
                variants={slideUp}
                className="inline-flex items-center gap-3 bg-[#F8FAFB] p-4 rounded-xl border border-gray-100"
            >
                <div className="w-9 h-9 rounded-full bg-[#0D1117] flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-[#627D98]" />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm">{development.location.neighborhood}</p>
                    <p className="text-gray-500 text-xs">
                        {development.location.address || `${development.location.city}, ${development.location.state}`}
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
