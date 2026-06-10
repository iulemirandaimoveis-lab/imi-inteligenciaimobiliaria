'use client';

import { useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Layers } from 'lucide-react';
import Image from 'next/image';
import type { Development } from '../types/development';

interface Props {
    development: Development;
}

export default function CommonAreasSection({ development }: Props) {
    const images = development.images.commonAreas || [];
    const videos = development.images.commonAreasVideos || [];
    const description = development.images.commonAreasDescription;

    const hasImages = images.length > 0;
    const hasVideos = videos.length > 0;

    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    const prev = useCallback(() => {
        setLightboxIdx(i => i === null ? null : (i - 1 + images.length) % images.length);
    }, [images.length]);

    const next = useCallback(() => {
        setLightboxIdx(i => i === null ? null : (i + 1) % images.length);
    }, [images.length]);

    if (!hasImages && !hasVideos && !description) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-1 h-6 rounded-full flex-shrink-0" style={{ background: '#C8A44A' }} />
                <h2 style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#0B1928',
                    fontFamily: "var(--fu, 'Outfit', sans-serif)",
                    margin: 0,
                    letterSpacing: '-0.3px',
                }}>
                    Áreas Comuns
                </h2>
            </div>

            {/* Description */}
            {description && (
                <p style={{
                    fontSize: 15,
                    color: '#5C5650',
                    lineHeight: 1.7,
                    fontFamily: "var(--fu, 'Outfit', sans-serif)",
                    margin: 0,
                }}>
                    {description}
                </p>
            )}

            {/* Photo grid */}
            {hasImages && (
                <div>
                    {images.length === 1 ? (
                        <button
                            onClick={() => setLightboxIdx(0)}
                            className="w-full relative overflow-hidden rounded-2xl"
                            style={{ aspectRatio: '16/7', border: '1px solid rgba(184,179,168,0.3)' }}
                        >
                            <Image src={images[0]} alt="Área comum" fill style={{ objectFit: 'cover' }} sizes="(max-width:768px) 100vw, 800px" />
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                                <span className="opacity-0 hover:opacity-100 text-white text-sm font-semibold px-4 py-2 rounded-full" style={{ background: 'rgba(0,0,0,0.5)' }}>
                                    Ver foto
                                </span>
                            </div>
                        </button>
                    ) : images.length === 2 ? (
                        <div className="grid grid-cols-2 gap-2">
                            {images.slice(0, 2).map((url, i) => (
                                <button key={i} onClick={() => setLightboxIdx(i)} className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: '4/3', border: '1px solid rgba(184,179,168,0.3)' }}>
                                    <Image src={url} alt={`Área comum ${i + 1}`} fill style={{ objectFit: 'cover' }} sizes="(max-width:768px) 50vw, 400px" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {/* Main large image */}
                            <button
                                onClick={() => setLightboxIdx(0)}
                                className="relative overflow-hidden rounded-2xl col-span-2 md:col-span-2"
                                style={{ aspectRatio: '16/9', border: '1px solid rgba(184,179,168,0.3)' }}
                            >
                                <Image src={images[0]} alt="Área comum principal" fill style={{ objectFit: 'cover' }} sizes="(max-width:768px) 100vw, 600px" />
                            </button>
                            {/* Side column */}
                            <div className="flex flex-col gap-2">
                                {images.slice(1, 3).map((url, i) => (
                                    <button key={i} onClick={() => setLightboxIdx(i + 1)} className="relative overflow-hidden rounded-2xl flex-1" style={{ minHeight: 0, border: '1px solid rgba(184,179,168,0.3)' }}>
                                        <Image src={url} alt={`Área comum ${i + 2}`} fill style={{ objectFit: 'cover' }} sizes="200px" />
                                        {i === 1 && images.length > 3 && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1" style={{ background: 'rgba(11,25,40,0.65)', backdropFilter: 'blur(2px)' }}>
                                                <Layers size={20} color="white" />
                                                <span style={{ color: 'white', fontSize: 13, fontWeight: 700, fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                                                    +{images.length - 3} fotos
                                                </span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {images.length > 3 && (
                        <button
                            onClick={() => setLightboxIdx(3)}
                            className="mt-3 text-sm font-semibold underline"
                            style={{ color: '#C8A44A', fontFamily: "var(--fu, 'Outfit', sans-serif)", background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Ver todas as {images.length} fotos
                        </button>
                    )}
                </div>
            )}

            {/* Videos */}
            {hasVideos && (
                <div className="space-y-3">
                    {videos.map((url, i) => (
                        <div key={i} className="relative overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(184,179,168,0.3)' }}>
                            {url.includes('youtube.com') || url.includes('youtu.be') ? (
                                <div style={{ aspectRatio: '16/9' }}>
                                    <iframe
                                        src={url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={`Vídeo área comum ${i + 1}`}
                                    />
                                </div>
                            ) : (
                                <video
                                    src={url}
                                    controls
                                    className="w-full rounded-2xl"
                                    style={{ maxHeight: 480 }}
                                    preload="metadata"
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightboxIdx !== null && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)' }}
                    onClick={() => setLightboxIdx(null)}
                >
                    <button
                        onClick={() => setLightboxIdx(null)}
                        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.15)' }}
                    >
                        <X size={20} color="white" />
                    </button>

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={e => { e.stopPropagation(); prev(); }}
                                className="absolute left-4 w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.15)' }}
                            >
                                <ChevronLeft size={20} color="white" />
                            </button>
                            <button
                                onClick={e => { e.stopPropagation(); next(); }}
                                className="absolute right-4 w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.15)' }}
                            >
                                <ChevronRight size={20} color="white" />
                            </button>
                        </>
                    )}

                    <div className="relative max-w-5xl w-full max-h-[85vh]" onClick={e => e.stopPropagation()}>
                        <Image
                            src={images[lightboxIdx]}
                            alt={`Área comum ${lightboxIdx + 1}`}
                            width={1400}
                            height={900}
                            style={{ objectFit: 'contain', maxHeight: '85vh', width: '100%', height: 'auto', borderRadius: 12 }}
                        />
                        <p className="text-center mt-3 text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}>
                            {lightboxIdx + 1} / {images.length}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
