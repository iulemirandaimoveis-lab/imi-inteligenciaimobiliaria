'use client'

import Link from 'next/link'
import { Linkedin } from 'lucide-react'

interface FooterProps {
    lang?: string
    dict?: any
}

export default function Footer({ lang = 'pt', dict }: FooterProps) {
    const labels = dict || {
        tagline: 'Inteligência Imobiliária',
        description: 'Decisões baseadas em dados, método e segurança.',
        services_title: 'Serviços',
        company_title: 'Empresa',
        contact_title: 'Contato',
        location: 'João Pessoa, PB',
        rights: '© 2026 IMI Inteligência Imobiliária. Todos os direitos reservados.',
        privacy: 'Privacidade',
        terms: 'Termos',
        nav_appraisals: 'Avaliações',
        nav_properties: 'Imóveis',
        nav_credit: 'Crédito',
        nav_consulting: 'Consultoria',
        nav_intelligence: 'Inteligência',
        nav_about: 'Sobre',
        nav_contact: 'Contato'
    }

    return (
        <footer className="bg-imi-900 text-white">
            <div className="container-custom py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    <div>
                        <h3 className="font-display text-2xl font-bold mb-4">IMI</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            {labels.tagline}
                        </p>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            {labels.description}
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">{labels.services_title}</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href={`/${lang}/avaliacoes`}
                                    className="text-slate-400 hover:text-white transition-colors text-sm block py-1"
                                >
                                    {labels.nav_appraisals}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/imoveis`}
                                    className="text-slate-400 hover:text-white transition-colors text-sm block py-1"
                                >
                                    {labels.nav_properties}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/credito`}
                                    className="text-slate-400 hover:text-white transition-colors text-sm block py-1"
                                >
                                    {labels.nav_credit}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/consultoria`}
                                    className="text-slate-400 hover:text-white transition-colors text-sm block py-1"
                                >
                                    {labels.nav_consulting}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/inteligencia`}
                                    className="text-slate-400 hover:text-white transition-colors text-sm block py-1"
                                >
                                    {labels.nav_intelligence}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">{labels.company_title}</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href={`/${lang}/sobre`}
                                    className="text-slate-400 hover:text-white transition-colors text-sm block py-1"
                                >
                                    {labels.nav_about}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/contato`}
                                    className="text-slate-400 hover:text-white transition-colors text-sm block py-1"
                                >
                                    {labels.nav_contact}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-4">{labels.contact_title}</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <a
                                    href="mailto:contato@iulemirandaimoveis.com.br"
                                    className="text-slate-400 hover:text-white transition-colors block py-1"
                                >
                                    contato@iulemirandaimoveis.com.br
                                </a>
                            </li>
                            <li>
                                <a
                                    href="tel:+5581997230455"
                                    className="text-slate-400 hover:text-white transition-colors block py-1"
                                >
                                    +55 (81) 99723-0455
                                </a>
                            </li>
                            <li className="text-slate-400 py-1">
                                {labels.location}
                            </li>
                            <li className="pt-2">
                                <a
                                    href="https://www.linkedin.com/in/iule-miranda"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                                >
                                    <Linkedin className="w-4 h-4" />
                                    LinkedIn
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="border-t border-white/10">
                <div className="container-custom py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
                        <p>{labels.rights}</p>
                        <div className="flex gap-6">
                            <Link href={`/${lang}/privacidade`} className="hover:text-white transition-colors">
                                {labels.privacy}
                            </Link>
                            <Link href={`/${lang}/termos`} className="hover:text-white transition-colors">
                                {labels.terms}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
