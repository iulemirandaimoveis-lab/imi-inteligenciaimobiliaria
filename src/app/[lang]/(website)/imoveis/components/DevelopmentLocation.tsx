'use client';

import { Development } from '../types/development';
import { MapPin } from 'lucide-react';

interface DevelopmentLocationProps {
    development: Development;
}

export default function DevelopmentLocation({ development }: DevelopmentLocationProps) {
    const { lat, lng } = development.location.coordinates;
    const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

    return (
        <section className="section-padding bg-imi-50">
            <div className="container-custom">
                <div className="max-w-3xl mb-12">
                    <h2 className="font-display text-3xl md:text-4xl text-imi-900 mb-4 font-bold">Localização Privilegiada</h2>
                    <p className="text-imi-500 font-light text-lg">
                        Situado em uma das regiões mais valorizadas e estrategicamente posicionadas para garantir liquidez e qualidade de vida.
                    </p>
                </div>

                {/* Mapa - Premium rounded border */}
                <div className="aspect-[21/9] rounded-2xl overflow-hidden mb-8 shadow-card border border-imi-200">
                    <iframe
                        src={mapSrc}
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="grayscale contrast-125 group-hover:grayscale-0 transition-all duration-700"
                    />
                </div>

                {/* Endereço Card */}
                <div className="inline-flex items-start gap-4 bg-white p-8 rounded-2xl border border-imi-100 shadow-soft max-w-2xl">
                    <div className="w-12 h-12 rounded-full bg-imi-900 flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-accent-500" />
                    </div>
                    <div>
                        <p className="font-bold text-imi-900 text-xl mb-1">
                            {development.location.neighborhood}
                        </p>
                        <p className="text-imi-500 font-light">
                            {development.location.address ||
                                `${development.location.city}, ${development.location.state}`}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
