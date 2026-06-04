#!/usr/bin/env node
/**
 * validate-lots.mjs — Rotina de validação dos lotes do Alto Bellevue.
 *
 * Cruza as fontes de dados existentes e gera um relatório de consistência:
 *   - public/maps/alto-bellevue-lots.json   (fonte canônica recomendada — 383)
 *   - public/data/alto-bellevue-lots.json   (legado em uso pela view premium — 426)
 *   - public/data/alto-bellevue-prices.json (tabela comercial)
 *
 * Uso:
 *   node scripts/validate-lots.mjs            # relatório legível
 *   node scripts/validate-lots.mjs --json     # saída JSON (CI)
 *
 * Sai com código 1 se a fonte canônica tiver problemas estruturais
 * (duplicados, polígono inválido, total != esperado).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const EXPECTED_TOTAL = 383;

const asJson = process.argv.includes('--json');

function load(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

/** Converte "x,y x,y ..." em [[x,y], ...]. */
function pointsToPolygon(points) {
  if (!points || typeof points !== 'string') return [];
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(',').map(Number))
    .filter((p) => p.length === 2 && p.every(Number.isFinite));
}

/** Área (shoelace) — usada para detectar polígonos degenerados. */
function polygonArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function isValidPolygon(poly) {
  return Array.isArray(poly) && poly.length >= 3 && polygonArea(poly) > 0.5;
}

function tally(arr, keyFn) {
  const m = {};
  for (const x of arr) {
    const k = keyFn(x);
    m[k] = (m[k] || 0) + 1;
  }
  return m;
}

// ── Normalização das fontes para um shape comum ────────────────────────────────

function normalizeMaps(raw) {
  const lots = raw.lots || [];
  return {
    name: 'public/maps/alto-bellevue-lots.json',
    declaredTotal: raw.totalLots ?? null,
    hasUrbanContext: Boolean(
      (raw.streets && raw.streets.length) ||
        (raw.perimeter && raw.perimeter.length) ||
        (raw.streetLabels && raw.streetLabels.length),
    ),
    context: {
      streets: raw.streets?.length || 0,
      perimeter: raw.perimeter?.length || 0,
      streetLabels: raw.streetLabels?.length || 0,
      greenAreas: raw.greenAreas?.length || 0,
      amenities: raw.amenities?.length || 0,
    },
    lots: lots.map((l) => ({
      id: l.id ?? `${l.quadra}-${l.lote}`,
      quadra: l.quadra,
      lote: String(l.lote ?? l.lot_number),
      status: String(l.status ?? '').toUpperCase(),
      area: l.area ?? l.metragem ?? l.area_m2 ?? null,
      price: l.price ?? l.valor ?? null,
      polygon: pointsToPolygon(l.points),
    })),
  };
}

function normalizeData(raw) {
  return {
    name: 'public/data/alto-bellevue-lots.json',
    declaredTotal: null,
    hasUrbanContext: false,
    context: null,
    lots: raw.map((l) => ({
      id: l.id ?? `${l.quadra}-${l.lot_number}`,
      quadra: l.quadra,
      lote: String(l.lot_number),
      status: String(l.status ?? '').toUpperCase(),
      area: l.area_m2 ?? null,
      price: l.price ?? null,
      polygon: Array.isArray(l.polygon) ? l.polygon : [],
    })),
  };
}

// ── Análise de uma fonte ───────────────────────────────────────────────────────

function analyze(src) {
  const ids = src.lots.map((l) => l.id);
  const dupCounts = tally(src.lots, (l) => l.id);
  const duplicates = Object.entries(dupCounts)
    .filter(([, n]) => n > 1)
    .map(([id, n]) => ({ id, count: n }));

  const invalidPolygons = src.lots
    .filter((l) => !isValidPolygon(l.polygon))
    .map((l) => l.id);
  const missingStatus = src.lots.filter((l) => !l.status).map((l) => l.id);
  const missingArea = src.lots.filter((l) => l.area == null).map((l) => l.id);
  const missingPrice = src.lots.filter((l) => l.price == null).map((l) => l.id);

  return {
    name: src.name,
    declaredTotal: src.declaredTotal,
    hasUrbanContext: src.hasUrbanContext,
    context: src.context,
    total: src.lots.length,
    uniqueIds: new Set(ids).size,
    byQuadra: tally(src.lots, (l) => l.quadra),
    byStatus: tally(src.lots, (l) => l.status || 'SEM_STATUS'),
    duplicates,
    invalidPolygons,
    missingStatus,
    missingArea,
    missingPrice,
  };
}

// ── Execução ───────────────────────────────────────────────────────────────────

const maps = analyze(normalizeMaps(load('public/maps/alto-bellevue-lots.json')));
const data = analyze(normalizeData(load('public/data/alto-bellevue-lots.json')));
const prices = load('public/data/alto-bellevue-prices.json');
const priceKeys = new Set(
  prices.map((p) => `${p.quadra}-${String(parseInt(p.lote, 10)).padStart(2, '0')}`),
);

// Divergência planta canônica × tabela comercial
const canonicalKeys = new Set(
  normalizeMaps(load('public/maps/alto-bellevue-lots.json')).lots.map(
    (l) => `${l.quadra}-${String(parseInt(l.lote, 10)).padStart(2, '0')}`,
  ),
);
const inMapsNotPriced = [...canonicalKeys].filter((k) => !priceKeys.has(k));
const pricedNotInMaps = [...priceKeys].filter((k) => !canonicalKeys.has(k));

const canonicalOk =
  maps.total === EXPECTED_TOTAL &&
  maps.duplicates.length === 0 &&
  maps.invalidPolygons.length === 0;

const report = {
  expectedTotal: EXPECTED_TOTAL,
  canonical: maps,
  legacy: data,
  prices: { total: prices.length, inMapsNotPriced, pricedNotInMaps },
  canonicalOk,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(canonicalOk ? 0 : 1);
}

// ── Saída legível ──────────────────────────────────────────────────────────────

const line = (s = '') => console.log(s);
const list = (arr, max = 20) =>
  arr.length ? arr.slice(0, max).join(', ') + (arr.length > max ? ` … (+${arr.length - max})` : '') : '—';

function printSource(s) {
  line(`\n### ${s.name}`);
  line(`  Total de lotes:        ${s.total}${s.declaredTotal != null ? ` (declarado: ${s.declaredTotal})` : ''}`);
  line(`  IDs únicos:            ${s.uniqueIds}`);
  line(`  Contexto urbano:       ${s.hasUrbanContext ? 'SIM' : 'não'}${s.context ? ` (ruas ${s.context.streets}, perímetro ${s.context.perimeter}, labels ${s.context.streetLabels}, áreas verdes ${s.context.greenAreas}, amenities ${s.context.amenities})` : ''}`);
  line(`  Lotes por quadra:      ${Object.entries(s.byQuadra).sort().map(([q, n]) => `${q}:${n}`).join('  ')}`);
  line(`  Por status:            ${Object.entries(s.byStatus).map(([k, n]) => `${k}:${n}`).join('  ')}`);
  line(`  Duplicados (${s.duplicates.length}):       ${list(s.duplicates.map((d) => `${d.id}×${d.count}`))}`);
  line(`  Polígonos inválidos (${s.invalidPolygons.length}): ${list(s.invalidPolygons)}`);
  line(`  Sem status (${s.missingStatus.length}):       ${list(s.missingStatus)}`);
  line(`  Sem área (${s.missingArea.length}):         ${list(s.missingArea)}`);
  line(`  Sem preço (${s.missingPrice.length}):        ${list(s.missingPrice)}`);
}

line('═══════════════════════════════════════════════════════════════════');
line(' VALIDAÇÃO DE LOTES — ALTO BELLEVUE');
line(`  Total oficial esperado: ${EXPECTED_TOTAL}`);
line('═══════════════════════════════════════════════════════════════════');
printSource(maps);
printSource(data);
line('\n### Tabela comercial (public/data/alto-bellevue-prices.json)');
line(`  Entradas de preço:               ${prices.length}`);
line(`  Em planta canônica sem preço:    ${list(inMapsNotPriced)}`);
line(`  Com preço fora da planta:        ${list(pricedNotInMaps)}`);
line('\n───────────────────────────────────────────────────────────────────');
line(` RESULTADO: fonte canônica ${canonicalOk ? '✓ OK' : '✗ COM PROBLEMAS'} ` +
  `(esperado ${EXPECTED_TOTAL}, encontrado ${maps.total}, dup ${maps.duplicates.length}, poly inválido ${maps.invalidPolygons.length})`);
line('───────────────────────────────────────────────────────────────────');

process.exit(canonicalOk ? 0 : 1);
