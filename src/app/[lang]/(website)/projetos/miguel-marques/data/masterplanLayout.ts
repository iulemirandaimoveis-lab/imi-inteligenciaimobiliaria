export interface QuadraLayout {
  id: string
  x: number
  y: number
  cols: number
  rows: 1 | 2
  lotW: number
  lotH: number
}

// SVG Canvas: 2400 × 2100
// Lot standard: 22px wide × 30px deep
// Streets: 32px local, 50px main avenue
// Main vertical avenue: x=50-100
// Lake: centered ~x=1760, y=680, rx=260, ry=180

export const CANVAS_W = 2400
export const CANVAS_H = 2100

// Horizontal street y-positions (top edge of street band)
export const H_STREETS = [
  { y: 0,    h: 60,  type: 'main' },   // north green buffer
  { y: 230,  h: 32,  type: 'local' },
  { y: 510,  h: 32,  type: 'local' },
  { y: 790,  h: 32,  type: 'local' },
  { y: 1060, h: 32,  type: 'local' },
  { y: 1330, h: 32,  type: 'local' },
  { y: 1610, h: 32,  type: 'local' },
  { y: 1880, h: 32,  type: 'local' },
  { y: 2060, h: 60,  type: 'main' },   // south main entry
]

// Vertical street x-positions
export const V_STREETS = [
  { x: 0,    w: 60,  type: 'main' },   // west boundary avenue
  { x: 580,  w: 32,  type: 'local' },
  { x: 1140, w: 50,  type: 'main' },   // central avenue
  { x: 1720, w: 32,  type: 'local' },
  { x: 2100, w: 32,  type: 'local' },
  { x: 2360, w: 40,  type: 'main' },   // east boundary
]

// Lake (ellipse)
export const LAKE = { cx: 1780, cy: 680, rx: 260, ry: 180 }

// Green areas
export const GREEN_AREAS = [
  { x: 0, y: 0, w: 2400, h: 60 },         // north green
  { x: 0, y: 2060, w: 2400, h: 40 },       // south green
  { x: 1490, y: 460, w: 560, h: 900 },      // lake surroundings park
]

// ── QUADRA LAYOUTS ────────────────────────────────────────────
// Arranged in rows separated by streets
// Row starts at y=60, each zone ~170px, street ~32px

export const QUADRA_LAYOUTS: QuadraLayout[] = [
  // ── ZONE 1: y=60–230 ─────────────────────────────────────
  // Quadra A (29 lots, single row - corner entry block)
  { id: 'A', x: 120,  y: 68,  cols: 29, rows: 1, lotW: 22, lotH: 30 },

  // ── ZONE 2: y=262–510 ────────────────────────────────────
  // Quadra B (50 lots = 25×2)
  { id: 'B', x: 120,  y: 262, cols: 25, rows: 2, lotW: 22, lotH: 30 },
  // Quadra L (50 lots = 25×2) - right side
  { id: 'L', x: 700,  y: 262, cols: 25, rows: 2, lotW: 22, lotH: 30 },

  // ── ZONE 3: y=542–790 ────────────────────────────────────
  // Quadra C (64 lots = 32×2)
  { id: 'C', x: 120,  y: 542, cols: 32, rows: 2, lotW: 22, lotH: 30 },
  // Quadra M (25 lots = 13+12, single row visually)
  { id: 'M', x: 700,  y: 542, cols: 13, rows: 2, lotW: 22, lotH: 30 },

  // ── ZONE 4: y=822–1060 ───────────────────────────────────
  // Quadra D (76 lots = 38×2)
  { id: 'D', x: 120,  y: 822, cols: 38, rows: 2, lotW: 22, lotH: 30 },
  // Quadra N (27 lots = 14+13)
  { id: 'N', x: 700,  y: 822, cols: 14, rows: 2, lotW: 22, lotH: 30 },

  // ── ZONE 5: y=1092–1330 ──────────────────────────────────
  // Quadra E (33 lots = 17+16)
  { id: 'E', x: 120,  y: 1092, cols: 17, rows: 2, lotW: 22, lotH: 30 },
  // Quadra F (62 lots = 31×2)
  { id: 'F', x: 500,  y: 1092, cols: 31, rows: 2, lotW: 22, lotH: 30 },
  // Quadra O (46 lots = 23×2)
  { id: 'O', x: 1190, y: 1092, cols: 23, rows: 2, lotW: 22, lotH: 30 },

  // ── ZONE 6: y=1362–1610 ──────────────────────────────────
  // Quadra H (27 lots = 14+13)
  { id: 'H', x: 120,  y: 1362, cols: 14, rows: 2, lotW: 22, lotH: 30 },
  // Quadra I (44 lots = 22×2)
  { id: 'I', x: 500,  y: 1362, cols: 22, rows: 2, lotW: 22, lotH: 30 },
  // Quadra P (48 lots = 24×2)
  { id: 'P', x: 1190, y: 1362, cols: 24, rows: 2, lotW: 22, lotH: 30 },

  // ── ZONE 7: y=1642–1880 ──────────────────────────────────
  // Quadra J (30 lots = 15×2)
  { id: 'J', x: 120,  y: 1642, cols: 15, rows: 2, lotW: 22, lotH: 30 },
  // Quadra K (56 lots = 28×2)
  { id: 'K', x: 500,  y: 1642, cols: 28, rows: 2, lotW: 22, lotH: 30 },
  // Quadra Q (51 lots = 26+25)
  { id: 'Q', x: 1190, y: 1642, cols: 26, rows: 2, lotW: 22, lotH: 30 },

  // ── ZONE 8: y=1912–2060 ──────────────────────────────────
  // Quadra R (52 lots = 26×2)
  { id: 'R', x: 120,  y: 1912, cols: 26, rows: 2, lotW: 22, lotH: 30 },
  // Quadra S (50 lots = 25×2)
  { id: 'S', x: 700,  y: 1912, cols: 25, rows: 2, lotW: 22, lotH: 30 },

  // ── EAST SECTION: x=1750–2360 ────────────────────────────
  // Quadra T (21 lots = 11+10) - Avenue fronting
  { id: 'T', x: 1752, y: 262,  cols: 11, rows: 2, lotW: 22, lotH: 30 },
  // Quadra U (21 lots = 11+10)
  { id: 'U', x: 1752, y: 542,  cols: 11, rows: 2, lotW: 22, lotH: 30 },
  // Quadra V (31 lots = 16+15)
  { id: 'V', x: 1752, y: 822,  cols: 16, rows: 2, lotW: 22, lotH: 30 },
  // Quadra X (31 lots = 16+15)
  { id: 'X', x: 1752, y: 1092, cols: 16, rows: 2, lotW: 22, lotH: 30 },

  // ── LAKEFRONT: Z (38 lots = 19×2) ────────────────────────
  // Positioned south of lake, premium lakefront
  { id: 'Z', x: 1520, y: 882,  cols: 19, rows: 2, lotW: 22, lotH: 30 },
]

export const QUADRA_LABELS: Record<string, string> = {
  A: 'Quadra A', B: 'Quadra B', C: 'Quadra C', D: 'Quadra D',
  E: 'Quadra E', F: 'Quadra F', H: 'Quadra H', I: 'Quadra I',
  J: 'Quadra J', K: 'Quadra K', L: 'Quadra L', M: 'Quadra M',
  N: 'Quadra N', O: 'Quadra O', P: 'Quadra P', Q: 'Quadra Q',
  R: 'Quadra R', S: 'Quadra S', T: 'Quadra T', U: 'Quadra U',
  V: 'Quadra V', X: 'Quadra X', Z: 'Quadra Z',
}
