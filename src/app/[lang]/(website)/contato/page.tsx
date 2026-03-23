'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/animations'
import { MapPin, Phone, Mail, MessageCircle, Send, Loader2, ChevronDown, Shield, Award } from 'lucide-react'
import { ButtonPrimary } from '@/components/website/Buttons'
import { getAttribution } from '@/lib/utils/attribution'

const inputStyle = {
    background: 'rgba(20,36,64,0.4)',
    border: '1px solid rgba(200,164,74,0.14)',
    color: '#ffffff',
    fontSize: 14,
    transition: 'all 0.2s',
}

const inputFocusClass = 'focus:border-[#C8A44A]/40 focus:ring-2 focus:ring-[#C8A44A]/20 focus:outline-none'

const FAQ_ITEMS = [
    {
        q: 'Como funciona uma avaliação imobiliária?',
        a: 'Realizamos uma análise técnica completa baseada em normas da ABNT, considerando localização, estado de conservação, mercado comparativo e potencial de valorização. O laudo é emitido com assinatura de engenheiro credenciado.',
    },
    {
        q: 'Quanto tempo leva para receber o laudo?',
        a: 'O prazo médio é de 5 a 10 dias úteis após a vistoria. Para casos urgentes, oferecemos o serviço expresso com entrega em até 3 dias úteis.',
    },
    {
        q: 'Vocês atendem fora de Recife?',
        a: 'Sim. Atendemos em todo o estado de Pernambuco e, sob consulta, em outras capitais do Nordeste. Entre em contato para verificar a disponibilidade na sua região.',
    },
    {
        q: 'Preciso de CRECI para solicitar uma avaliação?',
        a: 'Não. Qualquer pessoa física ou jurídica pode solicitar uma avaliação imobiliária. O CRECI é a credencial do avaliador, não do solicitante.',
    },
]

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [openFaq, setOpenFaq] = useState<number | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        const attribution = getAttribution()
        try {
            const response = await fetch('/api/leads/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    interest: formData.subject,
                    message: formData.message,
                    attribution
                })
            })
            if (response.ok) {
                setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
                toast.success('Mensagem enviada!', { description: 'Um especialista entrará em contato em breve.' })
            } else {
                throw new Error('Erro ao enviar')
            }
        } catch (err) {
            toast.error('Erro ao enviar', { description: 'Tente novamente ou entre em contato pelo WhatsApp.' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const contactInfo = [
        {
            icon: MessageCircle,
            title: 'WhatsApp',
            content: '+55 (81) 9 9723-0455',
            sub: 'Atendimento rápido',
            link: 'https://wa.me/5581997230455',
        },
        {
            icon: Mail,
            title: 'Email',
            content: 'iulemirandaimoveis@gmail.com',
            sub: 'Respondemos em até 24h',
            link: 'mailto:iulemirandaimoveis@gmail.com',
        },
        {
            icon: Shield,
            title: 'CRECI',
            content: 'CRECI 9.226-F',
            sub: 'Registro Profissional',
            link: null,
        },
        {
            icon: MapPin,
            title: 'Endereço',
            content: 'Recife, Pernambuco',
            sub: 'Brasil',
            link: null,
        },
    ]

    return (
        <main className="bg-[#0D0F14] min-h-screen">
            {/* HERO */}
            <section className="relative text-white pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
                {/* Background glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at top, rgba(200,164,74,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }}
                />
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8 relative z-10">
                    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl">
                        <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-px" style={{ background: 'linear-gradient(90deg, #C8A44A, transparent)' }} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A44A]">
                                Fale Conosco
                            </span>
                        </motion.div>
                        <motion.h1
                            variants={slideUp}
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-tight text-white"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Atendimento Técnico{' '}
                            <span className="text-[#C8A44A] italic">Personalizado</span>
                        </motion.h1>
                        <motion.p variants={slideUp} className="text-white/45 text-base sm:text-lg leading-relaxed max-w-xl">
                            Entre em contato e descubra como nossa inteligência pode proteger e valorizar seu patrimônio.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* CONTACT CARDS */}
            <section className="py-12 md:py-16">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {contactInfo.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={slideUp}
                                className="group relative p-6 rounded-2xl transition-all duration-300 hover:border-[#C8A44A]/20"
                                style={{
                                    background: 'rgba(20,20,32,0.8)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                                    style={{ background: 'rgba(200,164,74,0.08)', border: '1px solid rgba(200,164,74,0.15)' }}
                                >
                                    <item.icon size={18} style={{ color: '#C8A44A' }} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                                {item.link ? (
                                    <a
                                        href={item.link}
                                        target={item.link.startsWith('http') ? '_blank' : undefined}
                                        rel={item.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                                        className="text-[13px] text-white/60 hover:text-[#C8A44A] transition-colors break-all"
                                    >
                                        {item.content}
                                    </a>
                                ) : (
                                    <p className="text-[13px] text-white/60">{item.content}</p>
                                )}
                                <p className="text-[11px] text-white/30 mt-1">{item.sub}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FORM + FAQ */}
            <section className="pb-16 md:pb-24">
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
                        {/* Form — 3 cols */}
                        <motion.div
                            variants={slideUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="lg:col-span-3 rounded-2xl p-8 sm:p-10"
                            style={{
                                background: 'rgba(20,20,32,0.6)',
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            <div className="mb-8">
                                <h2
                                    className="text-2xl sm:text-3xl font-bold text-white mb-2"
                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                >
                                    Envie sua <span className="text-[#C8A44A] italic">Mensagem</span>
                                </h2>
                                <p className="text-sm text-white/40">
                                    Preencha o formulário abaixo e retornaremos em breve.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">Nome Completo</label>
                                        <input
                                            type="text"
                                            placeholder="Como devemos chamá-lo?"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            disabled={isSubmitting}
                                            className={`w-full h-12 px-4 rounded-xl text-sm placeholder:text-white/20 disabled:opacity-50 ${inputFocusClass}`}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">Email</label>
                                        <input
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            disabled={isSubmitting}
                                            className={`w-full h-12 px-4 rounded-xl text-sm placeholder:text-white/20 disabled:opacity-50 ${inputFocusClass}`}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">Telefone / WhatsApp</label>
                                        <input
                                            type="text"
                                            placeholder="(00) 00000-0000"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            disabled={isSubmitting}
                                            className={`w-full h-12 px-4 rounded-xl text-sm placeholder:text-white/20 disabled:opacity-50 ${inputFocusClass}`}
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">Assunto</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Avaliação de Imóvel"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                            disabled={isSubmitting}
                                            className={`w-full h-12 px-4 rounded-xl text-sm placeholder:text-white/20 disabled:opacity-50 ${inputFocusClass}`}
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-[0.15em] mb-2">Mensagem</label>
                                    <textarea
                                        placeholder="Conte-nos brevemente sobre sua necessidade..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                        rows={5}
                                        className={`w-full px-4 py-3 rounded-xl text-sm placeholder:text-white/20 resize-none disabled:opacity-50 ${inputFocusClass}`}
                                        style={inputStyle}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-13 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                                    style={{
                                        background: '#0A1624',
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        position: 'relative',
                                        overflow: 'hidden',
                                    }}
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                                    ) : (
                                        <><Send className="w-4 h-4" /> Enviar Mensagem</>
                                    )}
                                    <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
                                </button>
                            </form>
                        </motion.div>

                        {/* FAQ — 2 cols */}
                        <motion.div
                            variants={slideUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="lg:col-span-2"
                        >
                            <div className="mb-6">
                                <h3
                                    className="text-xl font-bold text-white mb-1"
                                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                >
                                    Perguntas Frequentes
                                </h3>
                                <p className="text-[13px] text-white/35">Tire suas dúvidas rapidamente.</p>
                            </div>

                            <div className="space-y-3">
                                {FAQ_ITEMS.map((item, i) => (
                                    <div
                                        key={i}
                                        className="rounded-xl overflow-hidden transition-all duration-200"
                                        style={{
                                            background: openFaq === i ? 'rgba(200,164,74,0.04)' : 'rgba(20,20,32,0.5)',
                                            border: `1px solid ${openFaq === i ? 'rgba(200,164,74,0.15)' : 'rgba(255,255,255,0.05)'}`,
                                        }}
                                    >
                                        <button
                                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                            className="w-full flex items-start justify-between gap-3 p-4 text-left"
                                        >
                                            <span className="text-[13px] font-semibold text-white/80 leading-snug">{item.q}</span>
                                            <ChevronDown
                                                size={16}
                                                className="flex-shrink-0 mt-0.5 transition-transform duration-200"
                                                style={{
                                                    color: 'rgba(200,164,74,0.6)',
                                                    transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)',
                                                }}
                                            />
                                        </button>
                                        {openFaq === i && (
                                            <div className="px-4 pb-4">
                                                <p className="text-[12px] text-white/40 leading-relaxed">{item.a}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* CRECI + credenciais */}
                            <div
                                className="mt-6 p-5 rounded-xl"
                                style={{
                                    background: 'rgba(200,164,74,0.04)',
                                    border: '1px solid rgba(200,164,74,0.1)',
                                }}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <Award size={18} style={{ color: '#C8A44A' }} />
                                    <span className="text-[12px] font-bold text-[#C8A44A] uppercase tracking-wider">Credenciais</span>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-[12px] text-white/50">
                                        <span className="text-white/70 font-semibold">CRECI 9.226-F</span> — Conselho Regional de Corretores de Imóveis
                                    </p>
                                    <p className="text-[12px] text-white/50">
                                        <span className="text-white/70 font-semibold">CNAI</span> — Cadastro Nacional de Avaliadores Imobiliários
                                    </p>
                                    <p className="text-[11px] text-white/30 mt-2">
                                        Laudos em conformidade com NBR 14653 (ABNT)
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="relative py-20 md:py-28 text-center overflow-hidden border-t border-white/[0.04]">
                {/* Gold glow */}
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at top, rgba(200,164,74,0.06) 0%, transparent 70%)', filter: 'blur(80px)' }}
                />
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        {/* Gold accent line */}
                        <div className="w-12 h-0.5 mx-auto mb-6" style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }} />
                        <h2
                            className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-white tracking-tight"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            Respostas <span className="text-[#C8A44A] italic">Imediatas</span>
                        </h2>
                        <p className="text-white/40 text-base mb-8 max-w-md mx-auto leading-relaxed">
                            Precisa de agilidade? Fale diretamente com nossa equipe técnica pelo WhatsApp.
                        </p>
                        <ButtonPrimary
                            href="https://wa.me/5581997230455"
                            target="_blank"
                            rel="noopener noreferrer"
                            size="lg"
                            icon={<MessageCircle size={16} />}
                        >
                            Abrir Chat no WhatsApp
                        </ButtonPrimary>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}
