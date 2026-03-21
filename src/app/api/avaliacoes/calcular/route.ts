import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    metodoComparativo,
    metodoEvolutivo,
    metodoRenda,
    rossHeidecke,
    checkFundamentacao,
    type PropertyInput,
    type Comparable,
    type RentCapitalizationInput,
} from '@/features/avaliacoes/services/valuation-engine'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    try {
        const body = await request.json()
        const { metodo, property, comparaveis, valor_terreno, renda, options } = body as {
            metodo: 'comparativo' | 'evolutivo' | 'renda' | 'ross_heidecke' | 'fundamentacao'
            property: PropertyInput
            comparaveis?: Comparable[]
            valor_terreno?: number
            renda?: RentCapitalizationInput
            options?: { has_visita?: boolean; has_documentacao?: boolean }
        }

        if (!metodo) {
            return NextResponse.json({ error: 'Método obrigatório' }, { status: 400 })
        }

        switch (metodo) {
            case 'comparativo': {
                if (!comparaveis || comparaveis.length === 0) {
                    return NextResponse.json({ error: 'Comparáveis obrigatórios para método comparativo' }, { status: 400 })
                }
                if (!property?.area) {
                    return NextResponse.json({ error: 'Área do imóvel obrigatória' }, { status: 400 })
                }
                const result = metodoComparativo(property, comparaveis)
                return NextResponse.json({ success: true, result })
            }

            case 'evolutivo': {
                if (!property?.area || !valor_terreno) {
                    return NextResponse.json({ error: 'Área e valor do terreno obrigatórios' }, { status: 400 })
                }
                const result = metodoEvolutivo(property, valor_terreno)
                return NextResponse.json({ success: true, result })
            }

            case 'renda': {
                if (!renda?.renda_mensal || !renda?.taxa_capitalizacao) {
                    return NextResponse.json({ error: 'Renda mensal e taxa de capitalização obrigatórias' }, { status: 400 })
                }
                const result = metodoRenda(property, renda)
                return NextResponse.json({ success: true, result })
            }

            case 'ross_heidecke': {
                if (!property?.ano_construcao) {
                    return NextResponse.json({ error: 'Ano de construção obrigatório' }, { status: 400 })
                }
                const vidaUtil = 60
                const cubM2 = property.area * 2450 // Normal pattern default
                const result = rossHeidecke(
                    property.ano_construcao,
                    vidaUtil,
                    property.estado_conservacao || 'Regular',
                    cubM2,
                )
                return NextResponse.json({ success: true, result })
            }

            case 'fundamentacao': {
                const nComp = comparaveis?.length ?? 0
                const cv = body.cv ?? 30
                const result = checkFundamentacao(
                    nComp,
                    cv,
                    options?.has_visita ?? false,
                    options?.has_documentacao ?? false,
                )
                return NextResponse.json({ success: true, result })
            }

            default:
                return NextResponse.json({ error: `Método "${metodo}" não reconhecido` }, { status: 400 })
        }
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Erro interno no cálculo' },
            { status: 500 },
        )
    }
}
