import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { MotionKeyframes } from '@/features/users/ui/primitives'
import { tokens as T } from '@/features/users/ui/tokens'

export const metadata: Metadata = {
  title: 'IMI Console — Inteligência Imobiliária',
  description: 'Gestão integrada de vendas, disponibilidade, propostas e operação comercial em tempo real.',
  robots: { index: false, follow: false },
}

/**
 * Visual shell for the IMI Console (/users/*). Sets the deep navy canvas and
 * registers shared keyframes. Auth enforcement happens per-page (login is
 * public) and in middleware — never here.
 */
export default function UsersLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: T.bg,
        color: T.t1,
        fontFamily: T.fSans,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <MotionKeyframes />
      {children}
    </div>
  )
}
