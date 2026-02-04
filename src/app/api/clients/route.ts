import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs';

/**
 * GET /api/clients
 * Lista todos os clientes
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const search = searchParams.get('search')

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } }
            ]
        }

        const clients = await prisma.client.findMany({
            where,
            include: {
                _count: {
                    select: {
                        propertyLinks: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json({
            success: true,
            data: clients,
            count: clients.length
        })
    } catch (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar clientes' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/clients
 * Cria um novo cliente
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, email, phone, notes, tags } = body

        if (!name || !email) {
            return NextResponse.json(
                { success: false, error: 'Nome e email são obrigatórios' },
                { status: 400 }
            )
        }

        // Verifica se email já existe
        const existing = await prisma.client.findUnique({
            where: { email }
        })

        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Email já cadastrado' },
                { status: 409 }
            )
        }

        const client = await prisma.client.create({
            data: {
                name,
                email,
                phone,
                notes,
                tags: tags || []
            }
        })

        // Cria notificação
        await prisma.notification.create({
            data: {
                type: 'LEAD_NEW',
                title: 'Novo Cliente Cadastrado',
                message: `${name} foi adicionado ao sistema`,
                metadata: {
                    clientId: client.id,
                    clientName: name,
                    clientEmail: email
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: client
        }, { status: 201 })
    } catch (error) {
        console.error('Error creating client:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao criar cliente' },
            { status: 500 }
        )
    }
}
