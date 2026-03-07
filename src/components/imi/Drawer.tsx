"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Linkedin } from 'lucide-react'

interface Props {
    open: boolean
    setOpen: (value: boolean) => void
}

const NAV_ITEMS = [
    { label: 'Imóveis', href: '/pt/imoveis' },
    { label: 'Construtoras', href: '/pt/construtoras' },
    { label: 'Avaliações', href: '/pt/avaliacoes' },
    { label: 'Crédito', href: '/pt/credito' },
    { label: 'Consultoria', href: '/pt/consultoria' },
    { label: 'Inteligência', href: '/pt/inteligencia' },
    { label: 'Conteúdo', href: '/pt/conteudo' },
    { label: 'Biblioteca', href: '/pt/biblioteca' },
    { label: 'Sobre', href: '/pt/sobre' },
    { label: 'Contato', href: '/pt/contato' },
]

const LANGUAGES = [
    { code: 'pt', flag: '🇧🇷' },
    { code: 'en', flag: '🇺🇸' },
    { code: 'ja', flag: '🇯🇵' },
    { code: 'ar', flag: '🇸🇦' },
    { code: 'es', flag: '🇪🇸' },
]

export default function Drawer({ open, setOpen }: Props) {
    const pathname = usePathname()

    // Detect current lang from pathname
    const currentLang = pathname?.split('/')[1] || 'pt'

    return (
        <div className={`fixed inset-0 z-[70] ${open ? "visible" : "invisible"}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
                onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-[340px] bg-white z-[80] transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"
                    } shadow-2xl flex flex-col`}
            >
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b border-neutral-100">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-serif font-black tracking-tight text-black">
                            IMI
                        </span>
                        <div className="h-5 w-px bg-neutral-200" />
                        <span className="text-[9px] tracking-[1.5px] text-slate-500 uppercase font-bold leading-tight">
                            Inteligência<br />Imobiliária
                        </span>
                    </div>
                    <button
                        onClick={() => setOpen(false)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-neutral-100 transition-colors"
                    >
                        <X size={22} strokeWidth={1.5} className="text-neutral-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-4">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map(item => {
                            // Adjust href for current language
                            const href = item.href.replace('/pt/', `/${currentLang}/`)
                            const isActive = pathname === href ||
                                (pathname?.startsWith(href) && href !== `/${currentLang}/`)

                            return (
                                <li key={item.label}>
                                    <Link
                                        href={href}
                                        onClick={() => setOpen(false)}
                                        className={`block py-3 px-4 rounded-xl text-[16px] font-bold transition-all ${isActive
                                                ? 'bg-neutral-100 text-black border-l-[3px] border-[#334E68] pl-[13px]'
                                                : 'text-neutral-600 hover:bg-neutral-50 hover:text-black'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>

                    {/* WhatsApp CTA */}
                    <a
                        href="https://wa.me/5581997230455"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full mt-6 bg-[#1e1e2f] text-white py-4 rounded-xl font-bold text-center shadow-lg hover:bg-black transition-all active:scale-[0.98]"
                    >
                        Falar pelo WhatsApp
                    </a>

                    {/* Languages */}
                    <div className="flex gap-2.5 mt-6 justify-center">
                        {LANGUAGES.map(lang => {
                            const isActive = currentLang === lang.code
                            const newPath = pathname?.replace(`/${currentLang}`, `/${lang.code}`) || `/${lang.code}`
                            return (
                                <Link
                                    key={lang.code}
                                    href={newPath}
                                    onClick={() => setOpen(false)}
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${isActive
                                            ? 'bg-[#1e1e2f] border-2 border-[#334E68] shadow-sm'
                                            : 'bg-neutral-50 border border-neutral-200 opacity-50 hover:opacity-100'
                                        }`}
                                >
                                    {lang.flag}
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                {/* Footer card */}
                <div className="px-3 py-3 bg-neutral-50 border-t border-neutral-100">
                    <div className="bg-white rounded-xl px-4 py-3 text-center shadow-sm border border-neutral-100">
                        <p className="font-black text-sm text-neutral-900">Iule Miranda</p>
                        <div className="h-0.5 w-6 bg-[#102A43] mx-auto my-1.5 rounded-full" />
                        <p className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider mb-2">
                            CRECI 17933 | CNAI 53290
                        </p>
                        <div className="space-y-1 text-[11px] text-neutral-500">
                            <a
                                href="https://wa.me/5581997230455"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block hover:text-neutral-800 transition-colors"
                            >
                                +55 81 9 9723-0455
                            </a>
                            <a
                                href="mailto:iulemirandaimoveis@gmail.com"
                                className="block hover:text-neutral-800 transition-colors"
                            >
                                iulemirandaimoveis@gmail.com
                            </a>
                        </div>
                        <a
                            href="https://www.linkedin.com/in/iule-miranda"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white transition-all"
                            style={{ background: '#0A66C2' }}
                        >
                            <Linkedin className="w-3 h-3" />
                            LinkedIn
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}
