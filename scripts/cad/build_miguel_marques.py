#!/usr/bin/env python3
"""Geometria REAL (DXF) + quadra/status REAIS (schedule PDF) -> JSON final.
Uso: build_miguel_marques.py <dxf> <schedule.json> [--rot 41] [--write out.json] [--preview out.png]"""
import sys, re, json, math, argparse
from collections import defaultdict, Counter
import ezdxf
from shapely.geometry import LineString, Point
from shapely.ops import polygonize, unary_union
from shapely.strtree import STRtree

ap=argparse.ArgumentParser()
ap.add_argument('dxf'); ap.add_argument('schedule')
ap.add_argument('--rot',type=float,default=41.0); ap.add_argument('--write'); ap.add_argument('--preview')
ap.add_argument('--vbw',type=float,default=1200.0)
A=ap.parse_args()
PPM2=156.25
def clean(t): return re.sub(r'\\[A-Za-z][^;]*;|[{}]','',t).replace('\\P',' ').strip()

doc=ezdxf.readfile(A.dxf); msp=doc.modelspace()
def s(v,g=40): return round(v/g)*g
lines=[]
for e in msp:
    if e.dxftype()=='LINE' and e.dxf.layer in ('A-DETL-THIN','A-DETL-MEDM','A-DETL'):
        a,b=e.dxf.start,e.dxf.end; p,q=(s(a.x),s(a.y)),(s(b.x),s(b.y))
        if p!=q: lines.append(LineString([p,q]))
faces=[f for f in polygonize(unary_union(lines)) if 5e7<=f.area<=7e8]
cent=[(f.centroid.x,f.centroid.y) for f in faces]
nums=[];areas=[];ql=[]
for e in msp:
    if e.dxftype()=='MTEXT':
        t=clean(e.text);p=e.dxf.insert
        if e.dxf.layer=='A-AREA-IDEN':
            if re.fullmatch(r'\d+',t):nums.append((int(t),p.x,p.y))
            else:
                m=re.search(r'([\d.,]+)\s*m',t)
                if m:areas.append((float(m.group(1).replace(',','.')),p.x,p.y))
        elif e.dxf.layer=='G-ANNO-TEXT' and re.fullmatch(r'[A-Z]',t):ql.append((t,p.x,p.y))
atree=STRtree([Point(x,y) for _,x,y in areas])
tok=[]
for nv,x,y in nums:
    j=atree.nearest(Point(x,y)); av,ax,ay=areas[j]; tok.append((nv,av,(x+ax)/2,(y+ay)/2))
# Casamento por CONTENÇÃO: o rótulo (centro do lote) cai DENTRO do seu polígono —
# muito mais fiel que "face mais próxima" (recupera ~170 lotes a mais). Fallback:
# token sem face contedora pega a face livre mais próxima (≤25 m).
ftree=STRtree(faces)
ft={}; claimed=set()
for ti,(nv,av,x,y) in enumerate(tok):
    pt=Point(x,y)
    for fi in ftree.query(pt):
        if fi not in ft and faces[fi].contains(pt):
            ft[fi]=ti; claimed.add(ti); break
free=[fi for fi in range(len(faces)) if fi not in ft]
if free:
    ctree=STRtree([Point(*cent[fi]) for fi in free])
    for ti,(nv,av,x,y) in enumerate(tok):
        if ti in claimed: continue
        fi=free[ctree.nearest(Point(x,y))]
        if fi in ft: continue
        if math.dist(cent[fi],(x,y))<25000:
            ft[fi]=ti; claimed.add(ti)
lote_of={fi:tok[ti][0] for fi,ti in ft.items()}
area_of={fi:tok[ti][1] for fi,ti in ft.items()}

# schedule index: (lote, areaRounded) -> list[(quadra,status,area)]
sched=json.load(open(A.schedule))
idx=defaultdict(list)
for q,rows in sched.items():
    for r in rows: idx[(r['lote'],round(r['area']))].append((q,r['status'],r['area']))

def lookup(L,Ar):
    cands=[]
    for da in (0,1,-1):
        cands+=idx.get((L,round(Ar)+da),[])
    # keep those within 0.6 m2
    cands=[c for c in cands if abs(c[2]-Ar)<=0.8]
    return cands

# adjacency graph (faces sharing a boundary)
tree=STRtree(faces); adj=defaultdict(set)
for i in ft:
    for j in tree.query(faces[i].buffer(80)):
        if j!=i and j in ft and faces[i].distance(faces[j])<80: adj[i].add(j)

# ── Atribuição GLOBAL a partir do quadro: cada linha (quadra,lote) reivindica UMA
# face (a que casa lote+área e está mais perto da âncora da quadra). Isso garante
# unicidade de (quadra,lote) por construção — sem ids duplicados. ──
letter_pos={L[0]:(L[1],L[2]) for L in ql}
faces_by_lote=defaultdict(list)
for fi in ft: faces_by_lote[lote_of[fi]].append(fi)
rows=[(q,r['lote'],r['area'],r['status']) for q,rs in sched.items() for r in rs]
quad={}; status={}; used=set()
for q,lote,area,st in rows:
    anchor=letter_pos.get(q)
    best=None; bd=1e18
    for fi in faces_by_lote.get(lote,[]):
        if fi in used or abs(area_of[fi]-area)>0.8: continue
        d=math.dist(cent[fi],anchor) if anchor else 0
        if d<bd: bd=d; best=fi
    if best is not None:
        quad[best]=q; status[best]=st; used.add(best)
confirmed=set(used)

# ── Lotes sem linha no quadro: quadra por adjacência (voto dos vizinhos já
# rotulados), preferindo um candidato do quadro quando houver; depois maioria. ──
for _ in range(10):
    changed=False
    for fi in ft:
        if fi in quad: continue
        votes=Counter(quad[j] for j in adj[fi] if j in quad)
        if not votes: continue
        cand=set(x[0] for x in lookup(lote_of[fi],area_of[fi]))
        pick=None
        if cand:
            ranked=sorted(((votes.get(q,0),q) for q in cand),reverse=True)
            if ranked[0][0]>0: pick=ranked[0][1]
        if pick is None: pick=votes.most_common(1)[0][0]
        quad[fi]=pick; status.setdefault(fi,'disponivel'); changed=True
    if not changed: break
def nearest_letter(x,y): return min(ql,key=lambda q:(q[1]-x)**2+(q[2]-y)**2)[0]
for fi in ft:
    if fi not in quad: quad[fi]=nearest_letter(*cent[fi])
    status.setdefault(fi,'disponivel')

# ── Resolve colisões residuais de (quadra,lote): mantém a face confirmada pelo
# quadro; move as demais para uma quadra vizinha que ainda não tem aquele lote. ──
for _ in range(6):
    bykey=defaultdict(list)
    for fi in ft: bykey[(quad[fi],lote_of[fi])].append(fi)
    coll=[v for v in bykey.values() if len(v)>1]
    if not coll: break
    moved=False
    for fis in coll:
        fis.sort(key=lambda fi: fi not in confirmed)  # confirmadas primeiro (mantidas)
        for fi in fis[1:]:
            if fi in confirmed: continue
            taken={quad[g] for g in faces_by_lote[lote_of[fi]] if g!=fi}
            nb=Counter(quad[j] for j in adj[fi]
                       if j in quad and quad[j]!=quad[fi] and quad[j] not in taken)
            if nb: quad[fi]=nb.most_common(1)[0][0]; moved=True
    if not moved: break

# transform
rot=math.radians(-A.rot); cr,sr=math.cos(rot),math.sin(rot)
def tf(x,y): return (x*cr-y*sr,x*sr+y*cr)
pts=[tf(x,y) for fi in ft for x,y in faces[fi].exterior.coords]
minx=min(p[0] for p in pts);maxx=max(p[0] for p in pts);miny=min(p[1] for p in pts);maxy=max(p[1] for p in pts)
W=A.vbw; sc=W/(maxx-minx); H=round((maxy-miny)*sc,2)
def norm(x,y):
    rx,ry=tf(x,y); return ((rx-minx)*sc,(maxy-ry)*sc)
lots=[]; seen=set()
for fi in sorted(ft,key=lambda i:(quad[i],lote_of[i],-area_of[i])):
    poly=[norm(x,y) for x,y in faces[fi].exterior.coords[:-1]]
    cx,cy=norm(*cent[fi]); ar=round(area_of[fi],2)
    base=f'{quad[fi]}-{lote_of[fi]}'; uid=base; k=2
    while uid in seen: uid=f'{base}_{k}'; k+=1   # rede de segurança: id sempre único
    seen.add(uid)
    lots.append({'id':uid,'quadra':quad[fi],'lote':str(lote_of[fi]),
        'points':' '.join(f'{x:.2f},{y:.2f}' for x,y in poly),'area':ar,
        'labelX':round(cx,2),'labelY':round(cy,2),'status':status[fi],'price':round(ar*PPM2)})
dups=sum(1 for l in lots if '_' in l['id'])
print('residual duplicate (quadra,lote) suffixed:',dups,file=sys.stderr)
perq=Counter(l['quadra'] for l in lots); st=Counter(l['status'] for l in lots)
print('per-quadra:',dict(sorted(perq.items())),file=sys.stderr)
print('status:',dict(st),'| total',len(lots),'| viewBox 0 0',W,H,file=sys.stderr)
# coverage vs schedule
sc_match=sum(1 for l in lots if any(c[0]==l['quadra'] for c in idx.get((int(l['lote']),round(l['area'])),[])))
print('lots whose (quadra,lote,area) is confirmed by schedule:',sc_match,file=sys.stderr)

if A.write:
    json.dump({'viewBox':f'0 0 {W:.0f} {H}','totalLots':len(lots),'lots':lots,
        'amenities':[],'greenAreas':[],'streets':[],'perimeter':[],
        'streetLabels':[{'x':round(norm(x,y)[0],2),'y':round(norm(x,y)[1],2),'name':t} for t,x,y in ql],
        'note':'Geometria REAL do CAD oficial (poligonos/areas/numeros) + quadra/status do quadro de disponibilidade. Preco=area*R$156,25/m2.'},
        open(A.write,'w'),ensure_ascii=False)
    print('wrote',A.write,file=sys.stderr)
if A.preview:
    import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
    from matplotlib.patches import Polygon as MP; from matplotlib.collections import PatchCollection
    import matplotlib.cm as cm
    qs=sorted(perq); cmap={q:cm.tab20(i%20) for i,q in enumerate(qs)}
    fig,ax=plt.subplots(figsize=(16,16*H/W)); P=[];C=[]
    for l in lots:
        pp=[tuple(map(float,p.split(','))) for p in l['points'].split()]; P.append(MP(pp,closed=True)); C.append(cmap[l['quadra']])
    ax.add_collection(PatchCollection(P,facecolor=C,edgecolor='white',linewidths=0.3))
    for t,x,y in ql:
        nx,ny=norm(x,y); ax.text(nx,ny,t,fontsize=15,weight='bold')
    ax.set_xlim(0,W);ax.set_ylim(H,0);ax.set_aspect('equal');ax.axis('off')
    plt.savefig(A.preview,dpi=90,bbox_inches='tight'); print('wrote',A.preview,file=sys.stderr)
