import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Instagram, Linkedin, Mail, FileText, Film, BookOpen, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Conteúdo e Insights | IMI — Inteligência Imobiliária',
        description: 'Análises exclusivas, artigos técnicos e insights sobre o mercado imobiliário de alto padrão.',
        openGraph: {
            title: 'Conteúdo IMI — Inteligência Imobiliária',
            description: 'Análises exclusivas sobre o mercado imobiliário premium.',
        },
    }
}

const TIPO_CFG: Record<string, { label: string; icon: any; color: string }> = {
    post:       { label: 'Post',       icon: Instagram, color: '#E1306C' },
    artigo:     { label: 'Artigo',     icon: FileText,  color: '#486581' },
    newsletter: { label: 'Newsletter', icon: Mail,      color: '#6BB87B' },
    email:      { label: 'E-mail',     icon: Mail,      color: '#E8A87C' },
    reel:       { label: 'Reel',       icon: Film,      color: '#8B5CF6' },
    story:      { label: 'Story',      icon: Instagram, color: '#FD5949' },
}

const CANAL_CFG: Record<string, { icon: any; color: string }> = {
    instagram: { icon: Instagram, color: '#E1306C' },
    linkedin:  { icon: Linkedin,  color: '#0A66C2' },
    email:     { icon: Mail,      color: '#6BB87B' },
    blog:      { icon: FileText,  color: '#486581' },
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'hoje'
    if (days === 1) return 'ontem'
    if (days < 7) return `${days} dias atrás`
    if (days < 30) return `${Math.floor(days / 7)} sem. atrás`
    if (days < 365) return `${Math.floor(days / 30)} meses atrás`
    return `${Math.floor(days / 365)} ano(s) atrás`
}

export default async function ConteudoPage() {
    const supabase = await createClient()

    const { data: posts } = await supabase
        .from('conteudos')
        .select('id, titulo, tipo, canal, plataforma, status, visualizacoes, engajamento, data_publicacao, created_at')
        .eq('status', 'publicado')
        .order('data_publicacao', { ascending: false })
        .limit(30)

    const items = posts || []
    const totalViews = items.reduce((a: number, c: any) => a + (c.visualizacoes || 0), 0)
    const featured = items[0]
    const rest = items.slice(1)

    return (
        <main style={{ background: '#FAFAFA', minHeight: '100vh' }}>
            {/* ── Hero ── */}
            <section style={{ background: '#0D1117' }} className="relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.04] bg-[url('/grid.svg')]" />
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[140px] opacity-20" style={{ background: '#334E68' }} />
                <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-24 lg:py-32 relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px w-10" style={{ background: '#486581' }} />
                        <span className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: '#486581' }}>Inteligência de Mercado</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.05] mb-6" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Conteúdo &amp;<br />
                        <span style={{ color: '#486581' }}>Insights</span>
                    </h1>
                    <p className="text-lg max-w-xl font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                        Análises exclusivas, tendências e inteligência aplicada ao mercado imobiliário de alto padrão.
                    </p>

                    {items.length > 0 && (
                        <div className="flex gap-8 mt-10 pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                            <div>
                                <p className="text-3xl font-bold text-white">{items.length}</p>
                                <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Publicações</p>
                            </div>
                            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
                            <div>
                                <p className="text-3xl font-bold text-white">{totalViews.toLocaleString('pt-BR')}</p>
                                <p className="text-xs mt-1 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Visualizações</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-16 lg:py-20">
                {items.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center" style={{ background: '#F0F4F8' }}>
                            <BookOpen className="w-9 h-9" style={{ color: '#486581' }} strokeWidth={1.5} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3" style={{ color: '#1A1A1A', fontFamily: "'Playfair Display', Georgia, serif" }}>
                            Em Preparação
                        </h2>
                        <p className="text-base mb-8 max-w-md mx-auto" style={{ color: '#6C757D' }}>
                            Nossa equipe está produzindo análises e insights exclusivos sobre o mercado imobiliário premium.
                        </p>
                        <Link
                            href="https://www.instagram.com/iulemirandaimoveis"
                            target="_blank"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm"
                            style={{ background: '#0D1117', color: '#fff' }}
                        >
                            <Instagram size={16} />
                            Seguir no Instagram
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Post em destaque */}
                        {featured && (
                            <div className="mb-12">
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: '#486581' }}>Em Destaque</p>
                                <div className="rounded-3xl border p-8 lg:p-12" style={{ background: '#fff', borderColor: '#E9ECEF' }}>
                                    <div className="flex flex-wrap items-center gap-3 mb-5">
                                        {(() => {
                                            const cfg = TIPO_CFG[featured.tipo] || TIPO_CFG.post
                                            const Icon = cfg.icon
                                            return (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                                                    style={{ background: `${cfg.color}18`, color: cfg.color }}>
                                                    <Icon size={11} />
                                                    {cfg.label}
                                                </span>
                                            )
                                        })()}
                                        <span className="text-xs" style={{ color: '#ADB5BD' }}>
                                            {featured.data_publicacao ? timeAgo(featured.data_publicacao) : timeAgo(featured.created_at)}
                                        </span>
                                        {(featured.visualizacoes || 0) > 0 && (
                                            <span className="text-xs font-semibold" style={{ color: '#6C757D' }}>
                                                {(featured.visualizacoes || 0).toLocaleString('pt-BR')} views
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-3xl lg:text-4xl font-bold leading-[1.15]" style={{ color: '#1A1A1A', fontFamily: "'Playfair Display', Georgia, serif" }}>
                                        {featured.titulo}
                                    </h2>
                                    {(() => {
                                        const canal = featured.plataforma || featured.canal
                                        const cfg = CANAL_CFG[canal || '']
                                        if (!cfg) return null
                                        const Icon = cfg.icon
                                        return (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold mt-5" style={{ color: cfg.color }}>
                                                <Icon size={13} />
                                                {canal?.charAt(0).toUpperCase()}{canal?.slice(1)}
                                            </span>
                                        )
                                    })()}
                                </div>
                            </div>
                        )}

                        {/* Grid restante */}
                        {rest.length > 0 && (
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-5" style={{ color: '#6C757D' }}>Publicações Recentes</p>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {rest.map((post: any) => {
                                        const tipoCfg = TIPO_CFG[post.tipo] || TIPO_CFG.post
                                        const TipoIcon = tipoCfg.icon
                                        const canal = post.plataforma || post.canal
                                        const canalCfg = CANAL_CFG[canal || '']
                                        const CanalIcon = canalCfg?.icon

                                        return (
                                            <div key={post.id}
                                                className="rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                                                style={{ background: '#fff', borderColor: '#E9ECEF' }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                                                        style={{ background: `${tipoCfg.color}14`, color: tipoCfg.color }}>
                                                        <TipoIcon size={10} />
                                                        {tipoCfg.label}
                                                    </span>
                                                    {CanalIcon && canalCfg && (
                                                        <CanalIcon size={14} style={{ color: canalCfg.color, opacity: 0.6 }} />
                                                    )}
                                                </div>
                                                <h3 className="text-[15px] font-semibold leading-snug flex-1" style={{ color: '#1A1A1A', fontFamily: "'Playfair Display', Georgia, serif" }}>
                                                    {post.titulo}
                                                </h3>
                                                <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: '#F0F4F8' }}>
                                                    <span className="flex items-center gap-1 text-[11px]" style={{ color: '#ADB5BD' }}>
                                                        <Clock size={10} />
                                                        {post.data_publicacao ? timeAgo(post.data_publicacao) : timeAgo(post.created_at)}
                                                    </span>
                                                    {(post.visualizacoes || 0) > 0 && (
                                                        <span className="text-[11px] font-medium ml-auto" style={{ color: '#6C757D' }}>
                                                            {(post.visualizacoes || 0).toLocaleString('pt-BR')} views
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* CTA Newsletter */}
                        <div className="mt-16 rounded-3xl p-10 lg:p-14 text-center" style={{ background: '#0D1117' }}>
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] mb-4" style={{ color: '#486581' }}>Newsletter</p>
                            <h2 className="text-3xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                                Receba Inteligência de Mercado
                            </h2>
                            <p className="mb-8 max-w-sm mx-auto text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                Análises exclusivas direto no seu e-mail. Sem spam, apenas insights que importam.
                            </p>
                            <Link href="/pt/contato"
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm"
                                style={{ background: '#334E68', color: '#fff' }}
                            >
                                <Mail size={16} />
                                Inscrever na Newsletter
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </main>
    )
}
