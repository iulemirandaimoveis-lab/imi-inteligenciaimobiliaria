#!/usr/bin/env python3
"""Extrai geometria REAL dos lotes do Miguel Marques do CAD oficial (DXF),
no padrão do Alto Bellevue. Uso:
  python3 extract_miguel_marques.py <dxf> [--rot DEG] [--write OUT.json] [--preview OUT.png]
"""
import sys, re, json, math, argparse
from collections import defaultdict
import ezdxf
from shapely.geometry import LineString, Point
from shapely.ops import polygonize, unary_union
from shapely.strtree import STRtree

ap=argparse.ArgumentParser()
ap.add_argument('dxf'); ap.add_argument('--rot', type=float, default=41.0)
ap.add_argument('--write'); ap.add_argument('--preview')
ap.add_argument('--vbw', type=float, default=1200.0)
A=ap.parse_args()
PRICE_PER_M2=156.25
def clean(t): return re.sub(r'\\[A-Za-z][^;]*;|[{}]','',t).replace('\\P',' ').strip()

doc=ezdxf.readfile(A.dxf); msp=doc.modelspace()
SNAP=40
def s(v): return round(v/SNAP)*SNAP
lines=[]
for e in msp:
    if e.dxftype()=='LINE' and e.dxf.layer in ('A-DETL-THIN','A-DETL-MEDM','A-DETL'):
        a,b=e.dxf.start,e.dxf.end; p,q=(s(a.x),s(a.y)),(s(b.x),s(b.y))
        if p!=q: lines.append(LineString([p,q]))
faces=[f for f in polygonize(unary_union(lines)) if 8e7<=f.area<=7e8]
cent=[(f.centroid.x,f.centroid.y) for f in faces]

nums,areas,qletters=[],[],[]
for e in msp:
    if e.dxftype()!='MTEXT': continue
    t=clean(e.text); p=e.dxf.insert
    if e.dxf.layer=='A-AREA-IDEN':
        if re.fullmatch(r'\d+',t): nums.append((int(t),p.x,p.y))
        else:
            m=re.search(r'([\d.,]+)\s*m',t)
            if m: areas.append((float(m.group(1).replace(',','.')),p.x,p.y))
    elif e.dxf.layer=='G-ANNO-TEXT' and re.fullmatch(r'[A-Z]',t):
        qletters.append((t,p.x,p.y))

atree=STRtree([Point(x,y) for _,x,y in areas])
tokens=[]
for nv,x,y in nums:
    j=atree.nearest(Point(x,y)); av,ax,ay=areas[j]
    tokens.append((nv,av,(x+ax)/2,(y+ay)/2))
ttree=STRtree([Point(x,y) for _,_,x,y in tokens])
pairs=[]
for fi,(cx,cy) in enumerate(cent):
    ti=ttree.nearest(Point(cx,cy)); d=math.dist((cx,cy),(tokens[ti][2],tokens[ti][3]))
    pairs.append((d,fi,ti))
pairs.sort(); face_tok={}; used=set()
for d,fi,ti in pairs:
    if fi in face_tok or ti in used or d>40000: continue
    face_tok[fi]=ti; used.add(ti)

def nearest_letter(x,y): return min(qletters,key=lambda q:(q[1]-x)**2+(q[2]-y)**2)[0]
quad_of={fi:nearest_letter(*cent[fi]) for fi in face_tok}
num_of={fi:tokens[ti][0] for fi,ti in face_tok.items()}
area_of={fi:tokens[ti][1] for fi,ti in face_tok.items()}

# ── transform: rotate by -rot, flip Y, normalize to viewBox ──
rot=math.radians(-A.rot); cosr,sinr=math.cos(rot),math.sin(rot)
def tf(x,y): return (x*cosr-y*sinr, x*sinr+y*cosr)
allpts=[tf(x,y) for f in face_tok for x,y in faces[f].exterior.coords]
minx=min(p[0] for p in allpts); maxx=max(p[0] for p in allpts)
miny=min(p[1] for p in allpts); maxy=max(p[1] for p in allpts)
W=A.vbw; sc=W/(maxx-minx); H=round((maxy-miny)*sc,2)
def norm(x,y):
    rx,ry=tf(x,y)
    return ((rx-minx)*sc, (maxy-ry)*sc)  # flip Y

lots=[]
for fi in sorted(face_tok, key=lambda i:(quad_of[i],num_of[i])):
    poly=faces[fi]
    pts=[norm(x,y) for x,y in poly.exterior.coords[:-1]]
    cx,cy=norm(*cent[fi])
    q=quad_of[fi]; lote=str(num_of[fi]); ar=round(area_of[fi],2)
    lots.append({'id':f'{q}-{lote}','quadra':q,'lote':lote,
        'points':' '.join(f'{x:.2f},{y:.2f}' for x,y in pts),
        'area':ar,'labelX':round(cx,2),'labelY':round(cy,2),
        'status':'disponivel','price':round(ar*PRICE_PER_M2)})

per_q=defaultdict(int)
for l in lots: per_q[l['quadra']]+=1
print(f'lots={len(lots)} quadras={len(per_q)} viewBox=0 0 {W} {H}', file=sys.stderr)
print('per-quadra:', dict(sorted(per_q.items())), file=sys.stderr)

if A.write:
    out={'viewBox':f'0 0 {W:.0f} {H}','totalLots':len(lots),
        'lots':lots,'amenities':[],'greenAreas':[],'streets':[],'perimeter':[],
        'streetLabels':[{'x':round(norm(x,y)[0],2),'y':round(norm(x,y)[1],2),'name':t}
            for t,x,y in qletters],
        'note':'Geometria REAL extraída do CAD oficial (R07 PLANTA LOTEADA.dxf): poligonos, areas e numeros dos lotes. Quadra por rotulo mais proximo (best-effort).'}
    json.dump(out, open(A.write,'w'), ensure_ascii=False)
    print('wrote', A.write, file=sys.stderr)

if A.preview:
    import matplotlib; matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.patches import Polygon as MPoly
    from matplotlib.collections import PatchCollection
    import matplotlib.cm as cm
    qs=sorted(per_q); cmap={q:cm.tab20(i%20) for i,q in enumerate(qs)}
    fig,ax=plt.subplots(figsize=(16, 16*H/W))
    patches=[]; colors=[]
    for l in lots:
        pts=[tuple(map(float,p.split(','))) for p in l['points'].split()]
        patches.append(MPoly(pts, closed=True)); colors.append(cmap[l['quadra']])
    pc=PatchCollection(patches, facecolor=colors, edgecolor='white', linewidths=0.3)
    ax.add_collection(pc)
    for t,x,y in qletters:
        nx,ny=norm(x,y); ax.text(nx,ny,t,fontsize=16,weight='bold',color='black',ha='center')
    ax.set_xlim(0,W); ax.set_ylim(H,0); ax.set_aspect('equal'); ax.axis('off')
    plt.savefig(A.preview, dpi=90, bbox_inches='tight'); print('wrote', A.preview, file=sys.stderr)
