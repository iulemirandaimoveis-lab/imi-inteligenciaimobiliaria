'use client';

import { useState } from 'react';
import type { AmenityPoint } from './useLotMap';

interface AmenityLayerProps {
  amenities: AmenityPoint[];
  scale: number;
  onAmenityClick?: (id: string) => void;
}

const ICON_R = 14; // base radius in SVG units

export default function AmenityLayer({ amenities, scale, onAmenityClick }: AmenityLayerProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const r = Math.max(8, ICON_R / Math.sqrt(scale));

  return (
    <g className="amenity-layer" role="list" aria-label="Pontos de lazer">
      {amenities.map(a => (
        <g
          key={a.id}
          role="button"
          aria-label={`Ver mídias: ${a.label}`}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setHovered(a.id)}
          onMouseLeave={() => setHovered(null)}
          onClick={(e) => { e.stopPropagation(); onAmenityClick?.(a.id); }}
        >
          {/* Glow ring when hovered */}
          {hovered === a.id && (
            <circle cx={a.x} cy={a.y} r={r + 6} fill={a.color} opacity={0.25} />
          )}

          {/* Icon background */}
          <circle
            cx={a.x}
            cy={a.y}
            r={r}
            fill={a.color}
            stroke="#fff"
            strokeWidth={1.5}
            opacity={0.95}
          />

          {/* Emoji icon — rendered as foreignObject for full emoji support */}
          <text
            x={a.x}
            y={a.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={r * 1.1}
            style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            {a.icon}
          </text>

          {/* Tooltip */}
          {hovered === a.id && (
            <g>
              <rect
                x={a.x - 60}
                y={a.y - r - 28}
                width={120}
                height={22}
                rx={4}
                fill="rgba(0,0,0,0.82)"
              />
              <text
                x={a.x}
                y={a.y - r - 14}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fill="#fff"
                fontFamily="var(--font-outfit, sans-serif)"
                style={{ pointerEvents: 'none' }}
              >
                {a.label}
              </text>
            </g>
          )}
        </g>
      ))}
    </g>
  );
}
