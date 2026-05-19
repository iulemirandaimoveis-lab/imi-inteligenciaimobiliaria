// Procedural layout engine for the interactive loteamento masterplan.
// Generates SVG geometry (rectangles) for each quadra and lot
// based purely on the data returned from Supabase — no hardcoded coordinates.

export const LOT_W = 56;      // lot frontage (SVG units)
export const LOT_H = 84;      // lot depth   (SVG units)
const LOT_GAP     = 3;        // gap between adjacent lots
const LABEL_ROW   = 28;       // height reserved for the quadra label row
const PADDING     = 10;       // internal quadra padding

const STREET_H    = 72;       // horizontal street height
const STREET_V    = 80;       // vertical street width
const OUTER_MARGIN = 140;

const GRID_COLS   = 6;        // quadras per grid row

export interface LotGeometry {
  id: string;
  cx: number;   // center x (for label)
  cy: number;   // center y (for label)
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface QuadraGeometry {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  labelX: number;
  labelY: number;
  lots: LotGeometry[];
}

export interface MapLayout {
  viewBox: string;
  totalW: number;
  totalH: number;
  quadras: QuadraGeometry[];
}

function quadraCols(n: number): number {
  // Aim for a roughly 2:1 wide-to-tall ratio (like real blocks)
  // but cap at 16 per row to avoid extremely thin strips
  return Math.min(Math.ceil(n / 2), 16);
}

export function generateMapLayout(
  quadraData: Map<string, { id: string; lot_number: number }[]>
): MapLayout {
  const sortedIds = [...quadraData.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Compute uniform quadra cell size (based on largest quadra)
  let maxCols = 1;
  let maxRows = 1;
  for (const id of sortedIds) {
    const lots = quadraData.get(id)!;
    const cols = quadraCols(lots.length);
    const rows = Math.ceil(lots.length / cols);
    if (cols > maxCols) maxCols = cols;
    if (rows > maxRows) maxRows = rows;
  }

  const CELL_W = maxCols * (LOT_W + LOT_GAP) + PADDING * 2;
  const CELL_H = maxRows * (LOT_H + LOT_GAP) + PADDING * 2 + LABEL_ROW;

  const gridRows = Math.ceil(sortedIds.length / GRID_COLS);
  const totalW = OUTER_MARGIN * 2 + GRID_COLS * CELL_W + (GRID_COLS - 1) * STREET_V;
  const totalH = OUTER_MARGIN * 2 + gridRows * CELL_H + (gridRows - 1) * STREET_H + 80; // +80 entrance

  const quadras: QuadraGeometry[] = sortedIds.map((id, index) => {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);

    const qx = OUTER_MARGIN + col * (CELL_W + STREET_V);
    const qy = OUTER_MARGIN + row * (CELL_H + STREET_H);

    const lots = quadraData.get(id)!;
    const cols = quadraCols(lots.length);

    const lotGeometries: LotGeometry[] = lots
      .slice()
      .sort((a, b) => a.lot_number - b.lot_number)
      .map((lot, i) => {
        const lc = i % cols;
        const lr = Math.floor(i / cols);
        const lx = qx + PADDING + lc * (LOT_W + LOT_GAP);
        const ly = qy + LABEL_ROW + PADDING + lr * (LOT_H + LOT_GAP);
        return {
          id: lot.id,
          x: lx,
          y: ly,
          w: LOT_W,
          h: LOT_H,
          cx: lx + LOT_W / 2,
          cy: ly + LOT_H / 2,
        };
      });

    return {
      id,
      x: qx,
      y: qy,
      w: CELL_W,
      h: CELL_H,
      labelX: qx + CELL_W / 2,
      labelY: qy + LABEL_ROW / 2 + 4,
      lots: lotGeometries,
    };
  });

  return { viewBox: `0 0 ${totalW} ${totalH}`, totalW, totalH, quadras };
}
