'use client';

import { useState } from 'react';
import { Development } from '../types/development';
import { MessageCircle, FileText, Building2, MapPin, Calendar, Phone } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import LeadCaptureModal from './LeadCaptureModal';

interface DevelopmentCTAProps {
    development: Development;
}

const formatPrice = (price: number) => {
    if (price >= 1000000) {
        const m = price / 1000000;
        return m % 1 === 0 ? `${m}M` : `${m.toFixed(1).replace(/\.0$/, '')}M`;
    }
    return price.toLocaleString('pt-BR');
};

export default function DevelopmentCTA({ development }: DevelopmentCTAProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ctaType, setCtaType] = useState<'info' | 'table'>('info');

    const handleCTAClick = (type: 'info' | 'table') => {
        setCtaType(type);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        const messages = {
            info: `Olá! Tenho interesse no ${development.name}. Gostaria de mais informações.`,
            table: `Olá! Gostaria de receber a tabela completa de preços do ${development.name}.`
        };

        const message = encodeURIComponent(messages[ctaType]);
        window.open(`https://wa.me/5581997230455?text=${message}`, '_blank');
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="lg:sticky lg:top-28 space-y-4">
                {/* Main CTA Card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-lg overflow-hidden">
                    {/* Price Header */}
                    <div className="bg-[#0D1117] p-6">
                        <p className="text-[10px] text-[#627D98] uppercase tracking-[0.2em] font-bold mb-1">A partir de</p>
                        <p
                            className="text-[26px] font-bold text-white tracking-tight"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            <span className="text-sm font-sans font-normal text-[#627D98] mr-1.5">R$</span>
                            {formatPrice(development.priceRange.min)}
                        </p>
                    </div>

                    {/* Quick Info */}
                    <div className="p-5 space-y-3.5 border-b border-gray-50">
                        <InfoRow icon={Building2} text={development.developer} />
                        <InfoRow icon={MapPin} text={`${development.location.neighborhood}, ${development.location.city}`} />
                        {development.deliveryDate && (
                            <InfoRow icon={Calendar} text={development.deliveryDate} />
                        )}
                    </div>

                    {/* CTA Buttons */}
                    <div className="p-5 space-y-2.5">
                        <button
                            onClick={() => handleCTAClick('info')}
                            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl bg-[#102A43] text-white text-sm font-semibold hover:bg-[#1A2F44] transition-all duration-200"
                        >
                            <MessageCircle className="w-4 h-4" />
                            Falar com Especialista
                        </button>

                        <button
                            onClick={() => handleCTAClick('table')}
                            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                        >
                            <FileText className="w-4 h-4 text-[#627D98]" />
                            Solicitar Tabela
                        </button>
                    </div>
                </div>

                {/* Quick phone */}
                <a
                    href="tel:+5581997230455"
                    className="flex items-center justify-center gap-2 h-11 rounded-xl bg-gray-50 text-gray-500 text-xs font-semibold hover:bg-gray-100 transition-colors border border-gray-100"
                >
                    <Phone className="w-3.5 h-3.5" />
                    (81) 99723-0455
                </a>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <LeadCaptureModal
                        propertyName={development.name}
                        propertyId={development.id}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

function InfoRow({ icon: Icon, text }: { icon: any; text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <Icon className="w-4 h-4 text-[#627D98] flex-shrink-0" strokeWidth={1.5} />
            <span className="text-gray-600 truncate">{text}</span>
        </div>
    );
}
