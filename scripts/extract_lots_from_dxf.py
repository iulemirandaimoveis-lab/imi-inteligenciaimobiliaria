#!/usr/bin/env python3
"""
Extrai polígonos de lotes do arquivo DXF do Alto Bellevue.
Usa texto das camadas NUMERO_DOS_LOTES e IDENT_DAS_QUADRAS para identificar cada lote.

Uso: python3 scripts/extract_lots_from_dxf.py <arquivo.dxf>
"""

import sys, json, math, os

try:
    import ezdxf
except ImportError:
    print("Instale: pip3 install ezdxf")
    sys.exit(1)

TARGET_W = 1200
TARGET_H = 900
PAD = 40


def poly_area_m2(pts):
    n = len(pts)
    if n < 3:
        return 0
    a = sum(pts[i][0] * pts[(i+1)%n][1] - pts[(i+1)%n][0] * pts[i][1] for i in range(n))
    return abs(a) / 2


def centroid(pts):
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    return cx, cy


def dist(ax, ay, bx, by):
    return math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)


def get_text(e):
    try:
        return e.dxf.text.strip()
    except Exception:
        try:
            return e.text.strip()
        except Exception:
            return ""


def point_in_polygon(px, py, polygon):
    """Ray casting algorithm."""
    n = len(polygon)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = polygon[i]
        xj, yj = polygon[j]
        if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def main(dxf_path: str):
    print(f"Lendo: {dxf_path}")
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()

    # --- 1. Coletar textos de rótulos ---
    lot_num_texts = []    # [(x, y, text)] from NUMERO_DOS_LOTES
    quadra_texts = []     # [(x, y, text)] from IDENT_DAS_QUADRAS

    for e in msp.query("TEXT MTEXT"):
        layer = e.dxf.layer
        text = get_text(e)
        if not text:
            continue
        try:
            pos = e.dxf.insert
            x, y = pos.x, pos.y
        except Exception:
            continue

        if layer == "NUMERO_DOS_LOTES":
            lot_num_texts.append((x, y, text))
        elif layer == "IDENT_DAS_QUADRAS":
            # Apenas letras únicas = quadras reais (não "CANTEIRO 01" etc.)
            if len(text) <= 2 and text.isalpha():
                quadra_texts.append((x, y, text))

    print(f"Textos de número: {len(lot_num_texts)}, quadras: {len(quadra_texts)}")

    # --- 2. Coletar polígonos de lotes ---
    LOT_LAYERS = {"REGIAO_LOTES", "DB2 LOTES"}
    raw_polys = []
    for e in msp.query("LWPOLYLINE"):
        if e.dxf.layer not in LOT_LAYERS:
            continue
        pts = [(v[0], v[1]) for v in e.get_points()]
        if len(pts) < 3:
            continue
        area = poly_area_m2(pts)
        if area < 60 or area > 4000:
            continue
        raw_polys.append(pts)

    if not raw_polys:
        print("Nenhum polígono encontrado nas camadas de lotes. Tentando todas LWPOLYLINE...")
        for e in msp.query("LWPOLYLINE"):
            pts = [(v[0], v[1]) for v in e.get_points()]
            if len(pts) < 3:
                continue
            area = poly_area_m2(pts)
            if 60 <= area <= 4000:
                raw_polys.append(pts)

    print(f"Polígonos candidatos: {len(raw_polys)}")

    # --- 3. Normalização para espaço SVG ---
    all_pts = [p for poly in raw_polys for p in poly]
    xs = [p[0] for p in all_pts]
    ys = [p[1] for p in all_pts]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    rx = max_x - min_x or 1
    ry = max_y - min_y or 1
    scale = min((TARGET_W - 2*PAD) / rx, (TARGET_H - 2*PAD) / ry)

    def to_svg(x, y):
        sx = (x - min_x) * scale + PAD
        sy = TARGET_H - ((y - min_y) * scale + PAD)   # flip Y
        return round(sx, 2), round(sy, 2)

    def dxf_centroid(pts):
        cx = sum(p[0] for p in pts) / len(pts)
        cy = sum(p[1] for p in pts) / len(pts)
        return cx, cy

    # --- 4. Associar textos a polígonos ---
    # Para cada polígono, encontrar o número do lote mais próximo (dentro do polígono primeiro)
    used_nums = set()
    lots = []

    for poly in raw_polys:
        cx, cy = dxf_centroid(poly)
        area = poly_area_m2(poly)

        # Encontrar número do lote: preferir texto dentro do polígono
        best_num = None
        best_dist = float('inf')
        for tx, ty, text in lot_num_texts:
            if text in used_nums:
                continue
            d = dist(cx, cy, tx, ty)
            # check if inside polygon (more reliable)
            if point_in_polygon(tx, ty, poly):
                if d < best_dist:
                    best_dist = d
                    best_num = (text, tx, ty)
            elif best_num is None and d < best_dist and d < (math.sqrt(area) * 3):
                best_dist = d
                best_num = (text, tx, ty)

        lote_num = best_num[0] if best_num else None

        # Encontrar quadra: texto de quadra mais próximo do centroide
        if quadra_texts:
            qx, qy, qlabel = min(quadra_texts, key=lambda t: dist(cx, cy, t[0], t[1]))
            quadra = qlabel
        else:
            quadra = "A"

        if best_num:
            used_nums.add(best_num[0])

        svg_pts = [to_svg(x, y) for x, y in poly]
        pts_str = " ".join(f"{p[0]},{p[1]}" for p in svg_pts)
        scx, scy = to_svg(cx, cy)

        lot_id = f"{quadra}-{lote_num or str(len(lots)+1).zfill(2)}"

        lots.append({
            "id": lot_id,
            "quadra": quadra,
            "lote": lote_num or str(len(lots)+1).zfill(2),
            "points": pts_str,
            "area": round(area),
            "labelX": scx,
            "labelY": scy,
            "status": "disponivel",
            "price": None,
        })

    # --- 5. Deduplicar lotes com mesmo id ---
    seen_ids = {}
    final_lots = []
    for lot in lots:
        lid = lot["id"]
        if lid not in seen_ids:
            seen_ids[lid] = True
            final_lots.append(lot)
    lots = final_lots

    # --- 6. Amenidades (posições estimadas no espaço SVG) ---
    # Posições geradas proporcionalmente à planta — ajustável via admin
    amenities = [
        {"id": "piscina", "label": "Piscina", "icon": "🏊", "color": "#0ea5e9",
         "x": round(TARGET_W * 0.18), "y": round(TARGET_H * 0.22)},
        {"id": "quadra", "label": "Quadra Poliesportiva", "icon": "⛹️", "color": "#f97316",
         "x": round(TARGET_W * 0.28), "y": round(TARGET_H * 0.18)},
        {"id": "coworking", "label": "Coworking / Gourmet", "icon": "☕", "color": "#8b5cf6",
         "x": round(TARGET_W * 0.15), "y": round(TARGET_H * 0.35)},
        {"id": "academia", "label": "Academia", "icon": "🏋️", "color": "#ef4444",
         "x": round(TARGET_W * 0.22), "y": round(TARGET_H * 0.30)},
        {"id": "playground", "label": "Playground", "icon": "🎠", "color": "#22c55e",
         "x": round(TARGET_W * 0.20), "y": round(TARGET_H * 0.42)},
        {"id": "portaria", "label": "Portaria Principal", "icon": "🏛️", "color": "#C8A44A",
         "x": round(TARGET_W * 0.50), "y": round(TARGET_H * 0.95)},
    ]

    # --- 7. Stats ---
    disp = sum(1 for l in lots if l["status"] == "disponivel")
    vend = sum(1 for l in lots if l["status"] == "vendido")
    neg = sum(1 for l in lots if l["status"] == "negociacao")
    sem_preco = sum(1 for l in lots if not l["price"])

    output = {
        "viewBox": f"0 0 {TARGET_W} {TARGET_H}",
        "totalLots": len(lots),
        "stats": {
            "disponiveis": disp,
            "vendidos": vend,
            "negociacao": neg,
            "mapeados": len(lots),
            "semPreco": sem_preco,
        },
        "lots": lots,
        "amenities": amenities,
    }

    out_path = os.path.join(os.path.dirname(__file__), "..", "public", "maps", "alto-bellevue-lots.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    quadras_found = sorted(set(l["quadra"] for l in lots))
    print(f"\n✅ {len(lots)} lotes extraídos → {os.path.abspath(out_path)}")
    print(f"   Quadras: {quadras_found}")
    print(f"   Stats: {output['stats']}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/extract_lots_from_dxf.py <arquivo.dxf>")
        sys.exit(1)
    main(sys.argv[1])
