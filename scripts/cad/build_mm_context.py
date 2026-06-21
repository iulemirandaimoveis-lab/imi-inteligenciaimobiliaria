#!/usr/bin/env python3
"""Deriva ruas + perímetro do Miguel Marques a partir dos polígonos REAIS dos lotes.

O DXF não tem camada de vias: as ruas são o espaço negativo entre as quadras. Em vez
de inventar geometria, fechamos os vãos de largura de rua (buffer-close) para obter o
envelope do loteamento (perímetro) e subtraímos os lotes para obter a malha viária —
tudo nas MESMAS coordenadas do viewBox dos lotes, então alinha por construção.

Uso: python scripts/cad/build_mm_context.py [--b 18] \
        [--lots public/maps/miguel-marques-cad-lots.json] \
        [--out public/maps/miguel-marques-cad-context.json]
"""
import argparse
import json

from shapely.geometry import Polygon
from shapely.ops import unary_union

ap = argparse.ArgumentParser()
ap.add_argument('--lots', default='public/maps/miguel-marques-cad-lots.json')
ap.add_argument('--out', default='public/maps/miguel-marques-cad-context.json')
ap.add_argument('--b', type=float, default=18.0, help='largura de rua p/ fechar vãos')
A = ap.parse_args()

cad = json.load(open(A.lots))
polys = []
for lot in cad['lots']:
    pts = [tuple(map(float, p.split(','))) for p in lot['points'].split()]
    if len(pts) >= 3:
        pg = Polygon(pts)
        if not pg.is_valid:
            pg = pg.buffer(0)
        if pg.area > 0:
            polys.append(pg)

union = unary_union(polys)
B = A.b
foot = union.buffer(B, join_style=2).buffer(-B * 0.92, join_style=2).simplify(0.8)
roads = foot.difference(union.buffer(0.4)).simplify(0.6)


def ring_d(coords):
    return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in coords) + ' Z'


def poly_d(poly):
    return ' '.join(ring_d(list(r.coords)) for r in [poly.exterior, *poly.interiors])


foot_geoms = [g for g in getattr(foot, 'geoms', [foot]) if g.geom_type == 'Polygon']
road_geoms = [g for g in getattr(roads, 'geoms', [roads]) if g.geom_type == 'Polygon' and g.area > 30]

ctx = {
    'viewBox': cad['viewBox'],
    'perimeter': [' '.join(f'{x:.1f},{y:.1f}' for x, y in g.exterior.coords) for g in foot_geoms],
    'roads': [poly_d(g) for g in road_geoms],
    'note': f'Derivado dos lotes reais (buffer-close B={B:g}). Mesmas coords do viewBox.',
}
json.dump(ctx, open(A.out, 'w'), ensure_ascii=False)
print(f'wrote {A.out}: perimeter={len(ctx["perimeter"])} masses, roads={len(ctx["roads"])} polys')
