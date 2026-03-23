// FILE: /src/app/(backoffice)/backoffice/imoveis/explorer/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Building2, TrendingUp, BarChart2, ArrowLeft, Star, ChevronUp, ChevronDown,
  Sparkles, Download, Share2, Wand2, Map, X, Filter, SlidersHorizontal,
  Search, RefreshCw, ChevronRight, Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { enrichProperty } from '@/features/properties/services/score.service'
import { getScoreStyle } from '@/hooks/useScore'
import { mapDevToProperty } from '@/features/properties/services/mapDevToProperty'
import type { IMIProperty } from '@/features/properties/types'
import { NEIGHBORHOOD_AVG_SQM, NEIGHBORHOOD_YIELD } from '@/features/properties/types'
import { MarketTrendChart } from '@/features/properties/components/MarketTrendChart'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { MobileGlobalStyles, MobileBottomNav } from '../mobile-ui'
import { T } from '@/app/(backoffice)/lib/theme'
import { PageIntelHeader } from '@/app/(backoffice)/components/ui'

/* ─── Helpers ──────────────────────────────────────────────────── */
const DB_STATUS: Record<string, string> = {
  launch: 'lancamento', available: 'disponivel', under_construction: 'em_construcao',
  ready: 'disponivel', sold: 'vendido', reserved: 'reservado',
  negotiating: 'em_negociacao', published: 'disponivel', draft: 'arquivado',
}
function ns(s?: string) { return DB_STATUS[s?.toLowerCase() ?? ''] ?? s?.toLowerCase() ?? 'disponivel' }

function toP(d: Record<string, unknown>): IMIProperty { return mapDevToProperty(d) }

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
  disponivel: T.success, lancamento: T.accent, em_construcao: '#5B9BD5',
  reservado: '#D4913A', em_negociacao: T.textDim, vendido: T.error, arquivado: T.textMuted,
}

/* ─── Neighborhood data ──────────────────────────────────────────── */
const NEIGHBORHOOD_TREND_12M: Record<string, number> = {
  'Boa Viagem': 4.2, 'Pina': 6.1, 'Miramar': 2.8, 'Casa Forte': 3.5,
  'Graças': 5.2, 'Aflitos': 4.8, 'Recife Antigo': 8.3, 'Espinheiro': 3.1,
  'Parnamirim': 5.7, 'Tamarineira': 6.4, 'Boa Vista': 7.2, 'Derby': 4.9,
}

const NEIGHBORHOOD_ABSORPTION: Record<string, number> = {
  'Boa Viagem': 78, 'Pina': 85, 'Miramar': 62, 'Casa Forte': 71,
  'Graças': 80, 'Aflitos': 74, 'Recife Antigo': 91, 'Espinheiro': 68,
  'Parnamirim': 83, 'Tamarineira': 76, 'Boa Vista': 88, 'Derby': 72,
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
type Tab = 'search' | 'ranking' | 'analise' | 'oportunidades' | 'inteligencia'
type RankSort = 'yield' | 'price'
type ViewMode = 'grid' | 'list'

interface ActiveFilters {
  search: string
  neighborhoods: string[]
  minPrice: number | null
  maxPrice: number | null
  bedrooms: number | null
  types: string[]
  statuses: string[]
  destaque: boolean
}

const DEFAULT_FILTERS: ActiveFilters = {
  search: '',
  neighborhoods: [],
  minPrice: null,
  maxPrice: null,
  bedrooms: null,
  types: [],
  statuses: [],
  destaque: false,
}

/* ─── AI Insights Modal ──────────────────────────────────────────── */
interface AIInsight {
  investmentScore: number
  buyerProfile: string
  pricePositioning: string
  marketingAngle: string
  loading: boolean
}

function AIInsightsModal({ property, onClose }: { property: IMIProperty; onClose: () => void }) {
  const [insight, setInsight] = useState<AIInsight>({
    investmentScore: 0,
    buyerProfile: '',
    pricePositioning: '',
    marketingAngle: '',
    loading: true,
  })

  useEffect(() => {
    // Simulate AI response (real call would go to /api/ai/property-insights)
    const timer = setTimeout(() => {
      const sc = property.imi_score ?? 72
      setInsight({
        loading: false,
        investmentScore: sc,
        buyerProfile: sc >= 80
          ? 'Investidor de alta renda buscando valorização + renda passiva. Perfil family office ou pessoa física com patrimônio >R$2M.'
          : sc >= 65
          ? 'Comprador de imóvel próprio ou pequeno investidor. Busca equilíbrio entre localização e custo-benefício.'
          : 'Comprador de primeira residência ou investidor iniciante sensível a preço.',
        pricePositioning: property.market_delta_pct && property.market_delta_pct > 5
          ? `Imóvel ${property.market_delta_pct.toFixed(1)}% abaixo do mercado — posicionar como oportunidade de entrada com potencial de valorização imediata.`
          : `Alinhado ao mercado de ${property.neighborhood ?? 'referência'}. Destacar diferenciais qualitativos (acabamento, localização, serviços).`,
        marketingAngle: property.yield_est && property.yield_est > 6
          ? `"Renda passiva de ${property.yield_est.toFixed(1)}% a.a." — destaque o retorno superior à média do mercado. Campanhas voltadas a investidores.`
          : `"Viva onde você quer" — campanhas de lifestyle e localização. Destaque proximidade a serviços e qualidade de vida.`,
      })
    }, 1400)
    return () => clearTimeout(timer)
  }, [property])

  const scoreColor = getScoreStyle(insight.investmentScore).color

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: T.surface,
          border: `1px solid ${T.borderActive}`,
          borderRadius: 8, width: '100%', maxWidth: 560,
          overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${T.borderSubtle}`,
          display: 'flex', alignItems: 'center', gap: 10,
          background: T.hover,
        }}>
          <Sparkles size={16} style={{ color: T.accent }} />
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: T.text,
              fontFamily: T.font.ui,
            }}>
              Análise IA — {property.name}
            </p>
            <p style={{ fontSize: 11, color: T.textDim, fontFamily: T.font.ui }}>
              {property.neighborhood ?? ''} · {fmt(property.price)}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={16} style={{ color: T.textDim }} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {insight.loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: `2px solid ${T.borderSubtle}`,
                borderTopColor: T.accent,
                animation: 'ai-spin 0.8s linear infinite',
              }} />
              <p style={{ fontSize: 12, color: T.textDim, fontFamily: T.font.ui }}>
                Analisando com IA…
              </p>
            </div>
          ) : (
            <>
              {/* Score */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 16px', borderRadius: 6,
                background: T.hover,
                border: `1px solid ${T.borderSubtle}`,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 32, fontWeight: 700, color: scoreColor,
                    fontFamily: T.font.data, lineHeight: 1,
                  }}>
                    {insight.investmentScore}
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: T.textDim, fontFamily: T.font.ui, marginTop: 4 }}>
                    IMI Score
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 6, borderRadius: 6, background: T.hover, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 6,
                      width: `${insight.investmentScore}%`,
                      background: `linear-gradient(90deg, ${scoreColor}80, ${scoreColor})`,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: 11, color: T.textMuted, fontFamily: T.font.ui, marginTop: 6 }}>
                    Potencial de investimento {insight.investmentScore >= 80 ? 'excelente' : insight.investmentScore >= 65 ? 'bom' : 'moderado'}
                  </p>
                </div>
              </div>

              {/* Insights */}
              {[
                { label: 'Perfil do Comprador Ideal', value: insight.buyerProfile, color: '#5B9BD5' },
                { label: 'Posicionamento de Preço', value: insight.pricePositioning, color: T.accent },
                { label: 'Ângulo de Marketing', value: insight.marketingAngle, color: T.success },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: item.color, fontFamily: T.font.ui, fontWeight: 700 }}>
                    {item.label}
                  </div>
                  <p style={{ fontSize: 12, color: T.text, fontFamily: T.font.ui, lineHeight: 1.6 }}>
                    {item.value}
                  </p>
                </div>
              ))}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <Link href={`/backoffice/conteudo/criador?property=${property.id}`} style={{ flex: 1 }}>
                  <button style={{
                    width: '100%', padding: '9px 14px', borderRadius: 6,
                    background: T.accent,
                    border: 'none', color: T.textInverse,
                    fontSize: 11, fontWeight: 700, letterSpacing: '1.5px',
                    textTransform: 'uppercase', fontFamily: T.font.ui,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    <Wand2 size={12} /> Gerar Conteúdo
                  </button>
                </Link>
                <Link href={`/backoffice/imoveis/${property.id}`} style={{ flex: 1 }}>
                  <button style={{
                    width: '100%', padding: '9px 14px', borderRadius: 6,
                    background: 'transparent',
                    border: `1px solid ${T.borderActive}`, color: T.accent,
                    fontSize: 11, fontWeight: 600, letterSpacing: '1.5px',
                    textTransform: 'uppercase', fontFamily: T.font.ui,
                    cursor: 'pointer',
                  }}>
                    Ver Imóvel
                  </button>
                </Link>
              </div>
            </>
          )}
        </div>
        <style suppressHydrationWarning>{`@keyframes ai-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )
}

/* ─── Market Analysis Panel ──────────────────────────────────────── */
function MarketPanel({ properties, activeNeighborhoods }: {
  properties: IMIProperty[]
  activeNeighborhoods: string[]
}) {
  const neighborhoods = activeNeighborhoods.length > 0 ? activeNeighborhoods : Object.keys(NEIGHBORHOOD_YIELD)

  const avgSqm = Math.round(
    neighborhoods.reduce((acc, n) => acc + (NEIGHBORHOOD_AVG_SQM[n] ?? 0), 0) / (neighborhoods.length || 1)
  )
  const avgYield = (
    neighborhoods.reduce((acc, n) => acc + (NEIGHBORHOOD_YIELD[n] ?? 0), 0) / (neighborhoods.length || 1)
  ).toFixed(1)
  const avgTrend = (
    neighborhoods.reduce((acc, n) => acc + (NEIGHBORHOOD_TREND_12M[n] ?? 0), 0) / (neighborhoods.length || 1)
  ).toFixed(1)
  const avgAbsorption = Math.round(
    neighborhoods.reduce((acc, n) => acc + (NEIGHBORHOOD_ABSORPTION[n] ?? 70), 0) / (neighborhoods.length || 1)
  )

  const filteredProps = properties.filter(p =>
    activeNeighborhoods.length === 0 || activeNeighborhoods.includes(p.neighborhood ?? '')
  )
  const avgImiScore = filteredProps.length > 0
    ? Math.round(filteredProps.reduce((acc, p) => acc + (p.imi_score ?? 0), 0) / filteredProps.length)
    : null

  const yieldMin = filteredProps.length > 0
    ? Math.min(...filteredProps.map(p => p.yield_est ?? 0)).toFixed(1)
    : '—'
  const yieldMax = filteredProps.length > 0
    ? Math.max(...filteredProps.map(p => p.yield_est ?? 0)).toFixed(1)
    : '—'

  const trendNum = parseFloat(avgTrend)

  const stats = [
    {
      label: 'Preço Médio/m²',
      value: `R$ ${(avgSqm / 1000).toFixed(1)}k`,
      sub: 'área filtrada',
      color: T.accent,
    },
    {
      label: 'Tendência 12m',
      value: `${trendNum >= 0 ? '+' : ''}${avgTrend}%`,
      sub: trendNum >= 4 ? 'Alta acelerada' : trendNum >= 2 ? 'Estável positivo' : 'Estável',
      color: trendNum >= 4 ? T.success : trendNum >= 1 ? '#D4913A' : T.textDim,
    },
    {
      label: 'IMI Score Médio',
      value: avgImiScore != null ? String(avgImiScore) : '—',
      sub: filteredProps.length > 0 ? `${filteredProps.length} imóveis` : 'sem filtro',
      color: avgImiScore != null ? getScoreStyle(avgImiScore).color : T.textDim,
    },
    {
      label: 'Yield Potencial',
      value: filteredProps.length > 0 ? `${yieldMin}–${yieldMax}%` : `${avgYield}% est.`,
      sub: 'estimado a.a.',
      color: T.success,
    },
    {
      label: 'Absorção de Mercado',
      value: `${avgAbsorption}%`,
      sub: avgAbsorption >= 80 ? 'Alta demanda' : avgAbsorption >= 65 ? 'Demanda moderada' : 'Baixa demanda',
      color: avgAbsorption >= 80 ? T.success : avgAbsorption >= 65 ? '#D4913A' : T.error,
    },
  ]

  return (
    <div style={{
      display: 'flex', gap: 10,
      padding: '14px 28px',
      background: T.surface,
      borderBottom: `1px solid ${T.borderSubtle}`,
      overflowX: 'auto',
    }}>
      {stats.map(s => (
        <div key={s.label} style={{
          flex: '0 0 auto', minWidth: 140,
          background: T.hover,
          border: `1px solid ${T.borderSubtle}`,
          borderRadius: 6, padding: '12px 14px',
        }}>
          <div style={{ fontSize: 8.5, letterSpacing: 2, textTransform: 'uppercase', color: T.textDim, fontFamily: T.font.ui, fontWeight: 700, marginBottom: 6 }}>
            {s.label}
          </div>
          <div style={{ fontSize: 20, fontFamily: T.font.data, color: s.color, lineHeight: 1, marginBottom: 4 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 10, color: T.textDim, fontFamily: T.font.ui }}>
            {s.sub}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Smart Filters Panel ────────────────────────────────────────── */
function FiltersPanel({ filters, onChange, properties }: {
  filters: ActiveFilters
  onChange: (f: ActiveFilters) => void
  properties: IMIProperty[]
}) {
  const allNeighborhoods = Array.from(new Set(
    [...Object.keys(NEIGHBORHOOD_YIELD), ...properties.map(p => p.neighborhood).filter(Boolean) as string[]]
  )).sort()

  const types = ['Apartamento', 'Casa', 'Cobertura', 'Studio']
  const statusOptions = [
    { value: 'disponivel', label: 'Disponível' },
    { value: 'reservado', label: 'Reservado' },
    { value: 'vendido', label: 'Vendido' },
    { value: 'lancamento', label: 'Lançamento' },
  ]

  function toggle<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  }

  const activeCount = [
    filters.neighborhoods.length > 0,
    filters.minPrice != null || filters.maxPrice != null,
    filters.bedrooms != null,
    filters.types.length > 0,
    filters.statuses.length > 0,
    filters.destaque,
  ].filter(Boolean).length

  return (
    <div style={{
      padding: '12px 28px',
      borderBottom: `1px solid ${T.borderSubtle}`,
      background: T.base,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Search + reset row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textDim }} />
          <input
            value={filters.search}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            placeholder="Buscar imóvel, bairro, endereço…"
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 10,
              height: 34, borderRadius: 6,
              background: T.hover,
              border: `1px solid ${T.border}`,
              color: T.text,
              fontSize: 12, fontFamily: T.font.ui,
              outline: 'none',
            }}
          />
        </div>
        {activeCount > 0 && (
          <button
            onClick={() => onChange(DEFAULT_FILTERS)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 6,
              background: 'rgba(224,107,107,0.1)',
              border: '1px solid rgba(224,107,107,0.25)',
              color: T.error, fontSize: 11, fontWeight: 600,
              letterSpacing: 1, textTransform: 'uppercase',
              fontFamily: T.font.ui, cursor: 'pointer',
            }}
          >
            <X size={11} /> Limpar ({activeCount})
          </button>
        )}
      </div>

      {/* Filter chips row */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Neighborhood multi-select */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: T.textDim, fontFamily: T.font.ui, alignSelf: 'center', marginRight: 2 }}>Bairro:</span>
          {allNeighborhoods.slice(0, 8).map(n => (
            <button
              key={n}
              onClick={() => onChange({ ...filters, neighborhoods: toggle(filters.neighborhoods, n) })}
              style={{
                padding: '4px 9px', borderRadius: 20, fontSize: 11,
                background: filters.neighborhoods.includes(n) ? T.accentBg : T.hover,
                border: filters.neighborhoods.includes(n) ? `1px solid ${T.borderActive}` : `1px solid ${T.borderSubtle}`,
                color: filters.neighborhoods.includes(n) ? T.accent : T.textMuted,
                fontFamily: T.font.ui, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {n}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: T.accentBg }} />

        {/* Type chips */}
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 10, color: T.textDim, fontFamily: T.font.ui, alignSelf: 'center', marginRight: 2 }}>Tipo:</span>
          {types.map(t => (
            <button
              key={t}
              onClick={() => onChange({ ...filters, types: toggle(filters.types, t.toLowerCase()) })}
              style={{
                padding: '4px 9px', borderRadius: 20, fontSize: 11,
                background: filters.types.includes(t.toLowerCase()) ? 'rgba(91,155,213,0.15)' : T.hover,
                border: filters.types.includes(t.toLowerCase()) ? '1px solid rgba(91,155,213,0.4)' : `1px solid ${T.borderSubtle}`,
                color: filters.types.includes(t.toLowerCase()) ? '#5B9BD5' : T.textMuted,
                fontFamily: T.font.ui, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: T.accentBg }} />

        {/* Bedrooms */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: T.textDim, fontFamily: T.font.ui }}>Quartos:</span>
          {[1, 2, 3, 4, 5].map(b => (
            <button
              key={b}
              onClick={() => onChange({ ...filters, bedrooms: filters.bedrooms === b ? null : b })}
              style={{
                width: 30, height: 26, borderRadius: 6, fontSize: 12,
                background: filters.bedrooms === b ? T.accentBg : T.hover,
                border: filters.bedrooms === b ? `1px solid ${T.borderActive}` : `1px solid ${T.borderSubtle}`,
                color: filters.bedrooms === b ? T.accent : T.textMuted,
                fontFamily: T.font.data, cursor: 'pointer',
              }}
            >
              {b === 5 ? '5+' : b}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: T.accentBg }} />

        {/* Status */}
        <div style={{ display: 'flex', gap: 4 }}>
          {statusOptions.map(s => (
            <button
              key={s.value}
              onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, s.value) })}
              style={{
                padding: '4px 9px', borderRadius: 20, fontSize: 11,
                background: filters.statuses.includes(s.value) ? `${STATUS_COLORS[s.value]}18` : T.hover,
                border: filters.statuses.includes(s.value) ? `1px solid ${STATUS_COLORS[s.value]}40` : `1px solid ${T.borderSubtle}`,
                color: filters.statuses.includes(s.value) ? STATUS_COLORS[s.value] : T.textMuted,
                fontFamily: T.font.ui, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Destaque toggle */}
        <button
          onClick={() => onChange({ ...filters, destaque: !filters.destaque })}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 10px', borderRadius: 20, fontSize: 11,
            background: filters.destaque ? T.accentBg : T.hover,
            border: filters.destaque ? `1px solid ${T.borderActive}` : `1px solid ${T.borderSubtle}`,
            color: filters.destaque ? T.accent : T.textMuted,
            fontFamily: T.font.ui, cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          <Star size={11} fill={filters.destaque ? 'currentColor' : 'none'} /> Destaques
        </button>
      </div>
    </div>
  )
}

/* ─── Property Card (Search Tab) ─────────────────────────────────── */
function PropertyCard({
  property, view, onAIClick, selected, onSelect,
}: {
  property: IMIProperty
  view: ViewMode
  onAIClick: (p: IMIProperty) => void
  selected: boolean
  onSelect: (id: string) => void
}) {
  const sc = property.imi_score ?? 0
  const scColor = getScoreStyle(sc).color
  const stColor = STATUS_COLORS[property.status] ?? T.textDim
  const stLabel = STATUS_LABELS[property.status] ?? property.status

  if (view === 'list') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '11px 16px',
        borderBottom: `1px solid ${T.borderSubtle}`,
        background: selected ? T.hover : 'transparent',
        transition: 'background 0.15s',
      }}
        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = T.hover }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Checkbox */}
        <button
          onClick={() => onSelect(property.id)}
          style={{
            width: 18, height: 18, borderRadius: 6, flexShrink: 0,
            background: selected ? T.accent : T.hover,
            border: selected ? 'none' : `1px solid ${T.borderActive}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {selected && <Check size={11} color="#0B1120" />}
        </button>

        <Link href={`/backoffice/imoveis/${property.id}`} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          {/* Thumb */}
          <div style={{
            width: 48, height: 36, borderRadius: 6, flexShrink: 0,
            background: T.active,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {property.cover_image_url
              ? <img src={property.cover_image_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Building2 size={18} style={{ color: T.textDim }} />
            }
          </div>

          {/* Name / neighborhood */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: T.text, fontFamily: T.font.ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
              {property.name}
            </p>
            <p style={{ fontSize: 11, color: T.textDim, fontFamily: T.font.ui }}>
              {[property.neighborhood, property.type].filter(Boolean).join(' · ')}
            </p>
          </div>

          {/* Price */}
          <span style={{ fontFamily: T.font.data, fontSize: 12, color: T.accent, flexShrink: 0 }}>
            {fmt(property.price)}
          </span>

          {/* Score */}
          <span style={{ fontFamily: T.font.data, fontSize: 13, fontWeight: 700, color: scColor, flexShrink: 0, width: 32, textAlign: 'center' }}>
            {sc}
          </span>

          {/* Status */}
          <span style={{
            display: 'inline-flex', padding: '2px 7px', borderRadius: 6,
            background: `${stColor}18`, border: `1px solid ${stColor}35`,
            fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
            color: stColor, fontFamily: T.font.ui,
            textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {stLabel}
          </span>
        </Link>

        {/* AI button */}
        <button
          onClick={() => onAIClick(property)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 6,
            background: T.active,
            border: `1px solid ${T.border}`,
            color: T.accent,
            fontSize: 10, fontWeight: 700, letterSpacing: 1,
            fontFamily: T.font.ui, cursor: 'pointer',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          <Sparkles size={10} /> Ver análise IA
        </button>
      </div>
    )
  }

  // Grid view
  return (
    <div style={{
      background: T.surface,
      border: selected ? `1px solid ${T.borderActive}` : `1px solid ${T.borderSubtle}`,
      borderRadius: 6, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      boxShadow: selected ? `0 0 0 2px ${T.accentBg}` : 'none',
    }}>
      {/* Thumbnail */}
      <div style={{ position: 'relative', height: 140, background: T.hover, flexShrink: 0 }}>
        {property.cover_image_url
          ? <img src={property.cover_image_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Building2 size={36} style={{ color: 'rgba(61,111,255,0.2)' }} />
          </div>
        }
        {/* Select overlay */}
        <button
          onClick={() => onSelect(property.id)}
          style={{
            position: 'absolute', top: 8, left: 8,
            width: 22, height: 22, borderRadius: 6,
            background: selected ? T.accent : 'rgba(0,0,0,0.5)',
            border: selected ? 'none' : `1px solid ${T.borderStrong}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {selected && <Check size={12} color="#0B1120" />}
        </button>
        {/* Status badge */}
        <span style={{
          position: 'absolute', top: 8, right: 8,
          display: 'inline-flex', padding: '3px 7px', borderRadius: 6,
          background: `${stColor}cc`, fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
          color: T.textInverse, fontFamily: T.font.ui, textTransform: 'uppercase',
        }}>
          {stLabel}
        </span>
        {/* Score badge */}
        <div style={{
          position: 'absolute', bottom: 8, right: 8,
          background: 'rgba(0,0,0,0.7)',
          borderRadius: 6, padding: '3px 8px',
          fontFamily: T.font.data,
          fontSize: 13, fontWeight: 700, color: scColor,
          backdropFilter: 'blur(4px)',
        }}>
          {sc}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font.ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {property.name}
          </p>
          <p style={{ fontSize: 11, color: T.textDim, fontFamily: T.font.ui, marginTop: 2 }}>
            {property.neighborhood ?? '—'} · {property.type ?? '—'}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 16, fontFamily: T.font.data, color: T.accent, fontWeight: 400 }}>
              {fmt(property.price)}
            </div>
            {property.yield_est && (
              <div style={{ fontSize: 10, color: T.success, fontFamily: T.font.ui, marginTop: 2 }}>
                Yield: {property.yield_est.toFixed(1)}% a.a.
              </div>
            )}
          </div>
          {property.area && (
            <div style={{ fontSize: 11, color: T.textDim, fontFamily: T.font.ui }}>
              {property.area}m²
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 4 }}>
          <button
            onClick={() => onAIClick(property)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              padding: '6px 8px', borderRadius: 6,
              background: T.active,
              border: `1px solid ${T.border}`,
              color: T.accent,
              fontSize: 10, fontWeight: 700, letterSpacing: 1,
              fontFamily: T.font.ui, cursor: 'pointer',
            }}
          >
            <Sparkles size={10} /> Ver análise IA
          </button>
          <Link href={`/backoffice/imoveis/${property.id}`}>
            <button style={{
              padding: '6px 10px', borderRadius: 6,
              background: 'transparent',
              border: `1px solid ${T.borderSubtle}`,
              color: T.textMuted,
              fontSize: 10, fontFamily: T.font.ui,
              cursor: 'pointer',
            }}>
              <ChevronRight size={12} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/* ─── Search / Discovery Tab ─────────────────────────────────────── */
function SearchTab({ properties, loading }: { properties: IMIProperty[]; loading: boolean }) {
  const [filters, setFilters] = useState<ActiveFilters>(DEFAULT_FILTERS)
  const [view, setView] = useState<ViewMode>('grid')
  const [aiProperty, setAiProperty] = useState<IMIProperty | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const router = useRouter()

  function showToast(msg: string) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function toggleSelect(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const filtered = properties.filter(p => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!p.name?.toLowerCase().includes(q) && !p.neighborhood?.toLowerCase().includes(q) && !p.address?.toLowerCase().includes(q)) return false
    }
    if (filters.neighborhoods.length > 0 && !filters.neighborhoods.includes(p.neighborhood ?? '')) return false
    if (filters.types.length > 0 && !filters.types.includes((p.type ?? '').toLowerCase())) return false
    if (filters.statuses.length > 0 && !filters.statuses.includes(p.status)) return false
    if (filters.bedrooms != null) {
      if (filters.bedrooms === 5) { if ((p.bedrooms ?? 0) < 5) return false }
      else { if (p.bedrooms !== filters.bedrooms) return false }
    }
    if (filters.minPrice != null && (p.price ?? 0) < filters.minPrice) return false
    if (filters.maxPrice != null && (p.price ?? 0) > filters.maxPrice) return false
    return true
  })

  function handleExportCSV() {
    const rows = [
      ['Nome', 'Bairro', 'Tipo', 'Status', 'Preço', 'Área', 'Quartos', 'IMI Score', 'Yield Est.'],
      ...filtered.map(p => [
        p.name, p.neighborhood ?? '', p.type ?? '', p.status,
        p.price ?? '', p.area ?? '', p.bedrooms ?? '',
        p.imi_score ?? '', p.yield_est?.toFixed(2) ?? '',
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'imoveis-imi.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast(`${filtered.length} imóveis exportados`)
  }

  function handleShareSelection() {
    if (selected.length === 0) { showToast('Selecione imóveis primeiro'); return }
    const url = `${window.location.origin}/backoffice/imoveis?ids=${selected.join(',')}`
    navigator.clipboard.writeText(url).then(() => showToast(`Link copiado — ${selected.length} imóveis`))
  }

  function handleGerarConteudo() {
    if (selected.length === 0) { showToast('Selecione um imóvel primeiro'); return }
    router.push(`/backoffice/conteudo/criador?property=${selected[0]}`)
  }

  const activeNeighborhoods = filters.neighborhoods

  return (
    <>
      <MarketPanel properties={properties} activeNeighborhoods={activeNeighborhoods} />
      <FiltersPanel filters={filters} onChange={setFilters} properties={properties} />

      {/* Header actions */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 28px',
        borderBottom: `1px solid ${T.borderSubtle}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font.ui }}>
            {loading ? 'Carregando…' : `${filtered.length} imóveis`}
            {selected.length > 0 && ` · ${selected.length} selecionados`}
          </span>
          {selected.length > 0 && (
            <button onClick={() => setSelected([])} style={{ fontSize: 10, color: T.textDim, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.font.ui }}>
              limpar seleção
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Map toggle */}
          <button
            onClick={() => showToast('Visualização em mapa — Em breve')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 6,
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.textMuted, fontSize: 11, fontWeight: 600,
              letterSpacing: 1, textTransform: 'uppercase',
              fontFamily: T.font.ui, cursor: 'pointer',
            }}
          >
            <Map size={12} /> Mapa
          </button>
          {/* View toggle */}
          <div style={{ display: 'flex', border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
            {(['grid', 'list'] as ViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '5px 10px',
                  background: view === v ? T.accentBg : 'transparent',
                  border: 'none', cursor: 'pointer',
                  color: view === v ? T.accent : T.textMuted,
                  fontSize: 11, fontFamily: T.font.ui,
                }}
              >
                {v === 'grid' ? '⊞' : '☰'}
              </button>
            ))}
          </div>
          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 6,
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.textMuted, fontSize: 11, fontWeight: 600,
              letterSpacing: 1, textTransform: 'uppercase',
              fontFamily: T.font.ui, cursor: 'pointer',
            }}
          >
            <Download size={12} /> Exportar CSV
          </button>
          {/* Share */}
          <button
            onClick={handleShareSelection}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 6,
              background: 'transparent', border: `1px solid ${T.border}`,
              color: T.textMuted, fontSize: 11, fontWeight: 600,
              letterSpacing: 1, textTransform: 'uppercase',
              fontFamily: T.font.ui, cursor: 'pointer',
            }}
          >
            <Share2 size={12} /> Compartilhar
          </button>
          {/* Gerar conteúdo */}
          <button
            onClick={handleGerarConteudo}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 6,
              background: T.accent,
              border: 'none', color: T.textInverse,
              fontSize: 11, fontWeight: 700,
              letterSpacing: 1, textTransform: 'uppercase',
              fontFamily: T.font.ui, cursor: 'pointer',
            }}
          >
            <Wand2 size={12} /> Gerar conteúdo
          </button>
        </div>
      </div>

      {/* Property grid/list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: 12 }}>
          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.borderSubtle}`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: T.textMuted, fontSize: 12, fontFamily: T.font.ui }}>Carregando imóveis…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 16, textAlign: 'center' }}>
          <Building2 size={40} style={{ color: 'rgba(61,111,255,0.2)' }} />
          <p style={{ fontSize: 16, color: T.text, fontFamily: T.font.display }}>Nenhum imóvel encontrado</p>
          <p style={{ fontSize: 12, color: T.textDim, fontFamily: T.font.ui }}>Ajuste os filtros para ver mais resultados.</p>
        </div>
      ) : view === 'list' ? (
        <div style={{ background: T.surface, flex: 1 }}>
          {/* List header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 16px', borderBottom: `1px solid ${T.borderSubtle}`, background: T.hover }}>
            <div style={{ width: 18 }} />
            <div style={{ width: 48 }} />
            <div style={{ flex: 1, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: T.textDim, fontFamily: T.font.ui }}>Imóvel</div>
            <div style={{ width: 80, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: T.textDim, fontFamily: T.font.ui }}>Preço</div>
            <div style={{ width: 32, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: T.textDim, fontFamily: T.font.ui, textAlign: 'center' }}>Score</div>
            <div style={{ width: 76, fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: T.textDim, fontFamily: T.font.ui }}>Status</div>
            <div style={{ width: 100 }} />
          </div>
          {filtered.map(p => (
            <PropertyCard key={p.id} property={p} view="list" onAIClick={setAiProperty} selected={selected.includes(p.id)} onSelect={toggleSelect} />
          ))}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 14, padding: '20px 28px',
        }}>
          {filtered.map(p => (
            <PropertyCard key={p.id} property={p} view="grid" onAIClick={setAiProperty} selected={selected.includes(p.id)} onSelect={toggleSelect} />
          ))}
        </div>
      )}

      {/* AI Modal */}
      {aiProperty && <AIInsightsModal property={aiProperty} onClose={() => setAiProperty(null)} />}

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          background: T.surface,
          border: `1px solid ${T.borderActive}`,
          borderRadius: 6, padding: '10px 16px',
          fontSize: 12, color: T.text,
          fontFamily: T.font.ui,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {toastMsg}
        </div>
      )}
    </>
  )
}

/* ─── Eyebrow / TabBtn / StatCard ────────────────────────────────── */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: T.accent, fontFamily: T.font.ui, fontWeight: 700 }}>
      {children}
    </span>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 18px', borderRadius: 6,
        background: active ? T.accentBg : 'transparent',
        border: active ? `1px solid ${T.borderActive}` : '1px solid transparent',
        color: active ? T.accent : T.textMuted,
        fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px',
        textTransform: 'uppercase', fontFamily: T.font.ui,
        cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '20px', flex: 1 }}>
      <div style={{ marginBottom: 10 }}><Eyebrow>{label}</Eyebrow></div>
      <span style={{ fontFamily: T.font.data, fontSize: '22px', fontWeight: 400, color, letterSpacing: '-0.5px', lineHeight: 1, display: 'block', marginBottom: sub ? 6 : 0 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: '11px', color: T.textDim, fontFamily: T.font.ui }}>{sub}</span>}
    </div>
  )
}

/* ─── Tab 1: Ranking ─────────────────────────────────────────────── */
function RankingTab() {
  const [sortBy, setSortBy] = useState<RankSort>('yield')
  const neighborhoods = Object.keys(NEIGHBORHOOD_YIELD)
  const data = neighborhoods.map(n => ({ name: n, avgSqm: NEIGHBORHOOD_AVG_SQM[n] ?? 0, yield: NEIGHBORHOOD_YIELD[n] ?? 0, trend: NEIGHBORHOOD_TREND_12M[n] ?? 0 }))
  const sorted = [...data].sort((a, b) => sortBy === 'yield' ? b.yield - a.yield : b.avgSqm - a.avgSqm)
  const maxSqm = Math.max(...data.map(d => d.avgSqm))
  const maxYield = Math.max(...data.map(d => d.yield))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontSize: '11px', color: T.textDim, fontFamily: T.font.ui }}>
          {neighborhoods.length} bairros · dados de benchmark IMI
        </p>
        <div style={{ display: 'flex', gap: 6 }}>
          <TabBtn active={sortBy === 'yield'} onClick={() => setSortBy('yield')}>Yield</TabBtn>
          <TabBtn active={sortBy === 'price'} onClick={() => setSortBy('price')}>Preço/m²</TabBtn>
        </div>
      </div>

      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 90px 80px 1fr', padding: '10px 20px', background: T.hover, borderBottom: `1px solid ${T.borderSubtle}`, gap: 12 }}>
          {['#', 'Bairro', 'Preço Médio/m²', 'Yield Est.', 'Tendência 12m', 'Distribuição'].map(h => (
            <span key={h} style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: T.textDim, fontFamily: T.font.ui }}>{h}</span>
          ))}
        </div>
        {sorted.map((d, i) => (
          <div key={d.name} style={{ display: 'grid', gridTemplateColumns: '32px 1fr 120px 90px 80px 1fr', padding: '12px 20px', borderBottom: i < sorted.length - 1 ? `1px solid ${T.borderSubtle}` : 'none', gap: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: T.font.data, fontSize: '11px', color: i === 0 ? T.accent : i === 1 ? T.textDim : i === 2 ? '#D4913A' : T.textDim, fontWeight: i < 3 ? 600 : 400 }}>{i + 1}</span>
            <span style={{ fontSize: '12px', color: T.text, fontFamily: T.font.ui, fontWeight: 500 }}>{d.name}</span>
            <span style={{ fontFamily: T.font.data, fontSize: '12px', color: T.accent, fontWeight: 400 }}>R$ {d.avgSqm.toLocaleString('pt-BR')}/m²</span>
            <span style={{ fontFamily: T.font.data, fontSize: '12px', color: T.success }}>{d.yield.toFixed(1)}% a.a.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {d.trend >= 0 ? <ChevronUp size={12} style={{ color: T.success, flexShrink: 0 }} /> : <ChevronDown size={12} style={{ color: T.error, flexShrink: 0 }} />}
              <span style={{ fontFamily: T.font.data, fontSize: '11px', color: d.trend >= 0 ? T.success : T.error }}>{d.trend >= 0 ? '+' : ''}{d.trend}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 6, background: T.hover }}>
                <div style={{ height: '100%', borderRadius: 6, width: `${((sortBy === 'yield' ? d.yield : d.avgSqm) / (sortBy === 'yield' ? maxYield : maxSqm)) * 100}%`, background: i === 0 ? `linear-gradient(90deg, #A8842A, ${T.accent})` : `linear-gradient(90deg, rgba(61,111,255,${0.25 + (1 - i / sorted.length) * 0.45}), rgba(61,111,255,${0.45 + (1 - i / sorted.length) * 0.35}))`, transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Tab 2: Análise ─────────────────────────────────────────────── */
function AnaliseTab() {
  const neighborhoods = Object.keys(NEIGHBORHOOD_YIELD)
  const prices = Object.values(NEIGHBORHOOD_AVG_SQM)
  const yields = Object.values(NEIGHBORHOOD_YIELD)
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  const avgYield = (yields.reduce((a, b) => a + b, 0) / yields.length).toFixed(1)
  const bestYieldNeigh = Object.entries(NEIGHBORHOOD_YIELD).sort((a, b) => b[1] - a[1])[0]
  const bestPriceNeigh = Object.entries(NEIGHBORHOOD_AVG_SQM).sort((a, b) => a[1] - b[1])[0]
  const top3 = Object.entries(NEIGHBORHOOD_YIELD).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name)
  const chartColors = [T.accent, T.success, '#5B9BD5']
  const heatmapNeighs = neighborhoods.slice(0, 8)
  const metrics = ['Preço/m²', 'Yield', 'Tendência', 'Liquidez']

  function getMetricValue(n: string, metric: string): number {
    if (metric === 'Preço/m²') return NEIGHBORHOOD_AVG_SQM[n] ?? 0
    if (metric === 'Yield') return NEIGHBORHOOD_YIELD[n] ?? 0
    if (metric === 'Tendência') return NEIGHBORHOOD_TREND_12M[n] ?? 0
    return ['Boa Viagem', 'Miramar', 'Pina', 'Casa Forte', 'Parnamirim'].includes(n) ? 82 : 58
  }

  function heatColor(val: number, min: number, max: number): string {
    const pct = (val - min) / (max - min || 1)
    return `rgba(${Math.round(91 + (200 - 91) * pct)},${Math.round(155 + (164 - 155) * pct)},${Math.round(213 + (74 - 213) * pct)},${0.1 + pct * 0.3})`
  }

  const metricRanges = metrics.map(m => {
    const vals = heatmapNeighs.map(n => getMetricValue(n, m))
    return { min: Math.min(...vals), max: Math.max(...vals) }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <StatCard label="Preço Médio Mercado" value={`R$ ${avgPrice.toLocaleString('pt-BR')}/m²`} sub="média ponderada dos bairros" color={T.accent} />
        <StatCard label="Yield Médio" value={`${avgYield}%`} sub="estimativa de retorno anual" color="#5DB887" />
        <StatCard label="Melhor Yield" value={bestYieldNeigh[0]} sub={`${bestYieldNeigh[1]}% a.a. estimado`} color="#5B9BD5" />
        <StatCard label="Melhor Preço/m²" value={bestPriceNeigh[0]} sub={`R$ ${bestPriceNeigh[1].toLocaleString('pt-BR')}/m²`} color="#D4913A" />
      </div>

      <div>
        <div style={{ marginBottom: 14 }}><Eyebrow>Tendência de Preço 12 Meses — Top 3 Bairros</Eyebrow></div>
        <div style={{ display: 'flex', gap: 12 }}>
          {top3.map((n, i) => {
            const trendData = buildTrendData(n)
            const trend12m = NEIGHBORHOOD_TREND_12M[n] ?? 0
            const curPrice = NEIGHBORHOOD_AVG_SQM[n] ?? 0
            return (
              <div key={n} style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: T.text, fontFamily: T.font.ui, marginBottom: 2 }}>{n}</p>
                    <p style={{ fontFamily: T.font.data, fontSize: '11px', color: chartColors[i] }}>R$ {curPrice.toLocaleString('pt-BR')}/m²</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, background: trend12m >= 0 ? 'rgba(93,184,135,0.12)' : 'rgba(224,107,107,0.12)', border: `1px solid ${trend12m >= 0 ? 'rgba(93,184,135,0.3)' : 'rgba(224,107,107,0.3)'}` }}>
                    {trend12m >= 0 ? <ChevronUp size={10} style={{ color: T.success }} /> : <ChevronDown size={10} style={{ color: T.error }} />}
                    <span style={{ fontFamily: T.font.data, fontSize: '11px', color: trend12m >= 0 ? T.success : T.error }}>{trend12m >= 0 ? '+' : ''}{trend12m}%</span>
                  </div>
                </div>
                <MarketTrendChart data={trendData} color={chartColors[i]} height={56} showLabels />
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div style={{ marginBottom: 14 }}><Eyebrow>Heatmap de Indicadores por Bairro</Eyebrow></div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `160px repeat(${metrics.length}, 1fr)`, padding: '10px 16px', background: T.hover, borderBottom: `1px solid ${T.borderSubtle}`, gap: 8 }}>
            <span style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: T.textDim, fontFamily: T.font.ui }}>Bairro</span>
            {metrics.map(m => <span key={m} style={{ fontSize: '7.5px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: T.textDim, fontFamily: T.font.ui }}>{m}</span>)}
          </div>
          {heatmapNeighs.map((n, ri) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: `160px repeat(${metrics.length}, 1fr)`, padding: '10px 16px', borderBottom: ri < heatmapNeighs.length - 1 ? `1px solid ${T.borderSubtle}` : 'none', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: T.textMuted, fontFamily: T.font.ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n}</span>
              {metrics.map((m, mi) => {
                const val = getMetricValue(n, m)
                const { min, max } = metricRanges[mi]
                let display = m === 'Preço/m²' ? `R$${(val / 1000).toFixed(1)}k` : m === 'Yield' ? `${val.toFixed(1)}%` : m === 'Tendência' ? `${val >= 0 ? '+' : ''}${val}%` : `${val}`
                return (
                  <div key={m} style={{ padding: '4px 8px', borderRadius: 6, background: heatColor(val, min, max), textAlign: 'center' }}>
                    <span style={{ fontFamily: T.font.data, fontSize: '11px', color: m === 'Tendência' && val < 0 ? T.error : T.text }}>{display}</span>
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
  const [aiProperty, setAiProperty] = useState<IMIProperty | null>(null)

  if (properties.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 6, background: T.hover, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Building2 size={28} style={{ color: 'rgba(61,111,255,0.35)' }} />
        </div>
        <p style={{ fontFamily: T.font.display, fontSize: '18px', color: T.text }}>Sem imóveis cadastrados</p>
        <Link href="/backoffice/imoveis/novo">
          <button style={{ padding: '8px 16px', borderRadius: 6, background: T.accent, border: 'none', color: T.textInverse, fontSize: '11px', fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', fontFamily: T.font.ui, cursor: 'pointer' }}>
            Cadastrar Imóvel
          </button>
        </Link>
      </div>
    )
  }

  const top10Score = [...properties].sort((a, b) => (b.imi_score ?? 0) - (a.imi_score ?? 0)).slice(0, 10)
  const top5BelowMarket = [...properties].filter(p => (p.market_delta_pct ?? 0) > 0).sort((a, b) => (b.market_delta_pct ?? 0) - (a.market_delta_pct ?? 0)).slice(0, 5)
  const top5Yield = [...properties].sort((a, b) => (b.yield_est ?? 0) - (a.yield_est ?? 0)).slice(0, 5)

  function PropertyRow({ p, rank, metric }: { p: IMIProperty; rank: number; metric?: string }) {
    const sc = p.imi_score ?? 0
    const scColor = getScoreStyle(sc).color
    const stColor = STATUS_COLORS[p.status] ?? T.textDim
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: `1px solid ${T.borderSubtle}` }}>
        <span style={{ fontFamily: T.font.data, fontSize: '12px', width: 24, flexShrink: 0, textAlign: 'center', color: rank <= 3 ? T.accent : T.textDim, fontWeight: rank <= 3 ? 600 : 400 }}>{rank}</span>
        <Link href={`/backoffice/imoveis/${p.id}`} style={{ flex: 1, minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '11px', fontWeight: 500, color: T.text, fontFamily: T.font.ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{p.name}</p>
            <p style={{ fontSize: '11px', color: T.textDim, fontFamily: T.font.ui }}>{[p.neighborhood, p.city].filter(Boolean).join(', ')}</p>
          </div>
        </Link>
        <span style={{ fontFamily: T.font.data, fontSize: '11px', color: T.textMuted, flexShrink: 0 }}>{fmt(p.price)}</span>
        {metric === 'score' && <span style={{ fontFamily: T.font.data, fontSize: '12px', fontWeight: 600, color: scColor, flexShrink: 0, width: 40, textAlign: 'right' }}>{sc}</span>}
        {metric === 'delta' && <span style={{ fontFamily: T.font.data, fontSize: '11px', color: T.success, flexShrink: 0, width: 52, textAlign: 'right' }}>+{(p.market_delta_pct ?? 0).toFixed(1)}%</span>}
        {metric === 'yield' && <span style={{ fontFamily: T.font.data, fontSize: '11px', color: T.success, flexShrink: 0, width: 56, textAlign: 'right' }}>{(p.yield_est ?? 0).toFixed(2)}%</span>}
        <span style={{ display: 'inline-flex', padding: '2px 7px', borderRadius: 6, background: `${stColor}15`, border: `1px solid ${stColor}30`, fontSize: '7.5px', fontWeight: 600, letterSpacing: '0.5px', color: stColor, fontFamily: T.font.ui, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{STATUS_LABELS[p.status] ?? p.status}</span>
        <button onClick={() => setAiProperty(p)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6, background: T.active, border: `1px solid ${T.border}`, color: T.accent, fontSize: 10, fontFamily: T.font.ui, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Sparkles size={9} /> IA
        </button>
      </div>
    )
  }

  function OppSection({ title, eyebrow, items, metric, emptyMsg }: { title: string; eyebrow: string; items: IMIProperty[]; metric: 'score' | 'delta' | 'yield'; emptyMsg: string }) {
    return (
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.borderSubtle}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <span style={{ width: 1, height: 12, background: T.accentBg, display: 'inline-block' }} />
          <span style={{ fontSize: '11px', color: T.textMuted, fontFamily: T.font.ui }}>{title}</span>
        </div>
        {items.length === 0
          ? <div style={{ padding: '20px 16px', textAlign: 'center', color: T.textDim, fontFamily: T.font.ui, fontSize: '11px' }}>{emptyMsg}</div>
          : items.map((p, i) => <PropertyRow key={p.id} p={p} rank={i + 1} metric={metric} />)
        }
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <OppSection eyebrow="Top IMI Score" title="Top 10 imóveis com maior score de investimento" items={top10Score} metric="score" emptyMsg="Nenhum imóvel cadastrado" />
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1 }}><OppSection eyebrow="Abaixo do Mercado" title="Top 5 imóveis com maior desconto vs. mercado" items={top5BelowMarket} metric="delta" emptyMsg="Nenhum imóvel abaixo do preço de mercado" /></div>
          <div style={{ flex: 1 }}><OppSection eyebrow="Maior Yield" title="Top 5 imóveis com maior yield estimado" items={top5Yield} metric="yield" emptyMsg="Nenhum imóvel com yield estimado" /></div>
        </div>
      </div>
      {aiProperty && <AIInsightsModal property={aiProperty} onClose={() => setAiProperty(null)} />}
    </>
  )
}

/* ─── Mobile Explorer ────────────────────────────────────────────── */
function MobileExplorer() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('oportunidades')
  const [properties, setProperties] = useState<IMIProperty[]>([])
  const [loadingProps, setLoadingProps] = useState(false)
  const [rankSort, setRankSort] = useState<RankSort>('yield')

  useEffect(() => {
    if (properties.length > 0) return
    setLoadingProps(true)
    const supabase = createClient()
    supabase.from('developments').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setProperties((data ?? []).map(d => enrichProperty(toP(d)))); setLoadingProps(false) })
  }, [properties.length])

  const neighborhoods = Object.keys(NEIGHBORHOOD_YIELD)
  const rankingData = neighborhoods.map(n => ({ name: n, avgSqm: NEIGHBORHOOD_AVG_SQM[n] ?? 0, yield: NEIGHBORHOOD_YIELD[n] ?? 0, trend: NEIGHBORHOOD_TREND_12M[n] ?? 0 }))
  const sortedRanking = [...rankingData].sort((a, b) => rankSort === 'yield' ? b.yield - a.yield : b.avgSqm - a.avgSqm)
  const prices = Object.values(NEIGHBORHOOD_AVG_SQM)
  const yields = Object.values(NEIGHBORHOOD_YIELD)
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
  const avgYield = (yields.reduce((a, b) => a + b, 0) / yields.length).toFixed(1)
  const bestYieldNeigh = Object.entries(NEIGHBORHOOD_YIELD).sort((a, b) => b[1] - a[1])[0]
  const bestPriceNeigh = Object.entries(NEIGHBORHOOD_AVG_SQM).sort((a, b) => a[1] - b[1])[0]
  const top10Score = [...properties].sort((a, b) => (b.imi_score ?? 0) - (a.imi_score ?? 0)).slice(0, 10)
  const top5Yield = [...properties].sort((a, b) => (b.yield_est ?? 0) - (a.yield_est ?? 0)).slice(0, 5)

  const TABS: { id: Tab; label: string }[] = [
    { id: 'oportunidades', label: 'Oportunidades' },
    { id: 'search', label: 'Imóveis' },
    { id: 'ranking', label: 'Ranking' },
    { id: 'analise', label: 'Análise' },
    { id: 'inteligencia', label: 'Intel' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column', fontFamily: T.font.ui, paddingBottom: 56 }}>
      <MobileGlobalStyles />
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 56, background: T.elevated, borderBottom: `1px solid ${T.borderSubtle}`, display: 'flex', alignItems: 'center', paddingLeft: 4, paddingRight: 16, gap: 4 }}>
        <button onClick={() => router.push('/backoffice/imoveis')} style={{ width: 44, height: 44, borderRadius: 6, background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <ArrowLeft size={20} color={T.accent} />
        </button>
        <span style={{ fontFamily: T.font.display, fontSize: '17px', fontWeight: 600, color: T.text, flex: 1 }}>Explorer de Mercado</span>
      </div>

      <div style={{ position: 'fixed', top: 56, left: 0, right: 0, zIndex: 99, height: 48, background: T.surface, borderBottom: `1px solid ${T.borderSubtle}`, display: 'flex', alignItems: 'center', overflowX: 'auto', scrollbarWidth: 'none', paddingLeft: 14, paddingRight: 14, gap: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ height: 44, paddingLeft: 16, paddingRight: 16, background: 'transparent', border: 'none', borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : '2px solid transparent', color: activeTab === tab.id ? T.accent : T.textDim, fontSize: '12px', fontWeight: activeTab === tab.id ? 700 : 500, letterSpacing: '0.5px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: T.font.ui }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, paddingTop: 104, paddingBottom: 72, paddingLeft: 14, paddingRight: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {activeTab === 'search' && (
          <>
            <div style={{ paddingTop: 4 }}>
              <span style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: T.accent, fontWeight: 700, fontFamily: T.font.ui }}>Todos os Imóveis</span>
            </div>
            {loadingProps ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: 10 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.borderSubtle}`, borderTopColor: T.accent, animation: 'mob-spin 0.8s linear infinite' }} />
                <span style={{ color: T.textDim, fontSize: '12px' }}>Carregando…</span>
              </div>
            ) : properties.map(p => {
              const stColor = STATUS_COLORS[p.status] ?? T.textDim
              return (
                <Link key={p.id} href={`/backoffice/imoveis/${p.id}`}>
                  <div style={{ background: T.elevated, border: `1px solid ${T.borderSubtle}`, borderRadius: 6, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 6, background: T.active, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.cover_image_url ? <img src={p.cover_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building2 size={20} style={{ color: T.textDim }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: T.text, fontFamily: T.font.ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{p.name}</p>
                      <p style={{ fontSize: '11px', color: T.textMuted, fontFamily: T.font.ui }}>{[p.neighborhood, fmt(p.price)].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span style={{ fontFamily: T.font.data, fontSize: '13px', fontWeight: 700, color: getScoreStyle(p.imi_score ?? 0).color, flexShrink: 0 }}>{p.imi_score ?? '—'}</span>
                    <span style={{ display: 'inline-flex', padding: '3px 7px', borderRadius: 6, background: `${stColor}18`, border: `1px solid ${stColor}35`, fontSize: '10px', fontWeight: 600, color: stColor, fontFamily: T.font.ui, textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>{STATUS_LABELS[p.status] ?? p.status}</span>
                  </div>
                </Link>
              )
            })}
          </>
        )}

        {activeTab === 'ranking' && (
          <>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              {(['yield', 'price'] as RankSort[]).map(s => (
                <button key={s} onClick={() => setRankSort(s)} style={{ flex: 1, height: 40, background: rankSort === s ? T.accentBg : T.surface, border: rankSort === s ? `1px solid ${T.borderActive}` : `1px solid ${T.borderSubtle}`, borderRadius: 6, color: rankSort === s ? T.accent : T.textDim, fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: T.font.ui }}>
                  {s === 'yield' ? 'Yield' : 'Preço/m²'}
                </button>
              ))}
            </div>
            {sortedRanking.map((d, i) => (
              <div key={d.name} style={{ background: T.elevated, border: `1px solid ${T.borderSubtle}`, borderRadius: 6, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontFamily: T.font.data, fontSize: '14px', fontWeight: i < 3 ? 700 : 400, color: i === 0 ? T.accent : i === 1 ? T.textDim : i === 2 ? '#D4913A' : T.textMuted, width: 24, flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: '13px', fontWeight: 500, color: T.text, fontFamily: T.font.ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: T.font.data, fontSize: '12px', color: T.accent }}>R$ {d.avgSqm.toLocaleString('pt-BR')}/m²</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 }}>
                    {d.trend >= 0 ? <ChevronUp size={10} style={{ color: T.success }} /> : <ChevronDown size={10} style={{ color: T.error }} />}
                    <span style={{ fontFamily: T.font.data, fontSize: '11px', color: T.success }}>{d.yield.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'analise' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, paddingTop: 4 }}>
              {[
                { label: 'Preço Médio/m²', value: `R$ ${(avgPrice / 1000).toFixed(1)}k`, color: T.accent },
                { label: 'Yield Médio', value: `${avgYield}%`, color: T.success },
                { label: 'Melhor Yield', value: bestYieldNeigh[0], color: '#5B9BD5' },
                { label: 'Menor Preço/m²', value: bestPriceNeigh[0], color: '#D4913A' },
              ].map(stat => (
                <div key={stat.label} style={{ background: T.elevated, border: `1px solid ${T.borderSubtle}`, borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '8.5px', letterSpacing: '2px', textTransform: 'uppercase', color: T.textMuted, fontWeight: 700, fontFamily: T.font.ui }}>{stat.label}</span>
                  <span style={{ fontFamily: T.font.data, fontSize: '20px', color: stat.color, lineHeight: 1, letterSpacing: '-0.5px' }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'oportunidades' && (
          loadingProps ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.borderSubtle}`, borderTopColor: T.accent, animation: 'mob-spin 0.8s linear infinite' }} />
            </div>
          ) : properties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 24px' }}>
              <Building2 size={36} style={{ color: 'rgba(61,111,255,0.2)', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '16px', color: T.text, fontFamily: T.font.display }}>Sem imóveis</p>
            </div>
          ) : (
            <>
              <span style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: T.accent, fontWeight: 700, fontFamily: T.font.ui, paddingTop: 4 }}>Top IMI Score</span>
              {top10Score.map((p, i) => {
                const sc = p.imi_score ?? 0
                return (
                  <Link key={p.id} href={`/backoffice/imoveis/${p.id}`}>
                    <div style={{ background: T.elevated, border: `1px solid ${T.borderSubtle}`, borderRadius: 6, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: T.font.data, fontSize: '13px', width: 22, flexShrink: 0, textAlign: 'center', color: i < 3 ? T.accent : T.textMuted, fontWeight: i < 3 ? 700 : 400 }}>{i + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: T.text, fontFamily: T.font.ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{p.name}</p>
                        <p style={{ fontSize: '11px', color: T.textMuted, fontFamily: T.font.ui }}>{[p.neighborhood, p.city].filter(Boolean).join(', ')}</p>
                      </div>
                      <span style={{ fontFamily: T.font.data, fontSize: '14px', fontWeight: 700, color: getScoreStyle(sc).color }}>{sc}</span>
                    </div>
                  </Link>
                )
              })}
              <span style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: T.accent, fontWeight: 700, fontFamily: T.font.ui, paddingTop: 8 }}>Maior Yield Estimado</span>
              {top5Yield.map((p, i) => (
                <Link key={p.id} href={`/backoffice/imoveis/${p.id}`}>
                  <div style={{ background: T.elevated, border: `1px solid ${T.borderSubtle}`, borderRadius: 6, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: T.font.data, fontSize: '13px', width: 22, flexShrink: 0, textAlign: 'center', color: i < 3 ? T.accent : T.textMuted, fontWeight: i < 3 ? 700 : 400 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 500, color: T.text, fontFamily: T.font.ui, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{p.name}</p>
                      <p style={{ fontSize: '11px', color: T.textMuted, fontFamily: T.font.ui }}>{fmt(p.price)}</p>
                    </div>
                    <span style={{ fontFamily: T.font.data, fontSize: '14px', fontWeight: 600, color: T.success }}>{(p.yield_est ?? 0).toFixed(2)}%</span>
                  </div>
                </Link>
              ))}
            </>
          )
        )}
        {activeTab === 'inteligencia' && (
          loadingProps ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.borderSubtle}`, borderTopColor: T.accent, animation: 'mob-spin 0.8s linear infinite' }} />
            </div>
          ) : <InteligenciaTab properties={properties} />
        )}
      </div>

      <style suppressHydrationWarning>{`@keyframes mob-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <MobileBottomNav />
    </div>
  )
}

/* ─── Tab 4: Inteligência ───────────────────────────────────────── */
function InteligenciaTab({ properties }: { properties: IMIProperty[] }) {
  if (properties.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center', color: T.textDim }}>Carregando dados...</div>
  }

  // Price distribution buckets
  const pricesAll = properties.filter(p => p.price && p.price > 0).map(p => p.price!)
  const minP = Math.min(...pricesAll)
  const maxP = Math.max(...pricesAll)
  const bucketCount = 8
  const bucketSize = (maxP - minP) / bucketCount || 1
  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const from = minP + i * bucketSize
    const to = from + bucketSize
    const count = pricesAll.filter(p => p >= from && (i === bucketCount - 1 ? p <= to : p < to)).length
    return { from, to, count, label: fmt(from) }
  })
  const maxBucket = Math.max(...buckets.map(b => b.count), 1)

  // Score distribution
  const scores = properties.filter(p => p.imi_score != null).map(p => p.imi_score!)
  const scoreBuckets = [
    { label: '90–100', min: 90, max: 100, color: '#10B981' },
    { label: '75–89', min: 75, max: 89, color: T.accent },
    { label: '60–74', min: 60, max: 74, color: '#5B9BD5' },
    { label: '40–59', min: 40, max: 59, color: '#D4913A' },
    { label: '0–39', min: 0, max: 39, color: T.error },
  ].map(b => ({ ...b, count: scores.filter(s => s >= b.min && s <= b.max).length }))
  const maxScoreBucket = Math.max(...scoreBuckets.map(b => b.count), 1)

  // Type distribution
  const typeCounts: Record<string, number> = {}
  properties.forEach(p => {
    const t = p.type ?? 'Outro'
    typeCounts[t] = (typeCounts[t] ?? 0) + 1
  })
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
  const typeColors = [T.accent, '#5B9BD5', '#5DB887', '#D4913A', T.info, T.warning]

  // Neighborhood price vs yield scatter data
  const neighData = Object.keys(NEIGHBORHOOD_YIELD).map(n => ({
    name: n,
    price: NEIGHBORHOOD_AVG_SQM[n] ?? 0,
    yield: NEIGHBORHOOD_YIELD[n] ?? 0,
    trend: NEIGHBORHOOD_TREND_12M[n] ?? 0,
    absorption: NEIGHBORHOOD_ABSORPTION[n] ?? 0,
  })).sort((a, b) => b.yield - a.yield)

  // Portfolio summary
  const totalValue = pricesAll.reduce((a, b) => a + b, 0)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
  const avgYield = properties.filter(p => p.yield_est).map(p => p.yield_est!)
  const avgYieldVal = avgYield.length ? (avgYield.reduce((a, b) => a + b, 0) / avgYield.length) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total em Carteira', value: fmt(totalValue), sub: `${properties.length} imóveis`, color: T.accent },
          { label: 'Score Médio IMI', value: `${avgScore}`, sub: avgScore >= 75 ? 'Carteira forte' : 'Oportunidade de melhora', color: getScoreStyle(avgScore).color },
          { label: 'Yield Médio', value: `${avgYieldVal.toFixed(1)}%`, sub: 'Retorno anual estimado', color: '#5DB887' },
          { label: 'Preço Médio', value: fmt(pricesAll.length ? Math.round(totalValue / pricesAll.length) : 0), sub: 'Por imóvel', color: '#5B9BD5' },
          { label: 'Preço/m² Médio', value: `R$ ${Math.round(properties.filter(p => p.price_per_sqm).map(p => p.price_per_sqm!).reduce((a, b, _, arr) => a + b / arr.length, 0)).toLocaleString('pt-BR')}`, sub: 'Média da carteira', color: '#D4913A' },
        ].map(item => (
          <StatCard key={item.label} label={item.label} value={item.value} sub={item.sub} color={item.color} />
        ))}
      </div>

      {/* Price Distribution Histogram */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
        <Eyebrow>Distribuição de Preços</Eyebrow>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 120, marginTop: 16 }}>
          {buckets.map((b, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontFamily: T.font.data, fontSize: 10, color: T.textMuted }}>{b.count}</span>
              <div style={{
                width: '100%', maxWidth: 48,
                height: `${(b.count / maxBucket) * 100}px`,
                background: `linear-gradient(180deg, ${T.accent} 0%, ${T.accentBg} 100%)`,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.5s ease',
                minHeight: b.count > 0 ? 4 : 0,
              }} />
              <span style={{ fontFamily: T.font.data, fontSize: 8, color: T.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 60 }}>
                {(b.from / 1_000_000).toFixed(1)}M
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns: Score Distribution + Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 12 }}>
        {/* Score Distribution */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
          <Eyebrow>Distribuição de Score IMI</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {scoreBuckets.map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: T.font.data, fontSize: 11, color: T.textMuted, width: 50, textAlign: 'right' }}>{b.label}</span>
                <div style={{ flex: 1, height: 18, background: T.elevated, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${(b.count / maxScoreBucket) * 100}%`,
                    height: '100%',
                    background: b.color,
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                    display: 'flex', alignItems: 'center', paddingLeft: 6,
                  }}>
                    {b.count > 0 && <span style={{ fontFamily: T.font.data, fontSize: 10, color: T.textInverse, fontWeight: 700 }}>{b.count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Type Distribution */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
          <Eyebrow>Distribuição por Tipo</Eyebrow>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {typeEntries.map(([type, count], i) => {
              const pct = properties.length > 0 ? Math.round((count / properties.length) * 100) : 0
              return (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: typeColors[i % typeColors.length], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: T.textMuted, fontFamily: T.font.ui, flex: 1, textTransform: 'capitalize' }}>{type}</span>
                  <span style={{ fontFamily: T.font.data, fontSize: 12, color: T.text, fontWeight: 600 }}>{count}</span>
                  <span style={{ fontFamily: T.font.data, fontSize: 10, color: T.textDim, width: 36, textAlign: 'right' }}>{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Neighborhood Comparison Radar Table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: 20 }}>
        <Eyebrow>Comparativo Completo de Bairros — Preço × Yield × Tendência × Absorção</Eyebrow>
        <div style={{ marginTop: 16, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px repeat(4, 1fr) 80px', padding: '10px 12px', background: T.hover, borderBottom: `1px solid ${T.borderSubtle}`, gap: 8 }}>
            {['Bairro', 'Preço/m²', 'Yield %', 'Tendência 12M', 'Absorção', 'Ranking'].map(h => (
              <span key={h} style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: T.textDim, fontFamily: T.font.ui }}>{h}</span>
            ))}
          </div>
          {neighData.map((n, i) => (
            <div key={n.name} style={{
              display: 'grid', gridTemplateColumns: '140px repeat(4, 1fr) 80px',
              padding: '10px 12px', gap: 8, alignItems: 'center',
              borderBottom: i < neighData.length - 1 ? `1px solid ${T.borderSubtle}` : 'none',
              background: i < 3 ? T.hover : 'transparent',
            }}>
              <span style={{ fontSize: 12, color: i < 3 ? T.accent : T.textMuted, fontWeight: i < 3 ? 600 : 400, fontFamily: T.font.ui }}>{n.name}</span>
              <span style={{ fontFamily: T.font.data, fontSize: 11, color: T.text }}>R$ {n.price.toLocaleString('pt-BR')}</span>
              <span style={{ fontFamily: T.font.data, fontSize: 11, color: n.yield >= 6 ? T.success : T.text, fontWeight: n.yield >= 6 ? 700 : 400 }}>{n.yield.toFixed(1)}%</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {n.trend >= 0 ? <ChevronUp size={10} style={{ color: T.success }} /> : <ChevronDown size={10} style={{ color: T.error }} />}
                <span style={{ fontFamily: T.font.data, fontSize: 11, color: n.trend >= 0 ? T.success : T.error }}>{n.trend >= 0 ? '+' : ''}{n.trend}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 6, background: T.elevated, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${n.absorption}%`, height: '100%', background: n.absorption >= 80 ? T.success : n.absorption >= 65 ? T.accent : T.warning, borderRadius: 3 }} />
                </div>
                <span style={{ fontFamily: T.font.data, fontSize: 10, color: T.textDim, width: 26 }}>{n.absorption}%</span>
              </div>
              <span style={{ fontFamily: T.font.data, fontSize: 12, fontWeight: 700, color: i < 3 ? T.accent : T.textDim, textAlign: 'center' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Investment Simulator Quick */}
      <div style={{ background: `linear-gradient(135deg, ${T.active} 0%, ${T.surface} 100%)`, border: `1px solid ${T.borderActive}`, borderRadius: 6, padding: 20 }}>
        <Eyebrow>Insights de Carteira</Eyebrow>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 16 }}>
          {[
            {
              title: 'Imóveis Abaixo do Mercado',
              value: properties.filter(p => p.market_delta_pct && p.market_delta_pct > 5).length,
              desc: 'Com desconto > 5% vs média do bairro',
              icon: '📉',
            },
            {
              title: 'Alto Potencial de Yield',
              value: properties.filter(p => p.yield_est && p.yield_est > 6).length,
              desc: 'Yield estimado > 6% a.a.',
              icon: '📈',
            },
            {
              title: 'Score Premium (80+)',
              value: properties.filter(p => p.imi_score && p.imi_score >= 80).length,
              desc: 'Imóveis nota A no IMI Score',
              icon: '⭐',
            },
            {
              title: 'Liquidez Alta',
              value: properties.filter(p => p.liquidity_index && p.liquidity_index >= 75).length,
              desc: 'Em bairros com absorção > 75%',
              icon: '🔥',
            },
          ].map(item => (
            <div key={item.title} style={{ background: T.elevated, border: `1px solid ${T.borderSubtle}`, borderRadius: 6, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div>
                <p style={{ fontFamily: T.font.data, fontSize: 24, fontWeight: 700, color: T.accent, margin: 0 }}>{item.value}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.text, fontFamily: T.font.ui, margin: '2px 0 0' }}>{item.title}</p>
                <p style={{ fontSize: 11, color: T.textDim, fontFamily: T.font.ui, margin: '2px 0 0' }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─── Desktop Explorer ───────────────────────────────────────────── */
function DesktopExplorer() {
  const [activeTab, setActiveTab] = useState<Tab>('oportunidades')
  const [properties, setProperties] = useState<IMIProperty[]>([])
  const [loadingProps, setLoadingProps] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('developments').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setProperties((data ?? []).map(d => enrichProperty(toP(d)))); setLoadingProps(false) })
  }, [])

  return (
    <div className="explorer-wrap" style={{ minHeight: '100vh', background: T.base, display: 'flex', flexDirection: 'column' }}>
      <PageIntelHeader
        moduleLabel="PORTFÓLIO · EXPLORER"
        title="Explorer de Imóveis"
        subtitle="Análise inteligente do portfólio"
      />

      {/* Tabs */}
      <div style={{ padding: '0 28px', borderBottom: `1px solid ${T.borderSubtle}`, background: T.surface }}>
        <div className="explorer-tabs" style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 12 }}>
          <TabBtn active={activeTab === 'oportunidades'} onClick={() => setActiveTab('oportunidades')}>Oportunidades</TabBtn>
          <TabBtn active={activeTab === 'search'} onClick={() => setActiveTab('search')}>Busca & Filtros</TabBtn>
          <TabBtn active={activeTab === 'ranking'} onClick={() => setActiveTab('ranking')}>Ranking de Bairros</TabBtn>
          <TabBtn active={activeTab === 'analise'} onClick={() => setActiveTab('analise')}>Análise de Mercado</TabBtn>
          <TabBtn active={activeTab === 'inteligencia'} onClick={() => setActiveTab('inteligencia')}>Inteligência</TabBtn>
        </div>
      </div>

      {/* Tab Content */}
      <div className="explorer-content" style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'search' && <SearchTab properties={properties} loading={loadingProps} />}
        {activeTab === 'ranking' && <div style={{ padding: '24px 28px' }}><RankingTab /></div>}
        {activeTab === 'analise' && <div style={{ padding: '24px 28px' }}><AnaliseTab /></div>}
        {activeTab === 'oportunidades' && (
          <div style={{ padding: '24px 28px' }}>
            {loadingProps ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.borderSubtle}`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontFamily: T.font.ui, fontSize: '12px', color: T.textMuted }}>Carregando imóveis…</span>
              </div>
            ) : <OportunidadesTab properties={properties} />}
          </div>
        )}
        {activeTab === 'inteligencia' && (
          <div style={{ padding: '24px 28px' }}>
            {loadingProps ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px', gap: 12 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.borderSubtle}`, borderTopColor: T.accent, animation: 'spin 0.8s linear infinite' }} />
                <span style={{ fontFamily: T.font.ui, fontSize: '12px', color: T.textMuted }}>Carregando dados…</span>
              </div>
            ) : <InteligenciaTab properties={properties} />}
          </div>
        )}
      </div>

      <style suppressHydrationWarning>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .explorer-tabs::-webkit-scrollbar { display: none; }
        .explorer-tabs > * { flex-shrink: 0 !important; }
      `}</style>
    </div>
  )
}

/* ─── Main Export ────────────────────────────────────────────────── */
export default function ExplorerPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileExplorer /> : <DesktopExplorer />
}
