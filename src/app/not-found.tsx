'use client'

import React from 'react'
import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B1928] text-[#F0ECE4] p-8">
            <div className="bg-[#142840] p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-md w-full border border-[rgba(200,164,74,0.18)]">
                <div className="w-16 h-16 bg-[#1A3250] rounded-full flex items-center justify-center mb-6">
                    <FileQuestion className="w-8 h-8 text-[#C8A44A]" />
                </div>

                <h2 className="text-2xl font-bold mb-2 text-[#F0ECE4]">Página não encontrada (404)</h2>
                <p className="text-[#A8B0BC] text-center mb-8">
                    A página que você está tentando acessar não existe ou foi removida.
                </p>

                <div className="flex flex-col w-full gap-3">
                    <Link
                        href="/pt"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0A1624] text-white border border-[rgba(200,164,74,0.3)] rounded-xl font-bold hover:bg-[#0E1C30] transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <Home className="w-4 h-4" />
                        Ir para Início
                    </Link>
                    <Link
                        href="/"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#142840] border border-[rgba(200,164,74,0.25)] text-[#A8B0BC] rounded-xl font-bold hover:bg-[#1A3250] transition-all"
                    >
                        Voltar ao Site
                    </Link>
                </div>
            </div>
        </div>
    )
}
