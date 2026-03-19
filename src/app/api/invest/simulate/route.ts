import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runSimulation } from '@/lib/invest/engine/calculator'
import { getDefaultFiscalParams } from '@/lib/invest/engine/fiscal'
import type { SimulationParams, Market } from '@/lib/invest/engine/types'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { market, objective, investorProfile, currency, propertyValue, propertyType, area_m2, bedrooms, location, downPayment, financingType, rentalStrategy, monthlyRent, occupancyRate, averageDailyRate, monthlyExpenses, appreciationRate, inflationRate, holdingPeriod, exitStrategy, interestRate } = body

    if (!market || !propertyValue || !objective) {
      return NextResponse.json({ error: 'Campos obrigatórios: market, propertyValue, objective' }, { status: 400 })
    }

    const fiscal = getDefaultFiscalParams(market as Market)

    const params: SimulationParams = {
      market,
      objective,
      investorProfile: investorProfile || 'moderado',
      currency: currency || 'BRL',
      propertyValue,
      propertyType: propertyType || 'apartamento',
      area_m2: area_m2 || 0,
      bedrooms: bedrooms || 0,
      location: location || { country: 'BR', city: '' },
      downPayment: downPayment || 30,
      financingType: financingType || 'financiamento',
      rentalStrategy: rentalStrategy || 'longa_duracao',
      monthlyRent: monthlyRent || 0,
      occupancyRate: occupancyRate || 70,
      averageDailyRate: averageDailyRate || 0,
      monthlyExpenses: monthlyExpenses || {
        condominium: 800,
        propertyTax: 3600,
        insurance: 1200,
        maintenance: 1,
        management: 10,
        vacancy: 5,
      },
      appreciationRate: appreciationRate || 5,
      inflationRate: inflationRate || 4.5,
      holdingPeriod: holdingPeriod || 10,
      exitStrategy: exitStrategy || 'venda',
      interestRate: interestRate || 10.5,
      ...fiscal,
      closingCosts: propertyValue * 0.02,
    }

    const result = runSimulation(params)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Simulation error:', error)
    return NextResponse.json({ error: 'Erro ao executar simulação' }, { status: 500 })
  }
}
