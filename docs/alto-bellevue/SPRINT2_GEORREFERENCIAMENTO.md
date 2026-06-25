# Sprint 2 — Georreferenciamento SVG↔WGS84 (Alto Bellevue)

> Ataca a **limitação L1** da auditoria: o mapa é fiel ao CAD num frame SVG local,
> mas **não tem projeção geográfica** — por isso não sobrepõe a satélite/Google Earth.
> Este sprint adiciona a **infraestrutura** que deriva e aplica o transform SVG→WGS84.

## O que já está pronto (este PR)

- `scripts/cad/geo/solve-geo-transform.mjs` — ajuste afim 2D por mínimos quadrados
  `[lng,lat] = a·x + b·y + c , d·x + e·y + f`, com resíduo reportado **em metros**.
- `scripts/cad/geo/control-points.json` — insumo de pontos de controle (**PENDING**;
  sem coordenadas inventadas).
- `npm run geo:selftest` — **prova a matemática** com um transform sintético conhecido
  (recuperação com erro de coeficiente ~1e-15 e resíduo ~1e-9 m).
- `npm run geo:solve` — deriva o transform real **assim que houver ≥3 pontos**; enquanto
  vazio, reporta `PENDING` e sai 0 (não quebra CI).

## O que falta (insumo do produto — não é código)

Preencher `scripts/cad/geo/control-points.json` com **3–4 pontos de controle** reais:

```json
{
  "status": "READY",
  "points": [
    { "label": "Guarita/Portaria", "svg": [1030.5, 181.5], "lngLat": [-36.49xx, -8.88xx] },
    { "label": "Acesso BR-423",    "svg": [  x   ,   y   ], "lngLat": [-36.49xx, -8.89xx] },
    { "label": "Vértice perímetro SO", "svg": [ x ,  y   ], "lngLat": [-36.50xx, -8.89xx] }
  ]
}
```

- `svg`  = ler no viewBox `0 0 1200 821.86` da fonte canônica `public/maps/alto-bellevue-lots.json`.
- `lngLat` = ler no Google Earth (clique direito → coordenadas) **nos mesmos pontos físicos**.
- Bons candidatos: guarita, acesso na BR-423, cruzamentos de rua, vértices marcantes do perímetro.

Depois: `npm run geo:solve` → escreve `public/maps/alto-bellevue-geo.json` com a matriz,
o resíduo em metros e os 4 cantos do viewBox em lng/lat.

## Critério de aceite do Sprint 2

- Resíduo máximo **< ~5 m** nos pontos de controle (ajustável conforme a fonte).
- Os 4 cantos projetados conferem visualmente com o Google Earth.
- (Próximo PR) usar `alto-bellevue-geo.json` para uma **camada de satélite opcional**
  sob o SVG (Mapbox/MapLibre já estão nas deps) — Sprint 4.

> Regra mantida: **a planta/Google Earth é a única fonte da verdade**. O solver não
> inventa pontos; sem dados reais ele permanece `PENDING`.
