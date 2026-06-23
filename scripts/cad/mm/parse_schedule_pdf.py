#!/usr/bin/env python3
"""Extrai o QUADRO DE DISPONIBILIDADE oficial (Mi Gestão) do PDF para JSON.

Fonte: "Disponibilidade lotes — Miguel Marques (Mi Gestão).pdf" (quadro comercial vivo:
quadra / lote / m² / valor / disponibilidade). Saída no formato consumido por
`scripts/cad/build_miguel_marques.py` (schedule): {quadra: [{lote, area, valor, status}]}.

O PDF é um print de planilha humana: 4 colunas de quadras por faixa, quadras EMPILHADAS
por coluna, e CONTINUAÇÕES sem cabeçalho na página 3 (índice 2). Este parser:
  1. lê as páginas com cabeçalho ("QUADRA X") posicionalmente (sub-colunas LOTE/M2/VALOR/DISP);
  2. costura as continuações da página de overflow pela regra `start == max(quadra)+1`
     (atribui só quando há UMA quadra candidata — o resto fica para o fallback de
     adjacência do build, sem inventar identidade).

Uso:
    python3 scripts/cad/mm/parse_schedule_pdf.py <disponibilidade.pdf> [--write schedule.json]

Requer: pymupdf (fitz). NÃO sobrescreve dados de produção — é só extração/diagnóstico.
"""
import sys, re, json, argparse
from collections import defaultdict, Counter

import fitz  # pymupdf

STATUS_KW = ["DISPONÍVEL", "DISPONIVEL", "VENDIDO", "PROPRIETÁRIO", "PROPRIETARIO",
             "RESERVADO", "NEGOCIAÇÃO", "NEGOCIACAO", "INDISPONÍVEL", "INDISPONIVEL"]
STMAP = {"DISPONÍVEL": "disponivel", "DISPONIVEL": "disponivel", "VENDIDO": "vendido",
         "PROPRIETÁRIO": "proprietario", "PROPRIETARIO": "proprietario", "RESERVADO": "reservado",
         "NEGOCIAÇÃO": "negociacao", "NEGOCIACAO": "negociacao",
         "INDISPONÍVEL": "indisponivel", "INDISPONIVEL": "indisponivel"}


def clean_status(raw):
    u = raw.upper()
    for k in STATUS_KW:
        if k in u:
            return STMAP[k]
    return None


def is_status_word(t):
    u = t.upper().rstrip(":")
    return any(u.startswith(k[:5]) for k in STATUS_KW)


def fnum(tokens):
    s = "".join(tokens).replace(".", "").replace(" ", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def grab_row(words, sx, sy, cl, cm, cv):
    """A partir de uma âncora de status em (sx,sy), pega lote/m2/valor à esquerda na mesma linha.
    `cl-3.5` descarta a coluna-gutter (contador global) à esquerda do LOTE."""
    row = [(x0, t) for (x0, y0, x1, y1, t, b, l, n) in words
           if abs(y0 - sy) < 2.2 and cl - 4 <= x0 < sx - 2]
    row.sort()
    buck = {"LOTE": [], "M2": [], "VALOR": []}
    for x0, t in row:
        if x0 < cl - 3.5:
            continue  # gutter
        d = {"LOTE": abs(x0 - cl), "M2": abs(x0 - cm), "VALOR": abs(x0 - cv)}
        buck[min(d, key=d.get)].append(t)
    lote = "".join(buck["LOTE"]).strip()
    if not re.fullmatch(r"\d{1,3}", lote):
        return None
    return (int(lote), fnum(buck["M2"]), fnum(buck["VALOR"]))


def parse(pdf_path):
    doc = fitz.open(pdf_path)
    schedule = defaultdict(dict)  # quadra -> {lote: (area, valor, status)}

    def add(Q, lote, area, valor, st):
        if lote not in schedule[Q]:
            schedule[Q][lote] = (area, valor, st)

    # --- páginas com cabeçalho "QUADRA X" (grade principal) ---
    header_pages = []
    for pi in range(doc.page_count):
        words = doc[pi].get_text("words")
        if any(w[4].upper() == "QUADRA" for w in words):
            header_pages.append(pi)

    for pi in header_pages:
        p = doc[pi]
        words = p.get_text("words")
        heads = []
        for i, (x0, y0, x1, y1, t, b, l, n) in enumerate(words):
            if t.upper() == "QUADRA" and i + 1 < len(words) and re.fullmatch(r"[A-Z]", words[i + 1][4].strip()):
                heads.append((words[i + 1][4].strip(), x0, y0))
        for (Q, hx, hy) in heads:
            subs = {}
            for (x0, y0, x1, y1, t, b, l, n) in words:
                if hy + 1 < y0 < hy + 9 and hx - 40 < x0 < hx + 50:
                    key = {"M2": "M2", "M²": "M2", "LOTE": "LOTE", "VALOR": "VALOR",
                           "DISPONIBILIDADE": "DISPONIBILIDADE"}.get(t.upper().rstrip(":"))
                    if key and key not in subs:
                        subs[key] = x0
            cl = subs.get("LOTE", hx - 28); cm = subs.get("M2", hx - 19)
            cv = subs.get("VALOR", hx - 1); cd = subs.get("DISPONIBILIDADE", hx + 17)
            bottom = p.rect.height
            for (Q2, hx2, hy2) in heads:
                if abs(hx2 - hx) < 16 and hy + 6 < hy2 < bottom:
                    bottom = hy2
            for (x0, y0, x1, y1, t, b, l, n) in words:
                if hy + 8 < y0 < bottom and cd - 12 < x0 < cd + 40 and is_status_word(t):
                    st = clean_status(t)
                    if not st:
                        continue
                    r = grab_row(words, x0, y0, cl, cm, cv)
                    if r:
                        add(Q, r[0], r[1], r[2], st)

    p01_total = sum(len(v) for v in schedule.values())

    # --- páginas de continuação (sem cabeçalho) ---
    stitched = 0
    ambiguous = []
    for pi in range(doc.page_count):
        if pi in header_pages:
            continue
        words = doc[pi].get_text("words")
        anchors = [(x0, y0, t) for (x0, y0, x1, y1, t, b, l, n) in words if is_status_word(t)]
        if not anchors:
            continue
        rows = []
        for (sx, sy, t) in anchors:
            st = clean_status(t)
            if not st:
                continue
            r = grab_row(words, sx, sy, sx - 50, sx - 40, sx - 25)
            if r:
                rows.append((sx, sy, r[0], r[1], r[2], st))
        rows.sort(key=lambda z: (round(z[0] / 30), z[1]))
        blocks = []
        cur = []
        for r in rows:
            if cur and (abs(r[0] - cur[-1][0]) > 20 or r[2] != cur[-1][2] + 1):
                blocks.append(cur); cur = []
            cur.append(r)
        if cur:
            blocks.append(cur)
        for blk in blocks:
            s = blk[0][2]
            cands = [Q for Q in schedule if (max(schedule[Q]) if schedule[Q] else 0) == s - 1]
            if len(cands) == 1:
                Q = cands[0]
                for (sx, sy, lote, area, valor, st) in blk:
                    add(Q, lote, area, valor, st)
                stitched += len(blk)
            else:
                ambiguous.append((s, blk[-1][2], len(blk), cands))

    return schedule, p01_total, stitched, ambiguous


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pdf")
    ap.add_argument("--write")
    args = ap.parse_args()

    schedule, p01, stitched, ambiguous = parse(args.pdf)

    total = 0
    print("=== QUADRO DE DISPONIBILIDADE (oficial) ===")
    for Q in sorted(schedule):
        lts = sorted(schedule[Q])
        total += len(lts)
        miss = sorted(set(range(1, max(lts) + 1)) - set(lts)) if lts else []
        flag = f"  ⚠ MISSING={miss[:6]}{'…' if len(miss) > 6 else ''}" if miss else ""
        print(f"  {Q}: n={len(lts):>3} max={max(lts) if lts else 0:>3}{flag}")
    st = Counter(v[2] for d in schedule.values() for v in d.values())
    print(f"TOTAL={total}  (grade={p01} + continuações costuradas={stitched})")
    print("STATUS:", dict(st))
    if ambiguous:
        print("BLOCOS AMBÍGUOS (deixados p/ fallback de adjacência):", ambiguous)

    if args.write:
        out = {Q: [{"lote": l, "area": schedule[Q][l][0], "valor": schedule[Q][l][1],
                    "status": schedule[Q][l][2]} for l in sorted(schedule[Q])]
               for Q in sorted(schedule)}
        with open(args.write, "w", encoding="utf-8") as f:
            json.dump(out, f, ensure_ascii=False)
        print("wrote", args.write)


if __name__ == "__main__":
    main()
