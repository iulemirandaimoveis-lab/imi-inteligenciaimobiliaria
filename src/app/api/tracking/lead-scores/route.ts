export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/tracking/lead-scores — Hot leads ranked by engagement score
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const minScore = parseInt(searchParams.get('min_score') || '20')
        const limit = parseInt(searchParams.get('limit') || '50')
        const category = searchParams.get('category') // 'hot', 'warm', 'very_hot', 'ready'

        let query = supabase
            .from('tracker_lead_scores')
            .select('*')
            .gte('current_score', minScore)
            .order('current_score', { ascending: false })
            .limit(limit)

        if (category) query = query.eq('score_category', category)

        const { data, error } = await query

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        // Enrich with development info
        const devIds = [...new Set((data || []).map(d => d.development_id).filter(Boolean))]
        let developments: Record<string, { name: string; city: string; neighborhood: string }> = {}
        if (devIds.length > 0) {
            const { data: devs } = await supabase
                .from('developments')
                .select('id, name, city, neighborhood')
                .in('id', devIds)
            if (devs) {
                developments = Object.fromEntries(devs.map(d => [d.id, d]))
            }
        }

        const enriched = (data || []).map(score => ({
            ...score,
            development: score.development_id ? developments[score.development_id] || null : null,
        }))

        return NextResponse.json({
            leads: enriched,
            summary: {
                total: enriched.length,
                ready: enriched.filter(l => l.score_category === 'ready').length,
                very_hot: enriched.filter(l => l.score_category === 'very_hot').length,
                hot: enriched.filter(l => l.score_category === 'hot').length,
                warm: enriched.filter(l => l.score_category === 'warm').length,
            },
        })
    } catch {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
