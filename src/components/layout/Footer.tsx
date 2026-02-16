import Link from 'next/link'

interface FooterProps {
    lang?: string;
    dict: {
        presentation: string;
        services: string;
        properties: string;
        credit: string;
        consulting: string;
        intelligence: string;
        projects: string;
        about: string;
        contact: string;
    }
}

export default function Footer({ lang = 'pt', dict }: FooterProps) {
    const currentYear = new Date().getFullYear()

    const footerNavigation = {
        services: [
            { name: dict.services, href: `/${lang}/avaliacoes` },
            { name: dict.properties, href: `/${lang}/imoveis` },
            { name: dict.credit, href: `/${lang}/credito` },
            { name: dict.consulting, href: `/${lang}/consultoria` },
            { name: dict.intelligence, href: `/${lang}/inteligencia` },
            { name: dict.projects, href: `/${lang}/projetos` },
        ],
        company: [
            { name: dict.about, href: `/${lang}/sobre` },
            { name: dict.contact, href: `/${lang}/contato` },
        ],
        legal: [
            { name: 'Política de Privacidade', href: `/${lang}/privacidade` },
            { name: 'Termos de Uso', href: `/${lang}/termos` },
        ],
    }

    return (
        <footer className="bg-navy-900">
            <div className="h-px bg-gradient-to-r from-transparent via-gold-600/40 to-transparent" />
            {/* Main Footer */}
            <div className="mx-auto max-w-7xl px-6 sm:px-10 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
                    {/* Brand - Takes more space */}
                    <div className="lg:col-span-6">
                        <div className="text-2xl font-display font-bold text-white mb-4">
                            IMI – Inteligência Imobiliária
                        </div>
                        <p className="text-neutral-400 mb-6 max-w-md leading-relaxed">
                            {lang === 'en' ? 'Real estate decisions based on intelligence, method, and security.' :
                                lang === 'ja' ? '知性、メソッド、安全性に基づいた不動産の意思決定。' :
                                    'Decisões imobiliárias baseadas em inteligência, método e segurança.'}
                        </p>

                        {/* Credentials Box */}
                        <div className="border-l-4 border-accent-600 bg-neutral-800/50 rounded-r-lg p-6 mb-6">
                            <div className="mb-4">
                                <p className="font-semibold text-white mb-1">Iule Miranda</p>
                                <p className="text-sm text-accent-400">CRECI 17933 | CNAI 53290</p>
                            </div>

                            {/* Contact Links with Icons */}
                            <div className="space-y-3">
                                {/* Email */}
                                <a
                                    href="mailto:iulemirandaimoveis@gmail.com"
                                    className="flex items-center gap-3 text-neutral-300 hover:text-white transition-colors duration-200 group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-neutral-700 rounded-lg flex items-center justify-center group-hover:bg-accent-600 transition-colors duration-200">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm">iulemirandaimoveis@gmail.com</span>
                                </a>

                                {/* WhatsApp */}
                                <a
                                    href="https://wa.me/5581997230455"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-neutral-300 hover:text-white transition-colors duration-200 group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-neutral-700 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors duration-200">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm">+55 81 99723-0455</span>
                                </a>

                                {/* LinkedIn */}
                                <a
                                    href="https://www.linkedin.com/in/iule-miranda-imoveis"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-neutral-300 hover:text-white transition-colors duration-200 group"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 bg-neutral-700 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-200">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm">LinkedIn</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Services */}
                    <div className="lg:col-span-3">
                        <h3 className="text-white font-semibold mb-4">{dict.services}</h3>
                        <ul className="space-y-3">
                            {footerNavigation.services.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="lg:col-span-3">
                        <h3 className="text-white font-semibold mb-4">Empresa</h3>
                        <ul className="space-y-3">
                            {footerNavigation.company.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                                    >
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 border-t border-neutral-800">
                    <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                        <p className="text-sm text-neutral-500">
                            © {currentYear} IMI – Inteligência Imobiliária. {lang === 'en' ? 'All rights reserved.' : lang === 'ja' ? '全著作権所有。' : 'Todos os direitos reservados.'}
                        </p>

                        {/* Seletor Sutil de Idiomas */}
                        <div className="flex items-center space-x-3 text-xs font-bold text-neutral-600 uppercase tracking-widest">
                            <Link href="/pt" className={lang === 'pt' ? 'text-gold-500' : 'hover:text-gold-500 transition-colors'}>PT</Link>
                            <span className="text-neutral-800">|</span>
                            <Link href="/en" className={lang === 'en' ? 'text-gold-500' : 'hover:text-gold-500 transition-colors'}>EN</Link>
                            <span className="text-neutral-800">|</span>
                            <Link href="/ja" className={lang === 'ja' ? 'text-gold-500' : 'hover:text-gold-500 transition-colors'}>JP</Link>
                        </div>
                        <div className="flex space-x-6">
                            {footerNavigation.legal.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors duration-200"
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
