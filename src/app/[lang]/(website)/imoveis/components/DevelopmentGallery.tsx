'use client';

import { useState, useEffect, useCallback } from 'react';
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
                                className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 group block cursor-zoom-in"
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
                                            className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 group cursor-zoom-in"
                                        >
                                            <Image
                                                src={img}
                                                alt={`${development.name} - ${idx + 2}`}
                                                fill
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
                                <div key={idx} className="aspect-video rounded-2xl overflow-hidden bg-gray-900 shadow-lg">
                                    <iframe
                                        src={video}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Floor Plans */}
                {hasFloorPlans && (
                    <div>
                        <SectionTitle label="Plantas" />
                        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
                            {development.images.floorPlans.map((plan, idx) => (
                                <div
                                    key={idx}
                                    className="relative flex-shrink-0 w-[85vw] sm:w-[70vw] lg:w-full aspect-[4/3] bg-white rounded-2xl overflow-hidden snap-start border border-gray-100 p-6"
                                >
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={plan}
                                            alt={`${development.name} - Planta ${idx + 1}`}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
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
                        <div className="relative w-full aspect-video md:h-[480px] rounded-2xl overflow-hidden border border-gray-100 shadow-lg">
                            <iframe
                                src={development.images.virtualTour}
                                className="w-full h-full border-0"
                                allowFullScreen
                            />
                            <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur text-white px-4 py-2 rounded-xl flex items-center gap-2.5 text-xs font-semibold">
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
                        className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center"
                        onClick={closeLightbox}
                    >
                        {/* Close */}
                        <button
                            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
                            onClick={closeLightbox}
                            aria-label="Fechar"
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
                                aria-label="Anterior"
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
                            style={{ maxWidth: '90vw', maxHeight: '85vh', margin: '0 auto' }}
                            onClick={e => e.stopPropagation()}
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
                                aria-label="Próxima"
                            >
                                <ChevronRight size={22} />
                            </button>
                        )}

                        {/* Dot strip */}
                        {allImages.length > 1 && allImages.length <= 12 && (
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {allImages.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={e => { e.stopPropagation(); setLightboxIndex(i); }}
                                        aria-label={`Ir para imagem ${i + 1}`}
                                        className={`h-1.5 rounded-full transition-all duration-200 ${
                                            i === lightboxIndex
                                                ? 'bg-white w-5'
                                                : 'bg-white/35 hover:bg-white/60 w-1.5'
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

function SectionTitle({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-5 rounded-full bg-[#334E68]" />
            <h2 className="text-xl text-gray-900 font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {label}
            </h2>
        </div>
    );
}

function Placeholder({ label, icon }: { label: string; icon: React.ReactNode }) {
    return (
        <div className="aspect-video bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-200 border-dashed">
            <div className="text-center">
                {icon}
                <p className="text-gray-400 font-medium mt-3 text-sm">{label}</p>
            </div>
        </div>
    );
}
