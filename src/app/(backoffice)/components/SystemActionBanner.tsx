'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, X, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import type { SystemCheck } from '@/app/api/system-checks/route'

const LEVEL_CFG = {
    critical: {
        bg: 'rgba(229,115,115,0.10)',
        border: 'rgba(229,115,115,0.30)',
        text: '#E57373',
        icon: AlertCircle,
        dot: '#E57373',
    },
    warning: {
        bg: 'rgba(232,168,124,0.10)',
        border: 'rgba(232,168,124,0.30)',
        text: '#E8A87C',
        icon: AlertTriangle,
        dot: '#E8A87C',
    },
    info: {
        bg: 'var(--bo-active-bg)',
        border: 'var(--bo-border-gold)',
        text: 'var(--bo-accent)',
        icon: Info,
        dot: 'var(--bo-accent)',
    },
} as const

// IDs dispensados nesta sessão (não persistem entre reloads para critical)
const sessionDismissed = new Set<string>()

export default function SystemActionBanner() {
    const [checks, setChecks] = useState<SystemCheck[]>([])
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())
    const [expanded, setExpanded] = useState(true)
    const pathname = usePathname()

    useEffect(() => {
        fetch('/api/system-checks')
            .then(r => r.json())
            .then(payload => setChecks(payload?.checks || []))
            .catch(() => {})
    // Re-check quando navega (máx 1x por 60s)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname])

    const visible = checks.filter(c => !dismissed.has(c.id) && !sessionDismissed.has(c.id))
    if (visible.length === 0) return null

    const topLevel = visible.some(c => c.level === 'critical') ? 'critical'
        : visible.some(c => c.level === 'warning') ? 'warning'
        : 'info'

    const cfg = LEVEL_CFG[topLevel]
    const Icon = cfg.icon

    const dismiss = (id: string, level: SystemCheck['level']) => {
        // critical nunca some de verdade — só colapsa; warning pode ser dispensado na sessão
        if (level !== 'critical') {
            sessionDismissed.add(id)
            setDismissed(prev => new Set([...prev, id]))
        }
    }

    return (
        <div
            className="w-full px-4 lg:px-6 pt-3"
            style={{ background: 'var(--bo-surface)' }}
        >
            {/* Cabeçalho da barra */}
            <div
                className="rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}
            >
                <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    onClick={() => setExpanded(p => !p)}
                >
                    <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: cfg.dot }} />
                    <Icon size={15} style={{ color: cfg.text }} className="flex-shrink-0" />
                    <span className="flex-1 text-xs font-semibold" style={{ color: cfg.text }}>
                        {visible.length === 1
                            ? visible[0].title
                            : `${visible.length} ações necessárias no sistema`}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: cfg.border, color: cfg.text }}>
                        {visible.length}
                    </span>
                    {expanded ? <ChevronUp size={13} style={{ color: cfg.text }} /> : <ChevronDown size={13} style={{ color: cfg.text }} />}
                </button>

                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            style={{ overflow: 'hidden', borderTop: `1px solid ${cfg.border}` }}
                        >
                            <div className="divide-y" style={{ borderColor: cfg.border }}>
                                {visible.map(check => {
                                    const c = LEVEL_CFG[check.level]
                                    const CheckIcon = c.icon
                                    return (
                                        <div key={check.id} className="flex items-start gap-3 px-4 py-3">
                                            <CheckIcon size={14} style={{ color: c.text }} className="mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold leading-tight" style={{ color: c.text }}>
                                                    {check.title}
                                                </p>
                                                <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--bo-text-muted)' }}>
                                                    {check.message}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                                                {check.action_url && (
                                                    <a
                                                        href={check.action_url}
                                                        target={check.action_url.startsWith('http') ? '_blank' : undefined}
                                                        rel={check.action_url.startsWith('http') ? 'noopener noreferrer' : undefined}
                                                        className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap"
                                                        style={{ background: c.border, color: c.text }}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        {check.action_label || 'Ver'} <ChevronRight size={10} />
                                                    </a>
                                                )}
                                                {check.level !== 'critical' && (
                                                    <button
                                                        onClick={e => { e.stopPropagation(); dismiss(check.id, check.level) }}
                                                        className="w-6 h-6 flex items-center justify-center rounded-lg"
                                                        style={{ color: 'var(--bo-text-muted)' }}
                                                        title="Dispensar"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
