'use client'

import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react'
import { tokens as T } from './tokens'

/* ── GlassCard ─────────────────────────────────────────────────────────── */
export function GlassCard({
  children,
  style,
  className,
  interactive = false,
  padding = 20,
}: {
  children: ReactNode
  style?: CSSProperties
  className?: string
  interactive?: boolean
  padding?: number
}) {
  return (
    <div
      className={className}
      style={{
        background: T.glass,
        border: `1px solid ${T.glassBorder}`,
        borderRadius: T.rLg,
        padding,
        backdropFilter: 'blur(18px) saturate(140%)',
        WebkitBackdropFilter: 'blur(18px) saturate(140%)',
        boxShadow: T.shadowCard,
        transition: interactive ? `transform ${T.dur} ${T.ease}, border-color ${T.dur} ${T.ease}` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ── Eyebrow / label ───────────────────────────────────────────────────── */
export function Eyebrow({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <p
      style={{
        fontFamily: T.fSans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: T.t3,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </p>
  )
}

/* ── StatusDot ─────────────────────────────────────────────────────────── */
export function StatusDot({ color = T.green, pulse = true }: { color?: string; pulse?: boolean }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
      {pulse && (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: color,
            opacity: 0.6,
            animation: 'imiPing 1.8s cubic-bezier(0,0,0.2,1) infinite',
          }}
        />
      )}
      <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: color }} />
    </span>
  )
}

/* ── Button ────────────────────────────────────────────────────────────── */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', loading, children, style, disabled, ...rest }: ButtonProps) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    height: 48,
    borderRadius: T.rMd,
    fontFamily: T.fSans,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: '0.02em',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: `transform ${T.dur} ${T.ease}, background ${T.dur} ${T.ease}, opacity ${T.dur} ${T.ease}`,
    opacity: disabled || loading ? 0.6 : 1,
    border: '1px solid transparent',
  }
  const variants: Record<string, CSSProperties> = {
    primary: { background: T.gold, color: '#1A1206', boxShadow: `0 6px 20px ${T.goldGlow}` },
    secondary: { background: 'rgba(255,255,255,0.04)', color: T.t1, border: `1px solid ${T.glassBorderStrong}` },
    ghost: { background: 'transparent', color: T.t2, border: `1px solid ${T.glassBorder}` },
  }
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={(e) => {
        if (!disabled && !loading) e.currentTarget.style.transform = 'scale(0.985)'
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {loading ? <Spinner /> : children}
    </button>
  )
}

export function Spinner({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: `2px solid ${color}`,
        borderTopColor: 'transparent',
        display: 'inline-block',
        animation: 'imiSpin 0.7s linear infinite',
      }}
    />
  )
}

/* ── Keyframes (injected once) ─────────────────────────────────────────── */
export function MotionKeyframes() {
  return (
    <style>{`
      @keyframes imiSpin { to { transform: rotate(360deg); } }
      @keyframes imiPing { 75%, 100% { transform: scale(2.2); opacity: 0; } }
      @keyframes imiFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      @keyframes imiRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes imiShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    `}</style>
  )
}
