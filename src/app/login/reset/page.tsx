'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

export default function ResetPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/login/update-password`,
            })
            if (resetError) throw resetError
            setSent(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao enviar e-mail de recuperação.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', background: 'linear-gradient(160deg, #0D1117 0%, #080E18 100%)',
        }}>
            {/* Glow */}
            <div style={{ position: 'absolute', top: '20%', right: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(72,101,129,0.07)', filter: 'blur(100px)', pointerEvents: 'none' }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}
            >
                {/* Back link */}
                <Link
                    href="/login"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                        textDecoration: 'none', marginBottom: '32px',
                        transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
                >
                    <ArrowLeft size={14} /> Voltar ao login
                </Link>

                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                    <span style={{ fontSize: '22px', fontWeight: 800, color: '#fff', fontFamily: "'Playfair Display', Georgia, serif" }}>IMI</span>
                    <div style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.15)' }} />
                    <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)' }}>
                        Inteligência<br />Imobiliária
                    </span>
                </div>

                <AnimatePresence mode="wait">
                    {!sent ? (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div style={{ marginBottom: '28px' }}>
                                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                                    Recuperar senha
                                </h1>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                                    Informe o e-mail da sua conta e enviaremos um link de redefinição.
                                </p>
                            </div>

                            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', marginLeft: '2px' }}>
                                        E-mail
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={15} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', pointerEvents: 'none' }} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            placeholder="seu@email.com.br"
                                            required
                                            style={{
                                                width: '100%', height: '52px', paddingLeft: '44px', paddingRight: '16px',
                                                borderRadius: '14px', fontSize: '14px', color: '#fff',
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                outline: 'none', caretColor: '#486581',
                                                transition: 'border-color 0.18s ease',
                                                boxSizing: 'border-box',
                                            }}
                                            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(72,101,129,0.55)')}
                                            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                                        <p style={{ fontSize: '12px', color: '#F87171', fontWeight: 600, textAlign: 'center' }}>{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%', height: '52px', borderRadius: '14px',
                                        fontSize: '14px', fontWeight: 800,
                                        color: '#0D1117', background: '#FFFFFF',
                                        border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.65 : 1,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                        transition: 'all 0.18s ease',
                                    }}
                                >
                                    {loading
                                        ? <><Loader2 size={17} style={{ animation: 'spin 0.8s linear infinite' }} /> Enviando...</>
                                        : 'Enviar Link de Recuperação'
                                    }
                                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ textAlign: 'center', padding: '12px 0' }}
                        >
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 280, damping: 18 }}
                                style={{
                                    width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 24px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.3)',
                                }}
                            >
                                <CheckCircle2 size={34} style={{ color: '#10B981' }} />
                            </motion.div>
                            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>E-mail enviado!</h2>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: '28px' }}>
                                Verifique sua caixa de entrada em <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{email}</strong> e clique no link para redefinir sua senha.
                            </p>
                            <Link
                                href="/login"
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                                    padding: '12px 24px', borderRadius: '14px', fontSize: '13px', fontWeight: 700,
                                    color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.06)',
                                    border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
                                }}
                            >
                                <ArrowLeft size={14} /> Voltar ao login
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
