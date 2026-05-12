/**
 * Btn — Botao canonico IMI DS3
 * Inline styles with DS3 tokens. Self-contained, no external CSS classes.
 *
 * Uso:
 *   <Btn>Salvar</Btn>
 *   <Btn variant="secondary" icon={<Edit size={14} />}>Editar</Btn>
 *   <Btn variant="danger" size="sm">Arquivar</Btn>
 *   <Btn variant="ghost" size="icon"><MoreHorizontal size={16} /></Btn>
 *   <Btn as="a" href="/...">Link</Btn>
 */

import React, { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gold'
export type BtnSize    = 'xs' | 'sm' | 'md' | 'lg' | 'icon'

interface BtnBaseProps {
  variant?:  BtnVariant
  size?:     BtnSize
  icon?:     React.ReactNode
  iconRight?: React.ReactNode
  loading?:  boolean
  full?:     boolean
  className?: string
  children?: React.ReactNode
}

// Button element
type ButtonProps = BtnBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BtnBaseProps> & {
    as?: 'button'
    href?: never
  }

// Anchor element
type AnchorProps = BtnBaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof BtnBaseProps> & {
    as: 'a'
    href: string
  }

type BtnProps = ButtonProps | AnchorProps

/* ── Variant styles ───────────────────────────────────────── */

interface VariantStyle {
  background: string
  color: string
  border: string
  hoverBackground: string
  hoverColor?: string
  hoverBorder?: string
  activeBorder?: string
  activeTransform?: string
}

const VARIANT_STYLES: Record<string, VariantStyle> = {
  primary: {
    background: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    border: '1px solid transparent',
    hoverBackground: 'var(--btn-primary-hover)',
    activeTransform: 'scale(0.97)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
  } as VariantStyle,
  gold: {
    background: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-text)',
    border: '1px solid transparent',
    hoverBackground: 'var(--btn-primary-hover)',
    activeTransform: 'scale(0.97)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)',
  } as VariantStyle,
  secondary: {
    background: 'var(--bg-muted)',
    color: 'var(--text-primary)',
    border: '1px solid rgba(200,164,74,0.40)',
    hoverBackground: 'var(--bg-hover)',
    hoverBorder: '1px solid rgba(200,164,74,0.60)',
    activeBorder: '1px solid rgba(200,164,74,0.15)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid rgba(200,164,74,0.35)',
    hoverBackground: 'var(--bg-hover)',
    hoverBorder: '1px solid rgba(200,164,74,0.55)',
    activeBorder: '1px solid rgba(200,164,74,0.10)',
  },
  danger: {
    background: 'var(--error-bg)',
    color: 'var(--error)',
    border: '1px solid rgba(224,107,107,0.35)',
    hoverBackground: 'color-mix(in srgb, var(--error-bg) 80%, var(--error))',
    activeBorder: '1px solid rgba(224,107,107,0.10)',
  },
  outline: {
    background: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid rgba(200,164,74,0.40)',
    hoverBackground: 'var(--bg-hover)',
    hoverBorder: '1px solid rgba(200,164,74,0.60)',
    activeBorder: '1px solid rgba(200,164,74,0.12)',
  },
}

/* ── Size styles ──────────────────────────────────────────── */

interface SizeStyle {
  height: number
  paddingInline: number
  fontSize: number
  gap: number
  iconSize: number
}

const SIZE_STYLES: Record<string, SizeStyle> = {
  xs: { height: 28, paddingInline: 10, fontSize: 12, gap: 4, iconSize: 12 },
  sm: { height: 34, paddingInline: 14, fontSize: 13, gap: 6, iconSize: 14 },
  md: { height: 40, paddingInline: 18, fontSize: 14, gap: 8, iconSize: 16 },
  lg: { height: 48, paddingInline: 24, fontSize: 15, gap: 10, iconSize: 18 },
  icon: { height: 40, paddingInline: 0, fontSize: 14, gap: 0, iconSize: 16 },
}

/* Map icon-size variant to the matching size height */
const ICON_SIZE_MAP: Record<string, number> = {
  xs: 28, sm: 34, md: 40, lg: 48,
}

function buildStyle(
  variant: BtnVariant,
  size: BtnSize,
  full: boolean | undefined,
  hovered: boolean,
  pressed: boolean,
  disabled: boolean,
): React.CSSProperties {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary
  const s = SIZE_STYLES[size] || SIZE_STYLES.md

  const isIcon = size === 'icon'

  // Border: default lit, dims on press, brightens on hover
  let border = v.border
  if (!disabled) {
    if (pressed && v.activeBorder) border = v.activeBorder
    else if (hovered && v.hoverBorder) border = v.hoverBorder
  }

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: `${s.gap}px`,
    height: `${s.height}px`,
    paddingInline: isIcon ? undefined : `${s.paddingInline}px`,
    width: isIcon ? `${s.height}px` : full ? '100%' : undefined,
    fontSize: `${s.fontSize}px`,
    fontFamily: 'var(--font-sans)',
    lineHeight: 1,
    borderRadius: 'var(--r-md, 8px)',
    border,
    background: hovered && !disabled ? v.hoverBackground : v.background,
    color: hovered && v.hoverColor && !disabled ? v.hoverColor : v.color,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boxShadow: !disabled ? (v as any).boxShadow : undefined,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.5 : pressed && !disabled ? 0.8 : 1,
    pointerEvents: disabled ? 'none' : undefined,
    transition: 'all 250ms var(--ease)',
    transform: pressed && v.activeTransform && !disabled ? v.activeTransform : undefined,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    outline: 'none',
    letterSpacing: variant === 'primary' || variant === 'gold' ? '1px' : undefined,
    textTransform: variant === 'primary' || variant === 'gold' ? 'uppercase' : undefined,
    fontWeight: 600,
  }

  return style
}

export function Btn(props: BtnProps) {
  const {
    variant = 'primary',
    size = 'md',
    icon,
    iconRight,
    loading = false,
    full,
    className,
    children,
    style: styleProp,
    ...rest
  } = props

  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [focused, setFocused] = useState(false)

  const isDisabled = loading || !!(rest as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled

  const onMouseEnter = useCallback(() => setHovered(true), [])
  const onMouseLeave = useCallback(() => { setHovered(false); setPressed(false) }, [])
  const onMouseDown = useCallback(() => setPressed(true), [])
  const onMouseUp = useCallback(() => setPressed(false), [])
  const onFocus = useCallback(() => setFocused(true), [])
  const onBlur = useCallback(() => setFocused(false), [])

  const computedStyle = buildStyle(variant, size, full, hovered, pressed, isDisabled)

  // Focus ring
  if (focused && !isDisabled) {
    computedStyle.outline = '2px solid var(--border-focus)'
    computedStyle.outlineOffset = '2px'
  }

  // Merge any externally passed style
  const finalStyle = styleProp ? { ...computedStyle, ...styleProp } : computedStyle

  const spinnerSize = SIZE_STYLES[size]?.iconSize ?? 14

  const content = (
    <>
      {loading ? <Loader2 size={spinnerSize} className="animate-spin" /> : icon}
      {size !== 'icon' && children}
      {!loading && iconRight}
    </>
  )

  const commonProps = {
    className,
    style: finalStyle,
    onMouseEnter,
    onMouseLeave,
    onMouseDown,
    onMouseUp,
    onFocus,
    onBlur,
  }

  if ((props as AnchorProps).as === 'a') {
    const { as: _as, ...anchorRest } = rest as AnchorProps & { as: 'a' }
    return (
      <a {...commonProps} {...anchorRest}>
        {content}
      </a>
    )
  }

  const { as: _as, ...btnRest } = rest as ButtonProps & { as?: 'button' }
  return (
    <button
      {...commonProps}
      disabled={isDisabled}
      {...(btnRest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  )
}

export default Btn
