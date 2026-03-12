/**
 * Btn — Botão canônico IMI
 * UM padrão. Zero gradientes. Elegância institucional.
 *
 * Uso:
 *   <Btn>Salvar</Btn>
 *   <Btn variant="secondary" icon={<Edit size={14} />}>Editar</Btn>
 *   <Btn variant="danger" size="sm">Arquivar</Btn>
 *   <Btn variant="ghost" size="icon"><MoreHorizontal size={16} /></Btn>
 *   <Btn as="a" href="/...">Link</Btn>
 */

import React from 'react'
import { Loader2 } from 'lucide-react'

export type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
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

function buildClass(
  variant: BtnVariant = 'primary',
  size: BtnSize = 'md',
  full?: boolean,
  className?: string,
): string {
  const v = `bo-btn-${variant}`
  const s = size === 'icon' ? 'bo-btn-icon' : size !== 'md' ? `bo-btn-${size}` : ''
  const f = full ? 'bo-btn-full' : ''
  return ['bo-btn', v, s, f, className].filter(Boolean).join(' ')
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
    ...rest
  } = props

  const cls = buildClass(variant, size, full, className)
  const content = (
    <>
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {size !== 'icon' && children}
      {!loading && iconRight}
    </>
  )

  if ((props as AnchorProps).as === 'a') {
    const { as: _as, ...anchorRest } = rest as AnchorProps & { as: 'a' }
    return (
      <a className={cls} {...anchorRest}>
        {content}
      </a>
    )
  }

  const { as: _as, ...btnRest } = rest as ButtonProps & { as?: 'button' }
  return (
    <button
      className={cls}
      disabled={loading || (btnRest as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled}
      {...(btnRest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  )
}

export default Btn
