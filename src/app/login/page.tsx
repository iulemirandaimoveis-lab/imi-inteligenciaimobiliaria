'use client'
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Building2, ShieldCheck, Zap, BarChart3 } from 'lucide-react'
import Link from 'next/link'

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
            if (session) {
                router.push('/backoffice/dashboard')
            }
        }
        checkAuth()
    }, [router, supabase])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            })

            if (authError) {
                setError('Credenciais inválidas. Verifique seu e-mail e senha.')
                return
            }

            if (data.session) {
                router.push('/backoffice/dashboard')
                router.refresh()
            }
        } catch (err) {
            setError('Erro técnico ao processar login.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-background-light dark:bg-background-dark">
            {/* Left Side - Luxury Branding */}
            <div className="hidden lg:flex lg:w-[60%] bg-background-dark p-20 flex-col justify-between relative overflow-hidden">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('/grid.svg')]" />

                {/* Decorative Blobs */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />

                {/* Logo Section */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <span
                            className="text-2xl font-bold tracking-tight transition-colors text-white"
                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        >
                            IMI
                        </span>
                        <div className="h-6 w-px bg-white/20"></div>
                        <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.15em] leading-[1.1] text-gray-400">
                            Inteligência<br />Imobiliária
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="relative z-10 max-w-xl">
                    <h2 className="text-5xl font-display font-bold text-white leading-[1.1] mb-8">
                        A plataforma definitiva para <span className="text-primary italic">Alta Performance</span> Imobiliária.
                    </h2>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                                <Zap size={20} />
                            </div>
                            <h3 className="font-bold text-white">Automação IA</h3>
                            <p className="text-sm text-gray-400">Geração de conteúdo e gestão de leads assistida por inteligência artificial.</p>
                        </div>
                        <div className="space-y-3">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary border border-white/10">
                                <BarChart3 size={20} />
                            </div>
                            <h3 className="font-bold text-white">Analytics 360</h3>
                            <p className="text-sm text-gray-400">Dashboards em tempo real para controle total de ROI e conversão.</p>
                        </div>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-8">
                    <p className="text-xs text-gray-500 font-medium">© 2026 IMI – Inteligência Imobiliária</p>
                    <div className="flex gap-4">
                        <ShieldCheck size={16} className="text-gray-600" />
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form (sempre dark) */}
            <div className="w-full lg:w-[40%] flex items-center justify-center p-8 relative" style={{ background: '#0D1117' }}>
                {/* Subtle grid overlay */}
                <div className="absolute inset-0 opacity-[0.025] bg-[url('/grid.svg')]" />
                {/* Glow */}
                <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full blur-[120px]" style={{ background: 'rgba(72,101,129,0.15)' }} />

                <div className="w-full max-w-md relative z-10">
                    {/* Brand Header Mobile */}
                    <div className="lg:hidden mb-12 flex flex-col items-center">
                        <div className="flex items-center gap-3">
                            <span
                                className="text-2xl font-bold tracking-tight text-white"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                IMI
                            </span>
                            <div className="h-6 w-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
                            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.15em] leading-[1.1]" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                Inteligência<br />Imobiliária
                            </span>
                        </div>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-4xl font-display font-bold text-white mb-3">Bem-vindo</h1>
                        <p className="font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Insira suas credenciais para acessar o painel.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-14 px-5 rounded-2xl text-white font-medium transition-all focus:outline-none"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    caretColor: '#486581',
                                }}
                                onFocus={e => e.currentTarget.style.borderColor = 'rgba(72,101,129,0.6)'}
                                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                                placeholder="seu@email.com.br"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Senha</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-14 px-5 rounded-2xl text-white font-medium transition-all focus:outline-none"
                                    style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        caretColor: '#486581',
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = 'rgba(72,101,129,0.6)'}
                                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 transition-colors"
                                    style={{ color: 'rgba(255,255,255,0.3)' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                                <p className="text-red-400 text-xs font-bold text-center uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-[56px] rounded-2xl font-black text-[15px] transition-all disabled:opacity-40 flex items-center justify-center gap-3 mt-2"
                            style={{ background: '#FFFFFF', color: '#102A43', letterSpacing: '0.04em' }}
                            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#F0F4F8' }}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#FFFFFF'}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} style={{ color: '#102A43' }} />
                            ) : (
                                'Acessar Backoffice'
                            )}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <Link href="/" className="font-bold transition-colors uppercase tracking-widest text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            ← Voltar para o Site
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
