'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// IMI Design System — Standard Buttons
//
//  ButtonPrimary  — filled navy (#102A43), works on any background
//  ButtonGhost    — outlined; use dark=true on dark backgrounds (white borders)
//
// Usage:
//   <ButtonPrimary href="/avaliacoes">Solicitar Avaliação</ButtonPrimary>
//   <ButtonPrimary onClick={fn} arrow={false} size="lg">Enviar</ButtonPrimary>
//   <ButtonGhost dark href="/sobre">Conhecer a IMI</ButtonGhost>
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
    disabled?: boolean
    type?: 'button' | 'submit'
    target?: string
    rel?: string
}

const sizes = {
    sm: 'h-[40px] px-5 text-[11px] tracking-[0.1em]',
    md: 'h-[52px] px-7 text-[12px] tracking-[0.1em]',
    lg: 'h-[56px] px-8 text-[13px] tracking-[0.12em]',
}

// ── Primary: filled navy ──────────────────────────────────────────────────────
export function ButtonPrimary({
    children, href, onClick, icon, arrow = true,
    full, size = 'md', className = '', disabled, type = 'button', target, rel,
}: BtnProps) {
    const cls = [
        'group inline-flex items-center justify-center gap-2.5 rounded-[14px]',
        'font-bold uppercase whitespace-nowrap',
        'bg-[#102A43] text-white hover:bg-[#0a1c2e]',
        'transition-all duration-200 active:scale-[0.97]',
        'shadow-[0_4px_14px_rgba(16,42,67,0.30)] hover:shadow-[0_6px_20px_rgba(16,42,67,0.42)]',
        full ? 'w-full' : 'w-auto',
        sizes[size],
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
    ].join(' ')

    const content = (
        <>
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{children}</span>
            {arrow && (
                <ArrowRight
                    size={13}
                    strokeWidth={2.5}
                    className="shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform duration-150"
                />
            )}
        </>
    )

    if (href) return <Link href={href} target={target} rel={rel} className={cls}>{content}</Link>
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={cls}>
            {content}
        </button>
    )
}

// ── Ghost: outlined ───────────────────────────────────────────────────────────
interface GhostBtnProps extends BtnProps {
    dark?: boolean  // true = white border/text for dark backgrounds
}

export function ButtonGhost({
    children, href, onClick, icon, arrow = false,
    full, size = 'md', dark = false, className = '', disabled, type = 'button', target, rel,
}: GhostBtnProps) {
    const cls = [
        'group inline-flex items-center justify-center gap-2.5 rounded-[14px]',
        'font-bold uppercase whitespace-nowrap',
        dark
            ? 'border border-white/20 text-white hover:bg-white/[0.07] hover:border-white/30'
            : 'border border-[#102A43]/25 text-[#102A43] hover:bg-[#102A43]/[0.05] hover:border-[#102A43]/40',
        'transition-all duration-200 active:scale-[0.97]',
        full ? 'w-full' : 'w-auto',
        sizes[size],
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
        className,
    ].join(' ')

    const content = (
        <>
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{children}</span>
            {arrow && (
                <ArrowRight
                    size={13}
                    strokeWidth={2.5}
                    className="shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform duration-150"
                />
            )}
        </>
    )

    if (href) return <Link href={href} target={target} rel={rel} className={cls}>{content}</Link>
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={cls}>
            {content}
        </button>
    )
}
