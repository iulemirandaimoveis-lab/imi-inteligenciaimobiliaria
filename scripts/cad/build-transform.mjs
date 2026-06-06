#!/usr/bin/env node
/**
 * build-transform.mjs — Derive + validate the affine transform CAD(copy-1) → SVG.
 *
 * The current canonical map is already an affine image of CAD copy 1. We recover
 * that exact transform by least-squares fitting CAD lot centroids onto the existing
 * lot centroids (which also absorbs any rotation/shear), then report the residual.
 * A small residual proves the transform is trustworthy enough to place the CAD
 * ground-truth points (GUARITA, PISCINA, green areas…) into the SVG frame.
 *
 * Prints the transform coefficients and the key transformed coordinates.
 * Writes scripts/cad/.cache/transform.json for the build step to consume.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { entities: ents } = JSON.parse(readFileSync(resolve(__dirname, '.cache/cad-entities.json'), 'utf8'));
const ROOT = resolve(__dirname, '../..');
const current = JSON.parse(readFileSync(resolve(ROOT, 'public/maps/alto-bellevue-lots.json'), 'utf8'));

const C1 = { minX: 3900, maxX: 5200, minY: 850, maxY: 2500 };
const inBox = (p) => p[0] >= C1.minX && p[0] <= C1.maxX && p[1] >= C1.minY && p[1] <= C1.maxY;
const centroid = (pts) => {
  let x = 0, y = 0; for (const [px, py] of pts) { x += px; y += py; } return [x / pts.length, y / pts.length];
};
const bbox = (pts) => {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of pts) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  return { minX: a, minY: b, maxX: c, maxY: d };
};

// ── CAD lot centroids (copy 1) ──
const cadLots = ents
  .filter((e) => (e.layer === 'REGIAO_LOTES' || e.layer === 'DB2 LOTES') && e.t === 'POLY' && e.closed && e.pts.some(inBox))
  .map((e) => centroid(e.pts));

// ── Existing SVG lot centroids ──
const svgLots = current.lots
  .filter((l) => l.labelX != null && l.labelY != null)
  .map((l) => [l.labelX, l.labelY]);

// ── Seed transform from perimeter bbox correspondence (scale+translate+Yflip) ──
const cadPerim = ents.find((e) => e.layer === 'DB2 LIMITE DO LOTE' && e.t === 'POLY' && e.closed && e.pts.length > 50 && e.pts.some(inBox));
const cadBB = bbox(cadPerim.pts);
const svgPerimRing = (current.perimeter || [])
  .map((s) => s.trim().split(/\s+/).map((p) => p.split(',').map(Number)))
  .sort((a, b) => b.length - a.length)[0];
const svgBB = bbox(svgPerimRing);
const sx0 = (svgBB.maxX - svgBB.minX) / (cadBB.maxX - cadBB.minX);
const sy0 = (svgBB.maxY - svgBB.minY) / (cadBB.maxY - cadBB.minY);
const T0 = (x, y) => [svgBB.minX + (x - cadBB.minX) * sx0, svgBB.maxY - (y - cadBB.minY) * sy0]; // Y-flip

// ── Match CAD→SVG centroids via nearest neighbour under T0, keep confident pairs ──
const pairs = [];
for (const [cx, cy] of cadLots) {
  const [tx, ty] = T0(cx, cy);
  let best = null, bd = Infinity;
  for (const [sx, sy] of svgLots) { const d = (sx - tx) ** 2 + (sy - ty) ** 2; if (d < bd) { bd = d; best = [sx, sy]; } }
  if (best && Math.sqrt(bd) < 12) pairs.push({ cad: [cx, cy], svg: best });
}

// ── Least-squares affine: [X;Y] = M·[x;y;1].  Solve for (a,b,c) and (d,e,f). ──
function solve3(A, y) { // Gaussian elimination, A is 3x3, y is 3
  const m = A.map((r, i) => [...r, y[i]]);
  for (let i = 0; i < 3; i++) {
    let p = i; for (let k = i + 1; k < 3; k++) if (Math.abs(m[k][i]) > Math.abs(m[p][i])) p = k;
    [m[i], m[p]] = [m[p], m[i]];
    for (let k = i + 1; k < 3; k++) { const f = m[k][i] / m[i][i]; for (let j = i; j < 4; j++) m[k][j] -= f * m[i][j]; }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) { let s = m[i][3]; for (let j = i + 1; j < 3; j++) s -= m[i][j] * x[j]; x[i] = s / m[i][i]; }
  return x;
}
function fitAffine(pairs) {
  // Normal equations for x' = a·x + b·y + c
  let Sxx = 0, Sxy = 0, Sx = 0, Syy = 0, Sy = 0, S1 = pairs.length;
  let SxX = 0, SyX = 0, SX = 0, SxY = 0, SyY = 0, SY = 0;
  for (const { cad: [x, y], svg: [X, Y] } of pairs) {
    Sxx += x * x; Sxy += x * y; Sx += x; Syy += y * y; Sy += y;
    SxX += x * X; SyX += y * X; SX += X; SxY += x * Y; SyY += y * Y; SY += Y;
  }
  const N = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, S1]];
  const abc = solve3(N, [SxX, SyX, SX]);
  const def = solve3(N, [SxY, SyY, SY]);
  return { a: abc[0], b: abc[1], c: abc[2], d: def[0], e: def[1], f: def[2] };
}

const M = fitAffine(pairs);
const T = (x, y) => [M.a * x + M.b * y + M.c, M.d * x + M.e * y + M.f];

// ── Residual under T1 ──
const res = pairs.map(({ cad, svg }) => { const [tx, ty] = T(cad[0], cad[1]); return Math.hypot(tx - svg[0], ty - svg[1]); }).sort((a, b) => a - b);
const median = res[Math.floor(res.length / 2)];
const p95 = res[Math.floor(res.length * 0.95)];
const mean = res.reduce((s, v) => s + v, 0) / res.length;

console.log(`Matched pairs: ${pairs.length} / ${cadLots.length} CAD lots`);
console.log(`Seed scale: sx=${sx0.toFixed(5)} sy=${sy0.toFixed(5)}`);
console.log(`Affine M: a=${M.a.toFixed(5)} b=${M.b.toFixed(5)} c=${M.c.toFixed(3)}`);
console.log(`          d=${M.d.toFixed(5)} e=${M.e.toFixed(5)} f=${M.f.toFixed(3)}`);
const rot = Math.atan2(M.d, M.a) * 180 / Math.PI;
console.log(`Implied rotation: ${rot.toFixed(3)}°   scaleX=${Math.hypot(M.a, M.d).toFixed(5)} scaleY=${Math.hypot(M.b, M.e).toFixed(5)}`);
console.log(`Residual (SVG units): mean=${mean.toFixed(3)} median=${median.toFixed(3)} p95=${p95.toFixed(3)} max=${res[res.length - 1].toFixed(3)}`);

// ── Transform the CAD ground-truth points we need ──
const pick = (re, layer) => ents.filter((e) => e.layer === (layer || e.layer) && (e.t === 'TEXT' || e.t === 'MTEXT') && re.test(e.text) && inBox(e.at));
const show = (label, e) => { const [X, Y] = T(e.at[0], e.at[1]); console.log(`  ${label}: CAD(${e.at[0].toFixed(0)},${e.at[1].toFixed(0)}) → SVG(${X.toFixed(1)}, ${Y.toFixed(1)})  "${e.text}"`); return { x: +X.toFixed(2), y: +Y.toFixed(2) }; };

console.log('\nKey points (CAD → SVG):');
const guarita = pick(/^GUARITA$/, 'IDENT_DAS_QUADRAS')[0];
const piscina = pick(/^PISCINA$/, 'IDENT_DAS_QUADRAS')[0];
const blocoAdm = pick(/^BLOCO ADM$/, 'IDENT_DAS_QUADRAS')[0];
const acesso = pick(/ACESSO DO CONDOM/, 'TEXTOS')[0];
const out = { M, residual: { mean, median, p95 }, points: {} };
if (guarita) out.points.portaria = show('GUARITA  (portaria)', guarita);
if (piscina) out.points.lazer = show('PISCINA  (lazer)   ', piscina);
if (blocoAdm) out.points.blocoAdm = show('BLOCO ADM          ', blocoAdm);
if (acesso) out.points.acesso = show('ACESSO CONDOMÍNIO  ', acesso);

// Green areas: in-situ "A ÁREA VERDE NN" labels (layer 0), inside copy 1, excluding the legend column (x≈4070).
const green = ents
  .filter((e) => (e.t === 'TEXT' || e.t === 'MTEXT') && /ÁREA VERDE\s*\d+/.test(e.text) && !/DESTINADA/.test(e.text) && inBox(e.at) && e.at[0] > 4090)
  .map((e) => ({ raw: e.text, n: (e.text.match(/(\d+)/) || [])[1], at: e.at }));
console.log(`\nGreen-area labels (in-situ): ${green.length}`);
out.greenAreas = green.map((g) => { const [X, Y] = T(g.at[0], g.at[1]); return { id: `area-verde-${g.n}`, label: `Área Verde ${g.n}`, x: +X.toFixed(2), y: +Y.toFixed(2) }; });
for (const g of out.greenAreas) console.log(`  ${g.id} → SVG(${g.x}, ${g.y})`);

writeFileSync(resolve(__dirname, '.cache/transform.json'), JSON.stringify(out, null, 2));
console.log('\nWrote .cache/transform.json');
