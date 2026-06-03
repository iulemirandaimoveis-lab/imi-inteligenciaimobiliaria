'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';

export type LotStatus = 'disponivel' | 'vendido' | 'negociacao';

export interface LotMapEntry {
  id: string;
  quadra: string;
  lote: string;
  points: string;
  area: number;
  labelX: number;
  labelY: number;
  status: LotStatus;
  price: number | null;
  pricePerM2?: number | null;
  discountPct?: number;
  // Enriched from Supabase
  dbId?: string;
  unitName?: string;
}

export interface AmenityPoint {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  color: string;
}

export interface LotMapData {
  viewBox: string;
  totalLots: number;
  stats: {
    disponiveis: number;
    vendidos: number;
    negociacao: number;
    mapeados: number;
    semPreco: number;
  };
  lots: LotMapEntry[];
  amenities: AmenityPoint[];
  note?: string;
}

interface UseLotMapResult {
  lots: LotMapEntry[];
  amenities: AmenityPoint[];
  viewBox: string;
  stats: LotMapData['stats'] | null;
  isLoading: boolean;
  fetchError: string | null;
  selectedLot: LotMapEntry | null;
  setSelectedLot: (lot: LotMapEntry | null) => void;
  activeFilter: string;
  setActiveFilter: (f: string) => void;
  quadras: string[];
}

export function useLotMap(developmentId: string, jsonUrl: string): UseLotMapResult {
  const [staticData, setStaticData] = useState<LotMapData | null>(null);
  const [lots, setLots] = useState<LotMapEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<LotMapEntry | null>(null);
  const [activeFilter, setActiveFilter] = useState('todos');

  // Load static JSON (polygons from DWG/DXF)
  useEffect(() => {
    setIsLoading(true);
    setFetchError(null);
    fetch(jsonUrl)
      .then(r => {
        if (!r.ok) throw new Error(`Mapa não encontrado (${r.status})`);
        return r.json();
      })
      .then((data: LotMapData) => {
        setStaticData(data);
        setLots(data.lots);
      })
      .catch((err: Error) => {
        setFetchError(err.message ?? 'Erro ao carregar mapa de lotes.');
        setIsLoading(false);
      });
  }, [jsonUrl]);

  // Enrich with live Supabase data (status, price)
  useEffect(() => {
    if (!staticData || !developmentId) return;

    const supabase = createClient();
    supabase
      .from('development_units')
      .select('id, unit_name, polygon_id, quadra, lote_number, total_price, price_per_m2, map_status, area, discount_pct')
      .eq('development_id', developmentId)
      .then(({ data }) => {
        if (!data || data.length === 0) {
          setIsLoading(false);
          return;
        }

        // Build lookup: polygon_id → db row
        const byPolygonId = new Map(data.map(u => [u.polygon_id, u]));

        setLots(prev =>
          prev.map(lot => {
            const db = byPolygonId.get(lot.id);
            if (!db) return lot;
            return {
              ...lot,
              status: (db.map_status as LotStatus) ?? lot.status,
              price: db.total_price ?? lot.price,
              pricePerM2: db.price_per_m2 ?? undefined,
              discountPct: db.discount_pct ?? 20,
              dbId: db.id,
              unitName: db.unit_name,
              area: db.area ?? lot.area,
            };
          })
        );
        setIsLoading(false);
      });
  }, [staticData, developmentId]);

  const quadras = useMemo(
    () => Array.from(new Set(lots.map(l => l.quadra))).sort(),
    [lots],
  );

  const filteredLots = useMemo(() => {
    if (activeFilter === 'todos') return lots;
    if (activeFilter === 'disponiveis') return lots.filter(l => l.status === 'disponivel');
    return lots.filter(l => l.quadra === activeFilter);
  }, [lots, activeFilter]);

  return {
    lots: filteredLots,
    amenities: staticData?.amenities ?? [],
    viewBox: staticData?.viewBox ?? '0 0 1200 900',
    stats: staticData?.stats ?? null,
    isLoading,
    fetchError,
    selectedLot,
    setSelectedLot,
    activeFilter,
    setActiveFilter,
    quadras,
  };
}
