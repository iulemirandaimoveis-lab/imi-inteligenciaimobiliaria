'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { BadgeCheck, Scale, FileText, TrendingUp } from 'lucide-react'

interface HeroProps {
  dict: {
    hero_title: string
    hero_subtitle: string
    cta_appraisal: string
    cta_whatsapp: string
  }
}

// ── Animated counter for stats ────────────────────────────────
function StatCounter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const duration = 1800
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(to * ease))
      if (progress < 1) requestAnimationFrame(tick)
    }
    setTimeout(() => requestAnimationFrame(tick), 600)
  }, [to])

  return <span ref={ref}>{count}{suffix}</span>
}

const STATS = [
  { value: 500, suffix: '+', label: 'Laudos NBR 14653' },
  { value: 12, suffix: ' anos', label: 'de experiência' },
  { value: 3, suffix: ' mercados', label: 'Brasil · Dubai · EUA' },
  { value: 100, suffix: '%', label: 'conformidade CRECI/CNAI' },
]

const TRUST = [
  { icon: BadgeCheck, text: 'CRECI 17933' },
  { icon: Scale, text: 'CNAI 53290' },
  { icon: FileText, text: 'NBR 14653' },
]

export default function Hero({ dict }: HeroProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const params = useParams()
  const lang = (params?.lang as string) || 'pt'

  const handleWhatsApp = () => {
    window.open('https://wa.me/5581997230455', '_blank')
  }

  return (
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden bg-[#141420]">
      {/* Background image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-[85%_top] sm:bg-[bottom_right] md:bg-[85%_center] bg-no-repeat"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        {/* Dark overlay gradient - stronger on the left for text readibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141420] via-[#141420]/80 to-transparent md:bg-gradient-to-r md:from-[#141420] md:via-[#141420]/90 md:to-transparent" />
      </div>

      {/* Gold glow orb */}
      <div
        className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(196,157,91,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-end">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-24 pt-24 sm:pt-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
            className="max-w-lg md:max-w-xl lg:max-w-[50%]"
          >
            {/* Trust pills */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="flex items-center gap-3 mb-6 flex-wrap"
            >
              {TRUST.map(t => {
                const Icon = t.icon
                return (
                  <div key={t.text} className="flex items-center gap-1.5 bg-white/8 border border-white/10 rounded-full px-3 py-1">
                    <Icon size={12} className="text-[#C49D5B]" />
                    <span className="text-xs text-white/70 font-medium">{t.text}</span>
                  </div>
                )
              })}
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65 } } }}
              className="font-display font-bold text-white leading-[1.12] mb-6"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)' }}
            >
              {dict.hero_title || 'Inteligência imobiliária\naonde o capital é\nalocado.'}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
              className="text-base sm:text-lg text-white/60 mb-10 max-w-lg font-light leading-relaxed"
            >
              {dict.hero_subtitle || 'Avaliações NBR 14653, consultoria patrimonial e acesso a oportunidades de alto padrão — Recife, Dubai e EUA.'}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55 } } }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full"
            >
              <Link
                href={`/${lang}/avaliacoes#form`}
                className="group w-full sm:w-auto inline-flex flex-wrap text-center items-center justify-center gap-2 px-6 sm:px-8 py-4 min-h-14 h-auto rounded-2xl font-bold text-sm sm:text-base transition-all duration-300 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #C49D5B 0%, #d4a96a 100%)', color: '#141420' }}
              >
                {dict.cta_appraisal || 'Solicitar Avaliação'}
                <TrendingUp size={17} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
              </Link>

              <button
                onClick={handleWhatsApp}
                className="inline-flex w-full sm:w-auto flex-wrap text-center items-center justify-center gap-2 px-6 sm:px-8 py-4 min-h-14 h-auto rounded-2xl font-semibold text-sm sm:text-base border border-white/20 text-white hover:bg-white/8 hover:border-white/30 transition-all duration-300 active:scale-95"
              >
                {dict.cta_whatsapp || 'Falar com especialista'}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 py-6 gap-0 divide-x divide-white/8"
          >
            {STATS.map(stat => (
              <div key={stat.label} className="flex flex-col items-center px-4 py-2 sm:py-0 text-center">
                <span className="text-2xl sm:text-3xl font-bold" style={{ color: '#C49D5B' }}>
                  <StatCounter to={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-xs text-white/50 mt-1 leading-snug">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
