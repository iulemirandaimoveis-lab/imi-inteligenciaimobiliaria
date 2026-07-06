'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Building2, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { Development } from '../types/development';
import { motion, AnimatePresence } from 'framer-motion';

interface LotMapAmenity {
    id: string;
    title?: string;
    subtitle?: string;
    photos?: string[];
    video?: string;
}

interface DevelopmentGalleryProps {
    development: Development;
    lotMapAmenities?: LotMapAmenity[];
}

export default function DevelopmentGallery({ development, lotMapAmenities }: DevelopmentGalleryProps) {
    const allImages = [development.images.main, ...development.images.gallery].filter(Boolean) as string[];
    const hasImages = allImages.length > 0;
    const hasVideos = development.images.videos && development.images.videos.length > 0;
    const hasFloorPlans = development.images.floorPlans && development.images.floorPlans.length > 0;

    const [heroIndex, setHeroIndex] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [heroTouchStart, setHeroTouchStart] = useState<number | null>(null);
    const thumbStripRef = useRef<HTMLDivElement>(null);

    const closeLightbox = useCallback(() => setLightboxIndex(null), []);

    const prevImage = useCallback(() => {
        setLightboxIndex(i => i === null ? null : (i - 1 + allImages.length) % allImages.length);
    }, [allImages.length]);

    const nextImage = useCallback(() => {
        setLightboxIndex(i => i === null ? null : (i + 1) % allImages.length);
    }, [allImages.length]);

    const prevHero = useCallback(() => {
        setHeroIndex((i: number) => (i - 1 + allImages.length) % allImages.length);
    }, [allImages.length]);

    const nextHero = useCallback(() => {
        setHeroIndex((i: number) => (i + 1) % allImages.length);
    }, [allImages.length]);

    // Keyboard navigation
    useEffect(() => {
        if (lightboxIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIndex, closeLightbox, prevImage, nextImage]);

    // Auto-scroll thumbnail strip to keep active thumbnail visible
    useEffect(() => {
        if (lightboxIndex === null || !thumbStripRef.current) return;
        const container = thumbStripRef.current;
        const activeThumb = container.children[lightboxIndex] as HTMLElement | undefined;
        if (!activeThumb) return;
        const thumbLeft = activeThumb.offsetLeft;
        const thumbWidth = activeThumb.offsetWidth;
        const containerWidth = container.clientWidth;
        const scrollTarget = thumbLeft - containerWidth / 2 + thumbWidth / 2;
        container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }, [lightboxIndex]);

    // Prevent body scroll when lightbox is open
    useEffect(() => {
        if (lightboxIndex !== null) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [lightboxIndex]);

    const virtualTourUrl = development.images.virtualTour || '';
    const tourHost = (() => {
        try {
            return virtualTourUrl ? new URL(virtualTourUrl).hostname : '';
        } catch {
            return '';
        }
    })();
    // 360°/VR platforms work best in their own full-browser tab (gyroscope, WebXR).
    // Add any domain here that should show the "Abrir Tour Virtual" card instead of an iframe.
    const shouldOpenTourExternally = /(^|\.)tour\.panoee\.net$|(^|\.)kuula\.co$/i.test(tourHost);

    // For kuula.co: strip fs=1 (auto-fullscreen) and inst=pt (instructions overlay) to avoid
    // the black fullscreen instruction screen on mobile.
    const externalTourUrl = (() => {
        if (!virtualTourUrl || !/(^|\.)kuula\.co$/i.test(tourHost)) return virtualTourUrl;
        try {
            const u = new URL(virtualTourUrl);
            u.searchParams.set('fs', '0');
            u.searchParams.set('inst', '0');
            return u.toString();
        } catch {
            return virtualTourUrl;
        }
    })();

    return (
        <>
            <div className="space-y-8 sm:space-y-10 md:space-y-14">
                {/* Image Gallery */}
                <div>
                    <SectionTitle label="Galeria" />

                    {hasImages ? (
                        <div className="space-y-3">
                            {/* Hero image — navigable carousel */}
                            <div className="relative w-full aspect-[16/10] rounded-[14px] overflow-hidden bg-gray-100 group">
                                <AnimatePresence mode="wait" initial={false}>
                                    <motion.div
                                        key={heroIndex}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="absolute inset-0"
                                        onTouchStart={(e) => setHeroTouchStart(e.touches[0].clientX)}
                                        onTouchEnd={(e) => {
                                            if (heroTouchStart === null) return;
                                            const diff = heroTouchStart - e.changedTouches[0].clientX;
                                            if (Math.abs(diff) > 40) {
                                                if (diff > 0) setHeroIndex((i: number) => (i + 1) % allImages.length);
                                                else setHeroIndex((i: number) => (i - 1 + allImages.length) % allImages.length);
                                            }
                                            setHeroTouchStart(null);
                                        }}
                                    >
                                        <Image
                                            src={allImages[heroIndex]}
                                            alt={`${development.name} - Foto ${heroIndex + 1}`}
                                            fill
                                            className="object-cover"
                                            sizes="(max-width: 1024px) 100vw, 66vw"
                                            priority={heroIndex === 0}
                                        />
                                    </motion.div>
                                </AnimatePresence>

                                {/* Dark overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

                                {/* Prev arrow */}
                                {allImages.length > 1 && (
                                    <button
                                        onClick={e => { e.stopPropagation(); prevHero(); }}
                                        aria-label="Foto anterior"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95"
                                        style={{
                                            width: 48, height: 48,
                                            background: 'rgba(0,0,0,0.65)',
                                            border: '2px solid rgba(255,255,255,0.5)',
                                            backdropFilter: 'blur(8px)',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                        }}
                                    >
                                        <ChevronLeft size={26} color="#fff" strokeWidth={2.5} />
                                    </button>
                                )}

                                {/* Next arrow */}
                                {allImages.length > 1 && (
                                    <button
                                        onClick={e => { e.stopPropagation(); nextHero(); }}
                                        aria-label="Próxima foto"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95"
                                        style={{
                                            width: 48, height: 48,
                                            background: 'rgba(0,0,0,0.65)',
                                            border: '2px solid rgba(255,255,255,0.5)',
                                            backdropFilter: 'blur(8px)',
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                                        }}
                                    >
                                        <ChevronRight size={26} color="#fff" strokeWidth={2.5} />
                                    </button>
                                )}

                                {/* Bottom bar: counter + zoom button */}
                                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3 pt-6 pointer-events-none"
                                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)' }}>
                                    {/* Dot indicators */}
                                    {allImages.length > 1 && allImages.length <= 20 && (
                                        <div className="flex gap-1.5 pointer-events-auto">
                                            {allImages.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setHeroIndex(i)}
                                                    aria-label={`Foto ${i + 1}`}
                                                    style={{
                                                        width: i === heroIndex ? 20 : 7,
                                                        height: 7,
                                                        borderRadius: 4,
                                                        background: i === heroIndex ? '#C8A44A' : 'rgba(255,255,255,0.55)',
                                                        transition: 'all 0.25s ease',
                                                        border: 'none',
                                                        padding: 0,
                                                        cursor: 'pointer',
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Counter */}
                                    <div
                                        className="pointer-events-auto ml-auto flex items-center gap-2 cursor-pointer"
                                        onClick={() => setLightboxIndex(heroIndex)}
                                    >
                                        <span style={{
                                            background: 'rgba(0,0,0,0.7)',
                                            backdropFilter: 'blur(8px)',
                                            borderRadius: 6,
                                            padding: '5px 10px',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#fff',
                                            fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                        }}>
                                            <ZoomIn size={13} />
                                            {heroIndex + 1} / {allImages.length}
                                        </span>
                                    </div>
                                </div>

                                {/* Swipe hint — shown once on first render on mobile */}
                                {allImages.length > 1 && (
                                    <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none sm:hidden">
                                        <span style={{
                                            background: 'rgba(0,0,0,0.55)',
                                            backdropFilter: 'blur(6px)',
                                            borderRadius: 20,
                                            padding: '4px 12px',
                                            fontSize: 11,
                                            fontWeight: 600,
                                            color: 'rgba(255,255,255,0.85)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 5,
                                        }}>
                                            ← deslize para navegar →
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Remaining images — 2-col grid */}
                            {allImages.length > 1 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {allImages.slice(1, 9).map((img, idx) => (
                                        <motion.button
                                            key={idx}
                                            initial={{ opacity: 0, y: 12 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => { setHeroIndex(idx + 1); setLightboxIndex(idx + 1); }}
                                            className="relative aspect-[16/10] rounded-[10px] overflow-hidden bg-gray-100 group cursor-zoom-in"
                                        >
                                            <Image
                                                src={img}
                                                alt={`${development.name} - Foto ${idx + 2}`}
                                                fill
                                                loading="lazy"
                                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                sizes="(max-width: 768px) 50vw, 33vw"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                                <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" size={22} />
                                            </div>
                                            {/* Last thumbnail: show "ver todas" overlay */}
                                            {idx === 7 && allImages.length > 9 && (
                                                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.55)' }}>
                                                    <span className="text-white font-bold text-sm">+{allImages.length - 9} fotos</span>
                                                </div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Placeholder label="Imagens em breve" icon={<Building2 className="w-10 h-10 text-gray-200" strokeWidth={1} />} />
                    )}
                </div>

                {/* Videos */}
                {hasVideos && (
                    <div>
                        <SectionTitle label="Vídeo" />
                        <div className="space-y-3">
                            {development.images.videos.map((video, idx) => (
                                <VideoEmbed key={idx} src={video} title={`${development.name} — Vídeo ${idx + 1}`} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Floor Plans */}
                {hasFloorPlans && (
                    <div>
                        <SectionTitle label="Plantas" />
                        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-2 px-2 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0">
                            {development.images.floorPlans.map((plan, idx) => (
                                <div
                                    key={idx}
                                    className="relative flex-shrink-0 w-[85vw] sm:w-[70vw] lg:w-full aspect-[4/3] bg-white rounded-[14px] overflow-hidden snap-start border border-gray-100 p-6"
                                >
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={plan}
                                            alt={`${development.name} - Planta ${idx + 1}`}
                                            fill
                                            loading="lazy"
                                            className="object-contain"
                                            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 70vw, 100vw"
                                        />
                                    </div>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-[3px]">
                                        Planta {idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Common Areas */}
                {lotMapAmenities && lotMapAmenities.some(a => (a.photos && a.photos.length > 0) || a.video) && (
                    <div>
                        <SectionTitle label="Áreas Comuns" />
                        <div className="space-y-10">
                            {lotMapAmenities
                                .filter(a => (a.photos && a.photos.length > 0) || a.video)
                                .map(area => (
                                    <div key={area.id}>
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-0.5 h-4 rounded-full flex-shrink-0" style={{ background: '#C8A44A' }} />
                                            <h3 className="text-base font-bold text-gray-800" style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                                {area.title || area.id}
                                            </h3>
                                        </div>
                                        {area.photos && area.photos.length > 0 && (
                                            <div className={`grid gap-3 mb-4 ${area.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                                {area.photos.map((photo, idx) => (
                                                    <div key={idx} className="relative aspect-[16/10] rounded-[10px] overflow-hidden bg-gray-100">
                                                        <Image
                                                            src={photo}
                                                            alt={`${area.title || area.id} - foto ${idx + 1}`}
                                                            fill
                                                            loading="lazy"
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 50vw, 33vw"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {area.video && (
                                            <VideoEmbed src={area.video} title={area.title || area.id} />
                                        )}
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                )}

                {/* Virtual Tour */}
                {development.images.virtualTour && (
                    <div>
                        <SectionTitle label="Tour Virtual 360°" />
                        {shouldOpenTourExternally ? (
                            <div
                                className="relative w-full rounded-[16px] overflow-hidden"
                                style={{
                                    background: 'linear-gradient(135deg, #0B1928 0%, #0f2438 50%, #0B1928 100%)',
                                    border: '1px solid rgba(200,164,74,0.18)',
                                    boxShadow: '0 8px 40px rgba(0,0,0,0.28)',
                                }}
                            >
                                {/* Decorative grid overlay */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        backgroundImage: 'linear-gradient(rgba(200,164,74,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(200,164,74,0.04) 1px, transparent 1px)',
                                        backgroundSize: '32px 32px',
                                    }}
                                />
                                {/* Gold accent line top */}
                                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)' }} />

                                <div className="relative p-5 sm:p-7 md:p-10">
                                    {/* Top row: icon + badge (always horizontal) */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div
                                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'rgba(200,164,74,0.10)', border: '1px solid rgba(200,164,74,0.22)' }}
                                        >
                                            <svg viewBox="0 0 24 24" fill="none" stroke="#C8A44A" strokeWidth="1.5" width="28" height="28" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                                            </svg>
                                        </div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-emerald-400 text-[11px] font-bold uppercase tracking-widest">Tour Interativo</span>
                                        </div>
                                    </div>

                                    {/* Text + button layout: stacked on mobile, row on sm+ */}
                                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white text-xl sm:text-2xl font-bold mb-2" style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                                Explore o imóvel em 360°
                                            </h3>
                                            <p className="text-white/55 text-sm leading-relaxed">
                                                Navegue por todos os ambientes com total imersão — abre em uma página dedicada para a melhor experiência.
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 w-full sm:w-auto">
                                            <a
                                                href={externalTourUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative flex sm:inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden w-full sm:w-auto"
                                                style={{ background: '#C8A44A', color: '#0B1928', boxShadow: '0 4px 20px rgba(200,164,74,0.35)' }}
                                            >
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                                </svg>
                                                Abrir Tour Virtual
                                                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-xl" />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* Gold accent line bottom */}
                                <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(200,164,74,0.3), transparent)' }} />
                            </div>
                        ) : (
                            <div className="relative w-full aspect-video md:h-[480px] rounded-[14px] overflow-hidden shadow-lg" style={{ border: '1px solid rgba(200,164,74,0.15)' }}>
                                <iframe
                                    src={development.images.virtualTour}
                                    className="w-full h-full border-0"
                                    allowFullScreen
                                    allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen; autoplay"
                                />
                                <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.10)' }}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-white text-[11px] font-bold uppercase tracking-widest">Tour Interativo</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Lightbox ── */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                        onClick={closeLightbox}
                    >
                        {/* Close */}
                        <button
                            className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center rounded-full text-white transition-colors z-10"
                            style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.4)' }}
                            onClick={closeLightbox}
                            aria-label="Fechar galeria"
                        >
                            <X size={22} />
                        </button>

                        {/* Counter */}
                        <div
                            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 tabular-nums font-bold"
                            style={{
                                background: 'rgba(0,0,0,0.6)',
                                border: '1.5px solid rgba(255,255,255,0.25)',
                                borderRadius: 8,
                                padding: '6px 16px',
                                fontSize: 14,
                                color: '#fff',
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            {lightboxIndex + 1} / {allImages.length}
                        </div>

                        {/* Prev */}
                        {allImages.length > 1 && (
                            <button
                                className="absolute left-3 sm:left-5 z-10 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95"
                                style={{
                                    width: 56, height: 56,
                                    background: 'rgba(0,0,0,0.7)',
                                    border: '2.5px solid rgba(255,255,255,0.55)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(8px)',
                                }}
                                onClick={e => { e.stopPropagation(); prevImage(); }}
                                aria-label="Foto anterior"
                            >
                                <ChevronLeft size={30} color="#fff" strokeWidth={2.5} />
                            </button>
                        )}

                        {/* Image container */}
                        <motion.div
                            key={lightboxIndex}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.18 }}
                            className="relative w-full h-full"
                            style={{ maxWidth: '90vw', maxHeight: allImages.length > 1 ? '75vh' : '85vh', margin: '0 auto' }}
                            onClick={e => e.stopPropagation()}
                            onTouchStart={e => setTouchStart(e.touches[0].clientX)}
                            onTouchEnd={e => {
                                if (touchStart === null) return;
                                const diff = touchStart - e.changedTouches[0].clientX;
                                if (Math.abs(diff) > 40) {
                                    if (diff > 0) nextImage();
                                    else prevImage();
                                }
                                setTouchStart(null);
                            }}
                        >
                            <Image
                                src={allImages[lightboxIndex]}
                                alt={`${development.name} - ${lightboxIndex + 1}`}
                                fill
                                className="object-contain"
                                sizes="90vw"
                                priority
                            />
                        </motion.div>

                        {/* Next */}
                        {allImages.length > 1 && (
                            <button
                                className="absolute right-3 sm:right-5 z-10 flex items-center justify-center rounded-full transition-all duration-200 active:scale-95"
                                style={{
                                    width: 56, height: 56,
                                    background: 'rgba(0,0,0,0.7)',
                                    border: '2.5px solid rgba(255,255,255,0.55)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                    backdropFilter: 'blur(8px)',
                                }}
                                onClick={e => { e.stopPropagation(); nextImage(); }}
                                aria-label="Próxima foto"
                            >
                                <ChevronRight size={30} color="#fff" strokeWidth={2.5} />
                            </button>
                        )}

                        {/* Swipe hint for mobile */}
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 sm:hidden pointer-events-none">
                            <span style={{
                                background: 'rgba(0,0,0,0.5)',
                                borderRadius: 20,
                                padding: '5px 14px',
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'rgba(255,255,255,0.7)',
                            }}>
                                ← deslize para navegar →
                            </span>
                        </div>

                        {/* Thumbnail strip */}
                        {allImages.length > 1 && (
                            <div
                                className="absolute bottom-0 left-0 right-0 z-10 flex justify-center"
                                style={{ paddingBottom: 16, paddingTop: 12, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div
                                    ref={thumbStripRef}
                                    className="flex gap-2 overflow-x-auto px-4"
                                    style={{ maxWidth: 'min(90vw, 680px)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {allImages.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setLightboxIndex(i)}
                                            aria-label={`Ir para imagem ${i + 1}`}
                                            className="relative flex-shrink-0 rounded-md overflow-hidden transition-all duration-200"
                                            style={{
                                                width: 64,
                                                height: 52,
                                                border: i === lightboxIndex ? '2.5px solid #C8A44A' : '2px solid rgba(255,255,255,0.2)',
                                                opacity: i === lightboxIndex ? 1 : 0.55,
                                                transform: i === lightboxIndex ? 'scale(1.08)' : 'scale(1)',
                                            }}
                                        >
                                            <Image
                                                src={img}
                                                alt={`Miniatura ${i + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="64px"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

/** Extract a YouTube video ID from any YouTube URL variant (watch, youtu.be, shorts, embed) */
function getYouTubeId(url: string): string | null {
    const patterns = [
        /youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/,
        /youtu\.be\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
    }
    return null;
}

/** Normalise any YouTube or Vimeo URL to an embeddable form */
function normalizeVideoUrl(url: string): string {
    const ytId = getYouTubeId(url);
    if (ytId) return `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`;

    const vimeo = url.match(/(?:vimeo\.com\/)(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

    return url;
}

/** Click-to-play video embed with branded IMI placeholder */
function VideoEmbed({ src, title }: { src: string; title: string }) {
    const [playing, setPlaying] = useState(false);
    const embedUrl = normalizeVideoUrl(src);
    const ytId = getYouTubeId(src);
    const thumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null;

    if (playing) {
        return (
            <div className="aspect-video rounded-[14px] overflow-hidden shadow-lg" style={{ border: '1px solid rgba(200,164,74,0.12)' }}>
                <iframe
                    src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}autoplay=1`}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={title}
                />
            </div>
        );
    }

    return (
        <button
            type="button"
            onClick={() => setPlaying(true)}
            className="relative w-full aspect-video rounded-[14px] overflow-hidden group cursor-pointer block text-left"
            style={{ border: '1px solid rgba(200,164,74,0.12)' }}
            aria-label={`Reproduzir: ${title}`}
        >
            {/* Thumbnail or brand placeholder */}
            {thumbnail ? (
                <img
                    src={thumbnail}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0B1928 0%, #142840 100%)' }}>
                    <Building2 className="w-12 h-12" style={{ color: 'rgba(200,164,74,0.2)' }} strokeWidth={1} />
                </div>
            )}

            {/* Dark overlay */}
            <div className="absolute inset-0 transition-all duration-300" style={{ background: thumbnail ? 'rgba(5,11,20,0.45)' : 'rgba(5,11,20,0.0)' }} />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'rgba(5,11,20,0.25)' }} />

            {/* Gold play button */}
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ background: '#C8A44A', boxShadow: '0 8px 32px rgba(200,164,74,0.45)' }}
                >
                    <svg viewBox="0 0 24 24" fill="#0B1928" width="22" height="22" style={{ marginLeft: 3 }} aria-hidden="true">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                </div>
            </div>

            {/* Title label */}
            <div
                className="absolute bottom-3 left-4 right-4 flex items-center gap-2"
                style={{ fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
            >
                <span className="text-xs font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{title}</span>
            </div>
        </button>
    );
}

function SectionTitle({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-1 h-6 rounded-full" style={{ background: '#C8A44A' }} />
            <h2 className="text-xl text-gray-900 font-bold tracking-tight" style={{ fontFamily: "var(--font-body, 'Outfit', sans-serif)" }}>
                {label}
            </h2>
        </div>
    );
}

function Placeholder({ label, icon }: { label: string; icon: React.ReactNode }) {
    return (
        <div className="aspect-video bg-gray-50 rounded-[14px] flex items-center justify-center border border-gray-200 border-dashed">
            <div className="text-center">
                {icon}
                <p className="text-gray-400 font-medium mt-3 text-sm">{label}</p>
            </div>
        </div>
    );
}
