/**
 * Centralized status configuration
 * Single source of truth for all status colors, labels, and badges
 * Import STATUS_CONFIG instead of defining local STATUS_MAP per file
 */

export const STATUS_CONFIG = {
  // ── Leads ──────────────────────────────────────────────
  novo:       { label: 'Novo',       color: 'var(--bo-info)',      bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },
  quente:     { label: 'Quente',     color: 'var(--s-hot)',        bg: 'var(--s-hot-bg)',        dot: '#f87171' },
  morno:      { label: 'Morno',      color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#fbbf24' },
  frio:       { label: 'Frio',       color: 'var(--s-cold)',       bg: 'var(--s-cold-bg)',       dot: '#22d3ee' },
  convertido: { label: 'Convertido', color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  perdido:    { label: 'Perdido',    color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },

  // ── Imóveis / Empreendimentos ──────────────────────────
  publicado:  { label: 'Publicado',  color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  rascunho:   { label: 'Rascunho',   color: 'var(--bo-text-muted)',bg: 'var(--bo-hover)',        dot: '#9ca3af' },
  vendido:    { label: 'Vendido',    color: 'var(--bo-accent)',    bg: 'var(--bo-active-bg)',    dot: '#3b82f6' },
  privado:    { label: 'Privado',    color: 'var(--bo-text-dim)',  bg: 'var(--bo-hover)',        dot: '#6b7280' },
  campanha:   { label: 'Campanha',   color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#fbbf24' },

  // ── Contratos ──────────────────────────────────────────
  pendente:   { label: 'Pendente',   color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#fbbf24' },
  assinado:   { label: 'Assinado',   color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  vencido:    { label: 'Vencido',    color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },
  em_revisao: { label: 'Em Revisão', color: 'var(--bo-info)',      bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },

  // ── Financeiro ─────────────────────────────────────────
  pago:       { label: 'Pago',       color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  atrasado:   { label: 'Atrasado',   color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },
  aberto:     { label: 'Em Aberto',  color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#fbbf24' },

  // ── Crédito ────────────────────────────────────────────
  em_analise: { label: 'Em Análise', color: 'var(--bo-info)',      bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },
  aprovado:   { label: 'Aprovado',   color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  negado:     { label: 'Negado',     color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },

  // ── Projetos ───────────────────────────────────────────
  em_andamento:{ label: 'Em Andamento', color: 'var(--bo-info)',   bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },
  concluido:  { label: 'Concluído',  color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  arquivado:  { label: 'Arquivado',  color: 'var(--bo-text-muted)',bg: 'var(--bo-hover)',        dot: '#9ca3af' },

  // ── Genérico ───────────────────────────────────────────
  ativo:      { label: 'Ativo',      color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  inativo:    { label: 'Inativo',    color: 'var(--bo-text-muted)',bg: 'var(--bo-hover)',        dot: '#9ca3af' },
  cancelado:  { label: 'Cancelado',  color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },

  // ── English aliases (for DB status_commercial) ─────────
  published:  { label: 'Publicado',  color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  draft:      { label: 'Rascunho',   color: 'var(--bo-text-muted)',bg: 'var(--bo-hover)',        dot: '#9ca3af' },
  sold:       { label: 'Vendido',    color: 'var(--bo-accent)',    bg: 'var(--bo-active-bg)',    dot: '#3b82f6' },
  private:    { label: 'Privado',    color: 'var(--bo-text-dim)',  bg: 'var(--bo-hover)',        dot: '#6b7280' },
} as const

export type StatusKey = keyof typeof STATUS_CONFIG

/**
 * Get status config with safe fallback for unknown keys
 */
export function getStatusConfig(key: string) {
  const normalized = key.toLowerCase().replace(/\s+/g, '_') as StatusKey
  return STATUS_CONFIG[normalized] ?? {
    label: key,
    color: 'var(--bo-text-muted)',
    bg: 'var(--bo-hover)',
    dot: '#9ca3af',
  }
}
