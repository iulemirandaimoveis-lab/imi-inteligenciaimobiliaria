export const dynamic = 'force-dynamic'
// GET /api/ranking — Leaderboard endpoint
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const now = new Date()
        const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const period = searchParams.get('period') || defaultPeriod
        const teamId = searchParams.get('team_id')

        // Fetch all data in parallel
        const [
            { data: brokers, error: brokersErr },
            { data: teams, error: teamsErr },
            { data: performance, error: perfErr },
            { data: badges, error: badgesErr },
            { data: challenges, error: challengesErr },
        ] = await Promise.all([
            supabase.from('brokers')
                .select('id, name, email, phone, creci, avatar_url, status, role, team_id, level, performance_score, deals_closed, vgv_total, vgv_month, commission_split_pct, rank_position, badges, streak_months, specializations')
                .order('performance_score', { ascending: false }),
            supabase.from('teams')
                .select('id, name, description, specialty, region, target_vgv, current_vgv, color, member_count, leader_name, is_active'),
            supabase.from('broker_performance')
                .select('*')
                .eq('period', period),
            supabase.from('broker_badges')
                .select('*'),
            supabase.from('challenges')
                .select('*')
                .eq('is_active', true),
        ])

        if (brokersErr) {
            console.error('[ranking] brokers fetch error:', brokersErr.message)
            return NextResponse.json({ error: 'Failed to fetch brokers' }, { status: 500 })
        }
        if (teamsErr) {
            console.error('[ranking] teams fetch error:', teamsErr.message)
            return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
        }
        if (perfErr) {
            console.error('[ranking] performance fetch error:', perfErr.message)
        }
        if (badgesErr) {
            console.error('[ranking] badges fetch error:', badgesErr.message)
        }
        if (challengesErr) {
            console.error('[ranking] challenges fetch error:', challengesErr.message)
        }

        let filteredBrokers = brokers || []
        if (teamId) {
            filteredBrokers = filteredBrokers.filter(b => b.team_id === teamId)
        }

        // Compute team member counts
        const teamMemberCounts: Record<string, number> = {}
        for (const b of (brokers || [])) {
            if (b.team_id) {
                teamMemberCounts[b.team_id] = (teamMemberCounts[b.team_id] || 0) + 1
            }
        }
        const teamsWithCounts = (teams || []).map(t => ({
            ...t,
            computed_member_count: teamMemberCounts[t.id] || 0,
        }))

        // KPIs
        const totalBrokers = filteredBrokers.length
        const totalVGV = filteredBrokers.reduce((sum, b) => sum + (b.vgv_month || 0), 0)
        const avgScore = totalBrokers > 0
            ? Math.round((filteredBrokers.reduce((sum, b) => sum + (b.performance_score || 0), 0) / totalBrokers) * 10) / 10
            : 0
        const topBroker = filteredBrokers[0] || null
        const topPerformer = topBroker
            ? { name: topBroker.name, score: topBroker.performance_score, avatar_url: topBroker.avatar_url }
            : null

        return NextResponse.json({
            brokers: filteredBrokers,
            teams: teamsWithCounts,
            performance: performance || [],
            badges: badges || [],
            challenges: challenges || [],
            kpis: {
                totalBrokers,
                totalVGV,
                avgScore,
                topPerformer,
            },
        }, {
            headers: { 'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=120' },
        })
    } catch (err: unknown) {
        console.error('[ranking] unexpected error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
