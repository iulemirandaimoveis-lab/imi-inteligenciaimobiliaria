#!/usr/bin/env python3
"""Read the big DXF once and cache all geometry needed to render the full map:
lots, street/sidewalk edges (DB2_CALCADA), perimeter (POLIGONAL), BR edge,
plus label texts (lot number, quadra, lot area, street names)."""
import sys, json
import ezdxf
from ezdxf.path import make_path

path = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else "/tmp/ab_geom.json"
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
    """Flatten any LWPOLYLINE/LINE/ARC/POLYLINE to a list of (x,y) honoring bulges/curves."""
    try:
        p = make_path(e)
        return [(round(pt.x, 3), round(pt.y, 3)) for pt in p.flattening(dist)]
    except Exception:
        try:
            return poly_pts(e)
        except Exception:
            return []


polys = []           # REGIAO_LOTES lot polygons
calcada = []         # DB2_CALCADA edges (streets/sidewalks)
poligonal = []       # POLIGONAL perimeter (fragments — não usado como limite)
linha_br = []        # DB2 LINHA DA BR
limite = []          # DB2 LIMITE DO LOTE — delimitação oficial do condomínio

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
        f = flatten(e)
        if len(f) >= 10:   # ignora notações pequenas (4 vértices)
            limite.append(f)


def collect(layer):
    res = []
    for e in msp.query("TEXT MTEXT"):
        if e.dxf.layer != layer:
            continue
        t = get_text(e)
        if not t:
            continue
        try:
            p = e.dxf.insert
            res.append([round(p.x, 3), round(p.y, 3), t])
        except Exception:
            pass
    return res


data = {
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
with open(out, "w") as f:
    json.dump(data, f)
print("polys", len(polys), "calcada", len(calcada), "poligonal", len(poligonal),
      "linha_br", len(linha_br), "numero", len(data["numero"]),
      "quadra", len(data["quadra"]), "area", len(data["area"]), "ruas", len(data["ruas"]))
print("cached ->", out)
