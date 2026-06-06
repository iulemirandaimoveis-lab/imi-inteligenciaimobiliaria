#!/usr/bin/env node
/**
 * quadra-truth.mjs — Ground-truth quadra→lot assignment from the CAD.
 * Each lot's quadra = the DB2 QUADRAS polygon (named by the IDENT letter inside it)
 * that contains the lot centroid. This replaces the old (wrong) data assignments.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { entities: ents } = JSON.parse(readFileSync(resolve(__dirname, '.cache/cad-entities.json'), 'utf8'));

const C1 = { minX: 3900, maxX: 5200, minY: 850, maxY: 2500 };
const inBox = (p) => p[0] >= C1.minX && p[0] <= C1.maxX && p[1] >= C1.minY && p[1] <= C1.maxY;
const cen = (pts) => { let x = 0, y = 0; for (const [a, b] of pts) { x += a; y += b; } return [x / pts.length, y / pts.length]; };
const shoe = (pts) => { let s = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; s += x1 * y2 - x2 * y1; } return Math.abs(s) / 2; };
function pip([x, y], poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) c = !c; } return c; }

// Quadra outline polygons (DB2 QUADRAS), copy 1, named by the single IDENT letter inside.
const idents = ents.filter((e) => e.layer === 'IDENT_DAS_QUADRAS' && e.t === 'TEXT' && /^[A-P]$/.test(e.text) && inBox(e.at));
const quadPolysRaw = ents.filter((e) => e.layer === 'DB2 QUADRAS' && e.t === 'POLY' && e.closed && e.pts.length >= 3 && e.pts.some(inBox));
const quadPolys = [];
for (const q of quadPolysRaw) {
  const inside = idents.filter((id) => pip(id.at, q.pts));
  if (inside.length === 1) quadPolys.push({ letter: inside[0].text, pts: q.pts, area: shoe(q.pts) });
}
// Keep, per letter, the polygons (a quadra may be one or more outlines).
const byLetter = {};
for (const q of quadPolys) (byLetter[q.letter] ||= []).push(q);
console.log('Quadra outline polygons matched to a single IDENT letter:');
for (const L of Object.keys(byLetter).sort()) console.log(`  ${L}: ${byLetter[L].length} polygon(s), areas=${byLetter[L].map((p) => p.area.toFixed(0)).join(',')}`);
console.log(`Letters with an outline: ${Object.keys(byLetter).sort().join('')} (${Object.keys(byLetter).length}/16)`);

// Lots
const lots = ents.filter((e) => (e.layer === 'REGIAO_LOTES' || e.layer === 'DB2 LOTES') && e.t === 'POLY' && e.closed && e.pts.some(inBox));
const numTexts = ents.filter((e) => e.layer === 'NUMERO_DOS_LOTES' && e.t === 'TEXT' && inBox(e.at));

const hist = {}; let unassigned = 0;
const oLots = [];
for (const lot of lots) {
  const c = cen(lot.pts);
  let q = null;
  for (const [L, polys] of Object.entries(byLetter)) if (polys.some((p) => pip(c, p.pts))) { q = L; break; }
  if (!q) { unassigned++; continue; }
  hist[q] = (hist[q] || 0) + 1;
  if (q === 'O') { const num = numTexts.find((n) => pip(n.at, lot.pts)); oLots.push(num?.text ?? '?'); }
}

const EXP = { A: 25, B: 20, C: 13, D: 24, E: 38, F: 27, G: 21, H: 45, I: 16, J: 24, K: 32, L: 24, M: 27, N: 31, O: 3, P: 13 };
console.log('\nGround-truth quadra→lot (point-in-quadra-polygon) vs current data:');
let tot = 0;
for (const L of Object.keys(EXP)) {
  const c = hist[L] || 0; tot += c;
  console.log(`  ${L}: CAD-truth=${String(c).padStart(3)}  data=${String(EXP[L]).padStart(3)} ${c !== EXP[L] ? '  ← DIFERE Δ' + (c - EXP[L]) : ''}`);
}
console.log(`  TOTAL assigned=${tot}  unassigned(no quadra poly)=${unassigned}  lots=${lots.length}`);
console.log(`\nQuadra O lots (numbers): ${oLots.sort((a, b) => +a - +b).join(', ')}`);
