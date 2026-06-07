#!/usr/bin/env python3
"""Extract lot/area polygons from the PDF→SVG by merging connected same-fill triangles.
Feasibility + extraction. Usage: python3 extract_pdf_lots.py <svg> [color]
"""
import re, sys, math, json
svg = open(sys.argv[1]).read()
# fill -> kind
KIND = {
  "86.66687%, 75.68512%, 43.136597%": "lot",
  "54.116821%, 86.66687%, 43.136597%": "green",
  "100%, 62.35199%, 49.803162%": "recre",
}
want = sys.argv[2] if len(sys.argv) > 2 else "lot"

path_re = re.compile(r'<path\b[^>]*?fill="rgb\(([^)]*)\)"[^>]*?\bd="([^"]*)"[^>]*?transform="matrix\(([^)]*)\)"', re.S)
num_re = re.compile(r'-?\d+\.?\d*')

def apply(m, x, y):
    a,b,c,d,e,f = m
    return (a*x + c*y + e, b*x + d*y + f)

def parse_d(d, m):
    """Return list of rings (each a list of (x,y) in display coords)."""
    rings = []; cur = []; i = 0; tokens = d.replace(',', ' ').split()
    px = py = 0.0
    k = 0
    while k < len(tokens):
        t = tokens[k]
        if t in ('M','L'):
            x = float(tokens[k+1]); y = float(tokens[k+2]); k += 3
            if t == 'M':
                if cur: rings.append(cur); cur = []
            cur.append(apply(m, x, y)); px,py = x,y
        elif t == 'C':
            x = float(tokens[k+5]); y = float(tokens[k+6]); k += 7
            cur.append(apply(m, x, y)); px,py = x,y
        elif t == 'Z':
            if cur: rings.append(cur); cur = []
            k += 1
        else:
            k += 1
    if cur: rings.append(cur)
    return rings

polys = []
for fill, d, tr in path_re.findall(svg):
    fill = fill.strip()
    if KIND.get(fill) != want: continue
    m = [float(x) for x in num_re.findall(tr)][:6]
    for ring in parse_d(d, m):
        if len(ring) >= 3:
            polys.append(ring)

print(f"{want} sub-polygons: {len(polys)}")

# edge connectivity (round to 1 unit)
def key(p): return (round(p[0]), round(p[1]))
def edges(poly):
    out = []
    for i in range(len(poly)):
        a = key(poly[i]); b = key(poly[(i+1) % len(poly)])
        if a != b: out.append((a, b) if a < b else (b, a))
    return out

edge_count = {}
for poly in polys:
    for e in set(edges(poly)):
        edge_count[e] = edge_count.get(e, 0) + 1

# union-find on polygons sharing an edge
parent = list(range(len(polys)))
def find(i):
    while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
    return i
def union(i, j):
    ri, rj = find(i), find(j);
    if ri != rj: parent[ri] = rj
edge_owner = {}
for idx, poly in enumerate(polys):
    for e in set(edges(poly)):
        if e in edge_owner: union(idx, edge_owner[e])
        else: edge_owner[e] = idx
comps = {}
for i in range(len(polys)): comps.setdefault(find(i), []).append(i)
print(f"connected components (merged shapes): {len(comps)}")

# boundary polygon per component: edges that appear once across the component
def boundary(idxs):
    cnt = {}
    for i in idxs:
        for e in edges(polys[i]):
            cnt[e] = cnt.get(e, 0) + 1
    bedges = [e for e, c in cnt.items() if c == 1]
    if not bedges: return None
    adj = {}
    for a, b in bedges:
        adj.setdefault(a, []).append(b); adj.setdefault(b, []).append(a)
    start = bedges[0][0]; ring = [start]; prev = None; cur = start
    while True:
        nxts = [n for n in adj.get(cur, []) if n != prev]
        if not nxts: break
        nb = nxts[0]
        if nb == start: break
        ring.append(nb); prev, cur = cur, nb
        if len(ring) > 200: break
    return ring

out = []
for idxs in comps.values():
    r = boundary(idxs)
    if r and len(r) >= 3:
        cx = sum(p[0] for p in r)/len(r); cy = sum(p[1] for p in r)/len(r)
        out.append({"pts": r, "c": [cx, cy], "n": len(r)})
print(f"merged boundary polygons: {len(out)}")
json.dump(out, open(f"/tmp/pdf-{want}.json", "w"))
print(f"wrote /tmp/pdf-{want}.json")
