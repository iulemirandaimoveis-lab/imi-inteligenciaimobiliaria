'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Mail, Shield, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
import { createClient } from '@/lib/supabase/client'

export default function NovoUsuarioPage() {
    const router = useRouter()
    const [form, setForm] = useState({ name: '', email: '', role: 'CORRETOR' })
    const [loading, setLoading] = useState(false)
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user) { router.replace('/backoffice/hoje'); return }
            supabase.from('profiles').select('role').eq('id', data.user.id).single()
                .then(({ data: profile }) => {
                    const role = profile?.role?.toUpperCase() || ''
                    const allowed = ['ADMIN', 'SUPER_ADMIN', 'OWNER'].includes(role)
                    setIsAdmin(allowed)
                    if (!allowed) router.replace('/backoffice/settings')
                })
        })
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim() || !form.email.trim()) {
            toast.error('Preencha todos os campos obrigatórios')
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
            toast.success(data.message || `Convite enviado para ${form.email}. O usuário receberá um link para definir sua senha.`)
            router.push('/backoffice/settings/usuarios')
            router.refresh()
        } catch (err: unknown) {
            toast.error((err instanceof Error ? err.message : 'Erro desconhecido'))
        } finally {
            setLoading(false)
        }
    }

    if (isAdmin === null) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 size={24} className="animate-spin" style={{ color: T.textMuted }} />
        </div>
    )

    const inputStyle: React.CSSProperties = {
        background: T.elevated,
        border: `1px solid ${T.border}`,
        color: T.text,
        height: '44px',
        borderRadius: '6px',
        padding: '0 14px 0 42px',
        fontSize: '14px',
        outline: 'none',
        width: '100%',
    }

    return (
        <div className="max-w-2xl space-y-6">
            <PageIntelHeader
                title="Novo Usuário"
                subtitle="Adicionar um novo usuário ao sistema"
                actions={
                    <button type="button" onClick={() => router.back()}
                        className="flex items-center gap-2 h-11 px-5 rounded-[6px] text-sm font-medium transition-all"
                        style={{ border: `1px solid ${T.border}`, color: T.textMuted, background: T.elevated }}>
                        <ArrowLeft size={16} /> Voltar
                    </button>
                }
            />

            {/* Form card */}
            <div className="rounded-lg p-6" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
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
                                <option value="GESTOR">Gestor — Gestão completa</option>
                                <option value="CORRETOR">Corretor — Leads, imóveis, agenda</option>
                                <option value="AVALIADOR">Avaliador — Laudos e avaliações</option>
                                <option value="MARKETING">Marketing — Campanhas e conteúdo</option>
                            </select>
                        </div>
                    </div>

                    {/* Info box */}
                    <div className="rounded-lg p-4" style={{ background: 'rgba(72,101,129,0.08)', border: '1px solid rgba(72,101,129,0.2)' }}>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            O usuario recebera um email para definir sua propria senha no primeiro acesso. Nao e necessario criar uma senha manualmente.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => router.back()}
                            className="flex-1 h-11 rounded-[6px] text-sm font-medium transition-all"
                            style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-11 rounded-[6px] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-60"
                            style={{ background: 'var(--btn-primary-bg)' }}>
                            {loading && <Loader2 size={15} className="animate-spin" />}
                            {loading ? 'Enviando convite...' : 'Convidar Usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
