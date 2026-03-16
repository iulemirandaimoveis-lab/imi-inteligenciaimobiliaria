'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bell, LogOut, Settings, ChevronDown, GraduationCap, Camera, Loader2 } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from './ThemeToggle'
import { useOnboardingContext } from './OnboardingWrapper'

const supabase = createClient()

interface Notification {
    id: string
    type: string
    title: string
    message?: string
    read: boolean
    created_at: string
}

function timeAgo(d: string) {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (diff < 1) return 'agora'
    if (diff < 60) return `${diff}min`
    if (diff < 1440) return `${Math.floor(diff / 60)}h`
    return `${Math.floor(diff / 1440)}d`
}

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

function NotificationBell() {
    const [open, setOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unread, setUnread] = useState(0)
    const ref = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const router = useRouter()

    useEffect(() => {
        fetch('/api/notifications')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setNotifications(data.slice(0, 10))
                    setUnread(data.filter((n: Notification) => !n.read).length)
                }
            })
            .catch(() => {})
    }, [pathname])

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read_all: true }),
            })
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnread(0)
        } catch (err) {
            console.error('Failed to mark notifications as read:', err)
        }
    }

    return (
        <div ref={ref} className="relative">
            <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => setOpen(!open)}
                className="relative flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                style={{
                    background: open ? 'var(--bg-elevated)' : 'transparent',
                    border: `1px solid ${open ? 'var(--border-focus)' : 'transparent'}`,
                    color: open ? 'var(--imi-gold-500)' : 'var(--text-tertiary)',
                }}
            >
                <Bell size={16} />
                {unread > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                        style={{ background: 'var(--imi-gold-500)', boxShadow: '0 0 0 2px var(--bg-surface)' }}
                    >
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
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
                            className="absolute right-0 top-11 w-80 z-20 overflow-hidden"
                            style={{
                                borderRadius: 'var(--r-xl)',
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--border-default)',
                                boxShadow: 'var(--shadow-xl)',
                                maxHeight: '70vh',
                            }}
                        >
                            <div className="flex items-center justify-between px-4 py-3.5"
                                style={{ borderBottom: '1px solid var(--border-default)' }}>
                                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Notificações</span>
                                {unread > 0 && (
                                    <button onClick={markAllRead} className="text-xs cursor-pointer" style={{ color: 'var(--imi-gold-500)' }}>
                                        Marcar lidas
                                    </button>
                                )}
                            </div>
                            <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 100px)' }}>
                                {notifications.length > 0 ? notifications.map((n, i) => (
                                    <motion.div key={n.id}
                                        initial={{ opacity: 0, x: -6 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover-card flex gap-3 px-4 py-3 cursor-pointer transition-all"
                                        style={{
                                            background: !n.read ? 'rgba(184,148,58,0.08)' : 'transparent',
                                            borderBottom: '1px solid var(--border-default)',
                                        }}
                                    >
                                        <div
                                            className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                                            style={{ background: n.read ? 'transparent' : 'var(--imi-gold-500)' }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                                            {n.message && (
                                                <p className="text-[11px] mt-0.5 leading-tight truncate" style={{ color: 'var(--text-tertiary)' }}>{n.message}</p>
                                            )}
                                            <p className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>{timeAgo(n.created_at)}</p>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="py-8 text-center">
                                        <Bell size={20} className="mx-auto mb-2" style={{ color: 'var(--text-tertiary)', opacity: 0.3 }} />
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Nenhuma notificação</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid var(--border-default)' }}>
                                <button
                                    onClick={() => { setOpen(false); router.push('/backoffice/notificacoes') }}
                                    className="text-xs cursor-pointer"
                                    style={{ color: 'var(--imi-gold-500)' }}
                                >
                                    Ver todas →
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
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
        } catch (err: any) {
            console.error('Avatar upload error:', err)
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
                className="flex items-center gap-2 h-9 px-2.5 rounded-xl transition-all"
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
                                    className="hover-card w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                                    style={{ color: 'var(--text-tertiary)' }}
                                >
                                    <Settings size={14} />Configurações
                                </button>
                                <div className="h-px my-1" style={{ background: 'var(--border-default)' }} />
                                <button onClick={() => { setOpen(false); onSignOut() }}
                                    className="hover-card w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
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
                        className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold transition-all hover:brightness-110"
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
                    <NotificationBell />
                    <div className="w-px h-5 mx-1" style={{ background: 'var(--border-default)' }} />
                    <UserMenu onSignOut={handleSignOut} />
                </div>
            </div>
        </header>
    )
}
