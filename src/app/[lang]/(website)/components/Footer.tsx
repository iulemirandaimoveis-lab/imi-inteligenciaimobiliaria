'use client'

import Link from 'next/link'
import { Mail, Phone, Linkedin, Instagram } from 'lucide-react'

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
        { code: 'pt', label: 'PT', flag: '🇧🇷' },
        { code: 'en', label: 'EN', flag: '🇺🇸' },
        { code: 'ja', label: 'JP', flag: '🇯🇵' },
        { code: 'ar', label: 'AR', flag: '🇸🇦' },
        { code: 'es', label: 'ES', flag: '🇪🇸' },
    ]

    return (
        <footer className="bg-[#1A1A1A] text-white">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-16">
                {/* Main Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Company Info */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="text-2xl font-bold">
                                <span className="text-white">IMI</span>
                            </div>
                            <div>
                                <div className="text-xs font-medium text-imi-300 uppercase tracking-wider">
                                    Inteligência
                                </div>
                                <div className="text-xs font-medium text-imi-300 uppercase tracking-wider -mt-1">
                                    Imobiliária
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-imi-300 mb-6 leading-relaxed">
                            Decisões imobiliárias baseadas em inteligência, método e segurança.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                                    <Phone size={18} className="text-accent-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white mb-1">Iule Miranda</p>
                                    <a
                                        href="tel:+5581997230455"
                                        className="text-sm text-imi-300 hover:text-accent-400 transition-colors"
                                    >
                                        +55 81 99723-0455
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                                    <Mail size={18} className="text-accent-400" />
                                </div>
                                <div>
                                    <a
                                        href="mailto:iulemirandaimoveis@gmail.com"
                                        className="text-sm text-imi-300 hover:text-accent-400 transition-colors"
                                    >
                                        iulemirandaimoveis@gmail.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Credentials */}
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <p className="text-xs text-accent-400 font-medium">
                                CRECI 17933 | CNAI 53290
                            </p>
                        </div>
                    </div>

                    {/* Avaliações Links */}
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
                            {sections.avaliacoes.title}
                        </h3>
                        <ul className="space-y-3">
                            {sections.avaliacoes.links.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-imi-300 hover:text-accent-400 transition-colors"
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
                        <ul className="space-y-3">
                            {sections.empresa.links.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-imi-300 hover:text-accent-400 transition-colors"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Languages & Social */}
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">
                            Idiomas
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-8">
                            {languages.map((language) => (
                                <Link
                                    key={language.code}
                                    href={`/${language.code}`}
                                    className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${lang === language.code
                                        ? 'bg-accent-500 text-white'
                                        : 'bg-white/5 text-imi-300 hover:bg-white/10'
                                        }`}
                                >
                                    <span>{language.flag}</span>
                                    <span>{language.label}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Social Links */}
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                            Redes Sociais
                        </h3>
                        <div className="flex gap-3">
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-accent-500/20 flex items-center justify-center transition-all group"
                            >
                                <Linkedin size={18} className="text-imi-300 group-hover:text-accent-400 transition-colors" />
                            </a>
                            <a
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-accent-500/20 flex items-center justify-center transition-all group"
                            >
                                <Instagram size={18} className="text-imi-300 group-hover:text-accent-400 transition-colors" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-imi-400">
                            © {currentYear} IMI – Inteligência Imobiliária. Todos os direitos reservados.
                        </p>
                        <div className="flex items-center gap-6">
                            <Link
                                href={`/${lang}/privacidade`}
                                className="text-sm text-imi-400 hover:text-accent-400 transition-colors"
                            >
                                Política de Privacidade
                            </Link>
                            <Link
                                href={`/${lang}/termos`}
                                className="text-sm text-imi-400 hover:text-accent-400 transition-colors"
                            >
                                Termos de Uso
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
