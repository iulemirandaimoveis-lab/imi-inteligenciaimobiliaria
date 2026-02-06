'use client'

import { MessageCircle, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { slideUp, staggerContainer } from '@/lib/animations'
import { Development } from '../types/development'

interface DevelopmentCTAProps {
  development: Development
}

export default function DevelopmentCTA({ development }: DevelopmentCTAProps) {
  const { name, externalLinks } = development

  const interestMessage = `Olá! Tenho interesse no ${name}. Gostaria de mais informações.`
  const tableMessage = `Olá! Gostaria de receber a tabela completa do ${name}.`

  return (
    <section className="py-16 md:py-24">
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
            Interessado neste empreendimento?
          </motion.h2>
          <motion.p
            variants={slideUp}
            className="text-slate-600 mb-8"
          >
            Fale com um especialista IMI para tirar dúvidas, agendar visita ou receber a tabela de preços completa.
          </motion.p>

          <motion.div variants={slideUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`https://wa.me/5581997230455?text=${encodeURIComponent(interestMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-navy-900 text-white font-semibold rounded-lg hover:bg-navy-800 transition-colors active:scale-[0.98]"
            >
              <MessageCircle className="w-5 h-5" />
              Falar com Especialista
            </a>
            <a
              href={`https://wa.me/5581997230455?text=${encodeURIComponent(tableMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-14 px-8 bg-white text-navy-900 font-semibold border-2 border-navy-900 rounded-lg hover:bg-navy-900 hover:text-white transition-colors active:scale-[0.98]"
            >
              <FileText className="w-5 h-5" />
              Solicitar tabela completa
            </a>
          </motion.div>

          {externalLinks?.officialSite && (
            <motion.div variants={slideUp} className="mt-6">
              <a
                href={externalLinks.officialSite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-navy-900 underline underline-offset-4 transition-colors"
              >
                Ver site oficial do empreendimento
              </a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
