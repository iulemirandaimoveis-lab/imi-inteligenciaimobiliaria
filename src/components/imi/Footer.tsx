import Link from 'next/link'
import { Linkedin } from 'lucide-react'

const NAV_COLS = [
    {
        title: 'Serviços',
        links: [
            { label: 'Avaliações', href: '/pt/avaliacoes' },
            { label: 'Imóveis', href: '/pt/imoveis' },
            { label: 'Consultoria', href: '/pt/consultoria' },
            { label: 'Crédito', href: '/pt/credito' },
            { label: 'Inteligência', href: '/pt/inteligencia' },
        ],
    },
    {
        title: 'Empresa',
        links: [
            { label: 'Sobre', href: '/pt/sobre' },
            { label: 'Construtoras', href: '/pt/construtoras' },
            { label: 'Biblioteca', href: '/pt/biblioteca' },
            { label: 'Contato', href: '/pt/contato' },
        ],
    },
]

const LANGUAGES = [
    { code: 'pt', label: 'PT' },
    { code: 'en', label: 'EN' },
    { code: 'ja', label: 'JP' },
    { code: 'ar', label: 'AR' },
    { code: 'es', label: 'ES' },
]

export default function Footer() {
    return (
        <footer className="bg-[#0A0F18] text-white">
            <div className="max-w-7xl mx-auto px-6">

                {/* Main grid */}
                <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">

                    {/* Brand col */}
                    <div className="md:col-span-5">
                        <div className="flex items-center gap-3 mb-5">
                            <span
                                className="text-2xl font-black tracking-tight text-white"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                IMI
                            </span>
                            <div className="h-6 w-px bg-white/15" />
                            <span className="text-[11px] uppercase tracking-[2px] text-slate-400 font-bold">
                                Inteligência Imobiliária
                            </span>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm mb-6">
                            Decisões imobiliárias baseadas em inteligência,
                            método e segurança.
                        </p>

                        {/* Compact contact */}
                        <div className="space-y-2 text-sm text-slate-400">
                            <p className="font-semibold text-white text-base">Iule Miranda</p>
                            <p className="text-[11px] text-[#627D98] font-bold uppercase tracking-widest">
                                CRECI 17933 · CNAI 53290
                            </p>
                            <div className="pt-2 space-y-1.5">
                                <a href="mailto:iulemirandaimoveis@gmail.com" className="block hover:text-white transition-colors">
                                    iulemirandaimoveis@gmail.com
                                </a>
                                <a href="https://wa.me/5581997230455" className="block hover:text-white transition-colors">
                                    +55 81 9 9723-0455
                                </a>
                            </div>
                            <a
                                href="https://www.linkedin.com/in/iule-miranda"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                                style={{ background: '#0A66C2' }}
                            >
                                <Linkedin className="w-4 h-4" />
                                LinkedIn
                            </a>
                        </div>
                    </div>

                    {/* Nav cols */}
                    {NAV_COLS.map((col) => (
                        <div key={col.title} className="md:col-span-2">
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-5">
                                {col.title}
                            </h4>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-slate-400 hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Language col */}
                    <div className="md:col-span-3">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-5">
                            Idioma
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {LANGUAGES.map((lang) => (
                                <Link
                                    key={lang.code}
                                    href={`/${lang.code}`}
                                    className="px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-widest text-slate-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-all first:text-white first:bg-[#102A43]/40 first:border-[#334E68]/30"
                                >
                                    {lang.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="py-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-3">
                    <p className="text-[11px] text-slate-600 font-medium">
                        © 2026 IMI – Inteligência Imobiliária. Todos os direitos reservados.
                    </p>
                    <div className="flex gap-6 text-[11px] text-slate-600">
                        <Link href="/pt/termos" className="hover:text-slate-400 transition-colors">Termos</Link>
                        <Link href="/pt/privacidade" className="hover:text-slate-400 transition-colors">Privacidade</Link>
                    </div>
                </div>

            </div>
        </footer>
    )
}
