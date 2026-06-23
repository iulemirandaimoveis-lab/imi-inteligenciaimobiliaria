/**
 * Adaptador de dados do Digital Twin (Sprint 0 — Isolamento).
 *
 * Wrapper SOMENTE LEITURA sobre a fonte canônica existente
 * (`public/maps/alto-bellevue-lots.json`). Não modifica o contrato de produção:
 * apenas mapeia o JSON canônico para os tipos próprios do Digital Twin.
 *
 * Função pura (`adaptCanonicalToDigitalTwin`) + loader de cliente
 * (`loadDigitalTwinModel`). A pura é testável isoladamente (Jest/node).
 */

import type {
  DigitalTwinLot,
  DigitalTwinLotStatus,
  DigitalTwinModel,
  DigitalTwinPoint,
  DigitalTwinStats,
} from '@/types/digital-twin';
import { ALTO_BELLEVUE_DT } from '@/data/digital-twin/alto-bellevue';

/** Shape (parcial) do JSON canônico — declarado localmente p/ não acoplar à produção. */
interface RawCanonicalLot {
  id: string;
  quadra: string;
  lote: string;
  points?: string;
  area?: number;
  metragem?: number;
  labelX?: number;
  labelY?: number;
  status?: string;
  price?: number | null;
}

interface RawCanonicalMap {
  viewBox?: string;
  lots?: RawCanonicalLot[];
}

const STATUS_MAP: Record<string, DigitalTwinLotStatus> = {
  disponivel: 'DISPONIVEL',
  disponível: 'DISPONIVEL',
  negociacao: 'NEGOCIACAO',
  negociação: 'NEGOCIACAO',
  venda: 'VENDIDO',
  vendido: 'VENDIDO',
  vendida: 'VENDIDO',
  vendidos: 'VENDIDO',
  reservado: 'RESERVADO',
  reserva: 'RESERVADO',
  proprietario: 'PROPRIETARIO',
  proprietário: 'PROPRIETARIO',
};

/** Normaliza o status (minúsculo na fonte) para o código do Digital Twin. */
export function normalizeDigitalTwinStatus(raw: string | null | undefined): DigitalTwinLotStatus {
  if (!raw) return 'DISPONIVEL';
  return STATUS_MAP[raw.trim().toLowerCase()] ?? 'DISPONIVEL';
}

/** Converte `"x,y x,y x,y"` em uma lista de pontos. */
export function parsePoints(points: string | undefined): DigitalTwinPoint[] {
  if (!points) return [];
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(',').map(Number);
      return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
    });
}

/** Extrai `{ w, h }` de `"0 0 1200.0 821.86"`. */
function parseViewBox(viewBox: string | undefined): { w: number; h: number } {
  const fallback = { w: 1200, h: 821.86 };
  if (!viewBox) return fallback;
  const parts = viewBox.trim().split(/\s+/).map(Number);
  const w = parts[2];
  const h = parts[3];
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return fallback;
  return { w, h };
}

function centroidOf(polygon: DigitalTwinPoint[], labelX?: number, labelY?: number): DigitalTwinPoint {
  if (Number.isFinite(labelX) && Number.isFinite(labelY)) {
    return { x: labelX as number, y: labelY as number };
  }
  if (polygon.length === 0) return { x: 0, y: 0 };
  const sum = polygon.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / polygon.length, y: sum.y / polygon.length };
}

function emptyStats(): DigitalTwinStats {
  return { total: 0, disponiveis: 0, negociacao: 0, vendidos: 0, reservados: 0, proprietario: 0 };
}

function computeStats(lots: DigitalTwinLot[]): DigitalTwinStats {
  const stats = emptyStats();
  stats.total = lots.length;
  for (const lot of lots) {
    switch (lot.status) {
      case 'DISPONIVEL': stats.disponiveis++; break;
      case 'NEGOCIACAO': stats.negociacao++; break;
      case 'VENDIDO': stats.vendidos++; break;
      case 'RESERVADO': stats.reservados++; break;
      case 'PROPRIETARIO': stats.proprietario++; break;
    }
  }
  return stats;
}

/** Função pura: JSON canônico → modelo do Digital Twin. */
export function adaptCanonicalToDigitalTwin(raw: RawCanonicalMap): DigitalTwinModel {
  const lots: DigitalTwinLot[] = (raw.lots ?? []).map((l) => {
    const polygon = parsePoints(l.points);
    const area = Number.isFinite(l.area) ? (l.area as number) : Number.isFinite(l.metragem) ? (l.metragem as number) : null;
    return {
      id: l.id,
      quadra: l.quadra,
      lotNumber: l.lote,
      areaM2: area,
      price: typeof l.price === 'number' ? l.price : null,
      status: normalizeDigitalTwinStatus(l.status),
      polygon,
      centroid: centroidOf(polygon, l.labelX, l.labelY),
    };
  });

  return {
    viewBox: parseViewBox(raw.viewBox),
    lots,
    stats: computeStats(lots),
  };
}

/** Loader de cliente — busca a fonte canônica (somente leitura) e adapta. */
export async function loadDigitalTwinModel(signal?: AbortSignal): Promise<DigitalTwinModel> {
  const res = await fetch(ALTO_BELLEVUE_DT.canonicalMapPath, { signal });
  if (!res.ok) {
    throw new Error(`Digital Twin: falha ao carregar mapa canônico (HTTP ${res.status}).`);
  }
  const raw = (await res.json()) as RawCanonicalMap;
  return adaptCanonicalToDigitalTwin(raw);
}
