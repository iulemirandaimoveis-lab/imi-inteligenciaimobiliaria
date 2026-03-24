'use client';

import { Development } from '../types/development';
import { MapPin, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import { slideUp } from '@/lib/animations';

const GOLD = '#C8A44A';

interface DevelopmentLocationProps {
    development: Development;
}

export default function DevelopmentLocation({ development }: DevelopmentLocationProps) {
    const { lat, lng } = development.location.coordinates;

    // Build full address string for geocoding fallback
    const addressParts = [
        development.location.address,
        development.location.neighborhood,
        development.location.city,
        development.location.state,
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    // If coordinates are still the Recife defaults, use address-based geocoding instead
    const isDefaultCoords = (lat === -8.0476 && lng === -34.8770);
    const hasRealCoords = lat && lng && !isDefaultCoords;

    const mapSrc = hasRealCoords
        ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
        : `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress || 'Recife, PE, Brasil')}&output=embed`;
    const mapsUrl = hasRealCoords
        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress || 'Recife, PE, Brasil')}`;

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
                    style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
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
                className="aspect-[16/9] rounded-[10px] overflow-hidden mb-5 shadow-lg"
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
            <motion.div variants={slideUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div
                    className="inline-flex items-center gap-3 p-4 rounded-[10px]"
                    style={{ background: 'rgba(14,28,48,.52)', backdropFilter: 'blur(20px)', border: '1px solid rgba(200,164,74,.12)' }}
                >
                    <div
                        className="w-9 h-9 rounded-[4px] flex items-center justify-center flex-shrink-0"
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
                    className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden"
                    style={{ background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)", minHeight: 44 }}
                >
                    <Navigation size={12} />
                    Abrir no Maps
                    <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6 }} />
                </a>
            </motion.div>
        </motion.div>
    );
}
