import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        // Validate required fields
        const requiredFields = ['name', 'email', 'phone', 'appraisalType', 'propertyType', 'city', 'address', 'timeline']
        for (const field of requiredFields) {
            if (!data[field]) {
                return NextResponse.json(
                    { error: `Campo obrigatório ausente: ${field}` },
                    { status: 400 }
                )
            }
        }

        // TODO: Integrate with email service (SendGrid, Resend, etc.)
        // TODO: Store in database or CRM

        // Simulate email sending
        // await sendEmail({
        //   to: 'contato@imi.com.br',
        //   subject: 'Nova Solicitação de Avaliação',
        //   body: formatAppraisalEmail(data),
        // })

        return NextResponse.json(
            { message: 'Solicitação recebida com sucesso' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error processing appraisal request:', error)
        return NextResponse.json(
            { error: 'Erro ao processar solicitação' },
            { status: 500 }
        )
    }
}
