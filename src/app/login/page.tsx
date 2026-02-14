'use client'

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
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-background-dark font-display font-bold text-3xl shadow-glow">
                            I
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-white tracking-tight">IMI Atlantis</h1>
                            <p className="text-xs font-black text-primary uppercase tracking-[0.3em]">Inteligência Imobiliária</p>
                        </div>
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
                    <p className="text-xs text-gray-500 font-medium">© 2026 IMI ATLANTIS. LUXURY REAL ESTATE HUB.</p>
                    <div className="flex gap-4">
                        <ShieldCheck size={16} className="text-gray-600" />
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-white dark:bg-background-dark relative">
                <div className="w-full max-w-md">
                    {/* Brand Header Mobile */}
                    <div className="lg:hidden mb-12 flex flex-col items-center">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-background-dark font-display font-bold text-3xl shadow-glow mb-4">
                            I
                        </div>
                        <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">IMI Admin</h2>
                    </div>

                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-3">Bem-vindo</h1>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Insira suas credenciais para acessar o painel administrativo.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-14 px-6 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                placeholder="colaborador@imi.com.br"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-14 px-6 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl p-4 animate-shake">
                                <p className="text-red-600 dark:text-red-400 text-xs font-bold text-center uppercase tracking-wider">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-primary dark:bg-primary text-background-dark rounded-3xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 shadow-glow disabled:shadow-none flex items-center justify-center gap-3 mt-4"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                'Acessar Backoffice'
                            )}
                        </button>
                    </form>

                    <div className="mt-12 text-center text-sm">
                        <Link href="/" className="text-gray-500 hover:text-primary font-bold transition-colors uppercase tracking-widest text-[10px]">
                            ← Voltar para o Site Principal
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
