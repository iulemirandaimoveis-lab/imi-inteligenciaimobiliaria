import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FileText, Download, CalendarDays, ArrowUpRight, BookOpen } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Relatórios de Mercado | Inteligência IMI',
    description: 'Estudos técnicos, dossiês de bairro e análises comparativas do mercado imobiliário de João Pessoa e litoral da Paraíba.',
}

type Report = {
    id: string
    title: string
    summary: string | null
    pdf_url: string | null
    published_at: string | null
    category: string | null
    is_published: boolean
    cover_image: string | null
    slug: string | null
    created_at: string
}

async function getReports(): Promise<Report[]> {
    try {
        const supabase = await createClient()
        const { data } = await supabase
            .from('market_reports')
            .select('*')
            .eq('is_published', true)
            .order('published_at', { ascending: false })
        return (data as Report[]) ?? []
    } catch {
        return []
    }
}

const FALLBACK: Report[] = [
    {
        id: '1',
        title: 'Panorama do Alto Padrão — João Pessoa 2024',
        summary: 'Análise completa do mercado de imóveis acima de R$ 800k em João Pessoa. Inclui dados de lançamentos, velocidade de vendas, preço médio m² por bairro e perspectivas para 2025.',
        pdf_url: null,
        published_at: '2024-12-01',
        category: 'Panorama Anual',
        is_published: true,
        cover_image: null,
        slug: 'panorama-alto-padrao-jp-2024',
        created_at: new Date().toISOString(),
    },
    {
        id: '2',
        title: 'Dossiê Bairro: Altiplano Cabo Branco',
        summary: 'Levantamento técnico completo do Altiplano Cabo Branco — evolução histórica de preços, oferta ativa, projetos aprovados e análise de liquidez por tipologia.',
        pdf_url: null,
        published_at: '2024-10-15',
        category: 'Dossiê de Bairro',
        is_published: true,
        cover_image: null,
        slug: 'dossie-altiplano-cabo-branco',
        created_at: new Date().toISOString(),
    },
    {
        id: '3',
        title: 'Análise Comparativa — Orla Norte vs. Orla Sul',
        summary: 'Comparativo técnico entre as orlas norte e sul de João Pessoa: diferença de pricing, perfil de comprador, velocidade de absorção e retorno potencial de locação.',
        pdf_url: null,
        published_at: '2024-08-20',
        category: 'Análise Comparativa',
        is_published: true,
        cover_image: null,
        slug: 'comparativo-orla-norte-sul',
        created_at: new Date().toISOString(),
    },
]

function formatDate(iso: string | null) {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch {
        return '—'
    }
}

const CATEGORY_COLORS: Record<string, string> = {
    'Panorama Anual': 'text-[#86A8C8] bg-[#86A8C8]/10 border-[#86A8C8]/20',
    'Dossiê de Bairro': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'Análise Comparativa': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'default': 'text-[#9CA3AF] bg-white/[0.05] border-white/[0.08]',
}

function categoryColor(cat: string | null) {
    if (!cat) return CATEGORY_COLORS.default
    return CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.default
}

export default async function RelatoriosPage({ params }: { params: { lang: string } }) {
    const rawReports = await getReports()
    const reports = rawReports.length > 0 ? rawReports : FALLBACK
    const { lang } = params

    return (
        <main className="bg-[#0D0F14] min-h-screen">
            {/* HERO */}
            <section className="relative bg-[#0D1117] text-white pt-24 pb-16 md:pt-32 md:pb-20 border-b border-white/[0.05]">
                <div className="container-custom">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-px bg-[#334E68]" />
                                <span className="text-[#486581] font-bold uppercase tracking-[0.25em] text-[11px]">Inteligência · Relatórios</span>
                            </div>
                            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3">
                                Estudos <span className="text-[#486581] italic">Técnicos</span>
                            </h1>
                            <p className="text-[#9CA3AF] text-sm sm:text-base font-light leading-relaxed max-w-xl">
                                Dossiês de bairro, panoramas anuais e análises comparativas produzidos pela equipe IMI.
                            </p>
                        </div>
                        <div className="text-right shrink-0">
                            <div className="font-display text-4xl font-bold text-white">{reports.length}</div>
                            <p className="text-[#9CA3AF] text-xs mt-0.5">relatórios disponíveis</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* LISTA DE RELATÓRIOS */}
            <section className="py-12 md:py-16">
                <div className="container-custom space-y-5">
                    {reports.map((report) => (
                        <div
                            key={report.id}
                            className="group rounded-2xl bg-[#141420] border border-white/[0.05] hover:border-[#334E68]/40 transition-colors overflow-hidden"
                        >
                            <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
                                {/* Ícone */}
                                <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 bg-[#1A1E2A] text-[#486581] rounded-2xl flex items-center justify-center border border-white/[0.05] group-hover:scale-105 transition-transform">
                                    <FileText className="w-6 h-6" strokeWidth={1.5} />
                                </div>

                                {/* Conteúdo */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        {report.category && (
                                            <span className={`text-[10px] font-bold uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border ${categoryColor(report.category)}`}>
                                                {report.category}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5 text-[#9CA3AF] text-xs">
                                            <CalendarDays className="w-3.5 h-3.5" />
                                            {formatDate(report.published_at)}
                                        </span>
                                    </div>
                                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-[#86A8C8] transition-colors">
                                        {report.title}
                                    </h2>
                                    {report.summary && (
                                        <p className="text-[#9CA3AF] text-sm leading-relaxed font-light line-clamp-2">
                                            {report.summary}
                                        </p>
                                    )}
                                </div>

                                {/* CTA */}
                                <div className="flex sm:flex-col justify-end items-end gap-3 shrink-0">
                                    {report.pdf_url ? (
                                        <a
                                            href={report.pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 h-10 px-5 rounded-xl bg-[#102A43] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#1A3F5C] transition-all shadow-[0_2px_8px_rgba(16,42,67,0.4)]"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                            Baixar PDF
                                        </a>
                                    ) : (
                                        <span className="flex items-center gap-2 h-10 px-5 rounded-xl border border-white/[0.08] text-[#9CA3AF] font-bold text-xs uppercase tracking-wider cursor-not-allowed opacity-50">
                                            <Download className="w-3.5 h-3.5" />
                                            Em breve
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* BIBLIOTECA EBOOKS */}
            <section className="pb-16 md:pb-24">
                <div className="container-custom">
                    <div className="p-8 sm:p-10 rounded-3xl bg-[#141420] border border-white/[0.05]">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 bg-[#1A1E2A] text-[#486581] rounded-2xl flex items-center justify-center border border-white/[0.05]">
                                    <BookOpen className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h3 className="font-display text-xl font-bold text-white">Biblioteca de Ebooks</h3>
                                    <p className="text-[#9CA3AF] text-sm font-light mt-0.5">Publicações educacionais da Iule Miranda</p>
                                </div>
                            </div>
                            <Link
                                href={`/${lang}/biblioteca`}
                                className="flex items-center gap-2 text-[#486581] font-semibold text-sm hover:text-white transition-colors"
                            >
                                Ver Biblioteca <ArrowUpRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-[#141420] py-16 border-t border-white/[0.05]">
                <div className="container-custom text-center">
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-4">
                        Precisa de um <span className="text-[#486581] italic">estudo personalizado</span>?
                    </h2>
                    <p className="text-[#9CA3AF] text-sm font-light mb-8 max-w-md mx-auto">
                        Encomende um dossiê técnico de mercado, análise de viabilidade ou laudo de avaliação com a equipe IMI.
                    </p>
                    <a
                        href="https://wa.me/5581997230455"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-[#102A43] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#1A3F5C] transition-all shadow-[0_4px_14px_rgba(16,42,67,0.4)]"
                    >
                        Encomendar Estudo
                    </a>
                </div>
            </section>
        </main>
    )
}
