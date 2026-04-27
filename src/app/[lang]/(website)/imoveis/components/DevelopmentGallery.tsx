'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Building2, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { Development } from '../types/development';
import { motion, AnimatePresence } from 'framer-motion';

interface DevelopmentGalleryProps {
    development: Development;
}

export default function DevelopmentGallery({ development }: DevelopmentGalleryProps) {
    const allImages = [development.images.main, ...development.images.gallery].filter(Boolean) as string[];
    const hasImages = allImages.length > 0;
    const hasVideos = development.images.videos && development.images.videos.length > 0;
    const hasFloorPlans = development.images.floorPlans && development.images.floorPlans.length > 0;

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const thumbStripRef = useRef<HTMLDivElement>(null);

    const closeLightbox = useCallback(() => setLightboxIndex(null), []);

    const prevImage = useCallback(() => {
        setLightboxIndex(i => i === null ? null : (i - 1 + allImages.length) % allImages.length);
    }, [allImages.length]);

    const nextImage = useCallback(() => {
        setLightboxIndex(i => i === null ? null : (i + 1) % allImages.length);
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

    return (
        <>
            <div className="space-y-14">
                {/* Image Gallery */}
                <div>
                    <SectionTitle label="Galeria" />

                    {hasImages ? (
                        <div className="space-y-3">
                            {/* Hero image — full width */}
                            <motion.button
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                onClick={() => setLightboxIndex(0)}
                                className="relative w-full aspect-[16/10] rounded-[14px] overflow-hidden bg-gray-100 group block cursor-zoom-in"
                                onTouchStart={e => setTouchStart(e.touches[0].clientX)}
                                onTouchEnd={e => {
                                    if (touchStart === null) return
                                    const diff = touchStart - e.changedTouches[0].clientX
                                    if (Math.abs(diff) > 50) {
                                        e.preventDefault()
                                        if (diff > 0) setLightboxIndex(Math.min(allImages.length - 1, 1))
                                        else setLightboxIndex(allImages.length - 1)
                                    }
                                    setTouchStart(null)
                                }}
                            >
                                <Image
                                    src={allImages[0]}
                                    alt={`${development.name} - Principal`}
                                    fill
                                    className="object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                                    sizes="(max-width: 1024px) 100vw, 66vw"
                                    priority
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" size={32} />
                                </div>
                                {/* Photo counter overlay */}
                                <div style={{
                                    position: 'absolute', bottom: 12, right: 12, zIndex: 10,
                                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                                    borderRadius: 4, padding: '6px 12px',
                                    fontSize: 11, fontWeight: 600, color: '#fff',
                                    fontFamily: "var(--fm, 'JetBrains Mono', monospace)",
                                }}>
                                    1 / {allImages.length}
                                </div>
                            </motion.button>

                            {/* Remaining images — 2-col grid */}
                            {allImages.length > 1 && (
                                <div className="grid grid-cols-2 gap-3">
                                    {allImages.slice(1).map((img, idx) => (
                                        <motion.button
                                            key={idx}
                                            initial={{ opacity: 0, y: 12 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setLightboxIndex(idx + 1)}
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

                {/* Virtual Tour */}
                {development.images.virtualTour && (
                    <div>
                        <SectionTitle label="Tour Virtual 360°" />
                        <div className="relative w-full aspect-video md:h-[480px] rounded-[14px] overflow-hidden border border-gray-100 shadow-lg">
                            <iframe
                                src={development.images.virtualTour}
                                className="w-full h-full border-0"
                                allowFullScreen
                            />
                            <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur text-white px-4 py-2 rounded-[4px] flex items-center gap-2.5 text-xs font-semibold">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Tour Interativo
                            </div>
                        </div>
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
                        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
                        onClick={closeLightbox}
                    >
                        {/* Close */}
                        <button
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                            onClick={closeLightbox}
                            aria-label="Fechar galeria"
                        >
                            <X size={20} />
                        </button>

                        {/* Counter */}
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium z-10 tabular-nums">
                            {lightboxIndex + 1} / {allImages.length}
                        </div>

                        {/* Prev */}
                        {allImages.length > 1 && (
                            <button
                                className="absolute left-3 sm:left-5 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                                onClick={e => { e.stopPropagation(); prevImage(); }}
                                aria-label="Foto anterior"
                            >
                                <ChevronLeft size={22} />
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
                                if (touchStart === null) return
                                const diff = touchStart - e.changedTouches[0].clientX
                                if (Math.abs(diff) > 50) {
                                    if (diff > 0) nextImage()
                                    else prevImage()
                                }
                                setTouchStart(null)
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
                                className="absolute right-3 sm:right-5 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                                onClick={e => { e.stopPropagation(); nextImage(); }}
                                aria-label="Próxima foto"
                            >
                                <ChevronRight size={22} />
                            </button>
                        )}

                        {/* Thumbnail strip */}
                        {allImages.length > 1 && (
                            <div
                                className="absolute bottom-0 left-0 right-0 z-10 flex justify-center"
                                style={{ paddingBottom: 16, paddingTop: 12, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
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
                                                width: 60,
                                                height: 48,
                                                border: i === lightboxIndex ? '2px solid #C8A44A' : '2px solid transparent',
                                                opacity: i === lightboxIndex ? 1 : 0.5,
                                            }}
                                        >
                                            <Image
                                                src={img}
                                                alt={`Miniatura ${i + 1}`}
                                                fill
                                                className="object-cover"
                                                sizes="60px"
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
        <div className="flex items-center gap-3 mb-6">
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
