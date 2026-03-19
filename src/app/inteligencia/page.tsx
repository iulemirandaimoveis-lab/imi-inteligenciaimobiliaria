'use client'

import { useEffect, useState } from 'react'
import {
  WidgetValuation,
  WidgetPriceTrend,
  WidgetImiIndex,
  WidgetYield,
  WidgetSimulator,
  WidgetHeatmap,
  WidgetGlobalCompare,
  WidgetRoiCalc,
  WidgetDemandTrend,
  WidgetLiquidity,
} from '@/components/widgets'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WidgetConfig {
  widget_id: string
  name: string
  description: string | null
  category: string | null
  display_order: number
}

// ─── Widget registry ──────────────────────────────────────────────────────────

const WIDGET_MAP: Record<string, React.ComponentType> = {
  'valuation':     WidgetValuation,
  'price-trend':   WidgetPriceTrend,
  'imi-index':     WidgetImiIndex,
  'yield':         WidgetYield,
  'simulator':     WidgetSimulator,
  'heatmap':       WidgetHeatmap,
  'global-compare':WidgetGlobalCompare,
  'roi-calc':      WidgetRoiCalc,
  'demand-trend':  WidgetDemandTrend,
  'liquidity':     WidgetLiquidity,
}

// ─── Skeleton card ─────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--bg-surface, rgba(255,255,255,0.04))',
      border: '1px solid var(--border-default, rgba(200,164,74,0.12))',
      borderRadius: 'var(--r-sm, 4px)',
      padding: '20px 20px 16px',
      breakInside: 'avoid',
      marginBottom: 16,
      minHeight: 220,
    }}>
      {/* header skeleton */}
      <div style={{
        height: 10, width: '45%', borderRadius: 99,
        background: 'rgba(200,164,74,0.10)', marginBottom: 18,
        animation: 'shimmer 1.5s ease-in-out infinite',
      }} />
      {/* body lines */}
      {[80, 60, 90, 50].map((w, i) => (
        <div key={i} style={{
          height: 8, width: `${w}%`, borderRadius: 99,
          background: 'rgba(255,255,255,0.05)', marginBottom: 10,
          animation: `shimmer 1.5s ease-in-out ${i * 0.15}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes shimmer {
          0%   { opacity: 0.5; }
          50%  { opacity: 1;   }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

// ─── Widget card wrapper ───────────────────────────────────────────────────────

interface WidgetCardProps {
  config: WidgetConfig
}

function WidgetCard({ config }: WidgetCardProps) {
  const Component = WIDGET_MAP[config.widget_id]
  if (!Component) return null

  return (
    <div style={{
      background: 'var(--bg-surface, rgba(255,255,255,0.04))',
      border: '1px solid var(--border-default, rgba(200,164,74,0.12))',
      borderRadius: 'var(--r-sm, 4px)',
      padding: '20px 20px 16px',
      breakInside: 'avoid',
      marginBottom: 16,
    }}>
      {/* card header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: config.description ? 4 : 0 }}>
          <span style={{
            display: 'inline-block', width: 3, height: 12, borderRadius: 2,
            background: 'var(--imi-gold-500, #C8A44A)', flexShrink: 0,
          }} />
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary, rgba(232,224,208,0.5))',
          }}>
            {config.name}
          </span>
          {config.category && (
            <span style={{
              marginLeft: 'auto',
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--imi-gold-500, #C8A44A)',
              opacity: 0.6,
            }}>
              {config.category}
            </span>
          )}
        </div>
        {config.description && (
          <p style={{
            fontSize: 11,
            color: 'var(--text-secondary, rgba(232,224,208,0.4))',
            margin: '2px 0 0 11px',
            lineHeight: 1.5,
          }}>
            {config.description}
          </p>
        )}
      </div>

      {/* divider */}
      <div style={{
        height: 1,
        background: 'var(--border-default, rgba(200,164,74,0.12))',
        marginBottom: 16,
      }} />

      {/* widget content */}
      <Component />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InteligenciaPage() {
  const [widgets, setWidgets]   = useState<WidgetConfig[]>([])
  const [loading, setLoading]   = useState(true)
  const [error,   setError]     = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/widgets')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((data: WidgetConfig[]) => {
        setWidgets(data)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(String(err))
        setLoading(false)
      })
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base, #0B1928)',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        padding: '40px 24px',
      }}>

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <header style={{ marginBottom: 48 }}>
          {/* eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 32, height: 2,
              background: 'var(--imi-gold-500, #C8A44A)',
              borderRadius: 2,
            }} />
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'var(--imi-gold-500, #C8A44A)',
            }}>
              Inteligência de Mercado
            </span>
          </div>

          {/* main title */}
          <h1 style={{
            fontFamily: 'var(--font-display, "Playfair Display", serif)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 700,
            color: 'var(--text-primary, #e8e0d0)',
            letterSpacing: '-1.5px',
            lineHeight: 1.08,
            margin: 0,
          }}>
            Análises ao Vivo
          </h1>

          {/* subtitle + badge row */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 14,
            marginTop: 14,
          }}>
            <p style={{
              fontSize: 15,
              color: 'var(--text-secondary, rgba(232,224,208,0.55))',
              margin: 0,
              lineHeight: 1.5,
            }}>
              Análises em tempo real do mercado imobiliário de Recife
            </p>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 6,
              background: 'rgba(200,164,74,0.08)',
              border: '1px solid rgba(200,164,74,0.22)',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--imi-gold-500, #C8A44A)',
              letterSpacing: '0.06em',
            }}>
              {/* dot */}
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: 'var(--imi-gold-500, #C8A44A)',
                boxShadow: '0 0 6px rgba(200,164,74,0.6)',
                flexShrink: 0,
              }} />
              Recife · Pernambuco
            </span>
          </div>

          {/* decorative rule */}
          <div style={{
            marginTop: 28,
            height: 1,
            background: 'linear-gradient(90deg, rgba(200,164,74,0.30) 0%, rgba(200,164,74,0.08) 60%, transparent 100%)',
          }} />
        </header>

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {error ? (
          <div style={{
            padding: '24px',
            background: 'rgba(220,60,60,0.08)',
            border: '1px solid rgba(220,60,60,0.20)',
            borderRadius: 8,
            color: 'rgba(232,224,208,0.7)',
            fontSize: 13,
          }}>
            Erro ao carregar widgets: {error}
          </div>
        ) : loading ? (
          /* skeleton grid */
          <div style={{
            columns: 1,
            columnGap: 16,
          }}>
            <style>{`
              @media (min-width: 768px)  { .intel-grid { columns: 2 !important; } }
              @media (min-width: 1280px) { .intel-grid { columns: 3 !important; } }
            `}</style>
            <div className="intel-grid" style={{ columns: 1, columnGap: 16 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        ) : widgets.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '64px 24px',
            color: 'var(--text-secondary, rgba(232,224,208,0.4))',
          }}>
            <div style={{
              fontSize: 32,
              marginBottom: 12,
              opacity: 0.3,
            }}>◈</div>
            <p style={{ fontSize: 14, margin: 0 }}>Nenhum widget configurado ainda.</p>
          </div>
        ) : (
          <>
            <style>{`
              @media (min-width: 768px)  { .intel-grid { columns: 2 !important; } }
              @media (min-width: 1280px) { .intel-grid { columns: 3 !important; } }
            `}</style>
            <div className="intel-grid" style={{ columns: 1, columnGap: 16 }}>
              {widgets.map(w => (
                <WidgetCard key={w.widget_id} config={w} />
              ))}
            </div>
          </>
        )}

        {/* ── Footer note ─────────────────────────────────────────────────── */}
        <footer style={{
          marginTop: 56,
          paddingTop: 24,
          borderTop: '1px solid rgba(200,164,74,0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <p style={{
            fontSize: 11,
            color: 'var(--text-secondary, rgba(232,224,208,0.3))',
            margin: 0,
          }}>
            Dados atualizados em tempo real · IMI Analytics Platform
          </p>
          <p style={{
            fontSize: 11,
            color: 'rgba(200,164,74,0.35)',
            margin: 0,
            letterSpacing: '0.06em',
          }}>
            IMI v5 · Recife, PE
          </p>
        </footer>

      </div>
    </div>
  )
}
