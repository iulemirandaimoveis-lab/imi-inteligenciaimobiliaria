#!/usr/bin/env node
/**
 * build-lots.mjs — Regenerate public/maps/alto-bellevue-lots.json from CAD truth.
 *
 * Strategy (approved): SURGICAL. The existing 383 polygons are already a sub-pixel
 * affine image of CAD copy 1 (see build-transform.mjs, residual ≈0.03 SVG units), so
 * we PRESERVE them + the whole commercial layer and only correct the items the CAD
 * proves wrong:
 *
 *   1. portaria  → GUARITA position (CAD 4931,2201)              [was @600,773, off-map]
 *   2. lazer     → PISCINA position  (CAD 4510,2190)             [was @600,411, on a road]
 *   3. Quadra O  → O-02/O-03 polygons swapped for the CAD lots   [were dumped in M/L zone]
 *                  that actually sit next to O-01
 *   4. greenAreas→ 9 official "ÁREA VERDE NN" positions          [was [] / pendente]
 *   5. street    → drop the bogus "ÁREA VERDE" label             [it's a road x-section note]
 *   6. B-24      → flagged pending (no CAD polygon; user-confirmed) — kept in the 383
 *                  inventory, hidden by the containment net, excluded from the gate.
 *
 * Inputs:  scripts/cad/.cache/cad-entities.json, scripts/cad/.cache/transform.json,
 *          public/maps/alto-bellevue-lots.json (current)
 * Output:  public/maps/alto-bellevue-lots.json (rewritten, 2-space indent)
 *
 * Re-run after extract-dxf + build-transform. Idempotent.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const MAP = resolve(ROOT, 'public/maps/alto-bellevue-lots.json');

const { entities: ents } = JSON.parse(readFileSync(resolve(__dirname, '.cache/cad-entities.json'), 'utf8'));
const { M, points: T, greenAreas: GREEN } = JSON.parse(readFileSync(resolve(__dirname, '.cache/transform.json'), 'utf8'));
const map = JSON.parse(readFileSync(MAP, 'utf8'));

const tf = (x, y) => [M.a * x + M.b * y + M.c, M.d * x + M.e * y + M.f];
const C1 = { minX: 3900, maxX: 5200, minY: 850, maxY: 2500 };
const inBox = (p) => p[0] >= C1.minX && p[0] <= C1.maxX && p[1] >= C1.minY && p[1] <= C1.maxY;
const cen = (pts) => { let x = 0, y = 0; for (const [a, b] of pts) { x += a; y += b; } return [x / pts.length, y / pts.length]; };
const round2 = (n) => Math.round(n * 100) / 100;
function pip([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
const ptsToStr = (pts) => pts.map(([x, y]) => `${round2(x)},${round2(y)}`).join(' ');

const log = [];
const note = (s) => { log.push(s); };

// ── 1 & 2: amenity positions from CAD ────────────────────────────────────────
const amenityPos = { portaria: T.portaria, lazer: T.lazer };
for (const a of map.amenities) {
  const p = amenityPos[a.id];
  if (p) { note(`amenity ${a.id}: (${a.x},${a.y}) → (${round2(p.x)},${round2(p.y)})`); a.x = round2(p.x); a.y = round2(p.y); }
}

// ── 3: Quadra O — swap O-02 / O-03 polygons for the CAD lots next to O-01 ─────
// Find CAD lot polygons clustered at the O label whose contained number is 02 / 03.
const oLabelSvg = tf(4270, 1750); // (398,660)
const numTexts = ents.filter((e) => e.layer === 'NUMERO_DOS_LOTES' && e.t === 'TEXT' && inBox(e.at));
const cadLots = ents.filter((e) => (e.layer === 'REGIAO_LOTES' || e.layer === 'DB2 LOTES') && e.t === 'POLY' && e.closed && e.pts.some(inBox));
function cadLotByNumberNear(number, target, radius) {
  let best = null, bd = radius;
  for (const e of cadLots) {
    const c = cen(e.pts);
    const [tx, ty] = tf(c[0], c[1]);
    const d = Math.hypot(tx - target[0], ty - target[1]);
    if (d > radius) continue;
    const numInside = numTexts.find((n) => pip(n.at, e.pts));
    if (numInside?.text === number && d < bd) { bd = d; best = e; }
  }
  return best;
}
for (const num of ['02', '03']) {
  const cad = cadLotByNumberNear(num, [oLabelSvg[0], oLabelSvg[1]], 40);
  const lot = map.lots.find((l) => l.id === `O-${num}`);
  if (cad && lot) {
    const svgPts = cad.pts.map(([x, y]) => tf(x, y));
    const c = cen(svgPts);
    note(`O-${num}: polygon (${lot.labelX?.toFixed(0)},${lot.labelY?.toFixed(0)}) → (${c[0].toFixed(0)},${c[1].toFixed(0)})`);
    lot.points = ptsToStr(svgPts);
    lot.labelX = round2(c[0]);
    lot.labelY = round2(c[1]);
  } else {
    note(`O-${num}: CAD lot NOT found (cad=${!!cad} lot=${!!lot}) — left unchanged`);
  }
}

// ── 4: green areas (official CAD positions) ───────────────────────────────────
map.greenAreas = GREEN.map((g) => ({ id: g.id, label: g.label, x: round2(g.x), y: round2(g.y) }))
  .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
note(`greenAreas: ${map.greenAreas.length} áreas verdes do CAD`);

// ── 5: drop bogus "ÁREA VERDE" street label (road cross-section note, not a street)
const before = map.streetLabels.length;
map.streetLabels = map.streetLabels.filter((s) => !/^\s*ÁREA\s+VERDE\s*$/i.test(s.name));
note(`streetLabels: ${before} → ${map.streetLabels.length} (removida "ÁREA VERDE")`);

// ── 6: B-24 pending (no CAD polygon) ──────────────────────────────────────────
const b24 = map.lots.find((l) => l.id === 'B-24');
if (b24) { b24.pending = true; note(`B-24: marcado pending=true (sem polígono no CAD; oculto pela contenção)`); }

// stats unchanged: we only relocate polygons + flag B-24 (statuses untouched).

// Keep the file minified (production asset served to browsers), matching the source.
writeFileSync(MAP, JSON.stringify(map));
console.log('── build-lots: alterações aplicadas ──');
for (const l of log) console.log('  • ' + l);
console.log(`\nEscrito ${MAP}`);
console.log(`Totais: lots=${map.lots.length} streetLabels=${map.streetLabels.length} amenities=${map.amenities.length} greenAreas=${map.greenAreas.length}`);
