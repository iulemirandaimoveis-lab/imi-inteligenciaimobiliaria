import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs';

/**
 * GET /api/clients/[id]
 * Busca um cliente específico com histórico de acessos
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const client = await prisma.client.findUnique({
            where: { id: params.id },
            include: {
                propertyLinks: {
                    include: {
                        property: {
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                images: true,
                                listPrice: true,
                                city: true
                            }
                        },
                        accessLogs: {
                            orderBy: {
                                createdAt: 'desc'
                            },
                            take: 10
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        propertyLinks: true
                    }
                }
            }
        })

        if (!client) {
            return NextResponse.json(
                { success: false, error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            data: client
        })
    } catch (error) {
        console.error('Error fetching client:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar cliente' },
            { status: 500 }
        )
    }
}

/**
 * PUT /api/clients/[id]
 * Atualiza um cliente
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { name, email, phone, notes, tags, status } = body

        // Verifica se cliente existe
        const existing = await prisma.client.findUnique({
            where: { id: params.id }
        })

        if (!existing) {
            return NextResponse.json(
                { success: false, error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        // Se email mudou, verifica se já existe
        if (email && email !== existing.email) {
            const emailExists = await prisma.client.findUnique({
                where: { email }
            })

            if (emailExists) {
                return NextResponse.json(
                    { success: false, error: 'Email já cadastrado' },
                    { status: 409 }
                )
            }
        }

        const client = await prisma.client.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phone !== undefined && { phone }),
                ...(notes !== undefined && { notes }),
                ...(tags && { tags }),
                ...(status && { status })
            }
        })

        return NextResponse.json({
            success: true,
            data: client
        })
    } catch (error) {
        console.error('Error updating client:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao atualizar cliente' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/clients/[id]
 * Deleta um cliente
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verifica se cliente existe
        const client = await prisma.client.findUnique({
            where: { id: params.id }
        })

        if (!client) {
            return NextResponse.json(
                { success: false, error: 'Cliente não encontrado' },
                { status: 404 }
            )
        }

        // Deleta o cliente (cascade deleta links e logs)
        await prisma.client.delete({
            where: { id: params.id }
        })

        return NextResponse.json({
            success: true,
            message: 'Cliente deletado com sucesso'
        })
    } catch (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao deletar cliente' },
            { status: 500 }
        )
    }
}
