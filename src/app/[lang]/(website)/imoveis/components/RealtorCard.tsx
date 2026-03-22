'use client'

import Image from 'next/image'

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
        <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
            {/* Header */}
            <div className="bg-[#102A43] px-5 py-3">
                <p className="text-[10px] font-bold text-[#3D6FFF] tracking-[0.15em] uppercase">
                    Corretor Responsável
                </p>
            </div>

            <div className="p-5">
                {/* Avatar + Info */}
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 mb-4">
                    <div className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden flex-shrink-0 bg-[#102A43]/5 flex items-center justify-center border border-gray-100">
                        {broker.avatar_url ? (
                            <Image
                                src={broker.avatar_url}
                                alt={broker.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <span className="text-lg font-bold text-[#102A43]/60">
                                {initials}
                            </span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-base font-bold text-[#102A43] truncate">
                            {broker.name}
                        </h4>
                        {broker.creci && (
                            <p className="text-xs text-gray-500 font-mono mt-0.5">
                                CRECI {broker.creci}
                            </p>
                        )}
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">
                            Consultor Imobiliário
                        </p>
                    </div>
                </div>

                {/* Contact info */}
                <div className="space-y-2 mb-4">
                    {broker.email && (
                        <a
                            href={`mailto:${broker.email}`}
                            className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-[#102A43] transition-colors"
                        >
                            <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                            <span className="truncate">{broker.email}</span>
                        </a>
                    )}
                    {broker.phone && (
                        <a
                            href={`tel:${broker.phone}`}
                            className="flex items-center gap-2.5 text-sm text-gray-600 hover:text-[#102A43] transition-colors"
                        >
                            <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                            </svg>
                            <span>{broker.phone}</span>
                        </a>
                    )}
                </div>

                {/* WhatsApp CTA */}
                {whatsappUrl && (
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-[#102A43] text-white text-sm font-semibold hover:bg-[#0D2137] transition-colors"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Falar com {broker.name.split(' ')[0]}
                    </a>
                )}

                {/* Agendar Visita */}
                {broker.phone && (
                    <a
                        href={`https://wa.me/${broker.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá! Gostaria de agendar uma visita ao ${propertyName}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full mt-3 flex items-center justify-center gap-2 h-11 rounded-xl bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        Agendar Visita
                    </a>
                )}
            </div>
        </div>
    )
}
