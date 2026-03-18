'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Zap, Star, Building2, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

const PLANS = [
    {
        id: 'professional',
        name: 'Professional',
        price: 297,
        icon: Star,
        description: 'Para corretores e pequenas imobiliárias',
        features: [
            'CRM ilimitado de leads',
            'Criador de conteúdo IA',
            'Tracking de links e campanhas',
            'Landing pages automáticas',
            'Relatórios e dashboards',
            'Integrações (WhatsApp, Email)',
            'Suporte prioritário',
        ],
        highlight: true,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 897,
        icon: Building2,
        description: 'Para incorporadoras e redes',
        features: [
            'Tudo do Professional',
            'Multi-tenants (equipes)',
            'API acesso completo',
            'White-label',
            'Gerente de conta dedicado',
            'SLA 99.9%',
            'Integração ERP/CRM externo',
        ],
        highlight: false,
    },
]

export default function BillingPage() {
    const [loading, setLoading] = useState<string | null>(null)

    async function handleSubscribe(planId: string, price: number) {
        setLoading(planId)
        try {
            const res = await fetch('/api/abacate-pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: price, // BRL — API converts to centavos
                    description: `IMI ${planId.charAt(0).toUpperCase() + planId.slice(1)} — Assinatura Mensal`,
                    transactionId: `sub_${planId}_${Date.now()}`,
                    methods: ['PIX', 'CREDIT_CARD'],
                }),
            })
            const data = await res.json()

            if (data.billing?.url || data.url) {
                // Open payment link in new tab
                window.open(data.billing?.url || data.url, '_blank')
                toast.success('Link de pagamento aberto! Após pagar, seu acesso será ativado automaticamente.')
            } else {
                toast.error('Erro ao gerar link de pagamento. Tente novamente.')
            }
        } catch {
            toast.error('Erro de conexão. Tente novamente.')
        } finally {
            setLoading(null)
        }
    }

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'var(--bg-surface)' }}>
            <div style={{ width: '100%', maxWidth: '720px' }}>

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', marginBottom: '40px' }}
                >
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '5px 14px', borderRadius: '6px',
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        fontSize: '11px', fontWeight: 700, color: 'var(--error)',
                        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px',
                    }}>
                        <AlertCircle size={11} />
                        Trial expirado
                    </div>
                    <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.2 }}>
                        Escolha seu plano
                    </h1>
                    <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto' }}>
                        Seu período de teste gratuito de 14 dias encerrou. Assine para continuar usando a IMI.
                    </p>
                </motion.div>

                {/* Plans */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                    {PLANS.map((plan, i) => {
                        const Icon = plan.icon
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                style={{
                                    background: plan.highlight ? 'rgba(184,148,58,0.06)' : 'var(--bg-surface)',
                                    border: `1px solid ${plan.highlight ? 'rgba(184,148,58,0.3)' : 'var(--border-default)'}`,
                                    borderRadius: '6px',
                                    padding: '28px 24px',
                                    position: 'relative',
                                }}
                            >
                                {plan.highlight && (
                                    <div style={{
                                        position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                                        background: 'var(--imi-gold-500)', color: '#000',
                                        fontSize: '11px', fontWeight: 800, padding: '4px 14px', borderRadius: '6px',
                                        letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                                    }}>
                                        Mais popular
                                    </div>
                                )}

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: '6px',
                                        background: plan.highlight ? 'rgba(184,148,58,0.12)' : 'rgba(255,255,255,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Icon size={18} style={{ color: plan.highlight ? 'var(--imi-gold-500)' : 'var(--text-secondary)' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{plan.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{plan.description}</div>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <span style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        R$ {plan.price}
                                    </span>
                                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>/mês</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                                    {plan.features.map((feat, fi) => (
                                        <div key={fi} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                            <CheckCircle2 size={13} style={{ color: plan.highlight ? 'var(--imi-gold-500)' : 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                                            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{feat}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => handleSubscribe(plan.id, plan.price)}
                                    disabled={loading === plan.id}
                                    style={{
                                        width: '100%', height: '46px', borderRadius: '6px',
                                        background: plan.highlight ? 'var(--imi-gold-500)' : 'rgba(255,255,255,0.06)',
                                        border: plan.highlight ? 'none' : '1px solid var(--border-default)',
                                        color: plan.highlight ? '#000' : 'var(--text-primary)',
                                        fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        transition: 'opacity 0.18s',
                                        opacity: loading === plan.id ? 0.7 : 1,
                                    }}
                                >
                                    {loading === plan.id ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Zap size={14} />
                                            Assinar {plan.name}
                                            <ArrowRight size={13} />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        )
                    })}
                </div>

                <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', opacity: 0.6 }}>
                    Pagamento via PIX ou cartão · Cancele a qualquer momento · Sem fidelidade
                </p>
            </div>
        </div>
    )
}
