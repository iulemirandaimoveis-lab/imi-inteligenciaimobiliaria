/**
 * validate-mm-lots.mjs — Validação contínua da geometria do Miguel Marques.
 *
 * Operacionaliza a auditoria CAD (docs/miguel-marques-cad-audit.md): roda contra o
 * dataset de produção (public/maps/miguel-marques-cad-lots.json) e reporta os
 * invariantes geométricos e de identidade — espelhando o que `validate-lots.mjs`
 * faz para o Alto Bellevue.
 *
 * É DIAGNÓSTICO: sai 0 por padrão (não quebra CI). Com `--strict`, sai 1 se houver
 * IDs duplicados ou polígonos inválidos — use depois da reconciliação P0, quando o
 * objetivo for "0 divergência" e travar regressão de identidade.
 *
 * Uso:
 *   node scripts/validate-mm-lots.mjs
 *   node scripts/validate-mm-lots.mjs --strict
 */
import fs from 'fs';
import path from 'path';

const STRICT = process.argv.includes('--strict');
const LOTS = path.join(process.cwd(), 'public/maps/miguel-marques-cad-lots.json');
const EXPECTED_TOTAL = 1254;       // confirmado: DXF (1.255 rótulos − 1 institucional) ≈ XLSX ≈ JSON
const EXPECTED_QUADRAS = 24;       // A–V, X, Z (pula W e Y)

function shoelace(points) {
  // points: "x,y x,y ..." → área absoluta
  const pts = points.trim().split(/\s+/).map((p) => p.split(',').map(Number));
  if (pts.length < 3) return null;
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    if (![x1, y1, x2, y2].every(Number.isFinite)) return null;
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function main() {
  if (!fs.existsSync(LOTS)) {
    console.error(`✗ Não encontrado: ${path.relative(process.cwd(), LOTS)}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(LOTS, 'utf8'));
  const lots = data.lots ?? [];
  const problems = [];

  // 1) Total
  const total = lots.length;
  const totalOk = total === EXPECTED_TOTAL;
  if (!totalOk) problems.push(`total ${total} ≠ esperado ${EXPECTED_TOTAL}`);

  // 2) IDs / chave (quadra,lote) únicos
  const idSeen = new Map();
  const keySeen = new Map();
  const dupIds = [];
  const dupKeys = [];
  for (const l of lots) {
    const key = `${l.quadra}-${String(l.lote).replace(/_.*$/, '')}`;
    idSeen.set(l.id, (idSeen.get(l.id) ?? 0) + 1);
    keySeen.set(key, (keySeen.get(key) ?? 0) + 1);
  }
  for (const [id, n] of idSeen) if (n > 1) dupIds.push(id);
  for (const [k, n] of keySeen) if (n > 1) dupKeys.push(k);
  const suffixed = lots.filter((l) => /_\d+$/.test(String(l.id))).map((l) => l.id);
  if (dupKeys.length) problems.push(`${dupKeys.length} chaves (quadra,lote) duplicadas`);
  if (suffixed.length) problems.push(`${suffixed.length} ids com sufixo de colisão (ex.: ${suffixed.slice(0, 5).join(', ')})`);

  // 3) Polígonos válidos + área coerente
  let noPoly = 0, invalidPoly = 0, areaMismatch = 0;
  for (const l of lots) {
    if (!l.points) { noPoly++; continue; }
    const a = shoelace(l.points);
    if (a == null || a <= 0) { invalidPoly++; continue; }
    // área do polígono está em unidades de viewBox, não m² — não comparável direto;
    // checamos apenas que o m² declarado é positivo e finito.
    if (!(Number.isFinite(l.area) && l.area > 0)) areaMismatch++;
  }
  if (noPoly) problems.push(`${noPoly} lotes sem polígono`);
  if (invalidPoly) problems.push(`${invalidPoly} polígonos inválidos`);
  if (areaMismatch) problems.push(`${areaMismatch} lotes sem área válida`);

  // 4) Quadras
  const quadras = new Set(lots.map((l) => l.quadra));
  const qDist = {};
  for (const l of lots) qDist[l.quadra] = (qDist[l.quadra] ?? 0) + 1;

  // 5) Camadas de contexto (informativo — render usa miguel-marques-cad-context.json)
  const ctxPath = path.join(process.cwd(), 'public/maps/miguel-marques-cad-context.json');
  let ctxNote = 'ausente';
  if (fs.existsSync(ctxPath)) {
    const ctx = JSON.parse(fs.readFileSync(ctxPath, 'utf8'));
    ctxNote = `roads=${(ctx.roads ?? []).length} perimeter=${(ctx.perimeter ?? []).length}`;
  }

  // ── Relatório ──────────────────────────────────────────────────────────────
  const areas = lots.map((l) => l.area).filter((a) => Number.isFinite(a) && a > 0);
  const sum = areas.reduce((s, a) => s + a, 0);
  console.log('── Validação Miguel Marques (geometria CAD) ──');
  console.log(`Arquivo            : ${path.relative(process.cwd(), LOTS)}`);
  console.log(`Total de lotes     : ${total} (esperado ${EXPECTED_TOTAL}) ${totalOk ? '✓' : '✗'}`);
  console.log(`Quadras            : ${quadras.size} (esperado ${EXPECTED_QUADRAS}) ${quadras.size === EXPECTED_QUADRAS ? '✓' : '✗'}`);
  console.log(`Chaves duplicadas  : ${dupKeys.length} ${dupKeys.length ? '✗' : '✓'}`);
  console.log(`IDs sufixados (_n) : ${suffixed.length} ${suffixed.length ? '✗ (resíduo de identificação — P0)' : '✓'}`);
  console.log(`Sem polígono       : ${noPoly} ${noPoly ? '✗' : '✓'}`);
  console.log(`Polígonos inválidos: ${invalidPoly} ${invalidPoly ? '✗' : '✓'}`);
  console.log(`Sem área válida    : ${areaMismatch} ${areaMismatch ? '✗' : '✓'}`);
  console.log(`Área total (m²)     : ${Math.round(sum).toLocaleString('pt-BR')}`);
  console.log(`Contexto (render)  : ${ctxNote}`);
  console.log(`Distribuição/quadra: ${Object.entries(qDist).sort(([a], [b]) => a.localeCompare(b)).map(([q, n]) => `${q}:${n}`).join('  ')}`);

  if (problems.length) {
    console.log(`\n⚠ ${problems.length} pendência(s):`);
    for (const p of problems) console.log(`   • ${p}`);
    console.log('\nVer docs/miguel-marques-cad-audit.md (§6 identidade, §10 plano P0→P2).');
  } else {
    console.log('\n✓ Todos os invariantes OK.');
  }

  // Hard-fail só com --strict, e só para defeitos geométricos reais (não para os
  // resíduos de identidade já conhecidos/documentados, até a reconciliação P0).
  const hardFail = noPoly > 0 || invalidPoly > 0 || areaMismatch > 0 || !totalOk;
  const strictFail = STRICT && (hardFail || dupKeys.length > 0);
  if (strictFail) {
    console.error('\n✗ FALHA (--strict).');
    process.exit(1);
  }
  process.exit(0);
}

main();
