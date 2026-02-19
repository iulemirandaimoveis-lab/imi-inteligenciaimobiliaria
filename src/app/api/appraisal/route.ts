import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()
        const supabase = await createClient()

        if (!data.name || !data.phone) {
            return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 })
        }

        // 1. Save to valuation_requests
        const { error: valError } = await supabase
            .from('valuation_requests')
            .insert({
                name: data.name,
                email: data.email || null,
                phone: data.phone,
                property_type: data.propertyType || null,
                address: data.address || null,
                city: data.city || null,
                appraisal_purpose: data.appraisalType || null,
                urgency: data.timeline === 'urgente' ? 'urgent' : 'normal',
                notes: data.additionalInfo || null,
                status: 'pending',
            })

        if (valError) {
            console.warn('valuation_requests insert failed:', valError.message)
        }

        // 2. Always capture lead
        if (data.email || data.phone) {
            await supabase.from('leads').upsert(
                {
                    name: data.name,
                    email: data.email || null,
                    phone: data.phone,
                    source: data.attribution?.source || 'site_direto',
                    status: 'new',
                    interest_type: 'appraisal',
                    interest_location: data.city || null,
                    message: [
                        data.appraisalType && `Tipo: ${data.appraisalType}`,
                        data.propertyType && `Imóvel: ${data.propertyType}`,
                        data.address && `End: ${data.address}`,
                        data.timeline && `Prazo: ${data.timeline}`,
                        data.additionalInfo,
                    ].filter(Boolean).join(' | '),
                    utm_source: data.attribution?.source || null,
                    utm_medium: data.attribution?.medium || null,
                    utm_campaign: data.attribution?.campaign || null,
                },
                { onConflict: 'email', ignoreDuplicates: false }
            )
        }

        return NextResponse.json({ success: true, message: 'Solicitação recebida com sucesso' }, { status: 200 })
    } catch (error) {
        console.error('Appraisal API error:', error)
        return NextResponse.json({ error: 'Erro ao processar solicitação' }, { status: 500 })
    }
}
