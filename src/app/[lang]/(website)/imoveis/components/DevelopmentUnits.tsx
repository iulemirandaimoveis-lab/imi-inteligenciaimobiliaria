'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { slideUp } from '@/lib/animations'
import Button from '@/components/ui/Button'
import { Development } from '../types/development'
import { formatBRL } from '../data/developments'

interface DevelopmentUnitsProps {
  development: Development
}

const INITIAL_VISIBLE = 5

export default function DevelopmentUnits({ development }: DevelopmentUnitsProps) {
  const { name, units } = development
  const [showAll, setShowAll] = useState(false)

  if (units.length === 0) return null

  const visibleUnits = showAll ? units : units.slice(0, INITIAL_VISIBLE)
  const hasMore = units.length > INITIAL_VISIBLE

  const whatsappMessage = (unitName: string) =>
    `Olá! Gostaria de simular as parcelas da unidade ${unitName} do ${name}. Pode me ajudar?`

  return (
    <section className="py-12 md:py-16">
      <div className="container-custom">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={slideUp}
        >
          <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-6">
            Unidades Disponíveis
          </h2>

          {/* Table wrapper with horizontal scroll on mobile */}
          <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 pr-4">
                    Unidade
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 pr-4">
                    Tipo
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 pr-4">
                    Área
                  </th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 pr-4">
                    Posição
                  </th>
                  <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 pr-4">
                    Valor
                  </th>
                  <th className="py-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {visibleUnits.map((unit) => (
                  <tr key={unit.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4 text-sm font-medium text-slate-900">
                      {unit.unit}
                      {unit.tower && (
                        <span className="block text-xs text-slate-500">{unit.tower}</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 text-sm text-slate-600">{unit.type}</td>
                    <td className="py-4 pr-4 text-sm text-slate-600">{unit.area}m²</td>
                    <td className="py-4 pr-4 text-sm text-slate-600">{unit.position || '—'}</td>
                    <td className="py-4 pr-4 text-sm font-semibold text-navy-900 text-right">
                      {formatBRL(unit.totalPrice)}
                    </td>
                    <td className="py-4">
                      <a
                        href={`https://wa.me/5581997230455?text=${encodeURIComponent(whatsappMessage(unit.unit))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-navy-900 hover:text-white text-slate-600 transition-colors"
                        title="Simular parcelas"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && !showAll && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAll(true)}
              >
                Ver todas as {units.length} unidades
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
