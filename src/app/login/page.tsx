'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, ShieldCheck, Zap, BarChart3, TrendingUp, Users, Building2 } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

// Animated counter hook
function useCounter(target: number, duration = 1200) {
    const [value, setValue] = useState(0)
    useEffect(() => {
        let start = 0
        const step = target / (duration / 16)
        const timer = setInterval(() => {
            start += step
            if (start >= target) { setValue(target); clearInterval(timer) }
            else setValue(Math.floor(start))
        }, 16)
        return () => clearInterval(timer)
    }, [target, duration])
    return value
}

const STATS = [
    { icon: Users, label: 'Leads Gerenciados', value: 847, suffix: '+', color: '#486581' },
    { icon: Building2, label: 'Empreendimentos', value: 124, suffix: '', color: '#627D98' },
    { icon: TrendingUp, label: 'Em Carteira', value: 8, suffix: '.2M', prefix: 'R$', color: '#486581' },
]

function StatCard({ stat, index }: { stat: typeof STATS[0], index: number }) {
    const val = useCounter(stat.value, 1400 + index * 200)
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.15, duration: 0.5 }}
            style={{
                padding: '14px 18px', borderRadius: '14px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${stat.color}22`, border: `1px solid ${stat.color}44`,
                }}>
                    <stat.icon size={15} style={{ color: stat.color }} />
                </div>
                <div>
                    <p style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {stat.prefix || ''}{val}{stat.suffix}
                    </p>
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: '2px' }}>{stat.label}</p>
                </div>
            </div>
        </motion.div>
    )
}

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) router.push('/backoffice/dashboard')
        }
        checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
            if (authError) {
                setError('Credenciais inválidas. Verifique seu e-mail e senha.')
                return
            }
            if (data.session) {
                router.push('/backoffice/dashboard')
                router.refresh()
            }
        } catch {
            setError('Erro técnico ao processar login.')
        } finally {
            setLoading(false)
        }
    }

    const inputBase: React.CSSProperties = {
        width: '100%', height: '52px', padding: '0 16px',
        borderRadius: '14px', fontSize: '14px', color: '#fff',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        outline: 'none', caretColor: '#486581',
        transition: 'border-color 0.18s ease',
        boxSizing: 'border-box',
    }

    return (
        <div style={{ minHeight: '100dvh', display: 'flex', background: '#080E18' }}>

            {/* ── Left Panel ── */}
            <div style={{
                display: 'none',
                width: '58%', padding: '48px 56px', flexDirection: 'column',
                justifyContent: 'space-between', position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(160deg, #0D1A2A 0%, #0A1520 50%, #060E18 100%)',
            }}
                className="lg:flex"
            >
                {/* Dot grid pattern */}
                <div style={{
                    position: 'absolute', inset: 0, opacity: 0.035,
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                }} />
                {/* Glow blobs */}
                <div style={{ position: 'absolute', top: '-80px', left: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(72,101,129,0.12)', filter: 'blur(100px)' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(51,78,104,0.10)', filter: 'blur(80px)' }} />

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ position: 'relative', zIndex: 2 }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                            fontSize: '24px', fontWeight: 800, color: '#FFFFFF',
                            fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: '-0.01em',
                        }}>IMI</span>
                        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />
                        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>
                            Inteligência<br />Imobiliária
                        </span>
                    </div>
                </motion.div>

                {/* Hero content */}
                <div style={{ position: 'relative', zIndex: 2, maxWidth: '520px' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            marginBottom: '20px', padding: '5px 14px', borderRadius: '99px',
                            background: 'rgba(72,101,129,0.15)', border: '1px solid rgba(72,101,129,0.25)',
                        }}
                    >
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', animation: 'pulse 2s ease-in-out infinite' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                            Plataforma ao vivo
                        </span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.6 }}
                        style={{
                            fontSize: '42px', fontWeight: 800, color: '#FFFFFF',
                            lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-0.02em',
                            fontFamily: "'Playfair Display', Georgia, serif",
                        }}
                    >
                        A plataforma definitiva para{' '}
                        <span style={{ color: '#627D98', fontStyle: 'italic' }}>Alta Performance</span>{' '}
                        Imobiliária.
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}
                    >
                        {[
                            { icon: Zap, title: 'Automação IA', desc: 'Geração de conteúdo e gestão de leads com inteligência artificial.' },
                            { icon: BarChart3, title: 'Analytics 360', desc: 'Dashboards em tempo real para controle de ROI e conversão.' },
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '10px' }}>
                                    <item.icon size={16} style={{ color: '#627D98' }} />
                                </div>
                                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{item.title}</p>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                        {STATS.map((s, i) => <StatCard key={s.label} stat={s} index={i} />)}
                    </div>
                </div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    style={{
                        position: 'relative', zIndex: 2,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '20px',
                    }}
                >
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>© 2026 IMI — Inteligência Imobiliária</p>
                    <ShieldCheck size={15} style={{ color: 'rgba(255,255,255,0.2)' }} />
                </motion.div>
                <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
            </div>

            {/* ── Right Panel — Form ── */}
            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '32px 24px', position: 'relative',
                background: 'linear-gradient(160deg, #0D1117 0%, #080E18 100%)',
            }}>
                {/* Subtle glow */}
                <div style={{ position: 'absolute', top: '20%', right: '-40px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(72,101,129,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}
                >
                    {/* Mobile logo */}
                    <div className="lg:hidden" style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: "'Playfair Display', Georgia, serif" }}>IMI</span>
                        <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.15)' }} />
                        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)' }}>Inteligência<br />Imobiliária</span>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px', letterSpacing: '-0.02em' }}>Bem-vindo</h1>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Insira suas credenciais para acessar o painel.</p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Email */}
                        <div>
                            <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', marginLeft: '2px' }}>
                                E-mail
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com.br"
                                required
                                style={inputBase}
                                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(72,101,129,0.55)')}
                                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', marginLeft: '2px' }}>
                                <label style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)' }}>
                                    Senha
                                </label>
                                <Link
                                    href="/login/reset"
                                    style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', letterSpacing: '0.05em' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                                >
                                    Esqueci minha senha
                                </Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ ...inputBase, paddingRight: '48px' }}
                                    onFocus={e => (e.currentTarget.style.borderColor = 'rgba(72,101,129,0.55)')}
                                    onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    style={{
                                        position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
                                        padding: '4px', transition: 'color 0.15s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
                                >
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                                style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                            >
                                <p style={{ fontSize: '12px', color: '#F87171', fontWeight: 600, textAlign: 'center' }}>{error}</p>
                            </motion.div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%', height: '52px', borderRadius: '14px',
                                fontSize: '14px', fontWeight: 800, letterSpacing: '0.04em',
                                color: '#0D1117', background: '#FFFFFF',
                                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.65 : 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                marginTop: '4px', transition: 'all 0.18s ease',
                            }}
                            onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.background = '#E8EEF4'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)' } }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)' }}
                        >
                            {loading
                                ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                                : 'Acessar Backoffice'
                            }
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </button>
                    </form>

                    <div style={{ marginTop: '28px', textAlign: 'center' }}>
                        <Link
                            href="/"
                            style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', textDecoration: 'none', transition: 'color 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.55)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                        >
                            ← Voltar para o Site
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
