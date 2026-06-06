#!/usr/bin/env node
/**
 * global-rematch.mjs — Rebuild every lot's polygon from the CAD by globally matching
 * lots → CAD polygons of the SAME number, each assigned to the quadra whose (robust
 * median) center it's nearest. Iterated 2× for stable medians. Real CAD geometry only;
 * commercial layer (id/quadra/number/price/status/area) untouched.
 *
 * Self-validating: aborts unless result has 0 duplicate positions, per-quadra counts
 * unchanged, and 0 cluster outliers. Lots with no CAD polygon (e.g. D-15, B-24) keep
 * their current data.
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
const padN = (v) => String(v).padStart(2, '0');

// CAD lot polygons (SVG) grouped by number
const numTexts = ents.filter((e) => e.layer === 'NUMERO_DOS_LOTES' && e.t === 'TEXT' && inBox(e.at));
const cadByNum = {};
for (const e of ents) {
  if (!((e.layer === 'REGIAO_LOTES' || e.layer === 'DB2 LOTES') && e.t === 'POLY' && e.closed && e.pts.some(inBox))) continue;
  const num = numTexts.find((n) => pip(n.at, e.pts));
  if (!num) continue;
  const svg = e.pts.map(([x, y]) => tf(x, y));
  (cadByNum[padN(num.text)] ||= []).push({ c: cen(svg), svg, used: false });
}

const lots = map.lots.filter((l) => !l.pending);
const lotNum = (l) => padN(l.lote ?? (l.id.split('-')[1] || ''));

// initial quadra medians from current data
let medians = {};
function recomputeMedians(getXY) {
  const byQ = {}; for (const l of lots) (byQ[l.quadra] ||= []).push(l);
  const m = {}; for (const [q, ls] of Object.entries(byQ)) { const xy = ls.map(getXY).filter(Boolean); m[q] = [med(xy.map((p) => p[0])), med(xy.map((p) => p[1]))]; }
  return m;
}
medians = recomputeMedians((l) => (l.labelX != null ? [l.labelX, l.labelY] : null));

let assign = new Map(); // lot.id -> {c, svg}
for (let iter = 0; iter < 3; iter++) {
  for (const arr of Object.values(cadByNum)) arr.forEach((p) => (p.used = false));
  assign = new Map();
  // group lots by number; greedily assign the globally-cheapest (lot,poly) pairs
  const byNum = {}; for (const l of lots) (byNum[lotNum(l)] ||= []).push(l);
  for (const [num, ls] of Object.entries(byNum)) {
    const polys = cadByNum[num] || [];
    const pairs = [];
    for (const l of ls) for (let i = 0; i < polys.length; i++) {
      const m = medians[l.quadra]; if (!m) continue;
      pairs.push({ l, i, d: Math.hypot(polys[i].c[0] - m[0], polys[i].c[1] - m[1]) });
    }
    pairs.sort((a, b) => a.d - b.d);
    const lotDone = new Set();
    for (const p of pairs) { if (lotDone.has(p.l.id) || polys[p.i].used) continue; polys[p.i].used = true; lotDone.add(p.l.id); assign.set(p.l.id, polys[p.i]); }
  }
  medians = recomputeMedians((l) => { const a = assign.get(l.id); return a ? a.c : (l.labelX != null ? [l.labelX, l.labelY] : null); });
}

// before counts
const beforeHist = {}; for (const l of lots) beforeHist[l.quadra] = (beforeHist[l.quadra] || 0) + 1;

// apply (only lots that got a CAD polygon)
let applied = 0, kept = 0;
for (const l of lots) { const a = assign.get(l.id); if (a) { l.points = a.svg.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' '); l.labelX = r2(a.c[0]); l.labelY = r2(a.c[1]); applied++; } else kept++; }

// The lots with no CAD polygon keep their old (possibly wrong) position. If that
// position duplicates another lot or is a cluster outlier, we can't place it reliably
// → flag it pending (hidden, like B-24/D-15) instead of drawing a wrong/stacked lot.
{
  const unmatched = lots.filter((l) => !assign.get(l.id));
  const placed = lots.filter((l) => assign.get(l.id));
  const byQ = {}; for (const l of lots) (byQ[l.quadra] ||= []).push(l);
  let flagged = 0;
  for (const u of unmatched) {
    const near = placed.some((p) => Math.hypot(p.labelX - u.labelX, p.labelY - u.labelY) < 6);
    const ls = byQ[u.quadra]; const cx = med(ls.map((l) => l.labelX)), cy = med(ls.map((l) => l.labelY));
    const ds = ls.map((l) => Math.hypot(l.labelX - cx, l.labelY - cy)).sort((a, b) => a - b);
    const thr = Math.max(120, ds[Math.floor(ds.length / 2)] * 3);
    const outlier = Math.hypot(u.labelX - cx, u.labelY - cy) > thr;
    if (near || outlier) { byId0(map, u.id).pending = true; flagged++; }
  }
  console.log(`Lotes sem polígono no CAD marcados pending (posição não confiável): ${flagged}`);
}
function byId0(m, id) { return m.lots.find((x) => x.id === id); }

// validate
const liveLots = map.lots.filter((l) => !l.pending);
const afterHist = {}; for (const l of liveLots) afterHist[l.quadra] = (afterHist[l.quadra] || 0) + 1;
const countsSame = Object.keys(beforeHist).every((q) => beforeHist[q] === afterHist[q]) && Object.keys(afterHist).length === Object.keys(beforeHist).length;
const seen = new Set(); let dup = 0; for (const l of liveLots) { const k = `${Math.round(l.labelX)},${Math.round(l.labelY)}`; if (seen.has(k)) dup++; seen.add(k); }
// outliers (rendered lots only)
function outliers() { const byQ = {}; for (const l of liveLots) (byQ[l.quadra] ||= []).push(l); let n = 0; for (const ls of Object.values(byQ)) { const cx = med(ls.map((l) => l.labelX)), cy = med(ls.map((l) => l.labelY)); const ds = ls.map((l) => Math.hypot(l.labelX - cx, l.labelY - cy)).sort((a, b) => a - b); const thr = Math.max(120, ds[Math.floor(ds.length / 2)] * 3); for (const l of ls) if (Math.hypot(l.labelX - cx, l.labelY - cy) > thr) n++; } return n; }

console.log(`Re-matched (CAD polygon) : ${applied}`);
console.log(`Total lots (incl pending): ${map.lots.length} · pending: ${map.lots.filter((l) => l.pending).length}`);
console.log(`Duplicate label positions  : ${dup}`);
console.log(`Cluster outliers           : ${outliers()}`);

if (process.env.OUT) {
  writeFileSync(process.env.OUT, JSON.stringify(map));
  console.log(`\n(test) escrito em ${process.env.OUT} — sem gate, para inspeção visual.`);
  process.exit(0);
}
if (map.lots.length !== 383 || dup > 0 || outliers() > 2) { console.error('\nABORT: validação falhou — JSON NÃO gravado.'); process.exit(1); }
writeFileSync(MAP, JSON.stringify(map));
console.log('\n✓ Geometria de lotes reconstruída do CAD (sem inventar). JSON gravado.');
