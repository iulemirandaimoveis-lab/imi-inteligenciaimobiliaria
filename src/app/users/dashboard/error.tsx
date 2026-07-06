'use client'

import { tokens as T } from '@/features/users/ui/tokens'
import { GlassCard, Button, Eyebrow } from '@/features/users/ui/primitives'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div
      style={{
        maxWidth: 520,
        margin: '0 auto',
        padding: 'clamp(40px, 10vh, 96px) 20px 64px',
      }}
    >
      <GlassCard padding={28} style={{ textAlign: 'center' }}>
        <Eyebrow style={{ color: T.gold, marginBottom: 12 }}>Console IMI</Eyebrow>
        <h1 style={{ fontFamily: T.fSerif, fontWeight: 500, fontSize: 24, color: T.t1, margin: '0 0 8px' }}>
          Não foi possível carregar o dashboard
        </h1>
        <p style={{ fontFamily: T.fSans, fontSize: 13, color: T.t3, lineHeight: 1.6, margin: '0 0 24px' }}>
          Houve uma falha temporária ao buscar os dados do empreendimento. Sua sessão continua ativa —
          tente novamente em instantes.
        </p>
        <Button variant="primary" onClick={reset} style={{ maxWidth: 260, margin: '0 auto' }}>
          Tentar novamente
        </Button>
        {error.digest && (
          <p style={{ fontFamily: T.fMono, fontSize: 10, color: T.t4, margin: '16px 0 0' }}>
            ref: {error.digest}
          </p>
        )}
      </GlassCard>
    </div>
  )
}
