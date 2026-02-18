"use client"

interface Props {
    open: boolean
    setOpen: (value: boolean) => void
}

export default function Drawer({ open, setOpen }: Props) {
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
                <div className="p-8 flex justify-end">
                    <button onClick={() => setOpen(false)} className="text-2xl text-slate-400 hover:text-black transition-colors">
                        ✕
                    </button>
                </div>

                <nav className="px-8 flex-1 overflow-y-auto">
                    <ul className="space-y-1 text-[18px] text-slate-700 font-bold">
                        <li className="py-3 px-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">Avaliações</li>
                        <li className="py-3 px-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">Imóveis</li>

                        <li className="py-3 bg-slate-100 rounded-lg border-l-4 border-yellow-400 pl-4 text-black">
                            Construtoras
                        </li>

                        <li className="py-3 px-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">Crédito</li>
                        <li className="py-3 px-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">Consultoria</li>
                        <li className="py-3 px-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">Inteligência</li>
                        <li className="py-3 px-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">Sobre</li>
                        <li className="py-3 px-4 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors">Contato</li>
                    </ul>

                    <button className="w-full mt-8 bg-[#1e1e2f] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black transition-all active:scale-[0.98]">
                        Falar pelo WhatsApp
                    </button>

                    <div className="flex gap-3 mt-8">
                        <span className="bg-[#1e1e2f] rounded-xl w-12 h-12 flex items-center justify-center text-2xl border-2 border-yellow-400 shadow-sm cursor-pointer">🇧🇷</span>
                        <span className="bg-slate-50 rounded-xl w-12 h-12 flex items-center justify-center text-2xl opacity-40 hover:opacity-100 transition-opacity cursor-pointer">🇬🇧</span>
                        <span className="bg-slate-50 rounded-xl w-12 h-12 flex items-center justify-center text-2xl opacity-40 hover:opacity-100 transition-opacity cursor-pointer">🇯🇵</span>
                        <span className="bg-slate-50 rounded-xl w-12 h-12 flex items-center justify-center text-2xl opacity-40 hover:opacity-100 transition-opacity cursor-pointer">🇸🇦</span>
                    </div>

                    <div className="mt-12 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
                        <strong className="text-lg text-slate-900">Iule Miranda</strong>
                        <div className="h-0.5 w-8 bg-yellow-400 mx-auto my-2 rounded-full"></div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            CRECI 17933 | CNAI 53290
                        </p>
                    </div>
                </nav>
            </div>
        </div>
    )
}
