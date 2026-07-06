'use client';

import React, {
  useRef, useState, useCallback, useEffect, useMemo, memo,
} from 'react';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import {
  X, ZoomIn, ZoomOut, RotateCcw, Layers,
  Sun, Moon, Maximize2, Minimize2, Navigation,
  TreePine, Building2, Map as MapIcon, RefreshCw, AlertCircle,
  Shield, Check,
  SlidersHorizontal, Copy, RotateCw,
} from 'lucide-react';
import { useLotCart } from '@/hooks/useLotCart';
import { cartTotals, buildCartShareUrl, type CartLot, type SelectedPaymentPlan } from '@/lib/lotmap/cart';
import ProposalFormModal from './ProposalFormModal';
import { CartFab, CartSheet } from './LotCartSheet';
import LotDetailContent from './LotDetailContent';
import { loadAltoBellevueMap } from '@/lib/lots/alto-bellevue';
import { useAbAvailability, useAbCanonicalStatuses } from '@/hooks/use-ab-availability';
import { resolveLotStatus } from '@/lib/lots/alto-bellevue-availability';
import {
  lotsToGeoJSON, streetsToGeoJSON, perimeterToGeoJSON,
  brLineToGeoJSON, amenitiesToGeoJSON, greenAreasToGeoJSON,
  streetLabelsToGeoJSON, svgToGeo, AB_GEO_CONFIG, STATUS_COLORS,
  hydrateAbCalibration, setAbCalibration, getAbCalibration,
  AB_CALIBRATION_KEY, type AbCalibration,
} from '@/lib/lots/alto-bellevue-geojson';
import type { ABLot, ABMapData, Amenity } from '@/lib/lots/alto-bellevue';
import { createClient } from '@/lib/supabase/client';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DBLot {
  id: string; quadra: string; lot_number: number;
  area_m2: number; price: number | null;
  status: string; special_type: string | null; notes: string | null;
}

interface Props {
  developmentId: string;
  developmentName: string;
  whatsappPhone?: string;
  /** Altura do container do mapa. Default '100svh' (hero); embutido use ex. '72vh'. */
  height?: string;
  /** Mídias das áreas comuns vindas do backoffice (developments.lot_map_amenities). */
  mapAmenities?: Record<string, unknown>[];
  /**
   * Instância de carrinho compartilhada (levantada pelo pai do alternador —
   * padrão P9). Sem esta prop, o componente cria a própria instância via
   * useLotCart — comportamento standalone inalterado.
   */
  cart?: ReturnType<typeof useLotCart<CartLot>>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GOLD = '#C8A44A';
const NAVY = '#0B1928';
const WA = '5581986141487';

// Basemap SATÉLITE (imagem aérea real) — Esri World Imagery, raster gratuito sem
// token. Os polígonos dos lotes/vias/perímetro são anexados POR CIMA via
// addABLayers (sem beforeId), então um estilo só-imagem renderiza tudo certo.
// É o que dá a aparência "render ultrarrealista" pedida (vs. o mapa de ruas).
const SATELLITE_STYLE: import('maplibre-gl').StyleSpecification = {
  version: 8,
  // Glyphs com a família "Noto Sans Bold" usada pelas camadas de rótulo.
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    esriImagery: {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        'Imagery © Esri — Maxar, Earthstar Geographics, and the GIS User Community',
    },
  },
  layers: [{ id: 'esri-imagery', type: 'raster', source: 'esriImagery' }],
};

// Layer IDs registered in MapLibre
const LAYER = {
  perimFill:     'ab-perim-fill',
  perimOutline:  'ab-perim-outline',
  streetsBg:     'ab-streets-bg',
  streetsFg:     'ab-streets-fg',
  brBg:          'ab-br-bg',
  brFg:          'ab-br-fg',
  lotFill:       'ab-lot-fill',
  lotOutline:    'ab-lot-outline',
  lotLabels:     'ab-lot-labels',
  amenityCircle: 'ab-amenity-circle',
  amenityLabel:  'ab-amenity-label',
  greenCircle:   'ab-green-circle',
  greenLabel:    'ab-green-label',
  streetLabel:   'ab-street-label',
} as const;

const SOURCE = {
  perim:     'ab-perim',
  streets:   'ab-streets',
  brLine:    'ab-br',
  lots:      'ab-lots',
  amenities: 'ab-amenities',
  green:     'ab-green',
  labels:    'ab-labels',
} as const;

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

// ── Amenity content ───────────────────────────────────────────────────────────

const AMENITY_INFO: Record<string, { title: string; description: string; features?: string[] }> = {
  portaria: {
    title: 'Portaria Principal',
    description: 'Controle de acesso 24h com guarita, câmeras e comunicação com moradores.',
  },
  lazer: {
    title: 'Área de Lazer / Clube',
    description: 'Piscina coberta, academia, quadras poliesportivas e society, salão de festas, espaço gourmet, fire pit e mirante.',
    features: [
      'Piscina coberta aquecida com borda infinita', 'Piscina descoberta com borda infinita',
      'Espaço Fit · Academia', 'Quadra Poliesportiva', 'Quadra Society',
      'Salão de Festas (200 pax)', 'Espaço Gourmet', 'Fire Pit · Mirante',
      'Vestiários', 'Capela', 'Pista de Cooper',
    ],
  },
  'area-verde': {
    title: 'Área Verde',
    description: 'Áreas verdes preservadas e arborizadas para lazer e convivência.',
  },
  coworking: {
    title: 'Coworking · Bloco Administrativo',
    description: 'Espaço de trabalho compartilhado e administração do condomínio.',
  },
  recreativa: {
    title: 'Área Recreativa',
    description: 'Espaço multifuncional para esporte e lazer ao ar livre.',
  },
};

// ── MapLibre loader (dynamic — keeps JS bundle lean) ─────────────────────────

type MapLibreMap = import('maplibre-gl').Map;
type MapLibreGL = typeof import('maplibre-gl');

let maplibrePromise: Promise<MapLibreGL> | null = null;
function loadMapLibre(): Promise<MapLibreGL> {
  if (!maplibrePromise) {
    maplibrePromise = import('maplibre-gl').then(async (mod) => {
      await import('maplibre-gl/dist/maplibre-gl.css');
      return mod;
    });
  }
  return maplibrePromise;
}

// ── Map initialization ────────────────────────────────────────────────────────

async function initMap(
  container: HTMLDivElement,
  darkMode: boolean,
  onLoad: (map: MapLibreMap, ml: MapLibreGL) => void,
): Promise<MapLibreMap> {
  const ml = await loadMapLibre();
  const map = new ml.Map({
    container,
    // Base sempre satélite; `darkMode` segue tingindo rótulos/contornos (via
    // addABLayers) para legibilidade sobre a imagem aérea.
    style: SATELLITE_STYLE,
    center: [AB_GEO_CONFIG.centerLng, AB_GEO_CONFIG.centerLat],
    zoom: AB_GEO_CONFIG.initialZoom,
    bearing: 0,
    pitch: 0,
    attributionControl: false,
  });

  map.addControl(new ml.AttributionControl({ compact: true }), 'bottom-right');

  map.on('load', () => onLoad(map, ml));
  return map;
}

// ── Enquadramento responsivo ────────────────────────────────────────────────
// Calcula a caixa geográfica do empreendimento (perímetro → fallback: lotes) já
// com a calibração aplicada, e enquadra o mapa nela com padding por dispositivo.
// É o que faz "cada tela abrir e renderizar TUDO" — mobile, tablet e desktop.

function computeDevBounds(data: ABMapData): [[number, number], [number, number]] | null {
  const pts: [number, number][] = [];
  for (const ring of data.perimeter ?? []) for (const [x, y] of ring) pts.push(svgToGeo(x, y));
  if (!pts.length) {
    for (const lot of data.lots) {
      if (!lot.has_polygon || !lot.polygon?.length) continue;
      for (const [x, y] of lot.polygon) pts.push(svgToGeo(x, y));
    }
  }
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of pts) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
  }
  if (!Number.isFinite(minLng)) return null;
  return [[minLng, minLat], [maxLng, maxLat]];
}

function fitMapToDev(map: MapLibreMap, data: ABMapData, duration = 0) {
  const bounds = computeDevBounds(data);
  if (!bounds) return;
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const mobile = w < 640;
  map.fitBounds(bounds, {
    // Mais respiro embaixo no mobile (legenda/sheet) e nas laterais no desktop.
    padding: mobile
      ? { top: 70, right: 14, bottom: 96, left: 14 }
      : { top: 84, right: 76, bottom: 84, left: 76 },
    duration,
    maxZoom: 18,
  });
}

// ── Add all Alto Bellevue layers ──────────────────────────────────────────────

function addABLayers(map: MapLibreMap, data: ABMapData, dbLots: DBLot[], darkMode: boolean) {
  // Merge DB status into map lots
  const dbMap = new Map(dbLots.map(l => [`${l.quadra}-${String(l.lot_number).padStart(2, '0')}`, l]));
  const mergedLots = data.lots.map(lot => {
    const db = dbMap.get(lot.id);
    return db ? { ...lot, status: db.status || lot.status, price: db.price ?? lot.price } : lot;
  });

  const lotsGJ    = lotsToGeoJSON(mergedLots);
  const streetsGJ  = streetsToGeoJSON(data.streets);
  const perimGJ    = perimeterToGeoJSON(data.perimeter);
  const brGJ       = brLineToGeoJSON(data.brLine);
  const amenitiesGJ = amenitiesToGeoJSON(data.amenities);
  const greenGJ    = greenAreasToGeoJSON(data.greenAreas ?? []);
  const labelsGJ   = streetLabelsToGeoJSON(data.streetLabels ?? []);

  // Sources
  map.addSource(SOURCE.perim,     { type: 'geojson', data: perimGJ });
  map.addSource(SOURCE.streets,   { type: 'geojson', data: streetsGJ });
  map.addSource(SOURCE.brLine,    { type: 'geojson', data: brGJ });
  map.addSource(SOURCE.lots,      { type: 'geojson', data: lotsGJ, generateId: false });
  map.addSource(SOURCE.amenities, { type: 'geojson', data: amenitiesGJ });
  map.addSource(SOURCE.green,     { type: 'geojson', data: greenGJ });
  map.addSource(SOURCE.labels,    { type: 'geojson', data: labelsGJ });

  const sd = darkMode ? 0.12 : 0.06; // shadow depth for terrain fill

  // ── Perimeter ──────────────────────────────────────────────────────────────
  map.addLayer({
    id: LAYER.perimFill,
    type: 'fill',
    source: SOURCE.perim,
    paint: {
      'fill-color': darkMode ? 'rgba(200,164,74,0.06)' : 'rgba(200,164,74,0.08)',
    },
  });
  map.addLayer({
    id: LAYER.perimOutline,
    type: 'line',
    source: SOURCE.perim,
    paint: {
      'line-color': 'rgba(200,164,74,0.90)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1.5, 19, 2.5],
      'line-dasharray': [6, 3],
    },
  });

  // ── BR-424 highway ────────────────────────────────────────────────────────
  map.addLayer({
    id: LAYER.brBg,
    type: 'line',
    source: SOURCE.brLine,
    layout: { 'line-cap': 'round' },
    paint: {
      'line-color': 'rgba(220,160,40,0.80)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 14, 3, 19, 6],
    },
  });
  map.addLayer({
    id: LAYER.brFg,
    type: 'line',
    source: SOURCE.brLine,
    layout: { 'line-cap': 'round' },
    paint: {
      'line-color': 'rgba(255,240,180,0.95)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1.5, 19, 3.5],
    },
  });

  // ── Internal streets ───────────────────────────────────────────────────────
  map.addLayer({
    id: LAYER.streetsBg,
    type: 'line',
    source: SOURCE.streets,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': darkMode ? 'rgba(150,130,90,0.55)' : 'rgba(190,165,115,0.70)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 14, 3, 18, 8, 20, 14],
    },
  });
  map.addLayer({
    id: LAYER.streetsFg,
    type: 'line',
    source: SOURCE.streets,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': darkMode ? 'rgba(220,215,200,0.90)' : 'rgba(255,255,255,0.96)',
      'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1.8, 18, 5.5, 20, 10],
    },
  });

  // ── Lot fills (status-coded) ───────────────────────────────────────────────
  map.addLayer({
    id: LAYER.lotFill,
    type: 'fill',
    source: SOURCE.lots,
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        // Hover: lighter / brighter version
        ['match', ['get', 'status'],
          'DISPONIVEL',   'rgba(52,211,153,0.92)',
          'NEGOCIACAO',   'rgba(251,191,36,0.92)',
          'VENDIDO',      'rgba(156,163,175,0.88)',
          'RESERVADO',    'rgba(167,139,250,0.88)',
          'PROPRIETARIO', 'rgba(96,165,250,0.88)',
          'IGREJA',       'rgba(45,212,191,0.88)',
          'rgba(148,163,184,0.70)',
        ],
        // Normal: status fill
        ['match', ['get', 'status'],
          'DISPONIVEL',   'rgba(34,197,94,0.70)',
          'NEGOCIACAO',   'rgba(245,158,11,0.70)',
          'VENDIDO',      'rgba(107,114,128,0.82)',
          'RESERVADO',    'rgba(139,92,246,0.70)',
          'PROPRIETARIO', 'rgba(59,130,246,0.70)',
          'IGREJA',       'rgba(13,148,136,0.70)',
          'rgba(148,163,184,0.45)',
        ],
      ] as unknown as string,
    },
  });
  map.addLayer({
    id: LAYER.lotOutline,
    type: 'line',
    source: SOURCE.lots,
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#FFFFFF',
        ['match', ['get', 'status'],
          'DISPONIVEL',   '#16A34A',
          'NEGOCIACAO',   '#D97706',
          'VENDIDO',      '#4B5563',
          'RESERVADO',    '#7C3AED',
          'PROPRIETARIO', '#2563EB',
          'IGREJA',       '#0F766E',
          '#64748B',
        ],
      ] as unknown as string,
      'line-width': [
        'interpolate', ['linear'], ['zoom'],
        14, ['case', ['boolean', ['feature-state', 'hover'], false], 1.8, 0.6],
        18, ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 1.2],
        20, ['case', ['boolean', ['feature-state', 'hover'], false], 3, 1.8],
      ] as unknown as number,
    },
  });

  // ── Lot labels ────────────────────────────────────────────────────────────
  map.addLayer({
    id: LAYER.lotLabels,
    type: 'symbol',
    source: SOURCE.lots,
    minzoom: 16.8,
    layout: {
      'text-field': ['get', 'lot_number'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 17, 8, 19, 13, 21, 18],
      'text-font': ['Noto Sans Bold', 'Arial Unicode MS Bold'],
      'text-anchor': 'center',
      'text-allow-overlap': false,
      'text-max-width': 4,
    },
    paint: {
      'text-color': ['match', ['get', 'status'],
        'VENDIDO', 'rgba(255,255,255,0.80)',
        'rgba(15,25,40,0.90)',
      ] as unknown as string,
      'text-halo-color': ['match', ['get', 'status'],
        'VENDIDO', 'rgba(0,0,0,0.40)',
        'rgba(255,255,255,0.80)',
      ] as unknown as string,
      'text-halo-width': 1.2,
    },
  });

  // ── Street labels ─────────────────────────────────────────────────────────
  map.addLayer({
    id: LAYER.streetLabel,
    type: 'symbol',
    source: SOURCE.labels,
    minzoom: 15.5,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 15.5, 8, 17, 11, 20, 14],
      'text-font': ['Noto Sans Bold', 'Arial Unicode MS Bold'],
      'text-rotate': ['get', 'rotation'],
      'text-rotation-alignment': 'map',
      'text-letter-spacing': 0.1,
      'text-allow-overlap': false,
      'text-ignore-placement': false,
    },
    paint: {
      'text-color': darkMode ? 'rgba(210,195,155,0.90)' : 'rgba(80,60,30,0.88)',
      'text-halo-color': darkMode ? 'rgba(10,20,35,0.85)' : 'rgba(255,255,255,0.92)',
      'text-halo-width': 1.5,
    },
  });

  // ── Amenity markers ───────────────────────────────────────────────────────
  map.addLayer({
    id: LAYER.amenityCircle,
    type: 'circle',
    source: SOURCE.amenities,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 5, 18, 10],
      'circle-stroke-color': 'rgba(255,255,255,0.90)',
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.92,
    },
  });
  map.addLayer({
    id: LAYER.amenityLabel,
    type: 'symbol',
    source: SOURCE.amenities,
    minzoom: 15,
    layout: {
      'text-field': ['get', 'label'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 15, 9, 18, 12],
      'text-font': ['Noto Sans Bold', 'Arial Unicode MS Bold'],
      'text-anchor': 'top',
      'text-offset': [0, 1.0],
      'text-allow-overlap': false,
    },
    paint: {
      'text-color': GOLD,
      'text-halo-color': darkMode ? 'rgba(0,10,20,0.90)' : 'rgba(255,255,255,0.90)',
      'text-halo-width': 1.5,
    },
  });

  // ── Green area markers ─────────────────────────────────────────────────────
  map.addLayer({
    id: LAYER.greenCircle,
    type: 'circle',
    source: SOURCE.green,
    paint: {
      'circle-color': 'rgba(46,125,50,0.30)',
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 15, 6, 18, 12],
      'circle-stroke-color': 'rgba(102,187,106,0.80)',
      'circle-stroke-width': 1.5,
    },
  });
  map.addLayer({
    id: LAYER.greenLabel,
    type: 'symbol',
    source: SOURCE.green,
    minzoom: 15.5,
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 9,
      'text-font': ['Noto Sans Bold', 'Arial Unicode MS Bold'],
      'text-anchor': 'top',
      'text-offset': [0, 1.0],
    },
    paint: {
      'text-color': '#66BB6A',
      'text-halo-color': darkMode ? 'rgba(0,10,20,0.90)' : 'rgba(255,255,255,0.90)',
      'text-halo-width': 1.2,
    },
  });
}

// ── Control button ────────────────────────────────────────────────────────────

// Botão de controle. `bare` = sem fundo/borda/sombra próprios, pois fica DENTRO
// de um cluster de vidro único (visual iOS). Tamanho fixo via inline-style para
// não depender do purge do Tailwind — evita os botões "gigantes/bugados".
const CtrlBtn = memo(function CtrlBtn({
  onClick, label, active, children, bare = true,
}: {
  onClick: () => void; label: string; active?: boolean;
  children: React.ReactNode; bare?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className="flex items-center justify-center transition-all active:scale-90 select-none"
      style={{
        width: 38, height: 38, flex: '0 0 38px', borderRadius: 10, padding: 0,
        background: active
          ? 'rgba(200,164,74,0.18)'
          : bare ? 'transparent' : 'rgba(12,22,40,0.88)',
        backdropFilter: bare ? undefined : 'blur(14px)',
        WebkitBackdropFilter: bare ? undefined : 'blur(14px)',
        border: bare ? 'none' : `1.5px solid rgba(200,164,74,0.30)`,
        boxShadow: bare ? 'none' : '0 2px 10px rgba(0,0,0,0.45)',
        color: active ? GOLD : 'rgba(255,255,255,0.88)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
});

// Divisória fina entre grupos de botões dentro do cluster.
const CtrlDivider = () => (
  <div style={{ width: 22, height: 1, background: 'rgba(200,164,74,0.22)', margin: '1px auto' }} />
);

// ── Status legend pill ────────────────────────────────────────────────────────

function StatusLegend({ stats }: { stats: Record<string, number> }) {
  const items = Object.entries(STATUS_COLORS)
    .filter(([k]) => (stats[k] ?? 0) > 0)
    .map(([k, v]) => ({ status: k, ...v, count: stats[k] }));

  return (
    <div
      className="flex flex-wrap gap-1.5"
      style={{
        background: 'rgba(8,20,36,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(200,164,74,0.20)',
        borderRadius: 12,
        padding: '8px 12px',
      }}
    >
      {items.map(item => (
        <div key={item.status} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.fill }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>
            {item.label} · <span style={{ color: 'rgba(255,255,255,0.45)' }}>{item.count}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Lot Detail Panel ──────────────────────────────────────────────────────────

function LotDetailPanel({
  lot, dbLot, whatsappPhone, developmentName, onClose, inCart, onToggleCart,
}: {
  lot: ABLot;
  dbLot?: DBLot;
  whatsappPhone: string;
  developmentName: string;
  onClose: () => void;
  inCart: boolean;
  onToggleCart: (plan?: SelectedPaymentPlan) => void;
}) {
  const status = dbLot?.status || lot.status;
  const price = dbLot?.price ?? lot.price;
  const area = dbLot?.area_m2 ?? lot.area_m2;
  const cfg = STATUS_COLORS[status] ?? { fill: '#94A3B8', stroke: '#64748B', label: 'Indisponível' };
  const isAvailable = status === 'DISPONIVEL';
  const isNeg = status === 'NEGOCIACAO';

  const pricePerM2 = price && area ? price / area : null;
  const dragControls = useDragControls();

  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse no ${developmentName} — Quadra ${lot.quadra}, Lote ${lot.lot_number}${area ? `, área ${Math.round(area)} m²` : ''}${price ? `, valor ${fmtBRL(price)}` : ''}. Gostaria de mais informações.`
  );
  const waWaitlist = encodeURIComponent(
    `Olá! Tenho interesse no ${developmentName}, Quadra ${lot.quadra}, Lote ${lot.lot_number} (${cfg.label}). Pode me avisar se houver disponibilidade?`
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Só monta o grid de planos quando os 4 prazos + à vista estão completos —
  // igual ao card de "Mapa de Lotes" (evita células "R$ 0/mês" p/ dados parciais).
  const hasFullPlans = isAvailable && !!lot.plans && !!lot.valorVista
    && !!lot.plans.p12?.parcela && !!lot.plans.p36?.parcela
    && !!lot.plans.p60?.parcela && !!lot.plans.p120?.parcela;
  const paymentPlans = hasFullPlans ? {
    preco_vista: lot.valorVista as number,
    p12_total: lot.plans!.p12!.total ?? 0, p12_parcela: lot.plans!.p12!.parcela as number,
    p36_total: lot.plans!.p36!.total ?? 0, p36_parcela: lot.plans!.p36!.parcela as number,
    p60_total: lot.plans!.p60!.total ?? 0, p60_parcela: lot.plans!.p60!.parcela as number,
    p120_total: lot.plans!.p120!.total ?? 0, p120_parcela: lot.plans!.p120!.parcela as number,
  } : null;

  // Conteúdo do card — mesmo componente usado em "Mapa de Lotes" (LotDetailContent),
  // garantindo os mesmos campos/estilo aqui em "Lotes + Satélite". Só o wrapper
  // (painel lateral desktop / bottom-sheet mobile) é específico desta vista.
  const cardProps = {
    quadra: lot.quadra,
    lotNumber: lot.lot_number,
    developmentName,
    statusLabel: cfg.label,
    statusBadgeBg: `${cfg.fill}22`,
    statusBadgeText: cfg.fill,
    statusDotColor: cfg.fill,
    isAvailable,
    isNegotiating: isNeg,
    isCorner: dbLot?.special_type === 'ESQUINA',
    areaM2: area,
    price,
    pricePerM2,
    paymentPlans,
    notes: dbLot?.notes ?? null,
    whatsappPhone,
    waInterestText: waMsg,
    waVisitText: waMsg,
    waGeneralText: waWaitlist,
    inCart,
    onToggleCart: isAvailable ? onToggleCart : undefined,
  } as const;

  return (
    <>
      {/* Desktop: side panel */}
      <motion.div
        key="panel-desktop"
        initial={{ x: 340, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 340, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className="hidden sm:flex flex-col absolute top-0 right-0 bottom-0 w-80 z-30 overflow-y-auto"
        style={{ background: '#fff', boxShadow: '-8px 0 40px rgba(0,0,0,0.35)' }}
      >
        <LotDetailContent {...cardProps} onClose={onClose} />
      </motion.div>

      {/* Mobile: bottom sheet — arrastável p/ fechar (iOS-like) */}
      <motion.div
        key="panel-mobile"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 700) onClose();
        }}
        className="sm:hidden fixed bottom-0 left-0 right-0 z-[9999] max-h-[78svh] flex flex-col rounded-t-[24px] overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 -8px 40px rgba(0,0,0,0.35)' }}
      >
        {/* Drag handle — inicia o arrasto p/ fechar (resto da folha rola normal) */}
        <div
          className="flex justify-center pt-3 pb-2 flex-shrink-0 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div style={{ width: 40, height: 5, borderRadius: 3, background: '#E5DDD0' }} />
        </div>
        <div className="overflow-y-auto flex-1">
          <LotDetailContent {...cardProps} onClose={onClose} />
        </div>
      </motion.div>
    </>
  );
}

// ── Amenity Modal ─────────────────────────────────────────────────────────────

function AmenityModal({ amenity, amenityOverrides, onClose }: {
  amenity: Amenity;
  amenityOverrides?: Record<string, unknown>[];
  onClose: () => void;
}) {
  // Merge backoffice override → hardcoded defaults
  const override = amenityOverrides?.find(
    o => o.id === amenity.id || o.id === amenity.id.replace(/-\d+$/, ''),
  );
  const base = AMENITY_INFO[amenity.id] ?? AMENITY_INFO[amenity.id.replace(/-\d+$/, '')] ?? {
    title: amenity.label,
    description: 'Área de uso comum do empreendimento.',
  };
  const title       = ((override?.title       ?? base.title)       as string);
  const description = ((override?.description ?? base.description) as string);
  const features    = ((override?.features    ?? base.features)    as string[] | undefined);
  const photos      = ((override?.photos      ?? amenity.photos)   as string[] | undefined)?.filter(Boolean);
  const video       = ((override?.video       ?? amenity.video)    as string | undefined);
  const videos      = ((override?.videos      ?? amenity.videos)   as string[] | undefined)?.filter(Boolean);
  const tour360     = ((override?.tour360     ?? amenity.tour360)  as string | undefined);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 32, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 32, opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="w-full sm:max-w-md rounded-t-[24px] sm:rounded-[20px] overflow-hidden overflow-y-auto"
        style={{ background: 'rgba(10,22,40,0.98)', border: '1px solid rgba(200,164,74,0.25)', maxHeight: '85svh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Color bar */}
        <div style={{ height: 3, background: amenity.color }} />

        {/* Tour 360° */}
        {tour360 && (
          <div style={{ aspectRatio: '16/9', width: '100%' }}>
            <iframe src={tour360} style={{ width: '100%', height: '100%', border: 0 }} allow="xr-spatial-tracking; gyroscope; accelerometer" allowFullScreen />
          </div>
        )}

        {/* Photo gallery */}
        {photos && photos.length > 0 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 16px 0', scrollbarWidth: 'none' }}>
            {photos.map((src, i) => (
              <img key={i} src={src} alt="" style={{ height: 120, width: 'auto', borderRadius: 10, flexShrink: 0, objectFit: 'cover', display: 'block' }} />
            ))}
          </div>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(200,164,74,0.80)', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0 0 4px' }}>Área Comum</p>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>{title}</h3>
            </div>
            <button onClick={onClose} aria-label="Fechar área comum" className="w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.50)' }}>
              <X size={14} />
            </button>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', lineHeight: 1.6, margin: '0 0 16px' }}>{description}</p>

          {/* Vídeo embed (YouTube/Vimeo) */}
          {video && (
            <div style={{ aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
              <iframe src={video} style={{ width: '100%', height: '100%', border: 0 }} allowFullScreen />
            </div>
          )}

          {/* Vídeos enviados (MP4) */}
          {videos && videos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
              {videos.map((src, i) => (
                <video key={i} src={src} controls preload="metadata" playsInline
                  style={{ width: '100%', borderRadius: 12, background: '#000', display: 'block' }}
                  onError={(e) => { (e.currentTarget as HTMLVideoElement).style.display = 'none'; }}
                />
              ))}
            </div>
          )}

          {features && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {features.map(f => (
                <span key={f} style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.60)', border: '1px solid rgba(255,255,255,0.10)' }}>{f}</span>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Layer toggle panel ────────────────────────────────────────────────────────

const ALL_LAYER_GROUPS = [
  { id: 'lots',      label: 'Lotes',          icon: <MapIcon size={12} /> },
  { id: 'streets',   label: 'Vias',           icon: <Navigation size={12} /> },
  { id: 'perimeter', label: 'Perímetro',      icon: <Shield size={12} /> },
  { id: 'amenities', label: 'Áreas Comuns',   icon: <Building2 size={12} /> },
  { id: 'green',     label: 'Áreas Verdes',   icon: <TreePine size={12} /> },
  { id: 'labels',    label: 'Rótulos',        icon: <Layers size={12} /> },
] as const;

type LayerGroupId = typeof ALL_LAYER_GROUPS[number]['id'];

const LAYER_GROUP_MAP: Record<LayerGroupId, string[]> = {
  lots:      [LAYER.lotFill, LAYER.lotOutline, LAYER.lotLabels],
  streets:   [LAYER.streetsBg, LAYER.streetsFg, LAYER.brBg, LAYER.brFg],
  perimeter: [LAYER.perimFill, LAYER.perimOutline],
  amenities: [LAYER.amenityCircle, LAYER.amenityLabel],
  green:     [LAYER.greenCircle, LAYER.greenLabel],
  labels:    [LAYER.streetLabel, LAYER.amenityLabel, LAYER.greenLabel, LAYER.lotLabels],
};

function LayerPanel({
  visible, active, onToggle, onClose,
}: {
  visible: boolean;
  active: Set<LayerGroupId>;
  onToggle: (id: LayerGroupId) => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-full mr-2 -top-1 z-30 w-44 rounded-xl overflow-hidden"
      style={{
        background: 'rgba(8,20,36,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(200,164,74,0.25)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.60)',
      }}
    >
      <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <span style={{ fontSize: 9, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em' }}>Camadas</span>
        <button onClick={onClose} aria-label="Fechar painel de camadas" style={{ color: 'rgba(255,255,255,0.40)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
      </div>
      {ALL_LAYER_GROUPS.map(group => {
        const on = active.has(group.id);
        return (
          <button
            key={group.id}
            onClick={() => onToggle(group.id)}
            className="w-full flex items-center justify-between px-3 py-2 transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-2" style={{ color: on ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)' }}>
              {group.icon}
              <span style={{ fontSize: 11, fontWeight: 600 }}>{group.label}</span>
            </div>
            <div style={{ width: 28, height: 16, borderRadius: 8, background: on ? GOLD : 'rgba(255,255,255,0.12)', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 2, left: on ? 14 : 2, width: 12, height: 12, borderRadius: 6, background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
            </div>
          </button>
        );
      })}
    </motion.div>
  );
}

// ── Calibration overlay (admin) ────────────────────────────────────────────────
// Alinha os lotes à imagem de satélite real sem precisar de GPS: a equipe ajusta
// rotação/escala/posição e copia o JSON para chumbar em AB_CALIBRATION_DEFAULT
// (src/lib/lots/alto-bellevue-geojson.ts). Só aparece com ?calibrar=1.

function CalibrationOverlay({
  cal, onChange,
}: {
  cal: AbCalibration;
  onChange: (next: Partial<AbCalibration>) => void;
}) {
  const [copied, setCopied] = useState(false);
  const copyJson = () => {
    try {
      const json = JSON.stringify(
        { rotationDeg: round(cal.rotationDeg, 2), scale: round(cal.scale, 4), dLng: round(cal.dLng, 6), dLat: round(cal.dLat, 6) },
        null, 2,
      );
      navigator.clipboard?.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* ignore */ }
  };

  return (
    <div
      className="absolute z-40 left-3 bottom-3 sm:bottom-3 w-[260px] rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(9,20,38,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(200,164,74,0.35)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <SlidersHorizontal size={14} color={GOLD} />
        <span style={{ fontSize: 11, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Calibração</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>admin</span>
      </div>
      <div className="p-4 flex flex-col gap-3">
        <CalRow label="Rotação" value={`${round(cal.rotationDeg, 1)}°`}
          onMinus={() => onChange({ rotationDeg: cal.rotationDeg - 0.5 })}
          onPlus={() => onChange({ rotationDeg: cal.rotationDeg + 0.5 })} />
        <CalRow label="Escala" value={round(cal.scale, 3).toString()}
          onMinus={() => onChange({ scale: Math.max(0.2, cal.scale - 0.01) })}
          onPlus={() => onChange({ scale: cal.scale + 0.01 })} />
        <CalRow label="↔ Leste/Oeste" value={round(cal.dLng * 1000, 2).toString()}
          onMinus={() => onChange({ dLng: cal.dLng - 0.00005 })}
          onPlus={() => onChange({ dLng: cal.dLng + 0.00005 })} />
        <CalRow label="↕ Norte/Sul" value={round(cal.dLat * 1000, 2).toString()}
          onMinus={() => onChange({ dLat: cal.dLat - 0.00005 })}
          onPlus={() => onChange({ dLat: cal.dLat + 0.00005 })} />

        <div className="flex gap-2 mt-1">
          <button onClick={copyJson}
            className="flex items-center justify-center gap-1.5 flex-1"
            style={{ height: 36, borderRadius: 10, background: GOLD, color: NAVY, border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 800 }}>
            {copied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar JSON</>}
          </button>
          <button onClick={() => onChange({ rotationDeg: 0, scale: 1, dLng: 0, dLat: 0 })}
            className="flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer' }}
            aria-label="Resetar calibração">
            <RotateCw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CalRow({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) {
  const btn: React.CSSProperties = {
    width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.07)',
    color: '#fff', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, lineHeight: 1,
  };
  return (
    <div className="flex items-center justify-between">
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{label}</span>
      <div className="flex items-center gap-1.5">
        <button onClick={onMinus} style={btn} aria-label={`${label} menos`}>−</button>
        <span style={{ minWidth: 46, textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
        <button onClick={onPlus} style={btn} aria-label={`${label} mais`}>+</button>
      </div>
    </div>
  );
}

function round(n: number, d: number): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

// ── Main component ────────────────────────────────────────────────────────────

const AB_DEV_ID = 'ab7d1fc1-f069-4e3b-a515-8e1204c11247';

export default function AltoBellevueGeoMap({
  developmentId, developmentName, whatsappPhone = WA, height = '100svh', mapAmenities, cart: cartProp,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hoveredIdRef = useRef<string | null>(null);

  // Supabase lots
  const [dbLots, setDbLots] = useState<DBLot[]>([]);
  const [lotsLoading, setLotsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('subdivision_lots')
      .select('id,quadra,lot_number,area_m2,price,status,special_type,notes')
      .eq('development_id', developmentId)
      .order('quadra')
      .order('lot_number')
      .then(
        ({ data }) => {
          if (data) setDbLots(data.map(l => ({ ...l, area_m2: Number(l.area_m2) || 0 })) as DBLot[]);
          setLotsLoading(false);
        },
        () => setLotsLoading(false),
      );
  }, [developmentId]);

  // Map data from JSON
  const [mapData, setMapData] = useState<ABMapData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // AB availability
  const isAB = developmentId === AB_DEV_ID;
  const liveAvail    = useAbAvailability(isAB);
  const canonStatus  = useAbCanonicalStatuses(isAB);

  // Merge DB status into DB lots
  const mergedDbLots = useMemo<DBLot[]>(() => {
    if (!isAB) return dbLots;
    return dbLots.map(l => {
      const id = `${l.quadra}-${String(l.lot_number).padStart(2, '0')}`;
      const status = resolveLotStatus(id, l.status, canonStatus, liveAvail);
      return status === l.status ? l : { ...l, status };
    });
  }, [dbLots, isAB, canonStatus, liveAvail]);

  // UI state
  const [darkMode, setDarkMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<ABLot | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<LayerGroupId>>(
    new Set(['lots', 'streets', 'perimeter', 'amenities', 'green', 'labels'])
  );
  // Ref espelho para reaplicar a visibilidade quando o mapa remonta (toggle
  // claro/escuro) — sem ele, as camadas voltavam todas visíveis com o painel
  // de camadas ainda marcando "off" (estado dessincronizado).
  const activeLayersRef = useRef(activeLayers);
  useEffect(() => { activeLayersRef.current = activeLayers; }, [activeLayers]);

  // ── Carrinho de lotes / proposta (compartilhado com a vista "Plano") ───────
  const devSlug = 'alto-bellevue';
  const fallbackCart = useLotCart<CartLot>(devSlug);
  const cart = cartProp ?? fallbackCart;
  const [showCart, setShowCart] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const cartT = useMemo(() => cartTotals(cart.items), [cart.items]);

  // Hidrata a calibração de georreferenciamento persistida (best-effort).
  useEffect(() => { hydrateAbCalibration(); }, []);

  // Modo calibração (admin): ativado por ?calibrar=1 na URL.
  const [calibrateMode, setCalibrateMode] = useState(false);
  const [calibration, setCalibrationState] = useState<AbCalibration>(getAbCalibration);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const on = new URLSearchParams(window.location.search).get('calibrar') === '1';
    setCalibrateMode(on);
    setCalibrationState(getAbCalibration());
  }, []);

  const toCart = useCallback((lot: ABLot, dbLot?: DBLot, plan?: SelectedPaymentPlan): CartLot => ({
    id: lot.id,
    developmentSlug: devSlug,
    developmentName,
    block: lot.quadra,
    lot: String(lot.lot_number),
    areaM2: dbLot?.area_m2 ?? lot.area_m2 ?? 0,
    price: dbLot?.price ?? lot.price ?? 0,
    status: dbLot?.status ?? lot.status,
    selectedPlan: plan,
  }), [developmentName]);

  const copyShareLink = useCallback(() => {
    try {
      const url = buildCartShareUrl(typeof window !== 'undefined' ? window.location.origin : '', {
        d: devSlug, ids: cart.items.map((l) => l.id),
      });
      navigator.clipboard?.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1800);
    } catch { /* clipboard indisponível */ }
  }, [cart.items]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of mergedDbLots) counts[l.status] = (counts[l.status] ?? 0) + 1;
    return counts;
  }, [mergedDbLots]);

  const selectedDbLot = useMemo(
    () => selectedLot ? mergedDbLots.find(l => `${l.quadra}-${String(l.lot_number).padStart(2, '0')}` === selectedLot.id) : undefined,
    [selectedLot, mergedDbLots]
  );

  // Load canonical map data
  useEffect(() => {
    setDataLoading(true);
    setDataError(null);
    loadAltoBellevueMap({})
      .then(d => { setMapData(d); setDataLoading(false); })
      .catch(() => { setDataError('Não foi possível carregar o mapa.'); setDataLoading(false); });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || !mapData || dataLoading || lotsLoading) return;
    let cancelled = false;
    let mapInst: MapLibreMap | null = null;

    initMap(containerRef.current, darkMode, (map, ml) => {
      if (cancelled) { map.remove(); return; }
      mapInst = map;

      addABLayers(map, mapData, mergedDbLots, darkMode);

      // Reaplica a visibilidade escolhida pelo usuário (sobrevive ao remount).
      for (const group of ALL_LAYER_GROUPS) {
        if (activeLayersRef.current.has(group.id)) continue;
        for (const layerId of LAYER_GROUP_MAP[group.id]) {
          if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', 'none');
        }
      }

      // Abre já enquadrado no empreendimento inteiro (todas as telas).
      fitMapToDev(map, mapData, 0);

      // Hover interaction
      map.on('mousemove', LAYER.lotFill, (e) => {
        if (!e.features?.length) return;
        const id = e.features[0].id as string;
        if (hoveredIdRef.current === id) return;
        if (hoveredIdRef.current) {
          map.setFeatureState({ source: SOURCE.lots, id: hoveredIdRef.current }, { hover: false });
        }
        hoveredIdRef.current = id;
        map.setFeatureState({ source: SOURCE.lots, id }, { hover: true });
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', LAYER.lotFill, () => {
        if (hoveredIdRef.current) {
          map.setFeatureState({ source: SOURCE.lots, id: hoveredIdRef.current }, { hover: false });
          hoveredIdRef.current = null;
        }
        map.getCanvas().style.cursor = '';
      });

      // Lot click
      map.on('click', LAYER.lotFill, (e) => {
        if (!e.features?.length) return;
        const lotId = e.features[0].properties?.id as string;
        const lot = mapData.lots.find(l => l.id === lotId);
        if (lot) setSelectedLot(lot);
      });

      // Amenity click
      map.on('click', LAYER.amenityCircle, (e) => {
        if (!e.features?.length) return;
        const aid = e.features[0].properties?.id as string;
        const amenity = mapData.amenities.find(a => a.id === aid);
        if (amenity) setSelectedAmenity(amenity);
      });

      map.on('mouseenter', LAYER.amenityCircle, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', LAYER.amenityCircle, () => { map.getCanvas().style.cursor = ''; });

      // Click on blank area deselects lot
      map.on('click', (e) => {
        const fs = map.queryRenderedFeatures(e.point, { layers: [LAYER.lotFill, LAYER.amenityCircle] });
        if (!fs.length) { setSelectedLot(null); setSelectedAmenity(null); }
      });

      setMapReady(true);
      mapRef.current = map;
    }).then((map) => {
      // Captura a instância assim que criada (antes do evento 'load') — sem
      // isso, desmontar durante o carregamento do estilo vazava o mapa/WebGL.
      if (cancelled) { map.remove(); return; }
      mapInst = map;
    }).catch(() => {
      // Falha ao carregar o engine (import dinâmico do maplibre-gl offline/CDN)
      // — sem isso o overlay de loading giraria para sempre.
      if (!cancelled) setDataError('Não foi possível carregar o mapa.');
    });

    return () => {
      cancelled = true;
      if (mapInst) { mapInst.remove(); mapInst = null; }
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData, darkMode, dataLoading, lotsLoading]);

  // Keep DB lots in sync with map source (status updates without remount)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !mapData) return;
    const dbMap = new Map(mergedDbLots.map(l => [`${l.quadra}-${String(l.lot_number).padStart(2, '0')}`, l]));
    const merged = mapData.lots.map(lot => {
      const db = dbMap.get(lot.id);
      return db ? { ...lot, status: db.status || lot.status, price: db.price ?? lot.price } : lot;
    });
    const src = map.getSource(SOURCE.lots) as import('maplibre-gl').GeoJSONSource | undefined;
    src?.setData(lotsToGeoJSON(merged));
  }, [mergedDbLots, mapReady, mapData]);

  // Recalcula TODAS as fontes GeoJSON (usado pelo modo calibração, que altera a
  // transformação SVG→WGS84 em tempo real). Reusa os builders canônicos.
  const refreshAllGeo = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !mapData) return;
    type GJ = import('maplibre-gl').GeoJSONSource;
    const dbMap = new Map(mergedDbLots.map(l => [`${l.quadra}-${String(l.lot_number).padStart(2, '0')}`, l]));
    const merged = mapData.lots.map(lot => {
      const db = dbMap.get(lot.id);
      return db ? { ...lot, status: db.status || lot.status, price: db.price ?? lot.price } : lot;
    });
    (map.getSource(SOURCE.lots) as GJ | undefined)?.setData(lotsToGeoJSON(merged));
    (map.getSource(SOURCE.streets) as GJ | undefined)?.setData(streetsToGeoJSON(mapData.streets));
    (map.getSource(SOURCE.perim) as GJ | undefined)?.setData(perimeterToGeoJSON(mapData.perimeter));
    (map.getSource(SOURCE.brLine) as GJ | undefined)?.setData(brLineToGeoJSON(mapData.brLine));
    (map.getSource(SOURCE.amenities) as GJ | undefined)?.setData(amenitiesToGeoJSON(mapData.amenities));
    (map.getSource(SOURCE.green) as GJ | undefined)?.setData(greenAreasToGeoJSON(mapData.greenAreas ?? []));
    (map.getSource(SOURCE.labels) as GJ | undefined)?.setData(streetLabelsToGeoJSON(mapData.streetLabels ?? []));
  }, [mapReady, mapData, mergedDbLots]);

  // Aplica a calibração ao vivo: atualiza o transform, persiste e redesenha.
  const applyCalibration = useCallback((next: Partial<AbCalibration>) => {
    const cal = setAbCalibration(next);
    setCalibrationState({ ...cal });
    try { window.localStorage.setItem(AB_CALIBRATION_KEY, JSON.stringify(cal)); } catch { /* ignore */ }
    refreshAllGeo();
  }, [refreshAllGeo]);

  // Toggle layer visibility
  const toggleLayer = useCallback((groupId: LayerGroupId) => {
    const map = mapRef.current;
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      const vis = next.has(groupId) ? 'visible' : 'none';
      if (map && mapReady) {
        for (const layerId of LAYER_GROUP_MAP[groupId]) {
          if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', vis);
        }
      }
      return next;
    });
  }, [mapReady]);

  // Map controls
  const zoomIn  = useCallback(() => mapRef.current?.zoomIn({ duration: 300 }), []);
  const zoomOut = useCallback(() => mapRef.current?.zoomOut({ duration: 300 }), []);
  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.resetNorthPitch({ duration: 0 });
    if (mapData) fitMapToDev(map, mapData, 700);
    else map.flyTo({ center: [AB_GEO_CONFIG.centerLng, AB_GEO_CONFIG.centerLat], zoom: AB_GEO_CONFIG.initialZoom, duration: 700 });
  }, [mapData]);

  // Reenquadra ao girar/redimensionar a tela quando nada está selecionado —
  // mantém o empreendimento inteiro visível (comportamento app/iOS).
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const map = mapRef.current;
        if (map && mapReady && mapData && !selectedLot && !selectedAmenity) {
          fitMapToDev(map, mapData, 250);
        }
      }, 200);
    };
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, [mapReady, mapData, selectedLot, selectedAmenity]);

  // O estado vem só do evento 'fullscreenchange' — setar otimista aqui deixava
  // o botão preso em "Minimizar" no iPhone (Safari iOS não tem requestFullscreen).
  // Tela cheia no CONTAINER do mapa (rootRef), não em document.documentElement —
  // senão o botão coloca a página inteira em tela cheia em vez de só o mapa.
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      rootRef.current?.requestFullscreen?.()?.catch(() => {});
    } else {
      document.exitFullscreen?.()?.catch(() => {});
    }
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const availCount = mergedDbLots.filter(l => l.status === 'DISPONIVEL').length;

  return (
    <div ref={rootRef} className="relative w-full" style={{ height, background: NAVY }}>
      {/* Map container */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ zIndex: 0 }}
      />

      {/* Loading overlay */}
      <AnimatePresence>
        {(dataLoading || lotsLoading || !mapReady) && !dataError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            style={{ background: NAVY }}
          >
            <div className="w-10 h-10 rounded-full border-2 border-transparent animate-spin mb-4"
              style={{ borderTopColor: GOLD, borderRightColor: GOLD }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,164,74,0.70)', textTransform: 'uppercase', letterSpacing: '0.25em', fontFamily: "'Outfit', sans-serif" }}>
              Carregando sistema geoespacial
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error overlay */}
      {dataError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20" style={{ background: NAVY }}>
          <AlertCircle size={32} style={{ color: GOLD, marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.60)', marginBottom: 16 }}>{dataError}</p>
          <button onClick={() => { setDataError(null); setDataLoading(true); loadAltoBellevueMap({}).then(d => { setMapData(d); setDataLoading(false); }).catch(() => setDataError('Erro ao carregar mapa.')); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: GOLD, color: NAVY }}>
            <RefreshCw size={13} /> Tentar novamente
          </button>
        </div>
      )}

      {/* ── Top bar: marca à esquerda (largura própria, sem colidir) ──────── */}
      <div className="absolute top-3 left-3 z-20 flex items-center pointer-events-none" style={{ maxWidth: 'calc(100% - 76px)' }}>
        <div style={{
          background: 'rgba(8,20,36,0.90)', backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)', border: '1px solid rgba(200,164,74,0.30)',
          borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10,
          minWidth: 0, maxWidth: '100%',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: GOLD, flexShrink: 0, boxShadow: `0 0 8px ${GOLD}` }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: "'Outfit', sans-serif" }}>
            Alto Bellevue
          </span>
          <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(34,197,94,0.90)', whiteSpace: 'nowrap', flexShrink: 0, fontFamily: "'JetBrains Mono', monospace" }}>
            {availCount} <span className="hidden sm:inline">disponíveis</span>
          </span>
        </div>
      </div>

      {/* ── Toolbar única (canto superior direito) — cluster de vidro iOS ──── */}
      <div className="absolute right-3 top-3 z-20 flex flex-col items-end">
        <div
          className="flex flex-col items-center gap-1"
          style={{
            background: 'rgba(8,20,36,0.82)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(200,164,74,0.28)',
            borderRadius: 14, padding: 4,
            boxShadow: '0 6px 22px rgba(0,0,0,0.42)',
          }}
        >
          <CtrlBtn onClick={() => setDarkMode(d => !d)} label={darkMode ? 'Modo claro' : 'Modo escuro'}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </CtrlBtn>
          <CtrlBtn onClick={toggleFullscreen} label={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </CtrlBtn>

          <CtrlDivider />

          {/* Zoom disponível em todas as telas (toque + desktop) */}
          <CtrlBtn onClick={zoomIn}  label="Aproximar"><ZoomIn  size={16} /></CtrlBtn>
          <CtrlBtn onClick={zoomOut} label="Afastar"><ZoomOut size={16} /></CtrlBtn>
          <CtrlBtn onClick={resetView} label="Enquadrar empreendimento"><RotateCcw size={15} /></CtrlBtn>

          <CtrlDivider />

          <div className="relative">
            <CtrlBtn onClick={() => setShowLayerPanel(p => !p)} label="Camadas" active={showLayerPanel}>
              <Layers size={16} />
            </CtrlBtn>
            <AnimatePresence>
              {showLayerPanel && (
                <LayerPanel
                  visible={showLayerPanel}
                  active={activeLayers}
                  onToggle={toggleLayer}
                  onClose={() => setShowLayerPanel(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Status legend (bottom-left) ──────────────────────────────────── */}
      <div className="absolute bottom-6 left-3 z-20 hidden sm:block">
        <StatusLegend stats={stats} />
      </div>

      {/* ── Lot detail panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedLot && !selectedAmenity && (
          <LotDetailPanel
            key={selectedLot.id}
            lot={selectedLot}
            dbLot={selectedDbLot}
            whatsappPhone={whatsappPhone}
            developmentName={developmentName}
            onClose={() => setSelectedLot(null)}
            inCart={cart.has(selectedLot.id)}
            onToggleCart={(plan) => cart.toggle(toCart(selectedLot, selectedDbLot, plan))}
          />
        )}
      </AnimatePresence>

      {/* ── Amenity modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedAmenity && (
          <AmenityModal
            key={selectedAmenity.id}
            amenity={selectedAmenity}
            amenityOverrides={mapAmenities}
            onClose={() => setSelectedAmenity(null)}
          />
        )}
      </AnimatePresence>

      {/* ── Botão flutuante "Proposta" (carrinho) ─────────────────────────── */}
      {/* Quando `cartProp` é fornecida, o pai (AltoBellevueMapExplorer) já
          renderiza um único FAB/Sheet/Modal visível nas 4 opções do menu —
          evita duplicar a UI de carrinho aqui (padrão P9). */}
      {!cartProp && cart.items.length > 0 && !showCart && !showProposal && !selectedLot && !selectedAmenity && (
        <CartFab count={cart.items.length} onClick={() => setShowCart(true)} />
      )}

      {/* ── Painel do carrinho / proposta ─────────────────────────────────── */}
      <AnimatePresence>
        {!cartProp && showCart && (
          <CartSheet
            items={cart.items}
            totals={cartT}
            linkCopied={linkCopied}
            onRemove={cart.remove}
            onClear={cart.clear}
            onCopyLink={copyShareLink}
            onProposal={() => { setShowCart(false); setShowProposal(true); }}
            onClose={() => setShowCart(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Modal de proposta (cliente preenche) ──────────────────────────── */}
      <AnimatePresence>
        {!cartProp && showProposal && cart.items.length > 0 && (
          <ProposalFormModal
            developmentId={developmentId}
            developmentName={developmentName}
            developmentSlug={devSlug}
            whatsappPhone={whatsappPhone}
            items={cart.items}
            onClose={() => setShowProposal(false)}
            onSubmitted={() => { cart.clear(); setShowProposal(false); }}
          />
        )}
      </AnimatePresence>

      {/* ── Overlay de calibração (admin · ?calibrar=1) ───────────────────── */}
      {calibrateMode && (
        <CalibrationOverlay cal={calibration} onChange={applyCalibration} />
      )}

      {/* Mobile legend (compact) */}
      <div className="absolute bottom-0 left-0 right-0 z-20 sm:hidden flex gap-2 overflow-x-auto px-3 pb-3 pt-1"
        style={{ scrollbarWidth: 'none' }}>
        {Object.entries(STATUS_COLORS)
          .filter(([k]) => (stats[k] ?? 0) > 0)
          .map(([k, v]) => (
            <div key={k} className="flex items-center gap-1 flex-shrink-0 rounded-full px-2.5 py-1"
              style={{ background: 'rgba(8,20,36,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: v.fill, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.70)', whiteSpace: 'nowrap' }}>
                {v.label} {stats[k]}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
