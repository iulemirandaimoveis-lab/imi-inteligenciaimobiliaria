'use client'

import Image from 'next/image'
import { Mail, Phone, MessageCircle, Calendar, Clock, Award } from 'lucide-react'

interface RealtorInfo {
    name: string
    email?: string | null
    phone?: string | null
    creci?: string | null
    avatar_url?: string | null
}

export default function RealtorCard({ broker, propertyName }: { broker: RealtorInfo; propertyName: string }) {
    const initials = broker.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    const especialidades = broker.creci
        ? ['Imóveis de Luxo', 'Investimentos', 'Primeira Compra']
        : ['Consultoria Imobiliária', 'Primeira Compra']

    const whatsappUrl = broker.phone
        ? `https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${broker.name}! Tenho interesse no ${propertyName}. Gostaria de mais informações.`)}`
        : null

    return (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            {/* Header */}
            <div className="px-5 py-3" style={{ background: '#F8F6F2', borderBottom: '1px solid rgba(184,179,168,0.2)' }}>
                <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    Corretor Responsável
                </p>
            </div>

            <div className="p-5">
                {/* Avatar + Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left mb-4">
                    <div className="relative w-[96px] h-[96px] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#F0EDE5', border: '2px solid rgba(200,164,74,0.25)' }}>
                        {broker.avatar_url ? (
                            <Image
                                src={broker.avatar_url}
                                alt={broker.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-xl font-bold" style={{ color: '#0B1928' }}>
                                {initials}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-base font-bold truncate" style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)", color: '#0B1928' }}>
                            {broker.name}
                        </h4>
                        {broker.creci && (
                            <p className="text-xs mt-0.5" style={{ color: '#948F84', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                                CRECI {broker.creci}
                            </p>
                        )}
                        <p className="text-[11px] font-medium uppercase tracking-wider mt-1" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                            Consultor Imobiliário
                        </p>
                    </div>
                </div>

                {/* Especialidades */}
                <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Award className="w-3.5 h-3.5" style={{ color: '#C8A44A' }} />
                        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                            Especialidades
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {especialidades.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium"
                                style={{ background: 'rgba(200,164,74,0.08)', color: '#8B7A3A', border: '1px solid rgba(200,164,74,0.18)', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Tempo de resposta */}
                <div
                    className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}
                >
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#10B981' }} />
                    <span className="text-xs font-medium" style={{ color: '#065F46', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                        Responde em ~15min
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#10B981' }} />
                </div>

                {/* Contact info */}
                <div className="space-y-2 mb-4">
                    {broker.email && (
                        <a
                            href={`mailto:${broker.email}`}
                            className="flex items-center gap-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#2D3748', textDecoration: 'none' }}
                        >
                            <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#948F84' }} />
                            <span className="truncate">{broker.email}</span>
                        </a>
                    )}
                    {broker.phone && (
                        <a
                            href={`tel:${broker.phone}`}
                            aria-label={`Ligar para ${broker.name}`}
                            className="flex items-center gap-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#2D3748', textDecoration: 'none' }}
                        >
                            <Phone className="w-4 h-4 flex-shrink-0" style={{ color: '#948F84' }} />
                            <span>{broker.phone}</span>
                        </a>
                    )}
                </div>

                {/* WhatsApp CTA — navy button */}
                {whatsappUrl && (
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Conversar no WhatsApp com ${broker.name}`}
                        className="relative flex items-center justify-center gap-2 w-full h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.98]"
                        style={{ background: '#0B1928', color: '#fff', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Falar com {broker.name.split(' ')[0]}
                        <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.5 }} />
                    </a>
                )}

                {/* Agendar Visita — outlined navy button */}
                {broker.phone && (
                    <a
                        href={`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de agendar uma visita ao ${propertyName}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-3 flex items-center justify-center gap-2 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-gray-50 active:scale-[0.98]"
                        style={{ background: '#FFFFFF', color: '#0B1928', border: '2px solid #0B1928', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                    >
                        <Calendar className="w-4 h-4" />
                        Agendar Visita
                    </a>
                )}
            </div>
        </div>
    )
}
