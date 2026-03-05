'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Shield, Key, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const T = {
    surface: 'var(--bo-surface)',
    elevated: 'var(--bo-elevated)',
    border: 'var(--bo-border)',
    text: 'var(--bo-text)',
    textMuted: 'var(--bo-text-muted)',
}

export default function NovoUsuarioPage() {
    const router = useRouter()
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'EDITOR' })
    const [loading, setLoading] = useState(false)

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim() || !form.email.trim() || !form.password) {
            toast.error('Preencha todos os campos obrigatórios')
            return
        }
        if (form.password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres')
            return
        }
        setLoading(true)
        try {
            const response = await fetch('/api/backoffice/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Erro ao criar o usuário')
            toast.success(`Usuário "${form.name}" criado com sucesso!`)
            router.push('/backoffice/settings/usuarios')
            router.refresh()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const inputStyle: React.CSSProperties = {
        background: T.elevated,
        border: `1px solid ${T.border}`,
        color: T.text,
        height: '44px',
        borderRadius: '12px',
        padding: '0 14px 0 42px',
        fontSize: '14px',
        outline: 'none',
        width: '100%',
    }

    return (
        <div className="max-w-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/backoffice/settings/usuarios"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                    style={{ background: T.elevated, border: `1px solid ${T.border}` }}
                >
                    <ArrowLeft size={18} style={{ color: T.textMuted }} />
                </Link>
                <div>
                    <h1 className="text-xl font-bold" style={{ color: T.text }}>Novo Usuário</h1>
                    <p className="text-sm mt-0.5" style={{ color: T.textMuted }}>
                        Adicionar um novo usuário ao sistema
                    </p>
                </div>
            </div>

            {/* Form card */}
            <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <form onSubmit={handleCreate} className="space-y-5">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textMuted }}>
                            Nome Completo *
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="Nome do usuário"
                                style={inputStyle}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textMuted }}>
                            E-mail *
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                            <input
                                type="email"
                                required
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="usuario@dominio.com"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textMuted }}>
                            Senha Inicial *
                        </label>
                        <div className="relative">
                            <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="Mínimo 6 caracteres"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="text-xs font-semibold block mb-1.5" style={{ color: T.textMuted }}>
                            Nível de Acesso *
                        </label>
                        <div className="relative">
                            <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }} />
                            <select
                                required
                                value={form.role}
                                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                style={{ ...inputStyle, paddingRight: '14px' }}>
                                <option value="ADMIN">Administrador — Acesso total</option>
                                <option value="EDITOR">Corretor / Editor — Gestão de leads e imóveis</option>
                                <option value="VIEWER">Avaliador / Viewer — Apenas leitura</option>
                            </select>
                        </div>
                    </div>

                    {/* Info box */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(72,101,129,0.08)', border: '1px solid rgba(72,101,129,0.2)' }}>
                        <p className="text-xs" style={{ color: '#8CA4B8' }}>
                            💡 O usuário receberá as credenciais para acessar o sistema. A senha pode ser alterada no primeiro acesso.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => router.back()}
                            className="flex-1 h-11 rounded-xl text-sm font-medium transition-all"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                            style={{ background: loading ? '#334E68' : '#1E3A5F', boxShadow: loading ? 'none' : '0 2px 8px rgba(30,58,95,0.4)' }}>
                            {loading && <Loader2 size={15} className="animate-spin" />}
                            {loading ? 'Criando...' : 'Criar Usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
