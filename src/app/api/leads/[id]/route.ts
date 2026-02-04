import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs';

// GET - Buscar lead específico
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const lead = await prisma.lead.findUnique({
            where: { id: params.id },
            include: {
                simulations: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                consultations: {
                    orderBy: { scheduledAt: 'desc' },
                    take: 5
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        })

        if (!lead) {
            return NextResponse.json(
                { error: 'Lead não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({ lead })
    } catch (error) {
        console.error('Erro ao buscar lead:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar lead' },
            { status: 500 }
        )
    }
}

// PUT - Atualizar lead
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const {
            name,
            email,
            phone,
            leadStage,
            qualificationScore,
            assignedTo,
            leadSource,
            leadMedium,
            leadCampaign
        } = body

        const lead = await prisma.lead.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phone !== undefined && { phone }),
                ...(leadStage && { leadStage }),
                ...(qualificationScore !== undefined && { qualificationScore }),
                ...(assignedTo !== undefined && { assignedTo }),
                ...(leadSource !== undefined && { leadSource }),
                ...(leadMedium !== undefined && { leadMedium }),
                ...(leadCampaign !== undefined && { leadCampaign }),
                ...(assignedTo && { assignedAt: new Date() })
            }
        })

        return NextResponse.json({ lead })
    } catch (error: any) {
        console.error('Erro ao atualizar lead:', error)

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Lead não encontrado' },
                { status: 404 }
            )
        }

        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Este email já está cadastrado' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Erro ao atualizar lead' },
            { status: 500 }
        )
    }
}

// DELETE - Excluir lead
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.lead.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Erro ao excluir lead:', error)

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Lead não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json(
            { error: 'Erro ao excluir lead' },
            { status: 500 }
        )
    }
}
