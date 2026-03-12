'use client';

import { Development } from '../types/development';
import { MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { slideUp } from '@/lib/animations';

interface DevelopmentLocationProps {
    development: Development;
}

export default function DevelopmentLocation({ development }: DevelopmentLocationProps) {
    const { lat, lng } = development.location.coordinates;
    const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

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
                {development.location.address
                    ? `${development.location.address}, ${development.location.neighborhood} — ${development.location.city}, ${development.location.state}`
                    : `${development.location.neighborhood}, ${development.location.city} — ${development.location.state}`}
            </p>

            {/* Map */}
            <motion.div
                variants={slideUp}
                className="aspect-[16/9] rounded-2xl overflow-hidden mb-5 border border-gray-100 shadow-sm"
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
