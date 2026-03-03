'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, TrendingUp, Home, ArrowRight } from 'lucide-react'
import { useParams } from 'next/navigation'

interface ServicesProps {
  dict: {
    card_appraisals_title: string
    card_appraisals_desc: string
    card_consulting_title: string
    card_consulting_desc: string
    card_brokerage_title: string
    card_brokerage_desc: string
  }
}

export default function Services({ dict }: ServicesProps) {
  const params = useParams()
  const lang = (params?.lang as string) || 'pt'

  const services = [
    {
      icon: FileText,
      title: dict.card_appraisals_title,
      desc: dict.card_appraisals_desc,
      href: `/${lang}/avaliacoes`,
      tag: 'NBR 14653',
      accent: 'from-[#C49D5B]/10 to-transparent',
    },
    {
      icon: TrendingUp,
      title: dict.card_consulting_title,
      desc: dict.card_consulting_desc,
      href: `/${lang}/consultoria`,
      tag: 'USD yield',
      accent: 'from-amber-50 to-transparent',
    },
    {
      icon: Home,
      title: dict.card_brokerage_title,
      desc: dict.card_brokerage_desc,
      href: `/${lang}/imoveis`,
      tag: 'Curadoria',
      accent: 'from-emerald-50 to-transparent',
    },
  ]

  return (
    <section className="py-16 lg:py-20 bg-[#F8F9FA]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
          {services.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <Link
                href={item.href}
                className="group relative block bg-white rounded-2xl p-6 sm:p-7 border border-[#E9ECEF] hover:border-[#C49D5B]/40 hover:shadow-[0_8px_32px_rgba(196,157,91,0.10)] transition-all duration-300 overflow-hidden"
              >
                {/* Background gradient */}
                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl ${item.accent} rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none`} />

                <div className="relative z-10">
                  {/* Icon + tag */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-11 h-11 bg-[#1A1A1A] group-hover:bg-[#C49D5B] rounded-xl flex items-center justify-center transition-colors duration-300">
                      <item.icon className="w-5 h-5 text-white" strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#ADB5BD] bg-[#F8F9FA] px-2.5 py-1 rounded-full border border-[#E9ECEF]">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-[15px] sm:text-[16px] font-bold text-[#1A1A1A] mb-2">{item.title}</h3>
                  <p className="text-[13px] text-[#6C757D] leading-relaxed mb-6">{item.desc}</p>

                  <div className="flex items-center gap-2 text-[12px] font-semibold text-[#C49D5B] group-hover:gap-3 transition-all duration-200">
                    Saiba mais <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
