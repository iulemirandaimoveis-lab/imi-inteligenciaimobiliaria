'use client';

/**
 * Tour virtual 360° do Digital Twin (namespace isolado).
 * Plataformas 360°/VR (Kuula, Panoee) abrem em aba dedicada; demais usam iframe.
 * A URL canônica do tour é IMUTÁVEL — apenas parâmetros de exibição são ajustados
 * pelo adaptador (resolveTour).
 */
import { ExternalLink, Globe } from 'lucide-react';
import { resolveTour } from '@/lib/digital-twin/media-adapter';

interface Props {
  url: string;
}

export default function DigitalTwinTour({ url }: Props) {
  const tour = resolveTour(url);
  if (!tour) return null;

  if (!tour.external) {
    return (
      <div className="relative w-full aspect-video md:h-[460px] rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(200,164,74,0.15)' }}>
        <iframe
          src={tour.url}
          className="w-full h-full border-0"
          allowFullScreen
          allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen; autoplay"
          title="Tour Virtual 360°"
        />
      </div>
    );
  }

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#0B1928 0%,#0f2438 50%,#0B1928 100%)', border: '1px solid rgba(200,164,74,0.18)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg,transparent,#C8A44A,transparent)' }} />
      <div className="relative p-6 sm:p-9 flex flex-col sm:flex-row sm:items-end gap-5">
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">Tour Interativo</span>
          </div>
          <h3 className="text-white text-xl sm:text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Explore em 360°
          </h3>
          <p className="text-white/55 text-sm leading-relaxed max-w-md">
            Navegue por todos os ambientes com total imersão — abre em uma página dedicada para a melhor experiência.
          </p>
        </div>
        <a
          href={tour.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
          style={{ background: '#C8A44A', color: '#0B1928', boxShadow: '0 4px 20px rgba(200,164,74,0.35)' }}
        >
          <Globe size={15} />
          Abrir Tour Virtual
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
