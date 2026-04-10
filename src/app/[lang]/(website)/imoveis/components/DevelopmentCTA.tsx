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
                <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                    {/* Price Header */}
                    <div className="p-6 relative overflow-hidden" style={{ borderBottom: '1px solid rgba(184,179,168,0.2)' }}>
                        <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>A partir de</p>
                        <p
                            className="text-[32px] font-bold tracking-tight relative z-10"
                            style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)", color: '#0B1928' }}
                        >
                            <span className="text-sm font-normal mr-1.5" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>R$</span>
                            {formatPrice(development.priceRange.min)}
                        </p>
                    </div>

                    {/* Quick Info */}
                    <div className="p-5 space-y-3.5" style={{ borderBottom: '1px solid rgba(184,179,168,0.2)' }}>
                        <InfoRow icon={Building2} text={development.developer} />
                        <InfoRow icon={MapPin} text={`${development.location.neighborhood}, ${development.location.city}`} />
                        {development.deliveryDate && <InfoRow icon={Calendar} text={development.deliveryDate} />}
                    </div>

                    {/* CTA Buttons */}
                    <div className="p-5 space-y-2.5">
                        <button
                            onClick={() => handleCTAClick('info')}
                            className="w-full relative flex items-center justify-center gap-2.5 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.98]"
                            style={{ background: '#0B1928', color: '#fff', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Falar com Especialista
                            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.5 }} />
                        </button>

                        <button
                            onClick={() => handleCTAClick('table')}
                            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                            style={{ background: '#FFFFFF', color: '#0B1928', border: '2px solid #0B1928', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                        >
                            <FileText className="w-4 h-4" />
                            Solicitar Tabela
                        </button>

                        {development.images.brochure && (
                            <a
                                href={development.images.brochure}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-gray-50"
                                style={{ background: '#FFFFFF', color: '#948F84', border: '1px solid #B8B3A8', fontFamily: "var(--fu, 'Outfit', sans-serif)", textDecoration: 'none' }}
                            >
                                <Download className="w-4 h-4" style={{ opacity: 0.6 }} />
                                Baixar Material
                            </a>
                        )}
                    </div>

                    {/* Urgency / scarcity indicator */}
                    {development.status === 'launch' && (
                        <div className="mx-5 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#FFF8E1', border: '1px solid #F5E6A3' }}>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: GOLD }} />
                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: GOLD }} />
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8B7A2B' }}>
                                Lançamento — Condições exclusivas
                            </span>
                        </div>
                    )}

                    {/* Trust indicators */}
                    <div className="px-5 pb-5 flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#948F84' }}>
                            <Shield size={12} style={{ color: '#0B1928', opacity: 0.4 }} />
                            Verificado
                        </div>
                        <div className="w-px h-3" style={{ background: '#B8B3A8' }} />
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#948F84' }}>
                            <Star size={12} style={{ color: '#0B1928', opacity: 0.4 }} />
                            Premium
                        </div>
                    </div>
                </div>

                {/* Quick phone */}
                <a
                    href="tel:+5581997230455"
                    className="flex items-center justify-center gap-2 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                    style={{ background: '#FFFFFF', color: '#0B1928', border: '2px solid #0B1928', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                >
                    <Phone className="w-3.5 h-3.5" />
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

function InfoRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm">
            <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} style={{ color: '#0B1928', opacity: 0.4 }} />
            <span style={{ color: '#2D3748' }} className="truncate">{text}</span>
        </div>
    );
}
