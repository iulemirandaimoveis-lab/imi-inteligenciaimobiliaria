'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { slideUp } from '@/lib/animations'
import { Development } from '../types/development'

interface DevelopmentGalleryProps {
  development: Development
}

export default function DevelopmentGallery({ development }: DevelopmentGalleryProps) {
  const { name, images, videoUrl } = development
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const allImages = images.gallery.length > 0 ? images.gallery : []
  const hasContent = allImages.length > 0 || videoUrl

  if (!hasContent) {
    return (
      <section className="py-12 md:py-16 bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideUp}
          >
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-6">
              Galeria
            </h2>
            <div className="aspect-[16/10] bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex flex-col items-center justify-center">
              <Building2 className="w-16 h-16 text-slate-300 mb-3" />
              <span className="text-sm text-slate-400 font-medium">Imagens em breve</span>
              <span className="text-xs text-slate-400 mt-1">{name}</span>
            </div>
          </motion.div>
        </div>
      </section>
    )
  }

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const scrollAmount = container.clientWidth * 0.85
    const newScroll = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount
    container.scrollTo({ left: newScroll, behavior: 'smooth' })
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const index = Math.round(container.scrollLeft / container.clientWidth)
    setActiveIndex(index)
  }

  const totalSlides = allImages.length + (videoUrl ? 1 : 0)

  return (
    <section className="py-12 md:py-16 bg-slate-50">
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={slideUp}
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-6">
            Galeria
          </h2>

          <div className="relative">
            {/* Carousel */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {videoUrl && (
                <div className="flex-shrink-0 w-full snap-center">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`Vídeo - ${name}`}
                    />
                  </div>
                </div>
              )}
              {allImages.map((img, i) => (
                <div key={i} className="flex-shrink-0 w-full snap-center">
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden">
                    <Image
                      src={img}
                      alt={`${name} - Imagem ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation buttons */}
            {totalSlides > 1 && (
              <>
                <button
                  onClick={() => scroll('left')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <button
                  onClick={() => scroll('right')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors"
                  aria-label="Próxima"
                >
                  <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === activeIndex ? 'bg-navy-900' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
