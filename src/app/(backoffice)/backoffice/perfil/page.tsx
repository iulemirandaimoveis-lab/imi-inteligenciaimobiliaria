'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
    User, Mail, Phone, Shield, Camera, Save, Loader2,
    Award, Globe, Key, LogOut, Check
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageIntelHeader } from '../../components/ui'
import { T } from '../../lib/theme'
import { toast } from 'sonner'

interface ProfileData {
    name: string
    email: string
    phone: string
    creci: string
    bio: string
    role: string
    avatar_url: string | null
    language: string
}

const LANGUAGES = [
    { code: 'pt-BR', label: 'Português (BR)' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'ar', label: 'العربية' },
    { code: 'fr', label: 'Français' },
]

export default function PerfilPage() {
    const [profile, setProfile] = useState<ProfileData>({
        name: '', email: '', phone: '', creci: '', bio: '', role: '', avatar_url: null, language: 'pt-BR',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
    const [changingPassword, setChangingPassword] = useState(false)
    const [showPasswordSection, setShowPasswordSection] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        loadProfile()
    }, [])

    async function loadProfile() {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Parallel fetch: broker + profile (eliminate sequential latency)
            const [{ data: broker }, { data: userProfile }] = await Promise.all([
                supabase.from('brokers').select('*').eq('user_id', user.id).maybeSingle(),
                supabase.from('profiles').select('role, language').eq('id', user.id).maybeSingle(),
            ])

            setProfile({
                name: broker?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '',
                email: user.email || '',
                phone: broker?.phone || user.user_metadata?.phone || '',
                creci: broker?.creci || '',
                bio: broker?.bio || '',
                role: userProfile?.role || broker?.role || 'broker',
                avatar_url: broker?.avatar_url || user.user_metadata?.avatar_url || null,
                language: userProfile?.language || 'pt-BR',
            })
        } catch {
            toast.error('Erro ao carregar perfil')
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Não autenticado')

            // Parallel save: broker + auth metadata + profile language
            await Promise.all([
                supabase.from('brokers').update({
                    name: profile.name,
                    phone: profile.phone,
                    creci: profile.creci,
                    bio: profile.bio,
                    avatar_url: profile.avatar_url,
                }).eq('user_id', user.id),
                supabase.auth.updateUser({
                    data: { full_name: profile.name, avatar_url: profile.avatar_url }
                }),
                supabase.from('profiles').update({ language: profile.language }).eq('id', user.id),
            ])

            toast.success('Perfil atualizado com sucesso!')
        } catch {
            toast.error('Erro ao salvar perfil')
        } finally {
            setSaving(false)
        }
    }

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Arquivo muito grande (máx 5MB)')
            return
        }
        setUploading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Não autenticado')

            const ext = file.name.split('.').pop()
            const path = `avatars/${user.id}.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, file, { upsert: true })
            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
            // Cache-bust so browser always loads the fresh image
            const finalUrl = `${publicUrl}?t=${Date.now()}`

            // Persist immediately to all sources (don't wait for "Salvar")
            await supabase.auth.updateUser({ data: { avatar_url: finalUrl } })
            await supabase.from('brokers').update({ avatar_url: finalUrl }).eq('user_id', user.id)
            await supabase.from('profiles').upsert({ id: user.id, avatar_url: finalUrl }, { onConflict: 'id' })

            setProfile(p => ({ ...p, avatar_url: finalUrl }))
            toast.success('Foto atualizada!')
        } catch {
            toast.error('Erro ao enviar foto')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    async function handleChangePassword() {
        if (passwordForm.new !== passwordForm.confirm) {
            toast.error('As senhas não coincidem')
            return
        }
        if (passwordForm.new.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres')
            return
        }
        setChangingPassword(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({ password: passwordForm.new })
            if (error) throw error
            setPasswordForm({ current: '', new: '', confirm: '' })
            setShowPasswordSection(false)
            toast.success('Senha alterada com sucesso!')
        } catch {
            toast.error('Erro ao alterar senha')
        } finally {
            setChangingPassword(false)
        }
    }

    const inputStyle: React.CSSProperties = {
        width: '100%', height: 44, padding: '0 14px', borderRadius: 8,
        background: T.elevated, border: `1px solid ${T.border}`,
        color: T.text, fontSize: 14, outline: 'none',
        fontFamily: 'var(--font-sans)',
    }

    const labelStyle: React.CSSProperties = {
        fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const,
        letterSpacing: '0.05em', color: T.textDim, marginBottom: 6, display: 'block',
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <PageIntelHeader moduleLabel="PERFIL" title="Meu Perfil" />
                <div className="flex items-center justify-center py-24">
                    <Loader2 size={28} className="animate-spin" style={{ color: T.accent }} />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl">
            <PageIntelHeader
                moduleLabel="PERFIL"
                title="Meu Perfil"
                subtitle="Gerencie suas informações pessoais e preferências"
                actions={
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold"
                        style={{ background: T.accent, color: '#0B1928' }}
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar
                    </motion.button>
                }
            />

            {/* Avatar Section */}
            <div className="rounded-lg p-6" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <div
                            className="rounded-full overflow-hidden flex items-center justify-center"
                            style={{
                                width: 80, height: 80,
                                background: profile.avatar_url ? 'transparent' : T.accent,
                                border: `3px solid ${T.borderGold}`,
                            }}
                        >
                            {profile.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={profile.avatar_url} alt="Avatar"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }} />
                            ) : (
                                <span className="text-2xl font-bold text-white">
                                    {profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
                            style={{ background: T.accent, border: '2px solid var(--bg-base)' }}
                        >
                            {uploading ? <Loader2 size={11} className="animate-spin text-white" /> : <Camera size={11} className="text-white" />}
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </div>
                    <div>
                        <p className="text-lg font-bold" style={{ color: T.text }}>{profile.name}</p>
                        <p className="text-sm" style={{ color: T.textMuted }}>{profile.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase"
                            style={{ background: T.activeBg, color: T.accent }}>
                            <Shield size={10} /> {profile.role}
                        </span>
                    </div>
                </div>
            </div>

            {/* Personal Info */}
            <div className="rounded-lg p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.textDim }}>
                    Informações Pessoais
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label style={labelStyle}><User size={10} className="inline mr-1" />Nome Completo</label>
                        <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}><Mail size={10} className="inline mr-1" />Email</label>
                        <input value={profile.email} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
                    </div>
                    <div>
                        <label style={labelStyle}><Phone size={10} className="inline mr-1" />Telefone</label>
                        <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                            placeholder="(81) 99999-9999" style={inputStyle} />
                    </div>
                    <div>
                        <label style={labelStyle}><Award size={10} className="inline mr-1" />CRECI</label>
                        <input value={profile.creci} onChange={e => setProfile(p => ({ ...p, creci: e.target.value }))}
                            placeholder="CRECI-PE 00000" style={inputStyle} />
                    </div>
                </div>
                <div>
                    <label style={labelStyle}>Bio / Descrição</label>
                    <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                        placeholder="Conte um pouco sobre você e sua experiência no mercado imobiliário..."
                        rows={3}
                        style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'none' }} />
                </div>
            </div>

            {/* Preferences */}
            <div className="rounded-lg p-6 space-y-5" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.textDim }}>
                    Preferências
                </p>
                <div>
                    <label style={labelStyle}><Globe size={10} className="inline mr-1" />Idioma Preferido</label>
                    <select value={profile.language} onChange={e => setProfile(p => ({ ...p, language: e.target.value }))}
                        style={inputStyle}>
                        {LANGUAGES.map(l => (
                            <option key={l.code} value={l.code} style={{ background: 'var(--bg-base)' }}>{l.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Security */}
            <div className="rounded-lg p-6 space-y-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: T.textDim }}>
                    Segurança
                </p>

                {!showPasswordSection ? (
                    <button onClick={() => setShowPasswordSection(true)}
                        className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium"
                        style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                        <Key size={14} /> Alterar Senha
                    </button>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <div>
                            <label style={labelStyle}>Nova Senha</label>
                            <input type="password" value={passwordForm.new}
                                onChange={e => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                                placeholder="Mínimo 6 caracteres" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Confirmar Nova Senha</label>
                            <input type="password" value={passwordForm.confirm}
                                onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                                placeholder="Repita a nova senha" style={inputStyle} />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleChangePassword} disabled={changingPassword}
                                className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold"
                                style={{ background: T.accent, color: '#0B1928' }}>
                                {changingPassword ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Alterar
                            </button>
                            <button onClick={() => { setShowPasswordSection(false); setPasswordForm({ current: '', new: '', confirm: '' }) }}
                                className="flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium"
                                style={{ background: T.elevated, border: `1px solid ${T.border}`, color: T.textMuted }}>
                                Cancelar
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
