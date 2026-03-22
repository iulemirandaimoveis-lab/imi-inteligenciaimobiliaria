import { SupabaseClient } from '@supabase/supabase-js'

interface ContextBlock {
    label: string
    data: string
    tokenEstimate: number
}

export async function buildContext(message: string, supabase: SupabaseClient, maxTokens = 4000): Promise<string> {
    const lower = message.toLowerCase()
    const blocks: ContextBlock[] = []

    // Detect relevant entities and fetch
    if (['lead', 'leads', 'contato', 'prospect', 'pipeline', 'funil'].some(k => lower.includes(k))) {
        const b = await fetchLeads(supabase)
        if (b) blocks.push(b)
    }
    if (['imóvel', 'imovel', 'imóveis', 'imoveis', 'apartamento', 'casa', 'preço', 'm²'].some(k => lower.includes(k))) {
        const b = await fetchImoveis(supabase)
        if (b) blocks.push(b)
    }
    if (['contrato', 'contratos', 'comissão', 'venda', 'vendas'].some(k => lower.includes(k))) {
        const b = await fetchContratos(supabase)
        if (b) blocks.push(b)
    }
    if (['métrica', 'kpi', 'dashboard', 'relatório', 'desempenho', 'receita'].some(k => lower.includes(k))) {
        const b = await fetchMetricas(supabase)
        if (b) blocks.push(b)
    }
    if (['equipe', 'corretor', 'corretores', 'membro'].some(k => lower.includes(k))) {
        const b = await fetchEquipe(supabase)
        if (b) blocks.push(b)
    }
    if (['campanha', 'ads', 'marketing', 'meta ads'].some(k => lower.includes(k))) {
        const b = await fetchCampanhas(supabase)
        if (b) blocks.push(b)
    }
    if (['avaliação', 'avaliacao', 'nbr', '14653', 'laudo', 'perito', 'pericia', 'bpo',
         'investir', 'investimento', 'reit', 'fii', 'patrimônio', 'patrimonio', 'holding',
         'tributação', 'tributacao', 'sucessório', 'sucessorio', 'dubai', 'eua', 'portugal',
         'corretagem', 'proptech', 'automação', 'automacao', 'livro', 'livros', 'biblioteca',
         'terreno', 'aluguel', 'renda'].some(k => lower.includes(k))) {
        const b = await fetchBookKnowledge(lower)
        if (b) blocks.push(b)
    }

    // If no specific context detected, provide general summary
    if (blocks.length === 0) {
        const b = await fetchResumoGeral(supabase)
        if (b) blocks.push(b)
    }

    // Truncate to fit token budget
    let total = 0
    const final: string[] = []
    for (const block of blocks) {
        if (total + block.tokenEstimate > maxTokens) break
        final.push(`[DADOS DO SISTEMA — ${block.label}]\n${block.data}`)
        total += block.tokenEstimate
    }
    return final.join('\n\n---\n\n')
}

async function fetchLeads(supabase: SupabaseClient): Promise<ContextBlock | null> {
    const { data } = await supabase.from('leads').select('id, name, email, phone, status, source, budget, created_at').order('created_at', { ascending: false }).limit(25)
    if (!data?.length) return null
    const text = data.map(l => `• ${l.name} | ${l.status} | ${l.source || '?'} | R$${l.budget?.toLocaleString() || '?'}`).join('\n')
    return { label: 'Leads recentes', data: `${data.length} leads:\n${text}`, tokenEstimate: Math.ceil(text.length / 4) }
}

async function fetchImoveis(supabase: SupabaseClient): Promise<ContextBlock | null> {
    const { data } = await supabase.from('developments').select('id, name, neighborhood, city, price_from, price_to, bedrooms, area_from, status_commercial').order('created_at', { ascending: false }).limit(20)
    if (!data?.length) return null
    const text = data.map(d => `• ${d.name} | ${d.neighborhood}, ${d.city} | R$${d.price_from?.toLocaleString() || '?'}-${d.price_to?.toLocaleString() || '?'} | ${d.bedrooms || '?'}q | ${d.area_from || '?'}m² | ${d.status_commercial}`).join('\n')
    return { label: 'Imóveis', data: `${data.length} imóveis:\n${text}`, tokenEstimate: Math.ceil(text.length / 4) }
}

async function fetchContratos(supabase: SupabaseClient): Promise<ContextBlock | null> {
    const { data } = await supabase.from('contratos').select('id, title, status, value, commission_rate, created_at').order('created_at', { ascending: false }).limit(15)
    if (!data?.length) return null
    const text = data.map(c => `• ${c.title} | ${c.status} | R$${c.value?.toLocaleString() || '?'} | ${c.commission_rate || '?'}%`).join('\n')
    return { label: 'Contratos', data: `${data.length} contratos:\n${text}`, tokenEstimate: Math.ceil(text.length / 4) }
}

async function fetchMetricas(supabase: SupabaseClient): Promise<ContextBlock | null> {
    const { count: totalLeads } = await supabase.from('leads').select('id', { count: 'exact', head: true })
    const { count: totalImoveis } = await supabase.from('developments').select('id', { count: 'exact', head: true })
    const { count: totalContratos } = await supabase.from('contratos').select('id', { count: 'exact', head: true })
    const { count: totalBrokers } = await supabase.from('brokers').select('id', { count: 'exact', head: true })
    const text = `Leads: ${totalLeads || 0}\nImóveis: ${totalImoveis || 0}\nContratos: ${totalContratos || 0}\nCorretores: ${totalBrokers || 0}`
    return { label: 'Métricas gerais', data: text, tokenEstimate: 50 }
}

async function fetchEquipe(supabase: SupabaseClient): Promise<ContextBlock | null> {
    const { data } = await supabase.from('brokers').select('name, email, role, status, creci').order('name')
    if (!data?.length) return null
    const text = data.map(b => `• ${b.name} | ${b.role} | ${b.status} | CRECI: ${b.creci || 'N/A'}`).join('\n')
    return { label: 'Equipe', data: `${data.length} membros:\n${text}`, tokenEstimate: Math.ceil(text.length / 4) }
}

async function fetchCampanhas(supabase: SupabaseClient): Promise<ContextBlock | null> {
    const { data } = await supabase.from('campaigns').select('id, name, platform, status, budget, spent, leads_generated, created_at').order('created_at', { ascending: false }).limit(10)
    if (!data?.length) return null
    const text = data.map(c => `• ${c.name} | ${c.platform} | ${c.status} | Budget: R$${c.budget?.toLocaleString() || '?'} | Leads: ${c.leads_generated || 0}`).join('\n')
    return { label: 'Campanhas', data: `${data.length} campanhas:\n${text}`, tokenEstimate: Math.ceil(text.length / 4) }
}

async function fetchBookKnowledge(query: string): Promise<ContextBlock | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'
        const res = await fetch(`${baseUrl}/books/index.json`)
        if (!res.ok) return null
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const books: any[] = await res.json()

        // Find relevant books by matching query keywords to titles
        const keywords = query.split(/\s+/).filter(w => w.length > 3)
        const scored = books.map(b => {
            const titleLower = (b.title + ' ' + (b.subtitle || '')).toLowerCase()
            const score = keywords.reduce((s: number, k: string) => s + (titleLower.includes(k) ? 1 : 0), 0)
            return { ...b, score }
        }).filter(b => b.score > 0).sort((a, b) => b.score - a.score).slice(0, 5)

        // If no specific match, return all categories
        const relevant = scored.length > 0 ? scored : books.slice(0, 10)

        const text = [
            `A IMI tem uma biblioteca de ${books.length} livros autorais sobre mercado imobiliário.`,
            `Livros relevantes para esta consulta:`,
            ...relevant.map((b: { title: string; subtitle?: string; category: string; chapters: number }) =>
                `• "${b.title}" — ${b.subtitle || ''} (${b.chapters} capítulos, categoria: ${b.category})`
            ),
            ``,
            `Categorias disponíveis: Avaliação (NBR 14653, BPO, perícia), Investimento (Brasil, EUA, Portugal, Dubai, REITs),`,
            `Patrimonial (holding, tributação, sucessório), Tecnologia (IA, PropTech, automação), Profissional (corretagem, gestão).`,
            ``,
            `Use este conhecimento para responder com autoridade sobre o mercado imobiliário.`,
        ].join('\n')

        return { label: 'Biblioteca IMI — Base de Conhecimento', data: text, tokenEstimate: Math.ceil(text.length / 4) }
    } catch {
        return null
    }
}

async function fetchResumoGeral(supabase: SupabaseClient): Promise<ContextBlock | null> {
    return fetchMetricas(supabase)
}
