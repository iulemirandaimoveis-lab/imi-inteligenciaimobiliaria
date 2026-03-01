'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/animations'
import { MapPin, Phone, Mail, MessageCircle, Send, Loader2 } from 'lucide-react'
import { getAttribution } from '@/lib/utils/attribution'

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    })

    const [isSubmitting, setIsSubmitting] = useState(false)

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
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: ''
                })
                alert('Mensagem enviada com sucesso! Nossa IA já está processando seu perfil e um especialista entrará em contato.')
            } else {
                throw new Error('Erro ao enviar')
            }
        } catch (err) {
            console.error('Error saving lead:', err)
            alert('Erro ao enviar mensagem. Tente pelo WhatsApp abaixo.')
        } finally {
            setIsSubmitting(false)
        }
    }

    const contactInfo = [
        {
            icon: MapPin,
            title: 'Endereço',
            content: 'João Pessoa, Paraíba - Brasil',
            link: null
        },
        {
            icon: Phone,
            title: 'Telefone',
            content: '+55 (81) 9 9723-0455',
            link: 'tel:+5581997230455'
        },
        {
            icon: Mail,
            title: 'Email',
            content: 'contato@iulemirandaimoveis.com.br',
            link: 'mailto:contato@iulemirandaimoveis.com.br'
        }
    ]

    return (
        <main className="bg-[#0D0F14] min-h-screen">
            {/* HERO */}
            <section className="relative bg-[#141420] text-white pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden border-b border-white/[0.05]">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-[#102A43]/5 -skew-x-12 translate-x-1/4" />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl"
                    >
                        <motion.div variants={slideUp} className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-[#102A43]" />
                            <span className="text-[#486581] font-bold uppercase tracking-[0.25em] text-[11px]">Fale Conosco</span>
                        </motion.div>
                        <motion.h1 variants={slideUp} className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold mb-8 tracking-tight leading-tight text-white">
                            Atendimento Técnico <br /><span className="text-[#486581] italic">Personalizado</span>
                        </motion.h1>
                        <motion.p variants={slideUp} className="text-[#9CA3AF] text-lg sm:text-xl font-light leading-relaxed max-w-2xl">
                            Entre em contato conosco e descubra como nossa inteligência pode proteger e valorizar seu patrimônio.
                        </motion.p>
                    </motion.div>
                </div>
            </section>

            {/* INFORMAÇÕES DE CONTATO */}
            <section className="py-16 md:py-24">
                <div className="container-custom">
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                        variants={staggerContainer}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                    >
                        {contactInfo.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={slideUp}
                                className="p-8 sm:p-10 rounded-3xl bg-[#141420] border border-white/[0.05] transition-all duration-300 group hover:border-[#334E68]/30 hover:shadow-[0_8px_32px_rgba(26,26,46,0.1)]"
                            >
                                <div className="w-14 h-14 bg-[#1A1E2A] text-[#486581] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform border border-white/[0.05]">
                                    <item.icon className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-4 font-display">
                                    {item.title}
                                </h3>
                                {item.link ? (
                                    <a
                                        href={item.link}
                                        className="text-[#9CA3AF] leading-relaxed text-sm hover:text-[#486581] transition-colors break-words"
                                    >
                                        {item.content}
                                    </a>
                                ) : (
                                    <p className="text-[#9CA3AF] leading-relaxed text-sm">
                                        {item.content}
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FORMULÁRIO */}
            <section className="pb-16 md:pb-24">
                <div className="container-custom">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            variants={slideUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="bg-[#141420] rounded-3xl border border-white/[0.05] p-8 sm:p-12 lg:p-16"
                        >
                            <div className="text-center mb-12">
                                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
                                    Envie sua <span className="text-[#486581] italic">Mensagem</span>
                                </h2>
                                <p className="text-[#9CA3AF] text-lg font-light">
                                    Preencha o formulário abaixo e retornaremos em breve.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-2">Nome Completo</label>
                                        <input
                                            type="text"
                                            placeholder="Como devemos chamá-lo?"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full h-12 px-4 rounded-xl bg-[#0D0F14] border border-white/10 text-white text-sm placeholder:text-[#4B5563] focus:border-[#334E68]/50 focus:ring-1 focus:ring-[#334E68]/30 outline-none transition-all disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-2">Email</label>
                                        <input
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full h-12 px-4 rounded-xl bg-[#0D0F14] border border-white/10 text-white text-sm placeholder:text-[#4B5563] focus:border-[#334E68]/50 focus:ring-1 focus:ring-[#334E68]/30 outline-none transition-all disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-2">Telefone / WhatsApp</label>
                                        <input
                                            type="text"
                                            placeholder="(00) 00000-0000"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full h-12 px-4 rounded-xl bg-[#0D0F14] border border-white/10 text-white text-sm placeholder:text-[#4B5563] focus:border-[#334E68]/50 focus:ring-1 focus:ring-[#334E68]/30 outline-none transition-all disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-2">Assunto</label>
                                        <input
                                            type="text"
                                            placeholder="Ex: Avaliação de Imóvel"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            required
                                            disabled={isSubmitting}
                                            className="w-full h-12 px-4 rounded-xl bg-[#0D0F14] border border-white/10 text-white text-sm placeholder:text-[#4B5563] focus:border-[#334E68]/50 focus:ring-1 focus:ring-[#334E68]/30 outline-none transition-all disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-[#6C757D] uppercase tracking-[0.15em] mb-2">Mensagem</label>
                                    <textarea
                                        placeholder="Conte-nos brevemente sobre sua necessidade..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                        rows={5}
                                        className="w-full px-4 py-3 rounded-xl bg-[#0D0F14] border border-white/10 text-white text-sm placeholder:text-[#4B5563] focus:border-[#334E68]/50 focus:ring-1 focus:ring-[#334E68]/30 outline-none transition-all resize-none disabled:opacity-50"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 rounded-xl bg-[#102A43] text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#1A2F44] transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(16,42,67,0.4)]"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Enviar Mensagem
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA WHATSAPP */}
            <section className="bg-[#141420] text-white py-20 md:py-32 text-center relative overflow-hidden border-t border-white/[0.05]">
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at center, #334E68 0%, transparent 60%)', filter: 'blur(80px)' }} />
                <div className="container-custom relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                            Respostas <span className="text-[#486581] italic">Imediatas</span>
                        </h2>
                        <p className="text-[#9CA3AF] text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                            Precisa de agilidade? Fale diretamente com nossa equipe técnica pelo WhatsApp.
                        </p>
                        <a
                            href="https://wa.me/5581997230455"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 h-16 px-10 text-lg font-bold bg-[#1A1E2A] text-white hover:bg-[#21263A] border border-[#21263A] border-l-4 border-l-[#334E68] rounded-2xl transition-all duration-300 hover:-translate-y-1 shadow-[0_8px_32px_rgba(26,26,46,0.15)] hover:shadow-[0_12px_40px_rgba(26,26,46,0.25)]"
                        >
                            <MessageCircle className="w-5 h-5 flex-shrink-0" />
                            Abrir Chat no WhatsApp
                        </a>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}
