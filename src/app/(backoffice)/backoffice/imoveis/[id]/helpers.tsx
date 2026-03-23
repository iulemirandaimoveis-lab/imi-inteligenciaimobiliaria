import type { IMIProperty } from '@/features/properties/types'
import { NEIGHBORHOOD_AVG_SQM } from '@/features/properties/types'
import type { Development } from './types'

// ─── Status normalization ─────────────────────────────────────────────────────

export const DB_STATUS_TO_DISPLAY: Record<string, string> = {
  launch: 'lancamento',
  available: 'disponivel',
  under_construction: 'em_construcao',
  ready: 'disponivel',
  sold: 'vendido',
  reserved: 'reservado',
  negotiating: 'em_negociacao',
  published: 'disponivel',
  draft: 'arquivado',
  campaign: 'lancamento',
  private: 'arquivado',
  disponivel: 'disponivel',
  em_negociacao: 'em_negociacao',
  reservado: 'reservado',
  vendido: 'vendido',
  lancamento: 'lancamento',
  em_construcao: 'em_construcao',
  arquivado: 'arquivado',
}

export function normalizeStatus(raw?: string): string {
  if (!raw) return 'disponivel'
  return DB_STATUS_TO_DISPLAY[raw.toLowerCase()] ?? raw.toLowerCase()
}

// ─── Formatters ──────────────────────────────────────────────────────────────

export function fmtCurrency(v?: number | null): string {
  if (!v) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export function fmtNum(v?: number | null): string {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR').format(v)
}

export function toIMIProperty(d: Development): IMIProperty {
  const status = normalizeStatus(d.status_commercial ?? d.status)
  return {
    id: d.id,
    name: d.name,
    type: d.type ?? 'apartamento',
    condition: d.condition ?? status,
    status,
    price: d.price_from ?? undefined,
    area: d.area_from ?? undefined,
    bedrooms: d.bedrooms ?? undefined,
    bathrooms: d.bathrooms ?? undefined,
    parking: d.parking_spaces ?? undefined,
    neighborhood: d.neighborhood ?? undefined,
    city: d.city ?? undefined,
    state: d.state ?? undefined,
    address: d.address ?? undefined,
    image_urls: d.gallery_images ?? d.image_urls ?? undefined,
    cover_image_url: d.image ?? d.cover_image_url ?? undefined,
    slug: d.slug ?? undefined,
    developer: d.developer ?? undefined,
    created_at: d.created_at ?? undefined,
    updated_at: d.updated_at ?? undefined,
  }
}

// ─── Style constants ──────────────────────────────────────────────────────────

export const EYEBROW: React.CSSProperties = {
  fontSize: '8.5px',
  letterSpacing: '3px',
  textTransform: 'uppercase',
  color: 'var(--accent-400)',
  fontFamily: 'var(--font-outfit, sans-serif)',
  fontWeight: 700,
}

export const CARD: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid rgba(61,111,255,0.18)',
  borderRadius: '12px',
}

export const BTN_PRIMARY: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background: 'var(--n, #0A1624)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '6px',
  padding: '12px 22px',
  fontFamily: "var(--fu, 'Outfit', sans-serif)",
  fontWeight: 600,
  fontSize: '11px',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  whiteSpace: 'nowrap' as const,
}

export const BTN_SECONDARY: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(61,111,255,0.25)',
  color: 'var(--gold, var(--accent-400))',
  borderRadius: '6px',
  letterSpacing: '1.8px',
  textTransform: 'uppercase',
  fontWeight: 700,
  fontFamily: 'var(--font-outfit, sans-serif)',
  fontSize: '11px',
  padding: '10px 20px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  whiteSpace: 'nowrap' as const,
}

export const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-dm-mono, JetBrains Mono, monospace)',
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ w, h, r = '6px' }: { w: string; h: string; r?: string }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: 'var(--bg-surface)',
      animation: 'pulse 1.8s ease-in-out infinite',
    }} />
  )
}

// ─── Mock Comparables ─────────────────────────────────────────────────────────

export function buildComparables(d: Development) {
  const neighborhood = d.neighborhood ?? 'Centro'
  const avgSqm = NEIGHBORHOOD_AVG_SQM[neighborhood] ?? 9500
  return [
    { name: `${neighborhood} Residences`, area: (d.area_from ?? 80) + 5, priceSqm: Math.round(avgSqm * 1.05), delta: 5.2 },
    { name: `Edifício ${neighborhood} Park`, area: (d.area_from ?? 80) - 8, priceSqm: Math.round(avgSqm * 0.97), delta: -3.1 },
    { name: `${neighborhood} Premier`, area: (d.area_from ?? 80) + 15, priceSqm: Math.round(avgSqm * 1.12), delta: 11.8 },
    { name: `Terraço ${neighborhood}`, area: (d.area_from ?? 80) - 3, priceSqm: Math.round(avgSqm * 0.94), delta: -6.0 },
  ]
}

// ─── Status options ────────────────────────────────────────────────────────────

export const STATUS_OPTIONS = [
  { value: 'disponivel', label: 'Disponível', color: '#6BB87B' },
  { value: 'em_negociacao', label: 'Em Negociação', color: 'var(--accent-400)' },
  { value: 'reservado', label: 'Reservado', color: '#A89EC4' },
  { value: 'vendido', label: 'Vendido', color: '#7B9EC4' },
  { value: 'lancamento', label: 'Lançamento', color: '#E8A87C' },
]
