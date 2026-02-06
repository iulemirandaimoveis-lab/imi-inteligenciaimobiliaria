'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Search } from 'lucide-react'
import { slideUp, staggerContainer } from '@/lib/animations'
import DevelopmentCard from './components/DevelopmentCard'
import DevelopmentFilters, { FilterOption } from './components/DevelopmentFilters'
import { developments } from './data/developments'
import { Development } from './types/development'

function filterDevelopments(devs: Development[], filter: FilterOption): Development[] {
  switch (filter) {
    case 'lancamento':
      return devs.filter((d) => d.status === 'launch')
    case 'pronta-entrega':
      return devs.filter((d) => d.status === 'ready')
    case 'frente-mar':
      return devs.filter((d) => d.tags.includes('frente-mar'))
    case 'casas':
      return devs.filter((d) => d.tags.includes('casas'))
    default:
      return devs
  }
}

export default function ImoveisPage() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('todos')

  const sorted = useMemo(
    () => [...developments].sort((a, b) => a.order - b.order),
    []
  )

  const filtered = useMemo(
    () => filterDevelopments(sorted, activeFilter),
    [sorted, activeFilter]
  )

  const readyDevelopments = useMemo(
    () => filtered.filter((d) => d.status === 'ready'),
    [filtered]
  )

  const launchDevelopments = useMemo(
    () => filtered.filter((d) => d.status === 'launch'),
    [filtered]
  )

  const showReadySection = readyDevelopments.length > 0
  const showLaunchSection = launchDevelopments.length > 0

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-white pt-8 pb-4 sm:pt-12 sm:pb-6">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.h2
              variants={slideUp}
              className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2"
            >
              Empreendimentos
            </motion.h2>
            <motion.p variants={slideUp} className="text-slate-600 text-base sm:text-lg max-w-2xl">
              Lançamentos e oportunidades selecionadas com curadoria técnica IMI
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <DevelopmentFilters active={activeFilter} onChange={setActiveFilter} />

      {/* Results */}
      <section className="py-8 sm:py-12 md:py-16">
        <div className="container-custom">
          {filtered.length === 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={slideUp}
              className="text-center py-16"
            >
              <Search className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Nenhum empreendimento encontrado
              </h3>
              <p className="text-slate-600 text-sm">
                Tente outro filtro para ver mais resultados.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Pronta Entrega Section */}
              {showReadySection && (
                <div className="mb-12">
                  <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={slideUp}
                    className="mb-6"
                  >
                    <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                      Pronta Entrega
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Imóveis prontos para morar ou investir
                    </p>
                  </motion.div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {readyDevelopments.map((dev, i) => (
                      <DevelopmentCard key={dev.id} development={dev} index={i} compact />
                    ))}
                  </div>
                </div>
              )}

              {/* Launches Section */}
              {showLaunchSection && (
                <div>
                  {showReadySection && (
                    <motion.div
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true }}
                      variants={slideUp}
                      className="mb-6"
                    >
                      <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900">
                        Lançamentos
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Empreendimentos em fase de lançamento
                      </p>
                    </motion.div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {launchDevelopments.map((dev, i) => (
                      <DevelopmentCard key={dev.id} development={dev} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Count */}
              <motion.p
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={slideUp}
                className="text-sm text-slate-500 mt-8"
              >
                {filtered.length} {filtered.length === 1 ? 'empreendimento' : 'empreendimentos'}
              </motion.p>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-slate-50">
        <div className="container-custom">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto text-center"
          >
            <motion.h2
              variants={slideUp}
              className="font-display text-xl sm:text-2xl font-bold text-slate-900 mb-4"
            >
              Não encontrou o que procura?
            </motion.h2>
            <motion.p variants={slideUp} className="text-slate-600 mb-8">
              Entre em contato conosco. Podemos ajudar a encontrar o imóvel
              ideal ou avaliar oportunidades específicas para seu perfil.
            </motion.p>
            <motion.div variants={slideUp}>
              <a
                href="https://wa.me/5581997230455?text=Olá! Estou procurando um imóvel e gostaria de orientação."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition-colors active:scale-[0.98]"
              >
                <MessageCircle className="w-5 h-5" />
                Falar com Especialista
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
