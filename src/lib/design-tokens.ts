// IMI Design Tokens — Source of Truth
// Every component MUST import from here. NO hardcoded hex values.

export const BRAND = {
  // ── Cores ──
  gold:        '#C8A44A',
  goldBright:  '#D4B86A',
  goldDeep:    '#A8842A',
  goldSubtle:  'rgba(200,164,74,0.10)',
  goldBorder:  'rgba(200,164,74,0.18)',
  goldGlow:    'rgba(200,164,74,0.06)',

  navy:        '#050B14',
  navySurface: '#0A1624',
  navyCard:    '#0E1C30',
  navyRaised:  '#132440',
  navyHover:   '#1A3050',

  text1:       '#E8E4DC',
  text2:       '#8E99AB',
  text3:       '#4F5B6B',
  textInverse: '#050B14',

  success:     '#4ADE80',
  successBg:   'rgba(74,222,128,0.08)',
  error:       '#F87171',
  errorBg:     'rgba(248,113,113,0.08)',
  warning:     '#FBBF24',
  warningBg:   'rgba(251,191,36,0.08)',
  info:        '#60A5FA',
  infoBg:      'rgba(96,165,250,0.08)',

  // ── Light theme (website) ──
  ltBg:        '#F6F3ED',
  ltCard:      '#FFFFFF',
  ltText1:     '#0B1928',
  ltText2:     '#4A5568',
  ltText3:     '#8A94A3',
  ltGold:      '#A8842A',
  ltBorder:    'rgba(11,25,40,0.10)',

  // ── Tipografia ──
  fontDisplay: "var(--font-playfair, 'Playfair Display', Georgia, serif)",
  fontUI:      "var(--fu, 'Outfit', system-ui, sans-serif)",
  fontData:    "var(--fm, 'JetBrains Mono', monospace)",

  // ── Radius (ESCALA PROGRESSIVA) ──
  radiusXs:    '2px',
  radiusSm:    '4px',
  radiusMd:    '8px',
  radiusLg:    '12px',
  radiusXl:    '16px',
  radius2xl:   '20px',
  radiusFull:  '9999px',

  // ── Sombras ──
  shadowCard:  '0 2px 12px rgba(0,0,0,0.25), 0 0 0 1px rgba(200,164,74,0.08)',
  shadowFloat: '0 12px 40px rgba(0,0,0,0.40)',
  shadowGold:  '0 0 30px rgba(200,164,74,0.12)',

  // ── Touch targets ──
  minTouch:    '44px',
  btnHeight:   '48px',
  inputHeight: '48px',

  // ── Spacing 8pt grid ──
  sp1: '4px', sp2: '8px', sp3: '12px', sp4: '16px',
  sp5: '20px', sp6: '24px', sp8: '32px', sp10: '40px',
  sp12: '48px', sp16: '64px',
} as const

// ── Status canônico ──
export const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  disponivel:    { label: 'Disponível',    color: BRAND.success,  bg: BRAND.successBg },
  available:     { label: 'Disponível',    color: BRAND.success,  bg: BRAND.successBg },
  lancamento:    { label: 'Lançamento',    color: BRAND.info,     bg: BRAND.infoBg },
  launch:        { label: 'Lançamento',    color: BRAND.info,     bg: BRAND.infoBg },
  em_construcao: { label: 'Em Construção', color: BRAND.warning,  bg: BRAND.warningBg },
  construction:  { label: 'Em Construção', color: BRAND.warning,  bg: BRAND.warningBg },
  reservado:     { label: 'Reservado',     color: BRAND.gold,     bg: BRAND.goldSubtle },
  reserved:      { label: 'Reservado',     color: BRAND.gold,     bg: BRAND.goldSubtle },
  em_negociacao: { label: 'Negociação',    color: BRAND.text2,    bg: 'rgba(142,153,171,0.08)' },
  vendido:       { label: 'Vendido',       color: BRAND.error,    bg: BRAND.errorBg },
  sold:          { label: 'Vendido',       color: BRAND.error,    bg: BRAND.errorBg },
  rascunho:      { label: 'Rascunho',      color: BRAND.text3,    bg: 'rgba(79,91,107,0.08)' },
  draft:         { label: 'Rascunho',      color: BRAND.text3,    bg: 'rgba(79,91,107,0.08)' },
  arquivado:     { label: 'Arquivado',     color: BRAND.text3,    bg: 'rgba(79,91,107,0.08)' },
  ready:         { label: 'Pronta Entrega', color: BRAND.success, bg: BRAND.successBg },
  em_andamento:  { label: 'Em Andamento',  color: BRAND.warning,  bg: BRAND.warningBg },
  aguardando_docs: { label: 'Aguardando',  color: BRAND.info,     bg: BRAND.infoBg },
  concluida:     { label: 'Concluída',     color: BRAND.success,  bg: BRAND.successBg },
  cancelada:     { label: 'Cancelada',     color: BRAND.error,    bg: BRAND.errorBg },
  pendente:      { label: 'Pendente',      color: BRAND.warning,  bg: BRAND.warningBg },
  pago:          { label: 'Pago',          color: BRAND.success,  bg: BRAND.successBg },
  active:        { label: 'Ativa',         color: BRAND.success,  bg: BRAND.successBg },
  proposed:      { label: 'Proposta',      color: BRAND.info,     bg: BRAND.infoBg },
  completed:     { label: 'Concluída',     color: BRAND.success,  bg: BRAND.successBg },
  cancelled:     { label: 'Cancelada',     color: BRAND.error,    bg: BRAND.errorBg },
}

export function getStatus(status: string): { label: string; color: string; bg: string } {
  const normalized = status?.toLowerCase().replace(/\s+/g, '_').replace(/[áàã]/g, 'a').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i').replace(/[óò]/g, 'o').replace(/[úù]/g, 'u') || 'rascunho'
  return STATUS[normalized] || STATUS.rascunho
}

// ── Score faixas ──
export const SCORE_RANGES = [
  { min: 0,  max: 29,  label: 'Baixo',   color: BRAND.error,   bg: BRAND.errorBg },
  { min: 30, max: 49,  label: 'Regular',  color: BRAND.warning, bg: BRAND.warningBg },
  { min: 50, max: 69,  label: 'Bom',      color: BRAND.info,    bg: BRAND.infoBg },
  { min: 70, max: 84,  label: 'Ótimo',    color: BRAND.success, bg: BRAND.successBg },
  { min: 85, max: 100, label: 'Premium',  color: BRAND.gold,    bg: BRAND.goldSubtle },
] as const

export function getScoreRange(score: number) {
  return SCORE_RANGES.find(r => score >= r.min && score <= r.max) || SCORE_RANGES[0]
}
