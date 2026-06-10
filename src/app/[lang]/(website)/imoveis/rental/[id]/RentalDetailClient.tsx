'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    Bed, Bath, Users, MapPin, Clock, ChevronLeft, ChevronRight,
    Wifi, Car, Waves, Dumbbell, Utensils, Wind, Tv, Coffee,
    ShieldCheck, ArrowLeft, MessageCircle, Phone, Calendar,
} from 'lucide-react'

const GOLD = '#C8A44A'
const NAVY = '#0B1928'

interface BookedRange { check_in: string; check_out: string }

interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    property: Record<string, any>
    bookedDates: BookedRange[]
    lang: string
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
    wifi: <Wifi size={15} />, parking: <Car size={15} />, pool: <Waves size={15} />,
    gym: <Dumbbell size={15} />, kitchen: <Utensils size={15} />, ac: <Wind size={15} />,
    tv: <Tv size={15} />, coffee: <Coffee size={15} />,
}

const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function MiniCalendar({ bookedDates, month, year }: { bookedDates: BookedRange[]; month: number; year: number }) {
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    const today = new Date()

    const isBooked = (day: number) => {
        const date = new Date(year, month, day)
        return bookedDates.some(b => {
            const ci = new Date(b.check_in + 'T00:00:00')
            const co = new Date(b.check_out + 'T00:00:00')
            return date >= ci && date < co
        })
    }
    const isToday = (day: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
    const isPast = (day: number) => { const d = new Date(year, month, day, 23, 59, 59); return d < today }

    return (
        <div>
            <div className="grid grid-cols-7 gap-1 mb-2">
                {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: '#948F84' }}>{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1; const booked = isBooked(day); const past = isPast(day)
                    return (
                        <div key={day} className="text-center text-xs py-1.5 rounded-md" style={{
                            background: booked ? 'rgba(220,38,38,0.1)' : isToday(day) ? 'rgba(200,164,74,0.15)' : 'transparent',
                            color: past ? '#C5C1BA' : booked ? '#DC2626' : isToday(day) ? GOLD : '#2D3748',
                            fontWeight: isToday(day) ? 700 : 400,
                            textDecoration: booked ? 'line-through' : 'none',
                        }}>{day}</div>
                    )
                })}
            </div>
        </div>
    )
}

export default function RentalDetailClient({ property, bookedDates, lang }: Props) {
    const p = property
    const photos = (p.photos as string[]) || []
    const amenities = (p.amenities as string[]) || []
    const [photoIdx, setPhotoIdx] = useState(0)
    const [calMonth, setCalMonth] = useState(new Date().getMonth())
    const [calYear, setCalYear] = useState(new Date().getFullYear())

    const whatsappMsg = encodeURIComponent(`Olá! Tenho interesse no imóvel "${p.name as string}" para locação. Poderia me passar mais informações?`)
    const whatsappUrl = `https://wa.me/5581986141487?text=${whatsappMsg}`

    function nextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }
    function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }

    return (
        <div className="min-h-screen" style={{ background: '#F7F5F2' }}>
            {/* Back navigation */}
            <div className="container-custom pt-4 pb-2">
                <Link
                    href={`/${lang}/imoveis`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors hover:opacity-70"
                    style={{ color: '#948F84', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                >
                    <ArrowLeft size={14} />
                    Voltar para imóveis
                </Link>
            </div>

            {/* Photo gallery */}
            <div className="container-custom mt-2">
                {photos.length > 0 ? (
                    <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden shadow-lg" style={{ background: NAVY }}>
                        <Image
                            src={photos[photoIdx]}
                            alt={`${p.name as string} - foto ${photoIdx + 1}`}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 1200px"
                        />
                        {/* Gradient overlay */}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,25,40,0.6) 0%, transparent 50%)' }} />

                        {photos.length > 1 && (
                            <>
                                <button
                                    onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                                    style={{ background: 'rgba(11,25,40,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(200,164,74,0.15)' }}
                                    aria-label="Foto anterior"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={() => setPhotoIdx(i => (i + 1) % photos.length)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110"
                                    style={{ background: 'rgba(11,25,40,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(200,164,74,0.15)' }}
                                    aria-label="Próxima foto"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <div
                                    className="absolute bottom-3 right-3 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                    style={{ background: 'rgba(11,25,40,0.7)', backdropFilter: 'blur(8px)', color: '#E8E4DC', fontFamily: "var(--fm, 'JetBrains Mono', monospace)", border: '1px solid rgba(200,164,74,0.15)' }}
                                >
                                    {photoIdx + 1} / {photos.length}
                                </div>
                            </>
                        )}

                        {/* Photo dots */}
                        {photos.length > 1 && photos.length <= 12 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                {photos.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPhotoIdx(i)}
                                        className="rounded-full transition-all duration-200"
                                        style={{
                                            width: i === photoIdx ? 20 : 6,
                                            height: 6,
                                            background: i === photoIdx ? GOLD : 'rgba(255,255,255,0.5)',
                                        }}
                                        aria-label={`Ir para foto ${i + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="aspect-[16/9] md:aspect-[21/9] rounded-2xl flex items-center justify-center" style={{ background: NAVY }}>
                        <MapPin size={64} style={{ color: 'rgba(200,164,74,0.3)' }} />
                    </div>
                )}
            </div>

            {/* Content grid */}
            <div className="container-custom py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left column — details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title block */}
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-1 h-6 rounded-full" style={{ background: GOLD }} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                Locação
                            </span>
                        </div>
                        <h1
                            className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-2"
                            style={{ fontFamily: "var(--font-heading, 'Playfair Display', serif)", color: NAVY }}
                        >
                            {p.name as string}
                        </h1>
                        {p.address && (
                            <p className="flex items-center gap-1.5 text-sm" style={{ color: '#948F84' }}>
                                <MapPin size={13} style={{ color: GOLD, opacity: 0.7 }} />
                                {p.address as string}
                            </p>
                        )}
                    </div>

                    {/* Specs pills */}
                    <div className="flex flex-wrap gap-2.5">
                        {[
                            { icon: <Bed size={14} />, value: p.bedrooms, label: 'Quartos' },
                            { icon: <Bath size={14} />, value: p.bathrooms, label: 'Banheiros' },
                            { icon: <Users size={14} />, value: p.max_guests, label: 'Hóspedes' },
                        ].filter(s => s.value != null).map(s => (
                            <div
                                key={s.label}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                                style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                            >
                                <span style={{ color: GOLD }}>{s.icon}</span>
                                <span className="text-sm font-semibold" style={{ color: NAVY }}>
                                    {s.value as number} {s.label}
                                </span>
                            </div>
                        ))}
                        {p.check_in_time && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)' }}>
                                <Clock size={14} style={{ color: GOLD }} />
                                <span className="text-sm" style={{ color: NAVY }}>Check-in {p.check_in_time as string}</span>
                            </div>
                        )}
                        {p.check_out_time && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)' }}>
                                <Clock size={14} style={{ color: GOLD }} />
                                <span className="text-sm" style={{ color: NAVY }}>Check-out {p.check_out_time as string}</span>
                            </div>
                        )}
                    </div>

                    {/* Amenities */}
                    {amenities.length > 0 && (
                        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-6 h-[2px] rounded-full" style={{ background: '#B8B3A8' }} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Comodidades</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {amenities.map(a => (
                                    <div key={a} className="flex items-center gap-2 text-sm" style={{ color: '#2D3748' }}>
                                        <span style={{ color: GOLD }}>{AMENITY_ICONS[a.toLowerCase()] || <ShieldCheck size={15} />}</span>
                                        {a}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* House rules */}
                    {p.rules && (
                        <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-6 h-[2px] rounded-full" style={{ background: '#B8B3A8' }} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Regras da Casa</span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#4A4539' }}>{p.rules as string}</p>
                        </div>
                    )}

                    {/* Availability calendar */}
                    <div className="rounded-2xl p-5" style={{ background: '#FFFFFF', border: '1px solid rgba(184,179,168,0.3)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <Calendar size={16} style={{ color: GOLD }} />
                                <span className="text-[10px] font-bold uppercase tracking-[0.25em]" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>Disponibilidade</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={prevMonth}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                                    style={{ color: NAVY }}
                                    aria-label="Mês anterior"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-sm font-semibold min-w-[130px] text-center" style={{ color: NAVY, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                    {MONTH_NAMES[calMonth]} {calYear}
                                </span>
                                <button
                                    onClick={nextMonth}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-gray-100"
                                    style={{ color: NAVY }}
                                    aria-label="Próximo mês"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                        <MiniCalendar bookedDates={bookedDates} month={calMonth} year={calYear} />
                        <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: '1px solid rgba(184,179,168,0.2)' }}>
                            <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: '#948F84' }}>
                                <span className="w-3 h-3 rounded" style={{ background: 'rgba(200,164,74,0.2)', border: `1px solid ${GOLD}` }} />
                                Hoje
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: '#948F84' }}>
                                <span className="w-3 h-3 rounded" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }} />
                                Reservado
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right column — pricing card */}
                <div>
                    <div className="rounded-2xl overflow-hidden sticky top-24" style={{ background: NAVY, boxShadow: '0 8px 32px rgba(11,25,40,0.25)' }}>
                        {/* Price header */}
                        <div className="p-6" style={{ borderBottom: '1px solid rgba(200,164,74,0.12)' }}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1" style={{ color: '#627D98', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>A partir de</p>
                            {(p.daily_rate as number | null) != null && (
                                <div className="flex items-baseline gap-1.5 mb-1">
                                    <span className="text-3xl font-bold" style={{ color: GOLD, fontFamily: "var(--fm, 'JetBrains Mono', monospace)" }}>
                                        {fmtCurrency(p.daily_rate as number)}
                                    </span>
                                    <span className="text-sm" style={{ color: '#627D98' }}>/dia</span>
                                </div>
                            )}
                            {(p.monthly_rate as number | null) != null && (
                                <p className="text-sm" style={{ color: '#627D98' }}>
                                    ou {fmtCurrency(p.monthly_rate as number)}/mês
                                </p>
                            )}
                            {(p.cleaning_fee as number | null) != null && (p.cleaning_fee as number) > 0 && (
                                <p className="text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                    + Taxa de limpeza: {fmtCurrency(p.cleaning_fee as number)}
                                </p>
                            )}
                        </div>

                        {/* CTA buttons */}
                        <div className="p-5 space-y-2.5">
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative w-full flex items-center justify-center gap-2 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.98]"
                                style={{ background: '#FFFFFF', color: NAVY, textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                            >
                                <MessageCircle size={16} />
                                Reservar via WhatsApp
                                <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, opacity: 0.6 }} />
                            </a>

                            <a
                                href="tel:+5581986141487"
                                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 hover:bg-white/5 active:scale-[0.98]"
                                style={{ background: 'transparent', border: `2px solid rgba(200,164,74,0.35)`, color: GOLD, textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                            >
                                <Phone size={14} />
                                Ligar agora
                            </a>

                            <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                Resposta rápida em horário comercial
                            </p>
                        </div>

                        {/* Trust badge */}
                        <div className="px-5 pb-5">
                            <div className="flex items-center justify-center gap-2 py-2.5 rounded-lg" style={{ background: 'rgba(200,164,74,0.06)', border: '1px solid rgba(200,164,74,0.12)' }}>
                                <ShieldCheck size={13} style={{ color: GOLD }} />
                                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#627D98', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                    Imóvel Verificado IMI
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile sticky CTA */}
            <div
                className="fixed left-0 right-0 z-[140] lg:hidden"
                style={{
                    bottom: 'env(safe-area-inset-bottom, 0px)',
                    background: '#FFFFFF',
                    borderTop: '1px solid rgba(184,179,168,0.3)',
                    padding: '12px 16px',
                    boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
                }}
            >
                <div className="flex items-center gap-3 max-w-lg mx-auto">
                    {(p.daily_rate as number | null) != null && (
                        <div className="flex-1 min-w-0">
                            <p style={{ fontSize: 10, color: '#948F84', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "var(--fu, 'Outfit', sans-serif)", margin: 0 }}>A partir de</p>
                            <p style={{ fontSize: 18, fontWeight: 700, color: NAVY, fontFamily: "var(--fm, 'JetBrains Mono', monospace)", margin: 0 }}>
                                {fmtCurrency(p.daily_rate as number)}/dia
                            </p>
                        </div>
                    )}
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative flex items-center justify-center gap-2 h-12 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.98]"
                        style={{ background: NAVY, color: '#FFFFFF', textDecoration: 'none', fontFamily: "var(--fu, 'Outfit', sans-serif)", whiteSpace: 'nowrap' }}
                    >
                        <MessageCircle size={14} />
                        Reservar
                        <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.5 }} />
                    </a>
                </div>
            </div>
        </div>
    )
}
