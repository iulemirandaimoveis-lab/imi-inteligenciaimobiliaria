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

function formatBRPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('55') && digits.length === 13) {
        const ddd = digits.slice(2, 4)
        const num = digits.slice(4)
        return `(${ddd}) ${num[0]} ${num.slice(1, 5)}-${num.slice(5)}`
    }
    if (digits.length === 11) {
        const ddd = digits.slice(0, 2)
        const num = digits.slice(2)
        return `(${ddd}) ${num[0]} ${num.slice(1, 5)}-${num.slice(5)}`
    }
    return raw
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

    const agendarUrl = broker.phone
        ? `https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de agendar uma visita ao ${propertyName}`)}`
        : null

    const displayPhone = broker.phone ? formatBRPhone(broker.phone) : null
    const firstName = broker.name.split(' ')[0]

    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{
                background: '#FFFFFF',
                border: '1px solid rgba(184,179,168,0.3)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
        >
            {/* Header bar */}
            <div
                className="px-5 py-3"
                style={{ background: '#F8F6F2', borderBottom: '1px solid rgba(184,179,168,0.2)' }}
            >
                <p
                    className="text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                >
                    Corretor Responsável
                </p>
            </div>

            <div className="p-5">
                {/* Avatar + Identity */}
                <div className="flex flex-col items-center text-center gap-3 mb-5">
                    {/* Avatar with gold ring */}
                    <div
                        className="relative w-[88px] h-[88px] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
                        style={{
                            background: '#F0EDE5',
                            boxShadow: '0 0 0 3px rgba(200,164,74,0.2), 0 0 0 6px rgba(200,164,74,0.07)',
                        }}
                    >
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

                    <div>
                        <h4
                            className="text-[17px] font-bold"
                            style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)", color: '#0B1928', lineHeight: 1.2 }}
                        >
                            {broker.name}
                        </h4>
                        {broker.creci && (
                            <p
                                className="text-[11px] mt-1"
                                style={{ color: '#948F84', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", letterSpacing: '0.04em' }}
                            >
                                CRECI {broker.creci}
                            </p>
                        )}
                        <p
                            className="text-[10px] font-bold uppercase tracking-widest mt-1"
                            style={{ color: '#B8B3A8', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                        >
                            Consultor Imobiliário
                        </p>
                    </div>
                </div>

                {/* Especialidades */}
                <div className="mb-4">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Award className="w-3.5 h-3.5" style={{ color: '#C8A44A' }} />
                        <span
                            className="text-[10px] font-bold tracking-widest uppercase"
                            style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                        >
                            Especialidades
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {especialidades.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium"
                                style={{
                                    background: 'rgba(200,164,74,0.08)',
                                    color: '#8B7A3A',
                                    border: '1px solid rgba(200,164,74,0.22)',
                                    fontFamily: "var(--fu, 'Outfit', sans-serif)",
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Response time */}
                <div
                    className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
                >
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#10B981' }} />
                    <Clock className="w-3 h-3 flex-shrink-0" style={{ color: '#10B981' }} />
                    <span
                        className="text-[11px] font-semibold"
                        style={{ color: '#065F46', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                    >
                        Responde em ~15min
                    </span>
                </div>

                {/* Contact links */}
                <div
                    className="space-y-2 mb-5 pb-5"
                    style={{ borderBottom: '1px solid rgba(184,179,168,0.2)' }}
                >
                    {broker.email && (
                        <a
                            href={`mailto:${broker.email}`}
                            className="flex items-center gap-2.5 text-[13px] transition-opacity hover:opacity-70"
                            style={{ color: '#2D3748', textDecoration: 'none' }}
                        >
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C8A44A' }} />
                            <span className="truncate">{broker.email}</span>
                        </a>
                    )}
                    {displayPhone && (
                        <a
                            href={`tel:${broker.phone}`}
                            aria-label={`Ligar para ${broker.name}`}
                            className="flex items-center gap-2.5 text-[13px] transition-opacity hover:opacity-70"
                            style={{ color: '#2D3748', textDecoration: 'none' }}
                        >
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#C8A44A' }} />
                            <span style={{ fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                                {displayPhone}
                            </span>
                        </a>
                    )}
                </div>

                {/* Action buttons */}
                <div className="space-y-2.5">
                    {whatsappUrl && (
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Conversar no WhatsApp com ${broker.name}`}
                            className="relative flex items-center justify-center gap-2 w-full h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.98]"
                            style={{
                                background: '#0B1928',
                                color: '#fff',
                                textDecoration: 'none',
                                fontFamily: "var(--fu, 'Outfit', sans-serif)",
                            }}
                        >
                            <MessageCircle className="w-4 h-4" />
                            Falar com {firstName}
                            <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.5 }} />
                        </a>
                    )}
                    {agendarUrl && (
                        <a
                            href={agendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-[#F8F6F2] active:scale-[0.98]"
                            style={{
                                background: '#FFFFFF',
                                color: '#0B1928',
                                border: '2px solid #0B1928',
                                textDecoration: 'none',
                                fontFamily: "var(--fu, 'Outfit', sans-serif)",
                            }}
                        >
                            <Calendar className="w-4 h-4" />
                            Agendar Visita
                        </a>
                    )}
                </div>
            </div>
        </div>
    )
}
