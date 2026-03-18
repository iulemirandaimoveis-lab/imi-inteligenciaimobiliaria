'use client';

import { useState } from 'react';
import { Development } from '../types/development';
import { MessageCircle, FileText, Building2, MapPin, Calendar, Phone, Download, Shield, Star } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import LeadCaptureModal from './LeadCaptureModal';

const GOLD = '#C8A44A';

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
                <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: '#0B1928', border: `1px solid rgba(200,164,74,0.15)` }}>
                    {/* Price Header with gold gradient */}
                    <div className="p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1928 0%, #102A43 100%)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" style={{ background: 'rgba(200,164,74,0.08)' }} />
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1.5" style={{ color: GOLD, opacity: 0.7 }}>A partir de</p>
                        <p
                            className="text-[28px] font-bold text-white tracking-tight relative z-10"
                            style={{ fontFamily: "'Libre Baskerville', 'Playfair Display', Georgia, serif" }}
                        >
                            <span className="text-sm font-sans font-normal mr-1.5" style={{ color: '#627D98' }}>R$</span>
                            {formatPrice(development.priceRange.min)}
                        </p>
                    </div>

                    {/* Quick Info */}
                    <div className="p-5 space-y-3.5" style={{ borderBottom: '1px solid rgba(200,164,74,0.08)' }}>
                        <InfoRow icon={Building2} text={development.developer} />
                        <InfoRow icon={MapPin} text={`${development.location.neighborhood}, ${development.location.city}`} />
                        {development.deliveryDate && <InfoRow icon={Calendar} text={development.deliveryDate} />}
                    </div>

                    {/* CTA Buttons */}
                    <div className="p-5 space-y-2.5">
                        <button
                            onClick={() => handleCTAClick('info')}
                            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-sm font-bold transition-all duration-200 hover:brightness-110"
                            style={{ background: GOLD, color: '#0B1928' }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Falar com Especialista
                        </button>

                        <button
                            onClick={() => handleCTAClick('table')}
                            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-sm font-semibold transition-all duration-200"
                            style={{ border: `1px solid rgba(200,164,74,0.25)`, color: '#9FB3C8', background: 'rgba(200,164,74,0.06)' }}
                        >
                            <FileText className="w-4 h-4" style={{ color: GOLD, opacity: 0.6 }} />
                            Solicitar Tabela
                        </button>

                        {development.images.brochure && (
                            <a
                                href={development.images.brochure}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-sm font-semibold transition-all duration-200"
                                style={{ border: `1px solid rgba(200,164,74,0.15)`, color: '#627D98' }}
                            >
                                <Download className="w-4 h-4" style={{ opacity: 0.6 }} />
                                Baixar Material
                            </a>
                        )}
                    </div>

                    {/* Trust indicators */}
                    <div className="px-5 pb-5 flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#627D98' }}>
                            <Shield size={11} style={{ color: GOLD, opacity: 0.5 }} />
                            Verificado
                        </div>
                        <div className="w-px h-3" style={{ background: 'rgba(200,164,74,0.15)' }} />
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#627D98' }}>
                            <Star size={11} style={{ color: GOLD, opacity: 0.5 }} />
                            Premium
                        </div>
                    </div>
                </div>

                {/* Quick phone */}
                <a
                    href="tel:+5581997230455"
                    className="flex items-center justify-center gap-2 h-11 rounded-xl text-xs font-semibold transition-colors"
                    style={{ background: 'rgba(200,164,74,0.06)', color: '#9FB3C8', border: '1px solid rgba(200,164,74,0.1)' }}
                >
                    <Phone className="w-3.5 h-3.5" style={{ color: GOLD, opacity: 0.5 }} />
                    (81) 9 9723-0455
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
            <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} style={{ color: GOLD, opacity: 0.5 }} />
            <span style={{ color: '#9FB3C8' }} className="truncate">{text}</span>
        </div>
    );
}
