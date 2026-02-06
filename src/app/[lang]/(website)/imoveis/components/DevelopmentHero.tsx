'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Building2, MapPin, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import { Development } from '../types/development'
import { formatBRL } from '../data/developments'

interface DevelopmentHeroProps {
  development: Development
}

export default function DevelopmentHero({ development }: DevelopmentHeroProps) {
  const { name, location, status, priceRange, images } = development

  const statusLabel = status === 'ready' ? 'Pronta Entrega' : 'Lançamento'
  const statusBg = status === 'ready' ? 'bg-gold-500 text-white' : 'bg-navy-900 text-white'

  return (
    <section>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="container-custom py-4">
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/imoveis" className="text-slate-500 hover:text-navy-900 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Empreendimentos
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium truncate">{name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-[280px] sm:h-[360px] md:h-[440px] lg:h-[480px]">
        {images.main ? (
          <Image
            src={images.main}
            alt={name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center">
            <Building2 className="w-16 h-16 text-slate-300 mb-3" />
            <span className="text-sm text-slate-400 font-medium">{name}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Overlay Content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-0 left-0 right-0 p-6 sm:p-8"
        >
          <div className="container-custom !px-0">
            <Badge className={statusBg}>{statusLabel}</Badge>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mt-3 mb-2">
              {name}
            </h1>
            <p className="text-white/80 flex items-center gap-1.5 text-sm sm:text-base mb-3">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              {location.neighborhood}, {location.city}/{location.state}
            </p>
            <p className="text-lg sm:text-xl font-semibold text-white">
              A partir de {formatBRL(priceRange.min)}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
