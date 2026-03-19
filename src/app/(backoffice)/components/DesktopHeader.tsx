'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, LogOut, Settings, ChevronDown, GraduationCap, Camera, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from './ThemeToggle'
import { useOnboardingContext } from './OnboardingWrapper'
import SmartNotifications from './SmartNotifications'
const supabase = createClient()
function SearchBar() {
    const [focused, setFocused] = useState(false)
    const trigger = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))
    }
    return (
        <motion.button
            onClick={trigger}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            animate={{ scale: focused ? 1.01 : 1 }}
            transition={{ duration: 0.15 }}
            className="relative flex items-center gap-3 h-9 px-4 w-full max-w-[280px] transition-all duration-200"
            style={{
                borderRadius: 'var(--r-xl)',
                background: 'var(--bg-surface)',
                border: `1px solid ${focused ? 'var(--border-focus)' : 'var(--border-default)'}`,
                boxShadow: focused ? '0 0 0 3px rgba(184,148,58,0.12)' : 'none',
            }}
        >
            <Search size={14} style={{ color: focused ? 'var(--imi-gold-500)' : 'var(--text-tertiary)' }} className="flex-shrink-0 transition-colors" />
            <span className="text-sm flex-1 text-left" style={{ color: 'var(--text-tertiary)' }}>
                Buscar...
            </span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
                <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-4 text-[9px] font-semibold rounded"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-disabled)', border: '1px solid var(--border-subtle)' }}>
                    ⌘
                </kbd>
                <kbd className="hidden sm:inline-flex items-center justify-center w-4 h-4 text-[9px] font-semibold rounded"
                    style={{ background: 'var(--bg-muted)', color: 'var(--text-disabled)', border: '1px solid var(--border-subtle)' }}>
                    K
                </kbd>
            </div>
        </motion.button>
    )
}
function UserMenu({ onSignOut }: { onSignOut: () => void }) {
    const [open, setOpen] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const router = useRouter()
    const ref = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    // Load avatar from Supabase user metadata on mount
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            const url = data.user?.user_metadata?.avatar_url
            if (url) setAvatarUrl(url)
        })
    }, [])
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])
    const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Não autenticado')
            const ext = file.name.split('.').pop()
            const path = `avatars/${user.id}.${ext}`
            const { error: uploadError } = await supabase.storage
                .from('user-media')
                .upload(path, file, { upsert: true, contentType: file.type })
            if (uploadError) throw uploadError
            const { data: { publicUrl } } = supabase.storage
                .from('user-media')
                .getPublicUrl(path)
            // Bust cache with timestamp
            const urlWithCache = `${publicUrl}?t=${Date.now()}`
            await supabase.auth.updateUser({ data: { avatar_url: urlWithCache } })
            setAvatarUrl(urlWithCache)
        } catch (err: unknown) {
        } finally {
            setUploading(false)
            // Reset input so same file can be re-uploaded
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }, [])
    const Avatar = ({ size = 'sm' }: { size?: 'sm' | 'lg' }) => {
        const px = size === 'lg' ? 44 : 24
        return avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Perfil"
                className="rounded-full object-cover flex-shrink-0"
                style={{ width: px, height: px, minWidth: px, minHeight: px, aspectRatio: '1/1' }}
            />
        ) : (
            <div className="rounded-full font-bold text-white flex items-center justify-center flex-shrink-0"
                style={{ width: px, height: px, minWidth: px, minHeight: px, aspectRatio: '1/1', background: 'var(--imi-gold-500)', fontSize: size === 'lg' ? 14 : 10 }}>
                IM
            </div>
        )
    }
    return (
        <div ref={ref} className="relative">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
            />
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 h-9 px-2.5 rounded-lg transition-all"
                style={{
                    background: open ? 'var(--bg-elevated)' : 'transparent',
                    border: `1px solid ${open ? 'var(--border-focus)' : 'transparent'}`,
                }}
            >
                <Avatar size="sm" />
                <span className="hidden sm:block text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Iule</span>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }}>
                    <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} />
                </motion.div>
            </motion.button>
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.16, ease: [0.34, 1.56, 0.64, 1] }}
                            className="absolute right-0 top-11 w-60 z-20 overflow-hidden"
                            style={{
                                borderRadius: 'var(--r-xl)',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                boxShadow: 'var(--shadow-xl)',
                            }}
                        >
                            {/* Profile header with clickable avatar */}
                            <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
                                <div className="flex items-center gap-3">
                                    {/* Avatar with upload overlay */}
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="relative group flex-shrink-0"
                                        title="Alterar foto"
                                        disabled={uploading}
                                    >
                                        <Avatar size="lg" />
                                        <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ background: 'rgba(0,0,0,0.55)' }}>
                                            {uploading
                                                ? <Loader2 size={14} className="text-white animate-spin" />
                                                : <Camera size={14} className="text-white" />
                                            }
                                        </div>
                                    </button>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>Iule Miranda</p>
                                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: 'var(--imi-gold-500)' }}>CRECI 17933 · Admin</p>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="text-[10px] mt-1 transition-colors"
                                            style={{ color: 'var(--text-tertiary)' }}
                                        >
                                            {uploading ? 'Enviando...' : 'Alterar foto'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-1.5">
                                <button onClick={() => { setOpen(false); router.push('/backoffice/settings') }}
                                    className="hover-card w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    <Settings size={14} />Configurações
                                </button>
                                <div className="h-px my-1" style={{ background: 'var(--border-default)' }} />
                                <button onClick={() => { setOpen(false); onSignOut() }}
                                    className="hover-card w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                                    style={{ color: 'var(--error)' }}
                                >
                                    <LogOut size={14} />Sair
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
export default function DesktopHeader() {
    const router = useRouter()
    const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/login') }
    const { startTutorial } = useOnboardingContext()
    return (
        <header
            className="hidden lg:flex lg:fixed lg:top-0 lg:right-0 lg:left-60 lg:z-30 lg:h-16 items-center"
            style={{
                background: 'color-mix(in srgb, var(--bg-surface) 85%, transparent)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border-default)',
            }}
        >
            <div className="w-full h-full px-6 flex items-center justify-between gap-4">
                <SearchBar />
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={startTutorial}
                        className="flex items-center gap-1.5 h-9 px-3 rounded-[6px] text-xs font-semibold transition-all hover:brightness-110"
                        style={{
                            background: 'var(--bg-elevated)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-tertiary)',
                        }}
                        title="Tour Guiado"
                    >
                        <GraduationCap size={14} />
                        <span className="hidden xl:inline">Tour</span>
                    </button>
                    <ThemeToggle />
                    <div className="w-px h-5 mx-0.5" style={{ background: 'var(--border-default)' }} />
                    <SmartNotifications />
                    <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />
                    <UserMenu onSignOut={handleSignOut} />
                </div>
            </div>
        </header>
    )
}
