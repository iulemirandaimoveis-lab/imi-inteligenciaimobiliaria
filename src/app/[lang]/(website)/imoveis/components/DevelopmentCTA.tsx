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
                <div className="rounded-[10px] overflow-hidden shadow-xl" style={{ background: 'rgba(14,28,48,.52)', backdropFilter: 'blur(20px)', border: '1px solid rgba(200,164,74,.12)' }}>
                    {/* Price Header with gold gradient */}
                    <div className="p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1928 0%, #102A43 100%)' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl" style={{ background: 'rgba(200,164,74,0.08)' }} />
                        <p className="text-[11px] uppercase tracking-[0.2em] font-bold mb-1.5" style={{ color: GOLD, opacity: 0.7, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>A partir de</p>
                        <p
                            className="text-[28px] font-bold tracking-tight relative z-10"
                            style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)", color: GOLD }}
                        >
                            <span className="text-sm font-normal mr-1.5" style={{ color: '#627D98', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>R$</span>
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
                            className="relative w-full flex items-center justify-center gap-2.5 h-12 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden"
                            style={{ background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Falar com Especialista
                            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6 }} />
                        </button>

                        <button
                            onClick={() => handleCTAClick('table')}
                            className="relative w-full flex items-center justify-center gap-2.5 h-12 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden"
                            style={{ background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                        >
                            <FileText className="w-4 h-4" style={{ color: GOLD, opacity: 0.6 }} />
                            Solicitar Tabela
                            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.4 }} />
                        </button>

                        {development.images.brochure && (
                            <a
                                href={development.images.brochure}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative w-full flex items-center justify-center gap-2.5 h-12 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden"
                                style={{ background: '#0A1624', color: '#9FB3C8', border: '1px solid rgba(255,255,255,0.08)', fontFamily: "var(--fu, 'Outfit', sans-serif)", textDecoration: 'none' }}
                            >
                                <Download className="w-4 h-4" style={{ opacity: 0.6 }} />
                                Baixar Material
                                <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.3 }} />
                            </a>
                        )}
                    </div>

                    {/* Trust indicators */}
                    <div className="px-5 pb-5 flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#627D98' }}>
                            <Shield size={12} style={{ color: GOLD, opacity: 0.5 }} />
                            Verificado
                        </div>
                        <div className="w-px h-3" style={{ background: 'rgba(200,164,74,0.15)' }} />
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#627D98' }}>
                            <Star size={12} style={{ color: GOLD, opacity: 0.5 }} />
                            Premium
                        </div>
                    </div>
                </div>

                {/* Quick phone */}
                <a
                    href="tel:+5581997230455"
                    className="relative flex items-center justify-center gap-2 h-11 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-colors overflow-hidden"
                    style={{ background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                >
                    <Phone className="w-3.5 h-3.5" style={{ color: GOLD, opacity: 0.7 }} />
                    (81) 9 9723-0455
                    <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.4 }} />
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

function InfoRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} style={{ color: GOLD, opacity: 0.5 }} />
            <span style={{ color: '#9FB3C8' }} className="truncate">{text}</span>
        </div>
    );
}
