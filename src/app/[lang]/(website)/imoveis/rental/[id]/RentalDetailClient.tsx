'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
    Bed, Bath, Users, MapPin, Clock, ChevronLeft, ChevronRight,
    Wifi, Car, Waves, Dumbbell, Utensils, Wind, Tv, Coffee,
    ShieldCheck, ArrowLeft, MessageCircle, Phone,
} from 'lucide-react'

interface BookedRange { check_in: string; check_out: string }

interface Props {
    property: Record<string, unknown>
    bookedDates: BookedRange[]
    lang: string
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
    wifi: <Wifi size={16} />, parking: <Car size={16} />, pool: <Waves size={16} />,
    gym: <Dumbbell size={16} />, kitchen: <Utensils size={16} />, ac: <Wind size={16} />,
    tv: <Tv size={16} />, coffee: <Coffee size={16} />,
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
                {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }, (_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1; const booked = isBooked(day); const past = isPast(day)
                    return (
                        <div key={day} className="text-center text-xs py-1.5 rounded" style={{
                            background: booked ? '#fee2e2' : isToday(day) ? '#C8A44A22' : 'transparent',
                            color: past ? '#ccc' : booked ? '#dc2626' : '#333',
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
    const whatsappUrl = `https://wa.me/5547999999999?text=${whatsappMsg}`

    function nextMonth() { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }
    function prevMonth() { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 pt-4">
                <Link href={`/${lang}/imoveis`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
                    <ArrowLeft size={14} /> Voltar para imóveis
                </Link>
            </div>

            {/* Gallery */}
            <div className="max-w-6xl mx-auto px-4 mt-4">
                {photos.length > 0 ? (
                    <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-xl overflow-hidden bg-gray-200">
                        <Image src={photos[photoIdx]} alt={`${p.name} - foto ${photoIdx + 1}`} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 1200px" />
                        {photos.length > 1 && (
                            <>
                                <button onClick={() => setPhotoIdx(i => (i - 1 + photos.length) % photos.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"><ChevronLeft size={20} /></button>
                                <button onClick={() => setPhotoIdx(i => (i + 1) % photos.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"><ChevronRight size={20} /></button>
                                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1 rounded-md">{photoIdx + 1} / {photos.length}</div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="aspect-[16/9] md:aspect-[21/9] rounded-xl bg-gray-200 flex items-center justify-center text-gray-400"><MapPin size={64} /></div>
                )}
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: "var(--font-heading, 'Playfair Display', serif)" }}>
                            {p.name as string}
                        </h1>
                        {p.address && <p className="text-gray-500 mt-1 flex items-center gap-1.5"><MapPin size={14} /> {p.address as string}</p>}
                    </div>

                    <div className="flex flex-wrap gap-4">
                        {[
                            { icon: <Bed size={16} />, value: p.bedrooms, label: 'Quartos' },
                            { icon: <Bath size={16} />, value: p.bathrooms, label: 'Banheiros' },
                            { icon: <Users size={16} />, value: p.max_guests, label: 'Hóspedes' },
                        ].filter(s => s.value != null).map(s => (
                            <div key={s.label} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200">
                                <span className="text-[#C8A44A]">{s.icon}</span>
                                <span className="text-sm font-semibold text-gray-800">{s.value as number} {s.label}</span>
                            </div>
                        ))}
                        {p.check_in_time && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200">
                                <Clock size={16} className="text-[#C8A44A]" />
                                <span className="text-sm text-gray-800">Check-in {p.check_in_time as string}</span>
                            </div>
                        )}
                        {p.check_out_time && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-200">
                                <Clock size={16} className="text-[#C8A44A]" />
                                <span className="text-sm text-gray-800">Check-out {p.check_out_time as string}</span>
                            </div>
                        )}
                    </div>

                    {amenities.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h2 className="text-base font-bold text-gray-900 mb-3">Comodidades</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {amenities.map(a => (
                                    <div key={a} className="flex items-center gap-2 text-sm text-gray-700">
                                        <span className="text-[#C8A44A]">{AMENITY_ICONS[a.toLowerCase()] || <ShieldCheck size={16} />}</span>
                                        {a}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {p.rules && (
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <h2 className="text-base font-bold text-gray-900 mb-3">Regras da Casa</h2>
                            <p className="text-sm text-gray-600 whitespace-pre-line">{p.rules as string}</p>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-gray-900">Disponibilidade</h2>
                            <div className="flex items-center gap-3">
                                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronLeft size={18} /></button>
                                <span className="text-sm font-semibold min-w-[140px] text-center">{MONTH_NAMES[calMonth]} {calYear}</span>
                                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded"><ChevronRight size={18} /></button>
                            </div>
                        </div>
                        <MiniCalendar bookedDates={bookedDates} month={calMonth} year={calYear} />
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-300" /> Disponível</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Reservado</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-xl p-6 sticky top-24" style={{ background: '#0B1928', color: '#fff' }}>
                        {(p.daily_rate as number | null) != null && (
                            <div className="mb-2">
                                <span className="text-2xl font-bold" style={{ color: '#C8A44A' }}>{fmtCurrency(p.daily_rate as number)}</span>
                                <span className="text-sm opacity-70">/dia</span>
                            </div>
                        )}
                        {(p.monthly_rate as number | null) != null && (
                            <div className="mb-2 text-sm opacity-80">ou {fmtCurrency(p.monthly_rate as number)}/mês</div>
                        )}
                        {(p.cleaning_fee as number | null) != null && (p.cleaning_fee as number) > 0 && (
                            <div className="text-xs opacity-60 mb-4">+ Taxa de limpeza: {fmtCurrency(p.cleaning_fee as number)}</div>
                        )}
                        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm transition-all hover:opacity-90"
                            style={{ background: '#25D366', color: '#fff' }}>
                            <MessageCircle size={18} /> Reservar via WhatsApp
                        </a>
                        <a href="tel:+554799999999"
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-sm mt-2 transition-all hover:opacity-80"
                            style={{ background: 'transparent', border: '1px solid rgba(200,164,74,0.4)', color: '#C8A44A' }}>
                            <Phone size={16} /> Ligar agora
                        </a>
                        <p className="text-xs text-center opacity-50 mt-3">Resposta rápida em horário comercial</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
