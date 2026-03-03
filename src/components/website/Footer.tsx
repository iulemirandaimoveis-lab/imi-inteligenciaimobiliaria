import Link from 'next/link'
import { Mail, MessageCircle, Linkedin } from 'lucide-react'
import React from 'react'

import { GlobalSettings } from '@/lib/settings'

interface FooterProps {
    lang: string
    settings?: GlobalSettings
    dict?: any
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
            { label: 'Blog', href: 'conteudo' },
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
    { code: 'pt', label: 'PT' },
    { code: 'en', label: 'EN' },
    { code: 'ja', label: 'JP' },
    { code: 'ar', label: 'AR' },
    { code: 'es', label: 'ES' },
]

export default function Footer({ lang, settings }: FooterProps) {
    const year = new Date().getFullYear()

    return (
        <footer className="bg-[#141420] text-white">
            {/* Gold accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#334E68]/50 to-transparent" />

            <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-16 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

                    {/* ── Brand & Credenciais ── */}
                    <div className="lg:col-span-5 overflow-hidden">
                        <Link href={`/${lang}`} className="inline-block group mb-8">
                            <span
                                className="text-[28px] font-black tracking-tight text-white group-hover:text-[#486581] transition-colors duration-200"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                IMI
                            </span>
                            <span className="ml-2 text-[11px] font-semibold text-[#6C757D] uppercase tracking-[0.18em]">
                                Inteligência Imobiliária
                            </span>
                        </Link>

                        <p className="text-[#6C757D] text-sm leading-relaxed max-w-sm mb-5 lg:mb-8">
                            Decisões imobiliárias baseadas em inteligência, método e segurança.
                            Transformamos incerteza em capital protegido.
                        </p>

                        {/* Credentials card */}
                        <div className="border-l-[4px] border-[#334E68] bg-gradient-to-br from-white/[0.04] to-transparent rounded-r-2xl p-4 lg:p-8 mb-6 lg:mb-8">
                            <p className="font-bold text-white text-[16px] mb-1">Iule Miranda</p>
                            <p className="text-[#486581] text-[10px] font-bold uppercase tracking-[0.2em] mb-4 lg:mb-6">
                                CRECI 17933 | CNAI 53290
                            </p>

                            <div className="space-y-2.5 sm:space-y-4">
                                <a
                                    href={`mailto:${settings?.companyEmail || 'iulemirandaimoveis@gmail.com'}`}
                                    className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.03] hover:border-white/[0.08] transition-all duration-300 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl group"
                                >
                                    <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[#1A1E2A] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 text-[#9CA3AF] group-hover:text-[#486581] group-hover:scale-105 transition-all duration-300 shadow-sm border border-white/[0.02]">
                                        <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="text-[#9CA3AF] group-hover:text-white transition-colors text-[12px] sm:text-[13px] font-medium break-all">{settings?.companyEmail || 'contato@iulemirandaimoveis.com.br'}</span>
                                </a>

                                <a
                                    href={`https://wa.me/${settings?.companyPhone?.replace(/\D/g, '') || '5581997230455'}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.03] hover:border-white/[0.08] transition-all duration-300 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl group"
                                >
                                    <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[#1A1E2A] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 text-[#9CA3AF] group-hover:text-[#6BB87B] group-hover:scale-105 transition-all duration-300 shadow-sm border border-white/[0.02]">
                                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="text-[#9CA3AF] group-hover:text-white transition-colors text-[12px] sm:text-[13px] font-medium">{settings?.companyPhone || '+55 81 99723-0455'}</span>
                                </a>

                                <a
                                    href="https://www.linkedin.com/in/iule-miranda-imoveis"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.03] hover:border-white/[0.08] transition-all duration-300 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl group"
                                >
                                    <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[#1A1E2A] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 text-[#9CA3AF] group-hover:text-[#486581] group-hover:scale-105 transition-all duration-300 shadow-sm border border-white/[0.02]">
                                        <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className="text-[#9CA3AF] group-hover:text-white transition-colors text-[12px] sm:text-[13px] font-medium">LinkedIn</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* ── Nav cols ── */}
                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-10">
                        {NAV_COLS.map((col) => (
                            <div key={col.title}>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#486581] mb-5">
                                    {col.title}
                                </h4>
                                <ul className="space-y-3">
                                    {col.links.map((link) => (
                                        <li key={link.href}>
                                            <Link
                                                href={`/${lang}/${link.href}`}
                                                className="text-[13px] text-[#6C757D] hover:text-white transition-colors duration-200"
                                            >
                                                {link.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Bottom bar ── */}
                <div className="mt-16 pt-8 border-t border-white/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] text-[#495057] font-medium">
                        © {year} IMI – Inteligência Imobiliária. Todos os direitos reservados.
                    </p>

                    <div className="flex items-center gap-3">
                        {LANGS.map((l, i) => (
                            <React.Fragment key={l.code}>
                                {i > 0 && <span className="text-[#2D2D3A] text-[10px]">|</span>}
                                <Link
                                    href={`/${l.code}`}
                                    className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-150 ${lang === l.code ? 'text-[#486581]' : 'text-[#495057] hover:text-white'
                                        }`}
                                >
                                    {l.label}
                                </Link>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
