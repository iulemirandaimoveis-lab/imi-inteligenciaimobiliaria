'use client'

import Link from 'next/link'
import { Mail, Phone, Linkedin } from 'lucide-react'

export default function Footer({ lang = 'pt' }: { lang?: string }) {
    const currentYear = new Date().getFullYear()

    const sections = {
        avaliacoes: {
            title: 'Avaliações',
            links: [
                { name: 'Avaliações', href: `/${lang}/avaliacoes` },
                { name: 'Imóveis', href: `/${lang}/imoveis` },
                { name: 'Crédito', href: `/${lang}/credito` },
                { name: 'Consultoria', href: `/${lang}/consultoria` },
                { name: 'Inteligência', href: `/${lang}/inteligencia` },
                { name: 'Projetos', href: `/${lang}/projetos` },
            ],
        },
        empresa: {
            title: 'Empresa',
            links: [
                { name: 'Sobre', href: `/${lang}/sobre` },
                { name: 'Contato', href: `/${lang}/contato` },
            ],
        },
    }

    const languages = [
        { code: 'pt', label: 'PT' },
        { code: 'en', label: 'EN' },
        { code: 'ja', label: 'JP' },
        { code: 'ar', label: 'AR' },
        { code: 'es', label: 'ES' },
    ]

    return (
        <footer className="bg-[#0F1E28] text-white pt-16 pb-8">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
                {/* Top Section: Brand & Contact Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">

                    {/* Brand Column (Left) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Logo */}
                        <div className="flex items-center gap-4 mb-8">
                            <span className="font-playfair text-3xl font-bold text-white tracking-tight">IMI</span>
                            <div className="h-8 w-[1px] bg-white/20"></div>
                            <div className="flex flex-col justify-center">
                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium leading-none mb-1">
                                    Inteligência
                                </span>
                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium leading-none">
                                    Imobiliária
                                </span>
                            </div>
                        </div>

                        <div>
                            <h2 className="font-playfair text-2xl font-bold mb-3">
                                IMI – Inteligência Imobiliária
                            </h2>
                            <p className="text-white/60 leading-relaxed max-w-md">
                                Decisões imobiliárias baseadas em inteligência, método e segurança.
                            </p>
                        </div>

                        {/* Contact Card with Gold Border */}
                        <div className="mt-8 bg-[#ffffff05] p-6 rounded-r-xl border-l-4 border-[#C5A572] max-w-md">
                            <h3 className="font-bold text-lg text-white mb-1">Iule Miranda</h3>
                            <p className="text-[#C5A572] text-xs font-bold uppercase tracking-wide mb-6">
                                CRECI 17933 | CNAI 53290
                            </p>

                            <div className="space-y-4">
                                <a href="mailto:iulemirandaimoveis@gmail.com" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center group-hover:bg-[#C5A572] transition-colors">
                                        <Mail size={16} className="text-white group-hover:text-[#111116]" />
                                    </div>
                                    <span className="text-sm">iulemirandaimoveis@gmail.com</span>
                                </a>

                                <a href="tel:+5581997230455" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center group-hover:bg-[#C5A572] transition-colors">
                                        <Phone size={16} className="text-white group-hover:text-[#111116]" />
                                    </div>
                                    <span className="text-sm">+55 81 99723-0455</span>
                                </a>

                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-white/70 hover:text-white transition-colors group">
                                    <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center group-hover:bg-[#C5A572] transition-colors">
                                        <Linkedin size={16} className="text-white group-hover:text-[#111116]" />
                                    </div>
                                    <span className="text-sm">LinkedIn</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Links Columns (Right) */}
                    <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-12 lg:pl-20">
                        {/* Avaliações Links */}
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
                                {sections.avaliacoes.title}
                            </h3>
                            <ul className="space-y-4">
                                {sections.avaliacoes.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-white/60 hover:text-[#C5A572] transition-colors text-sm"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Empresa Links */}
                        <div>
                            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
                                {sections.empresa.title}
                            </h3>
                            <ul className="space-y-4">
                                {sections.empresa.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            href={link.href}
                                            className="text-white/60 hover:text-[#C5A572] transition-colors text-sm"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-white/40 text-xs text-center md:text-left">
                        © {currentYear} IMI – Inteligência Imobiliária. Todos os direitos reservados.
                    </p>

                    {/* Language Selector Bottom */}
                    <div className="flex items-center gap-4 text-xs font-medium text-white/40">
                        {languages.map((l, index) => (
                            <div key={l.code} className="flex items-center">
                                <Link
                                    href={`/${l.code}`}
                                    className={`hover:text-[#C5A572] transition-colors ${lang === l.code ? 'text-[#C5A572]' : ''}`}
                                >
                                    {l.label}
                                </Link>
                                {index < languages.length - 1 && (
                                    <span className="mx-2 text-white/20">|</span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-6 text-xs text-white/40">
                        <Link href={`/${lang}/privacidade`} className="hover:text-white transition-colors">
                            Política de Privacidade
                        </Link>
                        <Link href={`/${lang}/termos`} className="hover:text-white transition-colors">
                            Termos de Uso
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
