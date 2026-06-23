/**
 * Tipos próprios do Alto Bellevue Digital Twin (namespace isolado de homologação).
 *
 * IMPORTANTE: estes tipos são uma CÓPIA ISOLADA. Não importam nem dependem dos
 * tipos de produção (`@/lib/lots/*`, `imoveis/types/*`). A evolução do Digital Twin
 * acontece aqui sem qualquer risco para a página comercial `/imoveis/alto-bellevue`.
 *
 * Sprint 0 — Isolamento. Nenhuma feature nova; apenas a fundação tipada.
 */

export type DigitalTwinLotStatus =
  | 'DISPONIVEL'
  | 'NEGOCIACAO'
  | 'VENDIDO'
  | 'RESERVADO'
  | 'PROPRIETARIO';

/** Ponto no espaço de coordenadas da fonte (viewBox SVG em px). */
export interface DigitalTwinPoint {
  x: number;
  y: number;
}

export interface DigitalTwinLot {
  id: string;
  quadra: string;
  lotNumber: string;
  areaM2: number | null;
  price: number | null;
  status: DigitalTwinLotStatus;
  /**
   * Polígono no espaço de coordenadas da fonte (px do viewBox).
   * O georreferenciamento real (CRS lat/lng) é introduzido apenas na Sprint 2 —
   * por enquanto, mantemos a mesma fonte canônica usada hoje.
   */
  polygon: DigitalTwinPoint[];
  centroid: DigitalTwinPoint;
}

export interface DigitalTwinStats {
  total: number;
  disponiveis: number;
  negociacao: number;
  vendidos: number;
  reservados: number;
  proprietario: number;
}

export interface DigitalTwinModel {
  /** viewBox da fonte (px SVG). Sprint 2 adiciona um CRS geográfico real. */
  viewBox: { w: number; h: number };
  lots: DigitalTwinLot[];
  stats: DigitalTwinStats;
}
