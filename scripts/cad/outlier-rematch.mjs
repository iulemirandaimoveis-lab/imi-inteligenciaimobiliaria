#!/usr/bin/env node
/**
 * outlier-rematch.mjs — DRY RUN. For each lot whose polygon sits far from its quadra
 * cluster (an "outlier" that leaks when filtering), find the CAD lot polygon numbered
 * the same that actually lies in that quadra's cluster, and report the re-match.
 * Uses CAD polygons (not invented) + the validated affine transform.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const { entities: ents } = JSON.parse(readFileSync(resolve(__dirname, '.cache/cad-entities.json'), 'utf8'));
const T = JSON.parse(readFileSync(resolve(__dirname, '.cache/transform.json'), 'utf8')).M;
const map = JSON.parse(readFileSync(resolve(__dirname, '../../public/maps/alto-bellevue-lots.json'), 'utf8'));
const tf = (x, y) => [T.a * x + T.b * y + T.c, T.d * x + T.e * y + T.f];
const C1 = { minX: 3900, maxX: 5200, minY: 850, maxY: 2500 };
const inBox = (p) => p[0] >= C1.minX && p[0] <= C1.maxX && p[1] >= C1.minY && p[1] <= C1.maxY;
const cen = (pts) => { let x = 0, y = 0; for (const [a, b] of pts) { x += a; y += b; } return [x / pts.length, y / pts.length]; };
function pip([x, y], poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) c = !c; } return c; }
const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// CAD lot polygons (SVG space) + their number
const numTexts = ents.filter((e) => e.layer === 'NUMERO_DOS_LOTES' && e.t === 'TEXT' && inBox(e.at));
const cadLots = ents.filter((e) => (e.layer === 'REGIAO_LOTES' || e.layer === 'DB2 LOTES') && e.t === 'POLY' && e.closed && e.pts.some(inBox))
  .map((e) => { const num = numTexts.find((n) => pip(n.at, e.pts)); const svg = e.pts.map(([x, y]) => tf(x, y)); return { num: num?.text ?? null, c: cen(svg), svg }; })
  .filter((l) => l.num);

// quadra centers + outliers (same logic as the audit)
const byQ = {};
for (const l of map.lots) { if (l.labelX == null || l.pending) continue; (byQ[l.quadra] ||= []).push(l); }
let fixable = 0, ambiguous = 0; const rows = [];
for (const [q, lots] of Object.entries(byQ)) {
  const cx = med(lots.map((l) => l.labelX)), cy = med(lots.map((l) => l.labelY));
  const dists = lots.map((l) => Math.hypot(l.labelX - cx, l.labelY - cy)).sort((a, b) => a - b);
  const medDist = dists[Math.floor(dists.length / 2)];
  const thresh = Math.max(120, medDist * 3);
  const good = lots.filter((l) => Math.hypot(l.labelX - cx, l.labelY - cy) <= thresh);
  const outliers = lots.filter((l) => Math.hypot(l.labelX - cx, l.labelY - cy) > thresh);
  for (const o of outliers) {
    const n = String(o.lote ?? o.lot_number ?? (o.id.split('-')[1] || '')).padStart(2, '0');
    // candidate CAD polygons with same number, ranked by distance to this quadra's good cluster
    const cands = cadLots.filter((c) => String(c.num).padStart(2, '0') === n)
      .map((c) => ({ c, d: Math.min(...good.map((g) => Math.hypot(c.c[0] - g.labelX, c.c[1] - g.labelY))) }))
      .sort((a, b) => a.d - b.d);
    const best = cands[0];
    // accept if best is clearly inside the quadra cluster (< 60) and not occupied by a good lot
    const occupied = best && good.some((g) => Math.hypot(g.labelX - best.c.c[0], g.labelY - best.c.c[1]) < 6);
    const ok = best && best.d < 60 && !occupied;
    if (ok) fixable++; else ambiguous++;
    rows.push(`  ${o.id}: cur(${o.labelX.toFixed(0)},${o.labelY.toFixed(0)}) → ${ok ? `CAD(${best.c.c[0].toFixed(0)},${best.c.c[1].toFixed(0)}) d=${best.d.toFixed(0)} ✓` : `AMBÍGUO (best d=${best ? best.d.toFixed(0) : 'none'}, cands=${cands.length})`}`);
  }
}
console.log('Outlier re-match dry run:');
for (const r of rows.sort()) console.log(r);
console.log(`\nFixáveis com confiança: ${fixable} · ambíguos: ${ambiguous}`);
