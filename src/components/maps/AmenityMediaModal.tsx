'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AmenityPoint } from './useLotMap';

export interface AmenityMediaData {
  id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  photos?: string[];
  videos?: string[];
  video?: string;
  tour360?: string;
}

interface AmenityMediaModalProps {
  amenity: AmenityPoint | null;
  media: AmenityMediaData | undefined;
  onClose: () => void;
}

const NAVY = '#05080F';
const GOLD = '#C8A44A';
const GOLD_B = 'rgba(200,164,74,0.18)';
const T1 = '#E8E4DC';
const T2 = '#8E99AB';
const T3 = '#4F5B6B';
const FS = "var(--font-ui, system-ui, sans-serif)";

export default function AmenityMediaModal({ amenity, media, onClose }: AmenityMediaModalProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (lightboxIdx !== null) setLightboxIdx(null);
      else onClose();
    }
    if (lightboxIdx !== null) {
      const photos = media?.photos ?? [];
      if (e.key === 'ArrowRight' && lightboxIdx < photos.length - 1) setLightboxIdx(i => (i ?? 0) + 1);
      if (e.key === 'ArrowLeft' && lightboxIdx > 0) setLightboxIdx(i => (i ?? 1) - 1);
    }
  }, [lightboxIdx, onClose, media?.photos]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!amenity) return null;

  const title = media?.title || amenity.label;
  const subtitle = media?.subtitle;
  const description = media?.description;
  const photos = media?.photos ?? [];
  const videos = media?.videos ?? [];
  const embedVideo = media?.video;
  const tour360 = media?.tour360;
  const hasContent = photos.length > 0 || videos.length > 0 || embedVideo || tour360 || description;

  // ── Lightbox ──────────────────────────────────────────────────────────────
  if (lightboxIdx !== null) {
    const url = photos[lightboxIdx];
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.97)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={() => setLightboxIdx(null)}
      >
        <button
          onClick={() => setLightboxIdx(null)}
          aria-label="Fechar"
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 61,
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <X size={18} strokeWidth={2} />
        </button>

        {lightboxIdx > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i ?? 1) - 1); }}
            aria-label="Foto anterior"
            style={{
              position: 'absolute', left: 12, zIndex: 61,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
        )}

        {lightboxIdx < photos.length - 1 && (
          <button
            onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i ?? 0) + 1); }}
            aria-label="Próxima foto"
            style={{
              position: 'absolute', right: 12, zIndex: 61,
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ChevronRight size={22} strokeWidth={2} />
          </button>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={`${title} — foto ${lightboxIdx + 1}`}
          onClick={e => e.stopPropagation()}
          style={{
            maxWidth: '92vw', maxHeight: '88vh',
            objectFit: 'contain', borderRadius: 8,
            boxShadow: '0 8px 48px rgba(0,0,0,0.8)',
          }}
        />

        <div style={{
          position: 'absolute', bottom: 20,
          fontSize: 12, color: 'rgba(255,255,255,0.45)',
          fontFamily: FS, letterSpacing: '0.5px',
        }}>
          {lightboxIdx + 1} / {photos.length}
        </div>
      </div>
    );
  }

  // ── Main modal ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : '20px',
        fontFamily: FS,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: NAVY,
          border: `1px solid ${GOLD_B}`,
          borderRadius: isMobile ? '20px 20px 0 0' : '20px',
          width: '100%',
          maxWidth: isMobile ? undefined : 560,
          maxHeight: isMobile ? '90vh' : '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,164,74,0.08)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 16px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
          flexShrink: 0,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: `${amenity.color}20`,
            border: `1.5px solid ${amenity.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {amenity.icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: T1, letterSpacing: '-0.3px', lineHeight: 1.25 }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: T2, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {subtitle}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: T2, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              transition: 'all .15s',
            }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '16px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>

          {/* Description */}
          {description && (
            <p style={{ fontSize: 14, color: T2, lineHeight: 1.65, margin: 0 }}>
              {description}
            </p>
          )}

          {/* Photo gallery */}
          {photos.length > 0 && (
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', color: T3,
                marginBottom: 10, margin: '0 0 10px',
              }}>
                Fotos · {photos.length}
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 8,
              }}>
                {photos.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIdx(i)}
                    style={{
                      border: 'none', padding: 0,
                      cursor: 'pointer', borderRadius: 10, overflow: 'hidden',
                      aspectRatio: '4/3', display: 'block',
                      transition: 'opacity .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.82')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    aria-label={`Ver foto ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${title} — foto ${i + 1}`}
                      style={{
                        width: '100%', height: '100%',
                        objectFit: 'cover', display: 'block',
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded videos */}
          {videos.length > 0 && (
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', color: T3,
                marginBottom: 10, margin: '0 0 10px',
              }}>
                Vídeos · {videos.length}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {videos.map((url, i) => (
                  <video
                    key={i}
                    src={url}
                    controls
                    preload="metadata"
                    style={{
                      width: '100%', borderRadius: 10,
                      background: '#000',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'block',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Embed video (YouTube / Vimeo URL) */}
          {embedVideo && (
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', color: T3,
                marginBottom: 10, margin: '0 0 10px',
              }}>
                Vídeo
              </p>
              <div style={{
                borderRadius: 10, overflow: 'hidden',
                position: 'relative', paddingTop: '56.25%',
                background: '#000',
              }}>
                <iframe
                  src={embedVideo}
                  title={`${title} — vídeo`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%', border: 0,
                  }}
                />
              </div>
            </div>
          )}

          {/* 360° tour */}
          {tour360 && (
            <div>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', color: T3,
                marginBottom: 10, margin: '0 0 10px',
              }}>
                Tour Virtual 360°
              </p>
              <a
                href={tour360}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(200,164,74,0.07)',
                  border: `1px solid ${GOLD_B}`,
                  color: GOLD, textDecoration: 'none',
                  fontSize: 13, fontWeight: 600,
                  transition: 'all .18s',
                }}
              >
                <Globe size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                Abrir Tour 360°
              </a>
            </div>
          )}

          {/* Empty state */}
          {!hasContent && (
            <div style={{
              textAlign: 'center', padding: '48px 20px',
              color: T3, fontSize: 13, lineHeight: 1.6,
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{amenity.icon}</div>
              Nenhuma mídia adicionada para esta área ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
