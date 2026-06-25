/**
 * TEMPLATE de pontos de controle (GCPs) para georreferenciar o Alto Bellevue.
 * Sprint 2 — FASE 2/3. Consumido por `solveAffine` (lib/digital-twin/georef.ts).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * COMO PREENCHER (você só precisa do `lngLat`):
 *
 * 1. Cada item já traz o `pixel` (x,y no espaço do mapa atual) de um ponto
 *    reconhecível e bem distribuído do loteamento (extremos N/S/L/O).
 * 2. Abra o Google Earth/Maps, localize FISICAMENTE o mesmo ponto e copie a
 *    coordenada. Cole em `lngLat` na ordem GeoJSON: [longitude, latitude].
 *    Ex.: clicar no ponto no Google Earth → "−8.916500, −36.486200" (lat, lng)
 *         vira `lngLat: [-36.486200, -8.916500]` (LNG primeiro!).
 * 3. Bastam 3 pontos não colineares; 4+ (como aqui) reduzem o erro.
 * 4. Me devolva este arquivo preenchido — eu rodo `solveAffine`, confiro o
 *    `georefResiduals` (erro em METROS) e só gero o GeoJSON se estiver dentro da
 *    tolerância. Nada de coordenada chutada.
 *
 * Dica de precisão: prefira pontos fáceis de identificar dos dois lados
 * (portaria, esquinas de quadra, cruzamentos de rua, marco/mirante).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ControlPoint } from '@/types/digital-twin/geo';

/** `lngLat: null` = AINDA NÃO PREENCHIDO. Substitua por `[lng, lat]` reais. */
type ControlPointDraft = Omit<ControlPoint, 'lngLat'> & { lngLat: [number, number] | null };

export const ALTO_BELLEVUE_CONTROL_POINTS_TEMPLATE: ControlPointDraft[] = [
  // Extremo OESTE — próximo ao lote P-13
  { label: 'Oeste (ref. lote P-13)', pixel: { x: 199.3, y: 551.3 }, lngLat: null },
  // Extremo LESTE — próximo ao lote C-13
  { label: 'Leste (ref. lote C-13)', pixel: { x: 1050.6, y: 286.1 }, lngLat: null },
  // Extremo NORTE/TOPO — próximo ao lote D-25
  { label: 'Norte (ref. lote D-25)', pixel: { x: 828.1, y: 135.1 }, lngLat: null },
  // Extremo SUL/BASE — próximo ao lote N-23
  { label: 'Sul (ref. lote N-23)', pixel: { x: 561.2, y: 696.9 }, lngLat: null },
];

/** Filtra apenas os pontos já preenchidos — pronto para `solveAffine`. */
export function resolveControlPoints(drafts: ControlPointDraft[] = ALTO_BELLEVUE_CONTROL_POINTS_TEMPLATE): ControlPoint[] {
  return drafts
    .filter((d): d is ControlPoint => Array.isArray(d.lngLat))
    .map((d) => ({ label: d.label, pixel: d.pixel, lngLat: d.lngLat }));
}
