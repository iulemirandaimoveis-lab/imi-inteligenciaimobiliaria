'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { BadgeCheck, Scale, FileText, TrendingUp, MessageCircle, ArrowRight, Home, Building2, Globe } from 'lucide-react'
import { ButtonPrimary, ButtonGhost } from '@/components/website/Buttons'

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
  { value: 3, suffix: ' mercados', label: 'Brasil · EUA · Emirados' },
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
    <section className="relative min-h-[100dvh] flex flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* Background video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/hero-bg.jpg"
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay gradient — stronger on left for text, bottom for fade */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(11,25,40,0.85) 0%, rgba(11,25,40,0.5) 50%, rgba(11,25,40,0.2) 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 40%)' }} />
      </div>

      {/* Gold glow orb */}
      <div
        className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(26,26,46,0.12) 0%, transparent 70%)',
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
              className="flex flex-col gap-3 items-start mb-6"
            >
              {TRUST.map(t => {
                const Icon = t.icon
                return (
                  <div key={t.text} className="flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-1" style={{ borderRadius: 6 }}>
                    <Icon size={12} className="text-white/70" />
                    <span className="text-xs text-white/70 font-medium">{t.text}</span>
                  </div>
                )
              })}
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65 } } }}
              className="font-display font-bold text-white leading-[1.12] mb-6 sm:mb-6"
              style={{ fontSize: 'clamp(1.6rem, 5vw, 3.75rem)' }}
            >
              {dict.hero_title || 'Inteligência imobiliária\naonde o capital é\nalocado.'}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
              className="text-sm sm:text-lg text-white/60 mb-8 sm:mb-10 max-w-lg font-light leading-relaxed"
            >
              {dict.hero_subtitle || 'Avaliações NBR 14653, consultoria patrimonial e acesso a oportunidades de alto padrão — Brasil, Estados Unidos e Emirados Árabes.'}
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55 } } }}
              className="flex flex-col sm:flex-row gap-3 w-full"
            >
              <ButtonGhost dark strong href={`/${lang}/avaliacoes#form`} size="lg" full className="w-full sm:w-auto min-w-[240px] h-14">
                {dict.cta_appraisal || 'Solicitar Avaliação'}
              </ButtonGhost>

              <ButtonGhost dark onClick={handleWhatsApp} size="lg" full className="w-full sm:w-auto min-w-[240px] h-14" icon={<MessageCircle size={15} />} arrow={false}>
                {dict.cta_whatsapp || 'Falar com especialista'}
              </ButtonGhost>
            </motion.div>

            {/* Quick Property Filter Widget */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { delay: 0.7, duration: 0.5 } } }}
              className="mt-8 sm:mt-10"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30 mb-3">Explorar portfólio</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Alto Padrão', icon: Building2, href: `/${lang}/imoveis` },
                  { label: 'Dubai',        icon: Globe,     href: `/${lang}/imoveis?pais=dubai` },
                  { label: 'Pronta Entrega', icon: Home,   href: `/${lang}/imoveis?status=ready` },
                ].map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-all duration-200"
                    style={{
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.60)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.20)'
                      ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.95)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'
                      ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)'
                      ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.60)'
                    }}
                  >
                    <item.icon size={11} />
                    {item.label}
                  </Link>
                ))}
                <Link
                  href={`/${lang}/imoveis`}
                  className="group flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all duration-200"
                  style={{
                    borderRadius: 6,
                    background: 'var(--accent-400)',
                    border: '1px solid transparent',
                    color: '#0A1017',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.88' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
                >
                  Ver todos
                  <ArrowRight size={10} />
                </Link>
              </div>
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
            className="grid grid-cols-2 sm:grid-cols-4 py-4 sm:py-6 gap-0 divide-x divide-white/8"
          >
            {STATS.map(stat => (
              <div key={stat.label} className="flex flex-col items-center px-3 sm:px-4 py-2 sm:py-0 text-center">
                <span className="text-xl sm:text-3xl font-bold text-[#C8A44A]" style={{ fontFamily: 'var(--font-mono)' }}>
                  <StatCounter to={stat.value} suffix={stat.suffix} />
                </span>
                <span className="text-[10px] sm:text-xs text-white/40 mt-0.5 leading-snug">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
