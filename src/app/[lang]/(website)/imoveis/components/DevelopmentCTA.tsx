'use client';

import React, { useState, useEffect } from 'react';
import { Development } from '../types/development';
import { MessageCircle, FileText, Building2, MapPin, Calendar, Download, Shield, Star, BarChart3, ChevronDown, ChevronUp, BookmarkPlus, Clock, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import LeadCaptureModal from './LeadCaptureModal';

const GOLD = '#C8A44A';
const NAVY = '#0B1928';

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

// Countdown to table expiry (30/04/2026)
function useTableCountdown() {
    const TABLE_EXPIRY = new Date('2026-04-30T23:59:59-03:00');
    const [diff, setDiff] = useState<number>(0);

    useEffect(() => {
        const calc = () => setDiff(Math.max(0, TABLE_EXPIRY.getTime() - Date.now()));
        calc();
        const id = setInterval(calc, 60_000);
        return () => clearInterval(id);
    }, []);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const expired = diff === 0;
    return { days, expired };
}

export default function DevelopmentCTA({ development }: DevelopmentCTAProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ctaType, setCtaType] = useState<'info' | 'table' | 'reservar'>('info');
    const [showIMIPreview, setShowIMIPreview] = useState(false);
    const { days, expired } = useTableCountdown();

    const isLaunch = development.status === 'launch';

    const handleCTAClick = (type: 'info' | 'table' | 'reservar') => {
        setCtaType(type);
        setIsModalOpen(true);
    };

    const handleIMIScroll = () => {
        document.getElementById('inteligencia')?.scrollIntoView({ behavior: 'smooth' });
    };

    const getModalConfig = () => {
        switch (ctaType) {
            case 'reservar':
                return {
                    title: 'Reservar Unidade',
                    description: `Reserve agora sua unidade no ${development.name}. Nossa equipe confirmará a disponibilidade e condições exclusivas de lançamento em até 2 horas.`,
                    interest: `Reserva de unidade — ${development.name}`,
                    whatsappMsg: `Olá! Quero reservar uma unidade no ${development.name}. Qual a disponibilidade atual?`,
                };
            case 'table':
                return {
                    title: 'Solicitar Tabela',
                    description: `Receba a tabela completa de preços e condições de pagamento do ${development.name}. Tabela Nº 17, válida até 30/04/2026.`,
                    interest: `Tabela de preços — ${development.name}`,
                    whatsappMsg: `Olá! Gostaria de receber a tabela completa de preços do ${development.name}.`,
                };
            default:
                return {
                    title: 'Falar com Especialista',
                    description: `Registre seu interesse no ${development.name} e fale com um especialista em instantes.`,
                    interest: `Interesse no empreendimento — ${development.name}`,
                    whatsappMsg: `Olá! Tenho interesse no ${development.name}. Gostaria de mais informações.`,
                };
        }
    };

    const modal = getModalConfig();

    return (
        <>
            <div className="lg:sticky lg:top-28 space-y-3">
                {/* Main CTA Card */}
                <div style={{ borderRadius: 20, overflow: 'hidden', background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                    {/* Gold accent line */}
                    <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD} 50%, transparent)` }} />

                    {/* Price Header */}
                    <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(184,179,168,0.2)', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(200,164,74,0.04)' }} />
                        <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700, marginBottom: 6, color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>A partir de</p>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontSize: 13, color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>R$</span>
                            <span style={{ fontSize: 34, fontWeight: 700, color: NAVY, fontFamily: "var(--fm, 'JetBrains Mono', monospace)", lineHeight: 1 }}>
                                {formatPrice(development.priceRange.min)}
                            </span>
                        </div>
                        {development.priceRange.max > development.priceRange.min && (
                            <p style={{ fontSize: 11, color: '#B8B3A8', marginTop: 4, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                até R$ {formatPrice(development.priceRange.max)}
                            </p>
                        )}
                    </div>

                    {/* Quick Info */}
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(184,179,168,0.2)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <InfoRow icon={Building2} text={development.developer} />
                        <InfoRow icon={MapPin} text={`${development.location.neighborhood}, ${development.location.city}`} />
                        {development.deliveryDate && <InfoRow icon={Calendar} text={development.deliveryDate} />}
                    </div>

                    {/* Table validity warning */}
                    {isLaunch && !expired && days <= 90 && (
                        <div style={{ margin: '0 16px', marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: days <= 30 ? '#FFF5F5' : '#FFFBEB', border: `1px solid ${days <= 30 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                            <Clock style={{ width: 13, height: 13, color: days <= 30 ? '#DC2626' : '#D97706', flexShrink: 0 }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: days <= 30 ? '#DC2626' : '#D97706', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                Tabela válida por mais <strong>{days} dias</strong>
                            </span>
                        </div>
                    )}

                    {/* CTA Buttons */}
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Primary: Reserve */}
                        <button
                            onClick={() => handleCTAClick('reservar')}
                            style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', background: GOLD, color: '#FFFFFF', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', fontFamily: "var(--fu, 'Outfit', sans-serif)", overflow: 'hidden' }}
                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.opacity = '0.92')}
                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.opacity = '1')}
                        >
                            <BookmarkPlus style={{ width: 16, height: 16 }} />
                            Reservar Unidade
                            <span style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, background: 'rgba(255,255,255,0.3)' }} />
                        </button>

                        {/* Secondary: WhatsApp */}
                        <button
                            onClick={() => handleCTAClick('info')}
                            style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', background: NAVY, color: '#FFFFFF', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s', fontFamily: "var(--fu, 'Outfit', sans-serif)", overflow: 'hidden' }}
                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.opacity = '0.9')}
                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.opacity = '1')}
                        >
                            <MessageCircle style={{ width: 15, height: 15 }} />
                            Falar com Especialista
                            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, opacity: 0.5 }} />
                        </button>

                        {/* Table request */}
                        <button
                            onClick={() => handleCTAClick('table')}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 14, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', background: '#FFFFFF', color: NAVY, border: `1.5px solid rgba(11,25,40,0.2)`, cursor: 'pointer', transition: 'background 0.2s', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                            onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = '#F8F6F2')}
                            onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.background = '#FFFFFF')}
                        >
                            <FileText style={{ width: 14, height: 14 }} />
                            Solicitar Tabela de Preços
                        </button>

                        {/* IMI Analysis toggle */}
                        <button
                            onClick={() => setShowIMIPreview((v: boolean) => !v)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, borderRadius: 14, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', background: showIMIPreview ? 'rgba(200,164,74,0.1)' : 'transparent', color: GOLD, border: '1.5px solid rgba(200,164,74,0.35)', cursor: 'pointer', transition: 'background 0.2s', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                        >
                            <BarChart3 style={{ width: 14, height: 14 }} />
                            Análise IMI
                            {showIMIPreview ? <ChevronUp style={{ width: 13, height: 13, marginLeft: 'auto' as const }} /> : <ChevronDown style={{ width: 13, height: 13, marginLeft: 'auto' as const }} />}
                        </button>

                        {/* Brochure download */}
                        {development.images.brochure && (
                            <a
                                href={development.images.brochure}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 40, borderRadius: 12, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', background: '#FFFFFF', color: '#948F84', border: '1px solid rgba(184,179,168,0.4)', cursor: 'pointer', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                            >
                                <Download style={{ width: 13, height: 13, opacity: 0.6 }} />
                                Baixar Material
                            </a>
                        )}
                    </div>

                    {/* Launch scarcity badge */}
                    {isLaunch && (
                        <div style={{ margin: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10, background: '#FFF8E1', border: '1px solid rgba(245,230,163,0.7)' }}>
                            <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: GOLD, opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
                                <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#8B7A2B', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                Lançamento — Condições exclusivas
                            </span>
                        </div>
                    )}

                    {/* Trust indicators */}
                    <div style={{ padding: '12px 24px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Shield style={{ width: 11, height: 11, color: NAVY, opacity: 0.4 }} />
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#B8B3A8', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Verificado</span>
                        </div>
                        <div style={{ width: 1, height: 12, background: '#E5E7EB' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Star style={{ width: 11, height: 11, color: NAVY, opacity: 0.4 }} />
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#B8B3A8', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Premium</span>
                        </div>
                        <div style={{ width: 1, height: 12, background: '#E5E7EB' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <AlertCircle style={{ width: 11, height: 11, color: NAVY, opacity: 0.4 }} />
                            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#B8B3A8', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>CRECI 17933</span>
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
                            style={{ overflow: 'hidden', borderRadius: 16, background: '#FFFFFF', border: '1px solid rgba(200,164,74,0.2)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
                        >
                            <div style={{ padding: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                    <div style={{ width: 6, height: 2, borderRadius: 1, background: GOLD }} />
                                    <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 700, color: GOLD, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Inteligência IMI</span>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                                    {[
                                        { label: 'Localização', score: 92, icon: '📍' },
                                        { label: 'Liquidez', score: 88, icon: '💧' },
                                        { label: 'Rentabilidade', score: 85, icon: '📈' },
                                        { label: 'Construtora', score: 90, icon: '🏗️' },
                                    ].map(item => (
                                        <div key={item.label} style={{ padding: 12, borderRadius: 12, background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.2)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>{item.label}</span>
                                                <span style={{ fontSize: 10 }}>{item.icon}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 6 }}>
                                                <span style={{ fontSize: 22, fontWeight: 700, color: NAVY, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>{item.score}</span>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: '#948F84' }}>/100</span>
                                            </div>
                                            <div style={{ height: 3, borderRadius: 2, background: 'rgba(11,25,40,0.08)' }}>
                                                <div style={{ height: '100%', borderRadius: 2, width: `${item.score}%`, background: item.score >= 90 ? '#22C55E' : item.score >= 75 ? GOLD : '#EF4444' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <p style={{ fontSize: 11, lineHeight: 1.6, marginBottom: 14, color: '#5A6577', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                    <strong style={{ color: NAVY }}>IMI Score: 89/100</strong> — Empreendimento com alto potencial de valorização e liquidez acima da média para o mercado de Garanhuns.
                                </p>

                                <button
                                    onClick={handleIMIScroll}
                                    style={{ width: '100%', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', background: NAVY, color: '#FFFFFF', border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                                >
                                    <BarChart3 style={{ width: 13, height: 13 }} />
                                    Ver Análise Completa
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Payment terms card */}
                {isLaunch && (
                    <div style={{ borderRadius: 16, background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.25)', padding: '16px 18px' }}>
                        <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', color: '#948F84', margin: '0 0 10px', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                            Condições de Pagamento
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { label: 'Taxa de Contrato', value: 'No ato da assinatura' },
                                { label: 'Ato', value: '~10% do valor total' },
                                { label: '49 Parcelas Mensais', value: 'Corrigidas pelo INCC-FGV' },
                                { label: '8 Intercaladas', value: 'A cada 6 meses' },
                                { label: 'Escritura', value: 'Na entrega das chaves' },
                            ].map(row => (
                                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 11, color: '#6B7280', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>{row.label}</span>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: NAVY, fontFamily: "var(--fu, 'Outfit', sans-serif)", textAlign: 'right', flexShrink: 0 }}>{row.value}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(184,179,168,0.2)' }}>
                            <p style={{ fontSize: 9, color: '#B8B3A8', margin: 0, lineHeight: 1.5, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                Regime de administração a preço de custo (condomínio fechado). Tabela Nº 17 válida até 30/04/2026.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <LeadCaptureModal
                        propertyName={development.name}
                        propertyId={development.id}
                        title={modal.title}
                        description={modal.description}
                        customInterest={modal.interest}
                        onClose={() => setIsModalOpen(false)}
                        onSuccess={() => {
                            window.open(`https://wa.me/5581997230455?text=${encodeURIComponent(modal.whatsappMsg)}`, '_blank');
                            setIsModalOpen(false);
                        }}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InfoRow({ icon: Icon, text }: { icon: React.ElementType | any; text: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon style={{ width: 14, height: 14, flexShrink: 0, color: NAVY, opacity: 0.35 }} strokeWidth={1.5} />
            <span style={{ fontSize: 13, color: '#374151', fontFamily: "var(--fu, 'Outfit', sans-serif)" }} className="truncate">{text}</span>
        </div>
    );
}
