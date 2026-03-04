import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TrendingUp, ArrowUpRight, Info } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Índices IMI | Inteligência de Mercado',
    description: 'O Índice Imobiliário IMI — metodologia proprietária de precificação, tendência e liquidez para João Pessoa e região.',
}

type MarketIndex = {
    id: string
    name: string
    value: number
    base_date: string
    current_date: string
    variation_1m: number | null
    variation_3m: number | null
    variation_12m: number | null
    description: string | null
    methodology: string | null
    region: string | null
    is_published: boolean
    updated_at: string
}

async function getIndices(): Promise<MarketIndex[]> {
    try {
        const supabase = await createClient()
        const { data } = await supabase
            .from('market_indices')
            .select('*')
            .eq('is_published', true)
            .order('name', { ascending: true })
        return (data as MarketIndex[]) ?? []
    } catch {
        return []
    }
}

const FALLBACK: MarketIndex[] = [
    {
        id: '1',
        name: 'IMI Alto Padrão JP',
        value: 148.7,
        base_date: '2021-01-01',
        current_date: new Date().toISOString(),
        variation_1m: 1.2,
        variation_3m: 3.8,
        variation_12m: 15.2,
        description: 'Índice de precificação para imóveis acima de R$ 800k em João Pessoa — segmentos de orla e condomínios de alto padrão.',
        methodology: 'Base 100 em janeiro/2021. Calculado mensalmente a partir de transações reais, ofertas de mercado e laudos técnicos IMI. Ponderação por segmento, região e tipologia.',
        region: 'João Pessoa — PB',
        is_published: true,
        updated_at: new Date().toISOString(),
    },
    {
        id: '2',
        name: 'IMI Médio Padrão JP',
        value: 132.4,
        base_date: '2021-01-01',
        current_date: new Date().toISOString(),
        variation_1m: 0.8,
        variation_3m: 2.5,
        variation_12m: 10.4,
        description: 'Índice para imóveis entre R$ 250k e R$ 800k em João Pessoa — apartamentos e casas em bairros consolidados.',
        methodology: 'Base 100 em janeiro/2021. Metodologia idêntica ao IMI Alto Padrão com ajuste por segmento e faixa de valor.',
        region: 'João Pessoa — PB',
        is_published: true,
        updated_at: new Date().toISOString(),
    },
]

function varColor(v: number | null) {
    if (v === null) return 'text-[#9CA3AF]'
    if (v > 0) return 'text-emerald-400'
    if (v < 0) return 'text-red-400'
    return 'text-amber-400'
}

function formatVar(v: number | null) {
    if (v === null) return '—'
    const sign = v > 0 ? '+' : ''
    return `${sign}${v.toFixed(1)}%`
}

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    } catch {
        return '—'
    }
}

export default async function IndicesPage() {
    const rawIndices = await getIndices()
    const indices = rawIndices.length > 0 ? rawIndices : FALLBACK

    return (
        <main className="bg-[#0D0F14] min-h-screen">
            {/* HERO */}
            <section className="relative bg-[#0D1117] text-white pt-24 pb-16 md:pt-32 md:pb-20 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-px bg-[#334E68]" />
                            <span className="text-[#486581] font-bold uppercase tracking-[0.25em] text-[11px]">Inteligência · Índices</span>
                        </div>
                        <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-5">
                            Índices <span className="text-[#486581] italic">IMI</span>
                        </h1>
                        <p className="text-[#9CA3AF] text-base sm:text-lg font-light leading-relaxed">
                            Metodologia proprietária de precificação e tendência para o mercado de alto padrão de João Pessoa e regiões monitoradas pela IMI.
                        </p>
                    </div>
                </div>
            </section>

            {/* ÍNDICES */}
            <section className="py-12 md:py-16">
                <div className="container-custom space-y-6">
                    {indices.map((idx) => (
                        <div
                            key={idx.id}
                            className="rounded-3xl bg-[#141420] border border-white/[0.05] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-8 sm:p-10 border-b border-white/[0.05]">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <TrendingUp className="w-4 h-4 text-[#486581]" strokeWidth={2} />
                                            <span className="text-[#486581] text-xs font-bold uppercase tracking-[0.15em]">{idx.region ?? 'Brasil'}</span>
                                        </div>
                                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">{idx.name}</h2>
                                        {idx.description && (
                                            <p className="text-[#9CA3AF] text-sm font-light leading-relaxed max-w-2xl">{idx.description}</p>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-display text-5xl sm:text-6xl font-bold text-white tracking-tight">{idx.value.toFixed(1)}</div>
                                        <p className="text-[#9CA3AF] text-xs mt-1">Base 100 · {formatDate(idx.base_date)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Variações */}
                            <div className="grid grid-cols-3 divide-x divide-white/[0.05]">
                                {[
                                    { label: '1 Mês', value: idx.variation_1m },
                                    { label: '3 Meses', value: idx.variation_3m },
                                    { label: '12 Meses', value: idx.variation_12m },
                                ].map((v) => (
                                    <div key={v.label} className="p-5 sm:p-6 text-center">
                                        <p className="text-[#9CA3AF] text-[10px] font-bold uppercase tracking-[0.15em] mb-2">{v.label}</p>
                                        <p className={`font-display text-xl sm:text-2xl font-bold ${varColor(v.value)}`}>
                                            {formatVar(v.value)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Metodologia */}
                            {idx.methodology && (
                                <div className="px-8 sm:px-10 py-5 border-t border-white/[0.05] bg-[#0D1117]/60">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-4 h-4 text-[#486581] shrink-0 mt-0.5" />
                                        <p className="text-[#9CA3AF] text-xs leading-relaxed font-light">{idx.methodology}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* AVISO METODOLÓGICO */}
            <section className="pb-16 md:pb-24">
                <div className="container-custom">
                    <div className="p-8 sm:p-10 rounded-3xl bg-[#141420] border border-white/[0.05]">
                        <h3 className="font-display text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-[#486581]" />
                            Nota Metodológica
                        </h3>
                        <p className="text-[#9CA3AF] text-sm leading-relaxed font-light max-w-3xl">
                            Os Índices IMI são calculados mensalmente a partir de dados primários de campo, transações verificadas e ofertas ativas monitoradas pela IMI. A metodologia segue os princípios da ABNT NBR 14653 e inclui tratamento estatístico para remoção de outliers. Os índices são de uso exclusivo para orientação e não substituem laudos de avaliação individuais.
                        </p>
                        <div className="mt-6 flex flex-wrap gap-3">
                            {['ABNT NBR 14653', 'CRECI/CNAI', 'Dados Primários', 'Revisão Mensal'].map((tag) => (
                                <span key={tag} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#486581] bg-[#486581]/10 border border-[#486581]/20 px-3 py-1.5 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#141420] py-16 border-t border-white/[0.05]">
                <div className="container-custom">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 sm:p-10 rounded-3xl bg-[#0D1117] border border-white/[0.05]">
                        <div>
                            <p className="text-[#486581] text-xs font-bold uppercase tracking-[0.2em] mb-2">Relatórios Completos</p>
                            <h3 className="font-display text-2xl font-bold text-white">Estudos Técnicos de Mercado</h3>
                            <p className="text-[#9CA3AF] text-sm font-light mt-1">Dossiês e análises para download</p>
                        </div>
                        <a
                            href="../inteligencia/relatorios"
                            className="flex items-center gap-2 text-[#486581] font-semibold text-sm hover:text-white transition-colors"
                        >
                            Ver Relatórios <ArrowUpRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </section>
        </main>
    )
}
