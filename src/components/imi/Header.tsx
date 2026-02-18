"use client"

import { useState } from "react"
import Drawer from "./Drawer"

export default function Header() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <header className="w-full fixed top-0 left-0 z-50 bg-white border-b border-neutral-200">
                <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">

                    <div className="flex items-center gap-3">
                        <span className="text-2xl font-serif font-black tracking-tight text-black">
                            IMI
                        </span>
                        <div className="h-6 w-[1px] bg-neutral-200 ml-1"></div>
                        <span className="text-[11px] tracking-[2px] text-slate-500 uppercase font-bold">
                            Inteligência Imobiliária
                        </span>
                    </div>

                    <button
                        onClick={() => setOpen(true)}
                        className="text-3xl text-black hover:opacity-70 transition-opacity"
                    >
                        ☰
                    </button>
                </div>
            </header>

            <Drawer open={open} setOpen={setOpen} />
        </>
    )
}
