'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import {
    SECTIONS, SECTION_COLORS, SECTION_ACCESS,
    type NavItem, type NavSection, type UserRole,
} from './nav-config'

function useUserRole(): UserRole {
    const [role, setRole] = useState<UserRole>('admin')
    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data }) => {
            const r = data.user?.user_metadata?.role
            if (r && ['admin', 'manager', 'agent', 'viewer'].includes(r)) setRole(r as UserRole)
            else setRole('admin')
        })
    }, [])
    return role
}

// ── Badge styling helper ──────────────────────────────────────────
function badgeStyle(badge: string | number) {
    const base = {
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        fontWeight: 700 as const,
        padding: '2px 5px',
        borderRadius: 7,
        letterSpacing: '0.06em',
        lineHeight: 1.2,
        whiteSpace: 'nowrap' as const,
        flexShrink: 0,
    }
    if (badge === 'NEW') {
        return { ...base, background: '#2D8F5C', color: 'var(--text-inverse)', border: 'none', boxShadow: '0 1px 4px rgba(45,143,92,0.25)' }
    }
    if (badge === 'IA') {
        return { ...base, background: 'var(--accent-400)', color: 'var(--bg-base)', border: 'none', boxShadow: '0 1px 4px rgba(61,111,255,0.25)' }
    }
    if (badge === 'BREVE') {
        return { ...base, fontSize: 11, background: 'rgba(148,163,184,0.15)', color: 'var(--text-tertiary)', border: '1px solid rgba(148,163,184,0.15)' }
    }
    return { ...base, background: 'var(--bg-elevated)', color: 'var(--text-inverse)', border: '1px solid transparent' }
}

function badgeText(badge: string | number): string {
    if (badge === 'BREVE') return 'BREVE'
    return String(badge)
}

// ── Leaf nav item (no children) ────────────────────────────────────
function NavItemComponent({ item, depth = 0 }: { item: NavItem; depth?: number }) {
    const pathname = usePathname()
    const [open, setOpen] = useState(() => {
        if (!item.children) return false
        return item.children.some(c => c.href && pathname.startsWith(c.href.split('/').slice(0, 4).join('/')))
    })

    const isActive = item.href
        ? pathname === item.href || (item.href !== '/backoffice/dashboard' && pathname.startsWith(item.href))
        : false
    const hasChildren = !!item.children?.length
    const isParentActive = hasChildren && item.children!.some(c => c.href && pathname.startsWith(c.href))

    if (hasChildren) {
        return (
            <div>
                <button
                    onClick={() => setOpen(!open)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all"
                    style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 14,
                        color: isParentActive || open ? 'var(--gold, #C8A44A)' : 'var(--text-secondary)',
                        background: isParentActive || open ? 'rgba(200,164,74,.10)' : 'transparent',
                        fontWeight: isParentActive ? 600 : 500,
                    }}
                >
                    <item.icon size={16} className="flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                        <span style={badgeStyle(item.badge)}>
                            {badgeText(item.badge)}
                        </span>
                    )}
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ opacity: 0.5, display: 'flex' }}
                    >
                        <ChevronDown size={13} />
                    </motion.span>
                </button>

                <AnimatePresence initial={false}>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className="ml-5 mt-0.5 space-y-0.5 pl-3 overflow-hidden"
                            style={{ borderLeft: '1px solid var(--border-subtle)' }}
                        >
                            {item.children!.map((child, i) => (
                                <motion.div
                                    key={child.href || child.label}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.03, duration: 0.2 }}
                                >
                                    <NavItemComponent item={child} depth={depth + 1} />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    return (
        <Link
            href={item.href!}
            className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
            style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                color: isActive ? 'var(--gold, #C8A44A)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(200,164,74,.10)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--gold, #C8A44A)' : '2px solid transparent',
                fontWeight: isActive ? 600 : 400,
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.background = 'rgba(200,164,74,0.06)'
                    e.currentTarget.style.transform = 'translateX(2px)'
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.transform = 'translateX(0)'
                }
            }}
        >
            <item.icon size={16} className="flex-shrink-0" style={{ color: isActive ? 'var(--gold, #C8A44A)' : undefined }} />
            <span className="flex-1">{item.label}</span>
            {item.badge && (
                <span style={badgeStyle(item.badge)}>
                    {badgeText(item.badge)}
                </span>
            )}
        </Link>
    )
}

// ── Collapsible section ────────────────────────────────────────────
function SectionComponent({ section }: { section: NavSection }) {
    const pathname = usePathname()
    const isAlwaysOpen = !!section.alwaysOpen

    const [open, setOpen] = useState(() => {
        if (isAlwaysOpen) return true
        return section.items.some(item => {
            if (item.href && pathname.startsWith(item.href)) return true
            if (item.children) return item.children.some(c => c.href && pathname.startsWith(c.href))
            return false
        })
    })

    const sectionColor = SECTION_COLORS[section.label] || 'var(--text-tertiary)'

    return (
        <div className="mb-1.5">
            <button
                onClick={() => { if (!isAlwaysOpen) setOpen(v => !v) }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all group"
                style={{ cursor: isAlwaysOpen ? 'default' : 'pointer' }}
                disabled={isAlwaysOpen}
            >
                <div
                    className="flex-shrink-0"
                    style={{ width: 3, height: 12, borderRadius: 6, background: sectionColor, opacity: open ? 1 : 0.4, transition: 'opacity 0.2s' }}
                />
                <p
                    className="flex-1 text-left uppercase"
                    style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.10em',
                        color: open ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                        transition: 'color 0.2s',
                    }}
                >
                    {section.label}
                </p>
                {!isAlwaysOpen && (
                    <motion.span
                        animate={{ rotate: open ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ opacity: 0.4, display: 'flex', flexShrink: 0 }}
                    >
                        <ChevronDown size={11} style={{ color: 'var(--text-tertiary)' }} />
                    </motion.span>
                )}
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={isAlwaysOpen ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-0.5 overflow-hidden"
                    >
                        {section.items.map(item => (
                            <NavItemComponent key={item.href || item.label} item={item} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export function DesktopSidebar() {
    const router = useRouter()
    const userRole = useUserRole()
    const visibleSections = SECTIONS.filter(s => SECTION_ACCESS[s.label]?.includes(userRole) ?? true)
    const handleSignOut = useCallback(async () => {
        const supabase = createClient()
        await supabase.auth.signOut({ scope: 'global' })
        document.cookie.split(';').forEach(c => {
            const name = c.split('=')[0].trim()
            if (name.startsWith('sb-')) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`
            }
        })
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith('sb-')) localStorage.removeItem(k)
        })
        window.location.href = '/login'
    }, [])

    return (
        <aside
            className="hidden lg:flex flex-col h-screen fixed left-0 top-0 z-40"
            style={{
                width: 240,
                background: 'rgba(10,22,36,.92)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderRight: '1px solid var(--border-subtle)',
            }}
        >
            {/* Logo */}
            <div
                className="flex items-center gap-3 px-5 h-16 flex-shrink-0"
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
                <span
                    className="leading-none select-none"
                    style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: '2px',
                        color: 'var(--text-primary)',
                    }}
                >
                    IMI
                </span>
                <div
                    className="flex-shrink-0"
                    style={{ width: 1, height: 28, background: 'var(--text-gold, #C8A44A)' }}
                />
                <span
                    className="select-none"
                    style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        letterSpacing: '2.5px',
                        textTransform: 'uppercase',
                        color: 'var(--text-gold, #C8A44A)',
                        lineHeight: 1.45,
                    }}
                >
                    INTELIGÊNCIA<br />IMOBILIÁRIA
                </span>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto min-h-0 py-3 px-2.5">
                {visibleSections.map(section => (
                    <SectionComponent key={section.label} section={section} />
                ))}
            </nav>
        </aside>
    )
}
