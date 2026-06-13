'use client';

import React, {
  useRef, useState, useCallback, useMemo, useEffect, memo,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, MessageCircle, RefreshCw, AlertCircle, Layers, Search, Maximize2, Minimize2, Shield, TreePine, Building2, Dumbbell, MapPin, Video } from 'lucide-react';
import {
  loadAltoBellevueMap, AB_VIEWBOX,
  type ABMapData, type Amenity, type Point,
} from '@/lib/lots/alto-bellevue';
import { resolveLotStatus } from '@/lib/lots/alto-bellevue-availability';
import { useAbAvailability } from '@/hooks/use-ab-availability';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Lot {
  id: string; quadra: string; lot_number: number;
  area_m2: number; price: number | null;
  status: string; special_type: string | null; notes: string | null;
}

interface PlanLot {
  id: string; quadra: string; lot_number: string;
  polygon: [number, number][]; centroid: [number, number];
  area_m2: number | null; price: number | null;
  status: string; has_polygon: boolean;
  /** Registro comercial sem polígono oficial no CAD (ex.: B-24) — não renderizar. */
  pending?: boolean;
}

interface PriceEntry {
  quadra: string; lote: string;
  preco_lote: number; preco_vista: number; entrada: number;
  p12_total: number; p12_parcela: number; p12_entrada?: number;
  p36_total: number; p36_parcela: number; p36_entrada?: number;
  p60_total: number; p60_parcela: number; p60_entrada?: number;
  p120_total: number; p120_parcela: number; p120_entrada?: number;
}

// Condições financeiras oficiais (tabela de preços do empreendimento):
// à vista −20%; 12 meses −15%; 36 meses −8%; 60 meses −5%; 120 meses sem desconto.
// Entrada de cada plano = 10% do total com desconto do próprio plano.
const PLAN_DISCOUNTS: Record<string, number> = { p12: 15, p36: 8, p60: 5, p120: 0 };

interface Props {
  lots: Lot[];
  developmentId: string;
  developmentName: string;
  whatsappPhone?: string;
  /** Mídia/textos das áreas comuns vindos do backoffice (developments.lot_map_amenities, JSONB). */
  amenityOverrides?: Record<string, unknown>[];
  /** Tour virtual 360° do empreendimento — configurável no backoffice (developments.virtual_tour_url). */
  virtualTourUrl?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

// viewBox da fonte canônica (public/maps/alto-bellevue-lots.json)
const SVG_W = AB_VIEWBOX.w;
const SVG_H = AB_VIEWBOX.h;
const MIN_SCALE = 0.35;
const MAX_SCALE = 20;
const GOLD = '#C8A44A';
const NAVY = '#081524';

// ── ViewBox zoom (SVG-native, like PDF zoom) ──────────────────────────────────
// Using a viewBox-based zoom approach: as the user zooms in, the visible
// coordinate window narrows, making each SVG unit larger on screen — exactly
// the same behaviour as zooming a PDF or a vector map.

interface ViewBox { x: number; y: number; w: number; h: number }

const INITIAL_VB: ViewBox = { x: 0, y: 0, w: SVG_W, h: SVG_H };

function zoomViewBox(vb: ViewBox, factor: number, pivotX?: number, pivotY?: number): ViewBox {
  const MIN_W = SVG_W / MAX_SCALE;
  const MAX_W = SVG_W / MIN_SCALE;
  const newW = Math.max(MIN_W, Math.min(MAX_W, vb.w * factor));
  const newH = newW * (SVG_H / SVG_W);
  const px = pivotX ?? vb.x + vb.w / 2;
  const py = pivotY ?? vb.y + vb.h / 2;
  const ratioX = (px - vb.x) / vb.w;
  const ratioY = (py - vb.y) / vb.h;
  return { x: px - ratioX * newW, y: py - ratioY * newH, w: newW, h: newH };
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, {
  label: string; fill: string; stroke: string;
  dot: string; badgeBg: string; badgeText: string;
}> = {
  DISPONIVEL: {
    label: 'Disponível',
    fill: 'rgba(50,209,124,0.26)',
    stroke: '#32D17C',
    dot: '#32D17C',
    badgeBg: '#DCFCE7',
    badgeText: '#166534',
  },
  NEGOCIACAO: {
    label: 'Negociação',
    fill: 'rgba(255,181,71,0.35)',
    stroke: '#FFB547',
    dot: '#FFB547',
    badgeBg: '#FEF3C7',
    badgeText: '#92400E',
  },
  VENDIDO: {
    label: 'Vendido',
    fill: 'rgba(8,21,36,0.82)',
    stroke: '#1E3248',
    dot: '#FF5C5C',
    badgeBg: '#FEE2E2',
    badgeText: '#991B1B',
  },
  RESERVADO: {
    label: 'Reservado',
    fill: 'rgba(139,92,246,0.26)',
    stroke: '#8B5CF6',
    dot: '#8B5CF6',
    badgeBg: '#EDE9FE',
    badgeText: '#5B21B6',
  },
  PROPRIETARIO: {
    label: 'Proprietário',
    fill: 'rgba(59,130,246,0.22)',
    stroke: '#3B82F6',
    dot: '#3B82F6',
    badgeBg: '#DBEAFE',
    badgeText: '#1E40AF',
  },
  IGREJA: {
    label: 'Igreja',
    fill: 'rgba(13,148,136,0.22)',
    stroke: '#0D9488',
    dot: '#0D9488',
    badgeBg: '#CCFBF1',
    badgeText: '#115E59',
  },
};

// Status desconhecido NUNCA cai para "Disponível" (risco comercial) — neutro cinza.
const UNKNOWN_CFG = {
  label: 'Indisponível',
  fill: 'rgba(100,116,139,0.20)',
  stroke: '#64748B',
  dot: '#64748B',
  badgeBg: '#F1F5F9',
  badgeText: '#475569',
};

const getCfg = (k: string) => STATUS_CFG[k] ?? UNKNOWN_CFG;

// ── Áreas comuns (conteúdo editorial: textos, fotos, vídeo) ────────────────────
// A geometria/posição vem da fonte canônica (campo `amenities`); aqui ficam textos
// e mídia (fotos do projeto aprovado / vídeo). Ids novos caem no fallback.
const AB_AMEN_IMG = '/images/empreendimentos/alto-bellevue/amenities';
// Tour virtual 360° (Kuula). Coleção do empreendimento — configurável (backoffice/env).
const AB_TOUR_360 = 'https://kuula.co/share/collection/7KKb9?logo=1&info=0&logosize=68&fs=1&vr=1&zoom=1&initload=0&thumbs=0&margin=20&alpha=0.86&inst=pt';
interface AmenityInfo {
  title: string; subtitle: string; description: string; fn: string;
  photos?: string[]; video?: string; tour360?: string;
  /** Lista de equipamentos da área (ex.: piscina, academia, capela) — do PDF aprovado. */
  features?: string[];
}
// Equipamentos do clube/lazer (lista oficial "Equipamentos" da planta aprovada).
const CLUBE_EQUIPAMENTOS = [
  'Piscina coberta aquecida com borda infinita', 'Piscina descoberta com borda infinita',
  'Espaço Fit · Academia', 'Quadra Poliesportiva', 'Quadra Society', 'Quadras de Areia',
  'Salão de Festas (200 pessoas)', 'Espaço Gourmet', 'Espaço Grill · Churrasqueiras',
  'Fire Pit · Fogueira e Mirante', 'Vestiários', 'Capela', 'Marco e Mirante', 'Pista de Cooper',
];
const AMENITY_INFO: Record<string, AmenityInfo> = {
  portaria: {
    title: 'Portaria Principal',
    subtitle: 'Acesso e segurança',
    description: 'Entrada monitorada do empreendimento, com guarita e controle de acesso de moradores e visitantes 24 horas.',
    fn: 'Controle de acesso 24h',
    photos: [`${AB_AMEN_IMG}/ab-amenity-01.jpg`, `${AB_AMEN_IMG}/ab-amenity-03.jpg`],
  },
  lazer: {
    title: 'Área de Lazer / Clube',
    subtitle: 'Convivência e bem-estar',
    description: 'Espaço de lazer e convívio do condomínio — piscina, academia, quadra poliesportiva, espaços de descanso e equipamentos comuns em meio ao paisagismo.',
    fn: 'Piscina · Academia · Lazer',
    photos: [
      `${AB_AMEN_IMG}/ab-amenity-04.jpg`, `${AB_AMEN_IMG}/ab-amenity-05.jpg`,
      `${AB_AMEN_IMG}/ab-amenity-06.jpg`, `${AB_AMEN_IMG}/ab-amenity-07.jpg`,
      `${AB_AMEN_IMG}/ab-amenity-08.jpg`,
    ],
    tour360: AB_TOUR_360,
    features: CLUBE_EQUIPAMENTOS,
  },
  'area-verde': {
    title: 'Área Verde',
    subtitle: 'Paisagismo e bem-estar',
    description: 'Áreas verdes preservadas e arborizadas, distribuídas pelo condomínio para qualidade de vida e convívio ao ar livre.',
    fn: 'Preservação e paisagismo',
    photos: [`${AB_AMEN_IMG}/ab-amenity-02.jpg`, `${AB_AMEN_IMG}/ab-amenity-09.jpg`, `${AB_AMEN_IMG}/ab-amenity-10.jpg`],
  },
  coworking: {
    title: 'Coworking · Bloco Administrativo',
    subtitle: 'Trabalho e gestão',
    description: 'Espaço de coworking e administração do condomínio — ambiente compartilhado para trabalho, reuniões e apoio aos moradores.',
    fn: 'Coworking e administração',
  },
  recreativa: {
    title: 'Área Recreativa',
    subtitle: 'Esporte e convivência',
    description: 'Área recreativa do empreendimento — espaços para esporte, lazer ao ar livre e convivência das famílias.',
    fn: 'Recreação e esporte',
    photos: [`${AB_AMEN_IMG}/ab-amenity-06.jpg`, `${AB_AMEN_IMG}/ab-amenity-07.jpg`],
  },
};
// Overrides vindos do dado (JSON `amenities[]` — editável pelo backoffice).
type AmenityOverride = Partial<AmenityInfo> & { id: string; label: string };
const getAmenityInfo = (a: AmenityOverride): AmenityInfo => {
  // id exato (ex.: "portaria") → prefixo (ex.: "recreativa-01" → "recreativa") → fallback.
  const prefix = a.id.replace(/-\d+$/, '');
  const base: AmenityInfo = AMENITY_INFO[a.id] ?? AMENITY_INFO[prefix] ?? {
    title: a.label, subtitle: 'Área comum', description: 'Área de uso comum do empreendimento.', fn: 'Área comum',
  };
  // Campos vindos do backoffice/JSON têm prioridade; senão usa o default editorial.
  return {
    title: a.title ?? base.title,
    subtitle: a.subtitle ?? base.subtitle,
    description: a.description ?? base.description,
    fn: a.fn ?? base.fn,
    photos: a.photos ?? base.photos,
    video: a.video ?? base.video,
    tour360: a.tour360 ?? base.tour360,
    features: a.features ?? base.features,
  };
};

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
const fmtM2 = (v: number) =>
  `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(v)} m²`;
const fmtM = (v: number) => `${v.toFixed(1).replace('.', ',')} m`;

// ── Geometry helpers ──────────────────────────────────────────────────────────

/** Ponto-em-polígono (ray casting). Usado como rede de segurança de contenção. */
function pointInPolygon(pt: [number, number], poly: [number, number][]): boolean {
  if (!poly || poly.length < 3) return false;
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function polygonAreaSvg(polygon: [number, number][]): number {
  let area = 0;
  const n = polygon.length;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % n];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
}

function computeDimensions(polygon: [number, number][], areaM2: number): { testada: number; profundidade: number } | null {
  if (!polygon || polygon.length < 3 || !areaM2 || areaM2 <= 0) return null;
  const svgArea = polygonAreaSvg(polygon);
  if (svgArea <= 0) return null;
  const scaleFactor = Math.sqrt(areaM2 / svgArea);
  let maxEdge = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    maxEdge = Math.max(maxEdge, Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2));
  }
  const profundidade = Math.round(maxEdge * scaleFactor * 10) / 10;
  const testada = profundidade > 0 ? Math.round((areaM2 / profundidade) * 10) / 10 : 0;
  return { testada, profundidade };
}

/**
 * Medidas aproximadas das confrontações para qualquer polígono (≥ 3 vértices).
 * Para 4 vértices: usa as arestas exatas na convenção cadastral (frente→lat.dir→fundos→lat.esq).
 * Para n > 4: projeta as arestas em 4 grupos de direção a partir do maior eixo,
 * somando os comprimentos por face — boa aproximação para lotes com chanfros ou micro-recuos.
 */
function computeSides(
  polygon: [number, number][],
  areaM2: number,
): { frente: number; lateralDir: number; fundos: number; lateralEsq: number } | null {
  if (!polygon || polygon.length < 3 || !areaM2 || areaM2 <= 0) return null;
  const svgArea = polygonAreaSvg(polygon);
  if (svgArea <= 0) return null;
  const sf = Math.sqrt(areaM2 / svgArea);
  const r = (v: number) => Math.round(v * sf * 10) / 10;

  if (polygon.length === 4) {
    const edge = (i: number) => {
      const [x1, y1] = polygon[i];
      const [x2, y2] = polygon[(i + 1) % 4];
      return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    };
    return { frente: r(edge(0)), lateralDir: r(edge(1)), fundos: r(edge(2)), lateralEsq: r(edge(3)) };
  }

  // n > 4: find the primary axis (longest edge), then group all edges into 4 faces
  const n = polygon.length;
  let maxLen = 0, primAngle = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % n];
    const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    if (len > maxLen) { maxLen = len; primAngle = Math.atan2(y2 - y1, x2 - x1); }
  }
  const cos = Math.cos(-primAngle), sin = Math.sin(-primAngle);
  const groups = { frente: 0, fundos: 0, lateralDir: 0, lateralEsq: 0 };
  for (let i = 0; i < n; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % n];
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const rdx = dx * cos - dy * sin;
    const rdy = dx * sin + dy * cos;
    if (Math.abs(rdx) >= Math.abs(rdy)) {
      if (rdx >= 0) groups.frente += len; else groups.fundos += len;
    } else {
      if (rdy >= 0) groups.lateralDir += len; else groups.lateralEsq += len;
    }
  }
  return {
    frente: r(groups.frente),
    fundos: r(groups.fundos),
    lateralDir: r(groups.lateralDir),
    lateralEsq: r(groups.lateralEsq),
  };
}

/**
 * Comprimento da corda horizontal do polígono na altura `y` — usado para
 * decidir se um rótulo de texto (não rotacionado) cabe dentro do lote sem
 * transbordar para vizinhos/ruas.
 */
function horizontalChordAt(poly: [number, number][], y: number): number {
  if (!poly || poly.length < 3) return 0;
  const xs: number[] = [];
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    if (y1 > y !== y2 > y) xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
  }
  if (xs.length < 2) return 0;
  return Math.max(...xs) - Math.min(...xs);
}

/** Largura estimada de um texto em coordenadas SVG (fonte monoespaçada). */
const estTextWidth = (text: string, fontSize: number) => text.length * fontSize * 0.62;

/** Rua de acesso aproximada: label de rua mais próxima do centroide do lote. */
function nearestStreet(centroid: [number, number] | undefined, labels: { x: number; y: number; name: string }[]): string | null {
  if (!centroid || !labels?.length) return null;
  let best: { name: string; d: number } | null = null;
  for (const s of labels) {
    const d = (s.x - centroid[0]) ** 2 + (s.y - centroid[1]) ** 2;
    if (!best || d < best.d) best = { name: s.name, d };
  }
  return best?.name ?? null;
}

// ── Data hooks ────────────────────────────────────────────────────────────────

function useABMap() {
  const [data, setData] = useState<ABMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const signal = { cancelled: false };
    setLoading(true);
    setError(null);

    loadAltoBellevueMap({ signal })
      .then((d) => {
        if (signal.cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (signal.cancelled) return;
        setError('Não foi possível carregar o mapa. Verifique sua conexão.');
        setLoading(false);
      });

    return () => { signal.cancelled = true; };
  }, [attempt]);

  return { data, loading, error, retry: () => setAttempt((a) => a + 1) };
}

/** Tabela de preços (163 KB) — adiada até a primeira seleção de lote. */
function usePrices(enabled: boolean) {
  const [priceMap, setPriceMap] = useState<Map<string, PriceEntry>>(new Map());
  const fetched = useRef(false);

  useEffect(() => {
    if (!enabled || fetched.current) return;
    fetched.current = true;
    fetch('/data/alto-bellevue-prices.json')
      .then(r => r.json())
      .then((data: PriceEntry[]) => {
        const m = new Map<string, PriceEntry>();
        for (const e of data) {
          m.set(`${e.quadra}-${String(parseInt(e.lote, 10)).padStart(2, '0')}`, e);
        }
        setPriceMap(m);
      })
      .catch(() => {});
  }, [enabled]);

  return priceMap;
}

function mergeLots(dbLots: Lot[], planLots: PlanLot[]): PlanLot[] {
  const dbMap = new Map(
    dbLots.map(l => [`${l.quadra}-${String(l.lot_number).padStart(2, '0')}`, l])
  );
  return planLots.map(pl => {
    const db = dbMap.get(pl.id);
    return {
      ...pl,
      price: db?.price ?? pl.price,
      area_m2: (db?.area_m2 ?? pl.area_m2) || 0,
      status: pl.status || db?.status || 'DISPONIVEL',
    };
  });
}

// ── SVG Map ───────────────────────────────────────────────────────────────────

interface MapInnerProps {
  lots: PlanLot[];
  allLots: PlanLot[];
  context: ABMapData | null;
  showTechLayer: boolean;
  selectedId: string | null;
  vb: ViewBox;
  isDragging: boolean;
  activeQuadra: string;
  onLotClick: (lot: PlanLot) => void;
  onAmenityClick: (amenity: Amenity) => void;
  onQuadraClick: (quadra: string) => void;
  onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
  onBgClick: () => void;
}

const MapInner = memo(function MapInner({
  lots, allLots, context, showTechLayer, selectedId, vb, isDragging,
  activeQuadra, onLotClick, onAmenityClick, onQuadraClick, onPointerDown, onPointerMove, onPointerUp, onBgClick,
}: MapInnerProps) {
  // Derive scale from the viewBox: how much the viewport has been narrowed
  const scale = SVG_W / vb.w;

  // Quadra centroid badges — uses spatial median to be immune to outlier lots
  // (e.g. N-03/N-07/N-30 are far from the main N cluster; mean would pull the badge wrong)
  const quadraCentroids = useMemo(() => {
    const map = new Map<string, { xs: number[]; ys: number[]; avail: number }>();
    for (const lot of allLots) {
      if (!lot.centroid) continue;
      const [cx, cy] = lot.centroid;
      if (!Number.isFinite(cx) || !Number.isFinite(cy)) continue;
      const d = map.get(lot.quadra);
      if (d) {
        d.xs.push(cx); d.ys.push(cy);
        if (lot.status === 'DISPONIVEL') d.avail++;
      } else {
        map.set(lot.quadra, { xs: [cx], ys: [cy], avail: lot.status === 'DISPONIVEL' ? 1 : 0 });
      }
    }
    const median = (arr: number[]) => {
      const s = [...arr].sort((a, b) => a - b);
      const m = Math.floor(s.length / 2);
      return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2;
    };
    return Array.from(map.entries()).map(([quadra, d]) => ({
      quadra, cx: median(d.xs), cy: median(d.ys), avail: d.avail, total: d.xs.length,
    }));
  }, [allLots]);

  // Progressive zoom levels — calibrated for viewBox zoom where scale = SVG_W / vb.w.
  // At scale N on a 375px mobile, 1 SVG unit ≈ N × 0.31 px (375/1200).
  // fontSize=8 at scale=3: 8 × 3 × 0.31 = 7.5 px — first readable threshold.
  const showLotNumbers = scale >= 3;
  const showAreaLabels = scale >= 4;
  const showDimensions = scale >= 5.5;
  const showQuadraBadges = scale < 3.5;
  const showStreetLabels = scale >= 1.5;

  // Maior anel do perímetro oficial — base da rede de contenção.
  const perimeterRing = useMemo<[number, number][]>(() => {
    const rings = context?.perimeter ?? [];
    if (!rings.length) return [];
    return rings.reduce((best, r) => (r.length > best.length ? r : best), rings[0]) as [number, number][];
  }, [context]);

  // Rede de segurança de contenção: nunca desenhar um lote totalmente fora do
  // perímetro oficial (ex.: B-24 importado com coordenadas erradas). Só exclui
  // quando NENHUM vértice cai dentro — evita falso-positivo em lotes de borda.
  const containedLots = useMemo(() => {
    if (perimeterRing.length < 3) return lots;
    return lots.filter(l => {
      if (!l.polygon?.length) return true;
      const anyInside = l.polygon.some(p => pointInPolygon(p as [number, number], perimeterRing));
      const centroidInside = l.centroid ? pointInPolygon(l.centroid as [number, number], perimeterRing) : false;
      if (!anyInside && !centroidInside) {
        if (typeof console !== 'undefined') console.warn(`[alto-bellevue] lote ${l.id} fora do perímetro — não renderizado`);
        return false;
      }
      return true;
    });
  }, [lots, perimeterRing]);

  // Viewport culling: skip lots whose centroid is outside the current viewBox (+ 15% buffer).
  // Always include the selected lot so it stays highlighted even after panning.
  const visibleLots = useMemo(() => {
    const buf = 0.15;
    const x0 = vb.x - vb.w * buf, x1 = vb.x + vb.w * (1 + buf);
    const y0 = vb.y - vb.h * buf, y1 = vb.y + vb.h * (1 + buf);
    return containedLots.filter(l => {
      if (l.id === selectedId) return true;
      const [cx, cy] = l.centroid ?? [0, 0];
      return cx > x0 && cx < x1 && cy > y0 && cy < y1;
    });
  }, [containedLots, vb, selectedId]);

  // Deduplicate street labels closer than 8 SVG units (removes CAD-import noise clusters)
  const visibleStreetLabels = useMemo(() => {
    const labels = context?.streetLabels;
    if (!labels?.length) return [];
    const out: { x: number; y: number; name: string; rot?: number }[] = [];
    for (const sl of labels) {
      if (!out.some(r => Math.hypot(r.x - sl.x, r.y - sl.y) < 8)) out.push(sl);
    }
    return out;
  }, [context]);

  // Oclusão de rótulos (M3): os marcadores do complexo de entrada (portaria,
  // lazer, coworking, recreativa-01) ficam fisicamente próximos — seus rótulos
  // colidem em zoom baixo/médio. Passe guloso por prioridade: um rótulo só
  // aparece se sua caixa estimada não intersectar nenhum já colocado; ao
  // aproximar o zoom, as caixas (em coords SVG) encolhem e os demais reaparecem.
  const visibleLabelKeys = useMemo(() => {
    const placed: { x: number; y: number; w: number; h: number }[] = [];
    const visible = new Set<string>();
    const tryPlace = (key: string, cx: number, baseY: number, text: string, fs: number) => {
      const w = estTextWidth(text, fs);
      const h = fs * 1.4;
      const box = { x: cx - w / 2, y: baseY - h, w, h };
      const collides = placed.some(b =>
        box.x < b.x + b.w && b.x < box.x + box.w && box.y < b.y + b.h && b.y < box.y + box.h);
      if (!collides) { placed.push(box); visible.add(key); }
    };
    const amenities = context?.amenities ?? [];
    // Portaria primeiro (maior prioridade), depois os demais na ordem da fonte.
    const ordered = [...amenities].sort((a, b) =>
      (a.id === 'portaria' ? 0 : 1) - (b.id === 'portaria' ? 0 : 1));
    for (const a of ordered) {
      const isPortaria = a.id === 'portaria';
      if (!(isPortaria ? scale >= 0.5 : scale >= 2.2)) continue;
      tryPlace(`am-${a.id}`, a.x, a.y - Math.max(5, 26 / scale), a.label, Math.max(5, 16 / scale));
    }
    if (context?.entrance && scale >= 0.5) {
      const e = context.entrance;
      tryPlace('entrance', e.x, e.y - Math.max(5, 22 / scale), e.label, Math.max(5, 16 / scale));
    }
    for (const g of context?.greenAreas ?? []) {
      if (scale < 2.5) continue;
      tryPlace(`ga-${g.id}`, g.x, g.y - Math.max(4, 14 / scale), g.label, Math.max(3.2, 11 / scale));
    }
    return visible;
  }, [context, scale]);

  // k/scale gives constant screen size: k × screenWidth/SVG_W px always visible.
  // At ~600 px container: badgeR=40/scale → 40×600/1200 = 20 px circle.
  const streetStroke = Math.max(0.3, 1.4 / scale);
  const badgeR = Math.max(6, 40 / scale);
  const badgeFontSize = Math.max(4, 24 / scale);

  return (
    <div
      className="w-full h-full"
      style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="w-full h-full select-none"
        style={{ touchAction: 'none' }}
        onClick={onBgClick}
        aria-label="Mapa interativo de lotes Alto Bellevue"
        aria-roledescription="Mapa interativo — arraste para mover, role para dar zoom, toque num lote para ver detalhes"
        role="application"
      >
        <defs>
          <filter id="ab-sel-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <linearGradient id="ab-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A1A2C" />
            <stop offset="100%" stopColor="#06101D" />
          </linearGradient>
        </defs>

        {/* Technical base — fundo escuro técnico (sem foto, alinhado ao viewBox canônico) */}
        <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#ab-base)" />

        {/* ── Camada técnica: perímetro, ruas, BR, portaria ── */}
        {showTechLayer && context && (
          <g style={{ pointerEvents: 'none' }}>
            {/* Perímetro do empreendimento */}
            {context.perimeter.map((poly, i) => (
              <polygon
                key={`perim-${i}`}
                points={poly.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="rgba(200,164,74,0.05)"
                stroke="rgba(200,164,74,0.45)"
                strokeWidth={Math.max(0.7, 2 / scale)}
                strokeDasharray={`${6 / scale} ${4 / scale}`}
              />
            ))}
            {/* Linha da BR */}
            {context.brLine.map((line, i) => (
              <polyline
                key={`br-${i}`}
                points={line.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth={Math.max(0.6, 2.4 / scale)}
              />
            ))}
            {/* Eixos das ruas */}
            {context.streets.map((line, i) => (
              <polyline
                key={`st-${i}`}
                points={line.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={streetStroke}
                strokeLinecap="round"
              />
            ))}
            {/* Amenities (portaria, lazer, …) — clicáveis abrem painel de área comum */}
            {context.amenities.map((a) => {
              const isPortaria = a.id === 'portaria';
              // Marcadores não-portaria menores e com rótulo só em zoom maior:
              // portaria/coworking/lazer/recreativa-01 ficam juntos no complexo
              // de entrada (posição oficial) — rótulos simultâneos colidiriam.
              const r = Math.max(isPortaria ? 4 : 3, (isPortaria ? 22 : 14) / scale);
              const fontSize = Math.max(5, 16 / scale);
              // Hit target sempre confortável para toque (mín. ~22px na tela)
              const hit = Math.max(r * 1.6, 26 / scale);
              return (
                <g
                  key={`am-${a.id}`}
                  style={{ pointerEvents: 'auto', cursor: 'pointer', outline: 'none' }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Área comum: ${a.label}`}
                  onClick={(e) => { e.stopPropagation(); onAmenityClick(a); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onAmenityClick(a); } }}
                >
                  {/* Glow ring for portaria */}
                  {isPortaria && (
                    <circle cx={a.x} cy={a.y} r={r * 2.2}
                      fill="none" stroke={a.color} strokeWidth={Math.max(0.3, 1.5 / scale)}
                      opacity={0.25}
                    />
                  )}
                  {/* Invisible touch target */}
                  <circle cx={a.x} cy={a.y} r={hit} fill="transparent" />
                  <circle cx={a.x} cy={a.y} r={r} fill={a.color} opacity={isPortaria ? 0.95 : 0.85}
                    stroke="rgba(255,255,255,0.85)" strokeWidth={Math.max(0.25, 1 / scale)} />
                  {visibleLabelKeys.has(`am-${a.id}`) && (
                    <text
                      x={a.x} y={a.y - Math.max(5, 26 / scale)}
                      textAnchor="middle"
                      fontSize={fontSize}
                      fill={isPortaria ? 'rgba(200,164,74,0.92)' : 'rgba(255,255,255,0.7)'}
                      fontWeight={isPortaria ? '700' : '600'}
                      style={{ fontFamily: "'Outfit', sans-serif", pointerEvents: 'none' }}
                    >
                      {a.label}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Entrada / acesso */}
            {context.entrance && scale >= 0.5 && (
              <g>
                <circle
                  cx={context.entrance.x} cy={context.entrance.y}
                  r={Math.max(3, 18 / scale)}
                  fill="rgba(200,164,74,0.7)"
                />
                {visibleLabelKeys.has('entrance') && (
                <text
                  x={context.entrance.x} y={context.entrance.y - Math.max(5, 22 / scale)}
                  textAnchor="middle"
                  fontSize={Math.max(5, 16 / scale)}
                  fill="rgba(200,164,74,0.80)"
                  fontWeight="700"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {context.entrance.label}
                </text>
                )}
              </g>
            )}
            {/* Áreas verdes (CAD) — clicáveis: abrem o card da área verde (fotos + info) */}
            {context.greenAreas?.map((g) => {
              const r = Math.max(2.4, 10 / scale);
              const fontSize = Math.max(3.2, 11 / scale);
              const hit = Math.max(r * 1.8, 24 / scale);
              return (
                <g
                  key={`ga-${g.id}`}
                  style={{ pointerEvents: 'auto', cursor: 'pointer', outline: 'none' }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Área comum: ${g.label}`}
                  onClick={(e) => { e.stopPropagation(); onAmenityClick({ id: 'area-verde', label: g.label, icon: 'tree', color: '#66BB6A', x: g.x, y: g.y }); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onAmenityClick({ id: 'area-verde', label: g.label, icon: 'tree', color: '#66BB6A', x: g.x, y: g.y }); } }}
                >
                  <circle cx={g.x} cy={g.y} r={hit} fill="transparent" />
                  <circle
                    cx={g.x} cy={g.y} r={r}
                    fill="rgba(46,125,50,0.28)"
                    stroke="rgba(102,187,106,0.75)"
                    strokeWidth={Math.max(0.25, 1 / scale)}
                    strokeDasharray={`${2.5 / scale} ${1.5 / scale}`}
                  />
                  {visibleLabelKeys.has(`ga-${g.id}`) && (
                    <text
                      x={g.x} y={g.y - Math.max(4, 14 / scale)}
                      textAnchor="middle"
                      fontSize={fontSize}
                      fill="rgba(129,199,132,0.92)"
                      fontWeight="600"
                      style={{ fontFamily: "'Outfit', sans-serif", pointerEvents: 'none' }}
                    >
                      {g.label}
                    </text>
                  )}
                </g>
              );
            })}
            {/* Street labels moved to a dedicated layer above lots — see below */}
          </g>
        )}

        {/* ── Layer 4: Lot polygons + labels (viewport-culled) ── */}
        {visibleLots.map(lot => {
          const cfg = getCfg(lot.status);
          const isSelected = lot.id === selectedId;
          const pts = lot.polygon.map(([x, y]) => `${x},${y}`).join(' ');
          const cx = lot.centroid?.[0] ?? 0;
          const cy = lot.centroid?.[1] ?? 0;
          const dims = showDimensions && lot.area_m2 ? computeDimensions(lot.polygon, lot.area_m2 as number) : null;

          return (
            <g
              key={lot.id}
              // outline:none remove o "quadrado" azul do foco do browser — o destaque
              // é só o polígono exato do lote (forma real), nunca um retângulo.
              style={{ cursor: 'pointer', outline: 'none' }}
              onClick={(e) => { e.stopPropagation(); onLotClick(lot); }}
              role="button"
              aria-label={`Lote ${lot.lot_number} Quadra ${lot.quadra} — ${cfg.label}${lot.area_m2 ? `, ${Math.round(lot.area_m2 as number)}m²` : ''}${lot.price ? `, ${fmtBRL(lot.price as number)}` : ''}`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onLotClick(lot);
                }
              }}
            >
              {isSelected && (
                <polygon
                  points={pts}
                  fill="transparent"
                  stroke="#C8A35F"
                  strokeWidth="7"
                  filter="url(#ab-sel-glow)"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              <polygon
                points={pts}
                fill={isSelected ? 'rgba(200,163,95,0.55)' : cfg.fill}
                stroke={isSelected ? '#D7B97A' : cfg.stroke}
                strokeWidth={isSelected ? 1.8 : 0.7}
              />

              {/* Rótulos internos — centrados verticalmente no lote (PDF-style).
                  Três linhas: número, área m², testada×profundidade.
                  O lote SELECIONADO sempre rotula (número+área) ancorado a si
                  mesmo, em qualquer zoom — feedback inequívoco de seleção (A5). */}
              {(showLotNumbers || isSelected) && cx > 0 && cy > 0 && (() => {
                // Fit-check: cada linha só aparece se couber na corda horizontal
                // do polígono na sua altura — evita texto vazando para vizinhos.
                const areaText = lot.area_m2 ? `${Math.round(lot.area_m2 as number)} m²` : '';
                const dimsText = dims ? `${fmtM(dims.testada)} × ${fmtM(dims.profundidade)}` : '';
                const chordMid = horizontalChordAt(lot.polygon, cy);
                const hasArea = (showAreaLabels || isSelected) && !!lot.area_m2 &&
                  estTextWidth(areaText, 4.4) <= chordMid * 0.95;
                const hasDims = !!dims &&
                  estTextWidth(dimsText, 3.0) <= chordMid * 0.95;
                // Total linhas visíveis → offset base para centralizar o grupo
                const lineCount = 1 + (hasArea ? 1 : 0) + (hasDims ? 1 : 0);
                const lineH = 5.6; // espaçamento entre linhas em coord SVG
                const groupTop = cy - ((lineCount - 1) * lineH) / 2;

                const numColor = isSelected ? '#D7B97A' : lot.status === 'VENDIDO' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.92)';
                const areaColor = isSelected ? 'rgba(215,185,122,0.88)' : 'rgba(255,255,255,0.60)';
                const dimColor = isSelected ? 'rgba(215,185,122,0.65)' : 'rgba(255,255,255,0.38)';
                const outlineStroke = 'rgba(6,16,29,0.85)';
                const outlineW = Math.max(0.4, 1.5 / scale);

                let row = 0;
                const y0 = groupTop + row++ * lineH;
                const y1 = hasArea ? groupTop + row++ * lineH : null;
                const y2 = hasDims ? groupTop + row++ * lineH : null;

                return (
                  <g style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {/* Lot number */}
                    <text x={cx} y={y0} textAnchor="middle" dominantBaseline="central"
                      stroke={outlineStroke} strokeWidth={outlineW} paintOrder="stroke"
                      fill={numColor} fontSize={7} fontWeight={isSelected ? '800' : '700'}
                      style={{ fontFamily: 'monospace' }}>
                      {lot.lot_number}
                    </text>
                    {/* Area m² */}
                    {y1 !== null && (
                      <text x={cx} y={y1} textAnchor="middle" dominantBaseline="central"
                        stroke={outlineStroke} strokeWidth={outlineW} paintOrder="stroke"
                        fill={areaColor} fontSize={4.4} fontWeight="500"
                        style={{ fontFamily: 'monospace' }}>
                        {Math.round(lot.area_m2 as number)} m²
                      </text>
                    )}
                    {/* Testada × Profundidade — compact format */}
                    {y2 !== null && dims && (
                      <text x={cx} y={y2} textAnchor="middle" dominantBaseline="central"
                        stroke={outlineStroke} strokeWidth={outlineW} paintOrder="stroke"
                        fill={dimColor} fontSize={3.0} fontWeight="500" letterSpacing="-0.01em"
                        style={{ fontFamily: 'monospace' }}>
                        {fmtM(dims.testada)} × {fmtM(dims.profundidade)}
                      </text>
                    )}
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* ── Layer 5: Street labels — rendered ABOVE lot polygons so they're never hidden ── */}
        {showTechLayer && showStreetLabels && (
          <g style={{ pointerEvents: 'none' }}>
            {visibleStreetLabels.map((s, i) => {
              const fs = Math.max(3.2, 17 / scale);
              const sw = Math.max(0.5, 3.4 / scale);
              return (
                // Rotaciona o nome ao longo do eixo da via (como no PDF)
                <g key={`sl-${i}`} transform={`rotate(${s.rot ?? 0} ${s.x} ${s.y})`}>
                  {/* Outline pass for readability over any lot color */}
                  <text
                    x={s.x} y={s.y}
                    textAnchor="middle"
                    fontSize={fs}
                    fill="none"
                    stroke="rgba(6,16,29,0.85)"
                    strokeWidth={sw}
                    fontWeight="700"
                    letterSpacing="0.04em"
                    style={{ fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase' as const }}
                  >
                    {s.name}
                  </text>
                  {/* Fill pass */}
                  <text
                    x={s.x} y={s.y}
                    textAnchor="middle"
                    fontSize={fs}
                    fill="rgba(255,255,255,0.82)"
                    fontWeight="700"
                    letterSpacing="0.04em"
                    style={{ fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase' as const }}
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ── Layer 6: Quadra badges — zoom level 1-2 (clicáveis: aproximam a quadra) ── */}
        {showQuadraBadges && quadraCentroids.map(({ quadra, cx, cy, avail, total }) => {
          const isActive = activeQuadra === quadra;
          const showFraction = badgeR >= 14 && avail > 0;
          const letterY = showFraction ? cy - badgeFontSize * 0.35 : cy;
          // Alvo de toque sempre ≥ ~40px na tela, mesmo com badge pequeno.
          const hitR = Math.max(badgeR * 1.25, 24 / scale);
          return (
            <g
              key={`qbadge-${quadra}`}
              role="button"
              tabIndex={0}
              aria-label={`Quadra ${quadra} — ${avail} de ${total} lotes disponíveis. Aproximar quadra.`}
              style={{ pointerEvents: 'auto', cursor: 'pointer', outline: 'none' }}
              onClick={(e) => { e.stopPropagation(); onQuadraClick(quadra); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onQuadraClick(quadra); } }}
            >
              <circle cx={cx} cy={cy} r={hitR} fill="transparent" />
              <circle
                cx={cx} cy={cy} r={badgeR}
                fill={isActive ? 'rgba(200,164,74,0.88)' : 'rgba(8,21,36,0.80)'}
                stroke={isActive ? '#D7B97A' : avail > 0 ? 'rgba(50,209,124,0.55)' : 'rgba(255,255,255,0.18)'}
                strokeWidth={Math.max(0.4, 1.2 / scale)}
              />
              <text
                x={cx} y={letterY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={badgeFontSize}
                fill={isActive ? '#0B1928' : 'rgba(255,255,255,0.92)'}
                fontWeight="800"
                style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'sans-serif' }}
              >
                {quadra}
              </text>
              {showFraction && (
                <text
                  x={cx} y={cy + badgeFontSize * 0.7}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={badgeFontSize * 0.52}
                  fill={isActive ? 'rgba(11,25,40,0.7)' : 'rgba(50,209,124,0.85)'}
                  fontWeight="700"
                  style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'monospace' }}
                >
                  {avail}/{total}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

// ── Map control button ────────────────────────────────────────────────────────

function MapBtn({ onClick, label, children, active }: { onClick: () => void; label: string; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={label}
      aria-pressed={active}
      title={label}
      // 44px = mínimo de toque (Apple HIG) e o alvo recomendado pela auditoria (44–48px).
      className="w-11 h-11 flex items-center justify-center rounded-xl transition-all active:scale-90"
      style={{
        // Estado ativo discreto (dourado tingido + borda/ícone dourados) — sinaliza
        // "ligado" sem competir/gritar mais que o conteúdo do mapa.
        background: active ? 'rgba(200,164,74,0.16)' : 'rgba(8,21,36,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: active ? '1.5px solid rgba(200,164,74,0.85)' : '1.5px solid rgba(200,164,74,0.42)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
        color: active ? '#E8C97A' : 'rgba(255,255,255,0.85)',
      }}
    >
      {children}
    </button>
  );
}

// ── Edge-fade horizontal scroller ──────────────────────────────────────────────
// Indicador de rolagem (B5): mostra um leve degradê na(s) borda(s) só quando há
// mais conteúdo para rolar — afford claro sem cortar o último chip de forma fixa.
function EdgeFadeRow({
  children, className, fadeColor = '#fff',
}: { children: React.ReactNode; className?: string; fadeColor?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ l: false, r: false });
  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setEdges({ l: scrollLeft > 2, r: scrollLeft + clientWidth < scrollWidth - 2 });
  }, []);
  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); window.removeEventListener('resize', update); ro.disconnect(); };
  }, [update]);
  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} className={className} style={{ scrollbarWidth: 'none' }}>{children}</div>
      {edges.l && <div aria-hidden style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 22, pointerEvents: 'none', background: `linear-gradient(to right, ${fadeColor}, transparent)` }} />}
      {edges.r && <div aria-hidden style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 26, pointerEvents: 'none', background: `linear-gradient(to left, ${fadeColor}, transparent)` }} />}
    </div>
  );
}

// ── Skeleton loading ──────────────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4" style={{ background: NAVY }}>
      <div
        className="w-9 h-9 rounded-full border-2 animate-spin"
        style={{ borderColor: `${GOLD} ${GOLD} ${GOLD} transparent` }}
      />
      <p
        className="text-xs font-bold uppercase tracking-[0.22em]"
        style={{ color: 'rgba(200,164,74,0.65)', fontFamily: "'Outfit', sans-serif" }}
      >
        Carregando mapa de lotes…
      </p>
    </div>
  );
}

// ── Lot Detail Bottom Sheet ───────────────────────────────────────────────────

function LotBottomSheet({
  lot, priceEntry, onClose, whatsappPhone, developmentName, dbLot, streetLabels,
}: {
  lot: PlanLot;
  priceEntry?: PriceEntry;
  onClose: () => void;
  whatsappPhone: string;
  developmentName: string;
  dbLot?: Lot;
  streetLabels?: { x: number; y: number; name: string }[];
}) {
  const isAvailable = lot.status === 'DISPONIVEL';
  const isNegotiating = lot.status === 'NEGOCIACAO';
  const cfg = getCfg(lot.status);

  const dims = useMemo(() =>
    lot.polygon && lot.area_m2
      ? computeDimensions(lot.polygon, lot.area_m2 as number)
      : null,
    [lot]
  );

  const sides = useMemo(() =>
    lot.polygon && lot.area_m2
      ? computeSides(lot.polygon, lot.area_m2 as number)
      : null,
    [lot]
  );

  const acessoRua = useMemo(() => nearestStreet(lot.centroid, streetLabels ?? []), [lot.centroid, streetLabels]);

  const isCorner = dbLot?.special_type === 'ESQUINA';
  const pricePerM2 = lot.price && lot.area_m2 ? (lot.price as number) / (lot.area_m2 as number) : null;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    // Foco inicial no botão fechar — leitores de tela anunciam o diálogo e o
    // teclado já tem rota de saída (Esc também fecha).
    closeRef.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const waInterest = encodeURIComponent(
    `Olá! Tenho interesse no ${developmentName} — Quadra ${lot.quadra}, Lote ${lot.lot_number}${lot.area_m2 ? `, área ${Math.round(lot.area_m2 as number)} m²` : ''}${lot.price ? `, valor ${fmtBRL(lot.price as number)}` : ''}. Gostaria de mais informações e condições de pagamento.`
  );
  const waVisit = encodeURIComponent(
    `Olá! Gostaria de agendar uma visita ao ${developmentName} — Quadra ${lot.quadra}, Lote ${lot.lot_number}.`
  );
  const waGeneral = encodeURIComponent(
    `Olá! Gostaria de informações sobre lotes disponíveis no ${developmentName}.`
  );

  // Portal para document.body — escapa o `overflow:hidden` do wrapper do mapa e
  // qualquer ancestral que crie containing-block, garantindo `position:fixed` real.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-[9998]"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] overflow-y-auto"
        style={{
          maxHeight: '92vh',
          borderRadius: '24px 24px 0 0',
          background: '#fff',
          boxShadow: '0 -24px 80px rgba(0,0,0,0.35)',
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Detalhes do lote ${lot.lot_number}, quadra ${lot.quadra}`}
      >
        {/* Pull handle */}
        <div className="flex justify-center pt-3 pb-1.5">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5DDD0' }} />
        </div>

        {/* Status accent */}
        <div style={{ height: 3, background: cfg.dot }} />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: cfg.badgeBg, color: cfg.badgeText }}
              >
                {cfg.label}
              </span>
              {isAvailable && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: '#F0EDE5', color: GOLD }}>
                  Premium
                </span>
              )}
              {isCorner && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                  Esquina
                </span>
              )}
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#081524', fontFamily: "'Outfit', sans-serif", margin: 0, lineHeight: 1.2 }}>
              Quadra {lot.quadra} · Lote {lot.lot_number}
            </h3>
            <p style={{ fontSize: 11, color: '#948F84', margin: '3px 0 0', fontWeight: 500 }}>
              {developmentName} · Garanhuns, PE
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0 mt-1"
            style={{ background: '#F7F8FA' }}
            aria-label="Fechar detalhes do lote"
          >
            <X size={15} color="#948F84" />
          </button>
        </div>

        {/* Area + Price */}
        <div className="grid grid-cols-2 gap-2.5 px-5 pb-3">
          <div style={{ background: '#F8F6F2', borderRadius: 14, padding: '13px 14px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" }}>Área Total</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
              {lot.area_m2 ? fmtM2(lot.area_m2 as number) : '—'}
            </p>
          </div>
          <div style={{ background: isAvailable ? '#081524' : '#F8F6F2', borderRadius: 14, padding: '13px 14px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: isAvailable ? GOLD : '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" }}>Valor</p>
            <p style={{ fontSize: lot.price && (lot.price as number) >= 100000 ? 15 : 18, fontWeight: 800, color: isAvailable ? '#fff' : '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
              {lot.price ? fmtBRL(lot.price as number) : 'Consultar'}
            </p>
          </div>
        </div>

        {/* Dimensions (computed) */}
        {dims && (
          <div className="grid grid-cols-2 gap-2.5 px-5 pb-3">
            <div style={{ background: '#F8F6F2', borderRadius: 14, padding: '11px 14px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>Testada aprox.</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                {fmtM(dims.testada)}
              </p>
            </div>
            <div style={{ background: '#F8F6F2', borderRadius: 14, padding: '11px 14px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>Profundidade aprox.</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                {fmtM(dims.profundidade)}
              </p>
            </div>
          </div>
        )}

        {/* Confrontações (aprox. — derivadas das arestas) */}
        {sides && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 8px', fontFamily: "'Outfit', sans-serif" }}>
              Confrontações <span style={{ color: '#C0BAB2', fontWeight: 500 }}>(aprox.)</span>
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {([
                { label: 'Frente', v: sides.frente },
                { label: 'Fundos', v: sides.fundos },
                { label: 'Lateral esq.', v: sides.lateralEsq },
                { label: 'Lateral dir.', v: sides.lateralDir },
              ] as const).map((s) => (
                <div key={s.label} style={{ background: '#F8F6F2', borderRadius: 10, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#948F84', fontWeight: 600 }}>{s.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace" }}>{fmtM(s.v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rua de acesso */}
        {acessoRua && (
          <div className="px-5 pb-3">
            <div style={{ background: '#F0EDE5', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600, flexShrink: 0 }}>Rua de acesso</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#081524', textAlign: 'right', fontFamily: "'Outfit', sans-serif" }}>{acessoRua}</span>
            </div>
          </div>
        )}

        {/* Price per m² */}
        {pricePerM2 && (
          <div className="px-5 pb-3">
            <div style={{ background: '#F0EDE5', borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#948F84', fontWeight: 600 }}>Preço por m²</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtBRL(pricePerM2)}/m²
              </span>
            </div>
          </div>
        )}

        {/* Payment plans */}
        {priceEntry && (isAvailable || isNegotiating) && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px', fontFamily: "'Outfit', sans-serif" }}>
              Formas de Pagamento
            </p>
            {/* Cash */}
            <div style={{ background: '#081524', borderRadius: 12, padding: '11px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>À Vista</p>
                <p style={{ fontSize: 16, fontWeight: 800, color: GOLD, fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                  {fmtBRL(priceEntry.preco_vista)}
                </p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(200,164,74,0.75)', background: 'rgba(200,164,74,0.12)', padding: '3px 8px', borderRadius: 8 }}>
                −20%
              </span>
            </div>
            {/* Installments — desconto oficial por plano (quanto menor o prazo, maior o desconto) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {([
                { key: 'p12', label: '12×', parcela: priceEntry.p12_parcela, total: priceEntry.p12_total, entrada: priceEntry.p12_entrada },
                { key: 'p36', label: '36×', parcela: priceEntry.p36_parcela, total: priceEntry.p36_total, entrada: priceEntry.p36_entrada },
                { key: 'p60', label: '60×', parcela: priceEntry.p60_parcela, total: priceEntry.p60_total, entrada: priceEntry.p60_entrada },
                { key: 'p120', label: '120×', parcela: priceEntry.p120_parcela, total: priceEntry.p120_total, entrada: priceEntry.p120_entrada },
              ] as const).map(plan => {
                const desconto = PLAN_DISCOUNTS[plan.key];
                // Entrada oficial = 10% do total com desconto do plano (fallback p/ dados antigos)
                const entrada = plan.entrada ?? Math.round(plan.total * 10) / 100;
                return (
                  <div key={plan.label} style={{ background: '#F8F6F2', borderRadius: 12, padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: '#948F84', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontFamily: "'Outfit', sans-serif" }}>{plan.label}</p>
                      <span style={{
                        fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                        background: desconto > 0 ? 'rgba(50,209,124,0.14)' : 'rgba(0,0,0,0.05)',
                        color: desconto > 0 ? '#15803D' : '#A8A296',
                      }}>
                        {desconto > 0 ? `−${desconto}%` : 'sem desc.'}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                      {fmtBRL(plan.parcela)}/mês
                    </p>
                    <p style={{ fontSize: 8, color: '#B8B3A8', margin: '2px 0 0', fontWeight: 500 }}>
                      Entrada {fmtBRL(entrada)} · Total {fmtBRL(plan.total)}
                    </p>
                  </div>
                );
              })}
            </div>
            <p style={{ fontSize: 8.5, color: '#B8B3A8', margin: '8px 2px 0', fontWeight: 500, lineHeight: 1.45 }}>
              Entrada de 10% sobre o valor do plano · correção mensal pelo INCC conforme tabela oficial.
            </p>
          </div>
        )}

        {isNegotiating && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 11, color: '#92400E', background: '#FEF3C7', borderRadius: 10, padding: '9px 13px', margin: 0, lineHeight: 1.5 }}>
              Este lote está em processo de negociação. Entre em contato para verificar disponibilidade.
            </p>
          </div>
        )}

        {dbLot?.notes && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 11, color: '#636363', background: '#F8F6F2', borderRadius: 10, padding: '9px 13px', margin: 0, lineHeight: 1.5 }}>
              {dbLot.notes}
            </p>
          </div>
        )}

        {/* CTAs */}
        <div className="px-5 pt-1 pb-2 flex flex-col gap-2">
          {isAvailable || isNegotiating ? (
            <>
              <a
                href={`https://wa.me/${whatsappPhone}?text=${waInterest}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-[13px] font-bold uppercase tracking-wider overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #0B1B2D, #10233B)', color: '#fff', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
              >
                <MessageCircle size={15} />
                Tenho Interesse
                <span style={{ position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, opacity: 0.8 }} />
              </a>
              <a
                href={`https://wa.me/${whatsappPhone}?text=${waVisit}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl text-[12px] font-semibold"
                style={{ color: '#0B1B2D', border: '1.5px solid rgba(11,27,45,0.14)', background: '#F8F6F2', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
              >
                Agendar Visita
              </a>
            </>
          ) : (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${waGeneral}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-[13px] font-bold"
              style={{ color: '#0B1B2D', border: '1.5px solid rgba(11,27,45,0.12)', background: '#fff', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
            >
              <MessageCircle size={15} />
              Ver Lotes Disponíveis
            </a>
          )}
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

// ── Amenity icon (ID-mapped SVG) — no emoji ───────────────────────────────────

function AmenityIcon({ id, color, size = 22 }: { id: string; color: string; size?: number }) {
  const c = color ?? '#C8A44A';
  const prefix = id.replace(/-\d+$/, '');
  if (prefix === 'portaria') return <Shield size={size} style={{ color: c }} />;
  if (prefix === 'lazer') return <Dumbbell size={size} style={{ color: c }} />;
  if (prefix === 'area-verde') return <TreePine size={size} style={{ color: c }} />;
  if (prefix === 'coworking') return <Building2 size={size} style={{ color: c }} />;
  if (prefix === 'recreativa') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="9" x2="9" y2="21" />
      <line x1="15" y1="9" x2="15" y2="21" />
    </svg>
  );
  if (prefix === 'capela') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="7"/>
      <line x1="9.5" y1="4.5" x2="14.5" y2="4.5"/>
      <path d="M4 22V12l8-5 8 5v10"/>
      <path d="M9 22v-5a3 3 0 0 1 6 0v5"/>
    </svg>
  );
  return <MapPin size={size} style={{ color: c }} />;
}

// ── Common-area Bottom Sheet ──────────────────────────────────────────────────

function AmenityBottomSheet({
  amenity, onClose, onLocate, whatsappPhone, developmentName, fallbackTour360,
}: {
  amenity: Amenity;
  onClose: () => void;
  onLocate: () => void;
  whatsappPhone: string;
  developmentName: string;
  fallbackTour360?: string;
}) {
  const rawInfo = getAmenityInfo(amenity);
  const info = fallbackTour360 && !rawInfo.tour360 ? { ...rawInfo, tour360: fallbackTour360 } : rawInfo;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const waText = encodeURIComponent(
    `Olá! Gostaria de conhecer melhor a área "${info.title}" do ${developmentName}.`,
  );

  // Portal para document.body: o wrapper do mapa usa transform (pan/zoom), o que
  // torna `position:fixed` relativo a ele (containing block) — no desktop o sheet
  // ficava recortado/fora da vista. O portal escapa qualquer ancestral transformado.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[9998]"
        style={{ background: 'rgba(8,21,36,0.55)', backdropFilter: 'blur(2px)' }}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 320 }}
        // Mobile: bottom sheet. Desktop (sm:): modal centrado sobre o mapa (ml negativo
        // evita conflito de transform com o framer-motion). z alto p/ ficar acima de tudo.
        className="fixed left-0 right-0 bottom-0 z-[9999] sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-[8vh] sm:w-[440px] sm:max-w-[92vw] sm:ml-[-220px] sm:rounded-[22px]"
        style={{
          background: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.30)', maxHeight: '82vh', overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
        }}
        role="dialog"
        aria-label={`Detalhes da área ${info.title}`}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.14)' }} />
        </div>

        <div style={{ padding: '14px 20px 8px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${amenity.color}1F`, border: `1.5px solid ${amenity.color}55`,
          }}>
            <AmenityIcon id={amenity.id} color={amenity.color} size={26} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#C8A44A', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 2px', fontFamily: "'Outfit', sans-serif" }}>
              {info.subtitle}
            </p>
            <h3 style={{ fontSize: 19, fontWeight: 800, color: '#081524', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              {info.title}
            </h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: '#F2F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#636363" />
          </button>
        </div>

        {/* Tour virtual 360° (Kuula) — destaque */}
        {info.tour360 && (
          <div className="px-5 pb-2">
            <div style={{ position: 'relative', paddingTop: '62%', borderRadius: 14, overflow: 'hidden', background: '#000' }}>
              <iframe
                src={info.tour360}
                title={`${info.title} — tour 360°`}
                allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen; autoplay"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
            <p style={{ fontSize: 10.5, color: '#948F84', margin: '6px 2px 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Video size={12} style={{ color: '#C8A44A', flexShrink: 0 }} />
              Tour virtual 360° — arraste para explorar · óculos VR suportado
            </p>
          </div>
        )}

        {/* Galeria de fotos da área (projeto aprovado) */}
        {info.photos && info.photos.length > 0 && (
          <div
            className="flex gap-2 overflow-x-auto px-5 pb-1"
            style={{ scrollbarWidth: 'none', scrollSnapType: 'x mandatory' }}
          >
            {info.photos.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${info.title} — foto ${i + 1}`}
                loading="lazy"
                style={{
                  height: 168, minWidth: 244, width: 244, objectFit: 'cover',
                  borderRadius: 14, flexShrink: 0, scrollSnapAlign: 'start',
                  background: '#EDEAE3',
                }}
              />
            ))}
          </div>
        )}

        {/* Vídeo da área (se houver) */}
        {info.video && (
          <div className="px-5 pt-2">
            <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 14, overflow: 'hidden', background: '#000' }}>
              <iframe
                src={info.video}
                title={`${info.title} — vídeo`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </div>
          </div>
        )}

        <p style={{ padding: '14px 20px 0', fontSize: 13.5, lineHeight: 1.55, color: '#4A4A4A', margin: '4px 0 14px', fontFamily: "'Outfit', sans-serif" }}>
          {info.description}
        </p>

        {/* Equipamentos da área (lista oficial do PDF aprovado) */}
        {info.features && info.features.length > 0 && (
          <div style={{ padding: '0 20px', marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#A8A296', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px' }}>
              Equipamentos
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {info.features.map((f, i) => (
                <span key={i} style={{
                  fontSize: 11.5, fontWeight: 600, color: '#0B1B2D', background: '#EEF1F4',
                  borderRadius: 9, padding: '5px 10px', lineHeight: 1.2,
                }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: '0 20px', display: 'flex', gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: '#F8F6F2', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#A8A296', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>Função</p>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#081524', margin: 0 }}>{info.fn}</p>
          </div>
          <div style={{ flex: 1, background: '#F8F6F2', borderRadius: 12, padding: '10px 12px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#A8A296', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px' }}>Localização</p>
            <p style={{ fontSize: 12.5, fontWeight: 700, color: '#081524', margin: 0 }}>No empreendimento</p>
          </div>
        </div>

        <div style={{ padding: '0 20px 18px', display: 'flex', gap: 10 }}>
          <button
            onClick={() => { onLocate(); onClose(); }}
            className="flex items-center justify-center gap-2 active:scale-95"
            style={{ flex: 1, height: 48, borderRadius: 14, background: '#0B1B2D', color: '#fff', fontSize: 12.5, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
          >
            <Search size={15} /> Ver no mapa
          </button>
          <a
            href={`https://wa.me/${whatsappPhone}?text=${waText}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 active:scale-95"
            style={{ flex: 1, height: 48, borderRadius: 14, background: '#C8A44A', color: '#0B1B2D', fontSize: 12.5, fontWeight: 700, fontFamily: "'Outfit', sans-serif", textDecoration: 'none' }}
          >
            <MessageCircle size={15} /> Falar com especialista
          </a>
        </div>
      </motion.div>
    </>,
    document.body,
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AltoBellevuePlanView({
  lots: dbLots,
  developmentName,
  whatsappPhone = '5581986141487',
  amenityOverrides,
  virtualTourUrl,
}: Props) {
  const { data: mapData, loading, error, retry } = useABMap();
  // Lookup das mídias do backoffice por id de área (sobrepõe os defaults da UI).
  const overrideMap = useMemo(() => {
    const m = new Map<string, Partial<Amenity>>();
    for (const o of amenityOverrides ?? []) {
      const id = typeof o.id === 'string' ? o.id : null;
      if (id) m.set(id, o as Partial<Amenity>);
    }
    return m;
  }, [amenityOverrides]);
  const availability = useAbAvailability(true);
  const planLots = mapData?.lots ?? [];

  const [selectedLot, setSelectedLot] = useState<PlanLot | null>(null);
  const priceMap = usePrices(selectedLot !== null);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [activeQuadra, setActiveQuadra] = useState('ALL');
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showTechLayer, setShowTechLayer] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMiss, setSearchMiss] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  // Dica "toque em um lote": some sozinha após 6s ou na primeira seleção.
  const [showTapHint, setShowTapHint] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowTapHint(false), 6000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (selectedLot) setShowTapHint(false);
  }, [selectedLot]);
  const [vb, setVb] = useState<ViewBox>(INITIAL_VB);
  const vbLive = useRef<ViewBox>(INITIAL_VB);
  vbLive.current = vb;

  // ViewBox "casa": enquadra o empreendimento (perímetro ∪ lotes) com 8% de folga,
  // em vez do canvas inteiro — elimina o espaço morto escuro do overview e faz
  // zoom/reset sempre ancorarem no conteúdo, não no viewport (auditoria A3/zoom).
  const homeVb = useMemo<ViewBox>(() => {
    const pts: Point[] = [];
    for (const ring of mapData?.perimeter ?? []) pts.push(...ring);
    if (!pts.length) for (const l of mapData?.lots ?? []) { if (l.centroid) pts.push(l.centroid); }
    if (!pts.length) return INITIAL_VB;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of pts) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const padX = (maxX - minX) * 0.08, padY = (maxY - minY) * 0.08;
    minX -= padX; maxX += padX; minY -= padY; maxY += padY;
    let w = maxX - minX, h = maxY - minY;
    if (w <= 0 || h <= 0) return INITIAL_VB;
    // Corrige a proporção para a do SVG — sem distorção com preserveAspectRatio.
    if (w / h > SVG_W / SVG_H) h = w * (SVG_H / SVG_W);
    else w = h * (SVG_W / SVG_H);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }, [mapData]);

  // Aplica o enquadramento inicial uma única vez por carga do mapa.
  const homeApplied = useRef(false);
  useEffect(() => {
    if (!mapData || homeApplied.current) return;
    homeApplied.current = true;
    setVb(homeVb);
  }, [mapData, homeVb]);
  const animRef = useRef<number | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const pointerCache = useRef(new Map<number, { x: number; y: number }>());

  const scale = SVG_W / vb.w;

  const animateTo = useCallback((target: ViewBox) => {
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    const from = { ...vbLive.current };
    const duration = 350;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setVb({
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        w: from.w + (target.w - from.w) * e,
        h: from.h + (target.h - from.h) * e,
      });
      if (t < 1) animRef.current = requestAnimationFrame(tick);
      else animRef.current = null;
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // A4: ao filtrar por quadra no mobile, traz o mapa para a viewport — efeito
  // DESACOPLADO do clique (nunca rouba o gesto, ao contrário de scroll no handler).
  // Só rola se o mapa não estiver visível, evitando "pulo" desnecessário.
  useEffect(() => {
    if (!isMobile || activeQuadra === 'ALL') return;
    const el = containerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const visible = r.top >= 0 && r.bottom <= window.innerHeight;
    if (!visible) {
      const id = requestAnimationFrame(() =>
        el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return () => cancelAnimationFrame(id);
    }
  }, [activeQuadra, isMobile]);

  const allLots = useMemo(() => {
    const merged = mergeLots(dbLots, planLots);
    // Cadeia única de resolução (planilha viva > JSON canônico > banco) —
    // compartilhada com a visão Lista para que os números nunca divirjam (C1/C2).
    return merged.map((l) => {
      const status = resolveLotStatus(l.id, l.status, null, availability);
      return status === l.status ? l : { ...l, status };
    });
  }, [dbLots, planLots, availability]);

  const stats = useMemo(() => {
    const byStatus: Record<string, number> = {};
    for (const l of allLots) byStatus[l.status] = (byStatus[l.status] ?? 0) + 1;
    return {
      available: byStatus.DISPONIVEL ?? 0,
      negotiating: byStatus.NEGOCIACAO ?? 0,
      reserved: byStatus.RESERVADO ?? 0,
      sold: byStatus.VENDIDO ?? 0,
      total: allLots.length,
      byStatus,
    };
  }, [allLots]);

  // Legenda orientada a dados: só mostra status que existem no empreendimento,
  // com contagem ao lado — mesma taxonomia/fonte nas duas visões (M1).
  const presentStatuses = useMemo(
    () => Object.entries(STATUS_CFG).filter(([k]) => (stats.byStatus[k] ?? 0) > 0),
    [stats.byStatus],
  );

  const filteredLots = useMemo(() =>
    allLots.filter(lot => {
      // Lotes pendentes (sem polígono oficial, ex.: B-24) contam nas estatísticas,
      // mas não são desenhados no mapa — não têm posição real.
      if (lot.pending) return false;
      if (activeStatus !== 'ALL' && lot.status !== activeStatus) return false;
      if (activeQuadra !== 'ALL' && lot.quadra !== activeQuadra) return false;
      return true;
    }),
    [allLots, activeStatus, activeQuadra]
  );

  const quadras = useMemo(() =>
    [...new Set(allLots.map(l => l.quadra))].sort(),
    [allLots]
  );

  // Pointer handlers — single-finger drag pans the viewBox; two-finger pinch zooms it.
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (animRef.current !== null) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointerCache.current.size === 1) {
      // Double-tap zoom: zoom in 2.5× at tap point
      const now = performance.now();
      const lastTap = lastTapRef.current;
      const el = containerRef.current;
      if (el && lastTap && now - lastTap.time < 350 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 44) {
        const rect = el.getBoundingClientRect();
        const cur = vbLive.current;
        const pivotX = cur.x + (e.clientX - rect.left) / rect.width * cur.w;
        const pivotY = cur.y + (e.clientY - rect.top) / rect.height * cur.h;
        animateTo(zoomViewBox(cur, 0.4, pivotX, pivotY));
        lastTapRef.current = null;
        didDrag.current = true;
        return;
      }
      lastTapRef.current = { time: now, x: e.clientX, y: e.clientY };
      setIsDragging(true);
      didDrag.current = false;
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  }, [animateTo]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerCache.current.has(e.pointerId)) return;

    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    if (pointerCache.current.size === 2) {
      // Pinch-to-zoom: derive zoom factor from change in finger distance, pivot at midpoint
      const ids = [...pointerCache.current.keys()];
      const otherId = ids.find(id => id !== e.pointerId)!;
      const otherPos = pointerCache.current.get(otherId)!;
      const thisOldPos = pointerCache.current.get(e.pointerId)!;

      const prevDist = Math.hypot(thisOldPos.x - otherPos.x, thisOldPos.y - otherPos.y);
      const currDist = Math.hypot(e.clientX - otherPos.x, e.clientY - otherPos.y);
      pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (prevDist < 1) return;
      // currDist > prevDist → fingers spreading → zoom in → viewBox shrinks → factor < 1
      const factor = prevDist / currDist;

      // Pivot = midpoint of the two fingers, in SVG coordinates
      const midClientX = (e.clientX + otherPos.x) / 2;
      const midClientY = (e.clientY + otherPos.y) / 2;
      const cur = vbLive.current;
      const pivotX = cur.x + (midClientX - rect.left) / rect.width * cur.w;
      const pivotY = cur.y + (midClientY - rect.top) / rect.height * cur.h;

      setVb(prev => zoomViewBox(prev, factor, pivotX, pivotY));
      return;
    }

    // Single-finger drag: pan the viewBox (drag right → vb.x decreases)
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    pointerCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setVb(prev => ({
      ...prev,
      x: prev.x - dx / rect.width * prev.w,
      y: prev.y - dy / rect.height * prev.h,
    }));
  }, [isDragging]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    pointerCache.current.delete(e.pointerId);
    if (pointerCache.current.size === 0) setIsDragging(false);
  }, []);

  // Wheel zoom centered on cursor — deltaY > 0 = zoom out (widen viewBox), < 0 = zoom in
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.12 : 0.89;
      const rect = el.getBoundingClientRect();
      const cur = vbLive.current;
      const pivotX = cur.x + (e.clientX - rect.left) / rect.width * cur.w;
      const pivotY = cur.y + (e.clientY - rect.top) / rect.height * cur.h;
      setVb(prev => zoomViewBox(prev, factor, pivotX, pivotY));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomIn = useCallback(() => setVb(prev => zoomViewBox(prev, 0.75)), []);
  const zoomOut = useCallback(() => setVb(prev => zoomViewBox(prev, 1.33)), []);
  // "Ver tudo" volta ao enquadramento do empreendimento (conteúdo), não ao canvas.
  const resetView = useCallback(() => animateTo(homeVb), [animateTo, homeVb]);

  // Área comum clicada → abre painel (com mídia do backoffice, se houver) e fecha lote.
  const handleAmenityClick = useCallback((a: Amenity) => {
    setSelectedLot(null);
    const ov = overrideMap.get(a.id) ?? overrideMap.get(a.id.replace(/-\d+$/, ''));
    setSelectedAmenity(ov ? { ...a, ...ov, id: a.id, x: a.x, y: a.y } : a);
  }, [overrideMap]);

  // "Ver no mapa" → centraliza e aproxima na área comum
  const locateAmenity = useCallback((a: { x: number; y: number }) => {
    const targetW = SVG_W / 6;
    const targetH = targetW * (SVG_H / SVG_W);
    animateTo({ x: a.x - targetW / 2, y: a.y - targetH / 2, w: targetW, h: targetH });
  }, [animateTo]);

  const toggleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!document.fullscreenElement) {
      if (el?.requestFullscreen) {
        try { await el.requestFullscreen(); return; } catch { /* iOS fallback */ }
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) { await document.exitFullscreen(); return; }
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', onKey);
    // iOS-safe scroll lock: position:fixed prevents rubber-band scrolling under the overlay
    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isFullscreen]);

  // Native fullscreen API: sync CSS state when browser chrome toggles fullscreen
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Centre the viewBox on (cx, cy) at the given scale (SVG_W / viewBox.w).
  const focusOn = useCallback((cx: number, cy: number, targetScale = 5) => {
    const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, targetScale));
    const newW = SVG_W / s;
    const newH = newW * (SVG_H / SVG_W);
    animateTo({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH });
  }, [animateTo]);

  const focusLot = useCallback((lot: PlanLot) => {
    setSelectedLot(lot);
    if (lot.centroid) focusOn(lot.centroid[0], lot.centroid[1], 6);
  }, [focusOn]);

  // Enquadra uma quadra: bounding box robusto a outliers (IQR) com folga.
  // Reutilizado pelos chips de quadra E pelos badges clicáveis do mapa (M2),
  // garantindo comportamento idêntico — fonte única de verdade da navegação.
  const focusQuadra = useCallback((quadra: string) => {
    const pts = allLots.filter((l) => l.quadra === quadra && l.centroid);
    if (!pts.length) return;
    const sortedX = pts.map((l) => l.centroid![0]).sort((a, b) => a - b);
    const sortedY = pts.map((l) => l.centroid![1]).sort((a, b) => a - b);
    const q1x = sortedX[Math.floor(sortedX.length * 0.25)];
    const q3x = sortedX[Math.floor(sortedX.length * 0.75)];
    const q1y = sortedY[Math.floor(sortedY.length * 0.25)];
    const q3y = sortedY[Math.floor(sortedY.length * 0.75)];
    const fxl = q1x - 1.5 * (q3x - q1x), fxu = q3x + 1.5 * (q3x - q1x);
    const fyl = q1y - 1.5 * (q3y - q1y), fyu = q3y + 1.5 * (q3y - q1y);
    const inXs = sortedX.filter((v) => v >= fxl && v <= fxu);
    const inYs = sortedY.filter((v) => v >= fyl && v <= fyu);
    const minX = inXs[0] ?? sortedX[0], maxX = inXs[inXs.length - 1] ?? sortedX[sortedX.length - 1];
    const minY = inYs[0] ?? sortedY[0], maxY = inYs[inYs.length - 1] ?? sortedY[sortedY.length - 1];
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const spanX = Math.max(maxX - minX, 80) * 1.8;
    const spanY = Math.max(maxY - minY, 80) * 1.8;
    const rawW = Math.max(spanX, spanY * (SVG_W / SVG_H));
    const newW = Math.min(rawW, SVG_W / 2.5);
    const newH = newW * (SVG_H / SVG_W);
    animateTo({ x: cx - newW / 2, y: cy - newH / 2, w: newW, h: newH });
  }, [allLots, animateTo]);

  // Seleção de quadra (estado de UI) — desacoplada do enquadramento (estado do
  // mapa). Um único clique aplica filtro E aproxima, sem scroll roubando o gesto.
  const selectQuadra = useCallback((quadra: string) => {
    const next = quadra === activeQuadra && quadra !== 'ALL' ? 'ALL' : quadra;
    setActiveQuadra(next);
    setSelectedLot(null);
    if (next === 'ALL') resetView();
    else focusQuadra(next);
  }, [activeQuadra, focusQuadra, resetView]);

  // Badge no mapa: aproxima a quadra sem ativar o filtro (drill-down visual).
  const handleQuadraBadgeClick = useCallback((quadra: string) => {
    setSelectedLot(null);
    focusQuadra(quadra);
  }, [focusQuadra]);

  const handleBgClick = useCallback(() => {
    if (!didDrag.current) setSelectedLot(null);
  }, []);

  // Busca "A-12", "A12", "a 12" ou só "12" (dentro da quadra ativa).
  const runSearch = useCallback(() => {
    const q = searchQuery.trim().toUpperCase().replace(/\s+/g, '');
    if (!q) return;
    const m = q.match(/^([A-P])?-?(\d{1,3})$/);
    if (!m) { setSearchMiss(true); return; }
    const [, qLetter, num] = m;
    const n = String(parseInt(num, 10)).padStart(2, '0');
    const found = allLots.find((l) => {
      if (l.pending) return false; // lote sem posição real (ex.: B-24) não é localizável
      const matchNum = String(l.lot_number).padStart(2, '0') === n;
      if (qLetter) return l.quadra === qLetter && matchNum;
      if (activeQuadra !== 'ALL') return l.quadra === activeQuadra && matchNum;
      return matchNum; // sem quadra → primeiro match
    });
    if (found) { setSearchMiss(false); focusLot(found); }
    else setSearchMiss(true);
  }, [searchQuery, allLots, activeQuadra, focusLot]);

  const selectedPrice = selectedLot
    ? priceMap.get(`${selectedLot.quadra}-${selectedLot.lot_number}`)
    : undefined;

  const selectedDbLot = selectedLot
    ? dbLots.find(l => `${l.quadra}-${String(l.lot_number).padStart(2, '0')}` === selectedLot.id)
    : undefined;

  const zoomLabel = scale < 3 ? 'Toque numa quadra para explorar os lotes'
    : scale < 4 ? 'Toque num lote para ver preço e status'
    : scale < 5.5 ? 'Lote + área · toque para detalhes'
    : scale < 9 ? 'Testada e profundidade'
    : 'Detalhamento completo';

  const mapHeight = isMobile ? 'max(78vw, 480px)' : 'clamp(520px, 68vh, 820px)';

  return (
    <div
      ref={wrapperRef}
      className={isFullscreen ? 'fixed inset-0 z-[9000] overflow-hidden flex flex-col' : 'w-full'}
      style={{ background: '#F7F8FA' }}
    >

      {/* ── FILTER PILLS ────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '12px 14px 10px' }}>
        {/* Search by lot */}
        <div className="flex items-center gap-2 mb-2.5">
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              aria-label="Sair da tela cheia"
              className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-90"
              style={{ background: '#0B1B2D', color: '#fff', border: '1.5px solid rgba(200,164,74,0.50)' }}
            >
              <Minimize2 size={15} />
            </button>
          )}
          <div
            className="flex items-center gap-2 flex-1"
            style={{
              height: 34, borderRadius: 10, padding: '0 10px',
              background: '#F7F8FA',
              border: searchMiss ? '1.5px solid #FF5C5C' : '1.5px solid rgba(200,164,74,0.3)',
            }}
          >
            <Search size={15} color="#948F84" style={{ flexShrink: 0 }} />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchMiss(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
              placeholder="Buscar lote (ex.: A-12)"
              inputMode="text"
              aria-label="Buscar lote por número"
              className="flex-1 bg-transparent outline-none"
              style={{ fontSize: 13, color: '#081524', fontFamily: "'Outfit', sans-serif", minWidth: 0 }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchMiss(false); }} aria-label="Limpar busca" style={{ flexShrink: 0 }}>
                <X size={14} color="#948F84" />
              </button>
            )}
          </div>
          <button
            onClick={runSearch}
            className="flex items-center justify-center flex-shrink-0 active:scale-95"
            style={{ height: 34, paddingLeft: 14, paddingRight: 14, borderRadius: 10, background: '#0B1B2D', color: '#fff', fontSize: 11, fontWeight: 700, fontFamily: "'Outfit', sans-serif", border: '1.5px solid rgba(200,164,74,0.5)' }}
          >
            Ir
          </button>
        </div>
        {searchMiss && (
          <p style={{ fontSize: 10, color: '#FF5C5C', margin: '-4px 0 8px', fontWeight: 600 }}>
            Lote não encontrado. Tente como "A-12".
          </p>
        )}

        {/* Status — data-driven: "Todos" + cada status presente, mesma fonte da legenda (M1) */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
          {([
            { key: 'ALL', label: 'Todos', count: stats.total, dot: GOLD },
            ...presentStatuses.map(([key, cfg]) => ({
              key, label: cfg.label, count: stats.byStatus[key] ?? 0, dot: cfg.dot,
            })),
          ]).map(({ key, label, count, dot }) => {
            const isActive = activeStatus === key;
            return (
              <button
                key={key}
                onClick={() => { setActiveStatus(key); setSelectedLot(null); }}
                className="flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  height: 32, paddingLeft: 10, paddingRight: 10, borderRadius: 20,
                  fontSize: 11, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                  border: isActive ? '1.5px solid #C8A44A' : '1.5px solid rgba(200,164,74,0.3)',
                  background: isActive ? '#0B1B2D' : '#fff',
                  color: isActive ? '#fff' : '#636363',
                  boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? 'rgba(255,255,255,0.5)' : dot, display: 'inline-block', flexShrink: 0 }} />
                {label}
                <span style={{ fontSize: 9, fontWeight: 800, opacity: 0.65, fontFamily: "'JetBrains Mono', monospace" }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Quadras — com indicador de rolagem nas bordas (B5) */}
        <EdgeFadeRow className="flex gap-1.5 overflow-x-auto items-center">
          <span style={{ fontSize: 9, fontWeight: 700, color: '#C8C3BB', textTransform: 'uppercase', letterSpacing: '0.15em', alignSelf: 'center', flexShrink: 0, marginRight: 2 }}>
            Quadra
          </span>
          {(['ALL', ...quadras] as string[]).map(q => {
            const isActive = activeQuadra === q;
            const avail = q === 'ALL' ? 0 : allLots.filter(l => l.quadra === q && l.status === 'DISPONIVEL').length;
            return (
              <button
                key={q}
                onClick={() => selectQuadra(q)}
                aria-pressed={isActive}
                aria-label={q === 'ALL' ? 'Ver todas as quadras' : `Quadra ${q}${avail > 0 ? `, ${avail} disponíveis` : ''}`}
                style={{
                  height: 32, paddingLeft: 12, paddingRight: 12, borderRadius: 16,
                  fontSize: 10, fontWeight: 700, fontFamily: "'Outfit', sans-serif",
                  border: isActive ? 'none' : '1.5px solid rgba(0,0,0,0.09)',
                  background: isActive ? '#0B1B2D' : '#F7F8FA',
                  color: isActive ? '#fff' : '#636363',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {q === 'ALL' ? 'Todas' : q}
                {avail > 0 && !isActive && (
                  <span style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: '50%', background: '#32D17C', border: '1.5px solid #fff' }} />
                )}
              </button>
            );
          })}
        </EdgeFadeRow>
      </div>

      {/* ── MAP ─────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden${isFullscreen ? ' flex-1 min-h-0' : ''}`}
        style={{ height: isFullscreen ? 'auto' : mapHeight, background: NAVY }}
      >
        {/* Fallback estático clicável — camada 3: nunca deixa o mapa em branco */}
        {error && (
          <div className="absolute inset-0 z-30" style={{ background: NAVY }}>
            {/* Planta estática (offline-first) */}
            <img
              src="/images/maps/alto-bellevue-plant.jpg"
              alt="Planta do condomínio fechado Alto Bellevue"
              className="w-full h-full"
              style={{ objectFit: 'cover', opacity: 0.55 }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 px-8 text-center"
              style={{ background: 'linear-gradient(rgba(8,21,36,0.45), rgba(8,21,36,0.78))' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircle size={22} style={{ color: 'rgba(200,164,74,0.75)' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.88)', margin: '0 0 4px', fontFamily: "'Outfit', sans-serif" }}>
                  Modo planta estática
                </p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, maxWidth: 280 }}>
                  Não foi possível carregar o mapa interativo. Veja a planta acima ou fale com um
                  especialista para condições atualizadas.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button
                  onClick={retry}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-opacity hover:opacity-80 active:scale-95"
                  style={{ background: GOLD, color: '#0B1B2D', fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}
                >
                  <RefreshCw size={13} />
                  Tentar novamente
                </button>
                <a
                  href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Gostaria de informações sobre lotes disponíveis no ${developmentName}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.10)', color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: "'Outfit', sans-serif", textDecoration: 'none', border: '1px solid rgba(255,255,255,0.18)' }}
                >
                  <MessageCircle size={13} />
                  Falar com especialista
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && <MapSkeleton />}

        {/* Map */}
        {!loading && !error && (
          <MapInner
            lots={filteredLots}
            allLots={allLots}
            context={mapData}
            showTechLayer={showTechLayer}
            selectedId={selectedLot?.id ?? null}
            vb={vb}
            isDragging={isDragging}
            activeQuadra={activeQuadra}
            onLotClick={setSelectedLot}
            onAmenityClick={handleAmenityClick}
            onQuadraClick={handleQuadraBadgeClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onBgClick={handleBgClick}
          />
        )}

        {/* Controls — divididos em dois cantos para nunca cobrir os lotes do
            centro-direita no mobile (C4). Camada+expandir no topo; zoom/ver-tudo
            embaixo (convenção Google/Apple Maps). Alvos 44px (Apple HIG).
            No mobile, +/− são ocultados: pinça, duplo-toque e toque na quadra já
            dão zoom (padrão nativo) — isso desafoga o canto e libera o FAB. */}
        {!error && !loading && (
          <>
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
              <MapBtn
                onClick={() => setShowTechLayer((v) => !v)}
                label={showTechLayer ? 'Ocultar camada técnica' : 'Mostrar camada técnica'}
                active={showTechLayer}
              >
                <Layers size={17} style={{ opacity: showTechLayer ? 1 : 0.5 }} />
              </MapBtn>
              <MapBtn
                onClick={toggleFullscreen}
                label={isFullscreen ? 'Sair da tela cheia' : 'Expandir mapa'}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </MapBtn>
            </div>
            <div
              className="absolute right-3 flex flex-col gap-2 z-10"
              style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {!isMobile && <MapBtn onClick={zoomIn} label="Aproximar"><ZoomIn size={17} /></MapBtn>}
              {!isMobile && <MapBtn onClick={zoomOut} label="Afastar"><ZoomOut size={17} /></MapBtn>}
              <MapBtn onClick={resetView} label="Ver tudo"><RotateCcw size={15} /></MapBtn>
            </div>
          </>
        )}

        {/* Active quadra badge */}
        <AnimatePresence>
          {activeQuadra !== 'ALL' && !loading && !error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.18 }}
              className="absolute top-3 left-3 z-10 pointer-events-none"
            >
              <div
                className="px-3.5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest"
                style={{
                  background: 'rgba(200,163,95,0.90)',
                  color: '#fff',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  fontFamily: "'Outfit', sans-serif",
                  boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
                }}
              >
                Quadra {activeQuadra}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom level text indicator — canto inferior esquerdo (o direito é do
            cluster de zoom). pointer-events-none p/ não bloquear o pan/arraste. */}
        {!loading && !error && (
          <div
            className="absolute left-3 z-10 pointer-events-none"
            style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <span
              className="px-2.5 py-1 rounded-lg text-[9px] font-semibold"
              style={{
                background: 'rgba(8,21,36,0.72)',
                color: 'rgba(200,164,74,0.80)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '0.06em',
              }}
            >
              {zoomLabel}
            </span>
          </div>
        )}

        {/* Tap hint — some após 6s ou na primeira interação (não cobre o mapa nem
            colide com o indicador de zoom no mobile) */}
        <AnimatePresence>
          {showTapHint && !selectedLot && !loading && !error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
              style={{ maxWidth: 'calc(100% - 24px)' }}
            >
              <span
                className="px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                style={{
                  background: 'rgba(0,0,0,0.50)',
                  color: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                Toque em um lote para ver detalhes
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── STATS BAR ─────────────────────────────────── */}
      {!isFullscreen && <div
        style={{
          background: '#fff',
          borderTop: '1px solid rgba(0,0,0,0.06)',
          padding: '11px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div className="flex items-center gap-4 flex-wrap">
          {presentStatuses.map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#081524', fontFamily: "'JetBrains Mono', monospace" }}>{stats.byStatus[key]}</span>
              <span style={{ fontSize: 10, color: '#948F84', fontWeight: 500 }}>{cfg.label}</span>
            </div>
          ))}
        </div>
        <span style={{ fontSize: 10, color: '#C0BAB2', fontWeight: 500, flexShrink: 0 }}>
          {stats.total} lotes · {quadras.length} quadras
        </span>
      </div>}

      {/* ── LEGEND — data-driven: só status presentes, com contagem (M1/B4) ── */}
      {!isFullscreen && <div style={{ background: '#F8F6F2', borderTop: '1px solid rgba(0,0,0,0.04)', padding: '8px 16px', display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#C8C3BB', textTransform: 'uppercase', letterSpacing: '0.15em', flexShrink: 0 }}>Legenda</span>
        {presentStatuses.map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div style={{ width: 11, height: 11, borderRadius: 3, background: cfg.dot, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: '#636363', fontWeight: 600 }}>{cfg.label}</span>
            <span style={{ fontSize: 10, color: '#A8A296', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{stats.byStatus[key]}</span>
          </div>
        ))}
      </div>}

      {/* ── ÁREAS COMUNS ────────────────────────────────── */}
      {!isFullscreen && mapData?.amenities && mapData.amenities.length > 0 && (
        <div style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)', padding: '12px 16px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#C8C3BB', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px', fontFamily: "'Outfit', sans-serif" }}>
            Áreas Comuns
          </p>
          <div className="flex gap-2 flex-wrap">
            {mapData.amenities.map(a => (
              <button
                key={a.id}
                onClick={() => handleAmenityClick(a)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg transition-all active:scale-95 hover:opacity-90"
                style={{
                  background: `${a.color}14`,
                  border: `1.5px solid ${a.color}55`,
                  color: a.color,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  flexShrink: 0,
                }}
                aria-label={`Ver detalhes: ${a.label}`}
              >
                <AmenityIcon id={a.id} color={a.color} size={14} />
                {a.label}
              </button>
            ))}
            {mapData.greenAreas && mapData.greenAreas.length > 0 && (
              <button
                onClick={() => handleAmenityClick({ id: 'area-verde', label: 'Área Verde', icon: 'tree', color: '#66BB6A', x: mapData.greenAreas[0].x, y: mapData.greenAreas[0].y })}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg transition-all active:scale-95 hover:opacity-90"
                style={{
                  background: 'rgba(102,187,106,0.08)',
                  border: '1.5px solid rgba(102,187,106,0.50)',
                  color: '#66BB6A',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'Outfit', sans-serif",
                  flexShrink: 0,
                }}
                aria-label="Ver detalhes: Áreas Verdes"
              >
                <TreePine size={14} style={{ color: '#66BB6A' }} />
                Área Verde ({mapData.greenAreas.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── TOUR VIRTUAL 360° — visível quando configurado no backoffice ── */}
      {!isFullscreen && virtualTourUrl && (
        <div style={{ background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)', padding: '16px 16px 20px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#C8C3BB', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px', fontFamily: "'Outfit', sans-serif" }}>
            Tour Virtual 360°
          </p>
          <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 16, overflow: 'hidden', background: '#000' }}>
            <iframe
              src={virtualTourUrl}
              title={`${developmentName} — tour virtual 360°`}
              allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen; autoplay"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            />
          </div>
          <p style={{ fontSize: 10.5, color: '#948F84', margin: '6px 2px 0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Video size={12} style={{ color: '#C8A44A', flexShrink: 0 }} />
            Arraste para explorar o empreendimento em 360° · compatível com óculos VR
          </p>
        </div>
      )}

      {/* ── CTA STRIP — hidden while detail sheet is open ── */}
      {!isFullscreen && <AnimatePresence>
        {!selectedLot && (
          <motion.div
            initial={false}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              background: '#0B1B2D',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
              overflow: 'hidden',
            }}
          >
            <div>
              <p style={{ fontSize: 12, color: GOLD, fontWeight: 700, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Outfit', sans-serif" }}>
                {stats.available} lote{stats.available !== 1 ? 's' : ''} disponíve{stats.available !== 1 ? 'is' : 'l'}
              </p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', margin: 0 }}>
                Fale com um especialista e escolha o seu.
              </p>
            </div>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse em um lote no ${developmentName}. Gostaria de ver as opções disponíveis.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 h-11 px-5 rounded-xl text-[11px] font-bold uppercase tracking-wider flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ background: GOLD, color: '#0B1B2D', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
            >
              <MessageCircle size={13} />
              Falar com Especialista
            </a>
          </motion.div>
        )}
      </AnimatePresence>}

      {/* ── DETAIL BOTTOM SHEET ─────────────────────────── */}
      <AnimatePresence>
        {selectedLot && (
          <LotBottomSheet
            lot={selectedLot}
            priceEntry={selectedPrice}
            onClose={() => setSelectedLot(null)}
            whatsappPhone={whatsappPhone}
            developmentName={developmentName}
            dbLot={selectedDbLot}
            streetLabels={mapData?.streetLabels}
          />
        )}
      </AnimatePresence>

      {/* ── COMMON-AREA BOTTOM SHEET ────────────────────── */}
      <AnimatePresence>
        {selectedAmenity && (
          <AmenityBottomSheet
            amenity={selectedAmenity}
            onClose={() => setSelectedAmenity(null)}
            onLocate={() => locateAmenity(selectedAmenity)}
            whatsappPhone={whatsappPhone}
            developmentName={developmentName}
            fallbackTour360={virtualTourUrl}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
