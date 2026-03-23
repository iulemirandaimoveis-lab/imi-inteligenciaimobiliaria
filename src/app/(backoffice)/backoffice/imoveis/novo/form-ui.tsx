'use client'

import { DollarSign } from 'lucide-react'

/* ─── Design Tokens ────────────────────────────────────────────── */
export const T = {
  navy:     'var(--text-primary)',
  surface:  'var(--bg-surface)',
  elevated: 'var(--bg-elevated)',
  raised:   'var(--bg-subtle)',
  gold:     'var(--accent-400)',
  goldBg:   'rgba(184,148,58,0.08)',
  goldBgHi: 'rgba(184,148,58,0.14)',
  border:   'var(--border-subtle)',
  borderHi: 'var(--border-strong)',
  text:     'var(--text-primary)',
  textSub:  'var(--text-tertiary)',
  textDim:  'var(--text-secondary)',
  success:  'var(--success)',
  error:    'var(--error)',
  errorBg:  'var(--error-bg)',
} as const

/* ─── Shared Styles ──────────────────────────────────────────────── */
export const inputStyle: React.CSSProperties = {
  background: T.elevated,
  border: `1px solid ${T.border}`,
  color: T.text,
  borderRadius: 6,
  padding: '11px 14px',
  fontSize: 14,
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-sans)',
  transition: 'border-color var(--dur-2) var(--ease), box-shadow var(--dur-2) var(--ease)',
}

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: T.textSub,
  marginBottom: 8,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  fontFamily: 'var(--font-sans)',
}

/* ─── Field Wrapper ──────────────────────────────────────────────── */
export function Field({ label, error, children, style, hint }: {
  label: string; error?: string; hint?: string
  children: React.ReactNode; style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, ...style }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && !error && <span style={{ fontSize: 11, color: T.textDim, marginTop: 4 }}>{hint}</span>}
      {error && (
        <span style={{
          fontSize: 11, color: T.error, marginTop: 4,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ fontSize: 13 }}>!</span> {error}
        </span>
      )}
    </div>
  )
}

/* ─── Price Input Helper ─────────────────────────────────────────── */
function formatBRL(val: string): string {
  const digits = val.replace(/\D/g, '')
  if (!digits) return ''
  const num = parseInt(digits, 10)
  return num.toLocaleString('pt-BR')
}

export function PriceInput({ value, onChange, placeholder, error }: {
  value: string; onChange: (v: string) => void
  placeholder?: string; error?: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        fontSize: 12, fontWeight: 600, color: T.gold, fontFamily: 'var(--font-mono)',
        pointerEvents: 'none',
      }}>R$</span>
      <input
        className="ni"
        style={{
          ...inputStyle,
          paddingLeft: 36,
          borderColor: error ? T.error : T.border,
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
        }}
        value={value ? formatBRL(value) : ''}
        onChange={e => onChange(e.target.value.replace(/\D/g, ''))}
        placeholder={placeholder}
      />
    </div>
  )
}
