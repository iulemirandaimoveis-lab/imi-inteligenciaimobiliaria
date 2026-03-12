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

  // ── Lead Status (English DB values) ───────────────────────
  hot:         { label: 'Qualificando',     color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#4ade80' },
  warm:        { label: 'Warm',             color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#fbbf24' },
  cold:        { label: 'Em Análise',       color: 'var(--bo-text-muted)',bg: 'var(--bo-hover)',        dot: '#94a3b8' },
  contacted:   { label: 'Em Contato',       color: 'var(--bo-info)',      bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },
  qualified:   { label: 'Qualificado',      color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#4ade80' },
  proposal:    { label: 'Proposta Enviada', color: '#a78bfa',             bg: 'rgba(167,139,250,0.14)', dot: '#a78bfa' },
  won:         { label: 'Convertido',       color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#4ade80' },
  lost:        { label: 'Perdido',          color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },
  new:         { label: 'Novo',             color: 'var(--bo-info)',      bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },

  // ── Pipeline Kanban Stages ────────────────────────────────
  contatado:   { label: 'Contatado',   color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#f59e0b' },
  qualificado: { label: 'Qualificado', color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#10b981' },
  proposta:    { label: 'Proposta',    color: '#8b5cf6',             bg: 'rgba(139,92,246,0.14)',  dot: '#8b5cf6' },
  negociacao:  { label: 'Negociação',  color: '#f97316',             bg: 'rgba(249,115,22,0.14)',  dot: '#f97316' },
  ganho:       { label: 'Ganho',       color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#22c55e' },

  // ── Imóveis / Empreendimentos ──────────────────────────
  publicado:  { label: 'Publicado',  color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  rascunho:   { label: 'Rascunho',   color: 'var(--bo-text-muted)',bg: 'var(--bo-hover)',        dot: '#9ca3af' },
  vendido:    { label: 'Vendido',    color: '#fbbf24',             bg: 'rgba(251,191,36,0.12)',  dot: '#fbbf24' },
  privado:    { label: 'Privado',    color: 'var(--bo-text-dim)',  bg: 'var(--bo-hover)',        dot: '#6b7280' },
  campanha:   { label: 'Campanha',   color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#fbbf24' },
  disponivel:    { label: 'Disponível',    color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  em_negociacao: { label: 'Negociação',    color: 'var(--bo-info)',      bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },
  reservado:     { label: 'Reservado',     color: '#c084fc',            bg: 'rgba(192,132,252,0.12)', dot: '#c084fc' },
  lancamento:    { label: 'Lançamento',    color: '#fb923c',            bg: 'rgba(251,146,60,0.12)',  dot: '#fb923c' },
  em_construcao: { label: 'Em Construção', color: '#a78bfa',            bg: 'rgba(167,139,250,0.12)', dot: '#a78bfa' },

  // ── Contratos ──────────────────────────────────────────
  pendente:   { label: 'Pendente',   color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#fbbf24' },
  assinado:   { label: 'Assinado',   color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  vencido:    { label: 'Vencido',    color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },
  em_revisao: { label: 'Em Revisão', color: 'var(--bo-info)',      bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },
  gerado:     { label: 'Gerado',     color: '#7b9ec4',            bg: 'rgba(123,158,196,0.12)', dot: '#7b9ec4' },
  aguardando_assinatura: { label: 'Aguard. Assinatura', color: 'var(--bo-accent)', bg: 'var(--bo-active-bg)', dot: '#3b82f6' },
  assinado_parcial:      { label: 'Parcial. Assinado',  color: '#e8a87c',          bg: 'rgba(232,168,124,0.12)', dot: '#e8a87c' },

  // ── Financeiro ─────────────────────────────────────────
  pago:       { label: 'Pago',       color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  atrasado:   { label: 'Atrasado',   color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },
  aberto:     { label: 'Em Aberto',  color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#fbbf24' },

  // ── Crédito ────────────────────────────────────────────
  em_analise:   { label: 'Em Análise',   color: 'var(--bo-info)',      bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },
  aprovado:     { label: 'Aprovado',     color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  negado:       { label: 'Negado',       color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },
  documentacao: { label: 'Documentação', color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#fbbf24' },
  recusado:     { label: 'Recusado',     color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },
  // English aliases for credit
  pending:      { label: 'Pendente',     color: 'var(--bo-text-muted)',bg: 'var(--bo-hover)',        dot: '#94a3b8' },
  under_review: { label: 'Em Análise',   color: 'var(--bo-info)',      bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },
  documents:    { label: 'Documentação', color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#fbbf24' },
  approved:     { label: 'Aprovado',     color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  rejected:     { label: 'Recusado',     color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },
  analise:      { label: 'Em Análise',   color: 'var(--bo-info)',      bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },

  // ── Projetos ───────────────────────────────────────────
  em_andamento:{ label: 'Em Andamento', color: 'var(--bo-info)',   bg: 'var(--bo-info-bg)',      dot: '#60a5fa' },
  concluido:  { label: 'Concluído',  color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  arquivado:  { label: 'Arquivado',  color: 'var(--bo-text-muted)',bg: 'var(--bo-hover)',        dot: '#9ca3af' },
  estruturacao: { label: 'Estruturação', color: 'var(--bo-accent)',    bg: 'var(--bo-active-bg)',    dot: '#3b82f6' },
  obras:        { label: 'Em Obras',     color: 'var(--bo-warning)',   bg: 'var(--bo-warning-bg)',   dot: '#f59e0b' },
  pronto:       { label: 'Pronto',       color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#22c55e' },

  // ── Genérico ───────────────────────────────────────────
  ativo:      { label: 'Ativo',      color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  inativo:    { label: 'Inativo',    color: 'var(--bo-text-muted)',bg: 'var(--bo-hover)',        dot: '#9ca3af' },
  cancelado:  { label: 'Cancelado',  color: 'var(--bo-error)',     bg: 'var(--bo-error-bg)',     dot: '#f87171' },

  // ── English aliases (for DB status_commercial) ─────────
  published:  { label: 'Publicado',  color: 'var(--bo-success)',   bg: 'var(--bo-success-bg)',   dot: '#34d399' },
  draft:      { label: 'Rascunho',   color: 'var(--bo-text-muted)',bg: 'var(--bo-hover)',        dot: '#9ca3af' },
  sold:       { label: 'Vendido',    color: '#fbbf24',             bg: 'rgba(251,191,36,0.12)',  dot: '#fbbf24' },
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
