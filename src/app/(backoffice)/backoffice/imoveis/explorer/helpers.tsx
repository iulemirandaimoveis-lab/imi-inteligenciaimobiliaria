import { mapDevToProperty } from '@/features/properties/services/mapDevToProperty'
import type { IMIProperty } from '@/features/properties/types'
import { NEIGHBORHOOD_AVG_SQM, NEIGHBORHOOD_YIELD } from '@/features/properties/types'

/* ─── Status normalization ──────────────────────────────────────── */
export const DB_STATUS: Record<string, string> = {
  launch: 'lancamento', available: 'disponivel', under_construction: 'em_construcao',
  ready: 'disponivel', sold: 'vendido', reserved: 'reservado',
  negotiating: 'em_negociacao', published: 'disponivel', draft: 'arquivado',
}
export function ns(s?: string) { return DB_STATUS[s?.toLowerCase() ?? ''] ?? s?.toLowerCase() ?? 'disponivel' }
export function toP(d: unknown): IMIProperty { return mapDevToProperty(d as Record<string, unknown>) }

export function fmt(n?: number | null): string {
  if (n == null) return '—'
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(2).replace('.', ',')}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}K`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

export const STATUS_LABELS: Record<string, string> = {
  disponivel: 'Disponível', lancamento: 'Lançamento', em_construcao: 'Em Construção',
  reservado: 'Reservado', em_negociacao: 'Negociação', vendido: 'Vendido', arquivado: 'Arquivado',
}
export const STATUS_COLORS: Record<string, string> = {
  disponivel: 'var(--success)', lancamento: 'var(--imi-gold-500)', em_construcao: '#5B9BD5',
  reservado: '#D4913A', em_negociacao: 'var(--text-tertiary)', vendido: 'var(--error)', arquivado: 'var(--text-secondary)',
}

/* ─── Neighborhood data ──────────────────────────────────────────── */
export const NEIGHBORHOOD_TREND_12M: Record<string, number> = {
  'Boa Viagem': 4.2, 'Pina': 6.1, 'Miramar': 2.8, 'Casa Forte': 3.5,
  'Graças': 5.2, 'Aflitos': 4.8, 'Recife Antigo': 8.3, 'Espinheiro': 3.1,
  'Parnamirim': 5.7, 'Tamarineira': 6.4, 'Boa Vista': 7.2, 'Derby': 4.9,
}

export const NEIGHBORHOOD_ABSORPTION: Record<string, number> = {
  'Boa Viagem': 78, 'Pina': 85, 'Miramar': 62, 'Casa Forte': 71,
  'Graças': 80, 'Aflitos': 74, 'Recife Antigo': 91, 'Espinheiro': 68,
  'Parnamirim': 83, 'Tamarineira': 76, 'Boa Vista': 88, 'Derby': 72,
}

export function genSparkline(base: number, trend: number): number[] {
  const points: number[] = []
  let cur = base
  for (let i = 0; i < 12; i++) {
    const noise = (Math.random() - 0.5) * base * 0.01
    cur = cur + (cur * trend / 100 / 12) + noise
    points.push(Math.round(cur))
  }
  return points
}

export const MONTHS = ['Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez', 'Jan', 'Fev']

export function buildTrendData(neighborhood: string) {
  const base = NEIGHBORHOOD_AVG_SQM[neighborhood] ?? 8000
  const trend = NEIGHBORHOOD_TREND_12M[neighborhood] ?? 3
  const vals = genSparkline(base, trend)
  return MONTHS.map((label, i) => ({ label, value: vals[i] }))
}

/* ─── Types ──────────────────────────────────────────────────────── */
export type Tab = 'search' | 'ranking' | 'analise' | 'oportunidades'
export type RankSort = 'yield' | 'price'
export type ViewMode = 'grid' | 'list'

export interface ActiveFilters {
  search: string
  neighborhoods: string[]
  minPrice: number | null
  maxPrice: number | null
  bedrooms: number | null
  types: string[]
  statuses: string[]
  destaque: boolean
}

export const DEFAULT_FILTERS: ActiveFilters = {
  search: '', neighborhoods: [],
  minPrice: null, maxPrice: null,
  bedrooms: null, types: [], statuses: [],
  destaque: false,
}

/* ─── UI helpers ──────────────────────────────────────────────────── */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: '8.5px', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--imi-gold-500)', fontFamily: 'var(--font-outfit, sans-serif)', fontWeight: 700 }}>{children}</span>
  )
}

export function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 18px', borderRadius: 6, background: active ? 'rgba(184,148,58,0.12)' : 'transparent', border: active ? '1px solid rgba(184,148,58,0.35)' : '1px solid transparent', color: active ? 'var(--imi-gold-500)' : 'var(--text-secondary, #9FAAB8)', fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: 'var(--font-outfit, sans-serif)', cursor: 'pointer', transition: 'all 0.2s' }}>{children}</button>
  )
}

export function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ background: 'var(--bg-surface, #162040)', border: '1px solid rgba(184,148,58,0.18)', borderRadius: 6, padding: '20px', flex: 1 }}>
      <div style={{ marginBottom: 10 }}><Eyebrow>{label}</Eyebrow></div>
      <span style={{ fontFamily: 'var(--font-dm-mono, monospace)', fontSize: '22px', fontWeight: 400, color, letterSpacing: '-0.5px', lineHeight: 1, display: 'block', marginBottom: sub ? 6 : 0 }}>{value}</span>
      {sub && <span style={{ fontSize: '11px', color: 'var(--text-tertiary, #5C6B7D)', fontFamily: 'var(--font-outfit, sans-serif)' }}>{sub}</span>}
    </div>
  )
}
