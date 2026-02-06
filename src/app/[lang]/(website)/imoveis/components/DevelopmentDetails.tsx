'use client'

import { BedDouble, Maximize2, Car, Building, CalendarDays, FileText, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { slideUp } from '@/lib/animations'
import { Development } from '../types/development'

interface DevelopmentDetailsProps {
  development: Development
}

export default function DevelopmentDetails({ development }: DevelopmentDetailsProps) {
  const { specs, deliveryDate, registrationNumber, description, features, developer } = development

  const specItems = [
    { icon: BedDouble, label: 'Quartos', value: specs.bedroomsRange },
    { icon: Maximize2, label: 'Área', value: `${specs.areaRange}m²` },
    specs.parkingRange ? { icon: Car, label: 'Vagas', value: specs.parkingRange } : null,
    specs.bathroomsRange ? { icon: Building, label: 'Banheiros', value: specs.bathroomsRange } : null,
    deliveryDate ? { icon: CalendarDays, label: 'Entrega', value: deliveryDate } : null,
    registrationNumber ? { icon: FileText, label: 'Registro', value: registrationNumber } : null,
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[]

  return (
    <section className="py-12 md:py-16">
      <div className="container-custom">
        {/* Specs Grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={slideUp}
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-12"
        >
          {specItems.map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className="bg-slate-50 rounded-lg p-4 flex flex-col items-center text-center"
              >
                <Icon className="w-5 h-5 text-navy-900 mb-2" />
                <p className="text-lg font-semibold text-slate-900">{item.value}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            )
          })}
        </motion.div>

        {/* Description */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={slideUp}
          className="mb-12"
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-4">
            Sobre o Empreendimento
          </h2>
          <div className="prose-custom">
            <p>{description}</p>
            <p className="text-sm text-slate-500">Construtora: <strong>{developer}</strong></p>
          </div>
        </motion.div>

        {/* Features */}
        {features.length > 0 && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={slideUp}
          >
            <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-4">
              Diferenciais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <div className="flex-shrink-0 w-6 h-6 bg-navy-900/5 rounded-full flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-navy-900" />
                  </div>
                  <span className="text-sm text-slate-700">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
