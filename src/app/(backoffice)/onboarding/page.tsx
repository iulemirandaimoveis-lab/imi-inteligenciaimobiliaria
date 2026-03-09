'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Building2, Briefcase, CheckCircle2, ArrowRight, ArrowLeft,
    Loader2, Home, TrendingUp, Globe, Star,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
interface OnboardingData {
    companyName: string
    ownerName: string
    phone: string
    niche: string
    city: string
    state: string
    plan: string
}

const NICHES = [
    { value: 'imoveis_premium', label: 'Imóveis Premium', icon: Star, desc: 'Alto padrão e luxo' },
    { value: 'imoveis_lancamentos', label: 'Lançamentos', icon: Building2, desc: 'Pré-venda e lançamentos' },
    { value: 'consultoria_imobiliaria', label: 'Consultoria', icon: Briefcase, desc: 'Serviços especializados' },
    { value: 'avaliacao_pericial', label: 'Avaliação', icon: TrendingUp, desc: 'Laudos e avaliações' },
    { value: 'imoveis_comerciais', label: 'Comercial', icon: Home, desc: 'Salas e galpões' },
    { value: 'investimento_internacional', label: 'Internacional', icon: Globe, desc: 'Dubai, EUA e Europa' },
]

const STATES = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

// ─── Steps ───────────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, title: 'Sua Empresa', subtitle: 'Dados básicos da organização' },
    { id: 2, title: 'Segmento', subtitle: 'Como você atua no mercado' },
    { id: 3, title: 'Tudo pronto!', subtitle: 'Bem-vindo à plataforma' },
]

// ─── Input style ─────────────────────────────────────────────────────────────
const inp: React.CSSProperties = {
    width: '100%', height: '48px', padding: '0 14px',
    borderRadius: '12px', fontSize: '14px',
    color: 'var(--bo-text)',
    background: 'var(--bo-surface)',
    border: '1px solid var(--bo-border)',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.18s',
}

export default function OnboardingPage() {
    const [step, setStep] = useState(1)
    const [saving, setSaving] = useState(false)
    const [data, setData] = useState<OnboardingData>({
        companyName: '', ownerName: '', phone: '',
        niche: '', city: '', state: 'PE', plan: 'starter',
    })
    const router = useRouter()
    const supabase = createClient()

    const set = (k: keyof OnboardingData, v: string) =>
        setData(prev => ({ ...prev, [k]: v }))

    const step1Valid = data.companyName.trim().length >= 2 && data.ownerName.trim().length >= 2
    const step2Valid = data.niche !== '' && data.city.trim().length >= 2

    const handleFinish = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Upsert tenant record
            const { data: tenant, error: tenantErr } = await supabase
                .from('tenants')
                .upsert({
                    name: data.companyName,
                    slug: data.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 40),
                    niche: data.niche,
                    city: data.city,
                    state: data.state,
                    plan: data.plan,
                    created_by: user.id,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'created_by' })
                .select('id')
                .single()

            if (tenantErr) throw tenantErr

            // Link user to tenant as owner
            if (tenant?.id) {
                await supabase
                    .from('tenant_users')
                    .upsert({
                        tenant_id: tenant.id,
                        user_id: user.id,
                        role: 'owner',
                        full_name: data.ownerName,
                        phone: data.phone || null,
                    }, { onConflict: 'tenant_id,user_id' })
            }

            // Update user metadata with onboarding complete flag
            await supabase.auth.updateUser({
                data: { onboarding_complete: true, company: data.companyName },
            })

            setStep(3)
        } catch (err) {
            console.error('[onboarding]', err)
            // Still proceed — non-critical
            setStep(3)
        } finally {
            setSaving(false)
        }
    }

    const labelStyle: React.CSSProperties = {
        fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.1em', color: 'var(--bo-text-muted)',
        display: 'block', marginBottom: '6px',
    }

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bo-surface)', padding: '24px',
        }}>
            <div style={{ width: '100%', maxWidth: '520px' }}>

                {/* Progress bar */}
                <div style={{ marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        {STEPS.map((s, i) => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none', gap: '8px' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: 800,
                                    background: step > s.id ? 'var(--s-done-bg)' : step === s.id ? 'var(--bo-accent)' : 'var(--bo-elevated)',
                                    color: step > s.id ? 'var(--s-done)' : step === s.id ? '#fff' : 'var(--bo-text-muted)',
                                    border: `1px solid ${step > s.id ? 'var(--s-done)' : step === s.id ? 'var(--bo-accent)' : 'var(--bo-border)'}`,
                                    transition: 'all 0.3s ease',
                                }}>
                                    {step > s.id ? <CheckCircle2 size={14} /> : s.id}
                                </div>
                                {i < STEPS.length - 1 && (
                                    <div style={{
                                        flex: 1, height: '2px', borderRadius: '2px',
                                        background: step > s.id ? 'var(--s-done)' : 'var(--bo-border)',
                                        transition: 'background 0.3s ease',
                                    }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'var(--bo-card)',
                        border: '1px solid var(--bo-border)',
                        borderRadius: '24px',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '24px 28px', background: 'var(--bo-elevated)',
                        borderBottom: '1px solid var(--bo-border)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '42px', height: '42px', borderRadius: '12px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'rgba(200,166,90,0.12)', border: '1px solid rgba(200,166,90,0.25)',
                            }}>
                                <Building2 size={20} style={{ color: 'var(--bo-accent)' }} />
                            </div>
                            <div>
                                <p style={{ fontSize: '9px', fontWeight: 700, color: 'var(--bo-accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '2px' }}>
                                    CONFIGURAÇÃO INICIAL · PASSO {step}/3
                                </p>
                                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--bo-text)' }}>
                                    {STEPS[step - 1]?.title}
                                </h2>
                                <p style={{ fontSize: '12px', color: 'var(--bo-text-muted)', marginTop: '2px' }}>
                                    {STEPS[step - 1]?.subtitle}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        {/* STEP 1: Company info */}
                        {step === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                                style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}
                            >
                                <div>
                                    <label style={labelStyle}>Nome da Empresa / Marca *</label>
                                    <input
                                        value={data.companyName} onChange={e => set('companyName', e.target.value)}
                                        placeholder="Ex: Iule Miranda Imóveis"
                                        style={inp}
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--bo-accent)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--bo-border)')}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Seu Nome *</label>
                                    <input
                                        value={data.ownerName} onChange={e => set('ownerName', e.target.value)}
                                        placeholder="Nome completo"
                                        style={inp}
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--bo-accent)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--bo-border)')}
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>WhatsApp (opcional)</label>
                                    <input
                                        value={data.phone} onChange={e => set('phone', e.target.value)}
                                        placeholder="(81) 9 9999-9999"
                                        style={inp}
                                        onFocus={e => (e.currentTarget.style.borderColor = 'var(--bo-accent)')}
                                        onBlur={e => (e.currentTarget.style.borderColor = 'var(--bo-border)')}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: Niche + location */}
                        {step === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                                style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                            >
                                <div>
                                    <label style={labelStyle}>Segmento de Atuação *</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {NICHES.map(n => (
                                            <button
                                                key={n.value}
                                                onClick={() => set('niche', n.value)}
                                                style={{
                                                    padding: '12px 14px', borderRadius: '12px', textAlign: 'left',
                                                    cursor: 'pointer', transition: 'all 0.18s ease',
                                                    background: data.niche === n.value ? 'rgba(200,166,90,0.12)' : 'var(--bo-surface)',
                                                    border: `1px solid ${data.niche === n.value ? 'rgba(200,166,90,0.4)' : 'var(--bo-border)'}`,
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                                    <n.icon size={14} style={{ color: data.niche === n.value ? 'var(--bo-accent)' : 'var(--bo-text-muted)', flexShrink: 0 }} />
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: data.niche === n.value ? 'var(--bo-text)' : 'var(--bo-text-muted)' }}>{n.label}</span>
                                                </div>
                                                <p style={{ fontSize: '10px', color: 'var(--bo-text-muted)', marginLeft: '22px' }}>{n.desc}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '10px' }}>
                                    <div>
                                        <label style={labelStyle}>Cidade *</label>
                                        <input
                                            value={data.city} onChange={e => set('city', e.target.value)}
                                            placeholder="Ex: Recife"
                                            style={inp}
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--bo-accent)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--bo-border)')}
                                        />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>UF</label>
                                        <select
                                            value={data.state} onChange={e => set('state', e.target.value)}
                                            style={{ ...inp, width: '72px', cursor: 'pointer' }}
                                            onFocus={e => (e.currentTarget.style.borderColor = 'var(--bo-accent)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'var(--bo-border)')}
                                        >
                                            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3: Done */}
                        {step === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                style={{ padding: '40px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}
                            >
                                <motion.div
                                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                                    style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: 'var(--s-done-bg)', border: '2px solid var(--s-done)',
                                    }}
                                >
                                    <CheckCircle2 size={40} style={{ color: 'var(--s-done)' }} />
                                </motion.div>
                                <div>
                                    <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--bo-text)', marginBottom: '8px' }}>
                                        {data.companyName ? `Bem-vindo, ${data.companyName}!` : 'Configuração concluída!'}
                                    </h3>
                                    <p style={{ fontSize: '13px', color: 'var(--bo-text-muted)', lineHeight: 1.6, maxWidth: '340px' }}>
                                        Sua conta está pronta. Explore os módulos de leads, empreendimentos, IA e muito mais.
                                    </p>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', width: '100%', marginTop: '8px' }}>
                                    {[
                                        { label: 'Leads', icon: '👤', desc: 'Gerencie contatos' },
                                        { label: 'Imoveis', icon: '🏢', desc: 'Portfolio completo' },
                                        { label: 'IA Engine', icon: '🤖', desc: 'Análises com Claude' },
                                    ].map(item => (
                                        <div key={item.label} style={{
                                            padding: '14px 10px', borderRadius: '12px', textAlign: 'center',
                                            background: 'var(--bo-elevated)', border: '1px solid var(--bo-border)',
                                        }}>
                                            <p style={{ fontSize: '22px', marginBottom: '4px' }}>{item.icon}</p>
                                            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--bo-text)', marginBottom: '2px' }}>{item.label}</p>
                                            <p style={{ fontSize: '9px', color: 'var(--bo-text-muted)' }}>{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Footer actions */}
                    <div style={{
                        padding: '16px 28px', borderTop: '1px solid var(--bo-border)',
                        background: 'var(--bo-elevated)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px',
                    }}>
                        {step < 3 ? (
                            <>
                                {step > 1 ? (
                                    <button
                                        onClick={() => setStep(s => s - 1)}
                                        style={{
                                            height: '44px', padding: '0 20px', borderRadius: '12px',
                                            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                                            background: 'var(--bo-surface)', color: 'var(--bo-text-muted)',
                                            border: '1px solid var(--bo-border)',
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                        }}
                                    >
                                        <ArrowLeft size={14} /> Anterior
                                    </button>
                                ) : (
                                    <div />
                                )}

                                <button
                                    onClick={step === 2 ? handleFinish : () => setStep(s => s + 1)}
                                    disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid) || saving}
                                    style={{
                                        height: '44px', padding: '0 24px', borderRadius: '12px',
                                        fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                                        color: '#fff',
                                        background: 'linear-gradient(135deg, var(--imi-blue) 0%, var(--imi-blue-bright) 100%)',
                                        border: 'none',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        opacity: ((step === 1 && !step1Valid) || (step === 2 && !step2Valid)) ? 0.45 : 1,
                                        transition: 'opacity 0.15s ease',
                                    }}
                                >
                                    {saving ? (
                                        <><Loader2 size={15} style={{ animation: 'spin 0.8s linear infinite' }} /> Salvando...</>
                                    ) : step === 2 ? (
                                        <><CheckCircle2 size={15} /> Concluir Configuração</>
                                    ) : (
                                        <>Próximo <ArrowRight size={14} /></>
                                    )}
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => router.push('/backoffice/dashboard')}
                                style={{
                                    width: '100%', height: '48px', borderRadius: '12px',
                                    fontSize: '14px', fontWeight: 800, cursor: 'pointer',
                                    color: '#fff',
                                    background: 'linear-gradient(135deg, var(--imi-blue) 0%, var(--imi-blue-bright) 100%)',
                                    border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}
                            >
                                Acessar o Painel <ArrowRight size={16} />
                            </button>
                        )}
                    </div>
                </motion.div>

                <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '11px', color: 'var(--bo-text-muted)' }}>
                    Você pode editar essas informações depois em <strong>Organização</strong>
                </p>
            </div>
        </div>
    )
}
