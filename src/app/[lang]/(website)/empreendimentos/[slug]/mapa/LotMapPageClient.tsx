'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, LayoutDashboard, Users } from 'lucide-react';
import InteractiveLotMap from '@/components/maps/InteractiveLotMap';

const BG   = '#05080F';
const T1   = '#E8E4DC';
const T2   = '#8E99AB';
const T3   = '#4F5B6B';
const GOLD = '#C8A44A';
const BORD = 'rgba(200,164,74,0.14)';

interface LotMapPageClientProps {
  lang: string;
  slug: string;
  developmentId: string;
  developmentName: string;
  mapJsonUrl: string;
  whatsappContact?: string;
  isManagerSSR?: boolean;
}

export default function LotMapPageClient({
  lang, slug, developmentId, developmentName, mapJsonUrl, whatsappContact, isManagerSSR,
}: LotMapPageClientProps) {
  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>

      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(5,8,15,0.96)', backdropFilter: 'blur(28px)',
        borderBottom: `1px solid ${BORD}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 56, padding: '0 16px' }}>
          <Link
            href={`/${lang}/empreendimentos/${slug}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
              color: T2, textDecoration: 'none',
            }}
            aria-label="Voltar"
          >
            <ArrowLeft size={16} />
          </Link>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T1, letterSpacing: '-0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {developmentName}
            </div>
            <div style={{ fontSize: 10, color: T3, letterSpacing: '1px', textTransform: 'uppercase' }}>
              Mapa Operacional
            </div>
          </div>

          {/* CRM access links (visible to everyone — auth is enforced in each page) */}
          <div style={{ display: 'flex', gap: 6, shrink: 0 }}>
            <Link
              href={`/${lang}/empreendimentos/${slug}/crm`}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px',
                borderRadius: 8,
                background: 'rgba(200,164,74,0.06)', border: `1px solid rgba(200,164,74,0.20)`,
                color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
                textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              <Users size={12} /> CRM
            </Link>
            {isManagerSSR && (
              <Link
                href={`/${lang}/empreendimentos/${slug}/dashboard`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, height: 32, padding: '0 10px',
                  borderRadius: 8,
                  background: 'rgba(200,164,74,0.06)', border: `1px solid rgba(200,164,74,0.20)`,
                  color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                <LayoutDashboard size={12} /> Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ flex: 1, padding: '12px 12px 24px' }}>
        {developmentId ? (
          <InteractiveLotMap
            developmentId={developmentId}
            lotMapJsonUrl={mapJsonUrl}
            whatsappContact={whatsappContact}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12, color: T3 }}>
            <p style={{ fontSize: 14 }}>Mapa ainda não disponível para este empreendimento.</p>
            <Link href={`/${lang}/empreendimentos/${slug}`} style={{ color: GOLD, textDecoration: 'none', fontSize: 12 }}>
              Ver página do empreendimento →
            </Link>
          </div>
        )}
      </div>

      {/* ── Legend footer ── */}
      <div style={{
        position: 'sticky', bottom: 0, background: 'rgba(5,8,15,0.95)', backdropFilter: 'blur(16px)',
        borderTop: `1px solid ${BORD}`, padding: '8px 16px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center',
      }}>
        {[
          { color: '#4ADE80', label: 'Disponível'  },
          { color: '#FBBF24', label: 'Negociação'  },
          { color: '#FB923C', label: 'Reservado'   },
          { color: '#60A5FA', label: 'Documentação'},
          { color: '#F87171', label: 'Vendido'     },
          { color: '#94A3B8', label: 'Bloqueado'   },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: T3, textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
