import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
    metodoComparativo,
    metodoEvolutivo,
    metodoRenda,
    metodoInvolutivo,
    metodoCapRate,
    metodoFluxoCaixaDescontado,
    metodoLiquidacaoForcada,
    metodoCenarios,
    metodoBDI,
    metodoFundoComercio,
    calcularHonorarios,
    estimarValorVenal,
    rossHeidecke,
    checkFundamentacao,
    type PropertyInput,
    type Comparable,
    type RentCapitalizationInput,
    type InvolutivoInput,
    type CapRateInput,
    type DCFInput,
    type FundoComercioInput,
} from '@/features/avaliacoes/services/valuation-engine'
import { recomendarMetodo } from '@/features/avaliacoes/services/method-recommender'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    try {
        const body = await request.json()
        const { metodo } = body as { metodo: string }

        if (!metodo) {
            return NextResponse.json({ error: 'Método obrigatório' }, { status: 400 })
        }

        switch (metodo) {
            // ── Métodos já existentes ───────────────────────────────
            case 'comparativo': {
                const { property, comparaveis } = body as { property: PropertyInput; comparaveis: Comparable[] }
                if (!comparaveis || comparaveis.length === 0) {
                    return NextResponse.json({ error: 'Comparáveis obrigatórios para método comparativo' }, { status: 400 })
                }
                if (!property?.area) {
                    return NextResponse.json({ error: 'Área do imóvel obrigatória' }, { status: 400 })
                }
                const result = metodoComparativo(property, comparaveis)
                const cenarios = metodoCenarios(result.valor_total)
                return NextResponse.json({ success: true, result, cenarios })
            }

            case 'evolutivo': {
                const { property, valor_terreno } = body as { property: PropertyInput; valor_terreno: number }
                if (!property?.area || !valor_terreno) {
                    return NextResponse.json({ error: 'Área e valor do terreno obrigatórios' }, { status: 400 })
                }
                const result = metodoEvolutivo(property, valor_terreno)
                const cenarios = metodoCenarios(result.valor_total)
                return NextResponse.json({ success: true, result, cenarios })
            }

            case 'renda': {
                const { property, renda } = body as { property: PropertyInput; renda: RentCapitalizationInput }
                if (!renda?.renda_mensal || !renda?.taxa_capitalizacao) {
                    return NextResponse.json({ error: 'Renda mensal e taxa de capitalização obrigatórias' }, { status: 400 })
                }
                const result = metodoRenda(property, renda)
                const cenarios = metodoCenarios(result.valor_total)
                return NextResponse.json({ success: true, result, cenarios })
            }

            case 'ross_heidecke': {
                const { property } = body as { property: PropertyInput }
                if (!property?.ano_construcao) {
                    return NextResponse.json({ error: 'Ano de construção obrigatório' }, { status: 400 })
                }
                const vidaUtil = 60
                const cubM2 = property.area * 2450
                const result = rossHeidecke(
                    property.ano_construcao,
                    vidaUtil,
                    property.estado_conservacao || 'Regular',
                    cubM2,
                )
                return NextResponse.json({ success: true, result })
            }

            case 'fundamentacao': {
                const { comparaveis, cv, options } = body as {
                    comparaveis?: Comparable[]
                    cv?: number
                    options?: { has_visita?: boolean; has_documentacao?: boolean }
                }
                const nComp = comparaveis?.length ?? 0
                const result = checkFundamentacao(
                    nComp,
                    cv ?? 30,
                    options?.has_visita ?? false,
                    options?.has_documentacao ?? false,
                )
                return NextResponse.json({ success: true, result })
            }

            // ── Novos métodos ───────────────────────────────────────
            case 'involutivo': {
                const { involutivo_input } = body as { involutivo_input: InvolutivoInput }
                if (!involutivo_input?.vgv || !involutivo_input?.area_terreno) {
                    return NextResponse.json({ error: 'VGV e área do terreno obrigatórios' }, { status: 400 })
                }
                const result = metodoInvolutivo(involutivo_input)
                const cenarios = metodoCenarios(result.valor_terreno)
                return NextResponse.json({ success: true, result, cenarios })
            }

            case 'cap_rate': {
                const { cap_rate_input } = body as { cap_rate_input: CapRateInput }
                if (!cap_rate_input?.noi_mensal || !cap_rate_input?.taxa_cap_rate) {
                    return NextResponse.json({ error: 'NOI mensal e cap rate obrigatórios' }, { status: 400 })
                }
                const result = metodoCapRate(cap_rate_input)
                const cenarios = metodoCenarios(result.valor_total)
                return NextResponse.json({ success: true, result, cenarios })
            }

            case 'fcd': {
                const { dcf_input } = body as { dcf_input: DCFInput }
                if (!dcf_input?.fluxo_anual?.length || !dcf_input?.taxa_desconto) {
                    return NextResponse.json({ error: 'Fluxo anual e taxa de desconto obrigatórios' }, { status: 400 })
                }
                const result = metodoFluxoCaixaDescontado(dcf_input)
                const cenarios = metodoCenarios(result.vpl)
                return NextResponse.json({ success: true, result, cenarios })
            }

            case 'liquidacao_forcada': {
                const { valor_mercado, liquidez } = body as {
                    valor_mercado: number
                    liquidez: 'alta' | 'media' | 'baixa'
                }
                if (!valor_mercado) {
                    return NextResponse.json({ error: 'Valor de mercado obrigatório' }, { status: 400 })
                }
                const result = metodoLiquidacaoForcada(valor_mercado, liquidez || 'media')
                return NextResponse.json({ success: true, result })
            }

            case 'cenarios': {
                const { valor_base } = body as { valor_base: number }
                if (!valor_base) {
                    return NextResponse.json({ error: 'Valor base obrigatório' }, { status: 400 })
                }
                const result = metodoCenarios(valor_base)
                return NextResponse.json({ success: true, result })
            }

            case 'bdi': {
                const { custo_direto, bdi_pct } = body as { custo_direto: number; bdi_pct?: number }
                if (!custo_direto) {
                    return NextResponse.json({ error: 'Custo direto obrigatório' }, { status: 400 })
                }
                const result = metodoBDI(custo_direto, bdi_pct ?? 25)
                return NextResponse.json({ success: true, result })
            }

            case 'fundo_comercio': {
                const { fundo_input } = body as { fundo_input: FundoComercioInput }
                if (!fundo_input?.faturamento_mensal) {
                    return NextResponse.json({ error: 'Faturamento mensal obrigatório' }, { status: 400 })
                }
                const result = metodoFundoComercio(fundo_input)
                return NextResponse.json({ success: true, result })
            }

            case 'honorarios': {
                const { valor_imovel, complexidade } = body as {
                    valor_imovel: number
                    complexidade?: 'simples' | 'normal' | 'complexa'
                }
                if (!valor_imovel) {
                    return NextResponse.json({ error: 'Valor do imóvel obrigatório' }, { status: 400 })
                }
                const result = calcularHonorarios(valor_imovel, complexidade ?? 'normal')
                return NextResponse.json({ success: true, result })
            }

            case 'valor_venal': {
                const { valor_mercado, area_terreno, area_construida, cub_m2 } = body as {
                    valor_mercado: number
                    area_terreno?: number
                    area_construida?: number
                    cub_m2?: number
                }
                if (!valor_mercado) {
                    return NextResponse.json({ error: 'Valor de mercado obrigatório' }, { status: 400 })
                }
                const result = estimarValorVenal(valor_mercado, area_terreno, area_construida, cub_m2)
                return NextResponse.json({ success: true, result })
            }

            case 'recomendar_metodo': {
                const { tipo_imovel, finalidade } = body as { tipo_imovel: string; finalidade: string }
                if (!tipo_imovel || !finalidade) {
                    return NextResponse.json({ error: 'Tipo de imóvel e finalidade obrigatórios' }, { status: 400 })
                }
                const result = recomendarMetodo(tipo_imovel, finalidade)
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
