'use client'

import Image from 'next/image'
import { Mail, Phone, MessageCircle, Calendar } from 'lucide-react'

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
                    <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: '#F0EDE5', border: '1px solid rgba(184,179,168,0.3)' }}>
                        {broker.avatar_url ? (
                            <Image
                                src={broker.avatar_url}
                                alt={broker.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-lg font-bold" style={{ color: '#0B1928' }}>
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
                        className="flex items-center justify-center gap-2 w-full h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200"
                        style={{ background: '#0B1928', color: '#fff', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Falar com {broker.name.split(' ')[0]}
                    </a>
                )}

                {/* Agendar Visita — outlined navy button */}
                {broker.phone && (
                    <a
                        href={`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de agendar uma visita ao ${propertyName}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-3 flex items-center justify-center gap-2 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200"
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
