'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Building2, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import Badge from '@/components/ui/Badge'
import { Development } from '../types/development'
import { formatBRL } from '../data/developments'

interface DevelopmentCardProps {
  development: Development
  index: number
  compact?: boolean
}

export default function DevelopmentCard({ development, index, compact = false }: DevelopmentCardProps) {
  const { name, slug, location, specs, priceRange, status, images, shortDescription } = development

  const statusLabel = status === 'ready' ? 'Pronta Entrega' : 'Lançamento'
  const statusBg = status === 'ready' ? 'bg-gold-500 text-white' : 'bg-navy-900 text-white'

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Link
          href={`/imoveis/${slug}`}
          className="group flex gap-4 bg-white border border-slate-200 rounded-lg p-4 hover:shadow-card transition-shadow"
        >
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
            {images.main ? (
              <Image src={images.main} alt={name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-slate-300" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={statusBg}>{statusLabel}</Badge>
            </div>
            <h3 className="font-semibold text-slate-900 text-base truncate group-hover:text-navy-700 transition-colors">
              {name}
            </h3>
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{location.neighborhood}, {location.city}/{location.state}</span>
            </p>
            <p className="text-sm font-semibold text-navy-900 mt-2">
              A partir de {formatBRL(priceRange.min)}
            </p>
          </div>
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link
        href={`/imoveis/${slug}`}
        className="group block bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-card-hover transition-all"
      >
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {images.main ? (
            <Image
              src={images.main}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center">
              <Building2 className="w-12 h-12 text-slate-300 mb-2" />
              <span className="text-xs text-slate-400 font-medium">{name}</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className={statusBg}>{statusLabel}</Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="font-semibold text-slate-900 text-lg mb-1 group-hover:text-navy-700 transition-colors">
            {name}
          </h3>

          <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            {location.neighborhood}, {location.city}/{location.state}
          </p>

          <p className="text-sm text-slate-600 mb-4 line-clamp-2">
            {shortDescription}
          </p>

          {/* Specs */}
          <p className="text-sm text-slate-500 mb-4">
            {specs.bedroomsRange} {parseInt(specs.bedroomsRange) === 1 ? 'quarto' : 'quartos'}
            {' · '}
            {specs.areaRange}m²
            {specs.parkingRange && ` · ${specs.parkingRange} ${parseInt(specs.parkingRange) === 1 ? 'vaga' : 'vagas'}`}
          </p>

          {/* Price */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">A partir de</p>
              <p className="text-lg font-semibold text-navy-900">
                {formatBRL(priceRange.min)}
              </p>
            </div>
            <span className="inline-flex items-center justify-center h-12 px-6 text-sm font-semibold text-navy-900 border border-slate-200 rounded-lg group-hover:bg-navy-900 group-hover:text-white transition-colors">
              Ver detalhes
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
