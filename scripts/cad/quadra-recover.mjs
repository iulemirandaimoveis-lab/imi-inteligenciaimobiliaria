#!/usr/bin/env node
/**
 * quadra-recover.mjs — Recover all 16 quadra outlines + assign every lot.
 * For each quadra letter (A–P), pick the quadra-sized DB2 QUADRAS polygon whose
 * centroid is nearest to that letter. Then assign each lot to the quadra polygon
 * containing its centroid (fallback: nearest quadra polygon). Report counts + O.
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
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

const idents = ents.filter((e) => e.layer === 'IDENT_DAS_QUADRAS' && e.t === 'TEXT' && /^[A-P]$/.test(e.text) && inBox(e.at))
  .map((e) => ({ L: e.text, at: e.at }));
// quadra-sized polygons (exclude perimeter >20000 and tiny canteiros <1000)
const polys = ents.filter((e) => e.layer === 'DB2 QUADRAS' && e.t === 'POLY' && e.closed && e.pts.length >= 4 && e.pts.some(inBox))
  .map((e) => ({ pts: e.pts, c: cen(e.pts), area: shoe(e.pts) }))
  .filter((p) => p.area >= 800 && p.area <= 20000);

// Assign each letter the nearest quadra-sized polygon (greedy, unique).
const used = new Set();
const quadByLetter = {};
const letters = 'ABCDEFGHIJKLMNOP'.split('');
// order letters by how isolated their nearest poly is (assign confident ones first)
const cand = [];
for (const id of idents) for (let i = 0; i < polys.length; i++) cand.push({ L: id.L, i, d: d2(id.at, polys[i].c) });
cand.sort((a, b) => a.d - b.d);
for (const c of cand) {
  if (quadByLetter[c.L] || used.has(c.i)) continue;
  quadByLetter[c.L] = polys[c.i]; used.add(c.i);
}
console.log('Quadra outline recovery (letter → polygon area, dist to letter):');
for (const L of letters) {
  const q = quadByLetter[L];
  console.log(`  ${L}: ${q ? `area=${q.area.toFixed(0)} dist=${Math.sqrt(d2(idents.find((i)=>i.L===L).at, q.c)).toFixed(0)}` : 'NONE'}`);
}

const lots = ents.filter((e) => (e.layer === 'REGIAO_LOTES' || e.layer === 'DB2 LOTES') && e.t === 'POLY' && e.closed && e.pts.some(inBox));
const numTexts = ents.filter((e) => e.layer === 'NUMERO_DOS_LOTES' && e.t === 'TEXT' && inBox(e.at));
const hist = {}; const oNums = []; let viaPip = 0, viaNear = 0;
for (const lot of lots) {
  const c = cen(lot.pts);
  let L = letters.find((l) => quadByLetter[l] && pip(c, quadByLetter[l].pts));
  if (L) viaPip++; else { // nearest quadra polygon centroid
    let bd = Infinity; for (const l of letters) if (quadByLetter[l]) { const dd = d2(c, quadByLetter[l].c); if (dd < bd) { bd = dd; L = l; } }
    viaNear++;
  }
  hist[L] = (hist[L] || 0) + 1;
  if (L === 'O') { const num = numTexts.find((n) => pip(n.at, lot.pts)); oNums.push(num?.text ?? '?'); }
}
const EXP = { A: 25, B: 20, C: 13, D: 24, E: 38, F: 27, G: 21, H: 45, I: 16, J: 24, K: 32, L: 24, M: 27, N: 31, O: 3, P: 13 };
console.log(`\nAssignment: via point-in-polygon=${viaPip}, via nearest=${viaNear}`);
console.log('Quadra counts (recovered) vs current data:');
let tot = 0;
for (const L of letters) { const c = hist[L] || 0; tot += c; console.log(`  ${L}: recovered=${String(c).padStart(3)}  data=${String(EXP[L]).padStart(3)}${c !== EXP[L] ? '  ←Δ' + (c - EXP[L]) : ''}`); }
console.log(`  TOTAL=${tot} (lots=${lots.length})`);
console.log(`Quadra O lots: ${oNums.sort((a,b)=>+a-+b).join(', ')}`);
