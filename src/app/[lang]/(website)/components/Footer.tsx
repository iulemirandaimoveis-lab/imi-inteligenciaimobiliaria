'use client'

import Link from 'next/link'
import { Mail, Phone, Linkedin } from 'lucide-react'

export default function Footer({ lang = 'pt' }: { lang?: string }) {
    return (
        <footer className="bg-[#1A1A1A] text-white">
            <div className="max-w-7xl mx-auto px-6 py-16">
                {/* Top Section */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">
                        IMI – Inteligência Imobiliária
                    </h2>
                    <p className="text-gray-400 max-w-2xl">
                        Decisões imobiliárias baseadas em inteligência, método e segurança.
                    </p>
                </div>

                {/* Contact Card */}
                <div className="mb-12 border-l-4 border-yellow-600 pl-6">
                    <p className="font-bold text-lg mb-2">Iule Miranda</p>
                    <p className="text-yellow-600 font-medium mb-6">
                        CRECI 17933 | CNAI 53290
                    </p>

                    <div className="space-y-4">
                        <a
                            href="mailto:iulemirandaimoveis@gmail.com"
                            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                        >
                            <Mail size={20} />
                            <span>iulemirandaimoveis@gmail.com</span>
                        </a>

                        <a
                            href="tel:+5581997230455"
                            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                        >
                            <Phone size={20} />
                            <span>+55 81 99723-0455</span>
                        </a>

                        <a
                            href="https://linkedin.com/in/iule-miranda"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                        >
                            <Linkedin size={20} />
                            <span>LinkedIn</span>
                        </a>
                    </div>
                </div>

                {/* Navigation Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                    {/* Avaliações Section */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Avaliações</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href={`/${lang}/avaliacoes`}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Avaliações
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/imoveis`}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Imóveis
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/credito`}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Crédito
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/consultoria`}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Consultoria
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/inteligencia`}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Inteligência
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/projetos`}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Projetos
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Empresa Section */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Empresa</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href={`/${lang}/sobre`}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Sobre
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href={`/${lang}/contato`}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    Contato
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500">
                            © 2026 IMI – Inteligência Imobiliária. Todos os direitos
                            reservados.
                        </p>

                        {/* Language Switcher */}
                        <div className="flex items-center gap-4">
                            <Link href="/pt" className={`text-sm font-bold ${lang === 'pt' ? 'text-yellow-600' : 'text-gray-500 hover:text-gray-300'}`}>PT</Link>
                            <Link href="/en" className={`text-sm font-bold ${lang === 'en' ? 'text-yellow-600' : 'text-gray-500 hover:text-gray-300'}`}>EN</Link>
                            <Link href="/ja" className={`text-sm font-bold ${lang === 'ja' ? 'text-yellow-600' : 'text-gray-500 hover:text-gray-300'}`}>JP</Link>
                            <Link href="/ar" className={`text-sm font-bold ${lang === 'ar' ? 'text-yellow-600' : 'text-gray-500 hover:text-gray-300'}`}>AR</Link>
                            <Link href="/es" className={`text-sm font-bold ${lang === 'es' ? 'text-yellow-600' : 'text-gray-500 hover:text-gray-300'}`}>ES</Link>
                        </div>
                    </div>

                    {/* Legal Links */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-4">
                        <Link
                            href={`/${lang}/politica-privacidade`}
                            className="text-sm text-gray-500 hover:text-gray-300"
                        >
                            Política de Privacidade
                        </Link>
                        <Link
                            href={`/${lang}/termos-uso`}
                            className="text-sm text-gray-500 hover:text-gray-300"
                        >
                            Termos de Uso
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
