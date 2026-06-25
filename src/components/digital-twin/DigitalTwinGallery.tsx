'use client';

/**
 * Galeria de fotos do Digital Twin (namespace isolado).
 *
 * Resiliente a "uploads inconsistentes": usa <img> com onError para ocultar imagens
 * quebradas (links mortos / storage inconsistente) em vez de mostrar ícone quebrado.
 * Hero navegável + grade + lightbox com teclado.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ImageOff } from 'lucide-react';

interface Props {
  photos: string[];
  title: string;
}

export default function DigitalTwinGallery({ photos, title }: Props) {
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const visible = useMemo(() => photos.filter((p) => !broken.has(p)), [photos, broken]);

  const [hero, setHero] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const markBroken = useCallback((src: string) => {
    setBroken((prev) => {
      const next = new Set(prev);
      next.add(src);
      return next;
    });
  }, []);

  const count = visible.length;
  const safeHero = count > 0 ? Math.min(hero, count - 1) : 0;

  const close = useCallback(() => setLightbox(null), []);
  const prev = useCallback(() => setLightbox((i) => (i === null ? null : (i - 1 + count) % count)), [count]);
  const next = useCallback(() => setLightbox((i) => (i === null ? null : (i + 1) % count)), [count]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [lightbox, close, prev, next]);

  if (count === 0) {
    return (
      <div className="aspect-video rounded-2xl flex items-center justify-center border border-dashed border-[#E0D8CC] bg-[#FBF8F3]">
        <div className="text-center text-[#B8B3A8]">
          <ImageOff size={36} className="mx-auto mb-3" strokeWidth={1.2} />
          <p className="text-sm font-medium">Imagens em breve</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-[#0B1928]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={visible[safeHero]}
            alt={`${title} — foto ${safeHero + 1}`}
            className="w-full h-full object-cover"
            onError={() => markBroken(visible[safeHero])}
          />
          {count > 1 && (
            <>
              <button
                onClick={() => setHero((i) => (i - 1 + count) % count)}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.5)' }}
              >
                <ChevronLeft size={24} color="#fff" />
              </button>
              <button
                onClick={() => setHero((i) => (i + 1) % count)}
                aria-label="Próxima foto"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.5)' }}
              >
                <ChevronRight size={24} color="#fff" />
              </button>
            </>
          )}
          <button
            onClick={() => setLightbox(safeHero)}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-md text-white text-xs font-bold"
            style={{ background: 'rgba(0,0,0,0.7)' }}
          >
            <ZoomIn size={13} />
            {safeHero + 1} / {count}
          </button>
        </div>

        {count > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {visible.slice(0, 12).map((img, i) => (
              <button
                key={img}
                onClick={() => { setHero(i); setLightbox(i); }}
                className="relative aspect-square rounded-lg overflow-hidden bg-[#0B1928] cursor-zoom-in"
                aria-label={`Abrir foto ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={`${title} — miniatura ${i + 1}`} loading="lazy" className="w-full h-full object-cover" onError={() => markBroken(img)} />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={close}
        >
          <button onClick={close} aria-label="Fechar galeria" className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)' }}>
            <X size={22} />
          </button>
          {count > 1 && (
            <button onClick={(e) => { e.stopPropagation(); prev(); }} aria-label="Foto anterior" className="absolute left-4 w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.7)', border: '2px solid rgba(255,255,255,0.5)' }}>
              <ChevronLeft size={28} color="#fff" />
            </button>
          )}
          <div className="relative max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={visible[lightbox]} alt={`${title} — ${lightbox + 1}`} className="max-w-[90vw] max-h-[85vh] object-contain" onError={() => markBroken(visible[lightbox])} />
          </div>
          {count > 1 && (
            <button onClick={(e) => { e.stopPropagation(); next(); }} aria-label="Próxima foto" className="absolute right-4 w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ background: 'rgba(0,0,0,0.7)', border: '2px solid rgba(255,255,255,0.5)' }}>
              <ChevronRight size={28} color="#fff" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
