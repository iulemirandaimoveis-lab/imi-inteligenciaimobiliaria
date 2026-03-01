'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { useParams } from 'next/navigation'

interface MethodProps {
    dict: {
        method_pre: string
        method_title: string
        method_cta: string
    }
}

export default function Method({ dict }: MethodProps) {
    const params = useParams()
    const lang = (params?.lang as string) || 'pt'

    return (
        <section className="relative bg-[#141420] py-20 lg:py-28 overflow-hidden">
            {/* Grid texture */}
            <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            {/* Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#102A43]/[0.05] blur-[80px] rounded-full" />

            <div className="relative z-10 max-w-[800px] mx-auto px-6 lg:px-8 text-center">
                {/* Eyebrow */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-8 h-px bg-[#102A43]" />
                    <span className="text-[#486581] text-[11px] font-bold uppercase tracking-[0.25em]">{dict.method_pre}</span>
                    <div className="w-8 h-px bg-[#102A43]" />
                </div>

                {/* Quote mark */}
                <div className="text-[120px] leading-none text-[#486581]/10 font-serif absolute top-8 left-1/2 -translate-x-1/2 select-none pointer-events-none" aria-hidden="true">&ldquo;</div>

                <h2 className="relative z-10 text-[28px] sm:text-[36px] lg:text-[44px] font-black text-white leading-[1.15] mb-10" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {dict.method_title}
                </h2>

                <Link
                    href={`/${lang}/sobre`}
                    className="inline-flex items-center gap-2.5 text-white border border-white/15 hover:border-[#334E68] hover:text-[#486581] font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 text-[13px]"
                >
                    {dict.method_cta}
                    <ArrowRight size={14} />
                </Link>
            </div>
        </section>
    )
}
