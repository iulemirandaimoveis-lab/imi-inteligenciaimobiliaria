'use client';

import React, {
  useRef, useState, useCallback, useMemo, useEffect, useLayoutEffect, memo,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, ZoomIn, ZoomOut, RotateCcw, MessageCircle, ChevronLeft,
  Ruler, DollarSign, Maximize2, Minimize2,
  Share2, Calendar, Filter, ChevronDown, Layers,
  Sun, Eye, TrendingUp,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Lot {
  id: string; quadra: string; lot_number: number;
  area_m2: number; price: number | null;
  status: string; special_type: string | null; notes: string | null;
}
interface LotRenderShape {
  points?: string; x?: number; y?: number; w?: number; h?: number;
  groupTransform?: string;
}
interface QuadraCalibration {
  plantLabel: [number, number]; roadBearing: number;
  visualConfidence: 'high' | 'medium' | 'low';
  lastCalibrated: string; notes: string;
}
interface QuadraGeometry {
  polygon: [number, number][]; centroid: [number, number];
  primaryAxis: number;
  grid: { cols: number; cellW: number; cellH: number; gap: number; };
  calibration: QuadraCalibration;
  lots?: Array<{ lotNumber: number; polygon: [number, number][] }>;
}
interface LotIntelligence {
  imiScore: number; solarScore: number; viewScore: number;
  privacyScore: number; appreciationIndex: number; liquidityScore: number;
  rarity: 'COMUM' | 'DIFERENCIADO' | 'ESPECIAL' | 'RARO';
  solarOrientation: string; estimatedAltitude: string;
  morningLight: boolean; afternoonLight: boolean;
  greenProximity: 'Alta' | 'Média' | 'Baixa'; clubDistance: string;
}
type StatusKey = 'DISPONIVEL' | 'VENDIDO' | 'NEGOCIACAO' | 'PROPRIETARIO' | 'IGREJA';
type SheetState = 'hidden' | 'peek' | 'half' | 'full';
type FilterKey = 'ALL' | StatusKey;
type HeatmapMode = 'none' | 'pricePerM2' | 'solar' | 'imiScore';

// ─── Status palette ───────────────────────────────────────────────────────────

const STATUS: Record<StatusKey, { label: string; fill: string; stroke: string; textColor: string; badgeBg: string; }> = {
  DISPONIVEL:   { label:'Disponível',   fill:'rgba(34,197,94,0.14)',   stroke:'#22C55E', textColor:'#22C55E', badgeBg:'rgba(34,197,94,0.10)'  },
  VENDIDO:      { label:'Vendido',      fill:'rgba(30,41,59,0.55)',    stroke:'#475569', textColor:'#94A3B8', badgeBg:'rgba(71,85,105,0.14)'  },
  NEGOCIACAO:   { label:'Negociação',   fill:'rgba(234,179,8,0.14)',   stroke:'#EAB308', textColor:'#EAB308', badgeBg:'rgba(234,179,8,0.10)'  },
  PROPRIETARIO: { label:'Proprietário', fill:'rgba(59,130,246,0.12)',  stroke:'#3B82F6', textColor:'#60A5FA', badgeBg:'rgba(59,130,246,0.10)' },
  IGREJA:       { label:'Igreja',       fill:'rgba(167,139,250,0.12)', stroke:'#A78BFA', textColor:'#A78BFA', badgeBg:'rgba(167,139,250,0.10)' },
};
const getStatus = (key: string) => STATUS[key as StatusKey] ?? STATUS.DISPONIVEL;

// ─── Constants ────────────────────────────────────────────────────────────────

const SVG_W = 1000, SVG_H = 707;
const IMAGE_URL = '/images/maps/alto-bellevue-plant.jpg';
const MIN_SCALE = 0.3, MAX_SCALE = 12, LOT_ZOOM_THRESHOLD = 95;
const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL', maximumFractionDigits:0 }).format(v);
const fmtM2  = (v: number) => `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits:0 }).format(v)} m²`;

const PAYMENT_CONDITIONS = [
  { label:'À vista',   discount:0.20, entrada:1.0,  parcelas:0,   suffix:'20% desconto' },
  { label:'12 meses',  discount:0.15, entrada:0.10, parcelas:12,  suffix:'15% desconto' },
  { label:'36 meses',  discount:0.08, entrada:0.10, parcelas:36,  suffix:'8% desconto'  },
  { label:'60 meses',  discount:0.05, entrada:0.10, parcelas:60,  suffix:'5% desconto'  },
  { label:'120 meses', discount:0,    entrada:0.10, parcelas:120, suffix:'INCC/IPCA+0,5%/m' },
];

// ─── Quadra Geometry Data ─────────────────────────────────────────────────────

const QUADRA_DATA: Record<string, QuadraGeometry> = {
  H: { polygon:[[610,58],[650,52],[700,54],[726,66],[728,84],[724,100],[700,108],[650,110],[612,108],[592,96],[590,76]], centroid:[660,81], primaryAxis:-6, grid:{cols:15,cellW:9,cellH:8,gap:1.5}, calibration:{plantLabel:[660,64],roadBearing:-6,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Entrada principal — 45 lotes'} },
  A: { polygon:[[672,110],[732,100],[784,98],[824,108],[836,124],[836,148],[824,162],[784,168],[732,170],[672,162],[648,148],[648,124]], centroid:[742,134], primaryAxis:-2, grid:{cols:13,cellW:11,cellH:8,gap:1.5}, calibration:{plantLabel:[742,112],roadBearing:-2,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Superior direita — 25 lotes'} },
  D: { polygon:[[462,130],[528,120],[578,118],[610,130],[616,150],[616,176],[608,192],[576,200],[528,202],[466,192],[440,178],[440,150]], centroid:[528,160], primaryAxis:-5, grid:{cols:13,cellW:11,cellH:8,gap:1.5}, calibration:{plantLabel:[528,132],roadBearing:-5,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Centro-superior — 25 lotes'} },
  E: { polygon:[[562,172],[622,162],[672,160],[704,172],[710,196],[710,222],[702,238],[670,246],[622,248],[564,238],[540,224],[540,196]], centroid:[626,205], primaryAxis:-2, grid:{cols:14,cellW:10,cellH:8,gap:1.5}, calibration:{plantLabel:[626,174],roadBearing:-2,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Centro — 38 lotes'} },
  B: { polygon:[[782,166],[820,164],[852,172],[872,192],[876,220],[868,256],[852,274],[826,280],[796,276],[770,260],[756,232],[756,198]], centroid:[814,222], primaryAxis:18, grid:{cols:10,cellW:11,cellH:8,gap:1.5}, calibration:{plantLabel:[814,172],roadBearing:18,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Direita diagonal — 19 lotes'} },
  I: { polygon:[[690,252],[730,248],[762,256],[786,276],[792,304],[788,336],[774,356],[750,364],[718,360],[692,344],[670,318],[668,284]], centroid:[730,306], primaryAxis:15, grid:{cols:9,cellW:10,cellH:8,gap:1.5}, calibration:{plantLabel:[730,256],roadBearing:15,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Centro-direita — 16 lotes'} },
  C: { polygon:[[852,268],[880,276],[904,296],[918,326],[918,364],[910,400],[892,420],[866,428],[840,418],[820,398],[812,364],[812,326],[820,294]], centroid:[866,348], primaryAxis:35, grid:{cols:7,cellW:11,cellH:8,gap:1.5}, calibration:{plantLabel:[866,282],roadBearing:35,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Extrema direita — 13 lotes'} },
  F: { polygon:[[828,370],[858,378],[882,402],[894,436],[892,474],[882,506],[864,524],[840,530],[816,518],[796,496],[784,458],[784,420],[796,392]], centroid:[840,452], primaryAxis:32, grid:{cols:12,cellW:10,cellH:8,gap:1.5}, calibration:{plantLabel:[840,382],roadBearing:32,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Direita-centro — 27 lotes'} },
  J: { polygon:[[636,352],[680,346],[720,348],[752,362],[762,384],[762,418],[752,438],[720,448],[682,450],[638,440],[614,426],[612,394]], centroid:[688,398], primaryAxis:8, grid:{cols:12,cellW:10,cellH:8,gap:1.5}, calibration:{plantLabel:[688,356],roadBearing:8,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Centro-direita inferior — 24 lotes'} },
  L: { polygon:[[520,368],[584,362],[636,360],[664,374],[670,396],[670,434],[664,452],[636,460],[584,462],[522,452],[498,436],[496,394]], centroid:[584,412], primaryAxis:0, grid:{cols:12,cellW:10,cellH:8,gap:1.5}, calibration:{plantLabel:[584,372],roadBearing:0,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Centro-esquerda inferior — 24 lotes'} },
  O: { polygon:[[292,498],[356,490],[416,490],[452,504],[462,524],[462,558],[456,574],[428,584],[376,586],[320,582],[288,566],[280,544],[282,518]], centroid:[376,540], primaryAxis:-3, grid:{cols:3,cellW:12,cellH:8,gap:1.5}, calibration:{plantLabel:[376,504],roadBearing:-3,visualConfidence:'low',lastCalibrated:'2026-05-28',notes:'Esquerda-inferior — 3 lotes'} },
  P: { polygon:[[210,506],[278,498],[296,504],[300,524],[298,552],[288,574],[266,586],[238,586],[216,572],[206,550],[208,524]], centroid:[254,545], primaryAxis:0, grid:{cols:7,cellW:11,cellH:8,gap:1.5}, calibration:{plantLabel:[254,508],roadBearing:0,visualConfidence:'low',lastCalibrated:'2026-05-28',notes:'Extrema esquerda — 13 lotes'} },
  G: { polygon:[[788,516],[816,528],[840,552],[852,588],[848,628],[832,650],[808,660],[782,656],[758,640],[744,612],[744,572],[752,540]], centroid:[798,592], primaryAxis:44, grid:{cols:11,cellW:9,cellH:8,gap:1.5}, calibration:{plantLabel:[798,534],roadBearing:44,visualConfidence:'low',lastCalibrated:'2026-05-28',notes:'Inferior-direita íngreme — 21 lotes'} },
  K: { polygon:[[758,456],[788,466],[814,488],[830,520],[828,558],[816,584],[796,596],[770,594],[748,576],[736,548],[736,508],[746,478]], centroid:[784,530], primaryAxis:40, grid:{cols:12,cellW:9,cellH:8,gap:1.5}, calibration:{plantLabel:[784,468],roadBearing:40,visualConfidence:'low',lastCalibrated:'2026-05-28',notes:'Inferior-direita — 32 lotes'} },
  M: { polygon:[[454,456],[520,448],[586,446],[632,452],[654,468],[656,496],[656,524],[648,540],[616,548],[558,550],[496,548],[456,536],[434,520],[432,492],[436,468]], centroid:[544,498], primaryAxis:-5, grid:{cols:13,cellW:10,cellH:8,gap:1.5}, calibration:{plantLabel:[544,458],roadBearing:-5,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Centro-inferior — 27 lotes'} },
  N: { polygon:[[586,512],[644,506],[698,506],[736,518],[748,538],[748,572],[740,590],[710,598],[656,600],[596,592],[558,576],[548,556],[550,530]], centroid:[650,554], primaryAxis:4, grid:{cols:12,cellW:10,cellH:8,gap:1.5}, calibration:{plantLabel:[650,516],roadBearing:4,visualConfidence:'medium',lastCalibrated:'2026-05-28',notes:'Inferior centro-direita — 31 lotes'} },
};

const QUADRA_BOUNDS = (() => {
  const pts = Object.values(QUADRA_DATA).flatMap(g => g.polygon);
  const xs = pts.map(([x]) => x), ys = pts.map(([,y]) => y);
  return { minX:Math.min(...xs), maxX:Math.max(...xs), minY:Math.min(...ys), maxY:Math.max(...ys) };
})();

// ─── Spatial Intelligence Engine ─────────────────────────────────────────────

const QUADRA_INTELLIGENCE: Record<string, {
  solarScore:number; viewScore:number; appreciationBase:number;
  greenProximity:'Alta'|'Média'|'Baixa'; clubDistance:string;
  solarOrientation:string; morningLight:boolean; afternoonLight:boolean;
  estimatedAltitude:string;
}> = {
  H:{solarScore:88,viewScore:90,appreciationBase:92,greenProximity:'Alta',clubDistance:'80m',solarOrientation:'Leste–Norte',morningLight:true,afternoonLight:false,estimatedAltitude:'~785m'},
  A:{solarScore:85,viewScore:88,appreciationBase:90,greenProximity:'Alta',clubDistance:'120m',solarOrientation:'Leste',morningLight:true,afternoonLight:false,estimatedAltitude:'~778m'},
  D:{solarScore:84,viewScore:82,appreciationBase:86,greenProximity:'Alta',clubDistance:'160m',solarOrientation:'Leste–Sul',morningLight:true,afternoonLight:true,estimatedAltitude:'~772m'},
  E:{solarScore:83,viewScore:80,appreciationBase:84,greenProximity:'Média',clubDistance:'200m',solarOrientation:'Leste',morningLight:true,afternoonLight:false,estimatedAltitude:'~765m'},
  B:{solarScore:86,viewScore:85,appreciationBase:88,greenProximity:'Média',clubDistance:'240m',solarOrientation:'Norte–Leste',morningLight:true,afternoonLight:false,estimatedAltitude:'~770m'},
  I:{solarScore:80,viewScore:78,appreciationBase:82,greenProximity:'Média',clubDistance:'280m',solarOrientation:'Norte',morningLight:false,afternoonLight:false,estimatedAltitude:'~755m'},
  C:{solarScore:82,viewScore:86,appreciationBase:87,greenProximity:'Baixa',clubDistance:'340m',solarOrientation:'Sul–Leste',morningLight:false,afternoonLight:true,estimatedAltitude:'~748m'},
  F:{solarScore:78,viewScore:82,appreciationBase:83,greenProximity:'Baixa',clubDistance:'420m',solarOrientation:'Sul',morningLight:false,afternoonLight:true,estimatedAltitude:'~740m'},
  J:{solarScore:76,viewScore:73,appreciationBase:78,greenProximity:'Média',clubDistance:'360m',solarOrientation:'Leste–Sul',morningLight:true,afternoonLight:true,estimatedAltitude:'~744m'},
  L:{solarScore:78,viewScore:72,appreciationBase:79,greenProximity:'Média',clubDistance:'390m',solarOrientation:'Leste',morningLight:true,afternoonLight:false,estimatedAltitude:'~740m'},
  O:{solarScore:76,viewScore:68,appreciationBase:72,greenProximity:'Baixa',clubDistance:'480m',solarOrientation:'Leste',morningLight:true,afternoonLight:false,estimatedAltitude:'~730m'},
  P:{solarScore:74,viewScore:66,appreciationBase:70,greenProximity:'Baixa',clubDistance:'520m',solarOrientation:'Norte',morningLight:false,afternoonLight:false,estimatedAltitude:'~728m'},
  G:{solarScore:75,viewScore:80,appreciationBase:78,greenProximity:'Baixa',clubDistance:'460m',solarOrientation:'Sul–Oeste',morningLight:false,afternoonLight:true,estimatedAltitude:'~730m'},
  K:{solarScore:73,viewScore:76,appreciationBase:76,greenProximity:'Baixa',clubDistance:'440m',solarOrientation:'Sul–Oeste',morningLight:false,afternoonLight:true,estimatedAltitude:'~734m'},
  M:{solarScore:79,viewScore:70,appreciationBase:77,greenProximity:'Média',clubDistance:'420m',solarOrientation:'Leste–Sul',morningLight:true,afternoonLight:true,estimatedAltitude:'~735m'},
  N:{solarScore:77,viewScore:72,appreciationBase:76,greenProximity:'Média',clubDistance:'440m',solarOrientation:'Leste–Sul',morningLight:true,afternoonLight:true,estimatedAltitude:'~733m'},
};

function computeLotIntelligence(lot: Lot, allLots: Lot[]): LotIntelligence {
  const qi = QUADRA_INTELLIGENCE[lot.quadra] ?? QUADRA_INTELLIGENCE.M;
  const geom = QUADRA_DATA[lot.quadra];
  const cols = geom?.grid.cols ?? 12;
  const qLots = allLots.filter(l => l.quadra === lot.quadra).sort((a,b) => a.lot_number - b.lot_number);
  const idx = qLots.findIndex(l => l.id === lot.id);
  const total = qLots.length;
  const col = idx % cols, row = Math.floor(idx / cols);
  const rows = Math.ceil(total / cols);
  const isCorner = (col === 0 || col === cols-1) && (row === 0 || row === rows-1);
  const isEdge = col === 0 || col === cols-1 || row === 0 || row === rows-1;
  const privacyScore = isCorner ? 62 : isEdge ? 73 : 88;
  const rarity: LotIntelligence['rarity'] = lot.area_m2 >= 550 ? 'RARO' : lot.area_m2 >= 450 ? 'ESPECIAL' : lot.area_m2 >= 380 ? 'DIFERENCIADO' : 'COMUM';
  const prices = allLots.filter(l => l.price).map(l => l.price!).sort((a,b) => a-b);
  const median = prices[Math.floor(prices.length / 2)] ?? 300000;
  const liquidityScore = lot.price ? Math.max(40, Math.round(100 - Math.abs(lot.price / median - 1) * 60)) : 70;
  const imiScore = Math.round(qi.solarScore*0.2 + qi.viewScore*0.2 + privacyScore*0.15 + qi.appreciationBase*0.25 + liquidityScore*0.2);
  return { imiScore, solarScore:qi.solarScore, viewScore:qi.viewScore, privacyScore, appreciationIndex:qi.appreciationBase, liquidityScore, rarity, solarOrientation:qi.solarOrientation, estimatedAltitude:qi.estimatedAltitude, morningLight:qi.morningLight, afternoonLight:qi.afternoonLight, greenProximity:qi.greenProximity, clubDistance:qi.clubDistance };
}

// ─── Shape Resolver ───────────────────────────────────────────────────────────

function gridLotShapeResolver(index: number, total: number, geom: QuadraGeometry): LotRenderShape {
  const { cols, cellW, cellH, gap } = geom.grid;
  const col = index % cols, row = Math.floor(index / cols);
  const totalW = cols * cellW + (cols - 1) * gap;
  const rows = Math.ceil(total / cols);
  const totalH = rows * cellH + (rows - 1) * gap;
  return {
    x: col*(cellW+gap) - totalW/2,
    y: row*(cellH+gap) - totalH/2,
    w: cellW, h: cellH,
    groupTransform: `translate(${geom.centroid[0]},${geom.centroid[1]}) rotate(${geom.primaryAxis})`,
  };
}

function polygonToString(pts: [number,number][]) { return pts.map(([x,y]) => `${x},${y}`).join(' '); }
function elasticClamp(val: number, min: number, max: number, f = 0.22) {
  if (val < min) return min + (val-min)*f;
  if (val > max) return max + (val-max)*f;
  return val;
}
function normalizeWheelDelta(e: WheelEvent) {
  if (e.deltaMode === 1) return e.deltaY * 28;
  if (e.deltaMode === 2) return e.deltaY * 500;
  return e.deltaY;
}

// ─── SVG Defs ─────────────────────────────────────────────────────────────────

function SVGDefs() {
  return (
    <defs>
      <filter id="ab-quadra-glow" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0.78  0 0.82 0 0 0.29  0 0 0 0 0  0 0 0 14 -6" result="glow"/>
        <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="ab-lot-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="ab-vignette" cx="50%" cy="50%" r="70%" gradientUnits="userSpaceOnUse">
        <stop offset="45%" stopColor="transparent" stopOpacity="0"/>
        <stop offset="100%" stopColor="#040C14" stopOpacity="0.22"/>
      </radialGradient>
    </defs>
  );
}

// ─── Heatmap Layer ────────────────────────────────────────────────────────────

const HeatmapLayer = memo(function HeatmapLayer({ mode, lots }: { mode: Exclude<HeatmapMode,'none'>; lots: Lot[]; }) {
  const qMap = useMemo(() => { const m = new Map<string,Lot[]>(); for (const l of lots) { if (!m.has(l.quadra)) m.set(l.quadra,[]); m.get(l.quadra)!.push(l); } return m; }, [lots]);
  const values = useMemo(() => Object.keys(QUADRA_DATA).map(q => {
    if (mode === 'solar') return QUADRA_INTELLIGENCE[q]?.solarScore ?? 75;
    if (mode === 'imiScore') return QUADRA_INTELLIGENCE[q]?.appreciationBase ?? 75;
    const qLots = qMap.get(q) ?? [];
    const prices = qLots.filter(l => l.price && l.area_m2 > 0).map(l => l.price! / l.area_m2);
    return prices.length ? prices.reduce((a,b) => a+b,0)/prices.length : 0;
  }), [mode, qMap]);
  const nonZero = values.filter(v => v > 0);
  const minV = Math.min(...nonZero), maxV = Math.max(...nonZero);
  return (
    <g style={{pointerEvents:'none'}}>
      {Object.keys(QUADRA_DATA).map((q, i) => {
        const v = values[i]; if (!v) return null;
        const t = maxV > minV ? (v - minV) / (maxV - minV) : 0.5;
        const r = Math.round(10 + t*190), g2 = Math.round(18 + t*146), b = Math.round(28 + t*46);
        return <polygon key={q} points={polygonToString(QUADRA_DATA[q].polygon)} fill={`rgb(${r},${g2},${b})`} fillOpacity={0.52} stroke="none"/>;
      })}
    </g>
  );
});

// ─── IMI Score Ring ───────────────────────────────────────────────────────────

function IMIScoreRing({ score }: { score: number }) {
  const r = 22, circ = 2 * Math.PI * r;
  const progress = (score / 100) * circ;
  const color = score >= 85 ? '#C8A44A' : score >= 70 ? '#22C55E' : '#EAB308';
  return (
    <svg width={56} height={56} style={{transform:'rotate(-90deg)',flexShrink:0}}>
      <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={4}/>
      <circle cx={28} cy={28} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${progress} ${circ}`} strokeLinecap="round"
        style={{transition:'stroke-dasharray 0.9s ease'}}/>
    </svg>
  );
}

// ─── Floating Tooltip ─────────────────────────────────────────────────────────

const FloatingTooltip = memo(function FloatingTooltip({ lot, svgX, svgY }: { lot: Lot; svgX: number; svgY: number; scale: number; }) {
  const st = getStatus(lot.status);
  const ppm2 = lot.price && lot.area_m2 > 0 ? Math.round(lot.price/lot.area_m2) : null;
  const w = 172, h = 96;
  const x = Math.min(Math.max(svgX - w/2, 4), SVG_W - w - 4);
  const y = Math.max(svgY - h - 12, 4);
  return (
    <foreignObject x={x} y={y} width={w} height={h} style={{pointerEvents:'none',overflow:'visible'}}>
      <div style={{background:'rgba(4,10,18,0.96)',backdropFilter:'blur(18px)',borderRadius:10,border:'1px solid rgba(200,164,74,0.24)',borderLeft:'3px solid #C8A44A',padding:'9px 12px',boxShadow:'0 10px 40px rgba(0,0,0,0.6)',fontFamily:"'Outfit',sans-serif"}}>
        <p style={{margin:0,fontSize:8.5,fontWeight:700,color:'rgba(200,164,74,0.85)',textTransform:'uppercase',letterSpacing:'0.2em'}}>Quadra {lot.quadra} · Lote {lot.lot_number}</p>
        <p style={{margin:'4px 0 0',fontSize:14,fontWeight:800,color:'#F0EDE8',fontFamily:"'JetBrains Mono',monospace"}}>{fmtM2(lot.area_m2)}</p>
        <div style={{display:'flex',alignItems:'center',gap:5,marginTop:4}}>
          <span style={{width:5,height:5,borderRadius:'50%',background:st.stroke,flexShrink:0}}/>
          <span style={{fontSize:9.5,fontWeight:600,color:st.textColor}}>{st.label}</span>
        </div>
        {lot.price && <p style={{margin:'3px 0 0',fontSize:10.5,fontWeight:700,color:'#C8A44A',fontFamily:"'JetBrains Mono',monospace"}}>{fmtBRL(lot.price)}{ppm2 ? ` · ${fmtBRL(ppm2)}/m²` : ''}</p>}
        <p style={{margin:'4px 0 0',fontSize:8,color:'rgba(240,237,232,0.28)',fontWeight:600}}>Toque para detalhes →</p>
      </div>
    </foreignObject>
  );
});

// ─── Lot Cell ─────────────────────────────────────────────────────────────────

interface LotCellProps {
  lot: Lot; index: number; total: number; geom: QuadraGeometry;
  filterKey: FilterKey; isSelected: boolean;
  onHover: (lot: Lot|null, x: number, y: number) => void;
  onClick: (lot: Lot) => void;
}

const LotCell = memo(function LotCell({ lot, index, total, geom, filterKey, isSelected, onHover, onClick }: LotCellProps) {
  const st = getStatus(lot.status);
  const shape = gridLotShapeResolver(index, total, geom);
  const isFiltered = filterKey !== 'ALL' && lot.status !== filterKey;
  const isAvail = lot.status === 'DISPONIVEL';
  const isSold = lot.status === 'VENDIDO';
  const opacity = isFiltered ? 0.06 : 1;
  const cx = geom.centroid[0] + (shape.x ?? 0) + (shape.w ?? 0)/2;
  const cy = geom.centroid[1] + (shape.y ?? 0) + (shape.h ?? 0)/2;
  const animDelay = `${((index * 0.11) % 2.8).toFixed(2)}s`;

  return (
    <g transform={shape.groupTransform} opacity={opacity} style={{pointerEvents:isFiltered?'none':'all',cursor:'pointer'}}
      onMouseEnter={() => !isFiltered && onHover(lot, cx, cy)}
      onMouseLeave={() => onHover(null, 0, 0)}
      onClick={e => { e.stopPropagation(); !isFiltered && onClick(lot); }}>
      <rect
        x={shape.x} y={shape.y} width={shape.w} height={shape.h} rx={1.5}
        fill={isSelected ? 'rgba(200,164,74,0.30)' : st.fill}
        stroke={isSelected ? '#C8A44A' : st.stroke}
        strokeWidth={isSelected ? 1.2 : isSold ? 0.5 : 0.6}
        style={{
          filter: isSelected ? 'url(#ab-lot-glow)' : undefined,
          animation: isAvail && !isFiltered && !isSelected ? `lotPulse 4s ease-in-out ${animDelay} infinite` : 'none',
        }}
      />
      {/* Corner triangle for available lots */}
      {isAvail && !isSelected && (shape.w ?? 0) >= 8 && (
        <polygon
          points={`${(shape.x??0)+(shape.w??0)-3},${shape.y??0} ${(shape.x??0)+(shape.w??0)},${shape.y??0} ${(shape.x??0)+(shape.w??0)},${(shape.y??0)+3}`}
          fill="#22C55E" opacity={0.7} style={{pointerEvents:'none'}}/>
      )}
      {/* X mark for sold lots */}
      {isSold && (shape.w ?? 0) >= 8 && (
        <g style={{pointerEvents:'none'}} opacity={0.35}>
          <line x1={(shape.x??0)+2} y1={(shape.y??0)+2} x2={(shape.x??0)+(shape.w??0)-2} y2={(shape.y??0)+(shape.h??0)-2} stroke="#475569" strokeWidth={0.8}/>
          <line x1={(shape.x??0)+(shape.w??0)-2} y1={(shape.y??0)+2} x2={(shape.x??0)+2} y2={(shape.y??0)+(shape.h??0)-2} stroke="#475569" strokeWidth={0.8}/>
        </g>
      )}
      {(shape.w ?? 0) >= 9 && (
        <text x={(shape.x??0)+(shape.w??0)/2} y={(shape.y??0)+(shape.h??0)/2}
          textAnchor="middle" dominantBaseline="central"
          fill={isSelected ? '#0A1A2E' : isSold ? 'rgba(148,163,184,0.6)' : 'rgba(255,255,255,0.9)'}
          fontSize={4.5} fontWeight="800" fontFamily="'JetBrains Mono',monospace"
          style={{pointerEvents:'none',userSelect:'none'}}>
          {lot.lot_number}
        </text>
      )}
    </g>
  );
});

// ─── Lot Grid ─────────────────────────────────────────────────────────────────

const LotGrid = memo(function LotGrid({ quadra, lots, geom, filterKey, selectedLotId, onHoverLot, onClickLot }: {
  quadra: string; lots: Lot[]; geom: QuadraGeometry; filterKey: FilterKey;
  selectedLotId: string|null; onHoverLot: (lot: Lot|null, x: number, y: number) => void; onClickLot: (lot: Lot) => void;
}) {
  const sorted = useMemo(() => [...lots].sort((a,b) => a.lot_number - b.lot_number), [lots]);
  return (
    <g data-interactive="true">
      {sorted.map((lot, i) => (
        <LotCell key={lot.id} lot={lot} index={i} total={sorted.length} geom={geom}
          filterKey={filterKey} isSelected={lot.id === selectedLotId}
          onHover={onHoverLot} onClick={onClickLot}/>
      ))}
    </g>
  );
});

// ─── Quadra Tile ──────────────────────────────────────────────────────────────

const QuadraTile = memo(function QuadraTile({ quadra, geom, lots, filterKey, isSelected, onClick }: {
  quadra: string; geom: QuadraGeometry; lots: Lot[]; filterKey: FilterKey; isSelected: boolean; onClick: (q: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const available = useMemo(() => lots.filter(l => l.status === 'DISPONIVEL').length, [lots]);
  const isSoldOut = available === 0 && lots.length > 0;
  const display = filterKey === 'ALL' ? available : lots.filter(l => l.status === filterKey).length;
  const pts = polygonToString(geom.polygon);
  const [cx, cy] = geom.centroid;

  const strokeColor = isSelected ? '#C8A44A' : hovered ? 'rgba(200,164,74,0.72)' : isSoldOut ? 'rgba(71,85,105,0.35)' : 'rgba(200,164,74,0.18)';
  const strokeW = isSelected ? 1.3 : hovered ? 0.9 : 0.5;
  const fillOp = isSelected ? 0.07 : hovered ? 0.04 : 0;

  return (
    <g data-interactive="true" style={{cursor:'pointer'}}
      onClick={e => { e.stopPropagation(); onClick(quadra); }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {isSelected && (
        <polygon points={pts} fill="none" stroke="#C8A44A" strokeWidth={8} strokeOpacity={0.15}
          style={{filter:'url(#ab-quadra-glow)'}}/>
      )}
      <polygon points={pts} fill="#C8A44A" fillOpacity={fillOp} stroke="none"
        style={{transition:'fill-opacity 0.18s ease'}}/>
      <polygon points={pts} fill="none" stroke={strokeColor} strokeWidth={strokeW}
        style={{transition:'stroke 0.18s, stroke-width 0.18s'}}/>
      {/* Barely visible inner highlight */}
      <polygon points={pts} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={0.4}/>

      {/* Quadra letter */}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
        fill={isSelected ? '#C8A44A' : hovered ? 'rgba(240,237,232,0.88)' : isSoldOut ? 'rgba(148,163,184,0.35)' : 'rgba(240,237,232,0.28)'}
        fontSize={isSelected ? 11 : hovered ? 9 : 7.5} fontWeight="700"
        fontFamily="'JetBrains Mono',monospace" letterSpacing="0.1em"
        style={{pointerEvents:'none',userSelect:'none',transition:'all 0.18s'}}>
        {quadra}
      </text>

      {/* Availability count — hover/selected only */}
      {(isSelected || hovered) && (
        <text x={cx} y={cy + (isSelected ? 12 : 10)} textAnchor="middle" dominantBaseline="central"
          fill={isSoldOut ? 'rgba(148,163,184,0.5)' : '#22C55E'}
          fontSize={5.5} fontWeight="600" fontFamily="'JetBrains Mono',monospace"
          style={{pointerEvents:'none',userSelect:'none'}}>
          {isSoldOut ? 'esgotada' : display > 0 ? `${display} disp.` : ''}
        </text>
      )}
    </g>
  );
});
