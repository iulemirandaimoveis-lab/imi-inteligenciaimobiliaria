export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    disponivel:    { label: 'Disponível',    color: 'var(--success, #4ADE80)',   bg: 'rgba(74,222,128,0.10)' },
    available:     { label: 'Disponível',    color: 'var(--success, #4ADE80)',   bg: 'rgba(74,222,128,0.10)' },
    lancamento:    { label: 'Lançamento',    color: 'var(--info, #60A5FA)',      bg: 'rgba(96,165,250,0.10)' },
    launch:        { label: 'Lançamento',    color: 'var(--info, #60A5FA)',      bg: 'rgba(96,165,250,0.10)' },
    em_construcao: { label: 'Em Construção', color: 'var(--warning, #FBBF24)',   bg: 'rgba(251,191,36,0.10)' },
    construction:  { label: 'Em Construção', color: 'var(--warning, #FBBF24)',   bg: 'rgba(251,191,36,0.10)' },
    reservado:     { label: 'Reservado',     color: 'var(--gold, #C8A44A)',      bg: 'rgba(200,164,74,0.10)' },
    reserved:      { label: 'Reservado',     color: 'var(--gold, #C8A44A)',      bg: 'rgba(200,164,74,0.10)' },
    vendido:       { label: 'Vendido',       color: 'var(--error, #F87171)',     bg: 'rgba(248,113,113,0.10)' },
    sold:          { label: 'Vendido',       color: 'var(--error, #F87171)',     bg: 'rgba(248,113,113,0.10)' },
    em_negociacao: { label: 'Negociação',    color: 'var(--text-secondary, #8E99AB)', bg: 'rgba(142,153,171,0.10)' },
    rascunho:      { label: 'Rascunho',      color: 'var(--text-tertiary, #4F5B6B)', bg: 'rgba(79,91,107,0.10)' },
    draft:         { label: 'Rascunho',      color: 'var(--text-tertiary, #4F5B6B)', bg: 'rgba(79,91,107,0.10)' },
    arquivado:     { label: 'Arquivado',     color: 'var(--text-tertiary, #4F5B6B)', bg: 'rgba(79,91,107,0.10)' },
    ready:         { label: 'Pronta Entrega', color: 'var(--success, #4ADE80)',  bg: 'rgba(74,222,128,0.10)' },
}

export function getStatusConfig(status: string): { label: string; color: string; bg: string } {
    const normalized = status?.toLowerCase().replace(/\s+/g, '_').replace(/[áàã]/g, 'a').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i').replace(/[óò]/g, 'o').replace(/[úù]/g, 'u') || 'rascunho'
    return STATUS_CONFIG[normalized] || STATUS_CONFIG.rascunho
}
