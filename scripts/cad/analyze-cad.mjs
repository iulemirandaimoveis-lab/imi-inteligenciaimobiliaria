#!/usr/bin/env node
/**
 * analyze-cad.mjs — Diagnostic report over the extracted CAD entities.
 * Read-only: helps us understand the official geometry before regenerating data.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(resolve(__dirname, '.cache/cad-entities.json'), 'utf8'));
const ents = data.entities;

const byLayer = (layer, t) => ents.filter((e) => e.layer === layer && (!t || e.t === t));
function bbox(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x; if (y < minY) minY = y;
    if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}
const shoelace = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
};

console.log('═══ POLIGONAL (perimeter) ═══');
for (const e of byLayer('POLIGONAL')) {
  if (e.t === 'POLY') {
    const bb = bbox(e.pts);
    console.log(`POLY closed=${e.closed} pts=${e.pts.length} area=${shoelace(e.pts).toFixed(0)} bbox=[${bb.minX.toFixed(1)},${bb.minY.toFixed(1)} → ${bb.maxX.toFixed(1)},${bb.maxY.toFixed(1)}] w=${bb.w.toFixed(1)} h=${bb.h.toFixed(1)}`);
  } else {
    console.log(`${e.t} layer=${e.layer}`, JSON.stringify(e).slice(0, 120));
  }
}

console.log('\n═══ LOT POLYGON LAYERS ═══');
for (const layer of ['REGIAO_LOTES', 'DB2 LOTES', 'DB2 QUADRAS', 'DB2 LIMITE DO LOTE']) {
  const polys = byLayer(layer, 'POLY');
  const closed = polys.filter((p) => p.closed);
  const lines = byLayer(layer, 'LINE');
  const vtxHist = {};
  for (const p of closed) vtxHist[p.pts.length] = (vtxHist[p.pts.length] || 0) + 1;
  const allPts = polys.flatMap((p) => p.pts);
  const bb = allPts.length ? bbox(allPts) : null;
  console.log(`${layer}: POLY=${polys.length} (closed=${closed.length}) LINE=${lines.length}` +
    (bb ? ` bbox=[${bb.minX.toFixed(0)},${bb.minY.toFixed(0)} → ${bb.maxX.toFixed(0)},${bb.maxY.toFixed(0)}]` : ''));
  console.log(`   vertex-count histogram (closed):`, vtxHist);
}

console.log('\n═══ LOT-NUMBER TEXT (NUMERO_DOS_LOTES) ═══');
const numTexts = byLayer('NUMERO_DOS_LOTES').filter((e) => e.t === 'TEXT' || e.t === 'MTEXT');
console.log(`count=${numTexts.length}`);
console.log('samples:', numTexts.slice(0, 25).map((t) => t.text).join(' | '));
// distinct text values
const distinctNums = [...new Set(numTexts.map((t) => t.text))].sort();
console.log(`distinct values=${distinctNums.length}`);
console.log('first 40 distinct:', distinctNums.slice(0, 40).join(' '));

console.log('\n═══ AREA TEXT (AREA_DOS_LOTES) ═══');
const areaTexts = byLayer('AREA_DOS_LOTES').filter((e) => e.t === 'TEXT' || e.t === 'MTEXT');
console.log(`count=${areaTexts.length}; samples:`, areaTexts.slice(0, 15).map((t) => t.text).join(' | '));

console.log('\n═══ QUADRA IDENTIFIERS (IDENT_DAS_QUADRAS) ═══');
const quadTexts = byLayer('IDENT_DAS_QUADRAS').filter((e) => e.t === 'TEXT' || e.t === 'MTEXT');
console.log(`count=${quadTexts.length}`);
for (const q of quadTexts.filter((t) => t.text && t.text.length <= 6)) {
  console.log(`   "${q.text}" @ [${q.at[0].toFixed(0)}, ${q.at[1].toFixed(0)}] h=${q.h}`);
}

console.log('\n═══ STREET NAMES (DB2_NOME_DAS_RUAS) ═══');
const streetTexts = byLayer('DB2_NOME_DAS_RUAS').filter((e) => e.t === 'TEXT' || e.t === 'MTEXT');
console.log(`count=${streetTexts.length}`);
for (const s of streetTexts) {
  console.log(`   "${s.text}" @ [${s.at[0].toFixed(0)}, ${s.at[1].toFixed(0)}] rot=${(s.rot || 0).toFixed(0)}`);
}

console.log('\n═══ AMENITY / PORTARIA HUNT ═══');
const KEY = /PORTARIA|GUARITA|LAZER|CLUBE|PORT[ÃA]O|ACESSO|RESERVA|VERDE|INSTITU|ESPA[ÇC]O|SISTEMA|EQUIPAMENT|MUNICIP|APP|PRA[ÇC]A|PISCINA|QUADRA POLI|SAL[ÃA]O|ADMIN/i;
const hits = ents.filter((e) => (e.t === 'TEXT' || e.t === 'MTEXT') && KEY.test(e.text || ''));
for (const h of hits.slice(0, 50)) {
  console.log(`   [${h.layer}] "${h.text}" @ [${h.at[0].toFixed(0)}, ${h.at[1].toFixed(0)}]`);
}
console.log(`(total amenity-keyword text hits: ${hits.length})`);

console.log('\n═══ INSERT BLOCKS ═══');
for (const e of ents.filter((e) => e.t === 'INSERT')) {
  console.log(`   block="${e.name}" layer=${e.layer} @ [${e.at[0].toFixed(0)}, ${e.at[1].toFixed(0)}] rot=${e.rot}`);
}
