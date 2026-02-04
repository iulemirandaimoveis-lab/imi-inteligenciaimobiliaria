import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '30d'

        // Calcular data de início baseado no período
        const now = new Date()
        const startDate = new Date()

        switch (period) {
            case '7d':
                startDate.setDate(now.getDate() - 7)
                break
            case '30d':
                startDate.setDate(now.getDate() - 30)
                break
            case '90d':
                startDate.setDate(now.getDate() - 90)
                break
            case '1y':
                startDate.setFullYear(now.getFullYear() - 1)
                break
        }

        // Período anterior para comparação
        const previousStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()))

        // Buscar estatísticas
        const [
            totalLeads,
            previousLeads,
            totalClients,
            previousClients,
            totalProperties,
            previousProperties,
            totalViews,
            previousViews,
        ] = await Promise.all([
            // Leads atuais
            prisma.lead.count({
                where: { createdAt: { gte: startDate } },
            }),
            // Leads período anterior
            prisma.lead.count({
                where: {
                    createdAt: {
                        gte: previousStartDate,
                        lt: startDate,
                    },
                },
            }),
            // Clientes atuais
            prisma.client.count({
                where: { createdAt: { gte: startDate } },
            }),
            // Clientes período anterior
            prisma.client.count({
                where: {
                    createdAt: {
                        gte: previousStartDate,
                        lt: startDate,
                    },
                },
            }),
            // Imóveis disponíveis atuais
            prisma.property.count({
                where: { status: 'AVAILABLE' },
            }),
            // Imóveis disponíveis período anterior (criados antes)
            prisma.property.count({
                where: {
                    status: 'AVAILABLE',
                    createdAt: { lt: startDate },
                },
            }),
            // Visualizações atuais (soma de viewCount)
            prisma.property.aggregate({
                _sum: { viewCount: true },
            }),
            // Visualizações período anterior (aproximado via accessLogs)
            prisma.propertyAccessLog.count({
                where: {
                    createdAt: {
                        gte: previousStartDate,
                        lt: startDate,
                    },
                },
            }),
        ])

        // Calcular receita potencial (soma dos preços dos imóveis disponíveis)
        const revenue = await prisma.property.aggregate({
            _sum: { listPrice: true },
            where: { status: 'AVAILABLE' },
        })

        const previousRevenue = await prisma.property.aggregate({
            _sum: { listPrice: true },
            where: {
                status: 'AVAILABLE',
                createdAt: { lt: startDate },
            },
        })

        // Calcular crescimento percentual
        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0
            return Math.round(((current - previous) / previous) * 100)
        }

        const currentViews = totalViews._sum?.viewCount || 0
        const currentRevenue = Number(revenue._sum?.listPrice || 0)
        const prevRevenue = Number(previousRevenue._sum?.listPrice || 0)

        const stats = {
            totalLeads,
            totalClients,
            totalProperties,
            totalViews: currentViews,
            totalRevenue: currentRevenue,
            leadsGrowth: calculateGrowth(totalLeads, previousLeads),
            clientsGrowth: calculateGrowth(totalClients, previousClients),
            propertiesGrowth: calculateGrowth(totalProperties, previousProperties),
            viewsGrowth: calculateGrowth(currentViews, previousViews),
            revenueGrowth: calculateGrowth(currentRevenue, prevRevenue),
        }

        return NextResponse.json({ stats })
    } catch (error) {
        console.error('Erro ao buscar relatórios:', error)
        return NextResponse.json(
            { error: 'Erro ao buscar relatórios' },
            { status: 500 }
        )
    }
}
