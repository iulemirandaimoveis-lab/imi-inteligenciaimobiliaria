'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ReactNode, CSSProperties, ButtonHTMLAttributes, AnchorHTMLAttributes } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// IMI Design System — MASTER v3 Buttons
//
// RULE: NO gold/yellow fill buttons. Ever.
//
//  ButtonPrimary  — navy bg (#0A1624) + white text + gold gradient line at bottom
//  ButtonGhost    — transparent bg, gold text + subtle gold border (secondary)
//
// The login page "ENTRAR" button is the canonical reference.
//
// Usage:
//   <ButtonPrimary href="/avaliacoes">Solicitar Avaliação</ButtonPrimary>
//   <ButtonPrimary onClick={fn} arrow={false} size="lg">Enviar</ButtonPrimary>
//   <ButtonGhost href="/sobre">Conhecer a IMI</ButtonGhost>
// ─────────────────────────────────────────────────────────────────────────────

interface BtnProps {
    children: ReactNode
    href?: string
    onClick?: () => void
    icon?: ReactNode
    arrow?: boolean
    full?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
    style?: CSSProperties
    disabled?: boolean
    type?: 'button' | 'submit'
    target?: string
    rel?: string
}

const sizeStyles: Record<string, CSSProperties> = {
    sm: { height: 40, padding: '0 20px', fontSize: 11, letterSpacing: '1px' },
    md: { height: 52, padding: '0 28px', fontSize: 11, letterSpacing: '1px' },
    lg: { height: 56, padding: '0 32px', fontSize: 13, letterSpacing: '1px' },
}

// ── Primary: navy #0A1624 bg + white text + gold gradient line at bottom ────
export function ButtonPrimary({
    children, href, onClick, icon, arrow = true,
    full, size = 'md', className = '', style: extraStyle, disabled, type = 'button', target, rel,
}: BtnProps) {
    const baseStyle: CSSProperties = {
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: full ? '100%' : 'auto',
        background: '#0A1624',
        color: '#FFFFFF',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 6,
        fontFamily: "var(--fu, 'Outfit', sans-serif)",
        fontWeight: 600,
        textTransform: 'uppercase',
        textDecoration: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.25s cubic-bezier(.16,1,.3,1)',
        ...sizeStyles[size],
        ...extraStyle,
    }

    const goldLine: CSSProperties = {
        position: 'absolute',
        bottom: 0,
        left: '12%',
        right: '12%',
        height: 2,
        background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)',
        opacity: 0.6,
        pointerEvents: 'none',
    }

    const content = (
        <>
            {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
            <span>{children}</span>
            {arrow && (
                <ArrowRight
                    size={13}
                    strokeWidth={2.5}
                    style={{ flexShrink: 0, opacity: 0.6 }}
                />
            )}
            {/* Gold gradient line at bottom — the ONLY gold accent allowed */}
            <span style={goldLine} />
        </>
    )

    if (href) return <Link href={href} target={target} rel={rel} style={baseStyle} className={className}>{content}</Link>
    return (
        <button type={type} onClick={onClick} disabled={disabled} style={baseStyle} className={className}>
            {content}
        </button>
    )
}

// ── Ghost / Secondary: transparent bg, gold text, subtle gold border ────────
interface GhostBtnProps extends BtnProps {
    dark?: boolean    // true = white border/text for dark backgrounds
    strong?: boolean  // with dark=true: brighter white border for hero CTAs
}

export function ButtonGhost({
    children, href, onClick, icon, arrow = false,
    full, size = 'md', dark = false, strong = false, className = '', style: extraStyle, disabled, type = 'button', target, rel,
}: GhostBtnProps) {
    const borderColor = dark && strong
        ? 'rgba(255,255,255,0.50)'
        : dark
            ? 'rgba(255,255,255,0.20)'
            : 'rgba(200,164,74,0.14)'

    const textColor = dark ? '#fff' : '#C8A44A'

    const baseStyle: CSSProperties = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        width: full ? '100%' : 'auto',
        background: 'transparent',
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        fontFamily: "var(--fu, 'Outfit', sans-serif)",
        fontWeight: 600,
        textTransform: 'uppercase',
        textDecoration: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.25s cubic-bezier(.16,1,.3,1)',
        ...sizeStyles[size],
        ...extraStyle,
    }

    const content = (
        <>
            {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
            <span>{children}</span>
            {arrow && (
                <ArrowRight
                    size={13}
                    strokeWidth={2.5}
                    style={{ flexShrink: 0, opacity: 0.6 }}
                />
            )}
        </>
    )

    if (href) return <Link href={href} target={target} rel={rel} style={baseStyle} className={className}>{content}</Link>
    return (
        <button type={type} onClick={onClick} disabled={disabled} style={baseStyle} className={className}>
            {content}
        </button>
    )
}
