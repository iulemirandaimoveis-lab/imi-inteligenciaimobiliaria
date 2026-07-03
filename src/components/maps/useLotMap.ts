'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type LotStatus = 'disponivel' | 'reservado' | 'negociacao' | 'vendido' | 'documentacao' | 'bloqueado';
export type StatusFilter = 'todos' | 'disponiveis' | 'reservados' | 'vendidos' | 'negociacao';

/** subdivision_lots.status é MAIÚSCULO; o mapa/UI usam minúsculo. */
export function normalizeLotStatus(raw: string | null | undefined): LotStatus {
  switch (String(raw ?? '').toUpperCase()) {
    case 'DISPONIVEL':   return 'disponivel';
    case 'RESERVADO':    return 'reservado';
    case 'NEGOCIACAO':
    case 'EM_NEGOCIACAO':
    case 'NEGOCIACAO_EM_ANDAMENTO': return 'negociacao';
    case 'DOCUMENTACAO': return 'documentacao';
    case 'BLOQUEADO':    return 'bloqueado';
    // VENDIDO, PROPRIETARIO, ANTENA e quaisquer outros → indisponível
    default: return 'vendido';
  }
}

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
  brokerName?: string;   // from lot_status_history metadata
  // Planos de pagamento oficiais (do JSON de preços) — usados pelo simulador
  valor?: number | null;        // preço de tabela
  valorVista?: number | null;   // preço à vista
  entrada?: number;             // entrada padrão (~10%)
  p12?: PaymentPlan;
  p36?: PaymentPlan;
  p60?: PaymentPlan;
  p120?: PaymentPlan;
  metragem?: number;
}

export interface PaymentPlan {
  total: number;
  parcela: number;
}

export interface AmenityPoint {
  id: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  color: string;
}

export interface StreetLabel {
  x: number;
  y: number;
  name: string;
}

export interface MapMarker {
  x: number;
  y: number;
  label: string;
}

export interface FilteredStats {
  total: number;
  disponiveis: number;
  reservados: number;
  vendidos: number;
  negociacao: number;
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
  greenAreas?: string[];
  streets?: string[];
  perimeter?: string[];
  brLine?: string[];
  streetLabels?: StreetLabel[];
  entrance?: MapMarker | null;
  note?: string;
}

interface UseLotMapResult {
  lots: LotMapEntry[];       // filtered by both dimensions — use for rendering
  allLots: LotMapEntry[];    // unfiltered enriched lots — use for quadra stats & viewport fitting
  amenities: AmenityPoint[];
  greenAreas: string[];
  streets: string[];
  perimeter: string[];
  brLine: string[];
  streetLabels: StreetLabel[];
  entrance: MapMarker | null;
  viewBox: string;
  stats: LotMapData['stats'] | null;
  filteredStats: FilteredStats;
  isLoading: boolean;
  fetchError: string | null;
  selectedLot: LotMapEntry | null;
  setSelectedLot: (lot: LotMapEntry | null) => void;
  // Two-dimensional filter — status is orthogonal to quadra
  statusFilter: StatusFilter;
  setStatusFilter: (f: StatusFilter) => void;
  selectedQuadra: string | null;
  setSelectedQuadra: (q: string | null) => void;
  quadras: string[];
  // CRM actions — corretor/gestor
  isManager: boolean;
  actionLoading: boolean;
  actionError: string | null;
  reserveLot: (lot: LotMapEntry, opts?: { clientName?: string; clientPhone?: string; note?: string; brokerName?: string }) => Promise<boolean>;
  releaseLot: (lot: LotMapEntry, reason?: string) => Promise<boolean>;
  negotiateLot: (lot: LotMapEntry, opts?: { brokerName?: string; clientName?: string; clientPhone?: string; note?: string }) => Promise<boolean>;
  changeStatus: (lot: LotMapEntry, newStatus: string, opts?: { reason?: string; brokerName?: string }) => Promise<boolean>;
}

export function useLotMap(developmentId: string, jsonUrl: string): UseLotMapResult {
  const [staticData, setStaticData] = useState<LotMapData | null>(null);
  // rawLots: Supabase-enriched but unfiltered
  const [rawLots, setRawLots] = useState<LotMapEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedLot, setSelectedLot] = useState<LotMapEntry | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [selectedQuadra, setSelectedQuadra] = useState<string | null>(null);
  const [isManager, setIsManager] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Load static JSON (polygons from DWG/DXF)
  useEffect(() => {
    // Flag de cancelamento: sem ela, trocar de empreendimento rapidamente deixa
    // o fetch antigo resolver por último e sobrescrever o mapa do novo.
    let cancelled = false;
    setIsLoading(true);
    setFetchError(null);
    fetch(jsonUrl)
      .then(r => {
        if (!r.ok) throw new Error(`Mapa não encontrado (${r.status})`);
        return r.json();
      })
      .then((data: LotMapData) => {
        if (cancelled) return;
        setStaticData(data);
        setRawLots(data.lots);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setFetchError(err.message ?? 'Erro ao carregar mapa de lotes.');
        setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [jsonUrl]);

  // Enrich with live Supabase data — overwrites status and dbId; price comes
  // from static JSON. Depois da carga inicial, ressincroniza periodicamente
  // (só com a aba visível) — é isto que honra o "status ao vivo" prometido na UI.
  useEffect(() => {
    if (!staticData || !developmentId) return;

    const supabase = createClient();
    let cancelled = false;

    const sync = (initial: boolean) => {
      supabase
        .from('subdivision_lots')
        .select('id, quadra, lot_number, status, price')
        .eq('development_id', developmentId)
        .then(({ data }: { data: Array<{ id: string; quadra: string; lot_number: number; status: string; price: number | null }> | null }) => {
          if (cancelled) return;
          if (!data || data.length === 0) {
            if (initial) setIsLoading(false);
            return;
          }

          // Lookup: "QUADRA-LOTNUMBER" → db row
          const byKey = new Map(
            data.map(u => [`${String(u.quadra).toUpperCase()}-${u.lot_number}`, u]),
          );

          const enrich = (lot: LotMapEntry): LotMapEntry => {
            const db = byKey.get(`${lot.quadra.toUpperCase()}-${parseInt(lot.lote, 10)}`);
            if (!db) return lot;
            return {
              ...lot,
              status: normalizeLotStatus(db.status),
              price: db.price ?? lot.price,
              dbId: db.id,
            };
          };

          setRawLots(prev => prev.map(enrich));
          setSelectedLot(prev => (prev ? enrich(prev) : prev));
          if (initial) setIsLoading(false);
        });
    };

    sync(true);

    const REFRESH_MS = 45_000;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') sync(false);
    }, REFRESH_MS);
    // Voltou para a aba → ressincroniza na hora, sem esperar o próximo tick
    const onVisible = () => { if (document.visibilityState === 'visible') sync(false); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [staticData, developmentId]);

  // Detecta se o usuário logado é corretor/gestor
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setIsManager(false); return; }
      supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          setIsManager(data?.role === 'admin' || data?.role === 'manager');
        });
    });
  }, []);

  const patchLotStatus = useCallback((lotId: string, status: LotStatus) => {
    setRawLots(prev => prev.map(l => (l.id === lotId ? { ...l, status } : l)));
    setSelectedLot(prev => (prev && prev.id === lotId ? { ...prev, status } : prev));
  }, []);

  const reserveLot = useCallback<UseLotMapResult['reserveLot']>(async (lot, opts) => {
    if (!lot.dbId) {
      setActionError('Lote ainda não sincronizado com o banco.');
      return false;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/lots/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: lot.dbId, action: 'reserve', ...opts }),
      });
      const json = await res.json();
      if (!res.ok) { setActionError(json.error ?? 'Falha ao reservar.'); return false; }
      patchLotStatus(lot.id, 'reservado');
      return true;
    } catch {
      setActionError('Erro de rede ao reservar.');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [patchLotStatus]);

  const releaseLot = useCallback<UseLotMapResult['releaseLot']>(async (lot, reason) => {
    if (!lot.dbId) return false;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/lots/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId: lot.dbId, action: 'release', note: reason }),
      });
      const json = await res.json();
      if (!res.ok) { setActionError(json.error ?? 'Falha ao liberar.'); return false; }
      patchLotStatus(lot.id, 'disponivel');
      return true;
    } catch {
      setActionError('Erro de rede ao liberar.');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [patchLotStatus]);

  const negotiateLot = useCallback<UseLotMapResult['negotiateLot']>(async (lot, opts) => {
    if (!lot.dbId) {
      setActionError('Lote ainda não sincronizado com o banco.');
      return false;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/lotmap/negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotId: lot.dbId, ...opts }),
      });
      const json = await res.json();
      if (!res.ok) { setActionError(json.error ?? 'Falha ao registrar negociação.'); return false; }
      patchLotStatus(lot.id, 'negociacao');
      // Also update brokerName in local state
      if (opts?.brokerName) {
        setRawLots(prev => prev.map(l =>
          l.id === lot.id ? { ...l, brokerName: opts.brokerName } : l
        ));
        setSelectedLot(prev => prev && prev.id === lot.id ? { ...prev, brokerName: opts.brokerName } : prev);
      }
      return true;
    } catch {
      setActionError('Erro de rede ao registrar negociação.');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [patchLotStatus]);

  const changeStatus = useCallback<UseLotMapResult['changeStatus']>(async (lot, newStatus, opts) => {
    if (!lot.dbId) {
      setActionError('Lote ainda não sincronizado com o banco.');
      return false;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/lotmap/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lotId: lot.dbId, newStatus, ...opts }),
      });
      const json = await res.json();
      if (!res.ok) { setActionError(json.error ?? 'Falha ao alterar status.'); return false; }
      patchLotStatus(lot.id, normalizeLotStatus(newStatus) as LotStatus);
      return true;
    } catch {
      setActionError('Erro de rede ao alterar status.');
      return false;
    } finally {
      setActionLoading(false);
    }
  }, [patchLotStatus]);

  const quadras = useMemo(
    () => Array.from(new Set(rawLots.map(l => l.quadra))).sort(),
    [rawLots],
  );

  // Two-dimensional filtering: quadra is strict (only exact match), status is orthogonal
  const filteredLots = useMemo(() => {
    let result = rawLots;
    if (selectedQuadra !== null) {
      result = result.filter(l => l.quadra === selectedQuadra);
    }
    if (statusFilter === 'disponiveis')  result = result.filter(l => l.status === 'disponivel');
    else if (statusFilter === 'reservados')  result = result.filter(l => l.status === 'reservado');
    else if (statusFilter === 'vendidos')    result = result.filter(l => l.status === 'vendido');
    else if (statusFilter === 'negociacao')  result = result.filter(l => l.status === 'negociacao');
    return result;
  }, [rawLots, statusFilter, selectedQuadra]);

  // Stats derived from the same filteredLots used for rendering — never manually maintained
  const filteredStats = useMemo((): FilteredStats => ({
    total: filteredLots.length,
    disponiveis: filteredLots.filter(l => l.status === 'disponivel').length,
    reservados: filteredLots.filter(l => l.status === 'reservado').length,
    vendidos: filteredLots.filter(l => l.status === 'vendido').length,
    negociacao: filteredLots.filter(l => l.status === 'negociacao').length,
  }), [filteredLots]);

  return {
    lots: filteredLots,
    allLots: rawLots,
    amenities: staticData?.amenities ?? [],
    greenAreas: staticData?.greenAreas ?? [],
    streets: staticData?.streets ?? [],
    perimeter: staticData?.perimeter ?? [],
    brLine: staticData?.brLine ?? [],
    streetLabels: staticData?.streetLabels ?? [],
    entrance: staticData?.entrance ?? null,
    viewBox: staticData?.viewBox ?? '0 0 1200 900',
    stats: staticData?.stats ?? null,
    filteredStats,
    isLoading,
    fetchError,
    selectedLot,
    setSelectedLot,
    statusFilter,
    setStatusFilter,
    selectedQuadra,
    setSelectedQuadra,
    quadras,
    isManager,
    actionLoading,
    actionError,
    reserveLot,
    releaseLot,
    negotiateLot,
    changeStatus,
  };
}
