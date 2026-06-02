#!/usr/bin/env python3
"""
Gera um JSON de lotes placeholder para Alto Bellevue baseado no layout visual do projeto.
Execute UMA VEZ para ter dados demo. Substitua depois com o DXF real.

python3 scripts/generate_placeholder_lots.py
"""
import json, math, os, random

random.seed(42)

W, H = 1200, 900

# Layout visual do Alto Bellevue: lotes em fileiras curvas
# Definimos as "ruas" (splines) e colocamos lotes ao longo delas
# Baseado na análise visual da planta: ~7 faixas principais curvas

def rot(x, y, angle_deg):
    a = math.radians(angle_deg)
    return x * math.cos(a) - y * math.sin(a), x * math.sin(a) + y * math.cos(a)

def lot_polygon(cx, cy, w, h, angle_deg):
    """Retorna os 4 vértices de um lote retangular rotacionado."""
    corners = [(-w/2, -h/2), (w/2, -h/2), (w/2, h/2), (-w/2, h/2)]
    pts = [rot(x, y, angle_deg) for x, y in corners]
    return [(round(cx + px, 1), round(cy + py, 1)) for px, py in pts]

def pts_str(pts):
    return " ".join(f"{p[0]},{p[1]}" for p in pts)

def centroid(pts):
    return round(sum(p[0] for p in pts)/len(pts), 1), round(sum(p[1] for p in pts)/len(pts), 1)

# ─── SETORES (Quadras A–N) com posições aproximadas ─────────────────────────
# Cada setor: (nome, centro_x, centro_y, num_lotes, cols, lot_w, lot_h, angle)
# Baseado na screenshot: lotes menores nos setores centrais, maiores nas bordas

sectors = [
    # Norte — setores A,B (lotes maiores)
    {"q": "A", "cx": 380, "cy": 250, "cols": 6, "rows": 5, "lw": 28, "lh": 38, "ang": -15},
    {"q": "B", "cx": 520, "cy": 220, "cols": 7, "rows": 4, "lw": 26, "lh": 36, "ang": -10},
    {"q": "C", "cx": 660, "cy": 210, "cols": 6, "rows": 4, "lw": 26, "lh": 35, "ang": -5},

    # Centro — setores D,E,F,G
    {"q": "D", "cx": 440, "cy": 370, "cols": 7, "rows": 5, "lw": 24, "lh": 34, "ang": -12},
    {"q": "E", "cx": 580, "cy": 360, "cols": 8, "rows": 5, "lw": 22, "lh": 32, "ang": -8},
    {"q": "F", "cx": 720, "cy": 340, "cols": 7, "rows": 5, "lw": 22, "lh": 32, "ang": -4},
    {"q": "G", "cx": 840, "cy": 320, "cols": 5, "rows": 4, "lw": 24, "lh": 34, "ang": 0},

    # Centro-Sul — setores H,I,L
    {"q": "H", "cx": 400, "cy": 510, "cols": 6, "rows": 5, "lw": 22, "lh": 30, "ang": -10},
    {"q": "I", "cx": 540, "cy": 500, "cols": 8, "rows": 5, "lw": 21, "lh": 29, "ang": -6},
    {"q": "L", "cx": 680, "cy": 490, "cols": 7, "rows": 5, "lw": 22, "lh": 30, "ang": -3},

    # Sul — setores M,N
    {"q": "M", "cx": 450, "cy": 650, "cols": 8, "rows": 6, "lw": 22, "lh": 30, "ang": -8},
    {"q": "N", "cx": 620, "cy": 660, "cols": 9, "rows": 6, "lw": 21, "lh": 28, "ang": -5},

    # Extremo Sul — setor P (lotes maiores, condomínio)
    {"q": "P", "cx": 560, "cy": 790, "cols": 6, "rows": 4, "lw": 30, "lh": 40, "ang": -3},
]

# Status distribution: ~60% disponível, ~35% vendido, ~5% negociação
STATUS_WEIGHTS = ["disponivel"] * 60 + ["vendido"] * 35 + ["negociacao"] * 5

lots = []

for s in sectors:
    cols, rows = s["cols"], s["rows"]
    lw, lh, ang = s["lw"], s["lh"], s["ang"]
    q = s["q"]

    # Gap entre lotes (rua interna)
    gap_x, gap_y = 3, 3

    total_w = cols * (lw + gap_x)
    total_h = rows * (lh + gap_y)

    for row in range(rows):
        for col in range(cols):
            # Posição local do lote (sem rotação)
            lx = (col - cols / 2 + 0.5) * (lw + gap_x)
            ly = (row - rows / 2 + 0.5) * (lh + gap_y)

            # Rotacionar pelo ângulo do setor
            rx, ry = rot(lx, ly, ang)
            cx = s["cx"] + rx
            cy = s["cy"] + ry

            # Verificar se está dentro do canvas
            if cx < 30 or cx > W - 30 or cy < 30 or cy > H - 30:
                continue

            lote_num = len([x for x in lots if x["quadra"] == q]) + 1
            lot_id = f"{q}-{str(lote_num).zfill(2)}"

            pts = lot_polygon(cx, cy, lw - 2, lh - 2, ang)
            status = random.choice(STATUS_WEIGHTS)

            # ~15% dos lotes sem preço (= disponíveis mas não mapeados com preço)
            price = None
            area_m2 = round(random.uniform(250, 450), 0)
            if status == "disponivel" and random.random() > 0.15:
                price_per_m2 = random.uniform(600, 800)
                price = round(area_m2 * price_per_m2)

            label_cx, label_cy = centroid(pts)

            lots.append({
                "id": lot_id,
                "quadra": q,
                "lote": str(lote_num).zfill(2),
                "points": pts_str(pts),
                "area": int(area_m2),
                "labelX": label_cx,
                "labelY": label_cy,
                "status": status,
                "price": price,
            })

# Contagens
total = len(lots)
disp = sum(1 for l in lots if l["status"] == "disponivel")
vend = sum(1 for l in lots if l["status"] == "vendido")
neg = sum(1 for l in lots if l["status"] == "negociacao")
sem_preco = sum(1 for l in lots if l["status"] == "disponivel" and l["price"] is None)
mapeados = total - sem_preco

print(f"Total: {total} | Disponíveis: {disp} | Vendidos: {vend} | Negociação: {neg}")
print(f"Mapeados: {mapeados} | Sem preço: {sem_preco}")

# Amenidades do projeto
amenities = [
    {"id": "piscina", "label": "Piscina", "icon": "🏊", "x": 760, "y": 550, "color": "#3b82f6"},
    {"id": "quadra-tennis", "label": "Quadra de Tênis", "icon": "🎾", "x": 820, "y": 500, "color": "#10b981"},
    {"id": "quadra-poli", "label": "Quadra Poliesportiva", "icon": "🏀", "x": 870, "y": 560, "color": "#f59e0b"},
    {"id": "coworking", "label": "Coworking", "icon": "💼", "x": 300, "y": 380, "color": "#8b5cf6"},
    {"id": "igreja", "label": "Capelinha", "icon": "⛪", "x": 310, "y": 600, "color": "#ec4899"},
    {"id": "playground", "label": "Playground", "icon": "🎠", "x": 760, "y": 700, "color": "#f97316"},
    {"id": "academia", "label": "Academia", "icon": "🏋️", "x": 830, "y": 640, "color": "#14b8a6"},
    {"id": "portaria", "label": "Portaria Principal", "icon": "🏠", "x": 300, "y": 800, "color": "#64748b"},
    {"id": "espaco-gourmet", "label": "Espaço Gourmet", "icon": "🍽️", "x": 710, "y": 620, "color": "#dc2626"},
    {"id": "lago", "label": "Lago / Espelho d'água", "icon": "💧", "x": 550, "y": 590, "color": "#0ea5e9"},
]

output = {
    "viewBox": f"0 0 {W} {H}",
    "totalLots": total,
    "stats": {
        "disponiveis": disp,
        "vendidos": vend,
        "negociacao": neg,
        "mapeados": mapeados,
        "semPreco": sem_preco,
    },
    "lots": lots,
    "amenities": amenities,
    "note": "PLACEHOLDER — substituir com dados reais do DWG via extract_lots_from_dxf.py",
}

out_path = os.path.join(os.path.dirname(__file__), "..", "public", "maps", "alto-bellevue-lots.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
print(f"\n✅ Gerado: {os.path.abspath(out_path)}")
