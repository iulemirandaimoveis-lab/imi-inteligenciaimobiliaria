#!/usr/bin/env node
/**
 * copy-analysis.mjs — isolate ONE copy of the subdivision and profile it.
 * The sheet holds 3 translated copies; we use copy 1 ("SEM TOPOGRAFIA", top-right).
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { entities: ents } = JSON.parse(readFileSync(resolve(__dirname, '.cache/cad-entities.json'), 'utf8'));

// Copy 1 window (top-right). Separates cleanly from copy 2 (x<3700) and copy 3 (y<600).
const C1 = { minX: 3900, maxX: 5200, minY: 850, maxY: 2500 };
const inC1 = (p) => p[0] >= C1.minX && p[0] <= C1.maxX && p[1] >= C1.minY && p[1] <= C1.maxY;
const entIn = (e) => {
  if (e.t === 'POLY' || e.t === 'SOLID') return e.pts.some(inC1);
  if (e.t === 'LINE') return inC1(e.a) || inC1(e.b);
  if (e.t === 'TEXT' || e.t === 'MTEXT' || e.t === 'INSERT' || e.t === 'POINT') return inC1(e.at);
  if (e.t === 'CIRCLE' || e.t === 'ARC') return inC1(e.c);
  return false;
};

function bbox(points) {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const [x, y] of points) { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }
  return { minX: a, minY: b, maxX: c, maxY: d, w: c - a, h: d - b };
}
const shoelace = (pts) => {
  let s = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; s += x1 * y2 - x2 * y1; }
  return Math.abs(s) / 2;
};

const c1 = ents.filter(entIn);
console.log(`Copy-1 entities: ${c1.length}`);

// ── Lot polygons in copy 1 ──
const regiao = c1.filter((e) => e.layer === 'REGIAO_LOTES' && e.t === 'POLY' && e.closed);
const db2lotes = c1.filter((e) => e.layer === 'DB2 LOTES' && e.t === 'POLY' && e.closed);
console.log(`REGIAO_LOTES closed polys in C1: ${regiao.length}`);
console.log(`DB2 LOTES closed polys in C1: ${db2lotes.length}`);
const allLotPolys = [...regiao, ...db2lotes];
const lotBB = bbox(allLotPolys.flatMap((p) => p.pts));
console.log(`lot polys bbox: [${lotBB.minX.toFixed(0)},${lotBB.minY.toFixed(0)} → ${lotBB.maxX.toFixed(0)},${lotBB.maxY.toFixed(0)}] w=${lotBB.w.toFixed(0)} h=${lotBB.h.toFixed(0)}`);

// ── Perimeter candidate: largest-area closed polygon in copy 1 ──
const closedPolys = c1.filter((e) => e.t === 'POLY' && e.closed);
const ranked = closedPolys
  .map((p) => ({ layer: p.layer, n: p.pts.length, area: shoelace(p.pts), bb: bbox(p.pts), pts: p.pts }))
  .sort((a, b) => b.area - a.area);
console.log('\nTop 8 largest closed polygons in C1 (perimeter candidates):');
for (const r of ranked.slice(0, 8)) {
  console.log(`  [${r.layer}] verts=${r.n} area=${r.area.toFixed(0)} bbox=[${r.bb.minX.toFixed(0)},${r.bb.minY.toFixed(0)} → ${r.bb.maxX.toFixed(0)},${r.bb.maxY.toFixed(0)}] w=${r.bb.w.toFixed(0)} h=${r.bb.h.toFixed(0)}`);
}

// ── Quadra letters in copy 1 ──
const quad = c1.filter((e) => e.layer === 'IDENT_DAS_QUADRAS' && (e.t === 'TEXT' || e.t === 'MTEXT'));
console.log('\nQuadra/amenity labels in C1 (IDENT_DAS_QUADRAS):');
for (const q of quad) console.log(`  "${q.text}" @ [${q.at[0].toFixed(0)}, ${q.at[1].toFixed(0)}] h=${q.h}`);

// ── Lot-number texts per region (count) ──
const nums = c1.filter((e) => e.layer === 'NUMERO_DOS_LOTES' && (e.t === 'TEXT' || e.t === 'MTEXT'));
console.log(`\nNUMERO_DOS_LOTES texts in C1: ${nums.length}`);
const areas = c1.filter((e) => e.layer === 'AREA_DOS_LOTES' && (e.t === 'TEXT' || e.t === 'MTEXT'));
console.log(`AREA_DOS_LOTES texts in C1: ${areas.length}`);

// ── Amenities in copy 1 ──
console.log('\nAmenity labels in C1:');
const KEY = /GUARITA|PISCINA|PORTARIA|LAZER|CLUBE|ACESSO|ÁREA VERDE|PRA[ÇC]A|VIA LOCAL/i;
for (const e of c1.filter((e) => (e.t === 'TEXT' || e.t === 'MTEXT') && KEY.test(e.text || ''))) {
  console.log(`  [${e.layer}] "${e.text}" @ [${e.at[0].toFixed(0)}, ${e.at[1].toFixed(0)}]`);
}

// ── Distinct street names (all copies, accents fixed) ──
console.log('\nDistinct street names (DB2_NOME_DAS_RUAS, all copies):');
const streets = ents.filter((e) => e.layer === 'DB2_NOME_DAS_RUAS' && (e.t === 'TEXT' || e.t === 'MTEXT'));
const distinct = [...new Set(streets.map((s) => s.text))].sort();
for (const s of distinct) console.log(`  ${s}`);
