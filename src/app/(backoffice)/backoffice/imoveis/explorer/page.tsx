// FILE: /src/app/(backoffice)/backoffice/imoveis/explorer/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, TrendingUp, BarChart2, ArrowLeft, Star, ChevronUp, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { enrichProperty, getScoreColor } from '@/features/properties/services/score.service'
import type { IMIProperty } from '@/features/properties/types'
import { NEIGHBORHOOD_AVG_SQM, NEIGHBORHOOD_YIELD } from '@/features/properties/types'
import { MarketTrendChart, Sparkline } from '@/features/properties/components/MarketTrendChart'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileBottomNav } from '../mobile-ui'

export const dynamic = 'force-dynamic'

/* ─── Helpers ──────────────────────────────────────────────────── */
const DB_STATUS: Record<string, string> = {
  launch: 'lancamento', available: 'disponivel', under_construction: 'em_construcao',
  ready: 'disponivel', sold: 'vendido', reserved: 'reservado',
  negotiating: 'em_negociacao', published: 'disponivel', draft: 'arquivado',
}
function ns(s?: string) { return DB_STATUS[s?.toLowerCase() ?? ''] ?? s?.toLowerCase() ?? 'disponivel' }

function toP(d: any): IMIProperty {
  return {
    id: d.id, name: d.name, type: d.type, condition: d.condition,
    status: ns(d.status_commercial ?? d.status),
    price: d.price_from, area: d.area_min,
    bedrooms: d.bedrooms_from, bathrooms: d.bathrooms_from, parking: d.parking_from,
    neighborhood: d.neighborhood, city: d.city, state: d.state,
    image_urls: d.image_urls, cover_image_url: d.cover_image_url,
    slug: d.slug, created_at: d.created_at,
    developer: Array.isArray(d.developer) ? d.developer[0] : d.developer,
  }
}

function fmt(n?: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2).replace('.', ',')}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

const STATUS_LABELS: Record<string, string> = {
  disponivel: 'Disponível', lancamento: 'Lançamento', em_construcao: 'Em Construção',
  reservado: 'Reservado', em_negociacao: 'Negociação', vendido: 'Vendido', arquivado: 'Arquivado',
}
const STATUS_COLORS: Record<string, string> = {
  disponivel: '#5DB887', lancamento: 'var(--imi-gold-500)', em_construcao: '#5B9BD5',
  reservado: '#D4913A', em_negociacao: '#9FAAB8', vendido: '#E06B6B', arquivado: '#5C6B7D',
}

/* ─── Neighborhood data ──────────────────────────────────────────── */
const NEIGHBORHOOD_TREND_12M: Record<string, number> = {
  'Boa Viagem':     4.2,
  'Pina':           6.1,
  'Miramar':        2.8,
  'Casa Forte':     3.5,
  'Graças':         5.2,
  'Aflitos':        4.8,
  'Recife Antigo':  8.3,
  'Espinheiro':     3.1,
  'Parnamirim':     5.7,
  'Tamarineira':    6.4,
  'Boa Vista':      7.2,
  'Derby':          4.9,
}

function genSparkline(base: number, trend: number): number[] {
  const points: number[] = []
  let cur = base
  for (let i = 0; i < 12; i++) {
    const noise = (Math.random() - 0.5) * base * 0.01
    cur = cur + (cur * trend / 100 / 12) + noise
    points.push(Math.round(cur))
  }
  return points
}

const MONTHS = ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev']

function buildTrendData(neighborhood: string) {
  const base = NEIGHBORHOOD_AVG_SQM[neighborhood] ?? 8000
  const trend = NEIGHBORHOOD_TREND_12M[neighborhood] ?? 3
  const vals = genSparkline(base, trend)
  return MONTHS.map((label, i) => ({ label, value: vals[i] }))
}

/* ─── Types ──────────────────────────────────────────────────────── */
type Tab = 'ranking' | 'analise' | 'oportunidades'
type RankSort = 'yield' | 'price'

/* ─── Shared Eyebrow ─────────────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase',
      color: 'var(--bo-accent, var(--imi-gold-500))', fontFamily: 'var(--font-montserrat, sans-serif)',
      fontWeight: 700,
    }}>
      {children}
    </span>
  )
}

/* ─── Tab Button ─────────────────────────────────────────────────── */
function TabBtn({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 18px', borderRadius: 4,
        background: active ? 'rgba(184,148,58,0.12)' : 'transparent',
        border: active ? '1px solid rgba(184,148,58,0.35)' : '1px solid transparent',
        color: active ? 'var(--bo-accent, var(--imi-gold-500))' : 'var(--bo-text-muted, #9FAAB8)',
        fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px',
        textTransform: 'uppercase', fontFamily: 'var(--font-montserrat, sans-serif)',
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}

/* ─── Stat Card ──────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color: string
}) {
  return (
    <div style={{
      background: 'var(--bo-card, #162040)',
      border: '1px solid rgba(184,148,58,0.18)',
      borderRadius: 12, padding: '18px 20px',
      flex: 1,
    }}>
      <div style={{ marginBottom: 10 }}>
        <Eyebrow>{label}</Eyebrow>
      </div>
      <span style={{
        fontFamily: 'var(--font-dm-mono, monospace)',
        fontSize: '22px', fontWeight: 400, color,
        letterSpacing: '-0.5px', lineHeight: 1,
        display: 'block', marginBottom: sub ? 6 : 0,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{
          fontSize: '10px', color: 'var(--bo-text-dim, #5C6B7D)',
          fontFamily: 'var(--font-montserrat, sans-serif)',
        }}>
          {sub}
        </span>
      )}
    </div>
  )
}

/* ─── Tab 1: Ranking de Bairros ──────────────────────────────────── */
function RankingTab() {
  const [sortBy, setSortBy] = useState<RankSort>('yield')

  const neighborhoods = Object.keys(NEIGHBORHOOD_YIELD)

  const data = neighborhoods.map(n => ({
    name: n,
    avgSqm: NEIGHBORHOOD_AVG_SQM[n] ?? 0,
    yield: NEIGHBORHOOD_YIELD[n] ?? 0,
    trend: NEIGHBORHOOD_TREND_12M[n] ?? 0,
  }))

  const sorted = [...data].sort((a, b) =>
    sortBy === 'yield' ? b.yield - a.yield : b.avgSqm - a.avgSqm
  )

  const maxSqm = Math.max(...data.map(d => d.avgSqm))
  const maxYield = Math.max(...data.map(d => d.yield))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{
            fontSize: '11px', color: 'var(--bo-text-dim, #5C6B7D)',
            fontFamily: 'var(--font-montserrat, sans-serif)',
          }}>
            {neighborhoods.length} bairros · dados de benchmark IMI
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <TabBtn active={sortBy === 'yield'} onClick={() => setSortBy('yield')}>
            Yield
          </TabBtn>
          <TabBtn active={sortBy === 'price'} onClick={() => setSortBy('price')}>
            Preço/m²
          </TabBtn>
        </div>
      </div>

      {/* Ranking list */}
      <div style={{
        background: 'var(--bo-card, #162040)',
        border: '1px solid rgba(184,148,58,0.18)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '32px 1fr 120px 90px 80px 1fr',
          padding: '10px 20px',
          background: 'rgba(184,148,58,0.04)',
          borderBottom: '1px solid rgba(184,148,58,0.10)',
          gap: 12,
        }}>
          {['#', 'Bairro', 'Preço Médio/m²', 'Yield Est.', 'Tendência 12m', 'Distribuição'].map(h => (
            <span key={h} style={{
              fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px',
              textTransform: 'uppercase', color: 'var(--bo-text-dim, #5C6B7D)',
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {sorted.map((d, i) => (
          <div
            key={d.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 120px 90px 80px 1fr',
              padding: '13px 20px',
              borderBottom: i < sorted.length - 1 ? '1px solid rgba(184,148,58,0.05)' : 'none',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {/* Rank */}
            <span style={{
              fontFamily: 'var(--font-dm-mono, monospace)',
              fontSize: '11px',
              color: i === 0 ? 'var(--imi-gold-500)' : i === 1 ? '#9FAAB8' : i === 2 ? '#D4913A' : 'var(--bo-text-dim, #5C6B7D)',
              fontWeight: i < 3 ? 600 : 400,
            }}>
              {i + 1}
            </span>

            {/* Name */}
            <span style={{
              fontSize: '12px', color: 'var(--bo-text, #EBE7E0)',
              fontFamily: 'var(--font-montserrat, sans-serif)', fontWeight: 500,
            }}>
              {d.name}
            </span>

            {/* Price/sqm */}
            <span style={{
              fontFamily: 'var(--font-dm-mono, monospace)',
              fontSize: '12px', color: 'var(--bo-accent, var(--imi-gold-500))',
              fontWeight: 400,
            }}>
              R$ {d.avgSqm.toLocaleString('pt-BR')}/m²
            </span>

            {/* Yield */}
            <span style={{
              fontFamily: 'var(--font-dm-mono, monospace)',
              fontSize: '12px', color: '#5DB887',
            }}>
              {d.yield.toFixed(1)}% a.a.
            </span>

            {/* Trend */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {d.trend >= 0
                ? <ChevronUp size={12} style={{ color: '#5DB887', flexShrink: 0 }} />
                : <ChevronDown size={12} style={{ color: '#E06B6B', flexShrink: 0 }} />
              }
              <span style={{
                fontFamily: 'var(--font-dm-mono, monospace)',
                fontSize: '11px',
                color: d.trend >= 0 ? '#5DB887' : '#E06B6B',
              }}>
                {d.trend >= 0 ? '+' : ''}{d.trend}%
              </span>
            </div>

            {/* Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, flex: 1,
            }}>
              <div style={{
                flex: 1, height: 6, borderRadius: 999,
                background: 'rgba(255,255,255,0.05)',
              }}>
                <div style={{
                  height: '100%', borderRadius: 999,
                  width: `${((sortBy === 'yield' ? d.yield : d.avgSqm) / (sortBy === 'yield' ? maxYield : maxSqm)) * 100}%`,
                  background: i === 0
                    ? 'linear-gradient(90deg, #A8842A, var(--imi-gold-500))'
                    : `linear-gradient(90deg, rgba(184,148,58,${0.25 + (1 - i / sorted.length) * 0.45}), rgba(184,148,58,${0.45 + (1 - i / sorted.length) * 0.35}))`,
                  transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Tab 2: Análise de Mercado ──────────────────────────────────── */
function AnaliseTab() {
  const neighborhoods = Object.keys(NEIGHBORHOOD_YIELD)
  const prices = Object.values(NEIGHBORHOOD_AVG_SQM)
  const yields = Object.values(NEIGHBORHOOD_YIELD)

  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  const avgYield = (yields.reduce((a, b) => a + b, 0) / yields.length).toFixed(1)

  const bestYieldNeigh = Object.entries(NEIGHBORHOOD_YIELD).sort((a, b) => b[1] - a[1])[0]
  const bestPriceNeigh = Object.entries(NEIGHBORHOOD_AVG_SQM).sort((a, b) => a[1] - b[1])[0]

  // Top 3 neighborhoods for trend chart
  const top3 = Object.entries(NEIGHBORHOOD_YIELD)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  const chartColors = ['var(--imi-gold-500)', '#5DB887', '#5B9BD5']

  // Price heatmap: neighborhoods × metrics
  const heatmapNeighs = neighborhoods.slice(0, 8)
  const metrics = ['Preço/m²', 'Yield', 'Tendência', 'Liquidez']

  function getMetricValue(n: string, metric: string): number {
    if (metric === 'Preço/m²') return NEIGHBORHOOD_AVG_SQM[n] ?? 0
    if (metric === 'Yield') return NEIGHBORHOOD_YIELD[n] ?? 0
    if (metric === 'Tendência') return NEIGHBORHOOD_TREND_12M[n] ?? 0
    const popular = ['Boa Viagem', 'Miramar', 'Pina', 'Casa Forte', 'Parnamirim']
    return popular.includes(n) ? 82 : 58
  }

  function heatColor(val: number, min: number, max: number): string {
    const pct = (val - min) / (max - min || 1)
    const r = Math.round(91 + (200 - 91) * pct)
    const g = Math.round(155 + (164 - 155) * pct)
    const b = Math.round(213 + (74 - 213) * pct)
    return `rgba(${r},${g},${b},${0.1 + pct * 0.3})`
  }

  const metricRanges = metrics.map(m => {
    const vals = heatmapNeighs.map(n => getMetricValue(n, m))
    return { min: Math.min(...vals), max: Math.max(...vals) }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard
          label="Preço Médio Mercado"
          value={`R$ ${avgPrice.toLocaleString('pt-BR')}/m²`}
          sub="média ponderada dos bairros"
          color="var(--bo-accent, var(--imi-gold-500))"
        />
        <StatCard
          label="Yield Médio"
          value={`${avgYield}%`}
          sub="estimativa de retorno anual"
          color="#5DB887"
        />
        <StatCard
          label="Melhor Yield"
          value={bestYieldNeigh[0]}
          sub={`${bestYieldNeigh[1]}% a.a. estimado`}
          color="#5B9BD5"
        />
        <StatCard
          label="Melhor Preço/m²"
          value={bestPriceNeigh[0]}
          sub={`R$ ${bestPriceNeigh[1].toLocaleString('pt-BR')}/m²`}
          color="#D4913A"
        />
      </div>

      {/* Trend charts */}
      <div>
        <div style={{ marginBottom: 14 }}>
          <Eyebrow>Tendência de Preço 12 Meses — Top 3 Bairros</Eyebrow>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {top3.map((n, i) => {
            const trendData = buildTrendData(n)
            const trend12m = NEIGHBORHOOD_TREND_12M[n] ?? 0
            const curPrice = NEIGHBORHOOD_AVG_SQM[n] ?? 0
            return (
              <div
                key={n}
                style={{
                  flex: 1,
                  background: 'var(--bo-card, #162040)',
                  border: '1px solid rgba(184,148,58,0.18)',
                  borderRadius: 12, padding: '18px',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{
                      fontSize: '12px', fontWeight: 600,
                      color: 'var(--bo-text, #EBE7E0)',
                      fontFamily: 'var(--font-montserrat, sans-serif)',
                      marginBottom: 2,
                    }}>
                      {n}
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-dm-mono, monospace)',
                      fontSize: '11px', color: chartColors[i],
                    }}>
                      R$ {curPrice.toLocaleString('pt-BR')}/m²
                    </p>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    padding: '3px 8px', borderRadius: 20,
                    background: trend12m >= 0 ? 'rgba(93,184,135,0.12)' : 'rgba(224,107,107,0.12)',
                    border: `1px solid ${trend12m >= 0 ? 'rgba(93,184,135,0.3)' : 'rgba(224,107,107,0.3)'}`,
                  }}>
                    {trend12m >= 0
                      ? <ChevronUp size={10} style={{ color: '#5DB887' }} />
                      : <ChevronDown size={10} style={{ color: '#E06B6B' }} />
                    }
                    <span style={{
                      fontFamily: 'var(--font-dm-mono, monospace)',
                      fontSize: '10px',
                      color: trend12m >= 0 ? '#5DB887' : '#E06B6B',
                    }}>
                      {trend12m >= 0 ? '+' : ''}{trend12m}%
                    </span>
                  </div>
                </div>
                <MarketTrendChart
                  data={trendData}
                  color={chartColors[i]}
                  height={56}
                  showLabels
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Price Heatmap Table */}
      <div>
        <div style={{ marginBottom: 14 }}>
          <Eyebrow>Heatmap de Indicadores por Bairro</Eyebrow>
        </div>
        <div style={{
          background: 'var(--bo-card, #162040)',
          border: '1px solid rgba(184,148,58,0.18)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `160px repeat(${metrics.length}, 1fr)`,
            padding: '10px 16px',
            background: 'rgba(184,148,58,0.04)',
            borderBottom: '1px solid rgba(184,148,58,0.10)',
            gap: 8,
          }}>
            <span style={{
              fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px',
              textTransform: 'uppercase', color: 'var(--bo-text-dim, #5C6B7D)',
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}>
              Bairro
            </span>
            {metrics.map(m => (
              <span key={m} style={{
                fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px',
                textTransform: 'uppercase', color: 'var(--bo-text-dim, #5C6B7D)',
                fontFamily: 'var(--font-montserrat, sans-serif)',
              }}>
                {m}
              </span>
            ))}
          </div>

          {/* Rows */}
          {heatmapNeighs.map((n, ri) => (
            <div
              key={n}
              style={{
                display: 'grid',
                gridTemplateColumns: `160px repeat(${metrics.length}, 1fr)`,
                padding: '10px 16px',
                borderBottom: ri < heatmapNeighs.length - 1 ? '1px solid rgba(184,148,58,0.05)' : 'none',
                gap: 8,
                alignItems: 'center',
              }}
            >
              <span style={{
                fontSize: '11px', color: 'var(--bo-text-muted, #9FAAB8)',
                fontFamily: 'var(--font-montserrat, sans-serif)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {n}
              </span>
              {metrics.map((m, mi) => {
                const val = getMetricValue(n, m)
                const { min, max } = metricRanges[mi]
                const bg = heatColor(val, min, max)
                let display = ''
                if (m === 'Preço/m²') display = `R$${(val / 1000).toFixed(1)}k`
                else if (m === 'Yield') display = `${val.toFixed(1)}%`
                else if (m === 'Tendência') display = `${val >= 0 ? '+' : ''}${val}%`
                else display = `${val}`

                return (
                  <div
                    key={m}
                    style={{
                      padding: '5px 8px', borderRadius: 6,
                      background: bg,
                      textAlign: 'center',
                    }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-dm-mono, monospace)',
                      fontSize: '10px',
                      color: m === 'Tendência' && val < 0 ? '#E06B6B' : 'var(--bo-text, #EBE7E0)',
                    }}>
                      {display}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Tab 3: Oportunidades ───────────────────────────────────────── */
function OportunidadesTab({ properties }: { properties: IMIProperty[] }) {
  if (properties.length === 0) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '60px 24px', gap: 16, textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'rgba(184,148,58,0.06)',
          border: '1px solid rgba(184,148,58,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Building2 size={28} style={{ color: 'rgba(184,148,58,0.35)' }} />
        </div>
        <p style={{
          fontFamily: 'var(--font-playfair, serif)',
          fontSize: '18px', color: 'var(--bo-text, #EBE7E0)',
        }}>
          Sem imóveis cadastrados
        </p>
        <p style={{
          fontSize: '11px', color: 'var(--bo-text-dim, #5C6B7D)',
          fontFamily: 'var(--font-montserrat, sans-serif)',
        }}>
          Cadastre imóveis para ver análise de oportunidades.
        </p>
        <Link href="/backoffice/imoveis/novo">
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 4,
            background: 'var(--gold, var(--imi-gold-500))', border: 'none',
            color: 'var(--navy, #0B1120)',
            fontSize: '10px', fontWeight: 700, letterSpacing: '1.8px',
            textTransform: 'uppercase', fontFamily: 'var(--font-montserrat, sans-serif)',
            cursor: 'pointer',
          }}>
            Cadastrar Imóvel
          </button>
        </Link>
      </div>
    )
  }

  const top10Score = [...properties]
    .sort((a, b) => (b.imi_score ?? 0) - (a.imi_score ?? 0))
    .slice(0, 10)

  const top5BelowMarket = [...properties]
    .filter(p => (p.market_delta_pct ?? 0) > 0)
    .sort((a, b) => (b.market_delta_pct ?? 0) - (a.market_delta_pct ?? 0))
    .slice(0, 5)

  const top5Yield = [...properties]
    .sort((a, b) => (b.yield_est ?? 0) - (a.yield_est ?? 0))
    .slice(0, 5)

  function PropertyRow({ p, rank, metric }: {
    p: IMIProperty; rank: number; metric?: string
  }) {
    const sc = p.imi_score ?? 0
    const scColor = getScoreColor(sc)
    const stColor = STATUS_COLORS[p.status] ?? '#9FAAB8'

    return (
      <Link href={`/backoffice/imoveis/${p.id}`}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '11px 16px',
            borderBottom: '1px solid rgba(184,148,58,0.05)',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(184,148,58,0.03)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{
            fontFamily: 'var(--font-dm-mono, monospace)',
            fontSize: '12px', width: 24, flexShrink: 0, textAlign: 'center',
            color: rank <= 3 ? 'var(--imi-gold-500)' : 'var(--bo-text-dim, #5C6B7D)',
            fontWeight: rank <= 3 ? 600 : 400,
          }}>
            {rank}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: '11px', fontWeight: 500,
              color: 'var(--bo-text, #EBE7E0)',
              fontFamily: 'var(--font-montserrat, sans-serif)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              marginBottom: 2,
            }}>
              {p.name}
            </p>
            <p style={{
              fontSize: '9px', color: 'var(--bo-text-dim, #5C6B7D)',
              fontFamily: 'var(--font-montserrat, sans-serif)',
            }}>
              {[p.neighborhood, p.city].filter(Boolean).join(', ')}
            </p>
          </div>
          <span style={{
            fontFamily: 'var(--font-dm-mono, monospace)',
            fontSize: '10px', color: 'var(--bo-text-muted, #9FAAB8)',
            flexShrink: 0,
          }}>
            {fmt(p.price)}
          </span>
          {metric === 'score' && (
            <span style={{
              fontFamily: 'var(--font-dm-mono, monospace)',
              fontSize: '12px', fontWeight: 600, color: scColor,
              flexShrink: 0, width: 40, textAlign: 'right',
            }}>
              {sc}
            </span>
          )}
          {metric === 'delta' && (
            <span style={{
              fontFamily: 'var(--font-dm-mono, monospace)',
              fontSize: '11px', color: '#5DB887',
              flexShrink: 0, width: 52, textAlign: 'right',
            }}>
              +{(p.market_delta_pct ?? 0).toFixed(1)}%
            </span>
          )}
          {metric === 'yield' && (
            <span style={{
              fontFamily: 'var(--font-dm-mono, monospace)',
              fontSize: '11px', color: '#5DB887',
              flexShrink: 0, width: 56, textAlign: 'right',
            }}>
              {(p.yield_est ?? 0).toFixed(2)}%
            </span>
          )}
          <span style={{
            display: 'inline-flex', padding: '2px 7px', borderRadius: 20,
            background: `${stColor}15`, border: `1px solid ${stColor}30`,
            fontSize: '7.5px', fontWeight: 600, letterSpacing: '0.5px',
            color: stColor, fontFamily: 'var(--font-montserrat, sans-serif)',
            textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {STATUS_LABELS[p.status] ?? p.status}
          </span>
        </div>
      </Link>
    )
  }

  function OppSection({ title, eyebrow, items, metric, emptyMsg }: {
    title: string; eyebrow: string; items: IMIProperty[];
    metric: 'score' | 'delta' | 'yield'; emptyMsg: string
  }) {
    return (
      <div style={{
        background: 'var(--bo-card, #162040)',
        border: '1px solid rgba(184,148,58,0.18)',
        borderRadius: 12, overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(184,148,58,0.10)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <span style={{
            width: 1, height: 12, background: 'rgba(184,148,58,0.2)',
            display: 'inline-block',
          }} />
          <span style={{
            fontSize: '11px', color: 'var(--bo-text-muted, #9FAAB8)',
            fontFamily: 'var(--font-montserrat, sans-serif)',
          }}>
            {title}
          </span>
        </div>
        {items.length === 0 ? (
          <div style={{
            padding: '20px 16px', textAlign: 'center',
            color: 'var(--bo-text-dim, #5C6B7D)',
            fontFamily: 'var(--font-montserrat, sans-serif)', fontSize: '11px',
          }}>
            {emptyMsg}
          </div>
        ) : (
          items.map((p, i) => (
            <PropertyRow key={p.id} p={p} rank={i + 1} metric={metric} />
          ))
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <OppSection
        eyebrow="Top IMI Score"
        title="Top 10 imóveis com maior score de investimento"
        items={top10Score}
        metric="score"
        emptyMsg="Nenhum imóvel cadastrado"
      />
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <OppSection
            eyebrow="Abaixo do Mercado"
            title="Top 5 imóveis com maior desconto vs. mercado"
            items={top5BelowMarket}
            metric="delta"
            emptyMsg="Nenhum imóvel abaixo do preço de mercado encontrado"
          />
        </div>
        <div style={{ flex: 1 }}>
          <OppSection
            eyebrow="Maior Yield"
            title="Top 5 imóveis com maior yield estimado"
            items={top5Yield}
            metric="yield"
            emptyMsg="Nenhum imóvel com yield estimado"
          />
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MOBILE EXPLORER
   ════════════════════════════════════════════════════════════════════ */
function MobileExplorer() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('ranking')
  const [properties, setProperties] = useState<IMIProperty[]>([])
  const [loadingProps, setLoadingProps] = useState(false)
  const [rankSort, setRankSort] = useState<RankSort>('yield')

  useEffect(() => {
    if (activeTab !== 'oportunidades') return
    if (properties.length > 0) return
    setLoadingProps(true)
    const supabase = createClient()
    supabase
      .from('developments')
      .select(`
        id, name, type, status, status_commercial, condition,
        price_from, area_min, area_max, bedrooms_from, bathrooms_from, parking_from,
        neighborhood, city, state, image_urls, cover_image_url, slug, created_at,
        developer:developers(id, name, logo_url)
      `)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProperties((data ?? []).map(d => enrichProperty(toP(d))))
        setLoadingProps(false)
      })
  }, [activeTab, properties.length])

  /* ── Ranking data ─────────────────────── */
  const neighborhoods = Object.keys(NEIGHBORHOOD_YIELD)
  const rankingData = neighborhoods.map(n => ({
    name: n,
    avgSqm: NEIGHBORHOOD_AVG_SQM[n] ?? 0,
    yield: NEIGHBORHOOD_YIELD[n] ?? 0,
    trend: NEIGHBORHOOD_TREND_12M[n] ?? 0,
  }))
  const sortedRanking = [...rankingData].sort((a, b) =>
    rankSort === 'yield' ? b.yield - a.yield : b.avgSqm - a.avgSqm
  )

  /* ── Análise stats ────────────────────── */
  const prices = Object.values(NEIGHBORHOOD_AVG_SQM)
  const yields = Object.values(NEIGHBORHOOD_YIELD)
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  const avgYield = (yields.reduce((a, b) => a + b, 0) / yields.length).toFixed(1)
  const bestYieldNeigh = Object.entries(NEIGHBORHOOD_YIELD).sort((a, b) => b[1] - a[1])[0]
  const bestPriceNeigh = Object.entries(NEIGHBORHOOD_AVG_SQM).sort((a, b) => a[1] - b[1])[0]

  /* ── Oportunidades ────────────────────── */
  const top10Score = [...properties]
    .sort((a, b) => (b.imi_score ?? 0) - (a.imi_score ?? 0))
    .slice(0, 10)
  const top5Yield = [...properties]
    .sort((a, b) => (b.yield_est ?? 0) - (a.yield_est ?? 0))
    .slice(0, 5)

  const TABS: { id: Tab; label: string }[] = [
    { id: 'ranking', label: 'Ranking' },
    { id: 'analise', label: 'Análise' },
    { id: 'oportunidades', label: 'Oportunidades' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-montserrat, sans-serif)',
      paddingBottom: 56,
    }}>
      <MobileGlobalStyles />
      {/* ── Fixed App Bar ────────────────────────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 56, background: 'var(--bg-elevated)',
        borderBottom: '1px solid rgba(184,148,58,0.15)',
        display: 'flex', alignItems: 'center', paddingLeft: 4, paddingRight: 16, gap: 4,
      }}>
        <button
          onClick={() => router.push('/backoffice/imoveis')}
          style={{
            width: 44, height: 44, borderRadius: 8,
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ArrowLeft size={20} color="var(--imi-gold-500)" />
        </button>
        <span style={{
          fontFamily: 'var(--font-playfair, "Libre Baskerville", serif)',
          fontSize: '17px', fontWeight: 600, color: '#EBE7E0',
          flex: 1,
        }}>
          Explorer de Mercado
        </span>
      </div>

      {/* ── Horizontal Tab Bar ───────────────────────── */}
      <div style={{
        position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99,
        height: 56, background: 'var(--bg-surface)',
        borderBottom: '1px solid rgba(184,148,58,0.10)',
        display: 'flex', alignItems: 'center',
        overflowX: 'auto', scrollbarWidth: 'none',
        paddingLeft: 14, paddingRight: 14, gap: 0,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              height: 44, paddingLeft: 18, paddingRight: 18,
              background: 'transparent', border: 'none',
              borderBottom: activeTab === tab.id
                ? '2px solid var(--imi-gold-500)'
                : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--imi-gold-500)' : '#9FAAB8',
              fontSize: '12px', fontWeight: activeTab === tab.id ? 700 : 500,
              letterSpacing: '0.5px', cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0,
              fontFamily: 'var(--font-montserrat, sans-serif)',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
        <style suppressHydrationWarning>{`.mob-tab-bar::-webkit-scrollbar{display:none}`}</style>
      </div>

      {/* ── Scrollable Content ───────────────────────── */}
      <div style={{
        flex: 1, paddingTop: 112, paddingBottom: 72,
        paddingLeft: 14, paddingRight: 14,
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>

        {/* ── RANKING TAB ─────────────────────────── */}
        {activeTab === 'ranking' && (
          <>
            {/* Sort toggle */}
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              {(['yield', 'price'] as RankSort[]).map(s => (
                <button
                  key={s}
                  onClick={() => setRankSort(s)}
                  style={{
                    flex: 1, height: 44,
                    background: rankSort === s ? 'rgba(184,148,58,0.12)' : '#162040',
                    border: rankSort === s ? '1px solid rgba(184,148,58,0.4)' : '1px solid rgba(184,148,58,0.12)',
                    borderRadius: 8,
                    color: rankSort === s ? 'var(--imi-gold-500)' : '#9FAAB8',
                    fontSize: '11px', fontWeight: 700, letterSpacing: '1px',
                    textTransform: 'uppercase', cursor: 'pointer',
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                  }}
                >
                  {s === 'yield' ? 'Yield' : 'Preço/m²'}
                </button>
              ))}
            </div>

            {/* Eyebrow label */}
            <div style={{ paddingTop: 4 }}>
              <span style={{
                fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase',
                color: 'var(--imi-gold-500)', fontWeight: 700,
                fontFamily: 'var(--font-montserrat, sans-serif)',
              }}>
                Ranking de Bairros
              </span>
            </div>

            {/* Neighborhood cards */}
            {sortedRanking.map((d, i) => (
              <div key={d.name} style={{
                background: 'var(--bg-elevated)',
                border: '1px solid rgba(184,148,58,0.12)',
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
                minHeight: 52,
              }}>
                {/* Rank number */}
                <span style={{
                  fontFamily: 'var(--font-dm-mono, monospace)',
                  fontSize: '14px', fontWeight: i < 3 ? 700 : 400,
                  color: i === 0 ? 'var(--imi-gold-500)' : i === 1 ? '#9FAAB8' : i === 2 ? '#D4913A' : '#5C6B7D',
                  width: 24, flexShrink: 0, textAlign: 'center',
                }}>
                  {i + 1}
                </span>
                {/* Name */}
                <span style={{
                  flex: 1, fontSize: '13px', fontWeight: 500,
                  color: '#EBE7E0', fontFamily: 'var(--font-montserrat, sans-serif)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {d.name}
                </span>
                {/* Price/sqm */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{
                    fontFamily: 'var(--font-dm-mono, monospace)',
                    fontSize: '12px', color: 'var(--imi-gold-500)',
                  }}>
                    R$ {d.avgSqm.toLocaleString('pt-BR')}/m²
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 }}>
                    {d.trend >= 0
                      ? <ChevronUp size={10} style={{ color: '#5DB887' }} />
                      : <ChevronDown size={10} style={{ color: '#E06B6B' }} />
                    }
                    <span style={{
                      fontFamily: 'var(--font-dm-mono, monospace)',
                      fontSize: '11px', color: '#5DB887',
                    }}>
                      {d.yield.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── ANÁLISE TAB ─────────────────────────── */}
        {activeTab === 'analise' && (
          <>
            {/* Eyebrow */}
            <div style={{ paddingTop: 4 }}>
              <span style={{
                fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase',
                color: 'var(--imi-gold-500)', fontWeight: 700,
                fontFamily: 'var(--font-montserrat, sans-serif)',
              }}>
                Visão Geral do Mercado
              </span>
            </div>

            {/* 2-col stat grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Preço Médio/m²', value: `R$ ${(avgPrice / 1000).toFixed(1)}k`, color: 'var(--imi-gold-500)' },
                { label: 'Yield Médio', value: `${avgYield}%`, color: '#5DB887' },
                { label: 'Melhor Yield', value: bestYieldNeigh[0], color: '#5B9BD5' },
                { label: 'Menor Preço/m²', value: bestPriceNeigh[0], color: '#D4913A' },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid rgba(184,148,58,0.12)',
                  borderRadius: 12, padding: 14,
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  <span style={{
                    fontSize: '8.5px', letterSpacing: '2px', textTransform: 'uppercase',
                    color: '#5C6B7D', fontWeight: 700,
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                  }}>
                    {stat.label}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-dm-mono, monospace)',
                    fontSize: '22px', color: stat.color, lineHeight: 1,
                    letterSpacing: '-0.5px',
                  }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Eyebrow for heatmap */}
            <div>
              <span style={{
                fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase',
                color: 'var(--imi-gold-500)', fontWeight: 700,
                fontFamily: 'var(--font-montserrat, sans-serif)',
              }}>
                Indicadores por Bairro
              </span>
            </div>

            {/* Bairro cards with metrics */}
            {Object.keys(NEIGHBORHOOD_YIELD).slice(0, 8).map(n => {
              const yld = NEIGHBORHOOD_YIELD[n] ?? 0
              const sqm = NEIGHBORHOOD_AVG_SQM[n] ?? 0
              const trend = NEIGHBORHOOD_TREND_12M[n] ?? 0
              return (
                <div key={n} style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid rgba(184,148,58,0.12)',
                  borderRadius: 12, padding: '14px 16px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 10,
                  }}>
                    <span style={{
                      fontSize: '13px', fontWeight: 600, color: '#EBE7E0',
                      fontFamily: 'var(--font-montserrat, sans-serif)',
                    }}>
                      {n}
                    </span>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 3,
                      padding: '3px 8px', borderRadius: 20,
                      background: trend >= 0 ? 'rgba(93,184,135,0.12)' : 'rgba(224,107,107,0.12)',
                      border: `1px solid ${trend >= 0 ? 'rgba(93,184,135,0.3)' : 'rgba(224,107,107,0.3)'}`,
                    }}>
                      {trend >= 0
                        ? <ChevronUp size={10} style={{ color: '#5DB887' }} />
                        : <ChevronDown size={10} style={{ color: '#E06B6B' }} />
                      }
                      <span style={{
                        fontFamily: 'var(--font-dm-mono, monospace)',
                        fontSize: '11px',
                        color: trend >= 0 ? '#5DB887' : '#E06B6B',
                      }}>
                        {trend >= 0 ? '+' : ''}{trend}%
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{
                        fontSize: '8px', color: '#5C6B7D', letterSpacing: '1.5px',
                        textTransform: 'uppercase', marginBottom: 3,
                        fontFamily: 'var(--font-montserrat, sans-serif)',
                      }}>
                        Preço/m²
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-dm-mono, monospace)',
                        fontSize: '13px', color: 'var(--imi-gold-500)',
                      }}>
                        R$ {(sqm / 1000).toFixed(1)}k
                      </div>
                    </div>
                    <div>
                      <div style={{
                        fontSize: '8px', color: '#5C6B7D', letterSpacing: '1.5px',
                        textTransform: 'uppercase', marginBottom: 3,
                        fontFamily: 'var(--font-montserrat, sans-serif)',
                      }}>
                        Yield
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-dm-mono, monospace)',
                        fontSize: '13px', color: '#5DB887',
                      }}>
                        {yld.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── OPORTUNIDADES TAB ───────────────────── */}
        {activeTab === 'oportunidades' && (
          <>
            {loadingProps ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '60px 24px', gap: 12,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '2px solid rgba(184,148,58,0.2)',
                  borderTopColor: 'var(--imi-gold-500)',
                  animation: 'mob-spin 0.8s linear infinite',
                }} />
                <span style={{ color: '#9FAAB8', fontSize: '12px' }}>Carregando imóveis…</span>
              </div>
            ) : properties.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '60px 24px', gap: 16, textAlign: 'center',
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: 'rgba(184,148,58,0.06)',
                  border: '1px solid rgba(184,148,58,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Building2 size={28} style={{ color: 'rgba(184,148,58,0.35)' }} />
                </div>
                <p style={{
                  fontFamily: 'var(--font-playfair, serif)',
                  fontSize: '18px', color: '#EBE7E0',
                }}>
                  Sem imóveis cadastrados
                </p>
                <Link href="/backoffice/imoveis/novo">
                  <button style={{
                    height: 44, paddingLeft: 20, paddingRight: 20, borderRadius: 8,
                    background: 'var(--imi-gold-500)', border: 'none',
                    color: '#0B1120', fontSize: '11px', fontWeight: 700,
                    letterSpacing: '1.5px', textTransform: 'uppercase',
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                    cursor: 'pointer',
                  }}>
                    Cadastrar Imóvel
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {/* Top Score section */}
                <div style={{ paddingTop: 4 }}>
                  <span style={{
                    fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase',
                    color: 'var(--imi-gold-500)', fontWeight: 700,
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                  }}>
                    Top IMI Score
                  </span>
                </div>
                {top10Score.map((p, i) => {
                  const sc = p.imi_score ?? 0
                  const scColor = getScoreColor(sc)
                  const stColor = STATUS_COLORS[p.status] ?? '#9FAAB8'
                  return (
                    <Link key={p.id} href={`/backoffice/imoveis/${p.id}`}>
                      <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid rgba(184,148,58,0.12)',
                        borderRadius: 12, padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        minHeight: 52,
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-dm-mono, monospace)',
                          fontSize: '13px', width: 22, flexShrink: 0, textAlign: 'center',
                          color: i < 3 ? 'var(--imi-gold-500)' : '#5C6B7D',
                          fontWeight: i < 3 ? 700 : 400,
                        }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '13px', fontWeight: 500, color: '#EBE7E0',
                            fontFamily: 'var(--font-montserrat, sans-serif)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginBottom: 2,
                          }}>
                            {p.name}
                          </p>
                          <p style={{
                            fontSize: '10px', color: '#5C6B7D',
                            fontFamily: 'var(--font-montserrat, sans-serif)',
                          }}>
                            {[p.neighborhood, p.city].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-dm-mono, monospace)',
                          fontSize: '14px', fontWeight: 700, color: scColor,
                          flexShrink: 0,
                        }}>
                          {sc}
                        </span>
                        <span style={{
                          display: 'inline-flex', padding: '3px 8px', borderRadius: 20,
                          background: `${stColor}18`, border: `1px solid ${stColor}35`,
                          fontSize: '8px', fontWeight: 600,
                          color: stColor, fontFamily: 'var(--font-montserrat, sans-serif)',
                          textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          {STATUS_LABELS[p.status] ?? p.status}
                        </span>
                      </div>
                    </Link>
                  )
                })}

                {/* Top Yield section */}
                <div style={{ paddingTop: 8 }}>
                  <span style={{
                    fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase',
                    color: 'var(--imi-gold-500)', fontWeight: 700,
                    fontFamily: 'var(--font-montserrat, sans-serif)',
                  }}>
                    Maior Yield Estimado
                  </span>
                </div>
                {top5Yield.map((p, i) => {
                  const stColor = STATUS_COLORS[p.status] ?? '#9FAAB8'
                  return (
                    <Link key={p.id} href={`/backoffice/imoveis/${p.id}`}>
                      <div style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid rgba(184,148,58,0.12)',
                        borderRadius: 12, padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: 12,
                        minHeight: 52,
                      }}>
                        <span style={{
                          fontFamily: 'var(--font-dm-mono, monospace)',
                          fontSize: '13px', width: 22, flexShrink: 0, textAlign: 'center',
                          color: i < 3 ? 'var(--imi-gold-500)' : '#5C6B7D', fontWeight: i < 3 ? 700 : 400,
                        }}>
                          {i + 1}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            fontSize: '13px', fontWeight: 500, color: '#EBE7E0',
                            fontFamily: 'var(--font-montserrat, sans-serif)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            marginBottom: 2,
                          }}>
                            {p.name}
                          </p>
                          <p style={{
                            fontSize: '10px', color: '#5C6B7D',
                            fontFamily: 'var(--font-montserrat, sans-serif)',
                          }}>
                            {fmt(p.price)}
                          </p>
                        </div>
                        <span style={{
                          fontFamily: 'var(--font-dm-mono, monospace)',
                          fontSize: '14px', fontWeight: 600, color: '#5DB887', flexShrink: 0,
                        }}>
                          {(p.yield_est ?? 0).toFixed(2)}%
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>

      <style suppressHydrationWarning>{`
        @keyframes mob-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <MobileBottomNav />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   DESKTOP EXPLORER
   ════════════════════════════════════════════════════════════════════ */
function DesktopExplorer() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('ranking')
  const [properties, setProperties] = useState<IMIProperty[]>([])
  const [loadingProps, setLoadingProps] = useState(false)

  useEffect(() => {
    if (activeTab !== 'oportunidades') return
    if (properties.length > 0) return
    setLoadingProps(true)
    const supabase = createClient()
    supabase
      .from('developments')
      .select(`
        id, name, type, status, status_commercial, condition,
        price_from, area_min, area_max, bedrooms_from, bathrooms_from, parking_from,
        neighborhood, city, state, image_urls, cover_image_url, slug, created_at,
        developer:developers(id, name, logo_url)
      `)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProperties((data ?? []).map(d => enrichProperty(toP(d))))
        setLoadingProps(false)
      })
  }, [activeTab, properties.length])

  return (
    <div className="explorer-wrap" style={{
      minHeight: '100vh',
      background: 'var(--bo-bg, #0B1120)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Header ───────────────────────────────────────── */}
      <header style={{
        padding: '20px 28px',
        borderBottom: '1px solid rgba(184,148,58,0.12)',
        background: 'var(--bo-card, #162040)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid bg */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(184,148,58,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(184,148,58,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }} />
        {/* Radial accent */}
        <div style={{
          position: 'absolute', top: -80, right: 60,
          width: 320, height: 320, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184,148,58,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Eyebrow>IMI</Eyebrow>
            <span style={{ color: 'rgba(184,148,58,0.3)', fontSize: 10 }}>›</span>
            <Link href="/backoffice/imoveis">
              <span style={{
                fontSize: '8px', fontWeight: 500, letterSpacing: '2px',
                textTransform: 'uppercase', color: 'var(--bo-text-dim, #5C6B7D)',
                fontFamily: 'var(--font-montserrat, sans-serif)', cursor: 'pointer',
              }}>Imóveis</span>
            </Link>
            <span style={{ color: 'rgba(184,148,58,0.3)', fontSize: 10 }}>›</span>
            <Eyebrow>Market Intelligence</Eyebrow>
          </div>

          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-playfair, "Libre Baskerville", serif)',
                fontSize: '28px', fontWeight: 600,
                color: 'var(--bo-text, #EBE7E0)', marginBottom: 4, lineHeight: 1.1,
              }}>
                Explorer de <em style={{ fontStyle: 'italic', color: 'var(--bo-accent, var(--imi-gold-500))' }}>Mercado</em>
              </h1>
              <p style={{
                fontSize: '11px', color: 'var(--bo-text-dim, #5C6B7D)',
                fontFamily: 'var(--font-montserrat, sans-serif)', fontWeight: 300,
              }}>
                Inteligência de mercado · ranking de bairros · análise de oportunidades
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/backoffice/imoveis">
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 4,
                  background: 'transparent',
                  border: '1px solid rgba(184,148,58,0.25)',
                  color: 'var(--gold, var(--imi-gold-500))',
                  fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px',
                  textTransform: 'uppercase', fontFamily: 'var(--font-montserrat, sans-serif)',
                  cursor: 'pointer',
                }}>
                  <ArrowLeft size={12} />
                  Voltar
                </button>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="explorer-tabs" style={{ display: 'flex', gap: 6, marginTop: 18, overflowX: 'auto', scrollbarWidth: 'none' }}>
            <TabBtn active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')}>
              Ranking de Bairros
            </TabBtn>
            <TabBtn active={activeTab === 'analise'} onClick={() => setActiveTab('analise')}>
              Análise de Mercado
            </TabBtn>
            <TabBtn active={activeTab === 'oportunidades'} onClick={() => setActiveTab('oportunidades')}>
              Oportunidades
            </TabBtn>
          </div>
        </div>
      </header>

      {/* ── Tab Content ──────────────────────────────────── */}
      <div className="explorer-content" style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
        {activeTab === 'ranking' && <RankingTab />}
        {activeTab === 'analise' && <AnaliseTab />}
        {activeTab === 'oportunidades' && (
          loadingProps ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '60px', gap: 12, color: 'var(--bo-text-muted, #9FAAB8)',
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%',
                border: '2px solid rgba(184,148,58,0.2)',
                borderTopColor: 'var(--imi-gold-500)',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{
                fontFamily: 'var(--font-montserrat, sans-serif)', fontSize: '12px',
              }}>
                Carregando imóveis…
              </span>
            </div>
          ) : (
            <OportunidadesTab properties={properties} />
          )
        )}
      </div>

      <style suppressHydrationWarning>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .explorer-tabs::-webkit-scrollbar { display: none; }
        .explorer-tabs > * { flex-shrink: 0 !important; }

        @media (max-width: 767px) {
          .explorer-content { padding: 14px !important; }
          .explorer-tabs button { min-height: 44px !important; }
          .explorer-table { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .explorer-table > div { min-width: 480px !important; }
          .explorer-stats { flex-wrap: wrap !important; }
          .explorer-stats > * { min-width: calc(50% - 6px) !important; }
          .explorer-heatmap { overflow-x: auto !important; -webkit-overflow-scrolling: touch; }
          .explorer-heatmap > div { min-width: 420px !important; }
        }
      `}</style>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════════════════════ */
export default function ExplorerPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileExplorer /> : <DesktopExplorer />
}
