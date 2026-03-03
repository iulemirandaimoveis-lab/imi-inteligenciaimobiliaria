'use client';

import { Building2, Play, Layout, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { Development } from '../types/development';

interface DevelopmentGalleryProps {
    development: Development;
}

export default function DevelopmentGallery({ development }: DevelopmentGalleryProps) {
    const hasImages = development.images.gallery.length > 0 || development.images.main;
    const hasVideos = development.images.videos && development.images.videos.length > 0;
    const hasFloorPlans = development.images.floorPlans && development.images.floorPlans.length > 0;

    const renderPlaceholder = (title: string, icon: any) => (
        <div className="aspect-video bg-imi-50 rounded-2xl flex items-center justify-center border border-imi-100 border-dashed">
            <div className="text-center">
                {icon}
                <p className="text-imi-400 font-medium tracking-wide mt-4">{title} em breve</p>
            </div>
        </div>
    );

    return (
        <section className="section-padding bg-imi-50/50">
            <div className="container-custom space-y-20">
                {/* 1. Galeria de Imagens (Horizontal Scroll) */}
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <ImageIcon className="text-accent-500" size={20} />
                        <h2 className="font-display text-2xl text-imi-900 font-bold uppercase tracking-tight">Galeria de Imagens</h2>
                    </div>

                    {hasImages ? (
                        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
                            {[development.images.main, ...development.images.gallery].filter(Boolean).map((img, idx) => (
                                <div
                                    key={idx}
                                    className="relative flex-shrink-0 w-[85vw] md:w-[60vw] lg:w-[45vw] aspect-video rounded-3xl overflow-hidden snap-start shadow-soft border border-imi-100 bg-imi-100"
                                >
                                    <Image
                                        src={img!}
                                        alt={`${development.name} - Imagem ${idx + 1}`}
                                        fill
                                        className="object-cover hover:scale-105 transition-transform duration-700"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : renderPlaceholder('Imagens', <Building2 className="w-16 h-16 text-imi-200 mx-auto" strokeWidth={1} />)}
                </div>

                {/* 2. Seção de Vídeos */}
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <Play className="text-accent-500" size={20} />
                        <h2 className="font-display text-2xl text-imi-900 font-bold uppercase tracking-tight">Apresentação em Vídeo</h2>
                    </div>
                    {hasVideos ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {development.images.videos.map((video, idx) => (
                                <div key={idx} className="aspect-video rounded-3xl overflow-hidden shadow-2xl bg-imi-900">
                                    <iframe
                                        src={video}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            ))}
                        </div>
                    ) : renderPlaceholder('Vídeo institucional', <Play className="w-16 h-16 text-imi-200 mx-auto" strokeWidth={1} />)}
                </div>

                {/* 3. Plantas Baixas */}
                <div>
                    <div className="flex items-center gap-3 mb-8">
                        <Layout className="text-accent-500" size={20} />
                        <h2 className="font-display text-2xl text-imi-900 font-bold uppercase tracking-tight">Plantas Humanizadas</h2>
                    </div>

                    {hasFloorPlans ? (
                        <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
                            {development.images.floorPlans.map((plan, idx) => (
                                <div
                                    key={idx}
                                    className="relative flex-shrink-0 w-[85vw] md:w-[60vw] lg:w-[40vw] aspect-[4/3] bg-white rounded-3xl overflow-hidden snap-start shadow-soft border border-imi-100 p-8"
                                >
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={plan}
                                            alt={`${development.name} - Planta ${idx + 1}`}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-imi-900/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                                        Opção de Planta {idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : renderPlaceholder('Plantas baixas', <Layout className="w-16 h-16 text-imi-200 mx-auto" strokeWidth={1} />)}
                </div>

                {/* 4. Tour Virtual (se existir) */}
                {development.images.virtualTour && (
                    <div className="pt-8">
                        <div className="relative w-full h-[600px] rounded-[40px] overflow-hidden shadow-soft border border-imi-100">
                            <iframe
                                src={development.images.virtualTour}
                                className="w-full h-full border-0"
                                allowFullScreen
                            />
                            <div className="absolute top-8 left-8 bg-imi-900 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-md bg-imi-900/90">
                                <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                                <span className="text-sm font-bold uppercase tracking-widest">Tour Virtual 360º Disponível</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
