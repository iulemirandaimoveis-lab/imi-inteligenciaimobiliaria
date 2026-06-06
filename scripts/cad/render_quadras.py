#!/usr/bin/env python3
"""Render Alto Bellevue lots filled by quadra color → PNG, to verify quadra grouping.
Usage: python3 render_quadras.py <lots.json> <out.png>
"""
import json, sys, statistics
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
data = json.load(open(src))
VB_W, VB_H = 1200.0, 821.86
W, H = 1680, int(1680 * VB_H / VB_W)
sx, sy = W / VB_W, H / VB_H
img = Image.new("RGB", (W, H), (10, 20, 34))
d = ImageDraw.Draw(img, "RGBA")

# 16 distinct colors for A..P
PAL = [(230,25,75),(60,180,75),(255,225,25),(0,130,200),(245,130,48),(145,30,180),
       (70,240,240),(240,50,230),(210,245,60),(250,190,212),(0,128,128),(220,190,255),
       (170,110,40),(255,250,200),(128,0,0),(170,255,195)]
qcolor = {q: PAL[i % 16] for i, q in enumerate("ABCDEFGHIJKLMNOP")}

def pts_of(s):
    out = []
    for pair in s.split():
        if "," in pair:
            x, y = pair.split(","); out.append((float(x)*sx, float(y)*sy))
    return out

# perimeter
for ring in data.get("perimeter", []):
    p = pts_of(ring)
    if len(p) >= 3:
        d.line(p + [p[0]], fill=(200,164,74,180), width=2)

cents = {}
for lot in data["lots"]:
    if lot.get("pending"): continue
    p = pts_of(lot.get("points", ""))
    if len(p) < 3: continue
    c = qcolor.get(lot["quadra"], (150,150,150))
    d.polygon(p, fill=c + (170,), outline=(0,0,0,120))
    cents.setdefault(lot["quadra"], []).append((lot.get("labelX",0)*sx, lot.get("labelY",0)*sy))

# quadra letter at median
try: font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
except Exception: font = ImageFont.load_default()
for q, ps in cents.items():
    mx = statistics.median([p[0] for p in ps]); my = statistics.median([p[1] for p in ps])
    d.ellipse([mx-20,my-20,mx+20,my+20], fill=(0,0,0,200))
    d.text((mx, my), q, fill=(255,255,255,255), anchor="mm", font=font)

img.save(out)
print("wrote", out, img.size)
