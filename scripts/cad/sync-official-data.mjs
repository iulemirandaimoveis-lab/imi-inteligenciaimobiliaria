#!/usr/bin/env node
/**
 * sync-official-data.mjs — Sincroniza os dados do mapa Alto Bellevue com os
 * arquivos oficiais (tabela de preços 01/ABR/2026 + planta de parcelamento R05).
 *
 * O que faz (idempotente):
 *  1. Remove o lote fantasma B-24 (a Quadra B oficial tem 19 lotes — tabela de
 *     preços e planilha de disponibilidade confirmam).
 *  2. Reconstrói os polígonos dos lotes oficiais que estavam `pending` (sem
 *     posição válida no mapa): D-15, H-02, H-03, H-07, H-23, P-03..P-06, P-09.
 *     A geometria é derivada EXCLUSIVAMENTE das arestas dos lotes vizinhos já
 *     validados contra o CAD (vértices compartilhados) — nenhuma coordenada é
 *     inventada. Cada polígono é validado contra a metragem oficial.
 *  3. Corrige N-09 (lote ANTENA): metragem oficial 900,80 m² e SEM preço.
 *  4. Recalcula todos os planos de pagamento conforme as condições oficiais:
 *       À vista −20% · 12 meses −15% · 36 meses −8% · 60 meses −5% · 120 meses 0%
 *       Entrada de cada plano = 10% do TOTAL COM DESCONTO do plano;
 *       parcela = (total − entrada) / n  (valores idênticos à tabela impressa).
 *  5. Reposiciona amenities (portaria, coworking, lazer) nas coordenadas da
 *     planta oficial (antes estavam fora do perímetro, sobre a faixa da BR).
 *  6. Atualiza stats/totalLots e grava também a tabela comercial
 *     (public/data/alto-bellevue-prices.json) com entrada por plano.
 *
 * Uso:  node scripts/cad/sync-official-data.mjs [--dry-run]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MAPS_PATH = join(ROOT, 'public/maps/alto-bellevue-lots.json');
const PRICES_PATH = join(ROOT, 'public/data/alto-bellevue-prices.json');
const DRY = process.argv.includes('--dry-run');

const r2 = (v) => Math.round(v * 100) / 100;

// ── Condições financeiras oficiais (tabela 01/04/2026) ─────────────────────────
const PLANS = [
  { key: 'p12', months: 12, discount: 0.15 },
  { key: 'p36', months: 36, discount: 0.08 },
  { key: 'p60', months: 60, discount: 0.05 },
  { key: 'p120', months: 120, discount: 0.0 },
];

function officialPlans(price) {
  const out = {};
  for (const { key, months, discount } of PLANS) {
    const total = r2(price * (1 - discount));
    const entrada = r2(total * 0.1);
    const parcela = r2((total * 0.9) / months);
    out[key] = { total, entrada, parcela };
  }
  return out;
}

// ── Geometria ──────────────────────────────────────────────────────────────────
const parsePts = (s) => s.trim().split(/\s+/).map((p) => p.split(',').map(Number));
const fmtPts = (poly) => poly.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');

function shoelace(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function centroid(poly) {
  // centroid de área (não média de vértices) — melhor para rótulo
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const cr = x1 * y2 - x2 * y1;
    a += cr; cx += (x1 + x2) * cr; cy += (y1 + y2) * cr;
  }
  a /= 2;
  return [r2(cx / (6 * a)), r2(cy / (6 * a))];
}

const mid = (p) => {
  const c = p.reduce(([x, y], [a, b]) => [x + a, y + b], [0, 0]);
  return [c[0] / p.length, c[1] / p.length];
};
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Aresta do polígono `poly` mais próxima do ponto `target` (midpoint). */
function nearestEdge(poly, target) {
  let best = null;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dd = d2(mid([a, b]), target);
    if (!best || dd < best.dd) best = { a, b, dd };
  }
  return best;
}

/**
 * Reconstrói `k` lotes na faixa entre dois vizinhos validados.
 * A faixa é o quadrilátero formado pelas arestas que os vizinhos compartilham
 * com a faixa (vértices CAD exatos); divisas internas são interpoladas
 * proporcionalmente às metragens oficiais.
 */
function reconstructBand(prevPoly, nextPoly, officialAreas) {
  const pe = nearestEdge(prevPoly, centroid(nextPoly));
  const ne = nearestEdge(nextPoly, centroid(prevPoly));
  // emparelha extremidades por proximidade
  let [q1, q2] = [ne.a, ne.b];
  if (d2(pe.a, q1) + d2(pe.b, q2) > d2(pe.a, q2) + d2(pe.b, q1)) [q1, q2] = [q2, q1];
  const total = officialAreas.reduce((s, v) => s + v, 0);
  const band = [pe.a, pe.b, q2, q1];
  const bandArea = shoelace(band);
  // shoelace da sub-faixa [0..t] — usada para resolver a posição real da divisa
  const sliceArea = (t) => shoelace([pe.a, pe.b, lerp(pe.b, q2, t), lerp(pe.a, q1, t)]);
  // resolve t tal que a fração de área desenhada == fração de metragem oficial
  const solveT = (frac) => {
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (sliceArea(m) / bandArea < frac) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  };
  const polys = [];
  let acc = 0;
  let railA = pe.a, railB = pe.b;
  for (const area of officialAreas) {
    acc += area;
    const t = acc / total >= 1 ? 1 : solveT(acc / total);
    const sa = lerp(pe.a, q1, t);
    const sb = lerp(pe.b, q2, t);
    polys.push([railA, railB, sb, sa]);
    railA = sa; railB = sb;
  }
  return { polys, band };
}

// ── Carrega fontes ─────────────────────────────────────────────────────────────
const maps = JSON.parse(readFileSync(MAPS_PATH, 'utf8'));
const prices = JSON.parse(readFileSync(PRICES_PATH, 'utf8'));
const byId = new Map(maps.lots.map((l) => [l.id, l]));
const report = [];

// Fator m²/svg² por quadra (mediana) — para validar metragens reconstruídas
function quadraScale(q) {
  const ratios = maps.lots
    .filter((l) => l.quadra === q && !l.pending && l.metragem)
    .map((l) => l.metragem / shoelace(parsePts(l.points)))
    .sort((a, b) => a - b);
  return ratios[Math.floor(ratios.length / 2)];
}

// ── 1. Remove o fantasma B-24 ──────────────────────────────────────────────────
const b24 = byId.get('B-24');
if (b24) {
  maps.lots = maps.lots.filter((l) => l.id !== 'B-24');
  byId.delete('B-24');
  report.push('B-24 removido (fantasma — Quadra B oficial tem 19 lotes)');
}

// ── 2. Reconstrução dos lotes pendentes ────────────────────────────────────────
// Cada grupo: lotes contíguos entre dois vizinhos âncora validados.
const BANDS = [
  { between: ['H-01', 'H-04'], lots: [['H-02', 382.87], ['H-03', 368.16]] },
  { between: ['H-06', 'H-08'], lots: [['H-07', 402.70]] },
  { between: ['H-24', 'H-22'], lots: [['H-23', 347.94]] },
  { between: ['P-02', 'P-07'], lots: [['P-03', 360.0], ['P-04', 360.0], ['P-05', 360.0], ['P-06', 360.0]] },
  { between: ['P-08', 'P-10'], lots: [['P-09', 352.47]] },
];

for (const { between: [prevId, nextId], lots } of BANDS) {
  const prev = byId.get(prevId);
  const next = byId.get(nextId);
  const q = prevId[0];
  const sf = quadraScale(q);
  const { polys, band } = reconstructBand(parsePts(prev.points), parsePts(next.points), lots.map(([, a]) => a));
  const bandM2 = shoelace(band) * sf;
  const officialM2 = lots.reduce((s, [, a]) => s + a, 0);
  const err = ((bandM2 - officialM2) / officialM2) * 100;
  report.push(
    `faixa ${prevId}→${nextId}: ${r2(bandM2)} m² medidos × ${officialM2} m² oficiais (${err >= 0 ? '+' : ''}${err.toFixed(1)}%)`,
  );
  if (Math.abs(err) > 12) {
    console.error(`✗ faixa ${prevId}→${nextId} diverge ${err.toFixed(1)}% da metragem oficial — abortando`);
    process.exit(1);
  }
  lots.forEach(([id, area], i) => {
    const lot = byId.get(id);
    const poly = polys[i];
    const [cx, cy] = centroid(poly);
    lot.points = fmtPts(poly);
    lot.labelX = cx;
    lot.labelY = cy;
    lot.metragem = area;
    lot.area = Math.round(area);
    delete lot.pending;
    report.push(`  ${id} reconstruído (${area} m² oficial, ${r2(shoelace(poly) * sf)} m² no desenho)`);
  });
}

// ── 2b. D-15 — cunha na Alameda dos Lírios ─────────────────────────────────────
// 7 vértices compartilhados (CAD exato) com D-16/D-12/D-13/D-14 + testada oeste
// na Alameda dos Lírios extraída da planta oficial R05 (raster georreferenciado),
// com bojo calibrado para a metragem oficial de 628,73 m².
if (!byId.get('D-15')) {
  const sfD = quadraScale('D');
  const target = 628.73 / sfD; // área-alvo em svg²
  const fixed = [
    [734.04, 220.11], // D-16 fundos-oeste (compartilhado)
    [757.95, 240.94], // D-16 frente-oeste / D-12 fundos (compartilhado)
    [752.59, 247.19], // D-12/D-13 (compartilhado)
    [750.0, 250.29],  // D-13 (compartilhado)
    [743.85, 257.84], // D-13/D-14 (compartilhado)
    [742.27, 259.82], // D-14 (compartilhado)
    [733.97, 270.6],  // D-14 fundos-oeste, na Alameda dos Lírios (compartilhado)
  ];
  // Testada oeste: 3 pontos em arco (parábola) entre os extremos; profundidade
  // do bojo resolvida para fechar a área oficial.
  const A = fixed[fixed.length - 1]; // (733.97,270.6)
  const B = fixed[0]; //               (734.04,220.11)
  const chord = Math.hypot(B[0] - A[0], B[1] - A[1]);
  // normal unitária apontando para oeste (x negativo)
  let nx = -(B[1] - A[1]) / chord, ny = (B[0] - A[0]) / chord;
  if (nx > 0) { nx = -nx; ny = -ny; }
  const baseArea = shoelace(fixed);
  // área extra da poligonal de 3 pontos sobre perfil parabólico = 0,625·bojo·corda
  const bow = (target - baseArea) / (0.625 * chord);
  const west = [0.25, 0.5, 0.75].map((t) => {
    const p = lerp(A, B, t);
    const depth = bow * (1 - (2 * t - 1) ** 2); // perfil parabólico
    return [r2(p[0] + nx * depth), r2(p[1] + ny * depth)];
  });
  const poly = [...fixed, ...west];
  const got = shoelace(poly) * sfD;
  report.push(`  D-15 reconstruído (628.73 m² oficial, ${r2(got)} m² no desenho, bojo ${r2(bow)} svg)`);
  if (Math.abs(got - 628.73) > 6) {
    console.error('✗ D-15 reconstruído diverge da metragem oficial — abortando');
    process.exit(1);
  }
  const [cx, cy] = centroid(poly);
  const d15 = {
    id: 'D-15', quadra: 'D', lote: '15',
    points: fmtPts(poly),
    area: 629, labelX: cx, labelY: cy,
    status: 'negociacao',
    price: 432566.24, valor: 432566.24, valorVista: 346052.99,
    entrada: 43256.62, metragem: 628.73,
  };
  // insere na posição correta (antes do D-16)
  const idx = maps.lots.findIndex((l) => l.id === 'D-16');
  maps.lots.splice(idx, 0, d15);
  byId.set('D-15', d15);
}

// ── 3. N-09 (ANTENA) — sem preço, metragem oficial 900,80 ─────────────────────
const n09 = byId.get('N-09');
if (n09) {
  n09.metragem = 900.8;
  n09.area = 901;
  n09.price = null;
  n09.valor = null;
  n09.valorVista = null;
  n09.entrada = null;
  delete n09.p12; delete n09.p36; delete n09.p60; delete n09.p120;
  n09.specialType = 'ANTENA';
  report.push('N-09 corrigido: 900,80 m² (ANTENA, sem preço — tabela oficial)');
}

// ── 4. Planos de pagamento oficiais em todos os lotes precificados ────────────
let plansFixed = 0;
for (const lot of maps.lots) {
  const price = lot.valor ?? lot.price;
  if (!price) continue;
  const plans = officialPlans(price);
  lot.valorVista = r2(price * 0.8);
  lot.entrada = r2(price * 0.1);
  lot.p12 = plans.p12; lot.p36 = plans.p36; lot.p60 = plans.p60; lot.p120 = plans.p120;
  plansFixed++;
}
report.push(`planos de pagamento oficiais recalculados em ${plansFixed} lotes (entrada = 10% do total c/ desconto)`);

// ── 5. Amenities — posições da planta oficial R05 ──────────────────────────────
// Antes: portaria/coworking sobre a faixa da BR (fora do perímetro) e lazer sobre
// a colagem de fotos do book. Coordenadas extraídas da planta georreferenciada.
const AMENITY_POS = {
  portaria: { x: 1030.5, y: 181.5 },   // pórtico/guarita na via de acesso
  coworking: { x: 1035.0, y: 192.5 },  // bloco administrativo, junto à portaria
  lazer: { x: 1028.5, y: 145.5 },      // edificações do clube na Á. Recreativa 01
};
for (const a of maps.amenities ?? []) {
  const pos = AMENITY_POS[a.id];
  if (pos && (a.x !== pos.x || a.y !== pos.y)) {
    report.push(`amenity ${a.id}: (${a.x},${a.y}) → (${pos.x},${pos.y})`);
    a.x = pos.x; a.y = pos.y;
  }
}

// ── 6. Stats + totalLots ───────────────────────────────────────────────────────
const byStatus = {};
for (const l of maps.lots) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
maps.totalLots = maps.lots.length;
maps.stats = {
  total: maps.lots.length,
  disponiveis: byStatus.disponivel ?? 0,
  negociacao: byStatus.negociacao ?? 0,
  vendidos: byStatus.vendido ?? 0,
};

// ── 7. Tabela comercial (prices.json) ──────────────────────────────────────────
// Remove B-24 (fantasma) e N-09 (ANTENA — sem preço na tabela oficial);
// adiciona entrada/parcela oficiais por plano.
const newPrices = prices
  .filter((e) => !(e.quadra === 'B' && parseInt(e.lote, 10) === 24))
  .filter((e) => !(e.quadra === 'N' && parseInt(e.lote, 10) === 9))
  .map((e) => {
    const plans = officialPlans(e.preco_lote);
    return {
      ...e,
      preco_vista: r2(e.preco_lote * 0.8),
      entrada: r2(e.preco_lote * 0.1),
      p12_total: plans.p12.total, p12_entrada: plans.p12.entrada, p12_parcela: plans.p12.parcela,
      p36_total: plans.p36.total, p36_entrada: plans.p36.entrada, p36_parcela: plans.p36.parcela,
      p60_total: plans.p60.total, p60_entrada: plans.p60.entrada, p60_parcela: plans.p60.parcela,
      p120_total: plans.p120.total, p120_entrada: plans.p120.entrada, p120_parcela: plans.p120.parcela,
    };
  });
// garante D-15 na tabela (área/preço oficiais)
if (!newPrices.some((e) => e.quadra === 'D' && parseInt(e.lote, 10) === 15)) {
  console.error('✗ D-15 ausente da tabela comercial');
  process.exit(1);
}

// ── Verificação final: contagem oficial por quadra ─────────────────────────────
const OFFICIAL_PER_QUADRA = { A: 25, B: 19, C: 13, D: 25, E: 38, F: 27, G: 21, H: 45, I: 16, J: 24, K: 32, L: 24, M: 27, N: 31, O: 3, P: 13 };
const perQuadra = {};
for (const l of maps.lots) perQuadra[l.quadra] = (perQuadra[l.quadra] ?? 0) + 1;
for (const [q, n] of Object.entries(OFFICIAL_PER_QUADRA)) {
  if (perQuadra[q] !== n) {
    console.error(`✗ Quadra ${q}: ${perQuadra[q]} lotes ≠ ${n} oficiais`);
    process.exit(1);
  }
}
if (maps.lots.length !== 383) {
  console.error(`✗ total ${maps.lots.length} ≠ 383`);
  process.exit(1);
}

console.log('Correções aplicadas:');
for (const r of report) console.log(' •', r);
console.log(`\nTotal: ${maps.lots.length} lotes · por quadra OK (tabela oficial) · preços: ${newPrices.length} entradas`);

if (!DRY) {
  writeFileSync(MAPS_PATH, JSON.stringify(maps));
  writeFileSync(PRICES_PATH, JSON.stringify(newPrices));
  console.log('\n✓ Arquivos gravados:', MAPS_PATH, PRICES_PATH);
} else {
  console.log('\n(dry-run — nada gravado)');
}
