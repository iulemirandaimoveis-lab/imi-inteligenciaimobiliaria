import { NextRequest, NextResponse } from 'next/server'
import { createLead } from '@/lib/leads-service'
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()
        // Validate required fields
        const requiredFields = ['name', 'phone', 'consultationType']
        for (const field of requiredFields) {
            if (!data[field]) {
                return NextResponse.json(
                    { error: `Campo obrigatório ausente: ${field}` },
                    { status: 400 }
                )
            }
        }
        // Use the unified lead service
        // This handles:
        // 1. Finding/Creating Lead
        // 2. Associating with Tenant
        // 3. Creating Consultation Record
        // 4. Logging interaction
        const result = await createLead({
            name: data.name,
            email: data.email,
            phone: data.phone,
            source: 'website_consultation',
            consultationType: data.consultationType,
            message: data.message || data.context,
            cityInterest: data.cityInterest,
            investmentProfile: data.investmentProfile,
            budgetRange: data.budgetRange
        });
        if (!result.success) {
            return NextResponse.json({ error: 'Erro ao salvar lead / consulta.' }, { status: 500 })
        }
        return NextResponse.json(
            { success: true, message: 'Solicitação recebida com sucesso', leadId: result.leadId },
            { status: 200 }
        )
    } catch (error) {
        return NextResponse.json(
            { error: 'Erro ao processar solicitação' },
            { status: 500 }
        )
    }
}
