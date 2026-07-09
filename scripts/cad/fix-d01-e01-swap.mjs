#!/usr/bin/env node
/**
 * fix-d01-e01-swap.mjs — Corrige a troca de geometria entre D-01 e E-01
 * no mapa canônico do Alto Bellevue.
 *
 * Diagnóstico (conferido contra a PLANTA DE PARCELAMENTO R05 oficial):
 *   - D-01 é o lote de esquina grande (692,69 m²), no topo da Quadra D.
 *   - E-01 (436,10 m²) fica no topo da coluna central da Quadra E, logo
 *     acima do E-02, do outro lado da Alameda dos Flamboyant.
 *   No JSON gerado, os POLÍGONOS dos dois estavam trocados: o polígono grande
 *   (esquina) estava rotulado E-01 e o menor estava rotulado D-01 — o que
 *   fazia o E-01 aparecer encravado na Quadra D ("lote trocado" reportado).
 *
 * Verificação numérica: razão de área oficial D-01/E-01 = 1,589. Com os
 * polígonos como estavam, a razão das áreas SVG dava 0,64 (invertida); ao
 * trocar as geometrias, 1,56 — batendo com o oficial. Nenhuma coordenada é
 * inventada: apenas devolvemos cada polígono oficial ao seu lote.
 *
 * Idempotente: só troca se detectar o estado invertido (polígono do E-01
 * maior que o do D-01). Rodar novamente não faz nada.
 *
 * Uso: node scripts/cad/fix-d01-e01-swap.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MAP = resolve(__dirname, '../../public/maps/alto-bellevue-lots.json');

const shoelace = (pointsStr) => {
  const P = pointsStr.trim().split(/\s+/).map((p) => p.split(',').map(Number));
  let s = 0;
  for (let i = 0; i < P.length; i++) {
    const [x1, y1] = P[i];
    const [x2, y2] = P[(i + 1) % P.length];
    s += x1 * y2 - x2 * y1;
  }
  return Math.abs(s) / 2;
};

const data = JSON.parse(readFileSync(MAP, 'utf8'));
const d1 = data.lots.find((l) => l.quadra === 'D' && l.lote === '01');
const e1 = data.lots.find((l) => l.quadra === 'E' && l.lote === '01');
if (!d1 || !e1) { console.error('D-01/E-01 não encontrados'); process.exit(1); }

const aD = shoelace(d1.points);
const aE = shoelace(e1.points);
// Estado correto: D-01 (692,69 m²) tem polígono MAIOR que E-01 (436,10 m²).
if (aD >= aE) {
  console.log(`Nada a fazer: D-01 (svg ${aD.toFixed(0)}) já é maior que E-01 (svg ${aE.toFixed(0)}).`);
  process.exit(0);
}
for (const k of ['points', 'labelX', 'labelY']) {
  const tmp = d1[k]; d1[k] = e1[k]; e1[k] = tmp;
}
writeFileSync(MAP, JSON.stringify(data, null, 0) + '\n', 'utf8');
console.log(`OK: geometria D-01 <-> E-01 trocada. D-01 svg ${shoelace(d1.points).toFixed(0)} | E-01 svg ${shoelace(e1.points).toFixed(0)}.`);
