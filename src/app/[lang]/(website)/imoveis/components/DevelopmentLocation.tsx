'use client'

import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { slideUp } from '@/lib/animations'
import { Development } from '../types/development'

interface DevelopmentLocationProps {
  development: Development
}

export default function DevelopmentLocation({ development }: DevelopmentLocationProps) {
  const { location } = development
  const { coordinates, neighborhood, city, state, address } = location

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
            Localização
          </h2>

          <div className="rounded-lg overflow-hidden border border-slate-200">
            <iframe
              src={`https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=15&output=embed`}
              className="w-full h-[280px] sm:h-[360px] md:h-[400px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={`Mapa - ${neighborhood}`}
            />
          </div>

          <div className="flex items-start gap-2 mt-4">
            <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-600">
              {address ? `${address} — ` : ''}
              {neighborhood}, {city}/{state}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
