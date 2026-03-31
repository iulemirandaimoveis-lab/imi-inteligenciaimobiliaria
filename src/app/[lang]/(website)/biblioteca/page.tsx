import { createClient } from '@/lib/supabase/server'
import BibliotecaClient from './BibliotecaClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Biblioteca IMI — 27 Livros sobre Mercado Imobiliário | Avaliação, Investimentos, Patrimônio',
        description: 'Coleção completa de 27 ebooks sobre avaliação de imóveis, investimentos imobiliários, mercado internacional, proteção patrimonial e tecnologia. Leitura gratuita online.',
        keywords: [
            'avaliação de imóveis', 'investimento imobiliário', 'mercado imobiliário',
            'holding patrimonial', 'planejamento sucessório', 'perito avaliador',
            'NBR 14653', 'PTAM', 'BPO imobiliário', 'PropTech',
            'imóveis Dubai', 'imóveis EUA', 'imóveis Portugal',
            'IA mercado imobiliário', 'corretagem estratégica',
        ],
        openGraph: {
            title: 'Biblioteca IMI — 27 Livros sobre Mercado Imobiliário',
            description: 'A maior coleção de conhecimento imobiliário do Brasil. Leitura gratuita e completa.',
            images: ['/og-biblioteca.jpg'],
            type: 'website',
        },
        alternates: {
            canonical: 'https://www.iulemirandaimoveis.com.br/pt/biblioteca',
            languages: {
                'pt-BR': 'https://www.iulemirandaimoveis.com.br/pt/biblioteca',
                en: 'https://www.iulemirandaimoveis.com.br/en/biblioteca',
            },
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

// Catálogo completo de 34 livros — slugs matching actual /public/books/*.json files
const CATALOG_SEED: Omit<Ebook, 'id'>[] = [
    // Livro 0 — Introdução à série
    { slug: 'livro-00-o-mapa-do-dinheiro-invisivel', title: 'O Mapa do Dinheiro Invisível', subtitle: 'Como Descobrir, Medir e Capturar o Valor Oculto dos Imóveis', description: 'A introdução definitiva ao universo da avaliação e investimento imobiliário. Descubra como identificar valor onde outros não enxergam.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'publicado', featured: true, sort_order: 0, release_date: '2026-03-22' },

    // Pilar 1 — Avaliação (livros 01-05)
    { slug: 'livro-01-avaliacao-imoveis-na-pratica', title: 'Avaliação de Imóveis na Prática', subtitle: 'O Método Completo para Determinar o Valor Justo de Qualquer Imóvel', description: 'Guia prático e completo sobre o método comparativo de dados de mercado para avaliação imobiliária. Com dados, sistema e precisão.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'publicado', featured: true, sort_order: 1, release_date: '2026-03-22' },
    { slug: 'livro-02-avaliacao-imobiliaria-para-investidores', title: 'Avaliação Imobiliária para Investidores', subtitle: 'Como Analisar se um Imóvel é Bom Investimento Antes de Comprar', description: 'Análise técnica de investimentos imobiliários. Com números, não com esperança.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'publicado', featured: true, sort_order: 2, release_date: '2026-03-22' },
    { slug: 'livro-03-avaliacao-judicial-de-imoveis', title: 'Avaliação Judicial de Imóveis', subtitle: 'Perícia, Laudos e Defesa Técnica em Litígios Imobiliários', description: 'Tudo sobre laudos periciais para processos judiciais e arbitragem imobiliária.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'publicado', featured: false, sort_order: 3, release_date: '2026-03-22' },
    { slug: 'livro-04-avaliacao-de-terrenos-urbanos', title: 'Avaliação de Terrenos Urbanos', subtitle: 'Do Lote Vazio ao Potencial Construtivo', description: 'Metodologia completa para avaliação de terrenos urbanos: zoneamento, potencial construtivo e incorporação.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'publicado', featured: false, sort_order: 4, release_date: '2026-03-22' },
    { slug: 'livro-05-engenharia-de-avaliacoes', title: 'Engenharia de Avaliações', subtitle: 'Estatística, Modelagem e Ciência Aplicada ao Valor Imobiliário', description: 'Fundamentos técnicos da ABNT NBR 14653 com estatística e regressão aplicadas.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'publicado', featured: false, sort_order: 5, release_date: '2026-03-22' },

    // Pilar 2 — Investimentos (livros 06-10)
    { slug: 'livro-06-identificar-imoveis-abaixo-valor', title: 'Como Identificar Imóveis Abaixo do Valor de Mercado', subtitle: 'Ineficiências, Oportunidades e o Sistema que Transforma Dados em Vantagem', description: 'Técnicas avançadas de análise para encontrar oportunidades imobiliárias que o mercado não precifica.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'investimentos', publication_status: 'publicado', featured: true, sort_order: 6, release_date: '2026-03-21' },
    { slug: 'livro-07-investir-imoveis-seguranca', title: 'Como Investir em Imóveis com Segurança', subtitle: 'Due Diligence, Risco Calculado e Estrutura de Proteção', description: 'O manual do investidor que não perde. Estratégias para montar um portfólio sólido.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'investimentos', publication_status: 'publicado', featured: false, sort_order: 7, release_date: '2026-03-21' },
    { slug: 'livro-08-estrategias-renda-aluguel', title: 'Estratégias de Renda com Aluguel', subtitle: 'Como Transformar Imóveis em Máquinas de Fluxo de Caixa', description: 'Maximize a rentabilidade de imóveis para locação. Renda passiva que trabalha enquanto você dorme.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'investimentos', publication_status: 'publicado', featured: false, sort_order: 8, release_date: '2026-03-21' },
    { slug: 'livro-09-construir-patrimonio-imoveis', title: 'Como Construir Patrimônio com Imóveis', subtitle: 'Ciclos, Alavancagem e a Arquitetura de Riqueza que Atravessa Gerações', description: 'Plano de ação para acumulação patrimonial através do mercado imobiliário.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'investimentos', publication_status: 'publicado', featured: false, sort_order: 9, release_date: '2026-03-21' },
    { slug: 'livro-10-fundamentos-investimento-imobiliario', title: 'Fundamentos do Investimento Imobiliário', subtitle: 'Capital, Risco e Decisão — O Mapa Completo para Começar Certo', description: 'Guia definitivo para quem quer entrar no mercado imobiliário com base sólida.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'investimentos', publication_status: 'publicado', featured: false, sort_order: 10, release_date: '2026-03-21' },

    // Pilar 3 — Internacional (livros 11-15)
    { slug: 'livro-11-investir-imoveis-eua', title: 'Como Investir em Imóveis nos EUA', subtitle: 'LLC, Financiamento, Tributação e Renda em Dólar', description: 'Guia completo para brasileiros que desejam investir no mercado americano com segurança jurídica.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'internacional', publication_status: 'publicado', featured: true, sort_order: 11, release_date: '2026-03-21' },
    { slug: 'livro-12-investir-imoveis-portugal', title: 'Como Investir em Imóveis em Portugal', subtitle: 'Residência, Renda em Euro e o Plano B que Virou Plano A', description: 'Mercado português para investidores brasileiros. Golden Visa, tributação e oportunidades.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'internacional', publication_status: 'publicado', featured: false, sort_order: 12, release_date: '2026-03-21' },
    { slug: 'livro-13-investir-imoveis-dubai', title: 'Como Investir em Imóveis em Dubai', subtitle: 'Zero Income Tax, Yields de 7%+ e as Armadilhas que o Instagram Não Mostra', description: 'Oportunidades, riscos e estrutura jurídica para investir em Dubai e Emirados.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'internacional', publication_status: 'publicado', featured: false, sort_order: 13, release_date: '2026-03-21' },
    { slug: 'livro-14-reits-fiis-internacionais', title: 'Investimento via REITs e FIIs Internacionais', subtitle: 'Diversificação Imobiliária Global sem Comprar Tijolo', description: 'Como investir em imóveis via bolsa, com liquidez e diversificação global.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'internacional', publication_status: 'publicado', featured: false, sort_order: 14, release_date: '2026-03-21' },
    { slug: 'livro-15-tributacao-internacional', title: 'Tributação Internacional para Investidores Imobiliários', subtitle: 'Como Estruturar, Declarar e Otimizar Impostos em Múltiplas Jurisdições', description: 'Otimização fiscal legal para quem investe em imóveis no exterior.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'internacional', publication_status: 'publicado', featured: false, sort_order: 15, release_date: '2026-03-21' },

    // Pilar 4 — Patrimonial (livros 16-19)
    { slug: 'livro-16-holding-patrimonial', title: 'Holding Patrimonial Imobiliária', subtitle: 'Como Estruturar, Tributar e Proteger Patrimônio com PJ', description: 'Como estruturar uma holding para proteção e otimização fiscal do patrimônio imobiliário.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'patrimonial', publication_status: 'publicado', featured: true, sort_order: 16, release_date: '2026-03-21' },
    { slug: 'livro-17-planejamento-sucessorio-imobiliario', title: 'Planejamento Sucessório Imobiliário', subtitle: 'Como Transferir Patrimônio sem Destruir o que Você Construiu', description: 'Estratégias para transmissão eficiente do patrimônio imobiliário entre gerações.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'patrimonial', publication_status: 'publicado', featured: false, sort_order: 17, release_date: '2026-03-21' },
    { slug: 'livro-18-protecao-avancada-de-ativos', title: 'Proteção Avançada de Ativos', subtitle: 'Como Blindar Seu Patrimônio Imobiliário', description: 'Blindagem patrimonial contra riscos jurídicos, tributários e operacionais.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'patrimonial', publication_status: 'publicado', featured: false, sort_order: 18, release_date: '2026-03-21' },
    { slug: 'livro-19-planejamento-patrimonial-longo-prazo', title: 'Planejamento Patrimonial de Longo Prazo', subtitle: 'O Masterplan de 20 Anos para Riqueza Imobiliária', description: 'Plano estratégico de duas décadas para construir, proteger e transferir riqueza.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'patrimonial', publication_status: 'publicado', featured: false, sort_order: 19, release_date: '2026-03-21' },

    // Pilar 5 — Operação (livros 20-23)
    { slug: 'livro-20-como-montar-um-bpo-imobiliario', title: 'Como Montar um BPO Imobiliário', subtitle: 'Do Zero à Operação Escalável', description: 'O negócio de avaliar imóveis para bancos, seguradoras e fundos. Modelo de negócio completo.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'operacao', publication_status: 'publicado', featured: false, sort_order: 20, release_date: '2026-03-21' },
    { slug: 'livro-21-gestao-profissional-de-imoveis', title: 'Gestão Profissional de Imóveis', subtitle: 'Sistemas, Métricas e Inteligência Operacional', description: 'Como administrar portfólios imobiliários com eficiência e tecnologia.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'operacao', publication_status: 'publicado', featured: false, sort_order: 21, release_date: '2026-03-21' },
    { slug: 'livro-22-pericia-imobiliaria-judicial', title: 'Perícia Imobiliária Judicial', subtitle: 'Como Atuar como Perito Avaliador', description: 'Carreira de perito avaliador em processos judiciais. Do cadastro ao laudo.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'operacao', publication_status: 'publicado', featured: false, sort_order: 22, release_date: '2026-03-21' },
    { slug: 'livro-23-corretagem-estrategica', title: 'Corretagem Estratégica', subtitle: 'De Vendas Avulsas a Negócio Escalável de Alto Valor', description: 'Como transformar corretagem de imóveis em negócio posicionado e de alta margem.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'operacao', publication_status: 'publicado', featured: false, sort_order: 23, release_date: '2026-03-21' },

    // Pilar 6 — Tecnologia (livros 24-27)
    { slug: 'livro-24-ia-no-mercado-imobiliario', title: 'IA no Mercado Imobiliário', subtitle: 'Como a Inteligência Artificial Está Redefinindo Tudo', description: 'IA aplicada a avaliação, investimento, gestão e o futuro de quem vive de imóveis.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'tecnologia', publication_status: 'publicado', featured: true, sort_order: 24, release_date: '2026-03-21' },
    { slug: 'livro-25-proptech-e-inovacao-imobiliaria', title: 'PropTech e Inovação Imobiliária', subtitle: 'As Tecnologias que Estão Reconstruindo o Mercado', description: 'Mapeamento completo das tecnologias que estão transformando o setor imobiliário.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'tecnologia', publication_status: 'publicado', featured: false, sort_order: 25, release_date: '2026-03-21' },
    { slug: 'livro-26-automacao-operacoes-imobiliarias', title: 'Automação de Operações Imobiliárias', subtitle: 'Eliminar Manual, Escalar sem Contratar', description: 'Como automatizar processos imobiliários e operar como sistema, não como pessoa.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'tecnologia', publication_status: 'publicado', featured: false, sort_order: 26, release_date: '2026-03-21' },
    { slug: 'livro-27-o-futuro-do-mercado-imobiliario', title: 'O Futuro do Mercado Imobiliário', subtitle: 'Uma Visão de 20 Anos', description: 'Prospectiva do mercado imobiliário nos próximos 20 anos. O encerramento épico da coleção.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'tecnologia', publication_status: 'publicado', featured: true, sort_order: 27, release_date: '2026-03-21' },

    // Bônus
    { slug: 'bonus-01-glossario-definitivo-avaliacao-imobiliaria', title: 'Glossário Definitivo da Avaliação Imobiliária', subtitle: '500+ Termos Técnicos, Jurídicos e de Mercado', description: 'Dicionário completo do avaliador imobiliário. Do básico ao avançado.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'publicado', featured: false, sort_order: 28, release_date: '2026-03-22' },
    { slug: 'bonus-02-checklist-master-avaliador-imobiliario', title: 'Checklist Master do Avaliador Imobiliário', subtitle: '127 Verificações Essenciais Para Laudos à Prova de Impugnação', description: 'Lista de verificação profissional para laudos de avaliação impecáveis.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'publicado', featured: false, sort_order: 29, release_date: '2026-03-22' },
    { slug: 'bonus-03-modelos-laudos-templates-profissionais', title: 'Modelos de Laudos e Templates Profissionais', subtitle: 'Estruturas Prontas Para Avaliação', description: 'Templates profissionais para laudos residenciais, comerciais, terrenos e perícia judicial.', cover_image: null, amazon_link: null, amazon_url: null, pilar: 'avaliacao', publication_status: 'publicado', featured: false, sort_order: 30, release_date: '2026-03-22' },
]

export default async function BibliotecaPage() {
    const supabase = await createClient()

    const { data: dbEbooks } = await supabase
        .from('ebooks')
        .select('*')
        .order('sort_order', { ascending: true })

    // Merge: DB ebooks override catalog seeds by slug
    const dbSlugs = new Set((dbEbooks || []).map((e: Record<string, unknown>) => e.slug))
    const seedEbooks = CATALOG_SEED.filter(e => !dbSlugs.has(e.slug)).map((e, i) => ({
        ...e, id: `seed-${i}`,
    }))
    const allEbooks: Ebook[] = [...(dbEbooks || []), ...seedEbooks]

    // All books have content in /public/books/*.json
    const bookSlugs = CATALOG_SEED.map(e => e.slug)

    return <BibliotecaClient ebooks={allEbooks} pilares={PILARES} bookSlugs={bookSlugs} />
}
