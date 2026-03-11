'use client'

import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export interface BrokerAvatar {
    id: string
    name: string
    avatar_url?: string | null
    role?: string | null
    last_login_at?: string | null
}

interface AvatarGroupProps {
    brokers: BrokerAvatar[]
    max?: number
    size?: number
    href?: string
    label?: string
    /** How much each avatar overlaps the previous one (default: 32% of size) */
    overlap?: number
    /** Spring stiffness for hover animation (default: 300) */
    stiffness?: number
    /** Spring damping for hover animation (default: 17) */
    damping?: number
    /** Tooltip side: 'top' | 'bottom' (default: 'top') */
    tooltipSide?: 'top' | 'bottom'
}

function isRecentlyActive(last_login_at?: string | null): boolean {
    if (!last_login_at) return false
    const diff = Date.now() - new Date(last_login_at).getTime()
    return diff < 48 * 60 * 60 * 1000 // 48h
}

function getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// Deterministic color palette from name hash
const PALETTES = [
    { color: '#486581', bg: 'rgba(72,101,129,0.22)',   ring: 'rgba(72,101,129,0.5)' },
    { color: '#E8A87C', bg: 'rgba(232,168,124,0.22)',  ring: 'rgba(232,168,124,0.5)' },
    { color: '#6BB87B', bg: 'rgba(107,184,123,0.22)',  ring: 'rgba(107,184,123,0.5)' },
    { color: '#A78BFA', bg: 'rgba(167,139,250,0.22)',  ring: 'rgba(167,139,250,0.5)' },
    { color: '#4ECDC4', bg: 'rgba(78,205,196,0.22)',   ring: 'rgba(78,205,196,0.5)' },
    { color: '#D4A929', bg: 'rgba(212,169,41,0.22)',   ring: 'rgba(212,169,41,0.5)' },
    { color: '#60A5FA', bg: 'rgba(96,165,250,0.22)',   ring: 'rgba(96,165,250,0.5)' },
    { color: '#F472B6', bg: 'rgba(244,114,182,0.22)',  ring: 'rgba(244,114,182,0.5)' },
]
function getPalette(name: string) {
    let h = 0
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff
    return PALETTES[h % PALETTES.length]
}

// ─── Single animated avatar ────────────────────────────────────────────────────
function SingleAvatar({
    broker,
    size,
    index,
    total,
    overlapPx,
    stiffness,
    damping,
    tooltipSide,
    layoutId,
    onHover,
    isHovered,
}: {
    broker: BrokerAvatar
    size: number
    index: number
    total: number
    overlapPx: number
    stiffness: number
    damping: number
    tooltipSide: 'top' | 'bottom'
    layoutId: string
    onHover: (id: string | null) => void
    isHovered: boolean
}) {
    const active = isRecentlyActive(broker.last_login_at)
    const palette = getPalette(broker.name)
    const translateY = tooltipSide === 'top' ? '-38%' : '38%'

    return (
        <motion.div
            className="relative flex-shrink-0 cursor-pointer"
            style={{
                width: size,
                height: size,
                // Higher z-index when hovered so tooltip + avatar appear above neighbours
                zIndex: isHovered ? 40 : total - index,
                marginLeft: index === 0 ? 0 : -overlapPx,
            }}
            animate={{
                y: isHovered ? translateY : '0%',
                scale: isHovered ? 1.12 : 1,
            }}
            transition={{ type: 'spring', stiffness, damping }}
            onHoverStart={() => onHover(broker.id)}
            onHoverEnd={() => onHover(null)}
        >
            {/* ── Border ring (animates on hover) ── */}
            <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{
                    boxShadow: isHovered
                        ? `0 0 0 2.5px ${palette.ring}, 0 8px 20px rgba(0,0,0,0.35)`
                        : `0 0 0 2px var(--bo-drawer-bg, #111827), 0 0 0 0px transparent`,
                }}
                transition={{ type: 'spring', stiffness, damping }}
            />

            {/* ── Avatar image or initials ── */}
            {broker.avatar_url ? (
                <Image
                    src={broker.avatar_url}
                    alt={broker.name}
                    width={size}
                    height={size}
                    className="rounded-full object-cover"
                    style={{
                        width: size,
                        height: size,
                        border: '2.5px solid var(--bo-drawer-bg, #111827)',
                    }}
                />
            ) : (
                <motion.div
                    className="rounded-full flex items-center justify-center font-bold select-none"
                    animate={{
                        background: isHovered ? palette.bg.replace('0.22', '0.38') : palette.bg,
                    }}
                    style={{
                        width: size,
                        height: size,
                        border: '2.5px solid var(--bo-drawer-bg, #111827)',
                        color: palette.color,
                        fontSize: Math.round(size * 0.33),
                    }}
                >
                    {getInitials(broker.name)}
                </motion.div>
            )}

            {/* ── Online dot ── */}
            {active && (
                <motion.div
                    className="absolute rounded-full"
                    animate={{ scale: isHovered ? 1.2 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    style={{
                        width: Math.max(8, size * 0.26),
                        height: Math.max(8, size * 0.26),
                        background: '#4ADE80',
                        border: '2px solid var(--bo-drawer-bg, #111827)',
                        bottom: -1,
                        right: -1,
                        boxShadow: isHovered ? '0 0 8px rgba(74,222,128,0.7)' : '0 0 4px rgba(74,222,128,0.4)',
                    }}
                />
            )}

            {/* ── Tooltip (uses shared layoutId for fluid transition) ── */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        layoutId={layoutId}
                        className="absolute left-1/2 pointer-events-none"
                        style={{
                            zIndex: 50,
                            x: '-50%',
                            ...(tooltipSide === 'top'
                                ? { bottom: '115%' }
                                : { top: '115%' }),
                        }}
                        initial={{ opacity: 0, scale: 0.88 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.88 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    >
                        <div
                            className="rounded-xl px-3 py-2 text-center whitespace-nowrap"
                            style={{
                                background: 'var(--bo-surface, #1a1f2e)',
                                border: `1px solid ${palette.ring}`,
                                boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)`,
                            }}
                        >
                            <p className="text-[12px] font-bold leading-tight" style={{ color: 'var(--bo-text)' }}>
                                {broker.name.split(' ').slice(0, 2).join(' ')}
                            </p>
                            {broker.role && (
                                <p className="text-[10px] mt-0.5 font-medium" style={{ color: palette.color }}>
                                    {broker.role}
                                </p>
                            )}
                            {active && (
                                <p className="text-[9px] mt-1 font-semibold tracking-wide" style={{ color: '#4ADE80' }}>
                                    ● online recentemente
                                </p>
                            )}
                        </div>
                        {/* Arrow */}
                        {tooltipSide === 'top' ? (
                            <div
                                className="absolute left-1/2 -translate-x-1/2 -bottom-[5px] w-2.5 h-2.5 rotate-45"
                                style={{
                                    background: 'var(--bo-surface, #1a1f2e)',
                                    borderRight: `1px solid ${palette.ring}`,
                                    borderBottom: `1px solid ${palette.ring}`,
                                }}
                            />
                        ) : (
                            <div
                                className="absolute left-1/2 -translate-x-1/2 -top-[5px] w-2.5 h-2.5 rotate-45"
                                style={{
                                    background: 'var(--bo-surface, #1a1f2e)',
                                    borderLeft: `1px solid ${palette.ring}`,
                                    borderTop: `1px solid ${palette.ring}`,
                                }}
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ─── AvatarGroup (exported) ────────────────────────────────────────────────────
export function AvatarGroup({
    brokers,
    max = 5,
    size = 32,
    href,
    label,
    overlap,
    stiffness = 300,
    damping = 17,
    tooltipSide = 'top',
}: AvatarGroupProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)
    const tooltipLayoutId = useId()

    const visible    = brokers.slice(0, max)
    const overflow   = brokers.length - max
    const activeCount = brokers.filter(b => isRecentlyActive(b.last_login_at)).length
    const overlapPx  = overlap ?? Math.round(size * 0.28)

    const handleHover = (id: string | null) => setHoveredId(id)

    const content = (
        <div className="flex items-center gap-2.5">
            {/* ── Stacked avatars ── */}
            <div
                className="flex items-center"
                style={{
                    // Extra padding so Y-translate doesn't clip
                    paddingTop: tooltipSide === 'top' ? 12 : 0,
                    paddingBottom: tooltipSide === 'bottom' ? 12 : 0,
                }}
            >
                {visible.map((b, i) => (
                    <SingleAvatar
                        key={b.id}
                        broker={b}
                        size={size}
                        index={i}
                        total={visible.length}
                        overlapPx={overlapPx}
                        stiffness={stiffness}
                        damping={damping}
                        tooltipSide={tooltipSide}
                        layoutId={tooltipLayoutId}
                        onHover={handleHover}
                        isHovered={hoveredId === b.id}
                    />
                ))}

                {/* +N overflow bubble */}
                {overflow > 0 && (
                    <motion.div
                        whileHover={{ scale: 1.08, y: '-20%' }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="flex-shrink-0 rounded-full flex items-center justify-center font-bold cursor-default"
                        style={{
                            width: size,
                            height: size,
                            background: 'var(--bo-icon-bg)',
                            border: '2.5px solid var(--bo-drawer-bg, #111827)',
                            color: 'var(--bo-text-muted)',
                            fontSize: Math.round(size * 0.3),
                            marginLeft: -overlapPx,
                            zIndex: 0,
                        }}
                    >
                        +{overflow}
                    </motion.div>
                )}
            </div>

            {/* ── Label / active count ── */}
            {label && (
                <div className="flex flex-col">
                    <span className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--bo-text)' }}>
                        {label}
                    </span>
                    {activeCount > 0 && (
                        <span className="text-[10px] leading-tight font-medium" style={{ color: '#4ADE80' }}>
                            {activeCount} ativo{activeCount > 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            )}
        </div>
    )

    if (href) {
        return (
            <Link href={href} className="hover:opacity-90 transition-opacity">
                {content}
            </Link>
        )
    }

    return content
}
