#!/usr/bin/env python3
"""Parseia o PDF 'Disponibilidade lotes' -> schedule quadra->[(lote,area,status)].
Lida com multi-coluna e continuação de páginas."""
import sys, fitz, re, json, unicodedata
from collections import defaultdict, Counter
PDF=sys.argv[1]; OUT=sys.argv[2] if len(sys.argv)>2 else '/tmp/mm_schedule.json'
def N(t): return unicodedata.normalize('NFC',t)
def num(s):
    s=s.replace('.','').replace(' ','').replace(',','.')
    try: return float(s)
    except: return None
STAT={'VENDIDO':'vendido','DISPONÍVEL':'disponivel','DISPONIVEL':'disponivel',
      'PROPRIETARIO':'proprietario','PROPRIETÁRIO':'proprietario','RESERVADO':'negociacao',
      'NEGOCIADO':'negociacao','NEGOCIAÇÃO':'negociacao','NEGOCIACAO':'negociacao','PERMUTA':'proprietario'}
doc=fitz.open(PDF)
schedule=defaultdict(list)
for pno in range(len(doc)):
    words=[(w[0],w[1],N(w[4])) for w in doc[pno].get_text('words')]
    heads=[]
    for x,y,t in words:
        if t=='QUADRA':
            same=sorted([u for u in words if abs(u[1]-y)<3 and u[0]>x and u[2]!='QUADRA'],key=lambda u:u[0])
            if same and re.fullmatch(r'[A-Z]',same[0][2]): heads.append((same[0][2],x,y))
    for letter,hx,hy in heads:
        ys=[yy for _,xx,yy in heads if abs(xx-hx)<25 and yy>hy]
        yend=min(ys) if ys else 100000
        # band: from this quadra's LOTE col to just before next column.
        # next column x (right neighbour) bounds the right edge
        rightxs=[xx for _,xx,_ in heads if xx>hx+30]
        rx=min(rightxs) if rightxs else hx+90
        band=[w for w in words if hx-30<=w[0]<rx-6 and hy+6<=w[1]<yend-1]
        rows=defaultdict(list)
        for x,y,t in band: rows[round(y)].append((x,t))
        for y in sorted(rows):
            toks=sorted(rows[y],key=lambda z:z[0])
            status=next((STAT[t.upper()] for _,t in toks if t.upper() in STAT),'disponivel')
            nums=[(x,t) for x,t in toks if re.fullmatch(r'[\d.,]+',t)]
            lote=area=None
            for i,(x,t) in enumerate(nums):
                v=num(t)
                if v is not None and v==int(v) and 1<=v<=300:
                    lote=int(v); rest=nums[i+1:]; break
            if lote is None: continue
            for x,t in rest:
                v=num(t)
                if v is not None and 70<=v<=900: area=round(v,2); break
            if area: schedule[letter].append((lote,area,status))

# de-dup (same quadra+lote) keeping first
clean=defaultdict(dict)
for q,rows in schedule.items():
    for l,a,s in rows:
        if l not in clean[q]: clean[q][l]=(a,s)
out={q:[{'lote':l,'area':a,'status':s} for l,(a,s) in sorted(v.items())] for q,v in clean.items()}
tot=sum(len(v) for v in out.values())
for q in sorted(out):
    sc=Counter(r['status'] for r in out[q])
    print(f'  {q}: {len(out[q]):3d}  {dict(sc)}', file=sys.stderr)
print('TOTAL:', tot, 'quadras:', len(out), file=sys.stderr)
json.dump(out, open(OUT,'w'), ensure_ascii=False)
print('wrote', OUT, file=sys.stderr)
