"use client"

import { useState } from "react"
import Link from "next/link"
import Drawer from "./Drawer"

export default function Header() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <header className="w-full fixed top-0 left-0 z-50 bg-white border-b border-neutral-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[72px] flex items-center justify-between">

                    <Link href="/pt" className="flex items-center gap-2.5 no-underline" aria-label="IMI - Página inicial">
                        {/* IMI monogram — Playfair Display 700 · Brand Identity v1.1 LIGHT */}
                        <span
                            className="leading-none select-none"
                            style={{
                                fontFamily: "'Playfair Display', Georgia, serif",
                                fontSize: 26,
                                fontWeight: 700,
                                color: '#0B1928',
                                letterSpacing: '2px',
                            }}
                        >
                            IMI
                        </span>
                        {/* Gold divider · 1px · Brand Identity v1.1 LIGHT */}
                        <div
                            className="flex-shrink-0"
                            style={{ width: 1, height: 28, background: '#A8842A' }}
                        />
                        {/* Tagline · Brand Identity v1.1 LIGHT — navy on light bg */}
                        <span
                            className="select-none hidden sm:block"
                            style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                letterSpacing: '2.5px',
                                textTransform: 'uppercase' as const,
                                color: '#0B1928',
                                lineHeight: 1.45,
                            }}
                        >
                            INTELIGÊNCIA<br />IMOBILIÁRIA
                        </span>
                    </Link>

                    <button
                        onClick={() => setOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-50 transition-colors"
                        aria-label="Abrir menu de navegação"
                    >
                        <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                            <path d="M0 1h20M0 7h20M0 13h20" stroke="#0B1928" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </header>

            <Drawer open={open} setOpen={setOpen} />
        </>
    )
}
