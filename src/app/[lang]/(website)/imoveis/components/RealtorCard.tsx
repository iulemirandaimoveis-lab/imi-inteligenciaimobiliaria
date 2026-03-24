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
        <div className="rounded-[10px] overflow-hidden" style={{ background: 'rgba(14,28,48,.52)', backdropFilter: 'blur(20px)', border: '1px solid rgba(200,164,74,.12)' }}>
            {/* Header */}
            <div className="px-5 py-3" style={{ background: 'rgba(10,22,36,0.6)', borderBottom: '1px solid rgba(200,164,74,0.08)' }}>
                <p className="text-[11px] font-bold tracking-[0.15em] uppercase" style={{ color: '#C8A44A', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                    Corretor Responsável
                </p>
            </div>

            <div className="p-5">
                {/* Avatar + Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left mb-4">
                    <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(200,164,74,0.08)', border: '1px solid rgba(200,164,74,0.15)' }}>
                        {broker.avatar_url ? (
                            <Image
                                src={broker.avatar_url}
                                alt={broker.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-lg font-bold" style={{ color: '#C8A44A' }}>
                                {initials}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-base font-bold text-white truncate" style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                            {broker.name}
                        </h4>
                        {broker.creci && (
                            <p className="text-xs mt-0.5" style={{ color: '#627D98', fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                                CRECI {broker.creci}
                            </p>
                        )}
                        <p className="text-[11px] font-medium uppercase tracking-wider mt-1" style={{ color: '#8E99AB', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
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
                            style={{ color: '#9FB3C8', textDecoration: 'none' }}
                        >
                            <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#627D98' }} />
                            <span className="truncate">{broker.email}</span>
                        </a>
                    )}
                    {broker.phone && (
                        <a
                            href={`tel:${broker.phone}`}
                            aria-label={`Ligar para ${broker.name}`}
                            className="flex items-center gap-2.5 text-sm transition-colors hover:opacity-80"
                            style={{ color: '#9FB3C8', textDecoration: 'none' }}
                        >
                            <Phone className="w-4 h-4 flex-shrink-0" style={{ color: '#627D98' }} />
                            <span>{broker.phone}</span>
                        </a>
                    )}
                </div>

                {/* WhatsApp CTA — navy + gold line */}
                {whatsappUrl && (
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Conversar no WhatsApp com ${broker.name}`}
                        className="relative flex items-center justify-center gap-2 w-full h-11 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden"
                        style={{ background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Falar com {broker.name.split(' ')[0]}
                        <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6 }} />
                    </a>
                )}

                {/* Agendar Visita — navy + gold line (NOT green) */}
                {broker.phone && (
                    <a
                        href={`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de agendar uma visita ao ${propertyName}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative w-full mt-3 flex items-center justify-center gap-2 h-11 rounded-[4px] text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden"
                        style={{ background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                    >
                        <Calendar className="w-4 h-4" />
                        Agendar Visita
                        <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.4 }} />
                    </a>
                )}
            </div>
        </div>
    )
}
