#!/usr/bin/env node
/**
 * apply-outlier-fix.mjs — Correct the ~29 lots whose polygon was swapped to the wrong
 * quadra by the old extraction. Each outlier gets the CAD polygon with the SAME number
 * that lies in its quadra's real cluster. Real CAD geometry only (nothing invented).
 * Commercial layer (price/status/area) untouched — only points/labelX/labelY change.
 *
 * Safety: targets must be unique + not collide with a good lot; after applying, the
 * outlier count must drop to ~0 and per-quadra counts must be unchanged. Aborts otherwise.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP = resolve(__dirname, '../../public/maps/alto-bellevue-lots.json');
const { entities: ents } = JSON.parse(readFileSync(resolve(__dirname, '.cache/cad-entities.json'), 'utf8'));
const T = JSON.parse(readFileSync(resolve(__dirname, '.cache/transform.json'), 'utf8')).M;
const map = JSON.parse(readFileSync(MAP, 'utf8'));
const tf = (x, y) => [T.a * x + T.b * y + T.c, T.d * x + T.e * y + T.f];
const r2 = (n) => Math.round(n * 100) / 100;
const C1 = { minX: 3900, maxX: 5200, minY: 850, maxY: 2500 };
const inBox = (p) => p[0] >= C1.minX && p[0] <= C1.maxX && p[1] >= C1.minY && p[1] <= C1.maxY;
const cen = (pts) => { let x = 0, y = 0; for (const [a, b] of pts) { x += a; y += b; } return [x / pts.length, y / pts.length]; };
function pip([x, y], poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) c = !c; } return c; }
const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

const numTexts = ents.filter((e) => e.layer === 'NUMERO_DOS_LOTES' && e.t === 'TEXT' && inBox(e.at));
const cadLots = ents.filter((e) => (e.layer === 'REGIAO_LOTES' || e.layer === 'DB2 LOTES') && e.t === 'POLY' && e.closed && e.pts.some(inBox))
  .map((e) => { const num = numTexts.find((n) => pip(n.at, e.pts)); const svg = e.pts.map(([x, y]) => tf(x, y)); return { num: num?.text ?? null, c: cen(svg), svg }; })
  .filter((l) => l.num);

function detectOutliers(lots) {
  const byQ = {}; for (const l of lots) { if (l.labelX == null || l.pending) continue; (byQ[l.quadra] ||= []).push(l); }
  const out = [];
  for (const [q, ls] of Object.entries(byQ)) {
    const cx = med(ls.map((l) => l.labelX)), cy = med(ls.map((l) => l.labelY));
    const ds = ls.map((l) => Math.hypot(l.labelX - cx, l.labelY - cy)).sort((a, b) => a - b);
    const thr = Math.max(120, ds[Math.floor(ds.length / 2)] * 3);
    for (const l of ls) if (Math.hypot(l.labelX - cx, l.labelY - cy) > thr) out.push({ ...l, _cx: cx, _cy: cy, _good: ls.filter((g) => Math.hypot(g.labelX - cx, g.labelY - cy) <= thr) });
  }
  return out;
}

const outliers = detectOutliers(map.lots);
const beforeHist = {}; for (const l of map.lots) if (!l.pending) beforeHist[l.quadra] = (beforeHist[l.quadra] || 0) + 1;

const fixes = []; const usedTargets = [];
for (const o of outliers) {
  const n = String(o.lote ?? (o.id.split('-')[1] || '')).padStart(2, '0');
  const cands = cadLots.filter((c) => String(c.num).padStart(2, '0') === n)
    .map((c) => ({ c, d: Math.min(...o._good.map((g) => Math.hypot(c.c[0] - g.labelX, c.c[1] - g.labelY))) }))
    .sort((a, b) => a.d - b.d);
  const best = cands[0];
  const occupied = best && o._good.some((g) => Math.hypot(g.labelX - best.c.c[0], g.labelY - best.c.c[1]) < 6);
  const dupTarget = best && usedTargets.some((t) => Math.hypot(t[0] - best.c.c[0], t[1] - best.c.c[1]) < 3);
  if (!best || best.d >= 60 || occupied || dupTarget) { console.error(`ABORT: ${o.id} não re-matcheável com segurança (d=${best?.d?.toFixed(0)}, occ=${occupied}, dup=${dupTarget})`); process.exit(1); }
  usedTargets.push(best.c.c);
  fixes.push({ id: o.id, svg: best.c.svg, c: best.c.c });
}

// apply
const byId = new Map(map.lots.map((l) => [l.id, l]));
for (const f of fixes) {
  const lot = byId.get(f.id);
  lot.points = f.svg.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');
  lot.labelX = r2(f.c[0]); lot.labelY = r2(f.c[1]);
}

// validate: outliers should be ~0, counts unchanged, no duplicate label positions
const after = detectOutliers(map.lots);
const afterHist = {}; for (const l of map.lots) if (!l.pending) afterHist[l.quadra] = (afterHist[l.quadra] || 0) + 1;
const countsSame = Object.keys(beforeHist).every((q) => beforeHist[q] === afterHist[q]);
const posKey = (l) => `${Math.round(l.labelX)},${Math.round(l.labelY)}`;
const seen = new Set(); let dupPos = 0;
for (const l of map.lots) { if (l.pending) continue; const k = posKey(l); if (seen.has(k)) dupPos++; seen.add(k); }

console.log(`Outliers: ${outliers.length} → ${after.length}`);
console.log(`Per-quadra counts unchanged: ${countsSame}`);
console.log(`Duplicate label positions: ${dupPos}`);
if (after.length > 3 || !countsSame || dupPos > 0) { console.error('ABORT: validação falhou — não gravando.'); process.exit(1); }

writeFileSync(MAP, JSON.stringify(map));
console.log(`\n✓ Aplicadas ${fixes.length} correções de polígono (lotes trocados de quadra). JSON gravado.`);
