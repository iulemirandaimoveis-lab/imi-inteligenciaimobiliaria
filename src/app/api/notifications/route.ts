import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs';

/**
 * GET /api/notifications
 * Lista notificações (com paginação e filtro de lidas/não lidas)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const unreadOnly = searchParams.get('unreadOnly') === 'true'
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const where: any = {}
        if (unreadOnly) {
            where.read = false
        }

        const [notifications, total, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: {
                    createdAt: 'desc'
                },
                take: limit,
                skip: offset
            }),
            prisma.notification.count({ where }),
            prisma.notification.count({ where: { read: false } })
        ])

        return NextResponse.json({
            success: true,
            data: notifications,
            meta: {
                total,
                unreadCount,
                limit,
                offset
            }
        })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao buscar notificações' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/notifications/mark-read
 * Marca notificações como lidas
 *
 * Body: { "ids": ["id1", "id2"] } ou { "all": true }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { ids, all } = body

        if (all) {
            // Marca todas como lidas
            await prisma.notification.updateMany({
                where: { read: false },
                data: {
                    read: true,
                    readAt: new Date()
                }
            })

            return NextResponse.json({
                success: true,
                message: 'Todas as notificações foram marcadas como lidas'
            })
        }

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { success: false, error: 'IDs inválidos' },
                { status: 400 }
            )
        }

        // Marca específicas como lidas
        await prisma.notification.updateMany({
            where: {
                id: { in: ids }
            },
            data: {
                read: true,
                readAt: new Date()
            }
        })

        return NextResponse.json({
            success: true,
            message: `${ids.length} notificação(ões) marcada(s) como lida(s)`
        })
    } catch (error) {
        console.error('Error marking notifications as read:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao marcar notificações' },
            { status: 500 }
        )
    }
}
