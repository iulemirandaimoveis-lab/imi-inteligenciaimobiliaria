/**
 * Miguel Marques — gera o mapa no CONTRATO UNIFICADO do motor.
 *
 * Lê scripts/cad/mm/data/extracted.json (posições/áreas/quadras REAIS do CAD) e
 * produz public/maps/loteamento-miguel-marques-lots.json no formato `LotMapData`
 * que `InteractiveLotMap`/`useLotMap` consomem — o MESMO motor do Alto Bellevue.
 *
 * Geometria dos lotes: como o DXF não tem polígonos fechados (lotes = linhas de
 * borda de quadra + cotas), cada célula é a **Voronoi dos centroides REAIS** do
 * lote dentro da quadra (recortada a uma caixa proporcional à área). Isso usa a
 * posição real de cada lote (nada inventado de layout) e ladrilha sem sobreposição.
 * Validado por área: a célula é comparada ao m² declarado.
 *
 * Status/preço NÃO entram aqui — o motor enriquece ao vivo do Supabase
 * (subdivision_lots) por chave QUADRA-lote. Default do JSON: disponível/preço nulo.
 *
 * Uso: node scripts/cad/mm/build-map.mjs
 */
import fs from 'fs';
import path from 'path';

const SRC = path.join(process.cwd(), 'scripts/cad/mm/data/extracted.json');
const OUT = path.join(process.cwd(), 'public/maps/loteamento-miguel-marques-lots.json');

const TARGET_W = 1600;   // largura do viewBox (unid. SVG)
const PAD = 48;          // margem no viewBox
const NEIGHBOR_R = 22000; // raio (mm) p/ considerar vizinhos na Voronoi

// ── Geometria ───────────────────────────────────────────────────────────────────
const shoelace = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };

/** Recorta polígono convexo pelo semiplano { p : (p-m)·n >= 0 } (Sutherland-Hodgman). */
function clipHalfPlane(poly, mx, my, nx, ny) {
  const out = [];
  const side = (px, py) => (px - mx) * nx + (py - my) * ny;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const sa = side(a[0], a[1]), sb = side(b[0], b[1]);
    if (sa >= 0) out.push(a);
    if ((sa < 0) !== (sb < 0)) {
      const t = sa / (sa - sb);
      out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(SRC)) { console.error('Falta extracted.json — rode scripts/cad/mm/extract.mjs primeiro.'); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const lots = data.lots.filter((l) => l.quadra && l.quadra !== '?' && Number.isFinite(l.cadX));

  // bbox CAD + transformação afim (flip Y: CAD sobe, SVG desce)
  const xs = lots.map((l) => l.cadX), ys = lots.map((l) => l.cadY);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = TARGET_W / (maxX - minX);
  const VBW = Math.round(TARGET_W + PAD * 2);
  const VBH = Math.round((maxY - minY) * scale + PAD * 2);
  const T = (x, y) => [ +(PAD + (x - minX) * scale).toFixed(2), +(PAD + (maxY - y) * scale).toFixed(2) ];

  // agrupa por quadra
  const byQ = new Map();
  for (const l of lots) { if (!byQ.has(l.quadra)) byQ.set(l.quadra, []); byQ.get(l.quadra).push(l); }

  let areaOk = 0, areaTot = 0;
  const outLots = [];
  for (const [q, group] of byQ) {
    for (const l of group) {
      // caixa inicial ∝ área (lado ≈ 1.35×√área); Voronoi vs vizinhos recorta as divisas reais
      const sideM = Math.sqrt(l.area_m2 || 160) * 1.35;          // metros
      const half = (sideM * 1000) / 2;                            // mm
      let poly = [
        [l.cadX - half, l.cadY - half], [l.cadX + half, l.cadY - half],
        [l.cadX + half, l.cadY + half], [l.cadX - half, l.cadY + half],
      ];
      for (const o of group) {
        if (o === l) continue;
        const dx = o.cadX - l.cadX, dy = o.cadY - l.cadY;
        if (Math.hypot(dx, dy) > NEIGHBOR_R) continue;
        // bissetriz: mantém o lado do lote l. normal aponta p/ l (de o → l): n = (l - o)
        const mx = (l.cadX + o.cadX) / 2, my = (l.cadY + o.cadY) / 2;
        poly = clipHalfPlane(poly, mx, my, l.cadX - o.cadX, l.cadY - o.cadY);
        if (poly.length < 3) break;
      }
      if (poly.length < 3) continue;
      const cellM2 = shoelace(poly) / 1e6;
      if (l.area_m2) { areaTot++; if (Math.abs(cellM2 - l.area_m2) / l.area_m2 <= 0.30) areaOk++; }
      const svgPts = poly.map(([x, y]) => T(x, y));
      const [lx, ly] = T(l.cadX, l.cadY);
      outLots.push({
        id: `${q}-${l.n}`,
        quadra: q,
        lote: String(l.n),
        points: svgPts.map((p) => p.join(',')).join(' '),
        area: l.area_m2 ?? 0,
        labelX: lx,
        labelY: ly,
        status: 'disponivel',     // enriquecido ao vivo pelo Supabase (subdivision_lots)
        price: null,
      });
    }
  }
  outLots.sort((a, b) => (a.quadra === b.quadra ? +a.lote - +b.lote : a.quadra.localeCompare(b.quadra)));

  // rótulos de rua (transformados)
  const streetLabels = (data.streets || []).map((s) => { const [x, y] = T(s.x, s.y); return { x, y, name: s.name }; });

  const out = {
    viewBox: `0 0 ${VBW} ${VBH}`,
    totalLots: outLots.length,
    stats: { disponiveis: outLots.length, vendidos: 0, negociacao: 0, mapeados: outLots.length, semPreco: outLots.length },
    lots: outLots,
    amenities: [],
    greenAreas: [],
    streets: [],
    perimeter: [],
    streetLabels,
    entrance: null,
    note: 'Geometria reconstruída do CAD oficial (posições/áreas reais; células Voronoi). Fonte: ' + data.source,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));

  console.log('viewBox:', out.viewBox, '| lotes:', outLots.length, '| ruas:', streetLabels.length);
  console.log(`Área das células dentro de ±30% do m² declarado: ${areaOk}/${areaTot} (${(areaOk / areaTot * 100).toFixed(1)}%)`);
  console.log('Saída:', path.relative(process.cwd(), OUT), '(' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB)');
}

main();
