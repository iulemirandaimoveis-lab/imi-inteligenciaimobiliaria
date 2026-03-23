// FILE: /src/app/(backoffice)/backoffice/imoveis/comparar/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, Plus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { enrichProperty, getScoreColor } from '@/features/properties/services/score.service'
import { mapDevToProperty } from '@/features/properties/services/mapDevToProperty'
import type { IMIProperty } from '@/features/properties/types'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileAppBar, MobileBottomNav } from '../mobile-ui'

/* ─── Helpers ──────────────────────────────────────────────────── */
const DB_STATUS: Record<string, string> = {
  launch: 'lancamento', available: 'disponivel', under_construction: 'em_construcao',
  ready: 'disponivel', sold: 'vendido', reserved: 'reservado',
  negotiating: 'em_negociacao', published: 'disponivel', draft: 'arquivado',
}
function ns(s?: string) { return DB_STATUS[s?.toLowerCase() ?? ''] ?? s?.toLowerCase() ?? 'disponivel' }

function toP(d: Record<string, unknown>): IMIProperty {
  return mapDevToProperty(d)
}

function fmt(n?: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2).replace('.', ',')}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

function fmtNum(n?: number | null, decimals = 0, suffix = ''): string {
  if (n == null) return '—'
  return `${n.toFixed(decimals)}${suffix}`
}

const STATUS_LABELS: Record<string, string> = {
  disponivel: 'Disponível', lancamento: 'Lançamento', em_construcao: 'Em Construção',
  reservado: 'Reservado', em_negociacao: 'Negociação', vendido: 'Vendido', arquivado: 'Arquivado',
}
const STATUS_COLORS: Record<string, string> = {
  disponivel: 'var(--success)', lancamento: 'var(--accent-400)', em_construcao: 'var(--info)',
  reservado: 'var(--warning)', em_negociacao: 'var(--text-secondary)', vendido: 'var(--error)', arquivado: 'var(--text-tertiary)',
}
const TYPE_LABELS: Record<string, string> = {
  apartamento: 'Apartamento', casa: 'Casa', cobertura: 'Cobertura',
  comercial: 'Comercial', terreno: 'Terreno', studio: 'Studio', flat: 'Flat', duplex: 'Duplex',
}

/* ─── Row types ─────────────────────────────────────────────────── */
type RowDef =
  | { key: string; label: string; group: string; type: 'text'; get: (p: IMIProperty) => string }
  | { key: string; label: string; group: string; type: 'numeric'; get: (p: IMIProperty) => number | null; fmt: (n: number | null) => string; higher: boolean }

const ROWS: RowDef[] = [
  // IDENTIFICAÇÃO
  { key: 'name',   label: 'Nome',       group: 'IDENTIFICAÇÃO', type: 'text',    get: p => p.name ?? '—' },
  { key: 'type',   label: 'Tipo',       group: 'IDENTIFICAÇÃO', type: 'text',    get: p => TYPE_LABELS[p.type ?? ''] ?? p.type ?? '—' },
  { key: 'status', label: 'Status',     group: 'IDENTIFICAÇÃO', type: 'text',    get: p => STATUS_LABELS[p.status ?? ''] ?? p.status ?? '—' },
  { key: 'loc',    label: 'Localização',group: 'IDENTIFICAÇÃO', type: 'text',    get: p => [p.neighborhood, p.city].filter(Boolean).join(', ') || '—' },
  // PREÇO
  { key: 'price',  label: 'Valor',      group: 'PREÇO',         type: 'numeric', get: p => p.price ?? null,           fmt: n => fmt(n),                  higher: false },
  { key: 'sqm',    label: 'Preço/m²',   group: 'PREÇO',         type: 'numeric', get: p => p.price_per_sqm ?? null,   fmt: n => n ? fmt(n) : '—',        higher: false },
  { key: 'delta',  label: 'Delta Mercado',group: 'PREÇO',       type: 'numeric', get: p => p.market_delta_pct ?? null,fmt: n => fmtNum(n, 1, '%'),        higher: true },
  // CARACTERÍSTICAS
  { key: 'area',   label: 'Área (m²)',  group: 'CARACTERÍSTICAS',type: 'numeric', get: p => p.area ?? null,           fmt: n => fmtNum(n, 0, ' m²'),      higher: true },
  { key: 'beds',   label: 'Quartos',    group: 'CARACTERÍSTICAS',type: 'numeric', get: p => p.bedrooms ?? null,       fmt: n => fmtNum(n, 0),             higher: true },
  { key: 'baths',  label: 'Banheiros',  group: 'CARACTERÍSTICAS',type: 'numeric', get: p => p.bathrooms ?? null,      fmt: n => fmtNum(n, 0),             higher: true },
  { key: 'park',   label: 'Vagas',      group: 'CARACTERÍSTICAS',type: 'numeric', get: p => p.parking ?? null,        fmt: n => fmtNum(n, 0),             higher: true },
  // IMI INTELLIGENCE
  { key: 'score',  label: 'IMI Score',  group: 'IMI INTELLIGENCE',type: 'numeric', get: p => p.imi_score ?? null,    fmt: n => fmtNum(n, 0, '/100'),     higher: true },
  { key: 'yield',  label: 'Yield Est.', group: 'IMI INTELLIGENCE',type: 'numeric', get: p => p.yield_est ?? null,    fmt: n => fmtNum(n, 2, '% a.a.'),   higher: true },
  { key: 'roi',    label: 'ROI 12m',    group: 'IMI INTELLIGENCE',type: 'numeric', get: p => p.roi_12m ?? null,      fmt: n => fmtNum(n, 1, '%'),        higher: true },
  { key: 'liq',    label: 'Liquidez',   group: 'IMI INTELLIGENCE',type: 'numeric', get: p => p.liquidity_index ?? null, fmt: n => fmtNum(n, 0, '/100'), higher: true },
  // INVESTIMENTO
  { key: 'cond',   label: 'Condição',   group: 'INVESTIMENTO',  type: 'text',    get: p => p.condition ?? '—' },
  { key: 'state',  label: 'Estado',     group: 'INVESTIMENTO',  type: 'text',    get: p => p.state ?? '—' },
]

const GROUPS = ['IDENTIFICAÇÃO', 'PREÇO', 'CARACTERÍSTICAS', 'IMI INTELLIGENCE', 'INVESTIMENTO']

/* ─── Eyebrow ────────────────────────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase',
      color: 'var(--accent-400)', fontFamily: 'var(--font-outfit, sans-serif)',
      fontWeight: 700,
    }}>
      {children}
    </span>
  )
}

/* ─── Empty State (shared, used in desktop) ──────────────────────── */
function EmptyState() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base, #0B1120)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 24px', gap: 24, textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 6,
        background: 'rgba(184,148,58,0.06)',
        border: '1px solid rgba(184,148,58,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Plus size={36} style={{ color: 'rgba(184,148,58,0.35)' }} />
      </div>
      <div>
        <p style={{
          fontFamily: 'var(--font-playfair, "Libre Baskerville", serif)',
          fontSize: '22px', fontWeight: 600,
          color: 'var(--text-primary, #EBE7E0)', marginBottom: 8,
        }}>
          Nenhum imóvel selecionado
        </p>
        <p style={{
          fontSize: '12px', color: 'var(--text-secondary, #9FAAB8)',
          fontFamily: 'var(--font-outfit, sans-serif)',
          maxWidth: 380, lineHeight: 1.6,
        }}>
          Para comparar imóveis, acesse a lista e marque até 5 propriedades usando o botão
          "Comparar" em cada card.
        </p>
      </div>
      <Link href="/backoffice/imoveis">
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 22px', borderRadius: 6,
          background: 'var(--gold, var(--accent-400))', border: 'none',
          color: 'var(--navy, #0B1120)',
          fontSize: '11px', fontWeight: 700, letterSpacing: '1.8px',
          textTransform: 'uppercase', fontFamily: 'var(--font-outfit, sans-serif)',
          cursor: 'pointer',
        }}>
          <ArrowLeft size={13} />
          Ver Lista de Imóveis
        </button>
      </Link>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MOBILE COMPARAR
   ════════════════════════════════════════════════════════════════════ */
function MobileComparar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [properties, setProperties] = useState<IMIProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activePropertyIdx, setActivePropertyIdx] = useState(0)

  const rawIds = searchParams.get('ids') ?? ''
  const ids = rawIds.split(',').map(s => s.trim()).filter(Boolean)

  useEffect(() => {
    if (ids.length === 0) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    supabase
      .from('developments')
      .select('*')
      .in('id', ids)
      .then(({ data, error: err }) => {
        if (err) { setError(err instanceof Error ? err.message : 'Erro desconhecido'); setLoading(false); return }
        const enriched = (data ?? []).map(d => enrichProperty(toP(d)))
        const sorted = ids
          .map(id => enriched.find(p => p.id === id))
          .filter((p): p is IMIProperty => !!p)
        setProperties(sorted)
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawIds])

  const removeProperty = (id: string) => {
    const remaining = ids.filter(i => i !== id)
    if (remaining.length === 0) {
      router.push('/backoffice/imoveis')
    } else {
      router.push(`/backoffice/imoveis/comparar?ids=${remaining.join(',')}`)
    }
  }

  function getBestIdx(row: RowDef, props: IMIProperty[]): number {
    if (row.type !== 'numeric') return -1
    const values = props.map(p => row.get(p))
    const nums = values.filter((v): v is number => v !== null)
    if (nums.length < 2) return -1
    const best = row.higher ? Math.max(...nums) : Math.min(...nums)
    const idx = values.findIndex(v => v === best)
    return idx
  }

  const coverImg = (p: IMIProperty) =>
    p.cover_image_url ?? p.image_urls?.[0] ?? null

  /* ── Empty state ──────────────────── */
  if (ids.length === 0) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', paddingBottom: 56 }}>
        <MobileGlobalStyles />
        <MobileAppBar title="Comparar" subtitle="comparação de ativos" />
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '24px 16px', gap: 24, textAlign: 'center',
          paddingTop: 72,
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 6,
            background: 'rgba(184,148,58,0.06)',
            border: '1px solid rgba(184,148,58,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Plus size={36} style={{ color: 'rgba(184,148,58,0.35)' }} />
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-playfair, "Libre Baskerville", serif)', fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
              Nenhum imóvel selecionado
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-outfit, sans-serif)', lineHeight: 1.6, maxWidth: 300 }}>
              Acesse a lista e marque até 5 propriedades usando o botão "Comparar".
            </p>
          </div>
          <Link href="/backoffice/imoveis">
            <button style={{
              height: 44, paddingLeft: 20, paddingRight: 20, borderRadius: 6,
              background: 'var(--accent-400)', border: 'none', color: 'var(--bg-base)', fontSize: '11px', fontWeight: 700,
              letterSpacing: '1.5px', textTransform: 'uppercase',
              fontFamily: 'var(--font-outfit, sans-serif)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <ArrowLeft size={14} /> Ver Imóveis
            </button>
          </Link>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-outfit, sans-serif)',
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
            width: 44, height: 44, borderRadius: 6,
            background: 'transparent', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <ArrowLeft size={20} color="var(--accent-400)" />
        </button>
        <span style={{
          fontFamily: 'var(--font-playfair, "Libre Baskerville", serif)',
          fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)',
          flex: 1,
        }}>
          Comparar
        </span>
        {loading && (
          <Loader2 size={16} style={{ color: 'var(--text-secondary)', animation: 'mob-spin 1s linear infinite' }} />
        )}
      </div>

      {/* ── Scrollable Content ───────────────────────── */}
      <div style={{
        flex: 1, paddingTop: 56, paddingBottom: 80,
        overflowY: 'auto',
      }}>
        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px', gap: 12,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              border: '2px solid rgba(184,148,58,0.2)',
              borderTopColor: 'var(--accent-400)',
              animation: 'mob-spin 0.8s linear infinite',
            }} />
            <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Carregando imóveis…</span>
          </div>
        ) : error ? (
          <div style={{
            padding: '40px 16px', textAlign: 'center',
            color: 'var(--error)', fontSize: '12px',
          }}>
            Erro ao carregar: {error}
          </div>
        ) : (
          <>
            {/* Property cards stacked */}
            <div style={{
              paddingLeft: 14, paddingRight: 14, paddingTop: 16,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              {properties.map((p, idx) => {
                const img = coverImg(p)
                const scoreColor = getScoreColor(p.imi_score ?? 0)
                const stColor = STATUS_COLORS[p.status] ?? 'var(--text-secondary)'
                return (
                  <div key={p.id} style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid rgba(184,148,58,0.15)',
                    borderRadius: 6, overflow: 'hidden',
                  }}>
                    {/* Card header with image + info */}
                    <div style={{ display: 'flex', gap: 12, padding: '12px 12px 0' }}>
                      {/* Cover image */}
                      <div style={{
                        width: 72, height: 72, borderRadius: 6, overflow: 'hidden',
                        background: 'rgba(255,255,255,0.04)', flexShrink: 0,
                      }}>
                        {img ? (
                          <img
                            src={img} alt={p.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{
                            width: '100%', height: '100%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: '20px', opacity: 0.2 }}>🏢</span>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily: 'var(--font-playfair, serif)',
                          fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)',
                          lineHeight: 1.3, marginBottom: 3,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {p.name}
                        </p>
                        {p.developer?.name && (
                          <p style={{
                            fontSize: '11px', color: 'var(--text-tertiary)',
                            marginBottom: 6,
                          }}>
                            {p.developer.name}
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          {/* Score badge */}
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '4px 8px', borderRadius: 6,
                            background: `${scoreColor}18`,
                            border: `1px solid ${scoreColor}40`,
                          }}>
                            <Star size={9} style={{ color: scoreColor }} />
                            <span style={{
                              fontFamily: 'var(--font-dm-mono, monospace)',
                              fontSize: '11px', color: scoreColor,
                            }}>
                              {p.imi_score ?? '—'} IMI
                            </span>
                          </div>
                          {/* Status */}
                          <span style={{
                            display: 'inline-flex', padding: '3px 7px', borderRadius: 6,
                            background: `${stColor}18`, border: `1px solid ${stColor}35`,
                            fontSize: '11px', fontWeight: 600,
                            color: stColor, textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                          }}>
                            {STATUS_LABELS[p.status] ?? p.status}
                          </span>
                        </div>
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => removeProperty(p.id)}
                        style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: 'rgba(224,107,107,0.1)',
                          border: '1px solid rgba(224,107,107,0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} style={{ color: 'var(--error)' }} />
                      </button>
                    </div>

                    {/* Quick stats row */}
                    <div style={{
                      display: 'flex', gap: 0,
                      borderTop: '1px solid rgba(184,148,58,0.08)', marginTop: 12,
                    }}>
                      {[
                        { label: 'Valor', value: fmt(p.price) },
                        { label: 'Área', value: p.area ? `${p.area}m²` : '—' },
                        { label: 'Yield', value: p.yield_est ? `${p.yield_est.toFixed(1)}%` : '—' },
                      ].map((stat, si) => (
                        <div key={stat.label} style={{
                          flex: 1, padding: '10px 12px', textAlign: 'center',
                          borderRight: si < 2 ? '1px solid rgba(184,148,58,0.08)' : 'none',
                        }}>
                          <div style={{
                            fontSize: '11px', color: 'var(--text-tertiary)',
                            letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 3,
                          }}>
                            {stat.label}
                          </div>
                          <div style={{
                            fontFamily: 'var(--font-dm-mono, monospace)',
                            fontSize: '12px', color: 'var(--accent-400)',
                          }}>
                            {stat.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Horizontal comparison table */}
            <div style={{
              paddingLeft: 14, paddingRight: 14, paddingTop: 20,
            }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase',
                  color: 'var(--accent-400)', fontWeight: 700,
                }}>
                  Comparativo Detalhado
                </span>
              </div>

              {/* Scrollable table */}
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <div style={{ minWidth: Math.max(360, properties.length * 160 + 120) }}>
                  {/* Property name headers */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `100px repeat(${properties.length}, 1fr)`,
                    background: 'rgba(184,148,58,0.04)',
                    borderRadius: '4px 4px 0 0',
                    border: '1px solid rgba(184,148,58,0.15)',
                    borderBottom: 'none',
                    overflow: 'hidden',
                  }}>
                    <div style={{ padding: '10px 10px' }} />
                    {properties.map((p, idx) => (
                      <div key={p.id} style={{
                        padding: '10px 10px',
                        borderLeft: '1px solid rgba(184,148,58,0.08)',
                      }}>
                        <p style={{
                          fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontFamily: 'var(--font-outfit, sans-serif)',
                        }}>
                          {p.name}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Groups + rows */}
                  {GROUPS.map((group, gi) => {
                    const groupRows = ROWS.filter(r => r.group === group)
                    return (
                      <div key={group}>
                        {/* Group header */}
                        <div style={{
                          background: 'rgba(184,148,58,0.06)',
                          borderLeft: '1px solid rgba(184,148,58,0.15)',
                          borderRight: '1px solid rgba(184,148,58,0.15)',
                          borderTop: '1px solid rgba(184,148,58,0.10)',
                          padding: '8px 10px',
                        }}>
                          <span style={{
                            fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px',
                            textTransform: 'uppercase', color: 'var(--text-tertiary)',
                            fontFamily: 'var(--font-outfit, sans-serif)',
                          }}>
                            {group}
                          </span>
                        </div>
                        {groupRows.map((row, ri) => {
                          const bestIdx = getBestIdx(row, properties)
                          const isLastRow = gi === GROUPS.length - 1 && ri === groupRows.length - 1
                          return (
                            <div
                              key={row.key}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: `100px repeat(${properties.length}, 1fr)`,
                                border: '1px solid rgba(184,148,58,0.10)',
                                borderTop: 'none',
                                borderRadius: isLastRow ? '0 0 4px 4px' : 0,
                                overflow: 'hidden',
                              }}
                            >
                              {/* Row label */}
                              <div style={{
                                padding: '10px 10px',
                                background: 'rgba(184,148,58,0.015)',
                                borderRight: '1px solid rgba(184,148,58,0.08)',
                                display: 'flex', alignItems: 'center',
                              }}>
                                <span style={{
                                  fontSize: '11px', color: 'var(--text-secondary)',
                                  fontFamily: 'var(--font-outfit, sans-serif)',
                                }}>
                                  {row.label}
                                </span>
                              </div>
                              {/* Values */}
                              {properties.map((p, pi) => {
                                const isBest = pi === bestIdx
                                let displayVal: string
                                if (row.type === 'text') {
                                  displayVal = row.get(p)
                                } else {
                                  const rawVal = row.get(p)
                                  displayVal = row.fmt(rawVal)
                                }
                                return (
                                  <div
                                    key={p.id}
                                    style={{
                                      padding: '10px 10px',
                                      borderLeft: '1px solid rgba(184,148,58,0.05)',
                                      background: isBest ? 'rgba(184,148,58,0.07)' : 'transparent',
                                      display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                  >
                                    {isBest && (
                                      <Star size={8} style={{ color: 'var(--accent-400)', flexShrink: 0 }} />
                                    )}
                                    <span style={{
                                      fontFamily: row.type === 'numeric'
                                        ? 'var(--font-dm-mono, monospace)'
                                        : 'var(--font-outfit, sans-serif)',
                                      fontSize: '11px',
                                      color: isBest ? 'var(--accent-400)' : 'var(--text-primary)',
                                      fontWeight: isBest ? 600 : 400,
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                      {displayVal}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Fixed Bottom Action Bar ───────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        height: 72, background: 'var(--bg-elevated)',
        borderTop: '1px solid rgba(184,148,58,0.15)',
        display: 'flex', alignItems: 'center',
        paddingLeft: 14, paddingRight: 14, gap: 12,
      }}>
        <button
          onClick={() => router.push('/backoffice/imoveis')}
          style={{
            flex: 1, height: 44, borderRadius: 6,
            background: 'transparent',
            border: '1px solid rgba(184,148,58,0.25)',
            color: 'var(--accent-400)',
            fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase', cursor: 'pointer',
            fontFamily: 'var(--font-outfit, sans-serif)',
          }}
        >
          Limpar
        </button>
        <Link href="/backoffice/imoveis" style={{ flex: 2 }}>
          <button style={{
            width: '100%', height: 44, borderRadius: 6,
            background: 'var(--accent-400)', border: 'none',
            color: 'var(--bg-base)',
            fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
            textTransform: 'uppercase', cursor: 'pointer',
            fontFamily: 'var(--font-outfit, sans-serif)',
          }}>
            Ver Imóveis
          </button>
        </Link>
      </div>

      <style suppressHydrationWarning>{`
        @keyframes mob-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <MobileBottomNav />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   DESKTOP COMPARAR
   ════════════════════════════════════════════════════════════════════ */
function DesktopComparar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [properties, setProperties] = useState<IMIProperty[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rawIds = searchParams.get('ids') ?? ''
  const ids = rawIds.split(',').map(s => s.trim()).filter(Boolean)

  useEffect(() => {
    if (ids.length === 0) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    supabase
      .from('developments')
      .select('*')
      .in('id', ids)
      .then(({ data, error: err }) => {
        if (err) { setError(err instanceof Error ? err.message : 'Erro desconhecido'); setLoading(false); return }
        const enriched = (data ?? []).map(d => enrichProperty(toP(d)))
        const sorted = ids
          .map(id => enriched.find(p => p.id === id))
          .filter((p): p is IMIProperty => !!p)
        setProperties(sorted)
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawIds])

  const removeProperty = (id: string) => {
    const remaining = ids.filter(i => i !== id)
    if (remaining.length === 0) {
      router.push('/backoffice/imoveis')
    } else {
      router.push(`/backoffice/imoveis/comparar?ids=${remaining.join(',')}`)
    }
  }

  if (ids.length === 0) return <EmptyState />

  function getBestIdx(row: RowDef, props: IMIProperty[]): number {
    if (row.type !== 'numeric') return -1
    const values = props.map(p => row.get(p))
    const nums = values.filter((v): v is number => v !== null)
    if (nums.length < 2) return -1
    const best = row.higher ? Math.max(...nums) : Math.min(...nums)
    const idx = values.findIndex(v => v === best)
    return idx
  }

  const coverImg = (p: IMIProperty) =>
    p.cover_image_url ?? p.image_urls?.[0] ?? null

  return (
    <div className="comparar-wrap" style={{
      minHeight: '100vh',
      background: 'var(--bg-base, #0B1120)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Header ───────────────────────────────────────── */}
      <header className="comparar-header" style={{
        padding: '20px 28px',
        borderBottom: '1px solid rgba(184,148,58,0.12)',
        background: 'var(--bg-surface, #162040)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(184,148,58,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(184,148,58,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
            <Eyebrow>IMI</Eyebrow>
            <span style={{ color: 'rgba(184,148,58,0.3)', fontSize: 11 }}>›</span>
            <Link href="/backoffice/imoveis">
              <span style={{
                fontSize: '11px', fontWeight: 500, letterSpacing: '2px',
                textTransform: 'uppercase', color: 'var(--text-tertiary, #5C6B7D)',
                fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer',
              }}>Imóveis</span>
            </Link>
            <span style={{ color: 'rgba(184,148,58,0.3)', fontSize: 11 }}>›</span>
            <Eyebrow>Comparativo</Eyebrow>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-playfair, "Libre Baskerville", serif)',
                fontSize: '26px', fontWeight: 600,
                color: 'var(--text-primary, #EBE7E0)', marginBottom: 4, lineHeight: 1.1,
              }}>
                Comparativo de <em style={{ fontStyle: 'italic', color: 'var(--accent-400)' }}>Imóveis</em>
              </h1>
              <p style={{
                fontSize: '11px', color: 'var(--text-tertiary, #5C6B7D)',
                fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 300,
              }}>
                {properties.length} de 5 imóveis · análise comparativa IMI Intelligence
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/backoffice/imoveis">
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 6,
                  background: 'transparent',
                  border: '1px solid rgba(184,148,58,0.25)',
                  color: 'var(--gold, var(--accent-400))',
                  fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px',
                  textTransform: 'uppercase', fontFamily: 'var(--font-outfit, sans-serif)',
                  cursor: 'pointer',
                }}>
                  <ArrowLeft size={12} />
                  Voltar
                </button>
              </Link>
              {properties.length < 5 && (
                <Link href="/backoffice/imoveis">
                  <button style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 14px', borderRadius: 6,
                    background: 'var(--gold, var(--accent-400))', border: 'none',
                    color: 'var(--navy, #0B1120)',
                    fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
                    textTransform: 'uppercase', fontFamily: 'var(--font-outfit, sans-serif)',
                    cursor: 'pointer',
                  }}>
                    <Plus size={12} />
                    Adicionar Imóvel
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────── */}
      <div className="comparar-content" style={{ flex: 1, padding: '28px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '80px', gap: 12, color: 'var(--text-secondary, #9FAAB8)',
          }}>
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            <span style={{ fontFamily: 'var(--font-outfit, sans-serif)', fontSize: '12px' }}>
              Carregando imóveis…
            </span>
          </div>
        ) : error ? (
          <div style={{
            padding: '40px', textAlign: 'center',
            color: 'var(--error)', fontFamily: 'var(--font-outfit, sans-serif)', fontSize: '12px',
          }}>
            Erro ao carregar: {error}
          </div>
        ) : (
          <div style={{
            background: 'var(--bg-surface, #162040)',
            border: '1px solid rgba(184,148,58,0.18)',
            borderRadius: 6, overflow: 'hidden',
            minWidth: 640,
          }}>
            {/* Property header columns */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `200px repeat(${properties.length}, 1fr)`,
              borderBottom: '1px solid rgba(184,148,58,0.15)',
            }}>
              {/* Row label col header */}
              <div style={{
                padding: '16px 20px',
                borderRight: '1px solid rgba(184,148,58,0.08)',
                background: 'rgba(184,148,58,0.03)',
              }} />

              {/* Property columns */}
              {properties.map((p, idx) => {
                const img = coverImg(p)
                const scoreColor = getScoreColor(p.imi_score ?? 0)
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: '16px',
                      borderRight: idx < properties.length - 1 ? '1px solid rgba(184,148,58,0.08)' : 'none',
                      background: 'rgba(184,148,58,0.02)',
                      display: 'flex', flexDirection: 'column', gap: 10, position: 'relative',
                    }}
                  >
                    {/* Remove button */}
                    <button
                      onClick={() => removeProperty(p.id)}
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 22, height: 22, borderRadius: '50%',
                        background: 'rgba(224,107,107,0.1)',
                        border: '1px solid rgba(224,107,107,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                      title="Remover da comparação"
                    >
                      <X size={11} style={{ color: 'var(--error)' }} />
                    </button>

                    {/* Cover image */}
                    <div style={{
                      width: '100%', aspectRatio: '16/9', borderRadius: 6, overflow: 'hidden',
                      background: 'rgba(255,255,255,0.04)',
                    }}>
                      {img ? (
                        <img
                          src={img} alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '24px', opacity: 0.2 }}>🏢</span>
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <p style={{
                        fontFamily: 'var(--font-playfair, serif)',
                        fontSize: '13px', fontWeight: 600,
                        color: 'var(--text-primary, #EBE7E0)',
                        lineHeight: 1.3, marginBottom: 2,
                        paddingRight: 24,
                      }}>
                        {p.name}
                      </p>
                      {p.developer?.name && (
                        <p style={{
                          fontSize: '11px', color: 'var(--text-tertiary, #5C6B7D)',
                          fontFamily: 'var(--font-outfit, sans-serif)',
                        }}>
                          {p.developer.name}
                        </p>
                      )}
                    </div>

                    {/* IMI Score badge */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 6,
                      background: `${scoreColor}18`,
                      border: `1px solid ${scoreColor}40`,
                      alignSelf: 'flex-start',
                    }}>
                      <Star size={10} style={{ color: scoreColor }} />
                      <span style={{
                        fontFamily: 'var(--font-dm-mono, monospace)',
                        fontSize: '12px', fontWeight: 400, color: scoreColor,
                      }}>
                        {p.imi_score ?? '—'}
                      </span>
                      <span style={{
                        fontSize: '11px', color: scoreColor, opacity: 0.7,
                        fontFamily: 'var(--font-outfit, sans-serif)',
                        letterSpacing: '1px', textTransform: 'uppercase',
                      }}>
                        IMI
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Comparison rows */}
            {GROUPS.map(group => {
              const groupRows = ROWS.filter(r => r.group === group)
              return (
                <div key={group}>
                  {/* Group header */}
                  <div style={{
                    padding: '10px 20px',
                    background: 'rgba(184,148,58,0.05)',
                    borderTop: '1px solid rgba(184,148,58,0.10)',
                    borderBottom: '1px solid rgba(184,148,58,0.08)',
                  }}>
                    <Eyebrow>{group}</Eyebrow>
                  </div>

                  {/* Rows */}
                  {groupRows.map((row, ri) => {
                    const bestIdx = getBestIdx(row, properties)
                    return (
                      <div
                        key={row.key}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `200px repeat(${properties.length}, 1fr)`,
                          borderBottom: ri < groupRows.length - 1
                            ? '1px solid rgba(184,148,58,0.05)'
                            : 'none',
                        }}
                      >
                        {/* Row label */}
                        <div style={{
                          padding: '11px 20px',
                          borderRight: '1px solid rgba(184,148,58,0.08)',
                          background: 'rgba(184,148,58,0.015)',
                          display: 'flex', alignItems: 'center',
                        }}>
                          <span style={{
                            fontSize: '11px', color: 'var(--text-secondary, #9FAAB8)',
                            fontFamily: 'var(--font-outfit, sans-serif)',
                          }}>
                            {row.label}
                          </span>
                        </div>

                        {/* Property values */}
                        {properties.map((p, pi) => {
                          const isBest = pi === bestIdx
                          let displayVal: string
                          if (row.type === 'text') {
                            displayVal = row.get(p)
                          } else {
                            const rawVal = row.get(p)
                            displayVal = row.fmt(rawVal)
                          }

                          return (
                            <div
                              key={p.id}
                              style={{
                                padding: '12px 16px',
                                borderRight: pi < properties.length - 1
                                  ? '1px solid rgba(184,148,58,0.05)' : 'none',
                                background: isBest
                                  ? 'rgba(184,148,58,0.07)'
                                  : 'transparent',
                                display: 'flex', alignItems: 'center', gap: 6,
                                transition: 'background 0.2s',
                              }}
                            >
                              {isBest && (
                                <Star size={9} style={{ color: 'var(--accent-400)', flexShrink: 0 }} />
                              )}
                              <span style={{
                                fontFamily: row.type === 'numeric'
                                  ? 'var(--font-dm-mono, monospace)'
                                  : 'var(--font-outfit, sans-serif)',
                                fontSize: row.type === 'numeric' ? '12px' : '11px',
                                color: isBest
                                  ? 'var(--accent-400)'
                                  : 'var(--text-primary, #EBE7E0)',
                                fontWeight: isBest ? 600 : 400,
                              }}>
                                {displayVal}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}

            {/* Footer: Add more */}
            {properties.length < 5 && (
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid rgba(184,148,58,0.10)',
                display: 'grid',
                gridTemplateColumns: `200px repeat(${properties.length}, 1fr)`,
              }}>
                <div />
                {properties.map((_, i) => <div key={i} />)}
                <div style={{
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                }}>
                  <Link href="/backoffice/imoveis">
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 6,
                      background: 'transparent',
                      border: '1px dashed rgba(184,148,58,0.35)',
                      color: 'var(--gold, var(--accent-400))',
                      fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px',
                      textTransform: 'uppercase', fontFamily: 'var(--font-outfit, sans-serif)',
                      cursor: 'pointer',
                    }}>
                      <Plus size={11} />
                      Adicionar
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style suppressHydrationWarning>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 767px) {
          .comparar-header { padding: 16px 14px 14px !important; }
          .comparar-content { padding: 14px !important; }
        }
      `}</style>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════════════════════════════ */
export default function CompararPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileComparar /> : <DesktopComparar />
}
