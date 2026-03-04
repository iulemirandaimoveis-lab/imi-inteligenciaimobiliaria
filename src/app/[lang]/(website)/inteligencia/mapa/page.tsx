import type { Metadata } from 'next'
import { Map, Clock, Layers, TrendingUp, Home } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Mapa de Calor | Inteligência IMI',
    description: 'Visualização geográfica de valorização imobiliária, densidade de oferta e liquidez por bairro em João Pessoa e litoral da Paraíba.',
}

const LAYERS = [
    {
        icon: TrendingUp,
        label: 'Valorização',
        description: 'Variação percentual de preço médio por bairro nos últimos 12 meses.',
    },
    {
        icon: Layers,
        label: 'Densidade de Oferta',
        description: 'Concentração de imóveis disponíveis por região — identifica excesso ou escassez de supply.',
    },
    {
        icon: Clock,
        label: 'Liquidez',
        description: 'Tempo médio de venda por bairro e segmento — identifica regiões de alta absorção.',
    },
    {
        icon: Home,
        label: 'Custo Médio m²',
        description: 'Mapa de calor de preço médio por m² em categorias de standart.',
    },
]

export default function MapaPage() {
    return (
        <main className="bg-[#0D0F14] min-h-screen">
            {/* HERO */}
            <section className="relative bg-[#0D1117] text-white pt-24 pb-16 md:pt-32 md:pb-20 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-px bg-[#334E68]" />
                            <span className="text-[#486581] font-bold uppercase tracking-[0.25em] text-[11px]">Inteligência · Mapa</span>
                        </div>
                        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-5">
                            Mapa de <span className="text-[#486581] italic">Calor</span>
                        </h1>
                        <p className="text-[#9CA3AF] text-base sm:text-lg font-light leading-relaxed">
                            Visualização geográfica interativa de valorização, densidade de oferta e liquidez por bairro — João Pessoa e litoral da Paraíba.
                        </p>
                    </div>
                </div>
            </section>

            {/* MAPA PLACEHOLDER */}
            <section className="py-12 md:py-16">
                <div className="container-custom">
                    <div className="rounded-3xl bg-[#141420] border border-white/[0.05] overflow-hidden">
                        {/* Controles fictícios */}
                        <div className="p-5 border-b border-white/[0.05] flex flex-wrap gap-3 items-center">
                            <span className="text-[#9CA3AF] text-xs font-bold uppercase tracking-[0.15em]">Camada:</span>
                            {['Valorização', 'Oferta', 'Liquidez', 'Preço m²'].map((layer) => (
                                <button
                                    key={layer}
                                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/[0.08] text-[#9CA3AF] bg-[#1A1E2A] cursor-not-allowed opacity-60"
                                    disabled
                                >
                                    {layer}
                                </button>
                            ))}
                            <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full uppercase tracking-[0.15em]">
                                Em Desenvolvimento
                            </span>
                        </div>

                        {/* Área do mapa */}
                        <div className="relative h-[420px] sm:h-[540px] bg-[#0D1117] flex items-center justify-center">
                            {/* Grid decorativo */}
                            <div
                                className="absolute inset-0 opacity-[0.03]"
                                style={{
                                    backgroundImage: 'linear-gradient(rgba(72,101,129,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(72,101,129,0.6) 1px, transparent 1px)',
                                    backgroundSize: '40px 40px',
                                }}
                            />
                            {/* Blobs decorativos simulando heatmap */}
                            <div className="absolute w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl top-20 left-1/4" />
                            <div className="absolute w-32 h-32 rounded-full bg-[#486581]/15 blur-3xl top-1/3 left-1/2" />
                            <div className="absolute w-28 h-28 rounded-full bg-amber-500/10 blur-3xl bottom-20 right-1/4" />

                            <div className="relative z-10 text-center px-6">
                                <div className="w-16 h-16 bg-[#141420] border border-white/[0.08] rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <Map className="w-7 h-7 text-[#486581]" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-display text-xl font-bold text-white mb-2">Mapa Interativo em Desenvolvimento</h3>
                                <p className="text-[#9CA3AF] text-sm font-light max-w-sm mx-auto leading-relaxed">
                                    O mapa de calor geográfico com dados de valorização e liquidez por bairro está em fase de integração.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CAMADAS PLANEJADAS */}
            <section className="pb-16 md:pb-24">
                <div className="container-custom">
                    <div className="mb-8">
                        <h2 className="font-display text-2xl font-bold text-white">Camadas Planejadas</h2>
                        <p className="text-[#9CA3AF] text-sm font-light mt-1">Visualizações disponíveis quando o mapa for lançado.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {LAYERS.map((layer) => (
                            <div
                                key={layer.label}
                                className="p-6 rounded-2xl bg-[#141420] border border-white/[0.05]"
                            >
                                <div className="w-10 h-10 bg-[#1A1E2A] text-[#486581] rounded-xl flex items-center justify-center mb-4 border border-white/[0.05]">
                                    <layer.icon className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                                <h3 className="font-display text-base font-bold text-white mb-2">{layer.label}</h3>
                                <p className="text-[#9CA3AF] text-xs leading-relaxed font-light">{layer.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#141420] py-16 border-t border-white/[0.05]">
                <div className="container-custom text-center">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                        Quer análise geográfica <span className="text-[#486581] italic">personalizada</span>?
                    </h2>
                    <p className="text-[#9CA3AF] text-sm font-light mb-8 max-w-md mx-auto">
                        Enquanto o mapa interativo não é lançado, nossa equipe realiza análises de localização sob demanda.
                    </p>
                    <a
                        href="https://wa.me/5581997230455"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#102A43] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#1A3F5C] transition-all shadow-[0_4px_14px_rgba(16,42,67,0.4)]"
                    >
                        Solicitar Análise de Localização
                    </a>
                </div>
            </section>
        </main>
    )
}
