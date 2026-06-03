#!/usr/bin/env python3
"""
Extrator definitivo dos lotes do Alto Bellevue a partir do DXF oficial.

O modelspace do DXF contém o loteamento desenhado 3x (3 cópias lado a lado).
Este script:
  1. Lê apenas o modelspace (ignora Layout1/Layout2 = paperspace).
  2. Detecta as cópias por lacunas de bounding box e seleciona UMA cópia completa.
  3. Atribui número do lote pelo texto NUMERO_DOS_LOTES contido no polígono.
  4. Atribui quadra por point-in-polygon contra a camada DB2 QUADRAS.
  5. Casa cada lote com a tabela oficial de preços (quadra+lote).
  6. Normaliza coordenadas para um único viewBox SVG (flip Y, escala única).
  7. Emite public/maps/alto-bellevue-lots.json (mapa único, sem duplicação).

Uso:
  python3 scripts/extract_lots_from_dxf.py <arquivo.dxf | cache.json>
"""

import sys, os, json, math

TARGET_W = 1200
TARGET_H = 900
PAD = 40

PRICES_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "data", "alto-bellevue-prices.json")
OUT_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "maps", "alto-bellevue-lots.json")

LOT_AREA_MIN = 60      # m²
LOT_AREA_MAX = 4000    # m²
REGION_GAP = 150       # m — lacuna mínima entre cópias


# ───────────────────────── geometria ─────────────────────────

def poly_area_m2(pts):
    n = len(pts)
    if n < 3:
        return 0.0
    a = sum(pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1] for i in range(n))
    return abs(a) / 2


def centroid(pts):
    return (sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts))


def point_in_polygon(px, py, polygon):
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / ((yj - yi) or 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def dist2(ax, ay, bx, by):
    return (ax - bx) ** 2 + (ay - by) ** 2


def parse_area(text):
    """'436,10 m²' -> 436.10 ; '1.234,56' -> 1234.56"""
    s = "".join(ch for ch in text if ch.isdigit() or ch in ".,")
    if "." in s and "," in s:
        s = s.replace(".", "").replace(",", ".")
    else:
        s = s.replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def split_bands(vals, gap):
    """Agrupa valores 1D em bandas separadas por lacunas > gap."""
    s = sorted(vals)
    bands = [[s[0]]]
    for v in s[1:]:
        if v - bands[-1][-1] > gap:
            bands.append([v])
        else:
            bands[-1].append(v)
    return [(b[0], b[-1]) for b in bands]


def band_of(v, bands):
    for i, (a, b) in enumerate(bands):
        if a - 1 <= v <= b + 1:
            return i
    return -1


# ───────────────────────── carga ─────────────────────────

def load_from_dxf(path):
    import ezdxf
    from ezdxf.path import make_path
    print(f"Lendo DXF: {path}")
    doc = ezdxf.readfile(path)
    msp = doc.modelspace()

    def get_text(e):
        try:
            return e.dxf.text.strip()
        except Exception:
            try:
                return e.text.strip()
            except Exception:
                return ""

    def poly_pts(e):
        return [(round(v[0], 3), round(v[1], 3)) for v in e.get_points()]

    def flatten(e, dist=0.4):
        try:
            p = make_path(e)
            return [(round(pt.x, 3), round(pt.y, 3)) for pt in p.flattening(dist)]
        except Exception:
            try:
                return poly_pts(e)
            except Exception:
                return []

    polys, calcada, poligonal, linha_br, limite = [], [], [], [], []
    for e in msp.query("LWPOLYLINE LINE ARC POLYLINE"):
        lyr = e.dxf.layer
        if lyr == "REGIAO_LOTES" and e.dxftype() == "LWPOLYLINE":
            pts = poly_pts(e)
            if len(pts) >= 3:
                polys.append(pts)
        elif lyr == "DB2_CALCADA":
            f = flatten(e)
            if len(f) >= 2:
                calcada.append(f)
        elif lyr == "POLIGONAL":
            f = flatten(e)
            if len(f) >= 2:
                poligonal.append(f)
        elif lyr == "DB2 LINHA DA BR":
            f = flatten(e)
            if len(f) >= 2:
                linha_br.append(f)
        elif lyr == "DB2 LIMITE DO LOTE" and e.dxftype() == "LWPOLYLINE":
            # delimitação oficial do condomínio: polígono FECHADO e grande
            # (as cópias têm 1 cada, ~62 vértices). Ignora notações pequenas.
            f = flatten(e)
            if len(f) >= 10:
                limite.append(f)

    def collect(layer):
        out = []
        for e in msp.query("TEXT MTEXT"):
            if e.dxf.layer != layer:
                continue
            t = get_text(e)
            if not t:
                continue
            try:
                p = e.dxf.insert
                out.append([round(p.x, 3), round(p.y, 3), t])
            except Exception:
                pass
        return out

    return {
        "polys": polys,
        "calcada": calcada,
        "poligonal": poligonal,
        "linha_br": linha_br,
        "limite": limite,
        "numero": collect("NUMERO_DOS_LOTES"),
        "quadra": collect("IDENT_DAS_QUADRAS"),
        "area": collect("AREA_DOS_LOTES"),
        "ruas": collect("DB2_NOME_DAS_RUAS"),
    }


def load_geom(path):
    if path.lower().endswith(".json"):
        print(f"Lendo cache: {path}")
        return json.load(open(path))
    return load_from_dxf(path)


# ───────────────────────── build ─────────────────────────

def detect_regions(cents):
    """Detecta as cópias do loteamento por lacunas de bounding box."""
    xs = [c[0] for c in cents]
    ys = [c[1] for c in cents]
    xb = split_bands(xs, REGION_GAP)
    yb = split_bands(ys, REGION_GAP)
    regions = {}
    for i, (cx, cy) in enumerate(cents):
        key = (band_of(cx, xb), band_of(cy, yb))
        regions.setdefault(key, []).append(i)
    return regions


def process_region(region, geom, prices):
    """Constrói os lotes de UMA cópia do loteamento. Retorna (out, matched)."""
    rc = [c for _, _, c in region]
    rx0, rx1 = min(c[0] for c in rc), max(c[0] for c in rc)
    ry0, ry1 = min(c[1] for c in rc), max(c[1] for c in rc)

    def in_region(x, y):
        return rx0 - REGION_GAP <= x <= rx1 + REGION_GAP and ry0 - REGION_GAP <= y <= ry1 + REGION_GAP

    numero = [(x, y, t) for x, y, t in geom["numero"] if in_region(x, y)]
    quadra_texts = [(x, y, t) for x, y, t in geom["quadra"] if in_region(x, y)]
    area_texts = [(x, y, t) for x, y, t in geom["area"] if in_region(x, y)]
    rua_texts = [(x, y, t) for x, y, t in geom.get("ruas", []) if in_region(x, y)]

    def polyline_in_region(pl):
        mx = sum(p[0] for p in pl) / len(pl)
        my = sum(p[1] for p in pl) / len(pl)
        return in_region(mx, my)

    calcada = [pl for pl in geom.get("calcada", []) if polyline_in_region(pl)]
    linha_br = [pl for pl in geom.get("linha_br", []) if polyline_in_region(pl)]

    # delimitação oficial do condomínio: dentre os polígonos fechados da camada
    # DB2 LIMITE DO LOTE cujo centroide cai NESTA cópia, escolhe o de maior área.
    def centroid_in_strict(pl):
        mx = sum(p[0] for p in pl) / len(pl)
        my = sum(p[1] for p in pl) / len(pl)
        return rx0 <= mx <= rx1 and ry0 <= my <= ry1
    limite_in = [pl for pl in geom.get("limite", []) if centroid_in_strict(pl)]
    perimeter_poly = max(limite_in, key=poly_area_m2) if limite_in else None

    def nearest_quadra_letter(cx, cy):
        best, bd = None, float("inf")
        for x, y, t in quadra_texts:
            if len(t) <= 2 and t.isalpha():
                d = dist2(cx, cy, x, y)
                if d < bd:
                    bd, best = d, t.upper()
        return best or "?"

    # classifica polígonos: lote (tem número dentro) vs área reservada.
    # Para cada lote captura também a área de levantamento (texto AREA_DOS_LOTES dentro).
    lots_raw, reserved = [], []
    for pts, area, (cx, cy) in region:
        num, best_d = None, float("inf")
        for x, y, t in numero:
            if point_in_polygon(x, y, pts):
                d = dist2(cx, cy, x, y)
                if d < best_d:
                    best_d, num = d, t
        if num and num.strip().isdigit():
            surveyed = None
            for x, y, t in area_texts:
                if point_in_polygon(x, y, pts):
                    surveyed = parse_area(t)
                    break
            lots_raw.append({
                "pts": pts, "area": area, "cx": cx, "cy": cy,
                "num": int(num.strip()),
                "surveyed": surveyed if surveyed is not None else area,
            })
        else:
            reserved.append((pts, (cx, cy)))

    # normalização para SVG (TODA a geometria que será desenhada nesta cópia:
    # lotes + áreas + delimitação + calçadas + linha da BR) — garante que nada
    # estoura o viewBox (correção do overflow anterior do brLine).
    all_pts = (
        [p for l in lots_raw for p in l["pts"]]
        + [p for pts, _ in reserved for p in pts]
        + (list(perimeter_poly) if perimeter_poly else [])
        + [p for pl in calcada for p in pl]
        + [p for pl in linha_br for p in pl]
    )
    xs = [p[0] for p in all_pts]
    ys = [p[1] for p in all_pts]
    min_x, max_x, min_y, max_y = min(xs), max(xs), min(ys), max(ys)
    rxs = (max_x - min_x) or 1
    rys = (max_y - min_y) or 1
    scale = min((TARGET_W - 2 * PAD) / rxs, (TARGET_H - 2 * PAD) / rys)
    draw_w = rxs * scale + 2 * PAD
    draw_h = rys * scale + 2 * PAD

    def to_svg(x, y):
        sx = (x - min_x) * scale + PAD
        sy = draw_h - ((y - min_y) * scale + PAD)  # flip Y
        return round(sx, 2), round(sy, 2)

    # ── matching ótimo com a tabela de preços por (número + área) ──
    # Para cada número de lote, pareia polígonos e linhas da tabela por área
    # ordenada (k-ésimo menor ↔ k-ésimo menor). Minimiza o erro total e evita
    # "roubo" de linhas do matching guloso. A quadra é herdada da tabela oficial.
    rows_by_num = {}
    for r in prices:
        rows_by_num.setdefault(int(r["lote"]), []).append(r)

    by_num = {}
    for l in lots_raw:
        l["row"] = None
        by_num.setdefault(l["num"], []).append(l)

    matched = 0
    for num, group in by_num.items():
        rows = sorted(rows_by_num.get(num, []), key=lambda r: float(r["area_m2"]))
        group.sort(key=lambda l: l["surveyed"])
        for l, r in zip(group, rows):  # pareia em ordem crescente de área
            l["row"] = r
            matched += 1

    # monta lotes
    lots = []
    used_ids = set()
    for l in lots_raw:
        pr = l["row"]
        quadra = str(pr["quadra"]).upper() if pr else nearest_quadra_letter(l["cx"], l["cy"])
        lote_str = str(l["num"]).zfill(2)
        base_id = f"{quadra}-{lote_str}"
        lot_id = base_id
        sfx = 1
        while lot_id in used_ids:  # garante unicidade (lotes sem tabela)
            sfx += 1
            lot_id = f"{base_id}-{sfx}"
        used_ids.add(lot_id)
        svg_pts = [to_svg(x, y) for x, y in l["pts"]]
        pts_str = " ".join(f"{p[0]},{p[1]}" for p in svg_pts)
        scx, scy = to_svg(l["cx"], l["cy"])

        if pr:
            status = "disponivel"
            entry = {
                "valor": pr["preco_lote"],
                "valorVista": pr.get("preco_vista"),
                "entrada": pr["entrada"],
                "p12": {"total": pr["p12_total"], "parcela": pr["p12_parcela"]},
                "p36": {"total": pr["p36_total"], "parcela": pr["p36_parcela"]},
                "p60": {"total": pr["p60_total"], "parcela": pr["p60_parcela"]},
                "p120": {"total": pr["p120_total"], "parcela": pr["p120_parcela"]},
                "metragem": pr["area_m2"],
            }
        else:
            status = "vendido"  # sem preço na tabela oficial -> indisponível
            entry = {"valor": None, "metragem": round(l["surveyed"], 2)}

        lots.append({
            "id": lot_id,
            "quadra": quadra,
            "lote": lote_str,
            "points": pts_str,
            "area": round(pr["area_m2"] if pr else l["surveyed"]),
            "labelX": scx,
            "labelY": scy,
            "status": status,
            "price": pr["preco_lote"] if pr else None,
            **entry,
        })

    # áreas reservadas (verdes/institucionais) — camada de contexto, não clicável
    green = []
    for pts, _ in reserved:
        svg_pts = [to_svg(x, y) for x, y in pts]
        green.append(" ".join(f"{p[0]},{p[1]}" for p in svg_pts))

    # ── camadas de contexto: ruas (calçadas), perímetro, BR, nomes de rua ──
    def polyline_to_svg(pl):
        return " ".join(f"{a},{b}" for a, b in (to_svg(x, y) for x, y in pl))

    streets = [polyline_to_svg(pl) for pl in calcada]
    perimeter = [polyline_to_svg(perimeter_poly)] if perimeter_poly else []
    br_line = [polyline_to_svg(pl) for pl in linha_br]

    # rótulos de rua (deduplicados por nome, posição média)
    street_label_groups = {}
    for x, y, t in rua_texts:
        name = " ".join(t.split()).upper()
        street_label_groups.setdefault(name, []).append((x, y))
    street_labels = []
    for name, pts in street_label_groups.items():
        mx = sum(p[0] for p in pts) / len(pts)
        my = sum(p[1] for p in pts) / len(pts)
        sx, sy = to_svg(mx, my)
        street_labels.append({"x": sx, "y": sy, "name": name})

    # entrada do condomínio: rótulo de rua com ACESSO/ENTRADA/PORTARIA;
    # fallback = ponto mais ao sul do perímetro (frente para a BR).
    entrance = None
    for x, y, t in rua_texts:
        up = t.upper()
        if any(k in up for k in ("ACESSO", "ENTRADA", "PORTARIA")):
            sx, sy = to_svg(x, y)
            entrance = {"x": sx, "y": sy, "label": "Entrada / Acesso"}
            break
    if entrance is None and perimeter_poly:
        ex, ey = min(perimeter_poly, key=lambda p: p[1])  # menor Y (sul = frente p/ BR)
        sx, sy = to_svg(ex, ey)
        entrance = {"x": sx, "y": sy, "label": "Entrada / Acesso"}

    # ordena por quadra, lote
    lots.sort(key=lambda l: (l["quadra"], int(l["lote"])))

    disp = sum(1 for l in lots if l["status"] == "disponivel")
    vend = sum(1 for l in lots if l["status"] == "vendido")
    neg = sum(1 for l in lots if l["status"] == "negociacao")

    out = {
        "viewBox": f"0 0 {round(draw_w, 2)} {round(draw_h, 2)}",
        "totalLots": len(lots),
        "stats": {
            "disponiveis": disp,
            "vendidos": vend,
            "negociacao": neg,
            "mapeados": len(lots),
            "semPreco": vend,
        },
        "lots": lots,
        "greenAreas": green,
        "streets": streets,
        "perimeter": perimeter,
        "brLine": br_line,
        "streetLabels": street_labels,
        "entrance": entrance,
        "amenities": amenities_template(draw_w, draw_h),
    }
    return out, matched


def build(geom):
    prices = json.load(open(PRICES_PATH))

    # filtra por área de lote plausível e calcula centroides
    polys = []
    for pts in geom["polys"]:
        pts = [(p[0], p[1]) for p in pts]
        a = poly_area_m2(pts)
        if LOT_AREA_MIN <= a <= LOT_AREA_MAX:
            polys.append((pts, a, centroid(pts)))
    print(f"Polígonos REGIAO_LOTES em faixa de lote: {len(polys)} (de {len(geom['polys'])})")

    cents = [c for _, _, c in polys]
    regions = detect_regions(cents)
    print(f"Cópias detectadas: {len(regions)} -> "
          + ", ".join(f"{k}:{len(v)}" for k, v in sorted(regions.items())))

    # processa cada cópia e escolhe a de MAIOR cobertura da tabela oficial
    best_out, best_matched, best_key = None, -1, None
    for key, idxs in sorted(regions.items()):
        region = [polys[i] for i in idxs]
        out, matched = process_region(region, geom, prices)
        print(f"  cópia {key}: {out['totalLots']} lotes, {matched} casados")
        if matched > best_matched:
            best_out, best_matched, best_key = out, matched, key
    print(f"Cópia escolhida: {best_key} ({best_matched} casados)")
    return best_out, prices


def amenities_template(w, h):
    return [
        {"id": "portaria", "label": "Portaria Principal", "icon": "🏛️", "color": "#C8A44A",
         "x": round(w * 0.5), "y": round(h * 0.94)},
        {"id": "lazer", "label": "Área de Lazer / Clube", "icon": "🏊", "color": "#0ea5e9",
         "x": round(w * 0.5), "y": round(h * 0.5)},
    ]


def validate(out, prices):
    print("\n── VALIDAÇÃO ──")
    lots = out["lots"]
    n = len(lots)
    ids = set()
    dup = 0
    for l in lots:
        if l["id"] in ids:
            dup += 1
        ids.add(l["id"])
    quadras = sorted(set(l["quadra"] for l in lots))
    price_keys = {(str(r["quadra"]).upper(), int(r["lote"])) for r in prices}
    lot_keys = {(l["quadra"], int(l["lote"])) for l in lots}
    matched = len(price_keys & lot_keys)
    missing = sorted(price_keys - lot_keys)
    print(f"  Total lotes:          {n}")
    print(f"  IDs duplicados:       {dup}")
    print(f"  Quadras:              {quadras}")
    print(f"  Casados c/ tabela:    {matched}/{len(price_keys)}")
    print(f"  Tabela sem geometria: {len(missing)} {missing[:15]}")
    print(f"  Disponíveis:          {out['stats']['disponiveis']}")
    print(f"  Vendidos (sem preço): {out['stats']['vendidos']}")
    print(f"  viewBox:              {out['viewBox']}")
    print(f"  Áreas verdes:         {len(out['greenAreas'])}")
    print(f"  Ruas (calçadas):      {len(out.get('streets', []))}")
    print(f"  Perímetro:            {len(out.get('perimeter', []))}")
    print(f"  Linha BR:             {len(out.get('brLine', []))}")
    print(f"  Nomes de rua:         {len(out.get('streetLabels', []))}")
    print(f"  Entrada:              {'sim' if out.get('entrance') else 'não'}")

    # ── validação geométrica: perímetro fecha e contém os lotes ──
    def parse_pts(s):
        return [tuple(map(float, pair.split(","))) for pair in s.split()]

    vb = [float(v) for v in out["viewBox"].split()]
    vb_w, vb_h = vb[2], vb[3]
    all_xy = []
    for l in lots:
        all_xy += parse_pts(l["points"])
    for s in out.get("streets", []) + out.get("perimeter", []) + out.get("brLine", []) + out.get("greenAreas", []):
        all_xy += parse_pts(s)
    within = all(-0.5 <= x <= vb_w + 0.5 and -0.5 <= y <= vb_h + 0.5 for x, y in all_xy)
    bx = (min(p[0] for p in all_xy), min(p[1] for p in all_xy),
          max(p[0] for p in all_xy), max(p[1] for p in all_xy))

    encloses = None
    if out.get("perimeter"):
        peri = parse_pts(out["perimeter"][0])
        inside = sum(1 for l in lots if point_in_polygon(l["labelX"], l["labelY"], peri))
        encloses = inside
    print(f"  Geometria no viewBox: {'sim' if within else 'NÃO'} "
          f"bbox=({bx[0]:.0f},{bx[1]:.0f})-({bx[2]:.0f},{bx[3]:.0f}) vb={vb_w:.0f}x{vb_h:.0f}")
    if encloses is not None:
        print(f"  Lotes dentro do limite: {encloses}/{n}")

    geom_ok = within and (encloses is None or encloses >= n - 5)
    ok = dup == 0 and n > 300 and geom_ok
    print("  RESULTADO:", "✅ OK" if ok else "⚠️ revisar")
    return ok


def main(path):
    geom = load_geom(path)
    out, prices = build(geom)
    validate(out, prices)
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"\n✅ {out['totalLots']} lotes → {os.path.abspath(OUT_PATH)}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/extract_lots_from_dxf.py <arquivo.dxf | cache.json>")
        sys.exit(1)
    main(sys.argv[1])
