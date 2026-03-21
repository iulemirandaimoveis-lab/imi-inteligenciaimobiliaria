'use client';

import { Development } from '../types/development';
import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { slideUp } from '@/lib/animations';

const GOLD = '#3D6FFF';

interface DevelopmentLocationProps {
    development: Development;
}

export default function DevelopmentLocation({ development }: DevelopmentLocationProps) {
    const { lat, lng } = development.location.coordinates;
    const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-6 rounded-full" style={{ background: GOLD }} />
                <h2
                    className="text-xl text-gray-900 font-bold tracking-tight"
                    style={{ fontFamily: "'Libre Baskerville', 'Playfair Display', Georgia, serif" }}
                >
                    Localização
                </h2>
            </div>

            <p className="text-gray-500 leading-relaxed text-[15px] mb-6 max-w-xl">
                {development.location.address
                    ? `${development.location.address}, ${development.location.neighborhood} — ${development.location.city}, ${development.location.state}`
                    : `${development.location.neighborhood}, ${development.location.city} — ${development.location.state}`}
            </p>

            {/* Map */}
            <motion.div
                variants={slideUp}
                className="aspect-[16/9] rounded-2xl overflow-hidden mb-5 shadow-lg"
                style={{ border: '1px solid rgba(200,164,74,0.1)' }}
            >
                <iframe
                    src={mapSrc}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale-[30%] hover:grayscale-0 transition-all duration-700"
                />
            </motion.div>

            {/* Address card + Google Maps link */}
            <motion.div variants={slideUp} className="flex items-center justify-between gap-4 flex-wrap">
                <div
                    className="inline-flex items-center gap-3 p-4 rounded-xl"
                    style={{ background: '#0B1928', border: '1px solid rgba(200,164,74,0.12)' }}
                >
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(200,164,74,0.1)' }}
                    >
                        <MapPin className="w-4 h-4" style={{ color: GOLD }} />
                    </div>
                    <div>
                        <p className="font-semibold text-white text-sm">{development.location.neighborhood}</p>
                        <p className="text-xs" style={{ color: '#627D98' }}>
                            {development.location.address || `${development.location.city}, ${development.location.state}`}
                        </p>
                    </div>
                </div>

                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:brightness-110"
                    style={{ background: 'rgba(200,164,74,0.1)', color: GOLD, border: '1px solid rgba(200,164,74,0.2)' }}
                >
                    <Navigation size={12} />
                    Abrir no Maps
                </a>
            </motion.div>
        </motion.div>
    );
}
