/**
 * GET  /api/social/metrics — Fetch post metrics with optional filters
 * POST /api/social/metrics — Trigger metrics fetch for a specific publication
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getPostMetrics } from '@/lib/social/publisher'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const publicationId = req.nextUrl.searchParams.get('publication_id')
    const platform = req.nextUrl.searchParams.get('platform')
    const days = Number(req.nextUrl.searchParams.get('days') || '30')

    try {
        let query = supabaseAdmin
            .from('social_post_metrics')
            .select('*, content_publications(*)')
            .order('fetched_at', { ascending: false })

        if (publicationId) {
            query = query.eq('publication_id', publicationId)
        }

        if (platform) {
            query = query.eq('content_publications.platform', platform)
        }

        // Filter by date range
        const sinceDate = new Date()
        sinceDate.setDate(sinceDate.getDate() - days)
        query = query.gte('fetched_at', sinceDate.toISOString())

        const { data: metrics, error } = await query

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Calculate summary
        const summary = (metrics || []).reduce(
            (acc, m) => ({
                total_impressions: acc.total_impressions + (m.impressions || 0),
                total_reach: acc.total_reach + (m.reach || 0),
                total_engagement: acc.total_engagement + (m.engagement || 0),
                avg_engagement_rate: 0, // calculated below
            }),
            { total_impressions: 0, total_reach: 0, total_engagement: 0, avg_engagement_rate: 0 },
        )

        if (summary.total_impressions > 0) {
            summary.avg_engagement_rate = Number(
                ((summary.total_engagement / summary.total_impressions) * 100).toFixed(2),
            )
        }

        return NextResponse.json({
            metrics: metrics || [],
            summary,
        })
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro ao buscar métricas' },
            { status: 500 },
        )
    }
}

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { publication_id } = body

    if (!publication_id) {
        return NextResponse.json(
            { error: 'publication_id é obrigatório' },
            { status: 400 },
        )
    }

    try {
        // Look up the publication
        const { data: publication, error: pubError } = await supabaseAdmin
            .from('content_publications')
            .select('*, social_accounts(*)')
            .eq('id', publication_id)
            .single()

        if (pubError || !publication) {
            return NextResponse.json({ error: 'Publicação não encontrada' }, { status: 404 })
        }

        const accessToken = publication.social_accounts?.access_token
        if (!accessToken) {
            return NextResponse.json(
                { error: 'Conta social sem access_token configurado' },
                { status: 400 },
            )
        }

        // Fetch metrics from the platform
        const metricsData = await getPostMetrics(
            accessToken,
            publication.external_post_id,
            publication.platform,
        )

        // Upsert into social_post_metrics
        const { data: savedMetrics, error: upsertError } = await supabaseAdmin
            .from('social_post_metrics')
            .upsert(
                {
                    publication_id,
                    platform: publication.platform,
                    external_post_id: publication.external_post_id,
                    impressions: metricsData.impressions || 0,
                    reach: metricsData.reach || 0,
                    engagement: metricsData.engagement || 0,
                    likes: metricsData.likes || 0,
                    comments: metricsData.comments || 0,
                    shares: metricsData.shares || 0,
                    clicks: metricsData.clicks || 0,
                    fetched_at: new Date().toISOString(),
                },
                { onConflict: 'publication_id' },
            )
            .select()
            .single()

        if (upsertError) {
            return NextResponse.json({ error: upsertError.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            metrics: savedMetrics,
        })
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Erro ao buscar métricas do post' },
            { status: 500 },
        )
    }
}
