'use client';

import { useState } from 'react';
import { Development } from '../types/development';
import { MapPin, Navigation, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { slideUp } from '@/lib/animations';

const GOLD = '#C8A44A';
const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface DevelopmentLocationProps {
    development: Development;
}

// Hardcoded GPS overrides for developments where the database coordinates or address
// don't resolve correctly in Google Maps geocoding. Key = development slug.
const COORD_OVERRIDES: Record<string, { lat: number; lng: number; label: string }> = {};

// Direct Google Maps short URLs per development — these take priority over computed URLs.
// NEVER change these without verifying the exact pin with the development team.
// Alto Bellevue correct link confirmed by client: https://maps.app.goo.gl/vQh4cnsHBcYixe5u8
const DIRECT_MAPS_URLS: Record<string, string> = {
    'alto-bellevue': 'https://maps.app.goo.gl/vQh4cnsHBcYixe5u8',
};

// Place name search queries for the embed map when no real coordinates are available.
// These produce the correct map pin when used with maps.google.com?q=
const EMBED_PLACE_QUERIES: Record<string, string> = {
    'alto-bellevue': 'Condomínio Alto Bellevue, Garanhuns, PE, Brasil',
};

export default function DevelopmentLocation({ development }: DevelopmentLocationProps) {
    const [showStreetView, setShowStreetView] = useState(false);

    // Apply hardcoded coordinate override when available (avoids wrong GMB pin)
    const coordOverride = COORD_OVERRIDES[development.slug];
    const rawCoords = development.location.coordinates;
    const lat = coordOverride?.lat ?? rawCoords.lat;
    const lng = coordOverride?.lng ?? rawCoords.lng;

    // Build full address string for geocoding fallback
    const addressParts = [
        development.location.address,
        development.location.neighborhood,
        development.location.city,
        development.location.state,
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    // Prefer coordinates when an override is present (guaranteed correct pin location)
    const isDefaultCoords = (lat === -8.0476 && lng === -34.8770);
    const hasRealCoords = lat && lng && !isDefaultCoords;
    const hasAddress = !coordOverride && fullAddress && fullAddress.length > 3;

    // Use direct URL override when available (highest priority — verified by client)
    const directMapsUrl = DIRECT_MAPS_URLS[development.slug];
    const embedPlaceQuery = EMBED_PLACE_QUERIES[development.slug];

    const mapSrc = embedPlaceQuery
        ? `https://maps.google.com/maps?q=${encodeURIComponent(embedPlaceQuery)}&z=16&output=embed`
        : hasRealCoords
            ? `https://maps.google.com/maps?q=${lat},${lng}&z=17&output=embed`
            : hasAddress
                ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&z=15&output=embed`
                : `https://maps.google.com/maps?q=${encodeURIComponent('Recife, PE, Brasil')}&output=embed`;
    const mapsUrl = directMapsUrl
        ? directMapsUrl
        : hasRealCoords
            ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            : hasAddress
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Recife, PE, Brasil')}`;

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

            {/* Street View toggle */}
            {hasRealCoords && (
                <div className="mb-5">
                    <button
                        onClick={() => setShowStreetView(!showStreetView)}
                        className="relative inline-flex items-center gap-2 h-11 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden active:scale-[0.98]"
                        style={{
                            background: showStreetView ? '#0B1928' : 'transparent',
                            color: showStreetView ? '#fff' : '#0B1928',
                            border: `2px solid #0B1928`,
                            fontFamily: "var(--fu, 'Outfit', sans-serif)",
                        }}
                    >
                        <Eye className="w-4 h-4" />
                        {showStreetView ? 'Voltar ao Mapa' : 'Ver Street View'}
                        {showStreetView && (
                            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6 }} />
                        )}
                    </button>

                    {showStreetView && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 aspect-[16/9] rounded-[10px] overflow-hidden shadow-lg"
                            style={{ border: '1px solid rgba(200,164,74,0.1)' }}
                        >
                            <iframe
                                src={`https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_KEY}&location=${lat},${lng}&heading=210&pitch=10&fov=35`}
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </motion.div>
                    )}
                </div>
            )}

            {/* Address card + Google Maps link */}
            <motion.div variants={slideUp} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Address card — light theme, fully readable */}
                <div
                    className="flex items-center gap-3 p-4 rounded-xl flex-1 min-w-0"
                    style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(184,179,168,0.35)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                >
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(200,164,74,0.1)' }}
                    >
                        <MapPin className="w-4 h-4" style={{ color: GOLD }} />
                    </div>
                    <div className="min-w-0">
                        <p
                            className="font-semibold text-sm truncate"
                            style={{ color: '#0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                        >
                            {development.location.neighborhood}
                            {development.location.city && (
                                <span style={{ fontWeight: 400, color: '#948F84' }}>
                                    {', '}{development.location.city}
                                </span>
                            )}
                        </p>
                        {development.location.address && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: '#948F84' }}>
                                {development.location.address}
                            </p>
                        )}
                    </div>
                </div>

                <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.98] flex-shrink-0"
                    style={{ background: '#0B1928', color: '#fff', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                >
                    <Navigation size={14} />
                    Abrir no Maps
                    <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6 }} />
                </a>
            </motion.div>
        </motion.div>
    );
}
