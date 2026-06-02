'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

/* Login-specific design tokens (self-contained, no theme import needed) */
const T = {
    bg: '#050B14',
    n: '#0A1624',
    gold: '#C8A44A',
    t1: '#E8E4DC',
    t3: '#4F5B6B',
    g10: 'rgba(200,164,74,.06)',
    g20: 'rgba(200,164,74,.14)',
    inputBg: 'rgba(20,36,64,.4)',
    inputBorder: 'rgba(200,164,74,.35)',
    focusShadow: 'rgba(200,164,74,.16)',
    playfair: "'Playfair Display', Georgia, serif",
    outfit: "'Outfit', system-ui, sans-serif",
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
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const dest = user.user_metadata?.setup_complete ? '/backoffice/dashboard' : '/backoffice/setup'
                router.push(dest)
            }
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
                setError('Credenciais inv\u00e1lidas. Verifique seu e-mail e senha.')
                return
            }
            if (data.session) {
                const dest = data.user?.user_metadata?.setup_complete ? '/backoffice/dashboard' : '/backoffice/setup'
                router.push(dest)
                router.refresh()
            }
        } catch {
            setError('Erro t\u00e9cnico ao processar login.')
        } finally {
            setLoading(false)
        }
    }

    /* ─── Inline style objects ─── */

    const pageStyle: React.CSSProperties = {
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.bg,
        position: 'relative',
        fontFamily: T.outfit,
        margin: 0,
        padding: 0,
    }

    const grainStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        opacity: 0.015,
        pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px',
        mixBlendMode: 'overlay',
    }

    const cardStyle: React.CSSProperties = {
        width: '100%',
        maxWidth: '420px',
        padding: '32px',
        position: 'relative',
        zIndex: 1,
        boxSizing: 'border-box',
    }

    const logoWrapStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '36px',
        justifyContent: 'center',
    }

    const logoTextStyle: React.CSSProperties = {
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: 700,
        fontSize: '20px',
        color: '#FFFFFF',
        letterSpacing: '2px',
        lineHeight: 1,
    }

    const logoSepStyle: React.CSSProperties = {
        width: '1px',
        height: '28px',
        background: '#C8A44A',
        flexShrink: 0,
    }

    const logoTagStyle: React.CSSProperties = {
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        color: '#C8A44A',
        lineHeight: 1.45,
    }

    const titleStyle: React.CSSProperties = {
        fontFamily: T.playfair,
        fontWeight: 500,
        fontSize: '22px',
        color: '#FFFFFF',
        margin: 0,
        textAlign: 'center',
    }

    const subtitleStyle: React.CSSProperties = {
        fontFamily: T.outfit,
        fontWeight: 400,
        fontSize: '11px',
        color: T.t3,
        margin: '4px 0 0 0',
        textAlign: 'center',
    }

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontFamily: T.outfit,
        fontWeight: 500,
        fontSize: '11px',
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        color: T.t3,
        marginBottom: '6px',
        marginLeft: '2px',
    }

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '10px 14px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: T.outfit,
        fontWeight: 400,
        color: T.t1,
        background: T.inputBg,
        border: `1px solid ${T.inputBorder}`,
        outline: 'none',
        caretColor: T.gold,
        boxSizing: 'border-box',
        boxShadow: `0 0 0 1px rgba(200,164,74,.22)`,
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
    }

    const btnStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontFamily: T.outfit,
        fontWeight: 600,
        fontSize: '11px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        cursor: loading ? 'not-allowed' : 'pointer',
        padding: '12px 22px',
        borderRadius: '6px',
        background: T.n,
        color: '#FFFFFF',
        border: '1px solid rgba(255,255,255,.08)',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        opacity: loading ? 0.65 : 1,
        transition: 'all 0.18s ease',
    }

    const goldLineStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: 0,
        left: '12%',
        right: '12%',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)`,
        opacity: 0.6,
        borderRadius: '1px',
        pointerEvents: 'none',
    }

    const forgotStyle: React.CSSProperties = {
        fontFamily: T.outfit,
        fontWeight: 400,
        fontSize: '11px',
        color: T.t3,
        textDecoration: 'none',
        transition: 'color 0.15s',
        display: 'block',
        textAlign: 'center',
        marginTop: '16px',
    }

    const badgeStyle: React.CSSProperties = {
        fontFamily: T.outfit,
        fontWeight: 600,
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        color: T.gold,
        background: T.g10,
        border: `1px solid ${T.g20}`,
        borderRadius: '99px',
        padding: '3px 10px',
        lineHeight: 1,
    }

    const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = T.gold
        e.currentTarget.style.boxShadow = `0 0 0 3px ${T.focusShadow}`
    }

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.borderColor = T.inputBorder
        e.currentTarget.style.boxShadow = '0 0 0 1px rgba(200,164,74,.22)'
    }

    return (
        <div style={pageStyle}>
            {/* Film grain */}
            <div style={grainStyle} />

            {/* Card */}
            <div style={cardStyle}>

                {/* Logo */}
                <div style={logoWrapStyle}>
                    <span style={logoTextStyle}>IMI</span>
                    <div style={logoSepStyle} />
                    <span style={logoTagStyle}>INTELIG&Ecirc;NCIA<br />IMOBILI&Aacute;RIA</span>
                </div>

                {/* Title */}
                <div style={{ marginBottom: '28px' }}>
                    <h1 style={titleStyle}>Acessar</h1>
                    <p style={subtitleStyle}>Backoffice IMI</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                    {/* Email */}
                    <div>
                        <label style={labelStyle}>E-MAIL</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu@email.com.br"
                            required
                            style={inputStyle}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label style={labelStyle}>SENHA</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{ ...inputStyle, paddingRight: '42px' }}
                                onFocus={handleInputFocus}
                                onBlur={handleInputBlur}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: T.t3,
                                    padding: '4px',
                                    transition: 'color 0.15s',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.color = T.gold }}
                                onMouseLeave={e => { e.currentTarget.style.color = T.t3 }}
                            >
                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.18)',
                        }}>
                            <p style={{
                                fontSize: '11px',
                                fontFamily: T.outfit,
                                color: '#F87171',
                                fontWeight: 600,
                                textAlign: 'center',
                                margin: 0,
                            }}>{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div style={{ position: 'relative', marginTop: '4px' }}>
                        <button
                            type="submit"
                            disabled={loading}
                            style={btnStyle}
                            onMouseEnter={e => {
                                if (!loading) {
                                    e.currentTarget.style.background = '#0F1F33'
                                    e.currentTarget.style.transform = 'translateY(-1px)'
                                }
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = T.n
                                e.currentTarget.style.transform = 'translateY(0)'
                            }}
                        >
                            {loading
                                ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                                : 'ENTRAR'
                            }
                        </button>
                        {/* Gold gradient line */}
                        <div style={goldLineStyle} />
                    </div>
                </form>

                {/* Forgot password */}
                <Link
                    href="/login/reset"
                    style={forgotStyle}
                    onMouseEnter={e => { e.currentTarget.style.color = T.gold }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.t3 }}
                >
                    Esqueceu a senha?
                </Link>

                <Link
                    href="/login/primeiro-acesso"
                    style={{
                        ...forgotStyle,
                        marginTop: '10px',
                        color: T.gold,
                        border: `1px solid ${T.g20}`,
                        borderRadius: '8px',
                        padding: '10px 12px',
                        background: T.g10,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.gold }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.gold }}
                >
                    Primeiro acesso? Definir senha com senha provisória
                </Link>

                {/* Bottom badges */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '32px',
                }}>
                    {['SSO', '2FA', 'LGPD'].map(b => (
                        <span key={b} style={badgeStyle}>{b}</span>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: ${T.t3} !important; opacity: 1 !important; }
            `}</style>
        </div>
    )
}
