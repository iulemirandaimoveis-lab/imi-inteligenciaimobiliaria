'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, Mail, Shield, Loader2, Copy, Check, UserCheck, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'
import { createClient } from '@/lib/supabase/client'

export default function NovoUsuarioPage() {
    const router = useRouter()
    const [form, setForm] = useState({ name: '', email: '', role: 'CORRETOR' })
    const [loading, setLoading] = useState(false)
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
    const [created, setCreated] = useState<{ name: string; email: string; inviteLink: string | null } | null>(null)
    const [copied, setCopied] = useState(false)

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
            toast.success(data.message || `Usuário ${form.name} criado com sucesso`)
            setCreated({ name: form.name, email: form.email, inviteLink: data.inviteLink || null })
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erro desconhecido')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = async () => {
        if (!created?.inviteLink) return
        try {
            await navigator.clipboard.writeText(created.inviteLink)
            setCopied(true)
            toast.success('Link copiado!')
            setTimeout(() => setCopied(false), 3000)
        } catch {
            toast.error('Não foi possível copiar. Selecione e copie manualmente.')
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

    // ── Success screen: show invite link ──────────────────────────────────────
    if (created) {
        return (
            <div className="max-w-2xl space-y-6">
                <PageIntelHeader
                    title="Usuário Criado"
                    subtitle="Compartilhe o link de acesso com o usuário"
                    actions={
                        <button type="button" onClick={() => router.push('/backoffice/settings/usuarios')}
                            className="flex items-center gap-2 h-11 px-5 rounded-[6px] text-sm font-medium transition-all"
                            style={{ border: `1px solid ${T.border}`, color: T.textMuted, background: T.elevated }}>
                            <ArrowLeft size={16} /> Voltar para Usuários
                        </button>
                    }
                />

                <div className="rounded-lg p-6 space-y-5" style={{ background: T.elevated, border: `1px solid ${T.border}` }}>
                    {/* Success indicator */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(107,184,123,0.15)', border: '1px solid rgba(107,184,123,0.3)' }}>
                            <UserCheck size={18} style={{ color: 'var(--success, #6bb87b)' }} />
                        </div>
                        <div>
                            <p className="font-semibold text-sm" style={{ color: T.text }}>{created.name}</p>
                            <p className="text-xs" style={{ color: T.textMuted }}>{created.email}</p>
                        </div>
                    </div>

                    <hr style={{ borderColor: T.border }} />

                    {created.inviteLink ? (
                        <>
                            {/* Instructions */}
                            <div>
                                <p className="text-sm font-semibold mb-1" style={{ color: T.text }}>
                                    Link de primeiro acesso
                                </p>
                                <p className="text-xs" style={{ color: T.textMuted }}>
                                    Copie e envie este link para <strong style={{ color: T.text }}>{created.name}</strong> via WhatsApp ou outro canal.
                                    Ao clicar, o usuário poderá definir sua própria senha e acessar o sistema.
                                </p>
                            </div>

                            {/* Link box */}
                            <div className="rounded-lg p-3 flex items-center gap-3"
                                style={{ background: 'rgba(72,101,129,0.08)', border: '1px solid rgba(72,101,129,0.2)' }}>
                                <p className="flex-1 text-xs break-all select-all" style={{ color: T.textMuted, fontFamily: 'monospace' }}>
                                    {created.inviteLink}
                                </p>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-xs font-semibold flex-shrink-0 transition-all hover:brightness-110"
                                    style={{
                                        background: copied ? 'rgba(107,184,123,0.15)' : 'rgba(200,164,74,0.12)',
                                        border: copied ? '1px solid rgba(107,184,123,0.3)' : '1px solid rgba(200,164,74,0.3)',
                                        color: copied ? 'var(--success, #6bb87b)' : 'var(--gold, #C8A44A)',
                                    }}>
                                    {copied ? <Check size={13} /> : <Copy size={13} />}
                                    {copied ? 'Copiado!' : 'Copiar'}
                                </button>
                            </div>

                            <p className="text-xs" style={{ color: T.textMuted }}>
                                O link expira em 24 horas. Se necessário, gere um novo pela lista de usuários (botão Resetar Senha).
                            </p>
                        </>
                    ) : (
                        /* Email not configured and link generation failed */
                        <div className="rounded-lg p-4" style={{ background: 'rgba(229,115,115,0.08)', border: '1px solid rgba(229,115,115,0.2)' }}>
                            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--error)' }}>Link não gerado</p>
                            <p className="text-xs" style={{ color: T.textMuted }}>
                                O usuário foi criado, mas não foi possível gerar o link de acesso.
                                Vá para a lista de usuários e use o botão <strong>Resetar Senha</strong> para gerar um novo link.
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={() => { setCreated(null); setForm({ name: '', email: '', role: 'CORRETOR' }) }}
                            className="flex-1 h-11 rounded-[6px] text-sm font-medium transition-all"
                            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted }}>
                            Criar outro usuário
                        </button>
                        <button
                            onClick={() => router.push('/backoffice/settings/usuarios')}
                            className="flex-1 h-11 rounded-[6px] text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:brightness-110"
                            style={{ background: 'var(--btn-primary-bg, var(--accent-400))', color: 'white' }}>
                            <ExternalLink size={14} />
                            Ver usuários
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Create form ───────────────────────────────────────────────────────────
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
                            Após criar o usuário, você receberá um <strong>link de primeiro acesso</strong> para
                            compartilhar manualmente (WhatsApp, etc.). O usuário define a própria senha ao clicar no link.
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
                            style={{ background: 'var(--btn-primary-bg, var(--accent-400))' }}>
                            {loading && <Loader2 size={15} className="animate-spin" />}
                            {loading ? 'Criando usuário...' : 'Criar Usuário'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
