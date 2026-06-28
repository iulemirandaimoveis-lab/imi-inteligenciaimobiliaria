'use client';

import React, {
  useRef, useState, useCallback, useEffect, useMemo, memo,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, ZoomIn, ZoomOut, RotateCcw, MessageCircle, Layers,
  Sun, Moon, Maximize2, Minimize2, Navigation,
  TreePine, Building2, Map as MapIcon, RefreshCw, AlertCircle,
  Shield, ShoppingCart, Trash2, Check, Link2, FileText,
  SlidersHorizontal, Copy, RotateCw,
} from 'lucide-react';
import { useLotCart } from '@/hooks/useLotCart';
import { cartTotals, buildCartShareUrl, type CartLot } from '@/lib/lotmap/cart';
import ProposalFormModal from './ProposalFormModal';
import { loadAltoBellevueMap } from '@/lib/lots/alto-bellevue';
import { useAbAvailability, useAbCanonicalStatuses } from '@/hooks/use-ab-availability';
import { resolveLotStatus } from '@/lib/lots/alto-bellevue-availability';
import {
  lotsToGeoJSON, streetsToGeoJSON, perimeterToGeoJSON,
  brLineToGeoJSON, amenitiesToGeoJSON, greenAreasToGeoJSON,
  streetLabelsToGeoJSON, AB_GEO_CONFIG, STATUS_COLORS,
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
const fmtM2 = (v: number) => `${Math.round(v).toLocaleString('pt-BR')} m²`;

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
    maxzoom: 18.5,
    layout: {
      'text-field': ['get', 'name'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 15.5, 8, 17, 11],
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

const CtrlBtn = memo(function CtrlBtn({
  onClick, label, active, children, variant = 'default',
}: {
  onClick: () => void; label: string; active?: boolean;
  children: React.ReactNode; variant?: 'default' | 'gold' | 'danger';
}) {
  const bg = active
    ? 'rgba(200,164,74,0.20)'
    : variant === 'gold'
    ? 'rgba(200,164,74,0.90)'
    : 'rgba(12,22,40,0.88)';
  const border = active
    ? 'rgba(200,164,74,0.90)'
    : variant === 'gold'
    ? 'transparent'
    : 'rgba(200,164,74,0.30)';
  const color = active ? GOLD : variant === 'gold' ? NAVY : 'rgba(255,255,255,0.85)';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className="flex items-center justify-center transition-all active:scale-90 select-none"
      style={{
        // Tamanho via inline-style (não depende de purge do Tailwind) — evita
        // os botões "gigantes/bugados" relatados no mobile.
        width: 40, height: 40, flex: '0 0 40px', borderRadius: 12, padding: 0,
        background: bg, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        border: `1.5px solid ${border}`,
        boxShadow: '0 2px 10px rgba(0,0,0,0.45)',
        color, cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
});

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
  onToggleCart: () => void;
}) {
  const status = dbLot?.status || lot.status;
  const price = dbLot?.price ?? lot.price;
  const area = dbLot?.area_m2 ?? lot.area_m2;
  const cfg = STATUS_COLORS[status] ?? { fill: '#94A3B8', stroke: '#64748B', label: 'Indisponível' };
  const isAvailable = status === 'DISPONIVEL';
  const isNeg = status === 'NEGOCIACAO';

  const pricePerM2 = price && area ? price / area : null;

  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse no ${developmentName} — Quadra ${lot.quadra}, Lote ${lot.lot_number}${area ? `, área ${Math.round(area)} m²` : ''}${price ? `, valor ${fmtBRL(price)}` : ''}. Gostaria de mais informações.`
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

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
        style={{
          background: 'rgba(8,20,36,0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderLeft: '1px solid rgba(200,164,74,0.20)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.60)',
        }}
      >
        {/* Status accent bar */}
        <div style={{ height: 3, background: cfg.fill, flexShrink: 0 }} />

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[9px] font-bold uppercase tracking-[0.2em] px-2.5 py-1 rounded-full"
                style={{ background: `${cfg.fill}22`, color: cfg.fill, border: `1px solid ${cfg.fill}44` }}
              >
                {cfg.label}
              </span>
              {dbLot?.special_type === 'ESQUINA' && (
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-1 rounded-full"
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.30)' }}>
                  Esquina
                </span>
              )}
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              Quadra {lot.quadra}
            </h3>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
              Lote {lot.lot_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.50)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 px-5 pb-4">
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>Área</p>
            <p style={{ fontSize: 19, fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
              {area ? fmtM2(area) : '—'}
            </p>
          </div>
          <div style={{ background: isAvailable ? 'rgba(200,164,74,0.12)' : 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 14px', border: `1px solid ${isAvailable ? 'rgba(200,164,74,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: isAvailable ? GOLD : 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 6px', fontFamily: "'Outfit', sans-serif" }}>Valor</p>
            <p style={{ fontSize: price && price >= 200000 ? 14 : 18, fontWeight: 800, color: isAvailable ? GOLD : 'rgba(255,255,255,0.80)', margin: 0, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
              {price ? fmtBRL(price) : 'Consultar'}
            </p>
          </div>
        </div>

        {/* Price per m² */}
        {pricePerM2 && (
          <div className="px-5 pb-3">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>Preço por m²</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.80)', fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtBRL(pricePerM2)}/m²
              </span>
            </div>
          </div>
        )}

        {/* Payment plans */}
        {isAvailable && lot.plans && (
          <div className="px-5 pb-4">
            <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 10px', fontFamily: "'Outfit', sans-serif" }}>Formas de Pagamento</p>
            <div className="grid grid-cols-2 gap-2">
              {lot.valorVista && (
                <div style={{ background: 'rgba(200,164,74,0.10)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(200,164,74,0.25)', gridColumn: '1 / -1' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>À Vista · 20% desconto</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: GOLD, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{fmtBRL(lot.valorVista)}</p>
                </div>
              )}
              {[
                { label: '12×', plan: lot.plans.p12 },
                { label: '36×', plan: lot.plans.p36 },
                { label: '60×', plan: lot.plans.p60 },
                { label: '120×', plan: lot.plans.p120 },
              ].filter(p => p.plan?.parcela).map(({ label, plan }) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 3px', fontFamily: "'Outfit', sans-serif" }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.85)', margin: 0, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{fmtBRL(plan!.parcela!)}/mês</p>
                  {plan!.total && <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0' }}>Total {fmtBRL(plan!.total)}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {dbLot?.notes && (
          <div className="px-5 pb-3">
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px', margin: 0, lineHeight: 1.5 }}>
              {dbLot.notes}
            </p>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA */}
        <div className="p-5 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {isAvailable && (
            <button
              onClick={onToggleCart}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all active:scale-95"
              style={{
                background: inCart ? 'rgba(34,197,94,0.14)' : 'rgba(200,164,74,0.12)',
                color: inCart ? '#34D399' : GOLD,
                border: `1px solid ${inCart ? 'rgba(52,211,153,0.4)' : 'rgba(200,164,74,0.35)'}`,
                cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
              }}
            >
              {inCart ? <><Check size={15} /> Na proposta</> : <><ShoppingCart size={14} /> Adicionar à proposta</>}
            </button>
          )}
          {(isAvailable || isNeg) ? (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${waMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all hover:opacity-90 active:scale-95"
              style={{ background: GOLD, color: NAVY, textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
            >
              <MessageCircle size={14} />
              Tenho Interesse
            </a>
          ) : (
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Olá! Tenho interesse no ${developmentName}, Quadra ${lot.quadra}, Lote ${lot.lot_number} (${cfg.label}). Pode me avisar se houver disponibilidade?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full h-11 rounded-xl text-[12px] font-bold uppercase tracking-wider transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none', fontFamily: "'Outfit', sans-serif" }}
            >
              <MessageCircle size={14} />
              Entrar em lista de espera
            </a>
          )}
        </div>
      </motion.div>

      {/* Mobile: bottom sheet */}
      <motion.div
        key="panel-mobile"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 max-h-[70svh] flex flex-col rounded-t-[24px] overflow-hidden"
        style={{
          background: 'rgba(8,20,36,0.97)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.60)',
          borderTop: `3px solid ${cfg.fill}`,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        {/* Close */}
        <div className="absolute top-3 right-4">
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)' }}>
            <X size={13} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="px-5 pt-2 pb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full"
                style={{ background: `${cfg.fill}22`, color: cfg.fill, border: `1px solid ${cfg.fill}44` }}>
                {cfg.label}
              </span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'Outfit', sans-serif" }}>
              Quadra {lot.quadra} — Lote {lot.lot_number}
            </h3>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 px-5 pb-3">
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>Área</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: '#fff', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{area ? fmtM2(area) : '—'}</p>
            </div>
            <div style={{ background: isAvailable ? 'rgba(200,164,74,0.12)' : 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px', border: isAvailable ? '1px solid rgba(200,164,74,0.30)' : 'none' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: isAvailable ? GOLD : 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 4px' }}>Valor</p>
              <p style={{ fontSize: price && price >= 200000 ? 13 : 17, fontWeight: 800, color: isAvailable ? GOLD : '#fff', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{price ? fmtBRL(price) : 'Consultar'}</p>
            </div>
          </div>

          {/* Installment highlight */}
          {isAvailable && lot.plans?.p120?.parcela && (
            <div className="px-5 pb-3">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.40)', fontWeight: 600 }}>120× a partir de</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.80)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtBRL(lot.plans.p120.parcela!)}/mês
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-5 py-4 flex flex-col gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          {isAvailable && (
            <button
              onClick={onToggleCart}
              className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl text-[13px] font-bold uppercase tracking-wider active:scale-95"
              style={{
                background: inCart ? 'rgba(34,197,94,0.14)' : 'rgba(200,164,74,0.12)',
                color: inCart ? '#34D399' : GOLD,
                border: `1px solid ${inCart ? 'rgba(52,211,153,0.4)' : 'rgba(200,164,74,0.35)'}`,
                cursor: 'pointer', fontFamily: "'Outfit', sans-serif",
              }}
            >
              {inCart ? <><Check size={16} /> Na proposta</> : <><ShoppingCart size={15} /> Adicionar à proposta</>}
            </button>
          )}
          <a
            href={`https://wa.me/${whatsappPhone}?text=${waMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl text-[13px] font-bold uppercase tracking-wider"
            style={{ background: isAvailable ? GOLD : 'rgba(255,255,255,0.08)', color: isAvailable ? NAVY : 'rgba(255,255,255,0.70)', textDecoration: 'none', border: isAvailable ? 'none' : '1px solid rgba(255,255,255,0.15)', fontFamily: "'Outfit', sans-serif" }}
          >
            <MessageCircle size={15} />
            {isAvailable ? 'Tenho Interesse' : 'Falar sobre este lote'}
          </a>
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
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
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.50)' }}>
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
      className="absolute top-16 right-3 z-30 w-44 rounded-xl overflow-hidden"
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
        <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.40)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={12} /></button>
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

// ── Cart sheet (proposta multi-lote) ───────────────────────────────────────────

function CartSheet({
  items, totals, linkCopied, onRemove, onClear, onCopyLink, onProposal, onClose,
}: {
  items: CartLot[];
  totals: ReturnType<typeof cartTotals>;
  linkCopied: boolean;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCopyLink: () => void;
  onProposal: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      {/* Scrim */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%', opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
        className="absolute z-40 left-0 right-0 bottom-0 sm:left-auto sm:right-4 sm:bottom-4 sm:w-[380px] rounded-t-[24px] sm:rounded-[20px] flex flex-col overflow-hidden"
        style={{
          background: 'rgba(9,20,38,0.98)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(200,164,74,0.25)', boxShadow: '0 -8px 40px rgba(0,0,0,0.6)', maxHeight: '80svh',
        }}
      >
        <div style={{ height: 3, background: GOLD, flexShrink: 0 }} />
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} color={GOLD} />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', fontFamily: "'Outfit', sans-serif" }}>
              Sua proposta
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
              {items.length} {items.length === 1 ? 'lote' : 'lotes'}
            </span>
          </div>
          <button onClick={onClose} aria-label="Fechar"
            className="flex items-center justify-center"
            style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer' }}>
            <X size={15} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 flex-1" style={{ scrollbarWidth: 'thin' }}>
          {items.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Quadra {l.block} · Lote {l.lot}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtM2(l.areaM2)} · {fmtBRL(l.price)}
                </p>
              </div>
              <button onClick={() => onRemove(l.id)} aria-label="Remover lote"
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(239,68,68,0.10)', color: '#F87171', border: 'none', cursor: 'pointer' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Totais + ações */}
        <div className="px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Área total</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontFamily: "'JetBrains Mono', monospace" }}>{fmtM2(totals.totalArea)}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Valor total</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: GOLD, fontFamily: "'JetBrains Mono', monospace" }}>{fmtBRL(totals.totalPrice)}</span>
          </div>
          <button
            onClick={onProposal}
            className="flex items-center justify-center gap-2 w-full mb-2"
            style={{ height: 48, borderRadius: 13, border: 'none', background: GOLD, color: NAVY, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}
          >
            <FileText size={16} /> Preencher proposta
          </button>
          <div className="flex gap-2">
            <button onClick={onCopyLink}
              className="flex items-center justify-center gap-2 flex-1"
              style={{ height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
              {linkCopied ? <><Check size={14} color="#34D399" /> Copiado</> : <><Link2 size={14} /> Copiar link</>}
            </button>
            <button onClick={onClear}
              className="flex items-center justify-center"
              style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}
              aria-label="Limpar proposta">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
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
  developmentId, developmentName, whatsappPhone = WA, height = '100svh', mapAmenities,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
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
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [darkMode, setDarkMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<ABLot | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [activeLayers, setActiveLayers] = useState<Set<LayerGroupId>>(
    new Set(['lots', 'streets', 'perimeter', 'amenities', 'green', 'labels'])
  );

  // ── Carrinho de lotes / proposta (compartilhado com a vista "Plano") ───────
  const devSlug = 'alto-bellevue';
  const cart = useLotCart<CartLot>(devSlug);
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

  const toCart = useCallback((lot: ABLot, dbLot?: DBLot): CartLot => ({
    id: lot.id,
    developmentSlug: devSlug,
    developmentName,
    block: lot.quadra,
    lot: String(lot.lot_number),
    areaM2: dbLot?.area_m2 ?? lot.area_m2 ?? 0,
    price: dbLot?.price ?? lot.price ?? 0,
    status: dbLot?.status ?? lot.status,
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
    mapRef.current?.flyTo({
      center: [AB_GEO_CONFIG.centerLng, AB_GEO_CONFIG.centerLat],
      zoom: AB_GEO_CONFIG.initialZoom,
      bearing: 0,
      pitch: 0,
      duration: 800,
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  const availCount = mergedDbLots.filter(l => l.status === 'DISPONIVEL').length;

  return (
    <div className="relative w-full" style={{ height, background: NAVY }}>
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

      {/* ── Toolbar única (canto superior direito) — visual de app ────────── */}
      <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 items-end">
        <CtrlBtn onClick={() => setDarkMode(d => !d)} label={darkMode ? 'Modo claro' : 'Modo escuro'}>
          {darkMode ? <Sun size={15} /> : <Moon size={15} />}
        </CtrlBtn>
        <CtrlBtn onClick={toggleFullscreen} label={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}>
          {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </CtrlBtn>

        <div style={{ width: 28, height: 1, background: 'rgba(200,164,74,0.25)', margin: '1px 6px' }} />

        {!isMobile && <CtrlBtn onClick={zoomIn}  label="Aproximar"><ZoomIn  size={15} /></CtrlBtn>}
        {!isMobile && <CtrlBtn onClick={zoomOut} label="Afastar">  <ZoomOut size={15} /></CtrlBtn>}
        <CtrlBtn onClick={resetView} label="Resetar visão"><RotateCcw size={14} /></CtrlBtn>

        <div className="relative">
          <CtrlBtn onClick={() => setShowLayerPanel(p => !p)} label="Camadas" active={showLayerPanel}>
            <Layers size={15} />
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
            onToggleCart={() => cart.toggle(toCart(selectedLot, selectedDbLot))}
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
      {cart.items.length > 0 && !showCart && !showProposal && !selectedLot && !selectedAmenity && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={() => setShowCart(true)}
          className="absolute z-30 flex items-center gap-2 right-3 bottom-16 sm:bottom-6"
          style={{
            height: 48, padding: '0 16px 0 14px', borderRadius: 24, border: 'none',
            background: GOLD, color: NAVY, boxShadow: '0 8px 28px rgba(200,164,74,0.45)',
            cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 13.5,
          }}
          aria-label="Abrir proposta"
        >
          <ShoppingCart size={18} />
          <span>Proposta</span>
          <span style={{ minWidth: 22, height: 22, borderRadius: 11, background: NAVY, color: GOLD, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, padding: '0 6px' }}>
            {cart.items.length}
          </span>
        </motion.button>
      )}

      {/* ── Painel do carrinho / proposta ─────────────────────────────────── */}
      <AnimatePresence>
        {showCart && (
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
        {showProposal && cart.items.length > 0 && (
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
