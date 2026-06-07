#!/usr/bin/env python3
"""Use PDF block-blobs (tan fills) as quadra REGIONS to fix quadra assignment.
Aligns PDF-SVG coords to the map viewBox by fitting the blob bbox to the lots bbox
(tries Y-flip), labels each blob by the majority quadra of the lots inside it, then
reassigns minority lots. Renders an overlay to verify. DRY-RUN (writes /tmp only).
"""
import json, sys, statistics
from PIL import Image, ImageDraw, ImageFont

blobs = json.load(open("/tmp/pdf-lot.json"))
mp = json.load(open("public/maps/alto-bellevue-lots.json"))
lots = [l for l in mp["lots"] if not l.get("pending") and l.get("labelX") is not None]

# big blobs only (quadra regions, drop legend/noise)
def area(pts):
    a=0
    for i in range(len(pts)):
        x1,y1=pts[i]; x2,y2=pts[(i+1)%len(pts)]; a+=x1*y2-x2*y1
    return abs(a)/2
blobs=[b for b in blobs if area(b["pts"])>2000]
bpts=[p for b in blobs for p in b["pts"]]
bx=[p[0] for p in bpts]; by=[p[1] for p in bpts]
bminx,bmaxx,bminy,bmaxy=min(bx),max(bx),min(by),max(by)
lx=[l["labelX"] for l in lots]; ly=[l["labelY"] for l in lots]
lminx,lmaxx,lminy,lmaxy=min(lx),max(lx),min(ly),max(ly)

def fit(flip):
    sx=(lmaxx-lminx)/(bmaxx-bminx); sy=(lmaxy-lminy)/(bmaxy-bminy)
    def tf(x,y):
        X=lminx+(x-bminx)*sx
        Y=(lmaxy-(y-bminy)*sy) if flip else (lminy+(y-bminy)*sy)
        return (X,Y)
    return tf

def pip(pt,poly):
    x,y=pt; ins=False; j=len(poly)-1
    for i in range(len(poly)):
        xi,yi=poly[i]; xj,yj=poly[j]
        if ((yi>y)!=(yj>y)) and (x<(xj-xi)*(y-yi)/(yj-yi)+xi): ins=not ins
        j=i
    return ins

# choose flip by which gives more lots-inside-some-blob
best=None
for flip in (False,True):
    tf=fit(flip)
    tb=[[tf(*p) for p in b["pts"]] for b in blobs]
    inside=sum(1 for l in lots if any(pip((l["labelX"],l["labelY"]),poly) for poly in tb))
    print(f"flip={flip}: lots inside a blob = {inside}/{len(lots)}")
    if not best or inside>best[0]: best=(inside,flip,tb)
inside,flip,tb=best
print(f"chosen flip={flip} ({inside}/{len(lots)} inside)")

# majority quadra per blob
import collections
blob_q=[]
for poly in tb:
    qs=collections.Counter(l["quadra"] for l in lots if pip((l["labelX"],l["labelY"]),poly))
    blob_q.append(qs.most_common(1)[0][0] if qs else None)

# proposed reassignment
changes=[]
for l in lots:
    pt=(l["labelX"],l["labelY"])
    for poly,q in zip(tb,blob_q):
        if q and pip(pt,poly):
            if l["quadra"]!=q: changes.append((l["id"],l["quadra"],q))
            break
print(f"proposed reassignments: {len(changes)}")
for c in changes[:40]: print("  ",c)

# render overlay
VBW,VBH=1200.0,821.86; W=1500; H=int(W*VBH/VBW); sc=W/VBW
img=Image.new("RGB",(W,H),(12,22,36)); d=ImageDraw.Draw(img,"RGBA")
for poly in tb:
    d.line([(x*sc,y*sc) for x,y in poly]+[(poly[0][0]*sc,poly[0][1]*sc)],fill=(255,200,80,200),width=2)
PAL=[(230,25,75),(60,180,75),(255,225,25),(0,130,200),(245,130,48),(145,30,180),(70,240,240),(240,50,230),(210,245,60),(250,190,212),(0,128,128),(220,190,255),(170,110,40),(255,250,200),(128,0,0),(170,255,195)]
qc={q:PAL[i%16] for i,q in enumerate("ABCDEFGHIJKLMNOP")}
for l in lots:
    x,y=l["labelX"]*sc,l["labelY"]*sc
    d.ellipse([x-3,y-3,x+3,y+3],fill=qc.get(l["quadra"],(200,200,200))+(255,))
img.save("/tmp/pdf-overlay.png"); print("wrote /tmp/pdf-overlay.png")
