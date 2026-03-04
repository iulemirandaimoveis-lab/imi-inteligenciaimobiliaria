import { createClient } from '@/lib/supabase/server'
import BibliotecaClient from './BibliotecaClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Biblioteca | IMI — Inteligência Imobiliária',
        description: 'Coleção completa de ebooks sobre avaliação de imóveis, investimentos imobiliários, mercado internacional e inteligência patrimonial.',
        openGraph: {
            title: 'Biblioteca IMI — Inteligência Imobiliária',
            description: 'Ebooks técnicos e estratégicos sobre o mercado imobiliário.',
            images: ['/og-biblioteca.jpg'],
        },
    }
}

export interface Ebook {
    id: string
    slug: string
    title: string
    subtitle: string | null
    description: string | null
    cover_image: string | null
    amazon_link: string | null
    amazon_url: string | null
    pilar: string | null
    publication_status: string
    featured: boolean
    sort_order: number
    release_date: string | null
}

const PILARES = [
    { key: 'todos',        label: 'Todos' },
    { key: 'avaliacao',    label: 'Avaliação' },
    { key: 'investimentos',label: 'Investimentos' },
    { key: 'internacional',label: 'Internacional' },
    { key: 'patrimonial',  label: 'Patrimônio' },
    { key: 'operacao',     label: 'Operação' },
    { key: 'tecnologia',   label: 'Tecnologia' },
]

// Catálogo completo de 27 ebooks (seeds para a UI quando BD estiver vazio)
const CATALOG_SEED: Omit<Ebook, 'id'>[] = [
    // Pilar 1 — Avaliação
    { slug: 'avaliacao-de-imoveis-na-pratica', title: 'Avaliação de Imóveis na Prática', subtitle: 'Método Comparativo Explicado', description: 'Guia prático sobre o método comparativo de dados de mercado para avaliação imobiliária.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'em_breve', featured: true, sort_order: 1, release_date: null },
    { slug: 'avaliacao-judicial', title: 'Avaliação Imobiliária para Processos Judiciais', subtitle: 'Perícia Judicial e Extrajudicial', description: 'Tudo sobre laudos periciais para processos judiciais e arbitragem.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'em_breve', featured: false, sort_order: 2, release_date: null },
    { slug: 'avaliar-terrenos-lotes', title: 'Como Avaliar Terrenos e Lotes', subtitle: null, description: 'Metodologia para avaliação de terrenos urbanos e rurais.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'em_breve', featured: false, sort_order: 3, release_date: null },
    { slug: 'avaliacao-investidores', title: 'Avaliação Imobiliária para Investidores', subtitle: null, description: 'Como usar a avaliação técnica para tomar decisões de investimento.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'em_breve', featured: false, sort_order: 4, release_date: null },
    { slug: 'engenharia-avaliacoes', title: 'Engenharia de Avaliações Simplificada', subtitle: null, description: 'Fundamentos técnicos da ABNT NBR 14653 explicados de forma acessível.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'em_breve', featured: false, sort_order: 5, release_date: null },
    // Pilar 2 — Investimentos
    { slug: 'investir-imoveis-seguranca', title: 'Como Investir em Imóveis com Segurança', subtitle: null, description: 'Estratégias para montar um portfólio imobiliário sólido e rentável.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'investimentos', publication_status: 'em_breve', featured: false, sort_order: 6, release_date: null },
    { slug: 'imoveis-abaixo-valor', title: 'Como Identificar Imóveis Abaixo do Valor de Mercado', subtitle: null, description: 'Técnicas de análise para encontrar oportunidades imobiliárias.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'investimentos', publication_status: 'em_breve', featured: false, sort_order: 7, release_date: null },
    { slug: 'estrategias-renda-aluguel', title: 'Estratégias de Renda com Aluguel', subtitle: null, description: 'Como maximizar a rentabilidade de imóveis para locação.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'investimentos', publication_status: 'em_breve', featured: false, sort_order: 8, release_date: null },
    { slug: 'construir-patrimonio-imoveis', title: 'Como Construir Patrimônio com Imóveis', subtitle: null, description: 'Plano de ação para acumulação patrimonial através do mercado imobiliário.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'investimentos', publication_status: 'em_breve', featured: false, sort_order: 9, release_date: null },
    // Pilar 3 — Internacional
    { slug: 'investir-imoveis-eua', title: 'Como Investir em Imóveis nos Estados Unidos', subtitle: null, description: 'Guia completo para brasileiros que desejam investir no mercado americano.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'internacional', publication_status: 'em_breve', featured: false, sort_order: 11, release_date: null },
    { slug: 'investimento-dubai', title: 'Guia de Investimento Imobiliário em Dubai', subtitle: null, description: 'Oportunidades, riscos e estrutura jurídica para investir em Dubai.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'internacional', publication_status: 'em_breve', featured: false, sort_order: 12, release_date: null },
    { slug: 'imoveis-exterior-brasileiros', title: 'Como Brasileiros Compram Imóveis no Exterior', subtitle: null, description: 'Aspectos legais, cambiais e tributários para compra internacional.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'internacional', publication_status: 'em_breve', featured: false, sort_order: 13, release_date: null },
    // Pilar 4 — Patrimonial
    { slug: 'holding-patrimonial', title: 'Holding Patrimonial Imobiliária', subtitle: null, description: 'Como estruturar uma holding para proteção e otimização fiscal do patrimônio.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'patrimonial', publication_status: 'em_breve', featured: false, sort_order: 16, release_date: null },
    { slug: 'planejamento-sucessorio', title: 'Planejamento Sucessório com Imóveis', subtitle: null, description: 'Estratégias para transmissão eficiente do patrimônio imobiliário.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'patrimonial', publication_status: 'em_breve', featured: false, sort_order: 17, release_date: null },
    // Pilar 5 — Operação/BPO
    { slug: 'bpo-imobiliario', title: 'BPO Imobiliário: Gestão Profissional de Ativos', subtitle: null, description: 'Como terceirizar a gestão de imóveis com excelência operacional.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'operacao', publication_status: 'em_breve', featured: false, sort_order: 20, release_date: null },
    { slug: 'gestao-portfolio-imoveis', title: 'Gestão de Portfólio de Imóveis', subtitle: null, description: 'Controle, análise e otimização de um portfólio imobiliário diversificado.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'operacao', publication_status: 'em_breve', featured: false, sort_order: 21, release_date: null },
    // Pilar 6 — Tecnologia
    { slug: 'ia-mercado-imobiliario', title: 'Inteligência Artificial no Mercado Imobiliário', subtitle: null, description: 'Como a IA está transformando avaliação, captação e gestão de imóveis.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'tecnologia', publication_status: 'em_breve', featured: false, sort_order: 24, release_date: null },
    { slug: 'marketing-imobiliario', title: 'Marketing Imobiliário de Alta Performance', subtitle: null, description: 'Estratégias digitais e offline para captação e conversão no mercado imobiliário.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'tecnologia', publication_status: 'em_breve', featured: false, sort_order: 25, release_date: null },
]

export default async function BibliotecaPage() {
    const supabase = await createClient()

    const { data: dbEbooks } = await supabase
        .from('ebooks')
        .select('*')
        .order('sort_order', { ascending: true })

    // Merge: DB ebooks + catálogo seed para preencher os vazios
    const dbSlugs = new Set((dbEbooks || []).map((e: any) => e.slug))
    const seedEbooks = CATALOG_SEED.filter(e => !dbSlugs.has(e.slug)).map((e, i) => ({
        ...e, id: `seed-${i}`,
    }))
    const allEbooks: Ebook[] = [...(dbEbooks || []), ...seedEbooks]

    return <BibliotecaClient ebooks={allEbooks} pilares={PILARES} />
}
