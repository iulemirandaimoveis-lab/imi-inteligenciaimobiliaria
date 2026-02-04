import { nanoid } from 'nanoid'
import prisma from '@/lib/prisma'
import type { PropertyAccessLog, Client, Property, ClientPropertyLink } from '@prisma/client'

/**
 * SERVIÇO DE TRACKING - LINKS EXCLUSIVOS POR CLIENTE
 *
 * Regra: TODO link de imóvel é SEMPRE exclusivo por cliente.
 * Não existe link genérico para envio comercial.
 */

export interface CreateTrackingLinkParams {
    clientId: string
    propertyId: string
    expiresInDays?: number
}

export interface TrackingLinkData {
    id: string
    url: string | null
    token: string
    slug: string
    clientId: string
    propertyId: string
    createdAt: Date
    expiresAt: Date | null
}

export interface LogAccessParams {
    linkToken: string
    device?: string
    browser?: string
    os?: string
    ipAddress?: string
    totalTimeSeconds?: number
    galleryTimeSeconds?: number
    descriptionTimeSeconds?: number
    priceTimeSeconds?: number
    ctaTimeSeconds?: number
    scrollDepth?: number
    clickedCta?: boolean
    clickedWhatsApp?: boolean
}

/**
 * Cria um link exclusivo para um cliente visualizar um imóvel
 */
export async function createTrackingLink(params: CreateTrackingLinkParams): Promise<TrackingLinkData> {
    const { clientId, propertyId, expiresInDays } = params

    // Verifica se já existe um link para este cliente + imóvel
    const existing = await prisma.clientPropertyLink.findFirst({
        where: {
            clientId,
            propertyId
        }
    })

    if (existing) {
        return {
            id: existing.id,
            url: existing.url,
            token: existing.token,
            slug: existing.slug,
            clientId: existing.clientId,
            propertyId: existing.propertyId,
            createdAt: existing.createdAt,
            expiresAt: existing.expiresAt
        }
    }

    // Gera token e slug únicos
    const token = nanoid(16)
    const slug = nanoid(10)

    // Busca dados do imóvel para gerar URL
    const property = await prisma.property.findUnique({
        where: { id: propertyId }
    })

    if (!property) {
        throw new Error('Imóvel não encontrado')
    }

    // Calcula expiração (se aplicável)
    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null

    // Gera URL completa
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.iulemirandaimoveis.com.br'
    const propertySlug = property.slug || property.internalCode
    const url = `${baseUrl}/imoveis/${propertySlug}?c=${clientId}&t=${token}`

    // Cria o link no banco
    const link = await prisma.clientPropertyLink.create({
        data: {
            clientId,
            propertyId,
            token,
            slug,
            url,
            expiresAt
        }
    })

    return {
        id: link.id,
        url: link.url,
        token: link.token,
        slug: link.slug,
        clientId: link.clientId,
        propertyId: link.propertyId,
        createdAt: link.createdAt,
        expiresAt: link.expiresAt
    }
}

/**
 * Registra um acesso ao imóvel via link exclusivo
 */
export async function logPropertyAccess(params: LogAccessParams): Promise<PropertyAccessLog> {
    const { linkToken, ...accessData } = params

    // Busca o link pelo token
    const link = await prisma.clientPropertyLink.findUnique({
        where: { token: linkToken }
    })

    if (!link) {
        throw new Error('Link inválido')
    }

    // Verifica se o link expirou
    if (link.expiresAt && link.expiresAt < new Date()) {
        throw new Error('Link expirado')
    }

    // Registra o acesso
    const log = await prisma.propertyAccessLog.create({
        data: {
            clientId: link.clientId,
            propertyId: link.propertyId,
            linkId: link.id,
            linkToken,
            device: accessData.device,
            browser: accessData.browser,
            os: accessData.os,
            ipAddress: accessData.ipAddress,
            totalTimeSeconds: accessData.totalTimeSeconds,
            galleryTimeSeconds: accessData.galleryTimeSeconds,
            descriptionTimeSeconds: accessData.descriptionTimeSeconds,
            priceTimeSeconds: accessData.priceTimeSeconds,
            ctaTimeSeconds: accessData.ctaTimeSeconds,
            scrollDepth: accessData.scrollDepth,
            clickedCta: accessData.clickedCta || false,
            clickedWhatsApp: accessData.clickedWhatsApp || false
        }
    })

    // Incrementa contador de visualizações do imóvel
    await prisma.property.update({
        where: { id: link.propertyId },
        data: {
            viewCount: {
                increment: 1
            }
        }
    })

    // Cria notificação de acesso
    await createAccessNotification(link.clientId, link.propertyId, log)

    return log
}

/**
 * Busca todos os acessos de um cliente a um imóvel
 */
export async function getClientPropertyAccess(clientId: string, propertyId: string) {
    return prisma.propertyAccessLog.findMany({
        where: {
            clientId,
            propertyId
        },
        orderBy: {
            accessedAt: 'desc'
        },
        include: {
            client: true,
            property: true
        }
    })
}

/**
 * Busca estatísticas de acesso de um imóvel
 */
export async function getPropertyStats(propertyId: string) {
    const logs = await prisma.propertyAccessLog.findMany({
        where: { propertyId },
        include: {
            client: true
        }
    })

    const uniqueClients = new Set(logs.filter(log => log.clientId).map(log => log.clientId)).size
    const totalAccess = logs.length
    const avgTimeSeconds = totalAccess > 0
        ? logs.reduce((sum, log) => sum + (log.totalTimeSeconds || 0), 0) / totalAccess
        : 0
    const ctaClicks = logs.filter(log => log.clickedCta).length
    const whatsappClicks = logs.filter(log => log.clickedWhatsApp).length

    return {
        totalAccess,
        uniqueClients,
        avgTimeSeconds,
        ctaClicks,
        whatsappClicks,
        conversionRate: totalAccess > 0 ? (ctaClicks / totalAccess) * 100 : 0
    }
}

/**
 * Busca clientes com maior engajamento em um imóvel
 */
export async function getTopEngagedClients(propertyId: string, limit: number = 5) {
    const logs = await prisma.propertyAccessLog.groupBy({
        by: ['clientId'],
        where: {
            propertyId,
            clientId: { not: null }
        },
        _count: {
            id: true
        },
        _avg: {
            totalTimeSeconds: true
        },
        orderBy: {
            _count: {
                id: 'desc'
            }
        },
        take: limit
    })

    // Busca dados completos dos clientes
    const clientIds = logs.map(log => log.clientId).filter((id): id is string => id !== null)
    const clients = await prisma.client.findMany({
        where: {
            id: {
                in: clientIds
            }
        }
    })

    return logs.map(log => {
        const client = clients.find(c => c.id === log.clientId)
        return {
            client,
            accessCount: log._count.id,
            avgTimeSeconds: log._avg.totalTimeSeconds || 0
        }
    })
}

/**
 * Cria notificação de acesso
 */
async function createAccessNotification(clientId: string, propertyId: string, log: PropertyAccessLog) {
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    const property = await prisma.property.findUnique({ where: { id: propertyId } })

    if (!client || !property) return

    // Verifica se é revisita
    const previousAccess = await prisma.propertyAccessLog.count({
        where: {
            clientId,
            propertyId,
            accessedAt: {
                lt: log.accessedAt
            }
        }
    })

    const isRevisit = previousAccess > 0

    const message = isRevisit
        ? `${client.name} acessou novamente o imóvel "${property.title}"`
        : `${client.name} acessou o imóvel "${property.title}" pela primeira vez`

    await prisma.notification.create({
        data: {
            type: isRevisit ? 'PROPERTY_VIEW' : 'PROPERTY_VIEW',
            title: isRevisit ? 'Cliente Revisitou Imóvel' : 'Novo Acesso ao Imóvel',
            message,
            metadata: {
                clientId,
                clientName: client.name,
                propertyId,
                propertyTitle: property.title,
                device: log.device,
                totalTimeSeconds: log.totalTimeSeconds
            }
        }
    })
}

/**
 * Atualiza tempo de permanência em um acesso
 */
export async function updateAccessTime(logId: string, timeData: {
    totalTimeSeconds?: number
    galleryTimeSeconds?: number
    descriptionTimeSeconds?: number
    priceTimeSeconds?: number
    ctaTimeSeconds?: number
    scrollDepth?: number
}) {
    return prisma.propertyAccessLog.update({
        where: { id: logId },
        data: timeData
    })
}

/**
 * Registra clique em CTA
 */
export async function logCtaClick(logId: string, type: 'cta' | 'whatsapp') {
    const updateData = type === 'cta'
        ? { clickedCta: true }
        : { clickedWhatsApp: true }

    return prisma.propertyAccessLog.update({
        where: { id: logId },
        data: updateData
    })
}
