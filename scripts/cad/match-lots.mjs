#!/usr/bin/env node
/**
 * match-lots.mjs — validate the lot↔number↔quadra matching against expectations.
 * Read-only dry run before regenerating the canonical JSON.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { entities: ents } = JSON.parse(readFileSync(resolve(__dirname, '.cache/cad-entities.json'), 'utf8'));

const C1 = { minX: 3900, maxX: 5200, minY: 850, maxY: 2500 };
const inBox = (p) => p[0] >= C1.minX && p[0] <= C1.maxX && p[1] >= C1.minY && p[1] <= C1.maxY;

const lotPolys = ents.filter(
  (e) => (e.layer === 'REGIAO_LOTES' || e.layer === 'DB2 LOTES') && e.t === 'POLY' && e.closed && e.pts.some(inBox),
);
const numTexts = ents.filter(
  (e) => e.layer === 'NUMERO_DOS_LOTES' && (e.t === 'TEXT' || e.t === 'MTEXT') && inBox(e.at),
);
const quadLabels = ents
  .filter((e) => e.layer === 'IDENT_DAS_QUADRAS' && e.t === 'TEXT' && /^[A-P]$/.test(e.text) && inBox(e.at))
  .map((e) => ({ q: e.text, x: e.at[0], y: e.at[1] }));

function centroid(pts) {
  let x = 0, y = 0;
  for (const [px, py] of pts) { x += px; y += py; }
  return [x / pts.length, y / pts.length];
}
function pointInPoly([x, y], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function nearestQuadra([x, y]) {
  let best = null, bd = Infinity;
  for (const q of quadLabels) { const d = (q.x - x) ** 2 + (q.y - y) ** 2; if (d < bd) { bd = d; best = q.q; } }
  return best;
}

const EXPECTED = { A: 25, B: 20, C: 13, D: 24, E: 38, F: 27, G: 21, H: 45, I: 16, J: 24, K: 32, L: 24, M: 27, N: 31, O: 3, P: 13 };

// Assign each lot polygon its contained number + nearest quadra.
const hist = {};
let withNum = 0, withoutNum = 0;
const usedNumIdx = new Set();
const assigned = [];
for (const poly of lotPolys) {
  const c = centroid(poly.pts);
  const q = nearestQuadra(c);
  // find a number text inside this polygon
  let numText = null, numIdx = -1;
  for (let i = 0; i < numTexts.length; i++) {
    if (usedNumIdx.has(i)) continue;
    if (pointInPoly(numTexts[i].at, poly.pts)) { numText = numTexts[i].text; numIdx = i; break; }
  }
  if (numIdx >= 0) { usedNumIdx.add(numIdx); withNum++; } else withoutNum++;
  hist[q] = (hist[q] || 0) + 1;
  assigned.push({ q, num: numText, c });
}

console.log(`Lot polygons in C1: ${lotPolys.length}`);
console.log(`  with a number text inside: ${withNum}`);
console.log(`  without a number text:     ${withoutNum}`);
console.log(`Number texts in C1: ${numTexts.length}; matched to a polygon: ${usedNumIdx.size}; orph(no polygon): ${numTexts.length - usedNumIdx.size}`);

console.log('\nPer-quadra (CAD nearest-letter) vs EXPECTED:');
let totCad = 0, totExp = 0;
for (const q of Object.keys(EXPECTED)) {
  const cad = hist[q] || 0; totCad += cad; totExp += EXPECTED[q];
  const flag = cad === EXPECTED[q] ? '' : `  <-- Δ ${cad - EXPECTED[q]}`;
  console.log(`  ${q}: CAD=${String(cad).padStart(3)}  expected=${String(EXPECTED[q]).padStart(3)}${flag}`);
}
console.log(`  TOTAL: CAD=${totCad}  expected=${totExp}`);

// Orphan numbers (have a number but no polygon contained it) — candidates for the missing-polygon gap.
const orphanNums = numTexts.filter((_, i) => !usedNumIdx.has(i));
console.log(`\nOrphan number texts (no polygon) — ${orphanNums.length}:`);
for (const o of orphanNums.slice(0, 40)) {
  console.log(`  "${o.text}" @ [${o.at[0].toFixed(0)}, ${o.at[1].toFixed(0)}] nearestQ=${nearestQuadra(o.at)}`);
}
