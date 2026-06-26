'use client'

import { useEffect, useState } from 'react'
import { tokens as T } from '../ui/tokens'
import { Eyebrow, StatusDot } from '../ui/primitives'

/* Simulated live feed for the institutional hero — purely presentational. */
const SALES = [
  { unit: 'Casa 14 · Alto Bellevue', value: 'R$ 2,4M', broker: 'João' },
  { unit: 'Casa 07 · Alto Bellevue', value: 'R$ 1,9M', broker: 'Allysson' },
  { unit: 'Casa 22 · Alto Bellevue', value: 'R$ 3,1M', broker: 'Douglas' },
  { unit: 'Casa 03 · Alto Bellevue', value: 'R$ 2,2M', broker: 'Gustavo' },
]

function useRotating<T>(items: T[], ms: number): T {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % items.length), ms)
    return () => clearInterval(id)
  }, [items.length, ms])
  return items[i]
}

function useCountUp(target: number, ms = 1400): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - start) / ms, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export function LoginHero() {
  const sale = useRotating(SALES, 3200)
  const available = useCountUp(18)
  const proposals = useCountUp(7)
  const [pulse, setPulse] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setPulse((v) => v + 1), 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 56px 48px',
        overflow: 'hidden',
      }}
    >
      {/* Ambient gradient + grain */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(120% 80% at 12% 8%, ${T.goldSoft}, transparent 55%), radial-gradient(100% 90% at 90% 100%, rgba(96,165,250,0.06), transparent 60%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Brand */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: T.fSerif, fontWeight: 700, fontSize: 22, color: T.t1, letterSpacing: '0.16em' }}>
          IMI
        </span>
        <span style={{ width: 1, height: 26, background: T.goldBorder }} />
        <span
          style={{
            fontFamily: T.fSans,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: T.gold,
            lineHeight: 1.5,
          }}
        >
          Intelligence
          <br />
          Platform
        </span>
      </div>

      {/* Headline */}
      <div style={{ position: 'relative', maxWidth: 460 }}>
        <h1
          style={{
            fontFamily: T.fSerif,
            fontWeight: 500,
            fontSize: 'clamp(34px, 4vw, 52px)',
            lineHeight: 1.04,
            color: T.t1,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Inteligência
          <br />
          <span style={{ color: T.gold }}>Imobiliária</span>
        </h1>
        <p
          style={{
            fontFamily: T.fSans,
            fontSize: 15,
            lineHeight: 1.6,
            color: T.t2,
            margin: '20px 0 0',
            maxWidth: 420,
          }}
        >
          Gestão integrada de vendas, disponibilidade, propostas e operação comercial em tempo real.
        </p>
      </div>

      {/* Live cards */}
      <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 480 }}>
        {/* Disponibilidade ao vivo */}
        <HeroCard>
          <CardHead label="Disponibilidade" dotColor={T.green} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
            <span style={{ fontFamily: T.fMono, fontSize: 30, fontWeight: 600, color: T.t1 }}>{available}</span>
            <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.t3 }}>unidades ao vivo</span>
          </div>
        </HeroCard>

        {/* Propostas em análise */}
        <HeroCard>
          <CardHead label="Propostas" dotColor={T.amber} />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 10 }}>
            <span style={{ fontFamily: T.fMono, fontSize: 30, fontWeight: 600, color: T.t1 }}>{proposals}</span>
            <span style={{ fontFamily: T.fSans, fontSize: 12, color: T.t3 }}>em análise</span>
          </div>
        </HeroCard>

        {/* Vendas recentes (rotating) */}
        <HeroCard span2 key={pulse}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <CardHead label="Venda registrada" dotColor={T.gold} />
            <span style={{ fontFamily: T.fSans, fontSize: 10, color: T.t4 }}>agora</span>
          </div>
          <div
            style={{
              marginTop: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'imiRise 0.5s ease both',
            }}
          >
            <div>
              <p style={{ fontFamily: T.fSans, fontSize: 13, fontWeight: 600, color: T.t1, margin: 0 }}>{sale.unit}</p>
              <p style={{ fontFamily: T.fSans, fontSize: 11, color: T.t3, margin: '2px 0 0' }}>
                Corretor · {sale.broker}
              </p>
            </div>
            <span style={{ fontFamily: T.fMono, fontSize: 18, fontWeight: 600, color: T.gold }}>{sale.value}</span>
          </div>
        </HeroCard>
      </div>

      {/* Footer micro-metric */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
        <StatusDot color={T.green} />
        <span style={{ fontFamily: T.fSans, fontSize: 11, color: T.t3 }}>
          9 corretores online · sincronização em tempo real
        </span>
      </div>
    </div>
  )
}

function HeroCard({ children, span2 }: { children: React.ReactNode; span2?: boolean }) {
  return (
    <div
      style={{
        gridColumn: span2 ? '1 / -1' : undefined,
        background: T.glass,
        border: `1px solid ${T.glassBorder}`,
        borderRadius: T.rMd,
        padding: 16,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: T.shadowSoft,
      }}
    >
      {children}
    </div>
  )
}

function CardHead({ label, dotColor }: { label: string; dotColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <StatusDot color={dotColor} />
      <Eyebrow>{label}</Eyebrow>
    </div>
  )
}
