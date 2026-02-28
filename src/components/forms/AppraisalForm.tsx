'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/animations'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'

import { getAttribution } from '@/lib/utils/attribution'

export default function AppraisalForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setSubmitStatus('idle')

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData)
        const attribution = getAttribution()

        try {
            const response = await fetch('/api/appraisal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    appraisalType: data.appraisalType,
                    propertyType: data.propertyType,
                    city: data.city,
                    address: data.address,
                    timeline: data.timeline,
                    additionalInfo: data.message,
                    attribution
                }),
            })

            if (response.ok) {
                setSubmitStatus('success')
                    ; (e.target as HTMLFormElement).reset()
            } else {
                setSubmitStatus('error')
            }
        } catch (error) {
            setSubmitStatus('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="bg-white/80 backdrop-blur-md shadow-soft rounded-2xl shadow-lg p-8 md:p-12"
        >
            <motion.h2 variants={slideUp} className="text-3xl font-bold text-imi-900 mb-2">
                Solicitar Avaliação Técnica
            </motion.h2>
            <motion.p variants={slideUp} className="text-imi-600 mb-8">
                Preencha o formulário abaixo e entraremos em contato em até 24 horas.
            </motion.p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={slideUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Nome completo"
                        name="name"
                        type="text"
                        required
                        placeholder="Seu nome"
                    />
                    <Input
                        label="E-mail"
                        name="email"
                        type="email"
                        required
                        placeholder="seu@email.com"
                    />
                </motion.div>

                <motion.div variants={slideUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Telefone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="(00) 00000-0000"
                    />
                    <Select
                        label="Tipo de avaliação"
                        name="appraisalType"
                        required
                        options={[
                            { value: '', label: 'Selecione...' },
                            { value: 'venda', label: 'Venda' },
                            { value: 'financiamento', label: 'Financiamento' },
                            { value: 'judicial', label: 'Judicial/Extrajudicial' },
                            { value: 'patrimonial', label: 'Patrimonial' },
                        ]}
                    />
                </motion.div>

                <motion.div variants={slideUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Tipo de imóvel"
                        name="propertyType"
                        required
                        options={[
                            { value: '', label: 'Selecione...' },
                            { value: 'apartment', label: 'Apartamento' },
                            { value: 'house', label: 'Casa' },
                            { value: 'commercial', label: 'Comercial' },
                            { value: 'land', label: 'Terreno' },
                        ]}
                    />
                    <Input
                        label="Cidade"
                        name="city"
                        type="text"
                        required
                        placeholder="Cidade do imóvel"
                    />
                </motion.div>

                <motion.div variants={slideUp}>
                    <Input
                        label="Endereço do imóvel"
                        name="address"
                        type="text"
                        required
                        placeholder="Rua, número, bairro"
                    />
                </motion.div>

                <motion.div variants={slideUp}>
                    <Select
                        label="Prazo desejado"
                        name="timeline"
                        required
                        options={[
                            { value: '', label: 'Selecione...' },
                            { value: 'urgente', label: 'Urgente (até 7 dias)' },
                            { value: 'normal', label: 'Normal (até 15 dias)' },
                            { value: 'flexivel', label: 'Flexível (até 30 dias)' },
                        ]}
                    />
                </motion.div>

                <motion.div variants={slideUp}>
                    <Textarea
                        label="Informações adicionais"
                        name="message"
                        rows={4}
                        placeholder="Descreva detalhes relevantes sobre o imóvel ou a avaliação..."
                    />
                </motion.div>

                <motion.div variants={slideUp}>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 bg-[#1A1E2A] text-white rounded-2xl font-bold text-lg hover:bg-[#21263A] transition-all duration-300 disabled:opacity-50 shadow-[0_8px_32px_rgba(26,26,46,0.15)] hover:shadow-[0_12px_40px_rgba(26,26,46,0.25)] border border-[#21263A] border-l-4 border-l-[#3B82F6] border-r-4 border-r-[#E53935] flex items-center justify-center hover:-translate-y-1"
                    >
                        {isSubmitting ? 'Enviando...' : 'Solicitar Avaliação'}
                    </button>
                </motion.div>

                {submitStatus === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800"
                    >
                        Solicitação enviada com sucesso! Entraremos em contato em breve.
                    </motion.div>
                )}

                {submitStatus === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
                    >
                        Erro ao enviar solicitação. Por favor, tente novamente ou entre em contato diretamente.
                    </motion.div>
                )}
            </form>
        </motion.div>
    )
}
