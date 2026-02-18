export default function Footer() {
    return (
        <footer className="bg-gradient-to-b from-[#141426] to-[#0e0e1a] text-white px-6 py-20">
            <div className="max-w-7xl mx-auto">

                <h2 className="text-3xl font-serif font-black mb-4">
                    IMI – Inteligência Imobiliária
                </h2>

                <p className="text-slate-400 max-w-md mb-12 text-sm leading-relaxed">
                    Decisões imobiliárias baseadas em inteligência,
                    método e segurança.
                </p>

                <div className="bg-[#1b1b2e] p-8 rounded-sm border-l-[6px] border-yellow-400 mb-16 shadow-xl">
                    <strong className="text-xl block mb-1">Iule Miranda</strong>
                    <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">
                        CRECI 17933 | CNAI 53290
                    </span>
                    <br /><br />
                    <div className="space-y-3 text-slate-300 text-sm">
                        <p className="flex items-center gap-3">iulemirandaimoveis@gmail.com</p>
                        <p className="flex items-center gap-3">+55 81 99723-0455</p>
                        <p className="flex items-center gap-3">LinkedIn</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
                    <div>
                        <h4 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">Avaliações</h4>
                        <ul className="space-y-4 text-slate-400 text-sm">
                            <li className="hover:text-white cursor-pointer transition-colors">Avaliações</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Imóveis</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Crédito</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Consultoria</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Inteligência</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Projetos</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-white uppercase text-xs tracking-widest">Empresa</h4>
                        <ul className="space-y-4 text-slate-400 text-sm">
                            <li className="hover:text-white cursor-pointer transition-colors">Sobre</li>
                            <li className="hover:text-white cursor-pointer transition-colors">Contato</li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[11px] text-slate-500 font-medium">
                        © 2026 IMI – Inteligência Imobiliária. Todos direitos reservados.
                    </p>

                    <div className="flex gap-6 text-[10px] font-bold tracking-[0.2em] text-slate-500">
                        <span className="text-yellow-400 cursor-pointer">PT</span>
                        <span className="hover:text-slate-300 cursor-pointer">EN</span>
                        <span className="hover:text-slate-300 cursor-pointer">JP</span>
                        <span className="hover:text-slate-300 cursor-pointer">AR</span>
                        <span className="hover:text-slate-300 cursor-pointer">ES</span>
                    </div>
                </div>

            </div>
        </footer>
    )
}
