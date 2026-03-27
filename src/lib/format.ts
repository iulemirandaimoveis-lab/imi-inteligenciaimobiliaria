/**
 * Centralized formatting utilities for IMI
 * Replaces 41+ local `fmt()`, 9 `timeAgo()`, 17 `normalizeStatus()` definitions
 */

export function formatCurrency(
  value: number | null | undefined,
  options?: { compact?: boolean; decimals?: number }
): string {
  if (value == null) return '—'
  const { compact = false, decimals } = options || {}

  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      return `R$ ${(value / 1_000_000).toFixed(decimals ?? 2).replace('.', ',')}M`
    }
    if (Math.abs(value) >= 1_000) {
      return `R$ ${(value / 1_000).toFixed(decimals ?? 0)}K`
    }
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: decimals ?? 0,
  }).format(value)
}

/** Drop-in replacement for local `const fmt = ...` */
export const fmt = (v: number | null | undefined) => formatCurrency(v, { compact: true })

export function formatNumber(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: decimals }).format(value)
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value == null) return '—'
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function timeAgo(dateStr: string | Date): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
  const diff = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diff < 2) return 'agora'
  if (diff < 60) return `${diff} min`
  if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`
  if (diff < 43200) return `${Math.floor(diff / 1440)}d atrás`
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDate(iso: string, style: 'short' | 'long' = 'short'): string {
  const d = new Date(iso)
  if (style === 'long') {
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const STATUS_MAP: Record<string, string> = {
  launch: 'lancamento', available: 'disponivel', under_construction: 'em_construcao',
  ready: 'disponivel', sold: 'vendido', reserved: 'reservado',
  negotiating: 'em_negociacao', published: 'disponivel', draft: 'rascunho',
  campaign: 'lancamento', private: 'privado',
  lancamento: 'lancamento', disponivel: 'disponivel', em_construcao: 'em_construcao',
  vendido: 'vendido', reservado: 'reservado', em_negociacao: 'em_negociacao', arquivado: 'arquivado',
}

export function normalizeStatus(status: string | null | undefined): string {
  if (!status) return 'disponivel'
  return STATUS_MAP[status.toLowerCase()] ?? status.toLowerCase()
}
