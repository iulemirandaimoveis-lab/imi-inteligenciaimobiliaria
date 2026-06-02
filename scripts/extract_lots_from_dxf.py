#!/usr/bin/env python3
"""
Extrai polígonos de lotes do arquivo DXF (convertido do DWG) do Alto Bellevue.

Uso:
  1. Converter DWG → DXF via ODA File Converter ou LibreCAD
  2. python3 scripts/extract_lots_from_dxf.py <arquivo.dxf>

Output: public/maps/alto-bellevue-lots.json
"""

import sys
import json
import math
import os

try:
    import ezdxf
except ImportError:
    print("Instale: pip3 install ezdxf")
    sys.exit(1)


def normalize_points(all_points_flat, target_w=1200, target_h=900, padding=40):
    """Normaliza coordenadas do DXF para espaço SVG."""
    if not all_points_flat:
        return 1, 0, 0

    xs = [p[0] for p in all_points_flat]
    ys = [p[1] for p in all_points_flat]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    range_x = max_x - min_x or 1
    range_y = max_y - min_y or 1

    scale = min(
        (target_w - 2 * padding) / range_x,
        (target_h - 2 * padding) / range_y,
    )
    return scale, min_x, min_y, padding


def to_svg(x, y, scale, min_x, min_y, padding, target_h, flip_y=True):
    """Converte coordenada DXF → SVG (Y invertido)."""
    sx = (x - min_x) * scale + padding
    sy = (y - min_y) * scale + padding
    if flip_y:
        # SVG Y cresce para baixo; CAD Y cresce para cima
        sy = target_h - sy
    return round(sx, 2), round(sy, 2)


def centroid(points):
    """Centroide de um polígono."""
    n = len(points)
    if n == 0:
        return 0, 0
    cx = sum(p[0] for p in points) / n
    cy = sum(p[1] for p in points) / n
    return cx, cy


def polygon_area_m2(dxf_points):
    """Área usando fórmula de Shoelace (em unidades do DXF — assumindo metros)."""
    n = len(dxf_points)
    if n < 3:
        return 0
    area = 0
    for i in range(n):
        j = (i + 1) % n
        area += dxf_points[i][0] * dxf_points[j][1]
        area -= dxf_points[j][0] * dxf_points[i][1]
    return round(abs(area) / 2, 2)


TARGET_W = 1200
TARGET_H = 900


def main(dxf_path: str):
    print(f"Lendo: {dxf_path}")
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()

    print("Layers disponíveis:")
    for layer in doc.layers:
        print(f"  {layer.dxf.name}")

    # Detectar layers que contêm lotes (nomes comuns em projetos brasileiros)
    lot_layer_hints = ["LOTES", "LOTE", "LOT", "QUADRA", "PARCELA", "TERRENO", "LOTEAMENTO"]
    lot_layers = [
        layer.dxf.name for layer in doc.layers
        if any(hint in layer.dxf.name.upper() for hint in lot_layer_hints)
    ]
    print(f"Layers de lotes detectados: {lot_layers or 'nenhum detectado — tentando todas LWPOLYLINE'}")

    # Coletar todos os pontos para normalização global
    all_polylines = []
    for e in msp.query("LWPOLYLINE"):
        pts = [(v[0], v[1]) for v in e.get_points()]
        if len(pts) >= 3:
            layer_name = e.dxf.layer if hasattr(e.dxf, "layer") else ""
            all_polylines.append((e, pts, layer_name))

    if not all_polylines:
        print("AVISO: Nenhuma LWPOLYLINE encontrada. Tentando POLYLINE...")
        for e in msp.query("POLYLINE"):
            pts = [(v.dxf.location.x, v.dxf.location.y) for v in e.vertices]
            if len(pts) >= 3:
                layer_name = e.dxf.layer if hasattr(e.dxf, "layer") else ""
                all_polylines.append((e, pts, layer_name))

    if not all_polylines:
        print("ERRO: Nenhum polígono encontrado no DXF.")
        sys.exit(1)

    all_flat = [p for _, pts, _ in all_polylines for p in pts]
    scale, min_x, min_y, padding = normalize_points(all_flat, TARGET_W, TARGET_H)

    # Filtrar somente lotes (por layer, ou se não houver layer detectado, todos com área razoável)
    lots = []
    lot_counter = {}

    for entity, dxf_pts, layer_name in all_polylines:
        # Filtrar por layer se tivermos layers detectados
        if lot_layers and not any(hint in layer_name.upper() for hint in lot_layer_hints):
            continue

        area = polygon_area_m2(dxf_pts)
        # Lotes típicos: 100–2000 m² (filtrar vias, áreas maiores)
        if area < 80 or area > 5000:
            continue

        svg_pts = [to_svg(x, y, scale, min_x, min_y, padding, TARGET_H) for x, y in dxf_pts]
        points_str = " ".join(f"{p[0]},{p[1]}" for p in svg_pts)
        cx, cy = centroid(svg_pts)

        # Tentar extrair quadra/lote do handle ou layer name
        handle = entity.dxf.handle
        quadra = layer_name.split("-")[0] if "-" in layer_name else "A"
        lot_counter[quadra] = lot_counter.get(quadra, 0) + 1
        lote_num = str(lot_counter[quadra]).zfill(2)

        lots.append({
            "id": f"{quadra}-{lote_num}",
            "handle": handle,
            "quadra": quadra,
            "lote": lote_num,
            "points": points_str,
            "area": area,
            "labelX": round(cx, 1),
            "labelY": round(cy, 1),
            "layer": layer_name,
        })

    # Coletar ruas (polylines longas, não lotes)
    streets = []
    for entity, dxf_pts, layer_name in all_polylines:
        area = polygon_area_m2(dxf_pts)
        if area < 80:  # Linhas/ruas tendem a ter área mínima
            svg_pts = [to_svg(x, y, scale, min_x, min_y, padding, TARGET_H) for x, y in dxf_pts]
            d = "M " + " L ".join(f"{p[0]},{p[1]}" for p in svg_pts)
            streets.append({"d": d, "layer": layer_name})

    output = {
        "viewBox": f"0 0 {TARGET_W} {TARGET_H}",
        "totalLots": len(lots),
        "lots": lots,
        "streets": streets[:500],  # Limitar ruas
    }

    out_path = os.path.join(
        os.path.dirname(__file__), "..", "public", "maps", "alto-bellevue-lots.json"
    )
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ {len(lots)} lotes extraídos → {os.path.abspath(out_path)}")
    if not lots:
        print("⚠️  Nenhum lote extraído. Verifique os nomes dos layers no DXF.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/extract_lots_from_dxf.py <arquivo.dxf>")
        print("\nPara converter DWG → DXF:")
        print("  LibreCAD: File → Export → DXF 2007")
        print("  ODA File Converter: ODAFileConverter <in_dir> <out_dir> ACAD2018 DXF 0 1")
        sys.exit(1)
    main(sys.argv[1])
