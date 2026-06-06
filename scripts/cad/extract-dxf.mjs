#!/usr/bin/env node
/**
 * extract-dxf.mjs — Streaming DXF → compact JSON extractor (CAD space).
 *
 * Reads the official Alto Bellevue parcelling DXF (≈185 MB / 21 M lines) line by
 * line and emits ONLY the entities we care about, in raw CAD coordinates. This is
 * step 1 of the CAD pipeline; step 2 (build-lots) applies the affine transform to
 * the SVG viewBox and reconciles the commercial layer.
 *
 * Why streaming: the file is far too large to hold in memory. We buffer one entity
 * at a time and discard everything on noise layers (e.g. MDT1_CURVAS contour lines,
 * which are ~95 % of the file) the moment we read their layer code.
 *
 * Usage:
 *   node scripts/cad/extract-dxf.mjs "/path/to/PLANTA ... .dxf"
 *   AB_DXF="/path/to.dxf" node scripts/cad/extract-dxf.mjs
 *
 * Output: scripts/cad/.cache/cad-entities.json  (gitignored — derived artifact)
 */
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '.cache/cad-entities.json');

const DXF_PATH = process.argv[2] || process.env.AB_DXF;
if (!DXF_PATH) {
  console.error('Usage: node scripts/cad/extract-dxf.mjs <path-to.dxf>');
  process.exit(1);
}

// Layers that carry subdivision geometry/text we want to keep. Everything else
// (contours, PDF underlay, hatFill noise) is dropped as soon as code 8 is read.
const TARGET_LAYERS = new Set([
  'POLIGONAL',            // perimeter (boundary survey)
  'REGIAO_LOTES',         // lot polygons (primary)
  'DB2 LOTES',            // lot polygons (fallback)
  'DB2 LIMITE DO LOTE',   // lot boundary
  'DB2 QUADRAS',          // quadra (block) polygons
  'IDENT_DAS_QUADRAS',    // quadra letter labels
  'NUMERO_DOS_LOTES',     // lot-number text
  'AREA_DOS_LOTES',       // lot-area (m²) text
  'COTAS_DOS_LOTES',      // lot dimension text/lines
  'DB2_NOME_DAS_RUAS',    // street-name text
  'DB2 LINHA DA BR',      // BR-423 highway line
  'DB2_CALCADA',          // sidewalks
  'DB2_FAIXA_DE_DOMINIO', // right-of-way strip
  'DB2 CONFRONTANTES',    // abutters
  'DB2_ANTENA',           // antenna / utility block
  'TEXTOS',               // misc text (may hold amenity labels)
  'ROSA_DOS_VENTOS',      // north arrow (orientation check)
]);

// Entity types we know how to extract. TEXT/MTEXT/INSERT are captured on ANY
// layer (cheap, ~8K total) so we never miss an amenity/portaria label.
const GEOM_TYPES = new Set([
  'LWPOLYLINE', 'LINE', 'TEXT', 'MTEXT', 'INSERT',
  'POINT', 'CIRCLE', 'ARC', 'SOLID',
]);
const ALWAYS_TYPES = new Set(['TEXT', 'MTEXT', 'INSERT']);

const out = [];
let section = null;        // current SECTION name (code 2 after "SECTION")
let pendingSectionName = false;

// Current entity buffer.
let curType = null;
let curLayer = null;
let pairs = [];            // [[code, value], …] for the current entity
let skip = false;          // true once we know this entity is on a noise layer
let expectSectionName = false;

function finalize() {
  if (!curType) return;
  if (curType === 'SECTION') { expectSectionName = true; pairs = []; curType = null; return; }
  if (curType === 'ENDSEC') { section = null; }
  const keepable = GEOM_TYPES.has(curType);
  if (keepable) {
    const onTarget = curLayer != null && TARGET_LAYERS.has(curLayer);
    const always = ALWAYS_TYPES.has(curType);
    if (onTarget || always) {
      const ent = extract(curType, curLayer, pairs);
      if (ent) { ent.section = section; out.push(ent); }
    }
  }
  curType = null; curLayer = null; pairs = []; skip = false;
}

function get(pairs, code) {
  for (const [c, v] of pairs) if (c === code) return v;
  return undefined;
}
function num(v, d = undefined) { const n = Number(v); return Number.isFinite(n) ? n : d; }

function extract(type, layer, pairs) {
  switch (type) {
    case 'LWPOLYLINE': {
      const pts = [];
      let cur = null;
      for (const [c, v] of pairs) {
        if (c === 10) { cur = [num(v), 0]; pts.push(cur); }
        else if (c === 20 && cur) cur[1] = num(v);
      }
      if (pts.length < 2) return null;
      const flag = num(get(pairs, 70), 0) || 0;
      return { t: 'POLY', layer, closed: (flag & 1) === 1, pts };
    }
    case 'LINE': {
      const a = [num(get(pairs, 10)), num(get(pairs, 20))];
      const b = [num(get(pairs, 11)), num(get(pairs, 21))];
      if (![...a, ...b].every(Number.isFinite)) return null;
      return { t: 'LINE', layer, a, b };
    }
    case 'TEXT': {
      const at = [num(get(pairs, 10)), num(get(pairs, 20))];
      return {
        t: 'TEXT', layer, text: cleanText(String(get(pairs, 1) ?? '')),
        at, h: num(get(pairs, 40)), rot: num(get(pairs, 50), 0),
        align: [num(get(pairs, 11)), num(get(pairs, 21))], // alignment point (if any)
      };
    }
    case 'MTEXT': {
      // MTEXT splits long text across code 3 (continuations) + final code 1.
      let text = '';
      for (const [c, v] of pairs) if (c === 3 || c === 1) text += v;
      return {
        t: 'MTEXT', layer, text: cleanMText(text),
        at: [num(get(pairs, 10)), num(get(pairs, 20))], h: num(get(pairs, 40)),
        rot: num(get(pairs, 50), 0),
      };
    }
    case 'INSERT':
      return {
        t: 'INSERT', layer, name: String(get(pairs, 2) ?? '').trim(),
        at: [num(get(pairs, 10)), num(get(pairs, 20))], rot: num(get(pairs, 50), 0),
        sx: num(get(pairs, 41), 1), sy: num(get(pairs, 42), 1),
      };
    case 'POINT':
      return { t: 'POINT', layer, at: [num(get(pairs, 10)), num(get(pairs, 20))] };
    case 'CIRCLE':
      return { t: 'CIRCLE', layer, c: [num(get(pairs, 10)), num(get(pairs, 20))], r: num(get(pairs, 40)) };
    case 'ARC':
      return {
        t: 'ARC', layer, c: [num(get(pairs, 10)), num(get(pairs, 20))], r: num(get(pairs, 40)),
        a0: num(get(pairs, 50)), a1: num(get(pairs, 51)),
      };
    case 'SOLID': {
      const corners = [[10, 20], [11, 21], [12, 22], [13, 23]]
        .map(([cx, cy]) => [num(get(pairs, cx)), num(get(pairs, cy))])
        .filter((p) => p.every(Number.isFinite));
      if (corners.length < 3) return null;
      return { t: 'SOLID', layer, pts: corners };
    }
    default:
      return null;
  }
}

function cleanText(s) {
  // TEXT values can carry embedded CR/LF and DXF caret-escapes; normalise to one line.
  return s.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanMText(s) {
  // Strip the most common MTEXT formatting codes so labels read cleanly.
  return s
    .replace(/\\P/g, ' ')
    .replace(/\\[A-Za-z][^;]*;/g, '')
    .replace(/[{}]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// DXF $DWGCODEPAGE is ANSI_1252 (Windows Latin-1). Read as latin1 so Portuguese
// accents in street/amenity names (IPÊS, ACÁCIAS, ORQUÍDEAS…) decode correctly.
const rl = createInterface({ input: createReadStream(DXF_PATH, { encoding: 'latin1' }), crlfDelay: Infinity });

let lineNo = 0;
let code = null; // pending group code awaiting its value line

rl.on('line', (raw) => {
  const line = raw.replace(/\r$/, '');
  lineNo++;
  if (code === null) {
    code = parseInt(line.trim(), 10);
    return;
  }
  const value = line; // do NOT trim — preserve text content; trim where needed
  const c = code;
  code = null;

  // Section tracking.
  if (expectSectionName && c === 2) { section = value.trim(); expectSectionName = false; }

  if (c === 0) {
    finalize();
    curType = value.trim();
    if (curType === 'SECTION') expectSectionName = true;
    return;
  }
  if (skip) return;
  if (c === 8) {
    curLayer = value.trim();
    // Drop noise entities early — but never drop TEXT/MTEXT/INSERT (cheap + useful).
    if (!ALWAYS_TYPES.has(curType) && !TARGET_LAYERS.has(curLayer)) { skip = true; pairs = []; return; }
  }
  pairs.push([c, c === 1 || c === 2 || c === 3 || c === 7 ? value : value.trim()]);
});

rl.on('close', () => {
  finalize();
  mkdirSync(dirname(OUT), { recursive: true });

  // Summaries for sanity.
  const byLayer = {};
  const byType = {};
  for (const e of out) {
    byLayer[e.layer] = (byLayer[e.layer] || 0) + 1;
    byType[e.t] = (byType[e.t] || 0) + 1;
  }
  writeFileSync(OUT, JSON.stringify({ source: DXF_PATH, lines: lineNo, count: out.length, byType, byLayer, entities: out }));
  console.log(`Read ${lineNo.toLocaleString()} lines. Kept ${out.length} entities.`);
  console.log('By type:', byType);
  console.log('By layer:', byLayer);
  console.log('Wrote', OUT);
});
