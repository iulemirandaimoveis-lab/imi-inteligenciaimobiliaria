'use client'

import { useState } from 'react'

const NEIGHBORHOODS = [
  { name: 'Recife Antigo', price: 14500, val12m: 13.5, col: 2, row: 1, span: 2 },
  { name: 'Miramar',       price: 11200, val12m: 11.2, col: 4, row: 1, span: 1 },
  { name: 'Jaqueira',      price:  9200, val12m:  9.1, col: 5, row: 1, span: 1 },
  { name: 'Poço da Panela',price:  8900, val12m:  8.6, col: 1, row: 2, span: 1 },
  { name: 'Boa Viagem',    price:  9800, val12m:  8.4, col: 2, row: 2, span: 2 },
  { name: 'Espinheiro',    price:  8100, val12m:  7.8, col: 4, row: 2, span: 1 },
  { name: 'Torre',         price:  7800, val12m:  7.2, col: 5, row: 2, span: 1 },
  { name: 'Graças',        price:  7500, val12m:  6.9, col: 1, row: 3, span: 1 },
  { name: 'Pina',          price:  7200, val12m:  6.1, col: 2, row: 3, span: 1 },
  { name: 'Casa Forte',    price:  6800, val12m:  4.8, col: 3, row: 3, span: 1 },
  { name: 'Aflitos',       price:  6200, val12m:  4.2, col: 4, row: 3, span: 1 },
  { name: 'Várzea',        price:  5400, val12m:  3.1, col: 5, row: 3, span: 1 },
]

const MAX_PRICE   = 14500
const MIN_PRICE   = 5400
const MAX_VAL     = 13.5
const MIN_VAL     = 3.1

function priceColor(value: number, min: number, max: number): string {
  const t = (value - min) / (max - min)
  if (t < 0.25) return `rgba(200,164,74,${0.08 + t * 0.28})`
  if (t < 0.5)  return `rgba(200,164,74,${0.15 + t * 0.35})`
  if (t < 0.75) return `rgba(200,164,74,${0.35 + t * 0.30})`
  return `rgba(200,164,74,${0.55 + t * 0.25})`
}

function textColor(value: number, min: number, max: number): string {
  const t = (value - min) / (max - min)
  return t > 0.65 ? 'rgba(11,25,40,0.95)' : 'var(--bo-text,#e8e0d0)'
}

export function WidgetHeatmap() {
  const [view, setView] = useState<'price' | 'val'>('price')

  const getValue = (nb: typeof NEIGHBORHOODS[0]) =>
    view === 'price' ? nb.price : nb.val12m
  const getMin = () => view === 'price' ? MIN_PRICE : MIN_VAL
  const getMax = () => view === 'price' ? MAX_PRICE : MAX_VAL

  const fmt = (nb: typeof NEIGHBORHOODS[0]) =>
    view === 'price'
      ? `R$${(nb.price / 1000).toFixed(1)}k/m²`
      : `+${nb.val12m.toFixed(1)}%`

  const sorted = [...NEIGHBORHOODS].sort((a, b) => getValue(b) - getValue(a))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['price', 'val'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '4px 14px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 150ms',
              background: view === v ? 'var(--bo-active-bg,rgba(200,164,74,0.12))' : 'var(--bo-surface,rgba(255,255,255,0.04))',
              border: `1px solid ${view === v ? 'var(--bo-accent,#C8A44A)' : 'var(--bo-border,rgba(200,164,74,0.12))'}`,
              color: view === v ? 'var(--bo-accent,#C8A44A)' : 'var(--bo-text-muted,rgba(232,224,208,0.5))',
              fontWeight: view === v ? 700 : 400,
            }}
          >
            {v === 'price' ? 'Preço/m²' : 'Valorização 12m'}
          </button>
        ))}
      </div>

      {/* Heatmap grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gridTemplateRows: 'repeat(3, auto)',
        gap: 6,
      }}>
        {NEIGHBORHOODS.map(nb => {
          const val  = getValue(nb)
          const min  = getMin()
          const max  = getMax()
          const t    = (val - min) / (max - min)
          const bg   = priceColor(val, min, max)
          const fg   = textColor(val, min, max)

          return (
            <div
              key={nb.name}
              style={{
                gridColumn: `${nb.col} / span ${nb.span}`,
                gridRow: nb.row,
                background: bg,
                border: '1px solid rgba(200,164,74,0.18)',
                borderRadius: 6,
                padding: '10px 10px 8px',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                transition: 'transform 120ms, box-shadow 120ms',
                cursor: 'default',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: fg, letterSpacing: '0.3px', lineHeight: 1.2 }}>
                {nb.name}
              </span>
              <span style={{
                fontSize: nb.span > 1 ? 15 : 12,
                fontWeight: 800,
                color: fg,
                fontFamily: 'var(--font-display,"Playfair Display",serif)',
                letterSpacing: '-0.5px',
                lineHeight: 1,
              }}>
                {fmt(nb)}
              </span>
              {/* relative bar */}
              <div style={{ height: 3, background: 'rgba(0,0,0,0.15)', borderRadius: 99, marginTop: 2 }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round(t * 100)}%`,
                  background: t > 0.65 ? 'rgba(11,25,40,0.5)' : 'rgba(200,164,74,0.7)',
                  borderRadius: 99,
                  transition: 'width 400ms ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
        <div style={{
          height: 8,
          borderRadius: 99,
          background: 'linear-gradient(90deg, rgba(200,164,74,0.08) 0%, rgba(200,164,74,0.30) 40%, rgba(200,164,74,0.80) 100%)',
          border: '1px solid rgba(200,164,74,0.14)',
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--bo-text-muted,rgba(232,224,208,0.5))' }}>
          <span>
            {view === 'price'
              ? `R$${(MIN_PRICE / 1000).toFixed(1)}k/m²`
              : `+${MIN_VAL.toFixed(1)}%`}
          </span>
          <span style={{ color: 'var(--bo-text-muted)', opacity: 0.6 }}>— escala de preço/intensidade —</span>
          <span>
            {view === 'price'
              ? `R$${(MAX_PRICE / 1000).toFixed(1)}k/m²`
              : `+${MAX_VAL.toFixed(1)}%`}
          </span>
        </div>
      </div>

      {/* Ranking list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2 }}>
        <p style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--bo-text-muted)', marginBottom: 2 }}>
          Ranking — {view === 'price' ? 'Preço/m²' : 'Valorização 12m'}
        </p>
        {sorted.slice(0, 5).map((nb, i) => {
          const val = getValue(nb)
          const t   = (val - getMin()) / (getMax() - getMin())
          return (
            <div key={nb.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--bo-text-muted)', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 11, color: 'var(--bo-text,#e8e0d0)', flex: 1, minWidth: 0 }}>{nb.name}</span>
              <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, flexShrink: 0 }}>
                <div style={{
                  height: '100%', width: `${Math.round(t * 100)}%`,
                  background: 'var(--bo-accent,#C8A44A)', borderRadius: 99,
                  transition: 'width 400ms ease',
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--bo-accent,#C8A44A)', width: 72, textAlign: 'right', flexShrink: 0 }}>
                {view === 'price'
                  ? `R$${(nb.price / 1000).toFixed(1)}k`
                  : `+${nb.val12m.toFixed(1)}%`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
