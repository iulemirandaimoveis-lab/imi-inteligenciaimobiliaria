'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, TrendingUp, BarChart2, Plus, Star, Eye, Edit } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { enrichProperty } from '@/features/properties/services/score.service'
import { getScoreStyle } from '@/hooks/useScore'
import { mapDevToProperty } from '@/features/properties/services/mapDevToProperty'
import type { IMIProperty } from '@/features/properties/types'
import { useIsMobile } from '@/hooks/use-is-mobile'
import {
  MobileGlobalStyles, MobileAppBar, MobileBottomNav,
  MobileKPICard, MobileSection, MobileEmptyState,
  MobilePropertyCard, MobilePropertyCardSkeleton, T,
} from '../mobile-ui'

/* ─── Design Tokens ──────────────────────────────────────────────────────────── */
const DT = {
  bg:       'var(--bg-base)',
  surface:  'var(--bg-surface)',
  elevated: 'var(--bg-elevated)',
  border:   'rgba(61,111,255,0.15)',
  borderHi: 'rgba(61,111,255,0.35)',
  gold:     'var(--accent-400)',
  goldBg:   'rgba(61,111,255,0.08)',
  text:     'var(--text-primary)',
  textSub:  'var(--text-secondary)',
  textDim:  'var(--text-tertiary)',
  success:  'var(--success)',
  error:    'var(--error)',
}

/* ─── Status Config ──────────────────────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  disponivel:    { label: 'Disponível',  color: 'var(--success)', bg: 'rgba(93,184,135,0.12)' },
  publicado:     { label: 'Publicado',   color: 'var(--success)', bg: 'rgba(93,184,135,0.12)' },
  lancamento:    { label: 'Lançamento',  color: 'var(--accent-400)', bg: 'rgba(61,111,255,0.12)'  },
  em_construcao: { label: 'Construção',  color: 'var(--warning)', bg: 'rgba(212,145,58,0.12)'  },
  reservado:     { label: 'Reservado',   color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  vendido:       { label: 'Vendido',     color: 'var(--text-secondary)', bg: 'rgba(159,170,184,0.10)' },
  rascunho:      { label: 'Rascunho',    color: 'var(--text-tertiary)', bg: 'rgba(92,107,125,0.12)'  },
  draft:         { label: 'Rascunho',    color: 'var(--text-tertiary)', bg: 'rgba(92,107,125,0.12)'  },
  published:     { label: 'Publicado',   color: 'var(--success)', bg: 'rgba(93,184,135,0.12)' },
  archived:      { label: 'Arquivado',   color: 'var(--text-tertiary)', bg: 'rgba(92,107,125,0.12)'  },
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function normalizeStatus(s?: string): string {
  const MAP: Record<string, string> = {
    launch: 'lancamento', available: 'disponivel', under_construction: 'em_construcao',
    ready: 'disponivel', sold: 'vendido', reserved: 'reservado',
    negotiating: 'em_negociacao', published: 'publicado', draft: 'rascunho',
    campaign: 'lancamento', private: 'archived',
  }
  const key = s?.toLowerCase() ?? ''
  return MAP[key] ?? key ?? 'disponivel'
}

function fmt(n?: number | null): string {
  if (!n) return '—'
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2).replace('.', ',')}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

function fmtArea(n?: number | null): string {
  if (!n) return '—'
  return `${n.toLocaleString('pt-BR')} m²`
}

/* ─── Data layer ─────────────────────────────────────────────────────────────── */
async function fetchProperties(): Promise<IMIProperty[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('developments')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return data.map(mapDevToProperty).map(enrichProperty)
}

/* ─── Type label map ─────────────────────────────────────────────────────────── */
const TYPE_LABELS: Record<string, string> = {
  apartamento: 'Apartamento', casa: 'Casa', cobertura: 'Cobertura',
  comercial: 'Comercial', terreno: 'Terreno', studio: 'Studio',
  flat: 'Flat', duplex: 'Duplex',
}

/* ─── SVG Donut Chart ────────────────────────────────────────────────────────── */
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null
  const r = 48
  const cx = 60
  const cy = 60
  const circumference = 2 * Math.PI * r
  let cumulative = 0

  return (
    <svg width={120} height={120} viewBox="0 0 120 120">
      {data.map((seg, i) => {
        const pct = seg.value / total
        const dashArray = circumference * pct
        const dashOffset = circumference * (1 - cumulative)
        cumulative += pct
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={14}
            strokeDasharray={`${dashArray} ${circumference - dashArray}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        )
      })}
      <circle cx={cx} cy={cy} r={38} fill={DT.elevated} />
      <text x={cx} y={cy - 4} textAnchor="middle" fill={DT.text} fontSize={18} fontWeight={700}>{total}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={DT.textDim} fontSize={9}>imóveis</text>
    </svg>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   DESKTOP VIEW
══════════════════════════════════════════════════════════════════════════════ */
function DesktopPortfolio({ properties, loading }: { properties: IMIProperty[]; loading: boolean }) {
  const total = properties.length
  const vgvTotal = properties.reduce((s, p) => s + (p.price ?? 0), 0)
  const avgScore = total > 0
    ? Math.round(properties.reduce((s, p) => s + (p.imi_score ?? 0), 0) / total)
    : 0
  const avgYield = total > 0
    ? (properties.reduce((s, p) => s + (p.yield_est ?? 0), 0) / total).toFixed(1)
    : '0.0'

  // Distribution by type
  const byType = properties.reduce<Record<string, number>>((acc, p) => {
    const t = p.type ?? 'outro'
    acc[t] = (acc[t] ?? 0) + 1
    return acc
  }, {})

  const typeColors = ['var(--accent-400)', 'var(--info)', 'var(--success)', '#A78BFA', 'var(--warning)', 'var(--error)', 'var(--text-secondary)', 'var(--warning)']
  const typeData = Object.entries(byType).map(([k, v], i) => ({
    label: TYPE_LABELS[k] ?? k,
    value: v,
    color: typeColors[i % typeColors.length],
  }))

  // Distribution by status
  const byStatus = properties.reduce<Record<string, number>>((acc, p) => {
    const s = p.status ?? 'outro'
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  const statusData = Object.entries(byStatus).map(([k, v]) => ({
    label: STATUS_CFG[k]?.label ?? k,
    value: v,
    color: STATUS_CFG[k]?.color ?? DT.textDim,
    bg: STATUS_CFG[k]?.bg ?? 'rgba(92,107,125,0.12)',
  }))

  const card: React.CSSProperties = {
    background: DT.elevated,
    border: `1px solid ${DT.border}`,
    borderRadius: 6,
  }

  return (
    <div style={{ minHeight: '100vh', background: DT.bg, color: DT.text, fontFamily: 'var(--font-outfit, sans-serif)' }}>
      <style suppressHydrationWarning>{`
        .desk-row:hover { background: rgba(61,111,255,0.04) !important; }
        .desk-action-btn:hover { background: rgba(61,111,255,0.14) !important; color: var(--accent-400) !important; }
        .desk-new-btn:hover { background: #b8943e !important; }
        .desk-kpi:hover { border-color: rgba(61,111,255,0.35) !important; transform: translateY(-1px); }
        .desk-kpi { transition: border-color 0.2s, transform 0.2s; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${DT.border}`, padding: '20px 40px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Link href="/backoffice/imoveis" style={{ color: DT.textDim, fontSize: 12, textDecoration: 'none' }}>
                Imóveis
              </Link>
              <span style={{ color: DT.textDim, fontSize: 12 }}>›</span>
              <span style={{ color: DT.textSub, fontSize: 12 }}>Portfólio</span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 30, fontWeight: 700, margin: 0, color: DT.text }}>
              Portfólio
            </h1>
            <p style={{ margin: '4px 0 0', color: DT.textSub, fontSize: 14 }}>
              {loading ? 'Carregando...' : `${total} imóvel${total !== 1 ? 'is' : ''} no portfólio`}
            </p>
          </div>
          <Link href="/backoffice/imoveis/novo" style={{ textDecoration: 'none' }}>
            <button className="desk-new-btn" style={{
              position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#0A1624', color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
              padding: '10px 20px', cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 13, fontWeight: 600,
              transition: 'all 0.15s',
            }}>
              <Plus size={15} />
              Novo Imóvel
              <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
            </button>
          </Link>
        </div>
      </div>

      <div style={{ padding: '24px 40px' }}>

        {/* ── KPI Strip ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Imóveis', value: loading ? '—' : String(total), icon: <Building2 size={20} color={DT.gold} /> },
            { label: 'VGV Total', value: loading ? '—' : fmt(vgvTotal), icon: <TrendingUp size={20} color="var(--success)" /> },
            { label: 'IMI Score Médio', value: loading ? '—' : String(avgScore), icon: <Star size={20} color={DT.gold} /> },
            { label: 'Rendimento Est.', value: loading ? '—' : `${avgYield}% a.a.`, icon: <BarChart2 size={20} color="var(--info)" /> },
          ].map((kpi, i) => (
            <div key={i} className="desk-kpi" style={{ ...card, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 6, background: DT.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {kpi.icon}
              </div>
              <div>
                <div style={{ fontSize: 11, color: DT.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: DT.text }}>
                  {kpi.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        {!loading && total > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>

            {/* Distribution by type */}
            <div style={{ ...card, padding: '24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: DT.text, marginBottom: 18 }}>
                Distribuição por Tipo
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <DonutChart data={typeData} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {typeData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 6, background: d.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: DT.textSub, flex: 1 }}>{d.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: DT.text }}>{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Distribution by status */}
            <div style={{ ...card, padding: '24px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: DT.text, marginBottom: 18 }}>
                Distribuição por Status
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {statusData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 12, color: DT.textSub, width: 90, flexShrink: 0 }}>{d.label}</div>
                    <div style={{ flex: 1, height: 8, borderRadius: 6, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round((d.value / total) * 100)}%`,
                        background: d.color,
                        borderRadius: 6,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: DT.text, width: 20, textAlign: 'right' }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Property Table ── */}
        <div style={{ ...card }}>
          <div style={{ padding: '18px 20px', borderBottom: `1px solid ${DT.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: DT.text }}>Imóveis</div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: DT.textDim, fontSize: 14 }}>
              Carregando portfólio...
            </div>
          ) : total === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Building2 size={40} color={DT.textDim} style={{ marginBottom: 16 }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: DT.textSub, marginBottom: 8 }}>
                Nenhum imóvel cadastrado
              </div>
              <div style={{ fontSize: 13, color: DT.textDim, marginBottom: 24 }}>
                Adicione seu primeiro imóvel ao portfólio
              </div>
              <Link href="/backoffice/imoveis/novo" style={{ textDecoration: 'none' }}>
                <button style={{
                  position: 'relative', overflow: 'hidden',
                  background: '#0A1624', color: '#fff', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                  padding: '10px 20px', cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 13, fontWeight: 600,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}>
                  <Plus size={14} />
                  Cadastrar Imóvel
                  <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
                </button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DT.border}` }}>
                  {['Imóvel', 'Tipo', 'Score', 'Preço', 'Área', 'Status', 'Bairro', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: 11, fontWeight: 600, color: DT.textDim,
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => {
                  const score = p.imi_score ?? 0
                  const scoreColor = getScoreStyle(score).color
                  const st = STATUS_CFG[p.status] ?? { label: p.status, color: DT.textDim, bg: 'rgba(92,107,125,0.12)' }
                  const typeLbl = TYPE_LABELS[p.type] ?? p.type
                  return (
                    <tr key={p.id} className="desk-row" style={{ borderBottom: `1px solid ${DT.border}`, transition: 'background 0.15s' }}>
                      {/* Imóvel */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.cover_image_url ? (
                            <img
                              src={p.cover_image_url}
                              alt={p.name}
                              style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{
                              width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                              background: DT.goldBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Building2 size={14} color={DT.gold} />
                            </div>
                          )}
                          <span style={{ fontSize: 13, fontWeight: 500, color: DT.text, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {p.name}
                          </span>
                        </div>
                      </td>
                      {/* Tipo */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11, color: DT.textSub,
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: 6, padding: '2px 7px',
                        }}>{typeLbl}</span>
                      </td>
                      {/* Score */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 13, fontWeight: 700, color: scoreColor,
                          background: `${scoreColor}1A`,
                          borderRadius: 6, padding: '2px 8px',
                        }}>{score}</span>
                      </td>
                      {/* Preço */}
                      <td style={{ padding: '12px 16px', fontSize: 13, color: DT.text, whiteSpace: 'nowrap' }}>
                        {fmt(p.price)}
                      </td>
                      {/* Área */}
                      <td style={{ padding: '12px 16px', fontSize: 13, color: DT.textSub, whiteSpace: 'nowrap' }}>
                        {fmtArea(p.area)}
                      </td>
                      {/* Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: st.color, background: st.bg,
                          borderRadius: 6, padding: '3px 9px',
                          whiteSpace: 'nowrap',
                        }}>{st.label}</span>
                      </td>
                      {/* Bairro */}
                      <td style={{ padding: '12px 16px', fontSize: 12, color: DT.textSub, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.neighborhood ?? '—'}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Link href={`/backoffice/imoveis/${p.id}`} style={{ textDecoration: 'none' }}>
                            <button className="desk-action-btn" style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: 'rgba(61,111,255,0.06)',
                              border: `1px solid ${DT.border}`,
                              borderRadius: 6, padding: '5px 10px',
                              cursor: 'pointer', color: DT.textSub,
                              fontSize: 11, fontWeight: 500,
                              fontFamily: 'var(--font-outfit, sans-serif)',
                              transition: 'background 0.15s, color 0.15s',
                            }}>
                              <Eye size={12} />
                              Ver
                            </button>
                          </Link>
                          <Link href={`/backoffice/imoveis/${p.id}/editar`} style={{ textDecoration: 'none' }}>
                            <button className="desk-action-btn" style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              background: 'rgba(61,111,255,0.06)',
                              border: `1px solid ${DT.border}`,
                              borderRadius: 6, padding: '5px 10px',
                              cursor: 'pointer', color: DT.textSub,
                              fontSize: 11, fontWeight: 500,
                              fontFamily: 'var(--font-outfit, sans-serif)',
                              transition: 'background 0.15s, color 0.15s',
                            }}>
                              <Edit size={12} />
                              Editar
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MOBILE VIEW
══════════════════════════════════════════════════════════════════════════════ */
function MobilePortfolio({ properties, loading }: { properties: IMIProperty[]; loading: boolean }) {
  const total = properties.length
  const vgvTotal = properties.reduce((s, p) => s + (p.price ?? 0), 0)
  const avgScore = total > 0
    ? Math.round(properties.reduce((s, p) => s + (p.imi_score ?? 0), 0) / total)
    : 0
  const avgYield = total > 0
    ? (properties.reduce((s, p) => s + (p.yield_est ?? 0), 0) / total).toFixed(1)
    : '0.0'

  return (
    <div style={{ minHeight: '100vh', background: T.navy, color: T.text1, paddingBottom: 80 }}>
      <MobileGlobalStyles />
      <MobileAppBar
        title="Portfólio"
        subtitle={loading ? 'Carregando...' : `${total} imóvel${total !== 1 ? 'is' : ''}`}
      />

      <div style={{ paddingTop: 64 }}>
        {/* KPI Strip — horizontal scroll */}
        <div style={{
          display: 'flex', gap: 10,
          padding: '16px 16px 4px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          <MobileKPICard
            label="Total"
            value={loading ? '—' : String(total)}
            icon={<Building2 size={16} color={T.gold} />}
            color={T.gold}
          />
          <MobileKPICard
            label="VGV"
            value={loading ? '—' : fmt(vgvTotal)}
            icon={<TrendingUp size={16} color="var(--success)" />}
            color="var(--success)"
          />
          <MobileKPICard
            label="Score Médio"
            value={loading ? '—' : String(avgScore)}
            icon={<Star size={16} color={T.gold} />}
            color={T.gold}
          />
          <MobileKPICard
            label="Rendimento"
            value={loading ? '—' : `${avgYield}%`}
            unit="a.a."
            icon={<BarChart2 size={16} color="var(--info)" />}
            color="var(--info)"
          />
        </div>

        {/* Property list */}
        <MobileSection
          title="Imóveis"
          action={
            <Link href="/backoffice/imoveis/novo" style={{ textDecoration: 'none' }}>
              <button style={{
                position: 'relative', overflow: 'hidden',
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#0A1624', color: '#fff',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                padding: '6px 12px', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                fontFamily: 'var(--font-outfit, sans-serif)',
              }}>
                <Plus size={12} />
                Novo
                <span style={{ position: 'absolute', bottom: 0, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)', opacity: 0.6, pointerEvents: 'none' }} />
              </button>
            </Link>
          }
        >
          {loading ? (
            <>
              <MobilePropertyCardSkeleton />
              <MobilePropertyCardSkeleton />
              <MobilePropertyCardSkeleton />
            </>
          ) : total === 0 ? (
            <MobileEmptyState
              title="Nenhum imóvel cadastrado"
              subtitle="Adicione seu primeiro imóvel ao portfólio IMI."
              action={{ label: 'Cadastrar Imóvel', href: '/backoffice/imoveis/novo' }}
            />
          ) : (
            properties.map((p, i) => (
              <MobilePropertyCard key={p.id} property={p} animationDelay={i * 50} />
            ))
          )}
        </MobileSection>
      </div>

      <MobileBottomNav />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function PortfolioPage() {
  const isMobile = useIsMobile()
  const [properties, setProperties] = useState<IMIProperty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProperties().then((data) => {
      setProperties(data)
      setLoading(false)
    })
  }, [])

  if (isMobile) {
    return <MobilePortfolio properties={properties} loading={loading} />
  }

  return <DesktopPortfolio properties={properties} loading={loading} />
}
