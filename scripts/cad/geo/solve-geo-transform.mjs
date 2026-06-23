#!/usr/bin/env node
/**
 * solve-geo-transform.mjs — Deriva o transform SVG → WGS84 do Alto Bellevue (Sprint 2).
 *
 * Resolve a limitação L1 da auditoria (sem projeção geográfica). Dado um conjunto de
 * pontos de controle (SVG x,y ↔ lng,lat reais do Google Earth) em
 * `scripts/cad/geo/control-points.json`, ajusta por mínimos quadrados uma transformação
 * AFIM 2D  [lng; lat] = A·[x; y] + t  (6 parâmetros, ≥3 pontos) e reporta o resíduo
 * em METROS. Com o transform, cada lote/rua/área comum do SVG pode ser projetado para
 * coordenadas reais — habilitando satélite/Google Earth e o caminho do Digital Twin.
 *
 * NÃO inventa dados: enquanto control-points.json estiver vazio (PENDING), apenas
 * reporta o estado e sai com código 0 (não é erro — é insumo pendente do produto).
 *
 * Uso:
 *   npm run geo:solve                 # resolve a partir dos pontos de controle
 *   node scripts/cad/geo/solve-geo-transform.mjs --json
 *   node scripts/cad/geo/solve-geo-transform.mjs --selftest   # prova a matemática
 *
 * Saída (quando resolvido): public/maps/alto-bellevue-geo.json
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '../../..');
const CP_PATH = join(HERE, 'control-points.json');
const OUT_PATH = join(ROOT, 'public/maps/alto-bellevue-geo.json');

const asJson = process.argv.includes('--json');
const selftest = process.argv.includes('--selftest');

// ── Álgebra: ajuste afim 2D por mínimos quadrados ───────────────────────────────
// Modelo: u = a·x + b·y + c ;  v = d·x + e·y + f   (u=lng, v=lat).
// Resolve as normais (XᵀX)·β = Xᵀy para cada saída via eliminação de Gauss 3×3.
function solve3(A, y) {
  const M = A.map((row, i) => [...row, y[i]]);
  for (let col = 0; col < 3; col++) {
    let piv = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    if (Math.abs(M[col][col]) < 1e-12) throw new Error('sistema singular — pontos colineares?');
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      for (let k = col; k <= 3; k++) M[r][k] -= f * M[col][k];
    }
  }
  return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
}

function fitAffine(pairs) {
  // pairs: [{ svg:[x,y], lngLat:[u,v] }]
  // Monta XᵀX (3×3) e Xᵀu, Xᵀv com base [x, y, 1].
  const XtX = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const Xtu = [0, 0, 0];
  const Xtv = [0, 0, 0];
  for (const p of pairs) {
    const [x, y] = p.svg;
    const [u, v] = p.lngLat;
    const b = [x, y, 1];
    for (let i = 0; i < 3; i++) {
      Xtu[i] += b[i] * u;
      Xtv[i] += b[i] * v;
      for (let j = 0; j < 3; j++) XtX[i][j] += b[i] * b[j];
    }
  }
  const [a, b, c] = solve3(XtX.map((r) => [...r]), Xtu);
  const [d, e, f] = solve3(XtX.map((r) => [...r]), Xtv);
  return { a, b, c, d, e, f };
}

const project = (M, x, y) => [M.a * x + M.b * y + M.c, M.d * x + M.e * y + M.f];

// Resíduo em metros (aprox. local): graus → metros usando a latitude média.
function residualMeters(M, pairs) {
  const latMean = pairs.reduce((s, p) => s + p.lngLat[1], 0) / pairs.length;
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((latMean * Math.PI) / 180);
  const errs = pairs.map((p) => {
    const [u, v] = project(M, p.svg[0], p.svg[1]);
    const du = (u - p.lngLat[0]) * mPerDegLng;
    const dv = (v - p.lngLat[1]) * mPerDegLat;
    return Math.hypot(du, dv);
  });
  errs.sort((a, b) => a - b);
  const mean = errs.reduce((s, e) => s + e, 0) / errs.length;
  return { mean, max: errs[errs.length - 1], p95: errs[Math.floor(errs.length * 0.95)] ?? errs[errs.length - 1] };
}

// ── Self-test: recupera um transform conhecido a partir de pontos sintéticos ─────
function runSelftest() {
  const TRUE = { a: 1.2e-4, b: 3e-6, c: -36.5, d: -2e-6, e: -1.1e-4, f: -8.88 };
  const svgPts = [[0, 0], [1200, 0], [1200, 821.86], [0, 821.86], [600, 410]];
  const pairs = svgPts.map(([x, y]) => ({
    svg: [x, y],
    lngLat: [TRUE.a * x + TRUE.b * y + TRUE.c, TRUE.d * x + TRUE.e * y + TRUE.f],
  }));
  const M = fitAffine(pairs);
  const coefErr = Math.max(...['a', 'b', 'c', 'd', 'e', 'f'].map((k) => Math.abs(M[k] - TRUE[k])));
  const res = residualMeters(M, pairs);
  const ok = coefErr < 1e-9 && res.max < 1e-3;
  console.log(`[selftest] erro máx. de coeficiente: ${coefErr.toExponential(2)}`);
  console.log(`[selftest] resíduo: mean=${res.mean.toExponential(2)}m max=${res.max.toExponential(2)}m`);
  console.log(`[selftest] ${ok ? '✓ OK — solver afim correto' : '✗ FALHOU'}`);
  process.exit(ok ? 0 : 1);
}

if (selftest) runSelftest();

// ── Execução normal ─────────────────────────────────────────────────────────────
const cp = JSON.parse(readFileSync(CP_PATH, 'utf8'));
const pts = Array.isArray(cp.points) ? cp.points : [];
const valid = pts.filter(
  (p) => Array.isArray(p.svg) && p.svg.length === 2 && Array.isArray(p.lngLat) && p.lngLat.length === 2 &&
    p.svg.every(Number.isFinite) && p.lngLat.every(Number.isFinite),
);
const minPoints = cp.minPoints ?? 3;

if (valid.length < minPoints) {
  const out = {
    status: 'PENDING',
    reason: `pontos de controle insuficientes: ${valid.length}/${minPoints}`,
    hint: 'Preencha scripts/cad/geo/control-points.json com cantos reais (Google Earth) e rode novamente.',
  };
  if (asJson) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' GEORREFERENCIAMENTO SVG↔WGS84 — Alto Bellevue');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n  STATUS: PENDING (${valid.length}/${minPoints} pontos de controle)`);
  console.log('  → ' + out.hint);
  console.log('  → Validação da matemática disponível: --selftest');
  process.exit(0);
}

const M = fitAffine(valid);
const res = residualMeters(M, valid);
const corners = {
  topLeft: project(M, 0, 0),
  topRight: project(M, 1200, 0),
  bottomRight: project(M, 1200, 821.86),
  bottomLeft: project(M, 0, 821.86),
};
const result = {
  status: 'OK',
  generatedAt: new Date().toISOString(),
  crs: 'EPSG:4326',
  viewBox: { w: 1200, h: 821.86 },
  affine: M,
  controlPoints: valid.length,
  residualMeters: res,
  cornersLngLat: corners,
  note: 'Projeção: [lng,lat] = a*x + b*y + c , d*x + e*y + f (x,y em SVG).',
};

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));

if (asJson) { console.log(JSON.stringify(result, null, 2)); process.exit(0); }
console.log('═══════════════════════════════════════════════════════════');
console.log(' GEORREFERENCIAMENTO SVG↔WGS84 — Alto Bellevue');
console.log('═══════════════════════════════════════════════════════════');
console.log(`\n  Pontos de controle: ${valid.length}`);
console.log(`  Resíduo: mean=${res.mean.toFixed(2)}m  p95=${res.p95.toFixed(2)}m  max=${res.max.toFixed(2)}m`);
console.log(`  Cantos (lng,lat): TL=${corners.topLeft.map((n) => n.toFixed(6))}  BR=${corners.bottomRight.map((n) => n.toFixed(6))}`);
console.log(`\n  ✓ Escrito: public/maps/alto-bellevue-geo.json`);
console.log(`  ${res.max < 5 ? '✓' : '⚠'} Qualidade: resíduo máx ${res.max.toFixed(2)}m ${res.max < 5 ? '(bom)' : '(revisar pontos de controle)'}`);
process.exit(0);
