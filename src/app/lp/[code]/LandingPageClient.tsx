'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, BedDouble, Maximize2, Building2, Phone, Mail, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Development {
    id: string
    name: string
    slug: string
    type?: string
    description?: string
    city?: string
    state?: string
    min_price?: number
    max_price?: number
    bedrooms_options?: number[]
    status?: string
    cover_image_url?: string
    gallery_images?: string[]
    developer?: { name?: string; logo_url?: string }
    total_units?: number
    available_units?: number
    area_min?: number
    area_max?: number
}

interface Props {
    development: Development
    code: string
}

function formatPrice(v?: number): string {
    if (!v) return '—'
    if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}M`
    return `R$ ${(v / 1_000).toFixed(0)}k`
}

// Template selection based on price tier
function getTemplate(dev: Development): 'luxury' | 'standard' | 'budget' {
    const price = dev.min_price || dev.max_price || 0
    if (price >= 1_000_000) return 'luxury'
    if (price >= 400_000) return 'standard'
    return 'budget'
}

export default function LandingPageClient({ development: dev, code }: Props) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const template = getTemplate(dev)

    const accentColor = template === 'luxury' ? '#b8943a'
        : template === 'standard' ? '#3b82f6'
        : '#22c55e'

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim() || !phone.trim()) {
            toast.error('Preencha nome e telefone')
            return
        }
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

    return (
        <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#fff', fontFamily: '-apple-system, sans-serif' }}>

            {/* Hero */}
            <div style={{
                position: 'relative', minHeight: '60vh',
                background: dev.cover_image_url
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%), url(${dev.cover_image_url}) center/cover`
                    : `linear-gradient(135deg, #111 0%, #1a1a1a 100%)`,
                display: 'flex', alignItems: 'flex-end', padding: '48px 24px 40px',
            }}>
                {/* Dev badge */}
                {dev.developer?.name && (
                    <div style={{
                        position: 'absolute', top: '20px', left: '24px',
                        background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '20px', padding: '5px 14px',
                        fontSize: '11px', fontWeight: 600, color: '#fff',
                    }}>
                        {dev.developer.name}
                    </div>
                )}

                <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
                    {template === 'luxury' && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em',
                            textTransform: 'uppercase', color: accentColor, marginBottom: '12px',
                        }}>
                            ✦ Alto Padrão
                        </div>
                    )}
                    <h1 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '12px' }}>
                        {dev.name}
                    </h1>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                        {(dev.city || dev.state) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MapPin size={13} />
                                {[dev.city, dev.state].filter(Boolean).join(', ')}
                            </span>
                        )}
                        {dev.bedrooms_options && dev.bedrooms_options.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <BedDouble size={13} />
                                {dev.bedrooms_options.join(', ')} quartos
                            </span>
                        )}
                        {(dev.area_min || dev.area_max) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Maximize2 size={13} />
                                {dev.area_min}{dev.area_max && dev.area_max !== dev.area_min ? `–${dev.area_max}` : ''} m²
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '32px 24px' }}>

                {/* Price + specs */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: '#141414', border: '1px solid #222', borderRadius: '16px',
                        padding: '20px', marginBottom: '24px',
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px',
                    }}
                >
                    {(dev.min_price || dev.max_price) && (
                        <div>
                            <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                                A partir de
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: accentColor }}>
                                {formatPrice(dev.min_price || dev.max_price)}
                            </div>
                        </div>
                    )}
                    {dev.available_units && (
                        <div>
                            <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                                Disponíveis
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 800 }}>
                                {dev.available_units}
                            </div>
                        </div>
                    )}
                    {dev.type && (
                        <div>
                            <div style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                                Tipo
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 700 }}>
                                {dev.type.charAt(0).toUpperCase() + dev.type.slice(1)}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Description */}
                {dev.description && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        style={{ fontSize: '14px', color: '#aaa', lineHeight: 1.7, marginBottom: '28px' }}
                    >
                        {dev.description}
                    </motion.p>
                )}

                {/* Lead form */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{
                        background: '#111', border: `1px solid ${accentColor}33`,
                        borderRadius: '20px', padding: '28px',
                    }}
                >
                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <CheckCircle2 size={36} style={{ color: '#4ade80', margin: '0 auto 12px' }} />
                            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Recebemos seu contato!</h3>
                            <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
                                Um especialista entrará em contato em breve para apresentar o {dev.name}.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                                Tenho interesse neste imóvel
                            </h2>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                                Deixe seu contato e um especialista falará com você.
                            </p>
                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <input
                                    placeholder="Seu nome *"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                    style={{
                                        height: '46px', padding: '0 14px', borderRadius: '10px',
                                        background: '#1a1a1a', border: '1px solid #2a2a2a',
                                        color: '#fff', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box',
                                    }}
                                />
                                <input
                                    placeholder="WhatsApp / Telefone *"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    required
                                    style={{
                                        height: '46px', padding: '0 14px', borderRadius: '10px',
                                        background: '#1a1a1a', border: '1px solid #2a2a2a',
                                        color: '#fff', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box',
                                    }}
                                />
                                <input
                                    placeholder="E-mail (opcional)"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    type="email"
                                    style={{
                                        height: '46px', padding: '0 14px', borderRadius: '10px',
                                        background: '#1a1a1a', border: '1px solid #2a2a2a',
                                        color: '#fff', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box',
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        height: '50px', borderRadius: '12px',
                                        background: accentColor, color: template === 'luxury' ? '#000' : '#fff',
                                        fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        opacity: loading ? 0.7 : 1, transition: 'opacity 0.18s',
                                    }}
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                                        <>
                                            <Phone size={16} />
                                            Quero ser contactado
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </motion.div>

                {/* Footer */}
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#333', marginTop: '24px' }}>
                    Powered by <strong style={{ color: '#555' }}>IMI Inteligência Imobiliária</strong>
                </p>
            </div>
        </div>
    )
}
