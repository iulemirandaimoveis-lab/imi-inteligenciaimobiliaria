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
                        {/* IMI wordmark — Playfair Display 700 per brandkit */}
                        <span
                            className="leading-none select-none"
                            style={{
                                fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
                                fontSize: 26,
                                fontWeight: 700,
                                color: '#0B1928',
                                letterSpacing: '0.04em',
                            }}
                        >
                            IMI
                        </span>
                        {/* Gold separator — brandkit: height of letter M */}
                        <div
                            className="flex-shrink-0"
                            style={{ width: 1, height: 22, background: '#C49D5B' }}
                        />
                        {/* Tagline — sans-serif, uppercase, wide tracking, navy */}
                        <span
                            className="leading-[1.25] select-none hidden sm:block"
                            style={{
                                fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
                                fontSize: 10,
                                fontWeight: 500,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase' as const,
                                color: '#4A5568',
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
