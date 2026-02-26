'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/animations'
import { MapPin, Phone, Mail, MessageCircle, Send } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
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
            content: '+55 (81) 99723-0455',
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
        <main className="bg-white">
            {/* HERO */}
            <section className="bg-imi-900 text-white section-padding pt-32 lg:pt-40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-accent-500/5 -skew-x-12 translate-x-1/4" />
                <div className="container-custom relative z-10">
                    <div className="max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-px bg-accent-500" />
                            <span className="text-accent-500 font-semibold uppercase tracking-[0.2em] text-[10px] sm:text-xs">Fale Conosco</span>
                        </div>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold mb-8 tracking-tight leading-tight">
                            Atendimento Técnico Personalizado
                        </h1>
                        <p className="text-imi-300 text-lg sm:text-xl font-light leading-relaxed max-w-2xl">
                            Entre em contato conosco e descubra como nossa inteligência pode proteger e valorizar seu patrimônio.
                        </p>
                    </div>
                </div>
            </section>

            {/* INFORMAÇÕES DE CONTATO */}
            <section className="section-padding bg-imi-50">
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
                                className="p-8 sm:p-10 rounded-3xl bg-white border border-imi-100 shadow-soft transition-all duration-300 group hover:shadow-card-hover"
                            >
                                <div className="w-14 h-14 bg-imi-900 text-white rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                    <item.icon className="w-6 h-6" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-xl font-bold text-imi-900 mb-4 font-display">
                                    {item.title}
                                </h3>
                                {item.link ? (
                                    <a
                                        href={item.link}
                                        className="text-imi-500 leading-relaxed text-sm hover:text-imi-900 transition-colors break-words"
                                    >
                                        {item.content}
                                    </a>
                                ) : (
                                    <p className="text-imi-500 leading-relaxed text-sm">
                                        {item.content}
                                    </p>
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* FORMULÁRIO */}
            <section className="section-padding">
                <div className="container-custom">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            variants={slideUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="bg-white rounded-3xl border border-imi-100 p-8 sm:p-12 lg:p-16 shadow-elevated"
                        >
                            <div className="text-center mb-12">
                                <h2 className="font-display text-3xl sm:text-4xl font-bold text-imi-900 mb-4">
                                    Envie sua Mensagem
                                </h2>
                                <p className="text-imi-500 text-lg font-light">
                                    Preencha o formulário abaixo e retornaremos em breve.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <Input
                                        label="Nome Completo"
                                        placeholder="Como devemos chamá-lo?"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <Input
                                        label="Telefone / WhatsApp"
                                        placeholder="(00) 00000-0000"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <Input
                                        label="Assunto"
                                        placeholder="Ex: Avaliação de Imóvel"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <Textarea
                                    label="Mensagem"
                                    placeholder="Conte-nos brevemente sobre sua necessidade..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                    disabled={isSubmitting}
                                />

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full h-14"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        "Enviando..."
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 mr-3" />
                                            Enviar Mensagem
                                        </>
                                    )}
                                </Button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA WHATSAPP */}
            <section className="bg-imi-900 text-white section-padding text-center relative overflow-hidden">
                <div className="container-custom relative z-10">
                    <h2 className="font-display text-3xl sm:text-4xl font-bold mb-6">
                        Respostas Imediatas
                    </h2>
                    <p className="text-imi-400 text-lg mb-10 max-w-xl mx-auto font-light leading-relaxed">
                        Precisa de agilidade? Fale diretamente com nossa equipe técnica pelo WhatsApp.
                    </p>
                    <a href="https://wa.me/5581997230455" target="_blank" rel="noopener noreferrer" className="btn btn-primary bg-white text-imi-900 border border-imi-200 hover:bg-imi-50 h-14 px-6 sm:px-10 inline-flex items-center text-base sm:text-lg shadow-md font-bold uppercase tracking-wider whitespace-nowrap">
                        <MessageCircle className="w-5 h-5 mr-2 sm:mr-3 flex-shrink-0" />
                        Abrir Chat no WhatsApp
                    </a>
                </div>
            </section>
        </main>
    )
}
