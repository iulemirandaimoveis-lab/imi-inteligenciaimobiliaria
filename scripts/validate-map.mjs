#!/usr/bin/env node
/**
 * validate-map.mjs — Validação estrutural do MAPA do Alto Bellevue (Etapa 15).
 *
 * Complementa `validate-lots.mjs` (que cobre lotes/contenção/preços). Aqui o foco é
 * a camada de MAPA + ÁREAS COMUNS + ALCANCE DE MÍDIA — os pontos levantados na
 * auditoria estrutural (docs/alto-bellevue/AUDITORIA_ESTRUTURAL_DIGITAL_TWIN.md):
 *
 *   1. Integridade estrutural do JSON canônico (viewBox, lotes, ruas, perímetro…).
 *   2. Limites de coordenadas (tudo dentro do viewBox).
 *   3. Integridade das áreas comuns (ids únicos, dentro do perímetro, sem duplicar
 *      posição — detecta amenities "empilhadas"/aproximadas).
 *   4. Alcance de mídia: todo slot editável no backoffice precisa ter um alvo
 *      clicável no mapa (detecta slots órfãos, ex.: `capela`).
 *   5. Cobertura dos equipamentos oficiais da planta (progresso rumo ao Digital Twin).
 *
 * Uso:
 *   node scripts/validate-map.mjs            # relatório legível
 *   node scripts/validate-map.mjs --json     # saída JSON (CI)
 *
 * Semântica de saída:
 *   - ERROS  → estruturais (quebram o mapa). Saída 1.
 *   - AVISOS → pendências conhecidas do roadmap (cluster/órfão/cobertura). Saída 0.
 *   Use --strict para tratar avisos como erros.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const asJson = process.argv.includes('--json');
const strict = process.argv.includes('--strict');

const VIEWBOX = { w: 1200, h: 821.86 };
const EXPECTED_TOTAL = 383;

// Slots editáveis no backoffice (espelha AREA_META em
// src/app/(backoffice)/backoffice/imoveis/[id]/mapa/page.tsx). Cada um precisa de
// um alvo clicável no mapa, senão a mídia enviada "não aparece" (slot órfão).
const BACKOFFICE_SLOTS = [
  'portaria', 'lazer', 'coworking',
  'recreativa-01', 'recreativa-02', 'recreativa-03',
  'area-verde', 'capela',
];

// Equipamentos oficiais da planta aprovada (lista "Equipamentos"). Acompanha o
// progresso de mapeamento — NÃO é gate (a maioria ainda não tem geometria própria).
const OFFICIAL_EQUIPMENTS = [
  'Pórtico de Acesso', 'Guarita', 'Acessos Sociais', 'Acesso de Serviço',
  'Prédio Administrativo', 'Quadra Poliesportiva', 'Quadras de Areia', 'Quadra Society',
  'Capela', 'Marco e Mirante', 'Piscina coberta aquecida', 'Piscina descoberta',
  'Vestiários', 'Espaço Grill', 'Fire Pit', 'Espaço Gourmet', 'Espaço Fit (Academia)',
  'Salão de Festas (200 pessoas)', 'Coworking', 'Pista de Cooper',
];

function load(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function pointsToPolygon(points) {
  if (!points || typeof points !== 'string') return [];
  return points.trim().split(/\s+/)
    .map((pair) => pair.split(',').map(Number))
    .filter((p) => p.length === 2 && p.every(Number.isFinite));
}

function polygonArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function pointInPolygon(pt, poly) {
  if (!pt || !Array.isArray(poly) || poly.length < 3) return false;
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const inBounds = (x, y, pad = 1) =>
  Number.isFinite(x) && Number.isFinite(y) &&
  x >= -pad && x <= VIEWBOX.w + pad && y >= -pad && y <= VIEWBOX.h + pad;

// ── Carrega fonte canônica ──────────────────────────────────────────────────────
const raw = load('public/maps/alto-bellevue-lots.json');
const errors = [];
const warnings = [];
const info = {};

// ── 1. Estrutura ──────────────────────────────────────────────────────────────
const lots = Array.isArray(raw.lots) ? raw.lots : [];
const streets = Array.isArray(raw.streets) ? raw.streets : [];
const amenities = Array.isArray(raw.amenities) ? raw.amenities : [];
const greenAreas = Array.isArray(raw.greenAreas) ? raw.greenAreas : [];

if (!raw.viewBox) errors.push('viewBox ausente na fonte canônica');
if (lots.length !== EXPECTED_TOTAL)
  errors.push(`total de lotes ${lots.length} ≠ esperado ${EXPECTED_TOTAL}`);
if (streets.length === 0) errors.push('nenhuma rua (streets) na fonte canônica');
if (amenities.length === 0) errors.push('nenhuma área comum (amenities) na fonte canônica');

const perimeterRings = (raw.perimeter || [])
  .map(pointsToPolygon).filter((p) => p.length >= 3)
  .sort((a, b) => polygonArea(b) - polygonArea(a));
const perimeter = perimeterRings[0] || [];
if (!perimeter.length) errors.push('perímetro oficial ausente — contenção não verificável');

info.structure = {
  lots: lots.length, streets: streets.length, amenities: amenities.length,
  greenAreas: greenAreas.length, perimeterVertices: perimeter.length,
};

// ── 2. Limites de coordenadas ───────────────────────────────────────────────────
const oob = [];
for (const a of amenities) if (!inBounds(a.x, a.y)) oob.push(`amenity:${a.id}@${a.x},${a.y}`);
for (const g of greenAreas) if (!inBounds(g.x, g.y)) oob.push(`green:${g.id}@${g.x},${g.y}`);
if (oob.length) errors.push(`${oob.length} ponto(s) fora do viewBox: ${oob.slice(0, 10).join(', ')}`);

// ── 3. Integridade das áreas comuns ─────────────────────────────────────────────
const amenityIds = amenities.map((a) => a.id);
const dupIds = amenityIds.filter((id, i) => amenityIds.indexOf(id) !== i);
if (dupIds.length) errors.push(`ids de amenity duplicados: ${[...new Set(dupIds)].join(', ')}`);

for (const a of amenities) {
  if (!a.label || !String(a.label).trim()) errors.push(`amenity ${a.id} sem label`);
  if (perimeter.length && !pointInPolygon([a.x, a.y], perimeter))
    warnings.push(`amenity "${a.id}" fora do perímetro (@${a.x},${a.y}) — posição provavelmente aproximada`);
}

// Detecta amenities "empilhadas" (posições quase idênticas → não georreferenciadas).
const clusters = [];
for (let i = 0; i < amenities.length; i++) {
  for (let j = i + 1; j < amenities.length; j++) {
    const d = Math.hypot(amenities[i].x - amenities[j].x, amenities[i].y - amenities[j].y);
    if (d < 12) clusters.push(`${amenities[i].id}↔${amenities[j].id} (${d.toFixed(1)}u)`);
  }
}
if (clusters.length)
  warnings.push(`${clusters.length} par(es) de amenities quase sobrepostas (posição aproximada): ${clusters.join(', ')}`);

// ── 4. Alcance de mídia: todo slot do backoffice precisa de alvo clicável ────────
// Alvos clicáveis: ids de amenity (exato ou por prefixo) + 'area-verde' (greenAreas
// são clicáveis com id 'area-verde' no PlanView).
const clickableIds = new Set(amenityIds);
if (greenAreas.length) clickableIds.add('area-verde');
const reachable = (slot) =>
  clickableIds.has(slot) || amenityIds.some((id) => id.replace(/-\d+$/, '') === slot.replace(/-\d+$/, ''));

const orphanSlots = BACKOFFICE_SLOTS.filter((s) => !reachable(s));
if (orphanSlots.length)
  warnings.push(`slot(s) de backoffice SEM alvo clicável no mapa (mídia não aparece): ${orphanSlots.join(', ')}`);
info.mediaReach = { backofficeSlots: BACKOFFICE_SLOTS.length, orphanSlots };

// ── 5. Cobertura dos equipamentos oficiais ───────────────────────────────────────
// Heurística: um equipamento é "mapeado" se há amenity cujo label/id remete a ele.
const haystack = amenities.map((a) => `${a.id} ${a.label}`.toLowerCase()).join(' | ');
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const KEY = { 'Coworking': 'coworking', 'Guarita': 'portaria', 'Pórtico de Acesso': 'portaria' };
const mapped = OFFICIAL_EQUIPMENTS.filter((e) => {
  const k = norm(KEY[e] || e.split('(')[0].trim().split(' ')[0]);
  return norm(haystack).includes(k);
});
const unmapped = OFFICIAL_EQUIPMENTS.filter((e) => !mapped.includes(e));
info.equipmentCoverage = {
  total: OFFICIAL_EQUIPMENTS.length, mapped: mapped.length, unmapped,
  pct: Math.round((mapped.length / OFFICIAL_EQUIPMENTS.length) * 100),
};
if (unmapped.length)
  warnings.push(`${unmapped.length}/${OFFICIAL_EQUIPMENTS.length} equipamentos oficiais sem ponto próprio no mapa (Sprint 3): ${unmapped.join(', ')}`);

// ── Resultado ─────────────────────────────────────────────────────────────────
const ok = errors.length === 0 && (!strict || warnings.length === 0);
const report = { ok, errors, warnings, info };

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(ok ? 0 : 1);
}

const line = (s = '') => console.log(s);
line('═══════════════════════════════════════════════════════════════════');
line(' VALIDAÇÃO DO MAPA — ALTO BELLEVUE (camada mapa/áreas comuns/mídia)');
line('═══════════════════════════════════════════════════════════════════');
line(`\n### Estrutura`);
line(`  Lotes ${info.structure.lots} · Ruas ${info.structure.streets} · Amenities ${info.structure.amenities} · Áreas verdes ${info.structure.greenAreas} · Perímetro ${info.structure.perimeterVertices}v`);
line(`\n### Alcance de mídia (backoffice → mapa)`);
line(`  Slots editáveis: ${info.mediaReach.backofficeSlots} · Órfãos: ${info.mediaReach.orphanSlots.length ? info.mediaReach.orphanSlots.join(', ') : '—'}`);
line(`\n### Cobertura dos equipamentos oficiais`);
line(`  Mapeados: ${info.equipmentCoverage.mapped}/${info.equipmentCoverage.total} (${info.equipmentCoverage.pct}%)`);
line(`  Sem ponto: ${info.equipmentCoverage.unmapped.join(', ') || '—'}`);

line(`\n### Erros (${errors.length})`);
errors.forEach((e) => line(`  ✗ ${e}`));
if (!errors.length) line('  —');
line(`\n### Avisos (${warnings.length})  [pendências do roadmap — não bloqueiam]`);
warnings.forEach((w) => line(`  ⚠ ${w}`));
if (!warnings.length) line('  —');

line('\n───────────────────────────────────────────────────────────────────');
line(` RESULTADO: ${ok ? '✓ OK' : '✗ COM PROBLEMAS'}  (erros ${errors.length}, avisos ${warnings.length}${strict ? ', strict' : ''})`);
line('───────────────────────────────────────────────────────────────────');

process.exit(ok ? 0 : 1);
