/**
 * Miguel Marques — reconstrução de POLÍGONOS de lote a partir do CAD.
 *
 * Extrai os segmentos de contorno (layers A-DETL*) do DXF, monta uma subdivisão
 * planar (half-edge) e traça as faces mínimas (células). Cada lote (rótulo
 * número+área da A-AREA-IDEN) é casado com a face que o contém e VALIDADO pela
 * área: a área da face (mm²→m²) deve bater com o m² declarado. Sem invenção:
 * lote sem face válida fica `pending`.
 *
 * Dependency-free. Uso:
 *   node scripts/cad/mm/polygonize.mjs "<caminho.dxf>"   (ou MM_DXF=...)
 * Saída: scripts/cad/mm/data/polygons.json  (+ relatório de yield)
 */
import fs from 'fs';
import path from 'path';

const DXF =
  process.argv[2] || process.env.MM_DXF ||
  '/root/.claude/uploads/88597542-a0ab-559f-8a92-96fbb17a43c7/22702f9d-R07__Planta_de_piso__PLANTA_LOTEADA.dxf';
const OUT = path.join(process.cwd(), 'scripts/cad/mm/data/polygons.json');

const BOUNDARY_LAYERS = new Set(['A-DETL-THIN', 'A-DETL-MEDM', 'A-DETL']);
const SNAP = 80;           // tolerância de junção de vértices (mm)
const AREA_TOL = 0.12;     // 12% — face vs área declarada
const MIN_FACE_M2 = 30;    // descarta micro-faces (ruído)
const MAX_FACE_M2 = 2000;  // descarta faces enormes (quadra inteira / fundo)

// ── DXF ────────────────────────────────────────────────────────────────────────
function parse(file) {
  const raw = fs.readFileSync(file, 'latin1').split(/\r?\n/);
  const pairs = [];
  for (let i = 0; i + 1 < raw.length; i += 2) pairs.push([raw[i].trim(), raw[i + 1]]);
  const lines = [], texts = [];
  for (let s = 0; s < pairs.length; s++) {
    if (pairs[s][0] !== '0') continue;
    const t = pairs[s][1].trim();
    if (t !== 'LINE' && t !== 'MTEXT' && t !== 'TEXT') continue;
    const g = {}; let txt = ''; let j = s + 1;
    for (; j < pairs.length && pairs[j][0] !== '0'; j++) {
      const [c, v] = pairs[j];
      if (!(c in g)) g[c] = v;
      if (c === '1' || c === '3') txt += v;
    }
    const layer = (g['8'] || '').trim();
    if (t === 'LINE') {
      const x1 = +g['10'], y1 = +g['20'], x2 = +g['11'], y2 = +g['21'];
      if (Number.isFinite(x1) && Number.isFinite(x2)) lines.push({ layer, x1, y1, x2, y2 });
    } else {
      const clean = txt.replace(/\\[A-Za-z][^;\\]*;/g, '').replace(/[{}]/g, '').replace(/\\P/g, ' ').trim();
      texts.push({ layer, t: clean, x: +g['10'], y: +g['20'] });
    }
    s = j - 1;
  }
  return { lines, texts };
}

// ── Geometria ───────────────────────────────────────────────────────────────────
const shoelace = (pts) => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
  return a / 2; // assinado
};
function pointInPoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function main() {
  if (!fs.existsSync(DXF)) { console.error('DXF não encontrado:', DXF); process.exit(1); }
  const { lines, texts } = parse(DXF);

  // Lotes (rótulo número+área) — reusa a mesma fonte do extract.
  const ai = texts.filter((o) => o.layer === 'A-AREA-IDEN' && Number.isFinite(o.x));
  const nums = ai.filter((o) => /^\d{1,3}$/.test(o.t)).map((o) => ({ n: +o.t, x: o.x, y: o.y }));
  const areas = ai.filter((o) => /^\d+[.,]\d{1,2}\s*m/.test(o.t)).map((o) => ({ a: parseFloat(o.t.replace(',', '.')), x: o.x, y: o.y }));
  const nearest = (o, arr) => { let b = null, bd = Infinity; for (const c of arr) { const d = (c.x - o.x) ** 2 + (c.y - o.y) ** 2; if (d < bd) { bd = d; b = c; } } return { b, d: Math.sqrt(bd) }; };
  const lots = nums.map((o) => { const { b, d } = nearest(o, areas); return { n: o.n, x: o.x, y: o.y, area_m2: b && d < 7000 ? b.a : null }; });

  // bbox dos lotes (margem) p/ filtrar segmentos (exclui carimbo/detalhes distantes)
  const xs = lots.map((l) => l.x), ys = lots.map((l) => l.y);
  const bb = { x0: Math.min(...xs) - 20000, y0: Math.min(...ys) - 20000, x1: Math.max(...xs) + 20000, y1: Math.max(...ys) + 20000 };
  const seg = lines.filter((l) => BOUNDARY_LAYERS.has(l.layer) &&
    Math.min(l.x1, l.x2) >= bb.x0 && Math.max(l.x1, l.x2) <= bb.x1 &&
    Math.min(l.y1, l.y2) >= bb.y0 && Math.max(l.y1, l.y2) <= bb.y1);

  // ── Snap de vértices ───────────────────────────────────────────────────────────
  const vmap = new Map(); const verts = [];
  const key = (x, y) => Math.round(x / SNAP) + ',' + Math.round(y / SNAP);
  const vid = (x, y) => {
    const k = key(x, y);
    let id = vmap.get(k);
    if (id == null) { id = verts.length; verts.push([x, y]); vmap.set(k, id); }
    return id;
  };
  // arestas únicas
  const edgeSet = new Set(); const adj = [];
  const addEdge = (a, b) => {
    if (a === b) return;
    const k = a < b ? a + '_' + b : b + '_' + a;
    if (edgeSet.has(k)) return;
    edgeSet.add(k);
    (adj[a] ??= []).push(b); (adj[b] ??= []).push(a);
  };
  for (const s of seg) addEdge(vid(s.x1, s.y1), vid(s.x2, s.y2));

  const degs = adj.map((a) => a?.length || 0).filter(Boolean);
  const avgDeg = degs.reduce((s, d) => s + d, 0) / (degs.length || 1);

  // ── Half-edge: ordena vizinhos por ângulo e traça faces mínimas ─────────────────
  const ang = (a, b) => Math.atan2(verts[b][1] - verts[a][1], verts[b][0] - verts[a][0]);
  for (let v = 0; v < verts.length; v++) if (adj[v]) adj[v].sort((p, q) => ang(v, p) - ang(v, q));
  const nextCW = (from, to) => {
    // no nó `to`, pega a aresta imediatamente HORÁRIA após a volta (to->from)
    const nb = adj[to]; const aBack = ang(to, from);
    let best = null, bestDelta = Infinity;
    for (const w of nb) {
      if (w === from && nb.length > 1) continue;
      let d = aBack - ang(to, w); // horário = ângulo decrescente
      d = ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (d > 1e-9 && d < bestDelta) { bestDelta = d; best = w; }
    }
    return best ?? from; // beco sem saída → volta (dangling)
  };
  const visited = new Set();
  const faces = [];
  for (let a = 0; a < verts.length; a++) {
    if (!adj[a]) continue;
    for (const b of adj[a]) {
      const hk = a + '>' + b;
      if (visited.has(hk)) continue;
      // traça o ciclo
      const cyc = []; let cu = a, cv = b, steps = 0;
      while (steps++ < 100000) {
        visited.add(cu + '>' + cv);
        cyc.push(cu);
        const nv = nextCW(cu, cv);
        cu = cv; cv = nv;
        if (cu === a && cv === b) break;
      }
      if (cyc.length >= 3) faces.push(cyc.map((i) => verts[i]));
    }
  }

  // Mantém faces "de lote": área positiva (CCW) dentro da faixa, e descarta a face externa.
  const faceCells = faces
    .map((pts) => ({ pts, areaMm2: shoelace(pts) }))
    .filter((f) => f.areaMm2 > 0)
    .map((f) => ({ pts: f.pts, m2: f.areaMm2 / 1e6 }))
    .filter((f) => f.m2 >= MIN_FACE_M2 && f.m2 <= MAX_FACE_M2);

  // ── Casa cada lote com a face que o contém + valida por área ────────────────────
  let matched = 0, areaOk = 0;
  const result = lots.map((l) => {
    let face = null;
    for (const f of faceCells) if (pointInPoly(l.x, l.y, f.pts)) { face = f; break; }
    let polygon = null, faceM2 = null, valid = false;
    if (face) {
      matched++;
      faceM2 = +face.m2.toFixed(2);
      if (l.area_m2 && Math.abs(faceM2 - l.area_m2) / l.area_m2 <= AREA_TOL) { valid = true; areaOk++; }
      polygon = face.pts.map(([x, y]) => [Math.round(x), Math.round(y)]);
    }
    return { n: l.n, cadX: Math.round(l.x), cadY: Math.round(l.y), area_m2: l.area_m2, faceM2, valid, polygon: valid ? polygon : null };
  });

  fs.writeFileSync(OUT, JSON.stringify({
    source: path.basename(DXF), units: 'mm', snap: SNAP, areaTol: AREA_TOL,
    counts: { lots: lots.length, faces: faceCells.length, matched, areaOk },
    bbox: bb, lots: result,
  }, null, 2));

  console.log('Segmentos de contorno (lot bbox):', seg.length, '| vértices:', verts.length, '| arestas:', edgeSet.size, '| grau médio:', avgDeg.toFixed(2));
  console.log('Faces traçadas:', faces.length, '→ células de lote (faixa de área):', faceCells.length);
  console.log('Lotes:', lots.length, '| casados c/ face:', matched, '| área validada (≤' + (AREA_TOL * 100) + '%):', areaOk, `(${(areaOk / lots.length * 100).toFixed(1)}%)`);
  console.log('Saída:', path.relative(process.cwd(), OUT));
}

main();
