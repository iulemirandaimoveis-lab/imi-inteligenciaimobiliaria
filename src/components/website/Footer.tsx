import Link from 'next/link'

interface FooterProps {
    lang: string
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

export default function Footer({ lang }: FooterProps) {
    const year = new Date().getFullYear()

    return (
        <footer className="bg-[#141420] text-white">
            {/* Gold accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-[#C49D5B]/50 to-transparent" />

            <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-16 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

                    {/* ── Brand col ── */}
                    <div className="lg:col-span-5">
                        <Link href={`/${lang}`} className="inline-block mb-6 group">
                            <span
                                className="text-[28px] font-black tracking-tight text-white group-hover:text-[#C49D5B] transition-colors duration-200"
                                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                            >
                                IMI
                            </span>
                            <span className="ml-2 text-[11px] font-semibold text-[#6C757D] uppercase tracking-[0.18em]">
                                Inteligência Imobiliária
                            </span>
                        </Link>

                        <p className="text-[#6C757D] text-sm leading-relaxed max-w-sm mb-8">
                            Decisões imobiliárias baseadas em inteligência, método e segurança.
                            Transformamos incerteza em capital protegido.
                        </p>

                        {/* Credentials card */}
                        <div className="border-l-[4px] border-[#C49D5B] bg-white/[0.04] rounded-r-xl p-5 mb-8">
                            <p className="font-bold text-white text-[15px] mb-0.5">Iule Miranda</p>
                            <p className="text-[#C49D5B] text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                                CRECI 17933 | CNAI 53290
                            </p>

                            <div className="space-y-3">
                                <a
                                    href="mailto:iulemirandaimoveis@gmail.com"
                                    className="flex items-center gap-3 text-[#9CA3AF] hover:text-white transition-colors duration-200 text-sm group"
                                >
                                    <div className="w-8 h-8 bg-white/[0.06] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#C49D5B]/20 transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    iulemirandaimoveis@gmail.com
                                </a>

                                <a
                                    href="https://wa.me/5581997230455"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-[#9CA3AF] hover:text-white transition-colors duration-200 text-sm group"
                                >
                                    <div className="w-8 h-8 bg-white/[0.06] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/20 transition-colors">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </div>
                                    +55 81 99723-0455
                                </a>

                                <a
                                    href="https://www.linkedin.com/in/iule-miranda-imoveis"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-[#9CA3AF] hover:text-white transition-colors duration-200 text-sm group"
                                >
                                    <div className="w-8 h-8 bg-white/[0.06] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/20 transition-colors">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                        </svg>
                                    </div>
                                    LinkedIn
                                </a>
                            </div>
                        </div>

                        {/* WhatsApp CTA button */}
                        <a
                            href="https://wa.me/5581997230455"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-white/[0.07] hover:bg-[#C49D5B] border border-white/10 text-white text-[13px] font-semibold px-5 py-3 rounded-xl transition-all duration-200"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            Falar pelo WhatsApp
                        </a>
                    </div>

                    {/* ── Nav cols ── */}
                    <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-10">
                        {NAV_COLS.map((col) => (
                            <div key={col.title}>
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#C49D5B] mb-5">
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
                            <>
                                {i > 0 && <span key={`sep-${l.code}`} className="text-[#2D2D3A] text-[10px]">|</span>}
                                <Link
                                    key={l.code}
                                    href={`/${l.code}`}
                                    className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-150 ${lang === l.code ? 'text-[#C49D5B]' : 'text-[#495057] hover:text-white'
                                        }`}
                                >
                                    {l.label}
                                </Link>
                            </>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}
