'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Mail, MessageCircle, Linkedin } from 'lucide-react'
import React from 'react'
import { motion } from 'framer-motion'

import { GlobalSettings } from '@/lib/settings'

interface FooterProps {
    lang: string
    settings?: GlobalSettings
    dict?: Record<string, unknown>
}

const NAV_COLS = [
    {
        title: 'Serviços',
        links: [
            { label: 'Avaliações', href: 'avaliacoes' },
            { label: 'Imóveis', href: 'imoveis' },
            { label: 'Crédito', href: 'credito' },
            { label: 'Consultoria', href: 'consultoria' },
            { label: 'Inteligência', href: 'inteligencia' },
            { label: 'Projetos', href: 'projetos' },
        ],
    },
    {
        title: 'Empresa',
        links: [
            { label: 'Sobre', href: 'sobre' },
            { label: 'Contato', href: 'contato' },
            { label: 'Construtoras', href: 'construtoras' },
            { label: 'Biblioteca', href: 'biblioteca' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Política de Privacidade', href: 'privacidade' },
            { label: 'Termos de Uso', href: 'termos' },
        ],
    },
]

const LANGS = [
    { code: 'pt', flag: '🇧🇷', label: 'PT' },
    { code: 'en', flag: '🇺🇸', label: 'EN' },
    { code: 'es', flag: '🇪🇸', label: 'ES' },
    { code: 'ja', flag: '🇯🇵', label: 'JP' },
    { code: 'ar', flag: '🇸🇦', label: 'AR' },
]

export default function Footer({ lang, settings }: FooterProps) {
    const year = new Date().getFullYear()

    return (
        <footer className="text-white" style={{ background: '#0B1928' }}>
            {/* Gold accent line — animated reveal */}
            <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-[2px] bg-gradient-to-r from-transparent via-[#C8A44A]/40 to-transparent origin-center"
            />

            <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-16 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

                    {/* ── Brand & Credenciais ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-5 overflow-hidden"
                    >
                        <div className="mb-6">
                            <Image
                                src="/brasao-creci-iule1.png"
                                alt="Brasão Iule Miranda"
                                width={140}
                                height={140}
                                className="w-[88px] sm:w-[104px] lg:w-[120px] h-auto rounded-xl border border-[#C8A44A]/25 bg-white/5"
                                priority
                            />
                        </div>

                        <Link href={`/${lang}`} className="inline-flex items-center gap-2.5 sm:gap-3 group mb-8">
                            <span
                                className="leading-none select-none transition-colors duration-300 group-hover:text-[#C8A44A]"
                                style={{
                                    fontFamily: "'Playfair Display', Georgia, serif",
                                    fontSize: 26,
                                    fontWeight: 700,
                                    color: '#FFFFFF',
                                    letterSpacing: '2px',
                                }}
                            >
                                IMI
                            </span>
                            {/* Gold divider — same as header */}
                            <div style={{ width: 1, height: 22, background: '#C8A44A', flexShrink: 0 }} />
                            <span
                                className="select-none"
                                style={{
                                    fontSize: '7px',
                                    fontWeight: 600,
                                    letterSpacing: '2.2px',
                                    textTransform: 'uppercase' as const,
                                    color: 'rgba(255,255,255,0.6)',
                                    lineHeight: 1.45,
                                }}
                            >
                                INTELIGÊNCIA<br />IMOBILIÁRIA
                            </span>
                        </Link>

                        <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-5 lg:mb-8">
                            Decisões imobiliárias baseadas em inteligência, método e segurança.
                            Transformamos incerteza em capital protegido.
                        </p>

                        {/* Credentials card */}
                        <div className="border-l-[3px] border-[#C8A44A]/50 bg-gradient-to-br from-white/[0.04] to-transparent rounded-r-xl p-3 lg:p-4 mb-4 lg:mb-6">
                            <p className="font-bold text-white text-[13px] lg:text-[14px] mb-0.5">Iule Miranda</p>
                            <p className="text-[#C8A44A]/70 text-[9px] font-bold uppercase tracking-[0.2em] mb-3">
                                CRECI 17933 | CNAI 53290
                            </p>

                            <div className="space-y-[6px]">
                                <a
                                    href={`mailto:${settings?.companyEmail || 'iulemirandaimoveis@gmail.com'}`}
                                    className="flex items-center gap-[10px] hover:bg-white/[0.04] transition-all duration-200 px-[8px] py-[6px] rounded-lg group"
                                >
                                    <div className="w-[28px] h-[28px] bg-white/[0.06] rounded-md flex items-center justify-center flex-shrink-0 text-white/50 group-hover:text-[#C8A44A] transition-colors border border-white/[0.06]">
                                        <Mail className="w-[14px] h-[14px]" />
                                    </div>
                                    <span className="text-white/50 group-hover:text-white transition-colors text-[11px] font-medium break-all">{settings?.companyEmail || 'iule.miranda.imoveis@gmail.com'}</span>
                                </a>

                                <a
                                    href={`https://wa.me/${settings?.companyPhone?.replace(/\D/g, '') || '5581986141487'}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-[10px] hover:bg-white/[0.04] transition-all duration-200 px-[8px] py-[6px] rounded-lg group"
                                >
                                    <div className="w-[28px] h-[28px] bg-white/[0.06] rounded-md flex items-center justify-center flex-shrink-0 text-white/50 group-hover:text-[#C8A44A] transition-colors border border-white/[0.06]">
                                        <MessageCircle className="w-[14px] h-[14px]" />
                                    </div>
                                    <span className="text-white/50 group-hover:text-white transition-colors text-[11px] font-medium">{settings?.companyPhone || '+55 81 9 8614-1487'}</span>
                                </a>

                                <a
                                    href="https://www.linkedin.com/in/iule-miranda-imoveis"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-[10px] hover:bg-white/[0.04] transition-all duration-200 px-[8px] py-[6px] rounded-lg group"
                                >
                                    <div className="w-[28px] h-[28px] bg-white/[0.06] rounded-md flex items-center justify-center flex-shrink-0 text-white/50 group-hover:text-[#C8A44A] transition-colors border border-white/[0.06]">
                                        <Linkedin className="w-[14px] h-[14px]" />
                                    </div>
                                    <span className="text-white/50 group-hover:text-white transition-colors text-[11px] font-medium">linkedin.com/in/iule-miranda</span>
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    {/* ── Nav cols ── */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                        className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-10"
                    >
                        {NAV_COLS.map((col) => (
                            <div key={col.title}>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A44A] mb-5">
                                    {col.title}
                                </h4>
                                <ul className="space-y-3">
                                    {col.links.map((link) => (
                                        <li key={link.href}>
                                            <Link
                                                href={`/${lang}/${link.href}`}
                                                className="text-[13px] text-white/40 hover:text-white transition-colors duration-200"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* ── Bottom bar ── */}
                <div className="mt-16 pt-8 border-t border-[#C8A44A]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] text-white/30 font-medium">
                        © {year} IMI – Inteligência Imobiliária. Todos os direitos reservados.
                    </p>

                    <div className="flex items-center gap-2">
                        {LANGS.map((l) => (
                            <Link
                                key={l.code}
                                href={`/${l.code}`}
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-150 ${lang === l.code
                                    ? 'text-[#C8A44A] bg-white/[0.06] border border-[#C8A44A]/20'
                                    : 'text-white/30 hover:text-white hover:bg-white/[0.04] border border-transparent'
                                }`}
                            >
                                <span className="text-sm">{l.flag}</span>
                                {l.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
