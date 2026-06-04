
'use client'

import { useState, useEffect } from 'react'
import { X, Send, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAttribution } from '@/lib/utils/attribution'

const NAVY = '#0B1928'
const GOLD = '#C8A44A'

interface LeadCaptureModalProps {
    propertyName?: string
    propertyId?: string
    title?: string
    description?: string
    customInterest?: string
    onClose: () => void
    onSuccess: () => void
}

function FieldInput({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required,
}: {
    label: string
    type?: string
    value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    required?: boolean
}) {
    return (
        <div>
            <label
                className="block text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
            >
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                className="w-full h-12 px-4 rounded-xl text-sm transition-all duration-200 outline-none focus:ring-2"
                style={{
                    background: '#F8F6F2',
                    border: '1px solid rgba(184,179,168,0.4)',
                    color: NAVY,
                    fontFamily: "var(--fu, 'Outfit', sans-serif)",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(200,164,74,0.1)` }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(184,179,168,0.4)'; e.currentTarget.style.boxShadow = 'none' }}
            />
        </div>
    )
}

export default function LeadCaptureModal({
    propertyName,
    propertyId,
    title = "Consultoria Técnica",
    description,
    customInterest,
    onClose,
    onSuccess
}: LeadCaptureModalProps) {
    const [step, setStep] = useState<'form' | 'success'>('form')
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' })

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setIsLoading(true)

        const attribution = getAttribution()

        try {
            const interest = customInterest || (propertyName ? `Interesse no empreendimento: ${propertyName}` : 'Interesse Geral')

            const response = await fetch('/api/leads/capture', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    interest,
                    development_id: propertyId,
                    attribution
                })
            })

            if (!response.ok) throw new Error('Falha no envio')

            setStep('success')
            setTimeout(() => { onSuccess() }, 2000)
        } catch {
            alert('Ocorreu um erro ao processar seu contato. Por favor, tente novamente.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0"
                style={{ background: 'rgba(11,25,40,0.7)', backdropFilter: 'blur(12px)' }}
            />

            <AnimatePresence mode="wait">
                {step === 'form' ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.96, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -16 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                        style={{ background: '#FFFFFF' }}
                    >
                        {/* Top accent */}
                        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

                        <div className="p-8 md:p-10">
                            {/* Close */}
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                                style={{ color: '#948F84' }}
                                aria-label="Fechar"
                            >
                                <X size={18} />
                            </button>

                            {/* Header */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                        Atendimento VIP
                                    </span>
                                </div>
                                <h3
                                    className="text-2xl md:text-3xl font-bold tracking-tight mb-2"
                                    style={{ fontFamily: "var(--font-heading, 'Playfair Display', serif)", color: NAVY }}
                                >
                                    {title}
                                </h3>
                                <p className="text-sm leading-relaxed" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                    {description || (propertyName ? (
                                        <>Registre seu interesse no <strong style={{ color: NAVY }}>{propertyName}</strong> e fale com um especialista em instantes.</>
                                    ) : 'Preencha seus dados para receber um atendimento especializado.')}
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <FieldInput
                                    label="Nome Completo"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Como podemos chamar você?"
                                    required
                                />

                                <div className="grid md:grid-cols-2 gap-4">
                                    <FieldInput
                                        label="E-mail"
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="seu@email.com"
                                    />
                                    <FieldInput
                                        label="WhatsApp"
                                        value={formData.phone}
                                        onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="(00) 00000-0000"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="relative w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 overflow-hidden hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                                    style={{ background: NAVY, color: '#fff', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Solicitar Atendimento
                                        </>
                                    )}
                                    {!isLoading && (
                                        <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.5 }} />
                                    )}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl text-center"
                        style={{ background: '#FFFFFF' }}
                    >
                        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)` }} />

                        <div className="p-10">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                                style={{ background: NAVY }}
                            >
                                <Check size={28} strokeWidth={2.5} style={{ color: GOLD }} />
                            </div>
                            <h3
                                className="text-2xl font-bold tracking-tight mb-3"
                                style={{ fontFamily: "var(--font-heading, 'Playfair Display', serif)", color: NAVY }}
                            >
                                Solicitação Recebida!
                            </h3>
                            <p className="text-sm leading-relaxed mb-8" style={{ color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                Nossa equipe já está processando sua solicitação e um especialista entrará em contato via WhatsApp.
                            </p>
                            <div
                                className="flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                                style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.3)', color: '#948F84', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10B981' }} />
                                Redirecionando para WhatsApp...
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
