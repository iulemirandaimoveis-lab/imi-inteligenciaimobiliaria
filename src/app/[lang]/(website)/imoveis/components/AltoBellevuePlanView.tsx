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

// ─── Score Bar ────────────────────────────────────────────────────────────────
function ScoreBar({ value, color = '#C8A44A' }: { value: number; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 2,
          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
      </div>
      <span style={{ fontSize: 10, color: 'rgba(240,237,232,0.5)', fontFamily: "'JetBrains Mono',monospace", minWidth: 24 }}>
        {value}
      </span>
    </div>
  );
}

// ─── Spatial Intelligence Panel ───────────────────────────────────────────────
function SpatialIntelligencePanel({
  lot, intel, onClose, onWhatsApp,
}: {
  lot: Lot; intel: LotIntelligence; onClose: () => void; onWhatsApp: (msg: string) => void;
}) {
  const [showPayment, setShowPayment] = React.useState(false);
  const [showInvestment, setShowInvestment] = React.useState(false);
  const status = STATUS[lot.status];

  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse no Lote ${lot.number} da Quadra ${lot.quadra} do Alto Bellevue.\n` +
    (lot.area ? `Área: ${fmtM2(lot.area)}\n` : '') +
    (lot.price ? `Valor: ${fmtBRL(lot.price)}\n` : '') +
    `IMI Score: ${intel.imiScore}/100`
  );

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '0 0 24px',
      scrollbarWidth: 'thin', scrollbarColor: 'rgba(200,164,74,0.3) transparent' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: 'rgba(10,15,28,0.97)', backdropFilter: 'blur(12px)', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, color: 'rgba(200,164,74,0.7)', fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>
              IMI SPATIAL INTELLIGENCE
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#F0EDE8', letterSpacing: '-0.02em' }}>
              Lote {lot.number} · Quadra {lot.quadra}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: 'rgba(240,237,232,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px',
          borderRadius: 20, background: `${status.fill}`, border: `1px solid ${status.stroke}`,
          fontSize: 10, fontWeight: 600, color: status.stroke, letterSpacing: '0.08em' }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: status.stroke }} />
          {status.label.toUpperCase()}
        </span>
      </div>

      {/* Primary metrics */}
      <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {lot.area && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px',
            border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 9, color: 'rgba(200,164,74,0.6)', fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>ÁREA</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F0EDE8' }}>{fmtM2(lot.area)}</div>
          </div>
        )}
        {lot.price && (
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px',
            border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 9, color: 'rgba(200,164,74,0.6)', fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>VALOR</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#C8A44A' }}>{fmtBRL(lot.price)}</div>
            {lot.area && lot.price && (
              <div style={{ fontSize: 9, color: 'rgba(240,237,232,0.4)', marginTop: 2 }}>
                {fmtBRL(Math.round(lot.price / lot.area))}/m²
              </div>
            )}
          </div>
        )}
      </div>

      {/* IMI Score Ring */}
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 9, color: 'rgba(200,164,74,0.6)', fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 14 }}>IMI SCORE™</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <IMIScoreRing score={intel.imiScore} size={80} />
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10,
                color: 'rgba(240,237,232,0.5)', marginBottom: 4, fontFamily: "'JetBrains Mono',monospace" }}>
                <span>Solar</span><span style={{ color: 'rgba(234,179,8,0.8)' }}>{intel.solarScore}</span>
              </div>
              <ScoreBar value={intel.solarScore} color="#EAB308" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10,
                color: 'rgba(240,237,232,0.5)', marginBottom: 4, fontFamily: "'JetBrains Mono',monospace" }}>
                <span>Vista</span><span style={{ color: 'rgba(59,130,246,0.9)' }}>{intel.viewScore}</span>
              </div>
              <ScoreBar value={intel.viewScore} color="#3B82F6" />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10,
                color: 'rgba(240,237,232,0.5)', marginBottom: 4, fontFamily: "'JetBrains Mono',monospace" }}>
                <span>Privacidade</span><span style={{ color: 'rgba(167,139,250,0.9)' }}>{intel.privacyScore}</span>
              </div>
              <ScoreBar value={intel.privacyScore} color="#A78BFA" />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10,
                color: 'rgba(240,237,232,0.5)', marginBottom: 4, fontFamily: "'JetBrains Mono',monospace" }}>
                <span>Apreciação</span><span style={{ color: 'rgba(34,197,94,0.9)' }}>{intel.appreciationScore}</span>
              </div>
              <ScoreBar value={intel.appreciationScore} color="#22C55E" />
            </div>
          </div>
        </div>
      </div>

      {/* Spatial data */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 9, color: 'rgba(200,164,74,0.6)', fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>DADOS ESPACIAIS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Altitude Est.', value: `~${intel.estimatedAltitude}m` },
            { label: 'Orientação', value: intel.solarOrientation },
            { label: 'Luz Manhã', value: intel.morningLight },
            { label: 'Luz Tarde', value: intel.afternoonLight },
            { label: 'Verde Próx.', value: `${intel.greenProximity}m` },
            { label: 'Clube', value: `${intel.clubDistance}m` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '8px 10px',
              border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 8, color: 'rgba(200,164,74,0.5)', fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 11, color: '#F0EDE8', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Investment Intelligence (collapsible) */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setShowInvestment(v => !v)}
          style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(240,237,232,0.7)' }}>
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'rgba(200,164,74,0.6)' }}>INTELIGÊNCIA DE INVESTIMENTO</span>
          <ChevronDown size={14} style={{ transform: showInvestment ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {showInvestment && (
          <div style={{ padding: '0 20px 16px' }}>
            {[
              { label: 'Score Liquidez', value: `${intel.liquidityScore}/100`, color: '#22C55E' },
              { label: 'Score Apreciação', value: `${intel.appreciationScore}/100`, color: '#C8A44A' },
              { label: 'Índice IMI Quadra', value: `${intel.imiScore}/100`, color: '#C8A44A' },
              { label: 'Região Premium', value: intel.appreciationScore > 75 ? 'Sim' : 'Moderado', color: intel.appreciationScore > 75 ? '#22C55E' : '#EAB308' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, color: 'rgba(240,237,232,0.5)', fontFamily: "'JetBrains Mono',monospace" }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment conditions (collapsible) */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => setShowPayment(v => !v)}
          style={{ width: '100%', padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.15em',
            textTransform: 'uppercase', color: 'rgba(200,164,74,0.6)' }}>CONDIÇÕES DE PAGAMENTO</span>
          <ChevronDown size={14} style={{ color: 'rgba(240,237,232,0.4)', transform: showPayment ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        {showPayment && lot.price && (
          <div style={{ padding: '0 20px 16px' }}>
            {PAYMENT_CONDITIONS.map(cond => {
              const downAmt = lot.price! * cond.downPct;
              const discountedPrice = lot.price! * (1 - cond.discount);
              const remaining = discountedPrice - downAmt;
              const installmentAmt = cond.months > 0 ? remaining / cond.months : 0;
              return (
                <div key={cond.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '12px',
                  marginBottom: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#C8A44A', fontFamily: "'JetBrains Mono',monospace" }}>{cond.label}</span>
                    {cond.discount > 0 && (
                      <span style={{ fontSize: 9, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
                        borderRadius: 4, padding: '2px 6px', color: '#22C55E', fontFamily: "'JetBrains Mono',monospace" }}>
                        -{Math.round(cond.discount * 100)}% DESC
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {cond.downPct > 0 && (
                      <div>
                        <div style={{ fontSize: 8, color: 'rgba(200,164,74,0.5)', fontFamily: "'JetBrains Mono',monospace",
                          textTransform: 'uppercase', marginBottom: 2 }}>ENTRADA</div>
                        <div style={{ fontSize: 11, color: '#F0EDE8' }}>{fmtBRL(downAmt)}</div>
                      </div>
                    )}
                    {installmentAmt > 0 && (
                      <div>
                        <div style={{ fontSize: 8, color: 'rgba(200,164,74,0.5)', fontFamily: "'JetBrains Mono',monospace",
                          textTransform: 'uppercase', marginBottom: 2 }}>PARCELA</div>
                        <div style={{ fontSize: 11, color: '#F0EDE8' }}>{fmtBRL(Math.round(installmentAmt))}/mês</div>
                      </div>
                    )}
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ fontSize: 8, color: 'rgba(200,164,74,0.5)', fontFamily: "'JetBrains Mono',monospace",
                        textTransform: 'uppercase', marginBottom: 2 }}>TOTAL</div>
                      <div style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }}>{fmtBRL(Math.round(discountedPrice))}</div>
                    </div>
                  </div>
                  {cond.note && (
                    <div style={{ marginTop: 6, fontSize: 9, color: 'rgba(240,237,232,0.3)',
                      fontFamily: "'JetBrains Mono',monospace" }}>{cond.note}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {showPayment && !lot.price && (
          <div style={{ padding: '0 20px 16px', fontSize: 11, color: 'rgba(240,237,232,0.4)' }}>
            Consulte-nos para condições personalizadas.
          </div>
        )}
      </div>

      {/* CTAs */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {lot.status === 'DISPONIVEL' && (
          <a href={`https://wa.me/5581997230455?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'linear-gradient(135deg,#22C55E,#16A34A)', borderRadius: 12, padding: '13px',
              color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(34,197,94,0.3)', letterSpacing: '0.02em' }}>
            <MessageCircle size={16} /> Reservar via WhatsApp
          </a>
        )}
        <a href={`https://wa.me/5581997230455?text=${encodeURIComponent('Quero saber mais sobre o Alto Bellevue')}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '11px', color: 'rgba(240,237,232,0.7)', fontWeight: 600,
            fontSize: 12, textDecoration: 'none', letterSpacing: '0.02em' }}>
          <MessageCircle size={14} /> Falar com Especialista
        </a>
      </div>
    </div>
  );
}

// ─── Quadra Panel Content ─────────────────────────────────────────────────────
function QuadraPanelContent({
  quadra, lots, filterKey, onLotClick,
}: {
  quadra: string; lots: Lot[]; filterKey: FilterKey; onLotClick: (lot: Lot) => void;
}) {
  const filtered = filterKey === 'ALL' ? lots : lots.filter(l => l.status === filterKey);
  const availCount = lots.filter(l => l.status === 'DISPONIVEL').length;
  const totalCount = lots.length;
  const qdata = QUADRA_DATA.find(q => q.quadra === quadra);
  const qi = QUADRA_INTELLIGENCE[quadra as keyof typeof QUADRA_INTELLIGENCE];

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '0 0 24px',
      scrollbarWidth: 'thin', scrollbarColor: 'rgba(200,164,74,0.3) transparent' }}>
      <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: 'rgba(10,15,28,0.97)', backdropFilter: 'blur(12px)', zIndex: 2 }}>
        <div style={{ fontSize: 9, color: 'rgba(200,164,74,0.6)', fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>QUADRA</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#F0EDE8', letterSpacing: '-0.02em', marginBottom: 8 }}>
          {quadra}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: '#22C55E', background: 'rgba(34,197,94,0.12)',
            border: '1px solid rgba(34,197,94,0.3)', borderRadius: 6, padding: '2px 8px',
            fontFamily: "'JetBrains Mono',monospace" }}>{availCount} disponíveis</span>
          <span style={{ fontSize: 10, color: 'rgba(240,237,232,0.4)', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '2px 8px',
            fontFamily: "'JetBrains Mono',monospace" }}>{totalCount} lotes</span>
          {qi && (
            <span style={{ fontSize: 10, color: '#C8A44A', background: 'rgba(200,164,74,0.1)',
              border: '1px solid rgba(200,164,74,0.25)', borderRadius: 6, padding: '2px 8px',
              fontFamily: "'JetBrains Mono',monospace" }}>IMI {qi.solarScore}</span>
          )}
        </div>
        {qdata && (
          <div style={{ marginTop: 8, fontSize: 9, color: 'rgba(240,237,232,0.35)',
            fontFamily: "'JetBrains Mono',monospace" }}>
            {qdata.totalLots} lotes · {qdata.lotArea}m² · {qdata.config}
          </div>
        )}
      </div>

      {/* Lot cards grid */}
      <div style={{ padding: '14px 16px',
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
        {filtered.map(lot => {
          const s = STATUS[lot.status];
          const li = computeLotIntelligence(lot, QUADRA_INTELLIGENCE[quadra as keyof typeof QUADRA_INTELLIGENCE]);
          const isDisp = lot.status === 'DISPONIVEL';
          return (
            <button key={lot.id || lot.number} onClick={() => onLotClick(lot)}
              style={{ background: isDisp ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isDisp ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 8, padding: '8px 6px', cursor: isDisp ? 'pointer' : 'default',
                textAlign: 'left', transition: 'all 0.15s' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: isDisp ? '#22C55E' : 'rgba(240,237,232,0.35)',
                fontFamily: "'JetBrains Mono',monospace", marginBottom: 3 }}>#{lot.number}</div>
              {lot.area && (
                <div style={{ fontSize: 9, color: 'rgba(240,237,232,0.5)',
                  fontFamily: "'JetBrains Mono',monospace", marginBottom: 2 }}>{fmtM2(lot.area)}</div>
              )}
              {lot.price && isDisp && (
                <div style={{ fontSize: 9, color: '#C8A44A', fontFamily: "'JetBrains Mono',monospace" }}>
                  {fmtBRL(lot.price)}
                </div>
              )}
              {/* IMI dots */}
              <div style={{ display: 'flex', gap: 2, marginTop: 4 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ width: 4, height: 4, borderRadius: '50%',
                    background: i < Math.round(li.imiScore / 20) ? '#C8A44A' : 'rgba(255,255,255,0.1)' }} />
                ))}
              </div>
              {!isDisp && (
                <div style={{ fontSize: 8, color: s.stroke, fontFamily: "'JetBrains Mono',monospace",
                  marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              )}
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'rgba(240,237,232,0.3)',
          fontSize: 12, fontFamily: "'JetBrains Mono',monospace" }}>
          Nenhum lote com esse filtro
        </div>
      )}
    </div>
  );
}

// ─── MiniMap ──────────────────────────────────────────────────────────────────
const MiniMap = React.memo(function MiniMap({
  quadras, lots, transform, viewportW, viewportH, svgW, svgH, onNavigate,
}: {
  quadras: typeof QUADRA_DATA;
  lots: Lot[];
  transform: { x: number; y: number; scale: number };
  viewportW: number; viewportH: number;
  svgW: number; svgH: number;
  onNavigate: (x: number, y: number) => void;
}) {
  const MM_W = 148, MM_H = 106;
  const scaleX = MM_W / svgW, scaleY = MM_H / svgH;

  // Viewport rect in minimap coords
  const vpW = (viewportW / transform.scale) * scaleX;
  const vpH = (viewportH / transform.scale) * scaleY;
  const vpX = (-transform.x / transform.scale) * scaleX;
  const vpY = (-transform.y / transform.scale) * scaleY;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / MM_W; // normalized
    const ny = (e.clientY - rect.top) / MM_H;
    onNavigate(nx, ny);
  };

  return (
    <div style={{ position: 'absolute', bottom: 60, right: 12, zIndex: 30,
      background: 'rgba(10,15,28,0.9)', border: '1px solid rgba(200,164,74,0.2)',
      borderRadius: 8, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
      <svg width={MM_W} height={MM_H} style={{ display: 'block', cursor: 'crosshair' }} onClick={handleClick}>
        <image href="/images/maps/alto-bellevue-plant.jpg" x={0} y={0} width={MM_W} height={MM_H}
          preserveAspectRatio="xMidYMid slice" opacity={0.5} />
        {quadras.map(q => {
          const qLots = lots.filter(l => l.quadra === q.quadra);
          const hasAvail = qLots.some(l => l.status === 'DISPONIVEL');
          return (
            <polygon key={q.quadra}
              points={q.geometry.polygon.map(([px, py]) => `${px * scaleX},${py * scaleY}`).join(' ')}
              fill="none"
              stroke={hasAvail ? 'rgba(34,197,94,0.5)' : 'rgba(100,116,139,0.3)'}
              strokeWidth={0.8}
            />
          );
        })}
        {/* Viewport rect */}
        <rect x={vpX} y={vpY} width={Math.max(4, vpW)} height={Math.max(4, vpH)}
          fill="rgba(200,164,74,0.1)" stroke="#C8A44A" strokeWidth={1}
          rx={1} style={{ pointerEvents: 'none' }} />
      </svg>
    </div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
export interface AltoBellevuePlanViewProps {
  lots?: Lot[];
  lang?: string;
}

export default function AltoBellevuePlanView({ lots: lotsProp = [], lang: _lang }: AltoBellevuePlanViewProps) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedQuadra, setSelectedQuadra] = React.useState<string | null>(null);
  const [selectedLot, setSelectedLot] = React.useState<Lot | null>(null);
  const [filterKey, setFilterKey] = React.useState<FilterKey>('ALL');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [sheetState, setSheetState] = React.useState<SheetState>('hidden');
  const [isMobile, setIsMobile] = React.useState(false);
  const [heatmapMode, setHeatmapMode] = React.useState<HeatmapMode>('none');
  const [showMiniMap, setShowMiniMap] = React.useState(true);
  const [viewportSize, setViewportSize] = React.useState({ w: 0, h: 0 });
  const [transformState, setTransformState] = React.useState({ x: 0, y: 0, scale: 1 });

  // ── Refs ───────────────────────────────────────────────────────────────────
  const containerRef = React.useRef<HTMLDivElement>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const transformRef = React.useRef({ x: 0, y: 0, scale: 1 });
  const velRef = React.useRef({ x: 0, y: 0 });
  const rafRef = React.useRef<number>(0);
  const isDraggingRef = React.useRef(false);
  const lastPointerRef = React.useRef({ x: 0, y: 0 });
  const touchStartRef = React.useRef<{ x: number; y: number; scale: number; dist: number } | null>(null);
  const lastTapRef = React.useRef<number>(0);
  const animatingRef = React.useRef(false);

  // ── Derived data ───────────────────────────────────────────────────────────
  const lots = React.useMemo(() => {
    if (lotsProp.length > 0) return lotsProp;
    // Generate demo data
    const demo: Lot[] = [];
    QUADRA_DATA.forEach(q => {
      for (let i = 1; i <= q.totalLots; i++) {
        const rand = Math.random();
        const status: StatusKey = rand < 0.45 ? 'DISPONIVEL' : rand < 0.75 ? 'VENDIDO' : rand < 0.88 ? 'NEGOCIACAO' : rand < 0.95 ? 'PROPRIETARIO' : 'IGREJA';
        demo.push({
          id: `${q.quadra}-${i}`,
          quadra: q.quadra,
          number: i,
          status,
          area: q.lotArea + Math.floor((Math.random() - 0.5) * 20),
          price: status === 'DISPONIVEL' ? Math.round((q.lotArea * (280 + Math.random() * 80)) / 1000) * 1000 : undefined,
        });
      }
    });
    return demo;
  }, [lotsProp]);

  const stats = React.useMemo(() => {
    const total = lots.length;
    const disponivel = lots.filter(l => l.status === 'DISPONIVEL').length;
    const vendido = lots.filter(l => l.status === 'VENDIDO').length;
    const negociacao = lots.filter(l => l.status === 'NEGOCIACAO').length;
    return { total, disponivel, vendido, negociacao };
  }, [lots]);

  const filterRows = React.useMemo((): Array<{ key: FilterKey; label: string; count: number; color: string }> => [
    { key: 'ALL', label: 'Todos', count: lots.length, color: '#F0EDE8' },
    { key: 'DISPONIVEL', label: 'Disponível', count: stats.disponivel, color: '#22C55E' },
    { key: 'VENDIDO', label: 'Vendido', count: stats.vendido, color: '#475569' },
    { key: 'NEGOCIACAO', label: 'Negociação', count: stats.negociacao, color: '#EAB308' },
  ], [lots, stats]);

  // ── Layout effect ──────────────────────────────────────────────────────────
  React.useLayoutEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ── Apply transform ────────────────────────────────────────────────────────
  const applyTransform = React.useCallback(() => {
    if (!svgRef.current) return;
    const { x, y, scale } = transformRef.current;
    svgRef.current.style.transform = `translate(${x}px,${y}px) scale(${scale})`;
    setTransformState({ x, y, scale });
  }, []);

  // ── Animation engine ───────────────────────────────────────────────────────
  const animateTo = React.useCallback((
    targetX: number, targetY: number, targetScale: number, duration = 600
  ) => {
    const start = performance.now();
    const from = { ...transformRef.current };
    animatingRef.current = true;

    const ease = (t: number) => 1 - Math.pow(1 - t, 4); // ease-out-quart

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const e = ease(t);
      transformRef.current = {
        x: from.x + (targetX - from.x) * e,
        y: from.y + (targetY - from.y) * e,
        scale: from.scale + (targetScale - from.scale) * e,
      };
      applyTransform();
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        animatingRef.current = false;
      }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
  }, [applyTransform]);

  const flyToQuadra = React.useCallback((quadra: string) => {
    const q = QUADRA_DATA.find(q => q.quadra === quadra);
    if (!q || !containerRef.current) return;
    const [cx, cy] = q.geometry.centroid;
    const cRect = containerRef.current.getBoundingClientRect();
    const targetScale = Math.min(3.5, Math.max(2, cRect.width / 200));
    const targetX = cRect.width / 2 - cx * targetScale;
    const targetY = cRect.height / 2 - cy * targetScale;
    animateTo(targetX, targetY, targetScale);
  }, [animateTo]);

  const flyToLot = React.useCallback((lot: Lot) => {
    if (!containerRef.current) return;
    const q = QUADRA_DATA.find(q => q.quadra === lot.quadra);
    if (!q) return;
    const [cx, cy] = q.geometry.centroid;
    const cRect = containerRef.current.getBoundingClientRect();
    const targetScale = 6;
    const targetX = cRect.width / 2 - cx * targetScale;
    const targetY = cRect.height / 2 - cy * targetScale;
    animateTo(targetX, targetY, targetScale);
  }, [animateTo]);

  const resetView = React.useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const scale = Math.min(rect.width / SVG_W, rect.height / SVG_H) * 0.9;
    const x = (rect.width - SVG_W * scale) / 2;
    const y = (rect.height - SVG_H * scale) / 2;
    animateTo(x, y, scale);
  }, [animateTo]);

  // ── Initial fit ────────────────────────────────────────────────────────────
  React.useEffect(() => {
    setTimeout(resetView, 100);
  }, [resetView]);

  // ── Pan handlers ───────────────────────────────────────────────────────────
  const onPointerDown = React.useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('[data-interactive]')) return;
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    velRef.current = { x: 0, y: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    velRef.current = { x: dx, y: dy };
    transformRef.current.x += dx;
    transformRef.current.y += dy;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    applyTransform();
  }, [applyTransform]);

  const onPointerUp = React.useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    // Inertia
    const inertia = () => {
      velRef.current.x *= 0.88;
      velRef.current.y *= 0.88;
      if (Math.abs(velRef.current.x) < 0.3 && Math.abs(velRef.current.y) < 0.3) return;
      transformRef.current.x += velRef.current.x;
      transformRef.current.y += velRef.current.y;
      applyTransform();
      rafRef.current = requestAnimationFrame(inertia);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(inertia);
  }, [applyTransform]);

  // ── Wheel zoom ────────────────────────────────────────────────────────────
  const onWheel = React.useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = normalizeWheelDelta(e as unknown as WheelEvent);
    const factor = 1 - delta * 0.001;
    const rect = containerRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const newScale = elasticClamp(transformRef.current.scale * factor, MIN_SCALE, MAX_SCALE);
    const scaleDiff = newScale / transformRef.current.scale;
    transformRef.current.x = mx - (mx - transformRef.current.x) * scaleDiff;
    transformRef.current.y = my - (my - transformRef.current.y) * scaleDiff;
    transformRef.current.scale = newScale;
    applyTransform();
  }, [applyTransform]);

  // ── Touch handlers ────────────────────────────────────────────────────────
  const onTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        scale: transformRef.current.scale,
        dist,
      };
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        // Double tap zoom
        const rect = containerRef.current!.getBoundingClientRect();
        const mx = e.touches[0].clientX - rect.left;
        const my = e.touches[0].clientY - rect.top;
        const newScale = transformRef.current.scale > 2 ? 1 : 3;
        const newX = mx - (mx - transformRef.current.x) * (newScale / transformRef.current.scale);
        const newY = my - (my - transformRef.current.y) * (newScale / transformRef.current.scale);
        animateTo(newX, newY, newScale, 300);
      }
      lastTapRef.current = now;
      lastPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      velRef.current = { x: 0, y: 0 };
    }
  }, [animateTo]);

  const onTouchMove = React.useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 2 && touchStartRef.current) {
      const dx = e.touches[1].clientX - e.touches[0].clientX;
      const dy = e.touches[1].clientY - e.touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scaleFactor = dist / touchStartRef.current.dist;
      const newScale = elasticClamp(touchStartRef.current.scale * scaleFactor, MIN_SCALE, MAX_SCALE);
      const rect = containerRef.current!.getBoundingClientRect();
      const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
      const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
      const scaleDiff = newScale / transformRef.current.scale;
      transformRef.current.x = cx - (cx - transformRef.current.x) * scaleDiff;
      transformRef.current.y = cy - (cy - transformRef.current.y) * scaleDiff;
      transformRef.current.scale = newScale;
      applyTransform();
    } else if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastPointerRef.current.x;
      const dy = e.touches[0].clientY - lastPointerRef.current.y;
      velRef.current = { x: dx, y: dy };
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      lastPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      applyTransform();
    }
  }, [applyTransform]);

  const onTouchEnd = React.useCallback(() => {
    touchStartRef.current = null;
    const inertia = () => {
      velRef.current.x *= 0.88;
      velRef.current.y *= 0.88;
      if (Math.abs(velRef.current.x) < 0.3 && Math.abs(velRef.current.y) < 0.3) return;
      transformRef.current.x += velRef.current.x;
      transformRef.current.y += velRef.current.y;
      applyTransform();
      rafRef.current = requestAnimationFrame(inertia);
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(inertia);
  }, [applyTransform]);

  // ── Quadra click ──────────────────────────────────────────────────────────
  const handleQuadraClick = React.useCallback((quadra: string) => {
    setSelectedQuadra(quadra);
    setSelectedLot(null);
    flyToQuadra(quadra);
    if (isMobile) setSheetState('half');
  }, [flyToQuadra, isMobile]);

  const handleLotClick = React.useCallback((lot: Lot) => {
    setSelectedLot(lot);
    flyToLot(lot);
    if (isMobile) setSheetState('full');
  }, [flyToLot, isMobile]);

  const handleClose = React.useCallback(() => {
    setSelectedLot(null);
    setSelectedQuadra(null);
    if (isMobile) setSheetState('hidden');
  }, [isMobile]);

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFullscreen = React.useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // ── MiniMap navigate ──────────────────────────────────────────────────────
  const handleMiniMapNavigate = React.useCallback((nx: number, ny: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const svgX = nx * SVG_W;
    const svgY = ny * SVG_H;
    const newX = rect.width / 2 - svgX * transformRef.current.scale;
    const newY = rect.height / 2 - svgY * transformRef.current.scale;
    animateTo(newX, newY, transformRef.current.scale, 300);
  }, [animateTo]);

  // ── Sheet heights ─────────────────────────────────────────────────────────
  const sheetHeights: Record<SheetState, string> = {
    hidden: '0px',
    peek: '80px',
    half: '52vh',
    full: '90vh',
  };

  // ── Quadra lots ───────────────────────────────────────────────────────────
  const selectedQuadraLots = React.useMemo(() =>
    selectedQuadra ? lots.filter(l => l.quadra === selectedQuadra) : [],
    [selectedQuadra, lots]
  );

  const selectedLotIntel = React.useMemo(() => {
    if (!selectedLot) return null;
    const qi = QUADRA_INTELLIGENCE[selectedLot.quadra as keyof typeof QUADRA_INTELLIGENCE];
    return computeLotIntelligence(selectedLot, qi);
  }, [selectedLot]);

  // ── Panel content ─────────────────────────────────────────────────────────
  const panelContent = selectedLot && selectedLotIntel ? (
    <SpatialIntelligencePanel lot={selectedLot} intel={selectedLotIntel} onClose={handleClose}
      onWhatsApp={() => {}} />
  ) : selectedQuadra ? (
    <QuadraPanelContent quadra={selectedQuadra} lots={selectedQuadraLots} filterKey={filterKey}
      onLotClick={handleLotClick} />
  ) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef}
      style={{ position: 'relative', width: '100%', height: isFullscreen ? '100vh' : '100svh',
        background: '#080D1A', overflow: 'hidden', userSelect: 'none', touchAction: 'none',
        fontFamily: "'Inter',sans-serif" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}>

      {/* SVG Canvas */}
      <svg ref={svgRef}
        width={SVG_W} height={SVG_H}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ position: 'absolute', top: 0, left: 0, transformOrigin: '0 0',
          willChange: 'transform' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}>

        <SVGDefs />

        {/* Background plant image */}
        <image href={IMAGE_URL} x={0} y={0} width={SVG_W} height={SVG_H}
          preserveAspectRatio="xMidYMid meet"
          style={{ imageRendering: 'crisp-edges' }} />

        {/* Vignette */}
        <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="url(#ab-vignette)" style={{ pointerEvents: 'none' }} />

        {/* Heatmap layer */}
        {heatmapMode !== 'none' && (
          <HeatmapLayer quadras={QUADRA_DATA} lots={lots} mode={heatmapMode} />
        )}

        {/* Quadra tiles */}
        {QUADRA_DATA.map(q => {
          const qLots = lots.filter(l => l.quadra === q.quadra);
          return (
            <QuadraTile key={q.quadra} quadra={q.quadra} geom={q.geometry} lots={qLots}
              isSelected={selectedQuadra === q.quadra} filterKey={filterKey} onClick={handleQuadraClick} />
          );
        })}

        {/* Lot grids — only when zoomed in enough */}
        {transformState.scale >= LOT_ZOOM_THRESHOLD / SVG_W && QUADRA_DATA.map(q => {
          const qLots = lots.filter(l => l.quadra === q.quadra);
          return (
            <LotGrid key={q.quadra} quadra={q.quadra} qdata={q} lots={qLots}
              selectedLotId={selectedLot?.id ?? null} filterKey={filterKey}
              onLotClick={handleLotClick} />
          );
        })}
      </svg>

      {/* Top controls */}
      <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 30, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          { icon: <ZoomIn size={14}/>, action: () => { const s = Math.min(MAX_SCALE, transformRef.current.scale * 1.35); const rect = containerRef.current!.getBoundingClientRect(); animateTo(rect.width/2 - (rect.width/2 - transformRef.current.x) * (s/transformRef.current.scale), rect.height/2 - (rect.height/2 - transformRef.current.y) * (s/transformRef.current.scale), s, 250); }, title: 'Zoom In' },
          { icon: <ZoomOut size={14}/>, action: () => { const s = Math.max(MIN_SCALE, transformRef.current.scale / 1.35); const rect = containerRef.current!.getBoundingClientRect(); animateTo(rect.width/2 - (rect.width/2 - transformRef.current.x) * (s/transformRef.current.scale), rect.height/2 - (rect.height/2 - transformRef.current.y) * (s/transformRef.current.scale), s, 250); }, title: 'Zoom Out' },
          { icon: <RotateCcw size={14}/>, action: resetView, title: 'Reset View' },
          { icon: isFullscreen ? <Minimize2 size={14}/> : <Maximize2 size={14}/>, action: toggleFullscreen, title: 'Fullscreen' },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} title={btn.title}
            style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(10,15,28,0.8)',
              border: '1px solid rgba(200,164,74,0.2)', cursor: 'pointer', color: 'rgba(240,237,232,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)', transition: 'all 0.15s' }}>
            {btn.icon}
          </button>
        ))}
      </div>

      {/* IMI badge */}
      <div style={{ position: 'absolute', top: 12, left: isMobile ? 12 : 276, zIndex: 30,
        background: 'rgba(10,15,28,0.85)', border: '1px solid rgba(200,164,74,0.25)',
        borderRadius: 10, padding: '8px 12px', backdropFilter: 'blur(10px)' }}>
        <div style={{ fontSize: 8, color: 'rgba(200,164,74,0.6)', fontFamily: "'JetBrains Mono',monospace",
          letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>IMI SPATIAL INTELLIGENCE</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#22C55E', fontFamily: "'JetBrains Mono',monospace" }}>{stats.disponivel}</div>
            <div style={{ fontSize: 8, color: 'rgba(240,237,232,0.4)' }}>disp.</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(240,237,232,0.5)', fontFamily: "'JetBrains Mono',monospace" }}>{stats.vendido}</div>
            <div style={{ fontSize: 8, color: 'rgba(240,237,232,0.4)' }}>vendidos</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#C8A44A', fontFamily: "'JetBrains Mono',monospace" }}>{stats.total}</div>
            <div style={{ fontSize: 8, color: 'rgba(240,237,232,0.4)' }}>total</div>
          </div>
        </div>
      </div>

      {/* Desktop left sidebar */}
      {!isMobile && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 260, zIndex: 25,
          background: 'rgba(8,13,26,0.92)', borderRight: '1px solid rgba(200,164,74,0.12)',
          backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Sidebar header */}
          <div style={{ padding: '20px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 8, color: 'rgba(200,164,74,0.55)', fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>ALTO BELLEVUE</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F0EDE8', letterSpacing: '-0.01em', marginBottom: 2 }}>
              Loteamento Premium
            </div>
            <div style={{ fontSize: 10, color: 'rgba(240,237,232,0.35)' }}>Garanhuns · Pernambuco</div>
          </div>

          {/* Heatmap controls */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 8, color: 'rgba(200,164,74,0.55)', fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>CAMADAS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {([
                ['none', 'Padrão', <Layers key="l" size={11}/>],
                ['pricePerM2', 'Preço/m²', <DollarSign key="d" size={11}/>],
                ['solar', 'Solar', <Sun key="s" size={11}/>],
                ['imiScore', 'IMI Score', <TrendingUp key="t" size={11}/>],
              ] as [HeatmapMode, string, React.ReactNode][]).map(([mode, label, icon]) => (
                <button key={mode} onClick={() => setHeatmapMode(mode)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                    background: heatmapMode === mode ? 'rgba(200,164,74,0.12)' : 'transparent',
                    border: `1px solid ${heatmapMode === mode ? 'rgba(200,164,74,0.3)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 6, cursor: 'pointer',
                    color: heatmapMode === mode ? '#C8A44A' : 'rgba(240,237,232,0.5)',
                    fontSize: 11, fontFamily: "'JetBrains Mono',monospace", transition: 'all 0.15s' }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 8, color: 'rgba(200,164,74,0.55)', fontFamily: "'JetBrains Mono',monospace",
              letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>FILTRAR</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {filterRows.map(row => (
                <button key={row.key} onClick={() => setFilterKey(row.key)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 8px', background: filterKey === row.key ? 'rgba(200,164,74,0.08)' : 'transparent',
                    border: `1px solid ${filterKey === row.key ? 'rgba(200,164,74,0.25)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {row.key !== 'ALL' && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: row.color }} />
                    )}
                    <span style={{ fontSize: 11, color: filterKey === row.key ? '#F0EDE8' : 'rgba(240,237,232,0.5)',
                      fontFamily: "'JetBrains Mono',monospace" }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: 10, color: filterKey === row.key ? '#C8A44A' : 'rgba(240,237,232,0.3)',
                    fontFamily: "'JetBrains Mono',monospace" }}>{row.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Panel area */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              {panelContent && (
                <motion.div key={selectedLot?.id ?? selectedQuadra ?? 'panel'}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{ height: '100%' }}>
                  {panelContent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer CTA */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <a href={`https://wa.me/5581997230455?text=${encodeURIComponent('Quero conhecer o Alto Bellevue')}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: 'linear-gradient(135deg,#22C55E,#16A34A)', borderRadius: 10, padding: '11px',
                color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(34,197,94,0.25)' }}>
              <MessageCircle size={14} /> WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* Desktop right panel */}
      {!isMobile && panelContent && (
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 340, zIndex: 25,
          background: 'rgba(8,13,26,0.92)', borderLeft: '1px solid rgba(200,164,74,0.12)',
          backdropFilter: 'blur(16px)' }}>
          <AnimatePresence mode="wait">
            <motion.div key={selectedLot?.id ?? selectedQuadra ?? 'rpanel'}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%' }}>
              {panelContent}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {isMobile && (
        <>
          {/* Peek bar */}
          {sheetState === 'hidden' && selectedQuadra && (
            <button onClick={() => setSheetState('peek')}
              style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
                zIndex: 35, background: 'rgba(10,15,28,0.9)', border: '1px solid rgba(200,164,74,0.25)',
                borderRadius: 24, padding: '10px 20px', color: '#C8A44A', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', backdropFilter: 'blur(12px)' }}>
              Quadra {selectedQuadra}
            </button>
          )}

          <motion.div
            style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
              background: 'rgba(8,13,26,0.97)', borderRadius: '20px 20px 0 0',
              borderTop: '1px solid rgba(200,164,74,0.2)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.6)', overflow: 'hidden' }}
            animate={{ height: sheetHeights[sheetState] }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}>

            {/* Drag handle */}
            <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center',
              cursor: 'pointer' }}
              onClick={() => {
                setSheetState(prev =>
                  prev === 'hidden' ? 'peek' :
                  prev === 'peek' ? 'half' :
                  prev === 'half' ? 'full' : 'hidden'
                );
              }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
            </div>

            {/* Sheet header */}
            <div style={{ padding: '4px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F0EDE8' }}>
                {selectedLot ? `Lote ${selectedLot.number}` : selectedQuadra ? `Quadra ${selectedQuadra}` : 'Alto Bellevue'}
              </div>
              {sheetState !== 'hidden' && (
                <button onClick={handleClose}
                  style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6,
                    padding: '4px 6px', cursor: 'pointer', color: 'rgba(240,237,232,0.5)',
                    display: 'flex', alignItems: 'center' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filters strip */}
            {!selectedQuadra && !selectedLot && (
              <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, overflowX: 'auto',
                scrollbarWidth: 'none' }}>
                {filterRows.map(row => (
                  <button key={row.key} onClick={() => setFilterKey(row.key)}
                    style={{ flexShrink: 0, padding: '5px 10px',
                      background: filterKey === row.key ? 'rgba(200,164,74,0.15)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${filterKey === row.key ? 'rgba(200,164,74,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 20, color: filterKey === row.key ? '#C8A44A' : 'rgba(240,237,232,0.5)',
                      fontSize: 11, cursor: 'pointer', fontFamily: "'JetBrains Mono',monospace",
                      whiteSpace: 'nowrap' }}>
                    {row.label} {row.count}
                  </button>
                ))}
              </div>
            )}

            {/* Panel content */}
            <div style={{ height: 'calc(100% - 80px)', overflow: 'hidden' }}>
              {panelContent}
            </div>
          </motion.div>
        </>
      )}

      {/* MiniMap */}
      {showMiniMap && !isMobile && (
        <MiniMap quadras={QUADRA_DATA} lots={lots} transform={transformState}
          viewportW={viewportSize.w} viewportH={viewportSize.h}
          svgW={SVG_W} svgH={SVG_H}
          onNavigate={handleMiniMapNavigate} />
      )}

      {/* CSS keyframes */}
      <style>{`
        @keyframes lotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.55; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,164,74,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}
