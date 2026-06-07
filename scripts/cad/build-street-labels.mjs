#!/usr/bin/env node
/**
 * build-street-labels.mjs — Regenera streetLabels com ROTAÇÃO (seguindo o eixo da via,
 * como no PDF). Extrai DB2_NOME_DAS_RUAS da cópia 1, transforma p/ viewBox, calcula o
 * ângulo no espaço SVG (com o flip de Y), normaliza p/ leitura e deduplica.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const { entities: ents } = JSON.parse(readFileSync(resolve(__dirname, '.cache/cad-entities.json'), 'utf8'));
const M = JSON.parse(readFileSync(resolve(__dirname, '.cache/transform.json'), 'utf8')).M;
const MAP = resolve(ROOT, 'public/maps/alto-bellevue-lots.json');
const map = JSON.parse(readFileSync(MAP, 'utf8'));

const C1 = { minX: 3900, maxX: 5200, minY: 850, maxY: 2500 };
const inBox = (p) => p[0] >= C1.minX && p[0] <= C1.maxX && p[1] >= C1.minY && p[1] <= C1.maxY;
const tf = (x, y) => [M.a * x + M.b * y + M.c, M.d * x + M.e * y + M.f];
const r2 = (n) => Math.round(n * 100) / 100;

// Só nomes de rua reais (exclui rótulos de seção viária: PASSEIO/VIA/CANTEIRO/ÁREA VERDE)
const STREET = /^(ALAMEDA|AVENIDA|VIA LOCAL|TRECHO)/i;
const texts = ents.filter(
  (e) => e.layer === 'DB2_NOME_DAS_RUAS' && (e.t === 'TEXT' || e.t === 'MTEXT') && inBox(e.at) && STREET.test((e.text || '').trim()),
);

function svgAngle(rotDeg) {
  // direção do texto no CAD (y-up) → transformada (a·cos+c·sin, b·cos+d·sin); ângulo em tela (y-down)
  // Parte linear da afim: X-row = (a,b), Y-row = (d,e). tf = (a·x+b·y+c, d·x+e·y+f).
  const t = (rotDeg * Math.PI) / 180;
  const dx = M.a * Math.cos(t) + M.b * Math.sin(t);
  const dy = M.d * Math.cos(t) + M.e * Math.sin(t);
  let deg = (Math.atan2(dy, dx) * 180) / Math.PI; // CW positivo em tela
  if (deg > 90) deg -= 180; // evita texto de cabeça p/ baixo
  if (deg < -90) deg += 180;
  return r2(deg);
}

const labels = texts.map((e) => {
  const [x, y] = tf(e.at[0], e.at[1]);
  return { name: (e.text || '').trim(), x: r2(x), y: r2(y), rot: svgAngle(e.rot || 0) };
});

// Dedup: mesma rua a < 70 unidades — mantém poucas instâncias ao longo da curva
const out = [];
for (const l of labels.sort((a, b) => a.name.localeCompare(b.name))) {
  if (!out.some((o) => o.name === l.name && Math.hypot(o.x - l.x, o.y - l.y) < 70)) out.push(l);
}
out.sort((a, b) => a.y - b.y);

map.streetLabels = out;
writeFileSync(MAP, JSON.stringify(map));
console.log(`streetLabels: ${out.length} (com rotação)`);
const byName = {};
for (const l of out) byName[l.name] = (byName[l.name] || 0) + 1;
console.log('por rua:', JSON.stringify(byName, null, 0));
console.log('amostra:', out.slice(0, 6).map((l) => `${l.name}@(${l.x},${l.y}) rot=${l.rot}`));
