'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <>
            {/* Header Desktop + Mobile */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-gray-900">IMI</span>
                        <div className="hidden sm:block border-l border-gray-300 pl-3">
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Inteligência
                            </div>
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Imobiliária
                            </div>
                        </div>
                    </Link>

                    {/* Menu Desktop - Hidden on mobile */}
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link
                            href="/pt/avaliacoes"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            Avaliações
                        </Link>
                        <Link
                            href="/pt/imoveis"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            Imóveis
                        </Link>
                        <Link
                            href="/pt/construtoras"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            Construtoras
                        </Link>
                        <Link
                            href="/pt/credito"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            Crédito
                        </Link>
                        <Link
                            href="/pt/consultoria"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            Consultoria
                        </Link>
                        <Link
                            href="/pt/inteligencia"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            Inteligência
                        </Link>
                        <Link
                            href="/pt/sobre"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            Sobre
                        </Link>
                        <Link
                            href="/pt/contato"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            Contato
                        </Link>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 -mr-2"
                        aria-label="Menu"
                    >
                        {isMenuOpen ? (
                            <X size={24} className="text-gray-900" />
                        ) : (
                            <Menu size={24} className="text-gray-900" />
                        )}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-white lg:hidden"
                    style={{ top: '80px' }}
                >
                    <nav className="flex flex-col p-6 space-y-6">
                        <Link
                            href="/pt/avaliacoes"
                            className="text-base font-medium text-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Avaliações
                        </Link>
                        <Link
                            href="/pt/imoveis"
                            className="text-base font-medium text-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Imóveis
                        </Link>
                        <Link
                            href="/pt/construtoras"
                            className="text-base font-medium text-gray-700 bg-gray-50 -mx-6 px-6 py-4"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Construtoras
                        </Link>
                        <Link
                            href="/pt/credito"
                            className="text-base font-medium text-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Crédito
                        </Link>
                        <Link
                            href="/pt/consultoria"
                            className="text-base font-medium text-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Consultoria
                        </Link>
                        <Link
                            href="/pt/inteligencia"
                            className="text-base font-medium text-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Inteligência
                        </Link>
                        <Link
                            href="/pt/sobre"
                            className="text-base font-medium text-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Sobre
                        </Link>
                        <Link
                            href="/pt/contato"
                            className="text-base font-medium text-gray-700"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Contato
                        </Link>

                        {/* WhatsApp Button Mobile */}
                        <a
                            href="https://wa.me/5581997230455"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full mt-4 bg-gray-900 text-white text-center py-4 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                            Falar pelo WhatsApp
                        </a>

                        {/* Footer Info Mobile */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <p className="font-bold text-gray-900 mb-2">Iule Miranda</p>
                            <p className="text-sm text-gray-600">
                                <span className="text-yellow-600 font-medium">CRECI 17933</span> |{' '}
                                <span className="text-yellow-600 font-medium">CNAI 53290</span>
                            </p>
                        </div>
                    </nav>
                </div>
            )}

            {/* Spacer para compensar fixed header */}
            <div className="h-20" />
        </>
    )
}
