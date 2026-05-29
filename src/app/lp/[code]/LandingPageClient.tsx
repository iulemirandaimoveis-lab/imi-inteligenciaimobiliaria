'use client'

import { useState, useRef, useEffect, type CSSProperties, type ReactNode, type ElementType } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
    MapPin, BedDouble, Maximize2, Building2, Phone,
    CheckCircle2, Loader2, ChevronRight,
    TrendingUp, Home, Car, ShoppingBag, GraduationCap,
    Hospital, ChevronDown, Star,
    Shield, Zap, Award, BarChart2,
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip
} from 'recharts'
import { toast } from 'sonner'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Development {
    id: string
    name: string
    slug: string
    type?: string
    description?: string
    city?: string
    state?: string
    neighborhood?: string
    min_price?: number
    max_price?: number
    bedrooms_options?: number[]
    status?: string
    cover_image_url?: string
    gallery_images?: string[]
    developer?: { name?: string; logo_url?: string }
    total_units?: number
    available_units?: number
    area_from?: number
    area_to?: number
    latitude?: number
    longitude?: number
}

interface Props {
    development: Development
    code: string
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatPrice(v?: number): string {
    if (!v) return '—'
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    return `R$ ${(v / 1_000).toFixed(0)}k`
}

function formatPriceFull(v: number): string {
    return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
}

function getTemplate(dev: Development): 'luxury' | 'standard' | 'budget' {
    const price = dev.min_price || dev.max_price || 0
    if (price >= 1_000_000) return 'luxury'
    if (price >= 400_000) return 'standard'
    return 'budget'
}

function getAccent(template: 'luxury' | 'standard' | 'budget') {
    if (template === 'luxury') return { color: '#c9a84c', dimmed: '#c9a84c44', light: '#c9a84c22' }
    if (template === 'standard') return { color: '#3b82f6', dimmed: '#3b82f644', light: '#3b82f622' }
    return { color: '#22c55e', dimmed: '#22c55e44', light: '#22c55e22' }
}

// Valorization data generator
function buildValorizationData(basePrice: number) {
    const rates = [0.082, 0.094, 0.107, 0.115, 0.098, 0.124]
    const years = ['2020', '2021', '2022', '2023', '2024', '2025']
    let v = basePrice * 0.6
    return years.map((year, i) => {
        v = v * (1 + rates[i])
        return { year, valor: Math.round(v / 1000) * 1000, rate: `+${(rates[i] * 100).toFixed(1)}%` }
    })
}

// ─────────────────────────────────────────────
// Animated counter
// ─────────────────────────────────────────────

function AnimatedCounter({ to, prefix = '', suffix = '', duration = 1600 }: {
    to: number; prefix?: string; suffix?: string; duration?: number
}) {
    const [count, setCount] = useState(0)
    const started = useRef(false)
    useEffect(() => {
        if (started.current) return
        started.current = true
        const start = Date.now()
        const tick = () => {
            const elapsed = Date.now() - start
            const progress = Math.min(elapsed / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(to * ease))
            if (progress < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
    }, [to, duration])
    return <>{prefix}{count.toLocaleString('pt-BR')}{suffix}</>
}

// ─────────────────────────────────────────────
// Section fade-in wrapper
// ─────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = '' }: {
    children: ReactNode; delay?: number; className?: string
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    )
}

// ─────────────────────────────────────────────
// Payment Simulator
// ─────────────────────────────────────────────

function PaymentSimulator({ totalPrice, accent }: { totalPrice: number; accent: ReturnType<typeof getAccent> }) {
    const [entradaPct, setEntradaPct] = useState(20)
    const [months, setMonths] = useState(36)

    const entrada = Math.round(totalPrice * entradaPct / 100)
    const remaining = totalPrice - entrada
    const parcelasMensais = Math.round(remaining * 0.55 / months)
    const reforcoAnual = Math.round(remaining * 0.25 / 3)
    const chaves = totalPrice - entrada - (parcelasMensais * months) - (reforcoAnual * 3)

    const segments = [
        { label: 'Entrada', value: entrada, pct: entradaPct, color: accent.color },
        { label: 'Parcelas', value: parcelasMensais * months, pct: 55, color: `${accent.color}aa` },
        { label: 'Reforços', value: reforcoAnual * 3, pct: 25, color: `${accent.color}66` },
        { label: 'Chaves', value: Math.max(chaves, 0), pct: Math.max(100 - entradaPct - 55 - 25, 0), color: '#333' },
    ]

    return (
        <div style={{ padding: '28px', background: '#111', border: `1px solid ${accent.dimmed}`, borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <BarChart2 size={18} style={{ color: accent.color }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Simulador de Pagamento</h3>
            </div>

            {/* Progress bar */}
            <div style={{ height: '8px', borderRadius: '4px', overflow: 'hidden', background: '#222', marginBottom: '16px', display: 'flex' }}>
                {segments.map((s) => (
                    <motion.div
                        key={s.label}
                        animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        style={{ height: '100%', background: s.color }}
                    />
                ))}
            </div>

            {/* Segments legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                {segments.map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: s.color, flexShrink: 0 }} />
                        <div>
                            <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                            <div style={{ fontSize: '13px', fontWeight: 700 }}>{formatPriceFull(Math.max(s.value, 0))}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Slider */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>Entrada</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: accent.color }}>{entradaPct}% — {formatPriceFull(entrada)}</span>
                </div>
                <input
                    type="range" min={10} max={40} value={entradaPct}
                    onChange={e => setEntradaPct(Number(e.target.value))}
                    style={{ width: '100%', accentColor: accent.color, height: '4px', cursor: 'pointer' }}
                />
            </div>

            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888' }}>Prazo de parcelas</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: accent.color }}>{months} meses — {formatPriceFull(parcelasMensais)}/mês</span>
                </div>
                <input
                    type="range" min={12} max={60} step={12} value={months}
                    onChange={e => setMonths(Number(e.target.value))}
                    style={{ width: '100%', accentColor: accent.color, height: '4px', cursor: 'pointer' }}
                />
            </div>

            <div style={{
                marginTop: '20px', padding: '14px', borderRadius: '12px',
                background: accent.light, border: `1px solid ${accent.dimmed}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
                <span style={{ fontSize: '12px', color: '#aaa' }}>Total do imóvel</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: accent.color }}>{formatPriceFull(totalPrice)}</span>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Valorization Chart
// ─────────────────────────────────────────────

function ValorizationSection({ basePrice, accent }: { basePrice: number; accent: ReturnType<typeof getAccent> }) {
    const data = buildValorizationData(basePrice)
    const gain = data[data.length - 1].valor - data[0].valor
    const gainPct = ((gain / data[0].valor) * 100).toFixed(0)

    return (
        <div style={{ padding: '28px', background: '#111', border: `1px solid ${accent.dimmed}`, borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} style={{ color: accent.color }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Histórico de Valorização</h3>
                </div>
                <div style={{
                    background: accent.light, border: `1px solid ${accent.dimmed}`,
                    borderRadius: '20px', padding: '4px 12px',
                    fontSize: '12px', fontWeight: 700, color: accent.color,
                }}>
                    +{gainPct}% em 5 anos
                </div>
            </div>
            <p style={{ fontSize: '12px', color: '#555', marginBottom: '20px' }}>
                Valorização estimada da região nos últimos 5 anos
            </p>

            <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="valGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={accent.color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={accent.color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: `1px solid ${accent.dimmed}`, borderRadius: '8px', fontSize: '12px' }}
                        formatter={(v) => [formatPriceFull(Number(v)), 'Valor estimado']}
                        labelStyle={{ color: '#aaa' }}
                    />
                    <Area
                        type="monotone" dataKey="valor"
                        stroke={accent.color} strokeWidth={2}
                        fill="url(#valGradient)"
                        dot={{ fill: accent.color, strokeWidth: 0, r: 3 }}
                        activeDot={{ r: 5, fill: accent.color }}
                    />
                </AreaChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                {[
                    { icon: Shield, label: 'Ativo real', desc: 'Patrimônio físico' },
                    { icon: TrendingUp, label: 'Valorização', desc: 'Média anual 10%+' },
                    { icon: Zap, label: 'Liquidez', desc: 'Mercado ativo' },
                ].map(({ icon: Icon, label, desc }) => (
                    <div key={label} style={{
                        flex: 1, padding: '12px', background: '#0d0d0d',
                        borderRadius: '10px', border: '1px solid #1e1e1e',
                        textAlign: 'center',
                    }}>
                        <Icon size={16} style={{ color: accent.color, margin: '0 auto 6px', display: 'block' }} />
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#ddd' }}>{label}</div>
                        <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>{desc}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Gallery
// ─────────────────────────────────────────────

function GallerySection({ images, accent }: { images: string[]; accent: ReturnType<typeof getAccent> }) {
    const [selected, setSelected] = useState<string | null>(null)

    if (!images.length) return null

    const grid = images.slice(0, 5)

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', borderRadius: '16px', overflow: 'hidden' }}>
                {grid.map((src, i) => (
                    <motion.div
                        key={src}
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => setSelected(src)}
                        style={{
                            gridColumn: i === 0 ? 'span 2' : undefined,
                            aspectRatio: i === 0 ? '16/9' : '4/3',
                            overflow: 'hidden', cursor: 'pointer', position: 'relative',
                            background: '#1a1a1a',
                        }}
                    >
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        {i === 4 && images.length > 5 && (
                            <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px', fontWeight: 700, color: '#fff',
                            }}>
                                +{images.length - 5} fotos
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelected(null)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.92)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: '20px',
                        }}
                    >
                        <motion.img
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            src={selected} alt=""
                            style={{ maxWidth: '100%', maxHeight: '90dvh', objectFit: 'contain', borderRadius: '12px' }}
                            onClick={e => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─────────────────────────────────────────────
// Location Points
// ─────────────────────────────────────────────

const POI_CATEGORIES = [
    { icon: ShoppingBag, label: 'Shopping & Comércio', items: ['Shopping Center', 'Supermercados', 'Restaurantes'] },
    { icon: GraduationCap, label: 'Educação', items: ['Escolas privadas', 'Faculdades', 'Cursos'] },
    { icon: Hospital, label: 'Saúde', items: ['Clínicas', 'Farmácias', 'Hospitais'] },
    { icon: Car, label: 'Mobilidade', items: ['Acesso rápido', 'Via principal', 'Transporte'] },
]

function LocationSection({ dev, accent }: { dev: Development; accent: ReturnType<typeof getAccent> }) {
    return (
        <div style={{ padding: '28px', background: '#111', border: `1px solid ${accent.dimmed}`, borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <MapPin size={18} style={{ color: accent.color }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Localização Privilegiada</h3>
            </div>

            {/* Map placeholder */}
            <div style={{
                borderRadius: '12px', overflow: 'hidden', marginBottom: '20px',
                height: '140px', background: '#0d0d0d', border: '1px solid #1e1e1e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
            }}>
                {/* Grid lines */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}>
                    {[0.25, 0.5, 0.75].map(p => (
                        <g key={p}>
                            <line x1={`${p * 100}%`} y1="0" x2={`${p * 100}%`} y2="100%" stroke={accent.color} strokeWidth="0.5" />
                            <line x1="0" y1={`${p * 100}%`} x2="100%" y2={`${p * 100}%`} stroke={accent.color} strokeWidth="0.5" />
                        </g>
                    ))}
                </svg>
                {/* Center pin */}
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    >
                        <MapPin size={28} style={{ color: accent.color }} />
                    </motion.div>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', color: '#ccc' }}>
                        {[dev.neighborhood, dev.city, dev.state].filter(Boolean).join(', ')}
                    </div>
                </div>
            </div>

            {/* POI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {POI_CATEGORIES.map(({ icon: Icon, label, items }) => (
                    <div key={label} style={{
                        padding: '12px', background: '#0d0d0d',
                        borderRadius: '10px', border: '1px solid #1e1e1e',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                            <Icon size={14} style={{ color: accent.color }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ccc' }}>{label}</span>
                        </div>
                        {items.map(item => (
                            <div key={item} style={{ fontSize: '11px', color: '#555', marginBottom: '2px', paddingLeft: '20px' }}>
                                • {item}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Lead qualification form (multi-step)
// ─────────────────────────────────────────────

const FINANCING_OPTIONS = [
    { value: 'approved', label: 'Financiamento aprovado', icon: CheckCircle2 },
    { value: 'cash', label: 'Vou pagar à vista', icon: Zap },
    { value: 'unknown', label: 'Ainda não sei', icon: Home },
]

const TIMELINE_OPTIONS = [
    { value: '30d', label: 'Nos próximos 30 dias' },
    { value: '3-6m', label: 'Em 3 a 6 meses' },
    { value: '6-12m', label: 'Em 6 a 12 meses' },
    { value: 'researching', label: 'Ainda estou pesquisando' },
]

function LeadForm({ dev, code, accent }: { dev: Development; code: string; accent: ReturnType<typeof getAccent> }) {
    const [step, setStep] = useState(0)
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [financing, setFinancing] = useState('')
    const [timeline, setTimeline] = useState('')
    const [lgpd, setLgpd] = useState(false)
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const inputStyle: CSSProperties = {
        height: '46px', padding: '0 14px', borderRadius: '10px',
        background: '#1a1a1a', border: '1px solid #2a2a2a',
        color: '#fff', fontSize: '14px', outline: 'none',
        width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s',
    }

    async function handleSubmit() {
        if (!lgpd) { toast.error('Aceite a política de privacidade para continuar.'); return }
        setLoading(true)
        try {
            const res = await fetch('/api/leads/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: phone.trim(),
                    email: email.trim() || undefined,
                    interest: dev.type || 'empreendimento',
                    development_id: dev.id,
                    attribution: {
                        source: 'landing_page',
                        medium: 'lp',
                        campaign: code,
                        shortCode: code,
                        financing_status: financing,
                        purchase_timeline: timeline,
                    },
                }),
            })
            if (res.ok) {
                setSubmitted(true)
            } else {
                toast.error('Erro ao enviar. Tente novamente.')
            }
        } catch {
            toast.error('Erro de conexão.')
        } finally {
            setLoading(false)
        }
    }

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '40px 20px' }}
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                    <CheckCircle2 size={52} style={{ color: '#4ade80', margin: '0 auto 16px', display: 'block' }} />
                </motion.div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '10px' }}>Recebemos seu contato!</h3>
                <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.7 }}>
                    Um especialista vai entrar em contato em breve para apresentar o <strong style={{ color: '#ddd' }}>{dev.name}</strong>.
                </p>
                <div style={{ marginTop: '24px', fontSize: '12px', color: '#555' }}>
                    Aguarde nosso WhatsApp em <strong style={{ color: '#aaa' }}>{phone}</strong>
                </div>
            </motion.div>
        )
    }

    return (
        <div>
            {/* Step indicator */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        animate={{ background: i <= step ? accent.color : '#222', flex: i === step ? 2 : 1 }}
                        transition={{ duration: 0.3 }}
                        style={{ height: '3px', borderRadius: '2px', background: i <= step ? accent.color : '#222' }}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div
                        key="step0"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                            Tenho interesse neste imóvel
                        </h2>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                            Deixe seu contato e um especialista falará com você.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input
                                placeholder="Seu nome *"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                style={inputStyle}
                            />
                            <input
                                placeholder="WhatsApp / Telefone *"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                type="tel"
                                style={inputStyle}
                            />
                            <input
                                placeholder="E-mail (opcional)"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                type="email"
                                style={inputStyle}
                            />
                            <motion.button
                                whileHover={{ opacity: 0.9 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (!name.trim() || !phone.trim()) { toast.error('Preencha nome e telefone'); return }
                                    setStep(1)
                                }}
                                style={{
                                    height: '50px', borderRadius: '12px',
                                    background: accent.color,
                                    color: '#000',
                                    fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}
                            >
                                Continuar <ChevronRight size={16} />
                            </motion.button>
                        </div>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                            Como você planeja pagar?
                        </h2>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                            Isso ajuda o especialista a preparar a melhor proposta para você.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {FINANCING_OPTIONS.map(({ value, label, icon: Icon }) => (
                                <motion.button
                                    key={value}
                                    whileHover={{ borderColor: accent.color }}
                                    onClick={() => setFinancing(value)}
                                    style={{
                                        padding: '14px 16px', borderRadius: '12px',
                                        background: financing === value ? accent.light : '#1a1a1a',
                                        border: `1px solid ${financing === value ? accent.color : '#2a2a2a'}`,
                                        color: '#fff', cursor: 'pointer', textAlign: 'left',
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        fontSize: '14px', fontWeight: financing === value ? 700 : 400,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <Icon size={16} style={{ color: financing === value ? accent.color : '#555', flexShrink: 0 }} />
                                    {label}
                                </motion.button>
                            ))}
                        </div>
                        <motion.button
                            whileHover={{ opacity: 0.9 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { if (financing) setStep(2) }}
                            disabled={!financing}
                            style={{
                                height: '50px', borderRadius: '12px', width: '100%',
                                background: financing ? accent.color : '#222',
                                color: financing ? '#000' : '#555',
                                fontSize: '15px', fontWeight: 700, border: 'none',
                                cursor: financing ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s',
                            }}
                        >
                            Continuar <ChevronRight size={16} />
                        </motion.button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                            Quando pretende comprar?
                        </h2>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                            Sua resposta é privada e nos ajuda a priorizar seu atendimento.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            {TIMELINE_OPTIONS.map(({ value, label }) => (
                                <motion.button
                                    key={value}
                                    whileHover={{ borderColor: accent.color }}
                                    onClick={() => setTimeline(value)}
                                    style={{
                                        padding: '12px 16px', borderRadius: '12px',
                                        background: timeline === value ? accent.light : '#1a1a1a',
                                        border: `1px solid ${timeline === value ? accent.color : '#2a2a2a'}`,
                                        color: '#fff', cursor: 'pointer', textAlign: 'left',
                                        fontSize: '14px', fontWeight: timeline === value ? 700 : 400,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {label}
                                </motion.button>
                            ))}
                        </div>
                        {/* LGPD */}
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '16px', cursor: 'pointer' }}>
                            <div
                                onClick={() => setLgpd(!lgpd)}
                                style={{
                                    width: '18px', height: '18px', borderRadius: '4px', flexShrink: 0, marginTop: '1px',
                                    background: lgpd ? accent.color : '#1a1a1a',
                                    border: `1px solid ${lgpd ? accent.color : '#333'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {lgpd && <CheckCircle2 size={12} style={{ color: '#000' }} />}
                            </div>
                            <span style={{ fontSize: '11px', color: '#666', lineHeight: 1.5 }}>
                                Aceito que meus dados sejam usados para entrar em contato sobre este empreendimento,
                                conforme a <span style={{ color: accent.color }}>Política de Privacidade</span> (LGPD).
                            </span>
                        </label>
                        <motion.button
                            whileHover={{ opacity: 0.9 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={loading || !timeline}
                            style={{
                                height: '50px', borderRadius: '12px', width: '100%',
                                background: timeline && lgpd ? accent.color : '#222',
                                color: timeline && lgpd ? '#000' : '#555',
                                fontSize: '15px', fontWeight: 700, border: 'none',
                                cursor: timeline && lgpd ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                transition: 'all 0.2s',
                            }}
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <><Phone size={16} /> Quero ser contactado</>
                            )}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

// ─────────────────────────────────────────────
// Trust badges
// ─────────────────────────────────────────────

function TrustBar({ accent }: { accent: ReturnType<typeof getAccent> }) {
    return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', padding: '0 4px' }}>
            {[
                { icon: Shield, text: 'Dados protegidos' },
                { icon: Award, text: 'CRECI registrado' },
                { icon: Star, text: 'Avaliado 5 estrelas' },
            ].map(({ icon: Icon, text }) => (
                <div key={text} style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    fontSize: '11px', color: '#555',
                }}>
                    <Icon size={12} style={{ color: accent.color, opacity: 0.7 }} />
                    {text}
                </div>
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function LandingPageClient({ development: dev, code }: Props) {
    const heroRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
    const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.08])
    const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

    const template = getTemplate(dev)
    const accent = getAccent(template)
    const totalPrice = dev.min_price || dev.max_price || 500_000
    const gallery = dev.gallery_images?.filter(Boolean) || []

    return (
        <div style={{ minHeight: '100dvh', background: '#080808', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

            {/* ── HERO ──────────────────────────────── */}
            <div ref={heroRef} style={{ position: 'relative', height: '92dvh', overflow: 'hidden' }}>
                {/* Parallax background */}
                <motion.div
                    style={{
                        scale: heroScale,
                        position: 'absolute', inset: '-5%',
                        background: dev.cover_image_url
                            ? `url(${dev.cover_image_url}) center/cover no-repeat`
                            : `linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)`,
                    }}
                />
                {/* Gradient overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(8,8,8,0.2) 0%, rgba(8,8,8,0.4) 40%, rgba(8,8,8,0.92) 100%)',
                }} />

                {/* Developer badge */}
                {dev.developer?.name && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{
                            position: 'absolute', top: '20px', left: '20px',
                            background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px',
                            padding: '5px 14px', fontSize: '11px', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                    >
                        <Building2 size={11} style={{ color: accent.color }} />
                        {dev.developer.name}
                    </motion.div>
                )}

                {/* Status badge */}
                {dev.status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            position: 'absolute', top: '20px', right: '20px',
                            background: accent.dimmed, backdropFilter: 'blur(12px)',
                            border: `1px solid ${accent.color}55`, borderRadius: '20px',
                            padding: '5px 14px', fontSize: '11px', fontWeight: 700,
                            color: accent.color, textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}
                    >
                        {dev.status}
                    </motion.div>
                )}

                {/* Hero content */}
                <motion.div
                    style={{ opacity: heroOpacity }}
                    className="absolute bottom-0 left-0 right-0 p-6 pb-10"
                >
                    <div style={{ maxWidth: '560px', margin: '0 auto' }}>
                        {template === 'luxury' && (
                            <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em',
                                    textTransform: 'uppercase', color: accent.color, marginBottom: '12px',
                                }}
                            >
                                ✦ Alto Padrão
                            </motion.div>
                        )}
                        <motion.h1
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                            style={{ fontSize: 'clamp(30px, 7vw, 52px)', fontWeight: 900, lineHeight: 1.05, marginBottom: '14px', letterSpacing: '-0.02em' }}
                        >
                            {dev.name}
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}
                        >
                            {(dev.city || dev.state) && (
                                <Chip icon={MapPin} accent={accent}>
                                    {[dev.neighborhood, dev.city, dev.state].filter(Boolean).join(', ')}
                                </Chip>
                            )}
                            {dev.bedrooms_options && dev.bedrooms_options.length > 0 && (
                                <Chip icon={BedDouble} accent={accent}>
                                    {dev.bedrooms_options.join(', ')} quartos
                                </Chip>
                            )}
                            {(dev.area_from || dev.area_to) && (
                                <Chip icon={Maximize2} accent={accent}>
                                    {dev.area_from}{dev.area_to && dev.area_to !== dev.area_from ? `–${dev.area_to}` : ''} m²
                                </Chip>
                            )}
                        </motion.div>

                        {(dev.min_price || dev.max_price) && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.85 }}
                            >
                                <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                                    A partir de
                                </div>
                                <div style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 900, color: accent.color, letterSpacing: '-0.02em' }}>
                                    {formatPrice(dev.min_price || dev.max_price)}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Scroll hint */}
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                        position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
                        opacity: 0.3,
                    }}
                >
                    <ChevronDown size={22} />
                </motion.div>
            </div>

            {/* ── CONTENT ────────────────────────────── */}
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px 60px' }}>

                {/* Stats bar */}
                <FadeIn>
                    <div style={{
                        margin: '-28px 0 28px', background: '#111',
                        border: '1px solid #1e1e1e', borderRadius: '18px', padding: '20px',
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px',
                    }}>
                        {[
                            dev.available_units && { label: 'Disponíveis', value: dev.available_units, suffix: ' un.' },
                            dev.total_units && { label: 'Total', value: dev.total_units, suffix: ' un.' },
                            dev.area_from && { label: 'Área mín.', value: dev.area_from, suffix: ' m²' },
                            dev.bedrooms_options?.length && { label: 'Dormitórios', value: dev.bedrooms_options[dev.bedrooms_options.length - 1], suffix: '' },
                        ].filter(Boolean).map((stat: any) => (
                            <div key={stat.label}>
                                <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                                    {stat.label}
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                                    <AnimatedCounter to={stat.value} suffix={stat.suffix} />
                                </div>
                            </div>
                        ))}
                        {(dev.min_price || dev.max_price) && (
                            <div>
                                <div style={{ fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                                    A partir de
                                </div>
                                <div style={{ fontSize: '20px', fontWeight: 800, color: accent.color }}>
                                    {formatPrice(dev.min_price || dev.max_price)}
                                </div>
                            </div>
                        )}
                    </div>
                </FadeIn>

                {/* Gallery */}
                {gallery.length > 0 && (
                    <FadeIn delay={0.05}>
                        <div style={{ marginBottom: '24px' }}>
                            <GallerySection images={gallery} accent={accent} />
                        </div>
                    </FadeIn>
                )}

                {/* Description */}
                {dev.description && (
                    <FadeIn delay={0.05}>
                        <div style={{
                            marginBottom: '24px', padding: '24px',
                            background: '#111', border: '1px solid #1e1e1e', borderRadius: '18px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Home size={16} style={{ color: accent.color }} />
                                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Sobre o Empreendimento</h3>
                            </div>
                            <p style={{ fontSize: '14px', color: '#888', lineHeight: 1.75 }}>
                                {dev.description}
                            </p>
                        </div>
                    </FadeIn>
                )}

                {/* Payment Simulator */}
                <FadeIn delay={0.05}>
                    <div style={{ marginBottom: '24px' }}>
                        <PaymentSimulator totalPrice={totalPrice} accent={accent} />
                    </div>
                </FadeIn>

                {/* Valorization */}
                <FadeIn delay={0.05}>
                    <div style={{ marginBottom: '24px' }}>
                        <ValorizationSection basePrice={totalPrice} accent={accent} />
                    </div>
                </FadeIn>

                {/* Location */}
                <FadeIn delay={0.05}>
                    <div style={{ marginBottom: '24px' }}>
                        <LocationSection dev={dev} accent={accent} />
                    </div>
                </FadeIn>

                {/* Lead form */}
                <FadeIn delay={0.05}>
                    <div style={{
                        background: '#111', border: `1px solid ${accent.dimmed}`,
                        borderRadius: '20px', padding: '28px', marginBottom: '24px',
                    }}>
                        <LeadForm dev={dev} code={code} accent={accent} />
                    </div>
                </FadeIn>

                {/* Trust */}
                <FadeIn delay={0.05}>
                    <TrustBar accent={accent} />
                </FadeIn>

                {/* Footer */}
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#2a2a2a', marginTop: '32px' }}>
                    Powered by <strong style={{ color: '#444' }}>IMI Inteligência Imobiliária</strong>
                </p>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Chip component
// ─────────────────────────────────────────────

function Chip({ icon: Icon, children, accent }: {
    icon: ElementType; children: ReactNode; accent: ReturnType<typeof getAccent>
}) {
    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
            padding: '5px 12px', fontSize: '12px', color: 'rgba(255,255,255,0.8)',
        }}>
            <Icon size={12} style={{ color: accent.color }} />
            {children}
        </div>
    )
}
