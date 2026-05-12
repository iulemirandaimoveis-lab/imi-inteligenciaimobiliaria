'use client';

import { useState } from 'react';
import { Development } from '../types/development';
import { MessageCircle, FileText, Building2, MapPin, Calendar, Download, Shield, Star, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import LeadCaptureModal from './LeadCaptureModal';

const GOLD = '#C8A44A';

interface IMIData {
    imiScore: number;
    location: number;
    liquidity: number;
    rentabilidade: number;
    construtora: number;
}

interface DevelopmentCTAProps {
    development: Development;
    imiData?: IMIData;
    whatsappPhone?: string;
}

const formatPrice = (price: number) => {
    if (price >= 1000000) {
        const m = price / 1000000;
        return m % 1 === 0 ? `${m}M` : `${m.toFixed(1).replace(/\.0$/, '')}M`;
    }
    return price.toLocaleString('pt-BR');
};

export default function DevelopmentCTA({ development, imiData, whatsappPhone }: DevelopmentCTAProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ctaType, setCtaType] = useState<'info' | 'table' | 'imi'>('info');
    const [showIMIPreview, setShowIMIPreview] = useState(false);

    const handleCTAClick = (type: 'info' | 'table' | 'imi') => {
        if (type === 'imi') {
            document.getElementById('inteligencia')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        setCtaType(type);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        const messages = {
            info: `Olá! Tenho interesse no ${development.name}. Gostaria de mais informações.`,
            table: `Olá! Gostaria de receber a tabela completa de preços do ${development.name}.`,
            imi: `Olá! Gostaria de receber a Análise IMI completa do ${development.name}.`,
        };
        const message = encodeURIComponent(messages[ctaType]);
        window.open(`https://wa.me/${whatsappPhone ?? '5581997230455'}?text=${message}`, '_blank');
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

                        {/* Análise IMI button */}
                        <button
                            onClick={() => setShowIMIPreview(v => !v)}
                            className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 active:scale-[0.98]"
                            style={{
                                background: showIMIPreview ? '#C8A44A' : 'rgba(200,164,74,0.08)',
                                color: showIMIPreview ? '#FFFFFF' : '#C8A44A',
                                border: '1.5px solid rgba(200,164,74,0.35)',
                                fontFamily: "var(--fu, 'Outfit', sans-serif)",
                            }}
                        >
                            <BarChart3 className="w-4 h-4" />
                            Análise IMI
                            {showIMIPreview ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
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

            {/* IMI Analysis Preview Panel */}
            <AnimatePresence>
                {showIMIPreview && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                        style={{ borderRadius: 16, background: '#FFFFFF', border: '1px solid rgba(200,164,74,0.2)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
                    >
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-6 h-[2px] rounded-full" style={{ background: '#C8A44A' }} />
                                <span className="text-[10px] uppercase tracking-[0.25em] font-bold" style={{ color: '#C8A44A' }}>Inteligência IMI</span>
                            </div>

                            {/* Score highlights */}
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {[
                                    { label: 'Localização', score: imiData?.location ?? 72, icon: '📍' },
                                    { label: 'Liquidez', score: imiData?.liquidity ?? 55, icon: '💧' },
                                    { label: 'Rentabilidade', score: imiData?.rentabilidade ?? 55, icon: '📈' },
                                    { label: 'Construtora', score: imiData?.construtora ?? 72, icon: '🏗️' },
                                ].map(item => (
                                    <div key={item.label} className="p-3 rounded-xl" style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.2)' }}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#948F84' }}>{item.label}</span>
                                            <span className="text-[10px]">{item.icon}</span>
                                        </div>
                                        <div className="flex items-end gap-1.5">
                                            <span className="text-xl font-bold" style={{ color: '#0B1928', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{item.score}</span>
                                            <span className="text-[10px] font-bold mb-0.5" style={{ color: '#948F84' }}>/100</span>
                                        </div>
                                        <div className="mt-1.5 h-1 rounded-full" style={{ background: 'rgba(11,25,40,0.08)' }}>
                                            <div className="h-full rounded-full" style={{ width: `${item.score}%`, background: item.score >= 90 ? '#22C55E' : item.score >= 75 ? '#C8A44A' : '#EF4444' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <p className="text-[11px] leading-relaxed mb-4" style={{ color: '#5A6577' }}>
                                <strong style={{ color: '#0B1928' }}>IMI Score: {imiData?.imiScore ?? '—'}/100</strong> — Análise IMI baseada em dados do empreendimento e do mercado de {development.location.city}.
                            </p>

                            <button
                                onClick={() => handleCTAClick('imi')}
                                className="w-full h-10 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all"
                                style={{ background: '#0B1928', color: '#FFFFFF', border: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                Ver Análise Completa
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
