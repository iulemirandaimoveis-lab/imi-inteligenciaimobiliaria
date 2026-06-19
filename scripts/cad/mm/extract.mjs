/**
 * Miguel Marques — extração da FONTE DE VERDADE (CAD/DXF).
 *
 * Lê o DXF oficial ("R07 — PLANTA LOTEADA", AutoCAD 2004, unidades em mm) e
 * extrai a estrutura REAL do loteamento — sem inventar geometria:
 *   - 24 quadras (rótulos de letra na layer G-ANNO-TEXT)
 *   - lotes: número + área(m²) REAL + posição, da layer A-AREA-IDEN
 *   - ruas (RUA PROJETADA 01–23) na G-ANNO-TEXT
 *
 * Os lotes são agrupados por componente conexa (proximidade) e cada grupo é
 * casado com o rótulo de quadra mais próximo → atribuição de quadra robusta.
 *
 * O DXF NÃO é commitado (13 MB). Rode apontando para o arquivo oficial:
 *   node scripts/cad/mm/extract.mjs "/caminho/PLANTA LOTEADA.dxf"
 * (ou defina MM_DXF). Saída versionada: scripts/cad/mm/data/extracted.json
 *
 * Dependency-free (apenas `fs`) — roda sem `npm ci`.
 */
import fs from 'fs';
import path from 'path';

const DXF =
  process.argv[2] ||
  process.env.MM_DXF ||
  '/root/.claude/uploads/88597542-a0ab-559f-8a92-96fbb17a43c7/22702f9d-R07__Planta_de_piso__PLANTA_LOTEADA.dxf';

const OUT = path.join(process.cwd(), 'scripts/cad/mm/data/extracted.json');

// ── DXF parsing (ASCII, pares code/value) ──────────────────────────────────────
function parseEntities(file) {
  const lines = fs.readFileSync(file, 'latin1').split(/\r?\n/);
  const pairs = [];
  for (let i = 0; i + 1 < lines.length; i += 2) pairs.push([lines[i].trim(), lines[i + 1]]);
  const ents = [];
  let sx4 = 0, sy4 = 0; // direção dominante das bordas de lote (mod 90°, fase 4θ)
  for (let s = 0; s < pairs.length; s++) {
    if (pairs[s][0] !== '0') continue;
    const type = pairs[s][1].trim();
    if (type !== 'MTEXT' && type !== 'TEXT' && type !== 'LINE') continue;
    const g = {}; let text = '';
    let j = s + 1;
    for (; j < pairs.length && pairs[j][0] !== '0'; j++) {
      const [c, v] = pairs[j];
      if (!(c in g)) g[c] = v;
      if (c === '1' || c === '3') text += v;
    }
    s = j - 1;
    if (type === 'LINE') {
      // ângulo das bordas de lote (A-DETL-THIN) → de-rotação do plano
      if ((g['8'] || '').trim() === 'A-DETL-THIN') {
        const x1 = +g['10'], y1 = +g['20'], x2 = +g['11'], y2 = +g['21'];
        const len = Math.hypot(x2 - x1, y2 - y1);
        if (len > 2000 && len < 40000) { const a = Math.atan2(y2 - y1, x2 - x1); sx4 += Math.cos(4 * a) * len; sy4 += Math.sin(4 * a) * len; }
      }
      continue;
    }
    ents.push({ type, g, layer: (g['8'] || '').trim(), text });
  }
  const rotationDeg = +((Math.atan2(sy4, sx4) / 4) * 180 / Math.PI).toFixed(3);
  return { ents, rotationDeg };
}

const num = (x) => { const n = parseFloat(x); return Number.isFinite(n) ? n : null; };
const cleanText = (t) =>
  (t || '')
    .replace(/\\[A-Za-z][^;\\]*;/g, '') // formatação MTEXT (\fArial; \A1; …)
    .replace(/[{}]/g, '')
    .replace(/\\P/g, ' ')
    .replace(/\\~/g, ' ')
    .trim();

// ── Union-Find p/ componentes conexas ──────────────────────────────────────────
function connectedComponents(pts, linkDist) {
  const par = pts.map((_, i) => i);
  const find = (x) => (par[x] === x ? x : (par[x] = find(par[x])));
  const link2 = linkDist * linkDist;
  // grade espacial p/ evitar O(n²) puro
  const cell = linkDist;
  const grid = new Map();
  const key = (gx, gy) => gx + ',' + gy;
  pts.forEach((p, i) => {
    const gx = Math.floor(p.x / cell), gy = Math.floor(p.y / cell);
    (grid.get(key(gx, gy)) ?? grid.set(key(gx, gy), []).get(key(gx, gy))).push(i);
  });
  pts.forEach((p, i) => {
    const gx = Math.floor(p.x / cell), gy = Math.floor(p.y / cell);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(key(gx + dx, gy + dy));
        if (!bucket) continue;
        for (const j of bucket) {
          if (j <= i) continue;
          const ddx = p.x - pts[j].x, ddy = p.y - pts[j].y;
          if (ddx * ddx + ddy * ddy <= link2) par[find(i)] = find(j);
        }
      }
  });
  const comp = new Map();
  pts.forEach((_, i) => { const r = find(i); (comp.get(r) ?? comp.set(r, []).get(r)).push(i); });
  return [...comp.values()];
}

function main() {
  if (!fs.existsSync(DXF)) {
    console.error(`DXF não encontrado: ${DXF}\nUse: node scripts/cad/mm/extract.mjs "<caminho.dxf>" (ou MM_DXF=...)`);
    process.exit(1);
  }
  const { ents, rotationDeg } = parseEntities(DXF);
  const txt = ents
    .map((e) => ({ t: cleanText(e.text), x: num(e.g['10']), y: num(e.g['20']), layer: e.layer }))
    .filter((o) => o.x != null && o.t);

  // Rótulos de quadra: letra única em G-ANNO-TEXT (A–Z, sem W/Y no plano).
  const quadraLabels = txt
    .filter((o) => o.layer === 'G-ANNO-TEXT' && /^[A-Z]$/.test(o.t.replace(/\s/g, '')))
    .map((o) => ({ letter: o.t.replace(/\s/g, ''), x: o.x, y: o.y }));

  // Ruas.
  const streets = txt
    .filter((o) => /^RUA\s+PROJETADA\s+\d+$/i.test(o.t))
    .map((o) => ({ name: o.t, x: o.x, y: o.y }));

  // Lotes: número (A-AREA-IDEN) + área m² (A-AREA-IDEN). Pareia número→área mais próxima.
  const ai = txt.filter((o) => o.layer === 'A-AREA-IDEN');
  const numLabels = ai.filter((o) => /^\d{1,3}$/.test(o.t)).map((o) => ({ n: parseInt(o.t, 10), x: o.x, y: o.y }));
  const areaLabels = ai.filter((o) => /^\d+[.,]\d{1,2}\s*m/.test(o.t)).map((o) => ({ a: parseFloat(o.t.replace(',', '.')), x: o.x, y: o.y }));

  const nearest = (o, arr) => {
    let best = null, bd = Infinity;
    for (const c of arr) { const d = (c.x - o.x) ** 2 + (c.y - o.y) ** 2; if (d < bd) { bd = d; best = c; } }
    return { best, d: Math.sqrt(bd) };
  };

  // Passo de lote (pitch) ~ distância ao vizinho mais próximo entre números.
  const sample = numLabels.slice(0, 500).map((o) => nearest(o, numLabels.filter((x) => x !== o)).d).sort((a, b) => a - b);
  const pitch = sample[Math.floor(sample.length / 2)] || 8000;

  // Lote = número + área dentro de ~0.9× pitch.
  const lots = [];
  for (const o of numLabels) {
    const { best, d } = nearest(o, areaLabels);
    if (best && d < pitch * 0.9) lots.push({ n: o.n, area_m2: best.a, x: o.x, y: o.y });
    else lots.push({ n: o.n, area_m2: null, x: o.x, y: o.y });
  }

  // ── Atribuição de quadra (híbrida: componente + posse de rótulo) ───────────────
  // Voronoi puro inflava quadras de borda (A: 29→44). Componente puro mesclava S+Z
  // (gap estreito) e perdia rótulos. Solução: agrupar por componente conexa e deixar
  // cada RÓTULO reivindicar o componente que contém o lote mais próximo dele.
  //  - componente com 1 rótulo → toda a quadra recebe a letra;
  //  - componente com ≥2 rótulos (quadras coladas, ex. S+Z) → divide por rótulo + próximo;
  //  - componente sem rótulo (fragmento solto) → fallback p/ rótulo global + marca stray.
  const comps = connectedComponents(lots, pitch * 2.2);
  const compOf = new Array(lots.length);
  comps.forEach((idxs, ci) => idxs.forEach((i) => (compOf[i] = ci)));

  const labelsOfComp = comps.map(() => []);
  for (const ql of quadraLabels) {
    let bi = -1, bd = Infinity;
    for (let i = 0; i < lots.length; i++) {
      const d = (lots[i].x - ql.x) ** 2 + (lots[i].y - ql.y) ** 2;
      if (d < bd) { bd = d; bi = i; }
    }
    labelsOfComp[compOf[bi]].push(ql);
  }

  let strayCount = 0;
  comps.forEach((idxs, ci) => {
    const labs = labelsOfComp[ci];
    if (labs.length === 1) {
      for (const i of idxs) lots[i].quadra = labs[0].letter;
    } else if (labs.length >= 2) {
      for (const i of idxs) lots[i].quadra = nearest(lots[i], labs).best.letter;
    } else {
      for (const i of idxs) { lots[i].quadra = nearest(lots[i], quadraLabels).best?.letter ?? '?'; lots[i].stray = true; strayCount++; }
    }
  });

  const usedLetter = new Map();
  const quadras = quadraLabels
    .map((ql) => {
      const mine = lots.filter((l) => l.quadra === ql.letter);
      usedLetter.set(ql.letter, mine.length);
      return { letter: ql.letter, x: Math.round(ql.x), y: Math.round(ql.y), lotCount: mine.length };
    })
    .sort((a, b) => a.letter.localeCompare(b.letter));
  if (strayCount) console.warn(`⚠️  ${strayCount} lote(s) em fragmento sem rótulo (revisar c/ PDF)`);

  // Dedupe ruas por nome (o rótulo se repete ao longo da via) — média das posições.
  const streetMap = new Map();
  for (const s of streets) {
    const e = streetMap.get(s.name) ?? { name: s.name, x: 0, y: 0, k: 0 };
    e.x += s.x; e.y += s.y; e.k++; streetMap.set(s.name, e);
  }
  const streetsUniq = [...streetMap.values()]
    .map((e) => ({ name: e.name, x: Math.round(e.x / e.k), y: Math.round(e.y / e.k) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // bbox global dos lotes
  const xs = lots.map((l) => l.x), ys = lots.map((l) => l.y);
  const bbox = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };

  const out = {
    source: path.basename(DXF),
    units: 'mm',
    generatedAt: new Date().toISOString(),
    bbox,
    pitch: Math.round(pitch),
    rotationDeg, // ângulo das bordas de lote (A-DETL-THIN) p/ de-rotação do mapa
    counts: {
      quadraLabels: quadraLabels.length,
      streets: streetsUniq.length,
      lots: lots.length,
      lotsWithArea: lots.filter((l) => l.area_m2 != null).length,
      components: comps.length,
    },
    quadras,
    streets: streetsUniq,
    lots: lots
      .map((l) => ({ quadra: l.quadra ?? '?', n: l.n, area_m2: l.area_m2, cadX: Math.round(l.x), cadY: Math.round(l.y), stray: !!l.stray }))
      .sort((a, b) => (a.quadra === b.quadra ? a.n - b.n : a.quadra.localeCompare(b.quadra))),
  };

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));

  // ── Relatório ────────────────────────────────────────────────────────────────
  console.log('Fonte:', out.source, '| unidades:', out.units, '| pitch ~', out.pitch, 'mm');
  console.log('Quadras (rótulos):', quadraLabels.length, '| componentes:', comps.length, '| ruas únicas:', streetsUniq.length);
  console.log('Lotes:', lots.length, '| com área:', out.counts.lotsWithArea);
  const empty = [...usedLetter.entries()].filter(([, c]) => c === 0).map(([l]) => l);
  if (empty.length) console.warn('⚠️  quadras sem lotes (rótulo sem lotes próximos):', JSON.stringify(empty));
  else console.log('✓ todas as 24 quadras receberam lotes');
  console.log('Lotes por quadra:', JSON.stringify(quadras.reduce((m, q) => ((m[q.letter] = q.lotCount), m), {})));
  // Sanidade da numeração: por quadra, faixa de números e lacunas
  const gaps = [];
  for (const q of quadras) {
    const nset = new Set(lots.filter((l) => l.quadra === q.letter).map((l) => l.n));
    const max = Math.max(...nset);
    const missing = [];
    for (let k = 1; k <= max; k++) if (!nset.has(k)) missing.push(k);
    if (missing.length) gaps.push(`${q.letter}:falta[${missing.slice(0, 8).join(',')}${missing.length > 8 ? '…' : ''}] (max ${max}, tem ${nset.size})`);
  }
  if (gaps.length) console.log('Lacunas de numeração (revisar c/ PDF):\n  ' + gaps.join('\n  '));
  // Validação Quadra A vs áreas conhecidas
  const qaKnown = [247.85, 137.31, 167.73, 196.69, 224.92, 119.05, 114.31, 132.44, 145.63];
  const qaAreas = new Set(lots.filter((l) => l.quadra === 'A').map((l) => l.area_m2));
  const qaHit = qaKnown.filter((a) => qaAreas.has(a)).length;
  console.log(`Validação Quadra A: ${qaHit}/${qaKnown.length} áreas conhecidas presentes`);
  console.log('Saída:', path.relative(process.cwd(), OUT));
}

main();
