'use client'

import { motion } from 'framer-motion'

interface ServiceHeroProps {
  eyebrow: string
  title: string
  titleHighlight?: string
  subtitle: string
  badge?: string
  badgeIcon?: React.ReactNode
  stats?: { value: string; label: string }[]
  dark?: boolean
}

export default function ServiceHero({
  eyebrow,
  title,
  titleHighlight,
  subtitle,
  badge,
  badgeIcon,
  stats,
  dark = true,
}: ServiceHeroProps) {
  return (
    <section
      className={`relative overflow-hidden ${
        dark ? 'bg-[#141420] text-white' : 'bg-white text-[#1A1A1A]'
      }`}
    >
      {/* Background texture */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${dark ? '#fff' : '#000'} 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        {/* Gold gradient orb */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-[#102A43]/[0.06] blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-8 py-20 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-[#102A43]" />
            <span className="text-[#486581] text-[11px] font-bold uppercase tracking-[0.25em]">
              {eyebrow}
            </span>
          </div>

          {/* Title */}
          <h1
            className={`text-[36px] sm:text-[48px] lg:text-[60px] font-black leading-[1.05] tracking-tight mb-6 ${
              dark ? 'text-white' : 'text-[#1A1A1A]'
            }`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {title}
            {titleHighlight && (
              <>
                {' '}
                <span className="text-[#486581]">{titleHighlight}</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p
            className={`text-[17px] lg:text-[19px] leading-relaxed font-light max-w-2xl ${
              dark ? 'text-[#9CA3AF]' : 'text-[#6C757D]'
            }`}
          >
            {subtitle}
          </p>

          {/* Badge */}
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-8 inline-flex items-center gap-3 px-5 py-3 bg-[#102A43]/10 border border-[#334E68]/25 rounded-full"
            >
              {badgeIcon && (
                <span className="text-[#486581]">{badgeIcon}</span>
              )}
              <span className="text-[#486581] text-[12px] font-bold uppercase tracking-[0.15em]">
                {badge}
              </span>
            </motion.div>
          )}

          {/* Stats */}
          {stats && stats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-12 flex flex-wrap gap-x-10 gap-y-6"
            >
              {stats.map((stat, i) => (
                <div key={i}>
                  <div
                    className="text-[28px] lg:text-[32px] font-black text-[#486581] leading-none mb-1"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${
                      dark ? 'text-[#6C757D]' : 'text-[#ADB5BD]'
                    }`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
              <div className="w-px bg-white/10 hidden sm:block" />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom fade */}
      {dark && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      )}
    </section>
  )
}
