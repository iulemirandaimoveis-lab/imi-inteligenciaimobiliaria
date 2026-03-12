'use client';

import Image from 'next/image';
import { useState, useCallback, useEffect } from 'react';
import { Building2, MapPin, Calendar, FileText, Bed, Ruler, Share2, Camera, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Development } from '../types/development';
import { motion, AnimatePresence } from 'framer-motion';
import { slideUp, staggerContainer } from '@/lib/animations';

interface DevelopmentHeroProps {
    development: Development;
}

const formatPrice = (price: number) => {
    if (price >= 1000000) {
        const m = price / 1000000;
        return m % 1 === 0 ? `${m}M` : `${m.toFixed(1).replace(/\.0$/, '')}M`;
    }
    return price.toLocaleString('pt-BR');
};

const STATUS_LABELS: Record<string, string> = {
    launch: 'Lançamento',
    ready: 'Pronta Entrega',
    under_construction: 'Em Construção',
};

export default function DevelopmentHero({ development }: DevelopmentHeroProps) {
    const allImages = [development.images.main, ...development.images.gallery].filter(Boolean) as string[];
    const gridImages = allImages.slice(0, 5);
    const totalPhotos = allImages.length;

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const [copied, setCopied] = useState(false);

    const openLightbox = (idx: number) => { setLightboxIdx(idx); setLightboxOpen(true); };
    const closeLightbox = useCallback(() => setLightboxOpen(false), []);
    const prevImage = useCallback(() => setLightboxIdx(i => (i - 1 + allImages.length) % allImages.length), [allImages.length]);
    const nextImage = useCallback(() => setLightboxIdx(i => (i + 1) % allImages.length), [allImages.length]);

    // Keyboard nav + body scroll lock
    useEffect(() => {
        if (!lightboxOpen) return;
        document.body.style.overflow = 'hidden';
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        };
        window.addEventListener('keydown', handler);
        return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
    }, [lightboxOpen, closeLightbox, prevImage, nextImage]);

    const handleShare = async () => {
        const url = window.location.href;
        const text = `${development.name} — ${development.location.neighborhood}, ${development.location.city}`;
        if (navigator.share) {
            try { await navigator.share({ title: development.name, text, url }); } catch { /* cancelled */ }
        } else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <section className="relative bg-[#0A1017]">
                {/* ── Photo Grid (Zillow-style: 1 big + 4 small) ── */}
                {allImages.length > 0 ? (
                    <div className="relative">
                        {/* Desktop: bento grid */}
                        <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-1.5 h-[70vh] max-h-[600px]">
                            {/* Main image — spans 2 cols + 2 rows */}
                            <button
                                onClick={() => openLightbox(0)}
                                className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer group"
                            >
                                <Image
                                    src={gridImages[0]}
                                    alt={development.name}
                                    fill
                                    priority
                                    className="object-cover group-hover:scale-[1.02] transition-transform duration-700"
                                    sizes="50vw"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                            </button>

                            {/* 4 smaller images */}
                            {[1, 2, 3, 4].map(i => (
                                <button
                                    key={i}
                                    onClick={() => gridImages[i] ? openLightbox(i) : openLightbox(0)}
                                    className="relative overflow-hidden cursor-pointer group"
                                >
                                    {gridImages[i] ? (
                                        <>
                                            <Image
                                                src={gridImages[i]}
                                                alt={`${development.name} - ${i + 1}`}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                sizes="25vw"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-[#141C26] flex items-center justify-center">
                                            <Building2 className="w-8 h-8 text-white/10" />
                                        </div>
                                    )}
                                    {/* "Ver todas" overlay on last image if more exist */}
                                    {i === 4 && totalPhotos > 5 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                                            <span className="text-white font-bold text-sm">+{totalPhotos - 5} fotos</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Mobile: single hero image */}
                        <button
                            onClick={() => openLightbox(0)}
                            className="md:hidden relative w-full aspect-[16/10] overflow-hidden"
                        >
                            <Image
                                src={gridImages[0]}
                                alt={development.name}
                                fill
                                priority
                                className="object-cover"
                                sizes="100vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1017] via-[#0A1017]/40 to-transparent" />
                        </button>

                        {/* "Ver X fotos" button */}
                        <button
                            onClick={() => openLightbox(0)}
                            className="absolute bottom-4 right-4 z-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 text-gray-900 text-xs font-bold shadow-lg hover:bg-white transition-colors backdrop-blur-sm"
                        >
                            <Camera size={14} />
                            Ver {totalPhotos} {totalPhotos === 1 ? 'foto' : 'fotos'}
                        </button>

                        {/* Share button */}
                        <button
                            onClick={handleShare}
                            className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/40 text-white text-xs font-semibold hover:bg-black/60 transition-colors backdrop-blur-sm"
                        >
                            {copied ? <Check size={14} /> : <Share2 size={14} />}
                            {copied ? 'Copiado!' : 'Compartilhar'}
                        </button>
                    </div>
                ) : (
                    <div className="h-[50vh] flex items-center justify-center bg-gradient-to-br from-[#0D1117] via-[#141C26] to-[#0A1017]">
                        <Building2 className="w-24 h-24 text-white/5" strokeWidth={1} />
                    </div>
                )}

                {/* ── Content overlay (below grid on desktop, over image on mobile) ── */}
                <div className="relative md:absolute md:bottom-0 md:left-0 md:right-0 md:bg-gradient-to-t md:from-[#0A1017] md:via-[#0A1017]/80 md:to-transparent md:pointer-events-none">
                    <div className="container-custom pb-8 md:pb-12 pt-6 md:pt-32 md:pointer-events-auto">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="max-w-4xl"
                        >
                            {/* Top row: Badge + Developer logo */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <motion.div variants={slideUp}>
                                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                        development.status === 'launch'
                                            ? 'bg-[#102A43] text-[#9FB3C8] border border-[#243B53]'
                                            : development.status === 'ready'
                                            ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/30'
                                            : 'bg-white/10 text-white/70 border border-white/10 backdrop-blur-sm'
                                    }`}>
                                        {development.status === 'ready' && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                        )}
                                        {STATUS_LABELS[development.status] || development.status}
                                    </span>
                                </motion.div>

                                {development.developerLogo && (
                                    <motion.div variants={slideUp} className="relative w-28 h-10 md:w-36 md:h-12">
                                        <Image
                                            src={development.developerLogo}
                                            alt={development.developer}
                                            fill
                                            className="object-contain object-left sm:object-right filter brightness-0 invert opacity-60"
                                        />
                                    </motion.div>
                                )}
                            </div>

                            {/* Title */}
                            <motion.h1
                                variants={slideUp}
                                className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] text-white font-bold mb-6 leading-[1.08] tracking-tight"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                {development.name}
                            </motion.h1>

                            {/* Meta info */}
                            <motion.div
                                variants={slideUp}
                                className="flex flex-wrap items-center gap-y-3 gap-x-6 text-[#9FB3C8] text-sm border-l-2 border-[#334E68] pl-6"
                            >
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#627D98]" />
                                    <span>
                                        {development.location.neighborhood}, {development.location.city}/{development.location.state}
                                    </span>
                                </div>

                                {development.deliveryDate && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-[#627D98]" />
                                        <span>{development.deliveryDate}</span>
                                    </div>
                                )}

                                {development.registrationNumber && (
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-[#627D98]" />
                                        <span>R.I: {development.registrationNumber}</span>
                                    </div>
                                )}
                            </motion.div>

                            {/* Price + Specs */}
                            <motion.div variants={slideUp} className="mt-8">
                                {development.priceRange.min > 0 ? (
                                    <>
                                        <p className="text-[10px] text-[#627D98] mb-1.5 uppercase tracking-[0.25em] font-bold">A partir de</p>
                                        <p
                                            className="text-3xl sm:text-4xl md:text-[44px] font-bold text-white tracking-tight mb-5"
                                            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                                        >
                                            <span className="text-base md:text-xl mr-2 font-sans font-normal text-[#627D98]">R$</span>
                                            {formatPrice(development.priceRange.min)}
                                        </p>
                                    </>
                                ) : (
                                    <div className="mb-5" />
                                )}

                                {/* Specs pills */}
                                <div className="flex flex-wrap gap-2">
                                    {development.specs?.bedroomsRange && development.specs.bedroomsRange !== '—' && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm"
                                            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)' }}>
                                            <Bed size={11} className="text-white/50" />
                                            <span className="text-xs font-semibold text-white/80">{development.specs.bedroomsRange} quartos</span>
                                        </div>
                                    )}
                                    {development.specs?.areaRange && development.specs.areaRange !== '—' && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm"
                                            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)' }}>
                                            <Ruler size={11} className="text-white/50" />
                                            <span className="text-xs font-semibold text-white/80">{development.specs.areaRange}</span>
                                        </div>
                                    )}
                                    {development.tags?.length > 0 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm"
                                            style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)' }}>
                                            <Building2 size={11} className="text-white/50" />
                                            <span className="text-xs font-semibold text-white/80 capitalize">{development.tags[0]}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Fullscreen Lightbox ── */}
            <AnimatePresence>
                {lightboxOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
                        onClick={closeLightbox}
                    >
                        <button
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                            onClick={closeLightbox}
                            aria-label="Fechar"
                        >
                            <X size={20} />
                        </button>

                        <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium z-10 tabular-nums">
                            {lightboxIdx + 1} / {allImages.length}
                        </div>

                        {allImages.length > 1 && (
                            <>
                                <button
                                    className="absolute left-3 sm:left-5 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                                    onClick={e => { e.stopPropagation(); prevImage(); }}
                                    aria-label="Anterior"
                                >
                                    <ChevronLeft size={22} />
                                </button>
                                <button
                                    className="absolute right-3 sm:right-5 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                                    onClick={e => { e.stopPropagation(); nextImage(); }}
                                    aria-label="Próxima"
                                >
                                    <ChevronRight size={22} />
                                </button>
                            </>
                        )}

                        <motion.div
                            key={lightboxIdx}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.18 }}
                            className="relative w-full h-full"
                            style={{ maxWidth: '90vw', maxHeight: '85vh', margin: '0 auto' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <Image
                                src={allImages[lightboxIdx]}
                                alt={`${development.name} - ${lightboxIdx + 1}`}
                                fill
                                className="object-contain"
                                sizes="90vw"
                                priority
                            />
                        </motion.div>

                        {allImages.length > 1 && allImages.length <= 20 && (
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {allImages.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={e => { e.stopPropagation(); setLightboxIdx(i); }}
                                        className={`h-1.5 rounded-full transition-all duration-200 ${
                                            i === lightboxIdx ? 'bg-white w-5' : 'bg-white/35 hover:bg-white/60 w-1.5'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
