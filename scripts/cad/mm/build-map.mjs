/**
 * Miguel Marques — gera o mapa no CONTRATO UNIFICADO do motor.
 *
 * Lê scripts/cad/mm/data/extracted.json (posições/áreas/quadras REAIS do CAD) e
 * produz public/maps/loteamento-miguel-marques-lots.json no formato `LotMapData`
 * que `InteractiveLotMap`/`useLotMap` consomem — o MESMO motor do Alto Bellevue.
 *
 * Geometria dos lotes: o DXF não tem polígonos fechados (lotes = linhas soltas), mas
 * os centroides REAIS formam uma grade limpa (faixas de lotes empilhados, batendo com
 * o satélite). Cada célula é uma **grade axis-Voronoi**: testada = meio-caminho até os
 * vizinhos da mesma coluna; profundidade = área ÷ testada, com o fundo no meio-caminho
 * até a coluna pareada. Usa só posições/áreas reais e ladrilha com ruas entre os pares.
 * Quando o DXF trouxer lotes como polígono fechado, o contorno vira EXATO (pixel-a-pixel).
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

// ── Geometria ───────────────────────────────────────────────────────────────────
const shoelace = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };

function main() {
  if (!fs.existsSync(SRC)) { console.error('Falta extracted.json — rode scripts/cad/mm/extract.mjs primeiro.'); process.exit(1); }
  const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  // Exclui lotes `stray` (fragmento sem rótulo de quadra, longe de qualquer quadra —
  // posição/quadra incertas). Eles geravam IDs duplicados (ex.: F-3/F-4/F-5) →
  // chaves React/seleção colidindo. Tratados como pendentes (revisar c/ PDF), como o
  // B-24 do Alto Bellevue. Não inventar: melhor não renderizar do que renderizar errado.
  const lots = data.lots.filter((l) => l.quadra && l.quadra !== '?' && Number.isFinite(l.cadX) && !l.stray);

  // ── De-rotação ──────────────────────────────────────────────────────────────
  // O loteamento é desenhado girado (~41°) no CAD → sem corrigir, o mapa sai torto
  // (ruas na diagonal). Usa o ângulo REAL das bordas de lote (A-DETL-THIN), medido
  // pelo extractor (rotationDeg), e gira tudo para deixar as ruas na horizontal/
  // vertical. Posições continuam reais — só o referencial é alinhado.
  const theta = ((data.rotationDeg || 0) * Math.PI) / 180;
  const cosR = Math.cos(-theta), sinR = Math.sin(-theta);
  const cmx = lots.reduce((s, l) => s + l.cadX, 0) / lots.length;
  const cmy = lots.reduce((s, l) => s + l.cadY, 0) / lots.length;
  for (const l of lots) {
    const dx = l.cadX - cmx, dy = l.cadY - cmy;
    l.cadX = cmx + dx * cosR - dy * sinR;
    l.cadY = cmy + dx * sinR + dy * cosR;
  }

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

  // de-rotação aplicada também aos vértices de polígono real (coords CAD cruas)
  const Rot = (x, y) => [cmx + (x - cmx) * cosR - (y - cmy) * sinR, cmy + (x - cmx) * sinR + (y - cmy) * cosR];

  // ── Contorno por GRADE (axis-Voronoi dos centroides REAIS) ───────────────────
  // Os centroides REAIS formam uma grade limpa: faixas (colunas) de lotes empilhados
  // (confirmado renderizando os centroides — batem com o satélite). Após de-rotação,
  // a TESTADA (frente) fica no eixo vertical (vizinhos da mesma coluna, bem próximos)
  // e a PROFUNDIDADE no eixo horizontal. Para cada lote:
  //   • altura (testada) = meio-caminho até os vizinhos de cima/baixo → ladrilha a coluna;
  //   • largura = área ÷ altura, com o FUNDO no meio-caminho até a coluna pareada
  //     (costas-com-costas) e a FRENTE (rua) recebendo o restante.
  // Dá m² correto, ruas entre os pares e formato fiel. (Edges/Voronoi-caixa antigos
  // saíam errados: tira/barra comprida — a área batia mas o FORMATO não.)
  const COLTOL = 5000, ROWTOL = 5000, MAXFR = 22000, MAXDP = 40000; // mm
  function gridBox(l) {
    let up = Infinity, down = Infinity, left = Infinity, right = Infinity;
    for (const o of lots) {
      if (o === l) continue;
      if (Math.abs(o.cadX - l.cadX) < COLTOL) { const dy = o.cadY - l.cadY; if (dy > 0) { if (dy < up) up = dy; } else if (-dy < down) down = -dy; }
      if (Math.abs(o.cadY - l.cadY) < ROWTOL) { const dx = o.cadX - l.cadX; if (dx > 0) { if (dx < right) right = dx; } else if (-dx < left) left = -dx; }
    }
    const hUp = (isFinite(up) && up < MAXFR) ? up / 2 : ((isFinite(down) && down < MAXFR) ? down / 2 : 5000);
    const hDown = (isFinite(down) && down < MAXFR) ? down / 2 : hUp;
    const height = hUp + hDown;
    const width = l.area_m2 ? (l.area_m2 * 1e6) / height : 16000;
    const gl = (isFinite(left) && left < MAXDP) ? left / 2 : Infinity;
    const gr = (isFinite(right) && right < MAXDP) ? right / 2 : Infinity;
    let hL, hR;
    if (gl < gr) { hL = gl; hR = Math.max(2000, width - hL); }
    else if (gr < gl) { hR = gr; hL = Math.max(2000, width - hR); }
    else { hL = width / 2; hR = width / 2; }
    return [[l.cadX - hL, l.cadY - hDown], [l.cadX + hR, l.cadY - hDown], [l.cadX + hR, l.cadY + hUp], [l.cadX - hL, l.cadY + hUp]];
  }

  let areaOk = 0, areaTot = 0, nExato = 0, nGrid = 0;
  const outLots = [];
  for (const [q, group] of byQ) {
    for (const l of group) {
      let poly = null;
      // (1) Polígono fechado do CAD → contorno EXATO (quando o DXF tiver lotes fechados).
      if (l.polygon && l.polygon.length >= 3) { poly = l.polygon.map(([x, y]) => Rot(x, y)); nExato++; }
      // (2) Grade axis-Voronoi dos centroides REAIS (testada + profundidade).
      if (!poly) { poly = gridBox(l); nGrid++; }
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

  // Garantia defensiva: IDs únicos (id = chave React + chave de status/seleção e de
  // enriquecimento Supabase QUADRA-lote). Se sobrar duplicata, descarta e avisa.
  const seenId = new Set();
  const dupIds = [];
  const uniqueLots = outLots.filter((l) => { if (seenId.has(l.id)) { dupIds.push(l.id); return false; } seenId.add(l.id); return true; });
  if (dupIds.length) console.warn('⚠️  IDs duplicados removidos:', JSON.stringify(dupIds));
  outLots.length = 0; outLots.push(...uniqueLots);

  // rótulos de rua — mesma de-rotação dos lotes, depois transforma
  const R = (x, y) => [cmx + (x - cmx) * cosR - (y - cmy) * sinR, cmy + (x - cmx) * sinR + (y - cmy) * cosR];
  const streetLabels = (data.streets || []).map((s) => { const [rx, ry] = R(s.x, s.y); const [x, y] = T(rx, ry); return { x, y, name: s.name }; });

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
    note: `Geometria reconstruída do CAD oficial (posições/áreas reais; de-rotação ${(theta * 180 / Math.PI).toFixed(1)}°; células Voronoi). Fonte: ${data.source}`,
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out));

  console.log('De-rotação aplicada:', (theta * 180 / Math.PI).toFixed(2), '°');
  console.log(`Contorno: EXATO(CAD)=${nExato} | GRADE(axis-Voronoi)=${nGrid}`);
  console.log('viewBox:', out.viewBox, '| lotes:', outLots.length, '| ruas:', streetLabels.length);
  console.log(`Área das células dentro de ±30% do m² declarado: ${areaOk}/${areaTot} (${(areaOk / areaTot * 100).toFixed(1)}%)`);
  console.log('Saída:', path.relative(process.cwd(), OUT), '(' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB)');
}

main();
