'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export interface BrokerAvatar {
    id: string
    name: string
    avatar_url?: string | null
    role?: string | null
    last_login_at?: string | null
}

interface Props {
    brokers: BrokerAvatar[]
    max?: number
    size?: number
    href?: string
    label?: string
}

function isRecentlyActive(last_login_at?: string | null): boolean {
    if (!last_login_at) return false
    const diff = Date.now() - new Date(last_login_at).getTime()
    return diff < 48 * 60 * 60 * 1000 // 48h
}

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// Deterministic palette from name hash
const PALETTES = [
    ['#486581', 'rgba(72,101,129,0.22)'],
    ['#E8A87C', 'rgba(232,168,124,0.22)'],
    ['#6BB87B', 'rgba(107,184,123,0.22)'],
    ['#A78BFA', 'rgba(167,139,250,0.22)'],
    ['#4ECDC4', 'rgba(78,205,196,0.22)'],
    ['#D4A929', 'rgba(212,169,41,0.22)'],
    ['#60A5FA', 'rgba(96,165,250,0.22)'],
    ['#F472B6', 'rgba(244,114,182,0.22)'],
]
function getPalette(name: string) {
    let h = 0
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff
    return PALETTES[h % PALETTES.length]
}

function SingleAvatar({
    broker,
    size,
    index,
    total,
}: {
    broker: BrokerAvatar
    size: number
    index: number
    total: number
}) {
    const [hovered, setHovered] = useState(false)
    const active = isRecentlyActive(broker.last_login_at)
    const [color, bg] = getPalette(broker.name)
    const overlap = Math.round(size * 0.28)

    return (
        <motion.div
            className="relative flex-shrink-0 cursor-pointer"
            style={{
                width: size,
                height: size,
                zIndex: hovered ? 30 : total - index,
                marginLeft: index === 0 ? 0 : -overlap,
            }}
            animate={{ scale: hovered ? 1.15 : 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
        >
            {/* Avatar circle */}
            {broker.avatar_url ? (
                <img
                    src={broker.avatar_url}
                    alt={broker.name}
                    width={size}
                    height={size}
                    className="rounded-full object-cover"
                    style={{
                        width: size,
                        height: size,
                        border: '2px solid var(--bo-drawer-bg, #111827)',
                    }}
                />
            ) : (
                <div
                    className="rounded-full flex items-center justify-center font-bold"
                    style={{
                        width: size,
                        height: size,
                        background: bg,
                        border: '2px solid var(--bo-drawer-bg, #111827)',
                        color,
                        fontSize: size * 0.32,
                    }}
                >
                    {getInitials(broker.name)}
                </div>
            )}

            {/* Online dot */}
            {active && (
                <div
                    className="absolute rounded-full"
                    style={{
                        width: size * 0.28,
                        height: size * 0.28,
                        background: '#4ADE80',
                        border: '1.5px solid var(--bo-drawer-bg, #111827)',
                        bottom: 0,
                        right: 0,
                        boxShadow: '0 0 5px rgba(74,222,128,0.6)',
                    }}
                />
            )}

            {/* Tooltip */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none"
                        style={{ zIndex: 50 }}
                    >
                        <div
                            className="rounded-xl px-2.5 py-1.5 text-center whitespace-nowrap"
                            style={{
                                background: 'var(--bo-surface, #1a1f2e)',
                                border: '1px solid var(--bo-border)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                            }}
                        >
                            <p className="text-[11px] font-semibold" style={{ color: 'var(--bo-text)' }}>
                                {broker.name.split(' ').slice(0, 2).join(' ')}
                            </p>
                            {broker.role && (
                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--bo-text-muted)' }}>
                                    {broker.role}
                                </p>
                            )}
                            {active && (
                                <p className="text-[9px] mt-0.5 font-semibold" style={{ color: '#4ADE80' }}>
                                    ● Ativo recentemente
                                </p>
                            )}
                        </div>
                        {/* Arrow */}
                        <div
                            className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 rotate-45"
                            style={{
                                background: 'var(--bo-surface, #1a1f2e)',
                                border: '1px solid var(--bo-border)',
                                borderTop: 'none',
                                borderLeft: 'none',
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export function AvatarGroup({ brokers, max = 5, size = 32, href, label }: Props) {
    const visible  = brokers.slice(0, max)
    const overflow = brokers.length - max
    const activeCount = brokers.filter(b => isRecentlyActive(b.last_login_at)).length
    const overlap = Math.round(size * 0.28)

    const content = (
        <div className="flex items-center gap-2">
            {/* Stacked avatars */}
            <div className="flex items-center" style={{ position: 'relative' }}>
                {visible.map((b, i) => (
                    <SingleAvatar
                        key={b.id}
                        broker={b}
                        size={size}
                        index={i}
                        total={visible.length}
                    />
                ))}

                {/* +N overflow badge */}
                {overflow > 0 && (
                    <div
                        className="flex-shrink-0 rounded-full flex items-center justify-center font-bold"
                        style={{
                            width: size,
                            height: size,
                            background: 'var(--bo-icon-bg)',
                            border: '2px solid var(--bo-drawer-bg, #111827)',
                            color: 'var(--bo-text-muted)',
                            fontSize: size * 0.3,
                            marginLeft: -overlap,
                            zIndex: 0,
                        }}
                    >
                        +{overflow}
                    </div>
                )}
            </div>

            {/* Label */}
            {label && (
                <div className="flex flex-col">
                    <span className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--bo-text)' }}>
                        {label}
                    </span>
                    {activeCount > 0 && (
                        <span className="text-[10px] leading-tight" style={{ color: '#4ADE80' }}>
                            {activeCount} ativo{activeCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}
        </div>
    )

    if (href) {
        return (
            <Link href={href} className="hover:opacity-80 transition-opacity">
                {content}
            </Link>
        )
    }

    return content
}
