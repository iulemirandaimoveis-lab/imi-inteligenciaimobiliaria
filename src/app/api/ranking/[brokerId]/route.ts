export const dynamic = 'force-dynamic'
// GET /api/ranking/[brokerId] — Individual broker profile
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ brokerId: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { brokerId } = await params

        if (!brokerId) {
            return NextResponse.json({ error: 'Broker ID is required' }, { status: 400 })
        }

        // Fetch broker first
        const { data: broker, error: brokerErr } = await supabase
            .from('brokers')
            .select('*')
            .eq('id', brokerId)
            .single()

        if (brokerErr || !broker) {
            console.error('[ranking/broker] broker fetch error:', brokerErr?.message)
            return NextResponse.json({ error: 'Broker not found' }, { status: 404 })
        }

        // Current period for targets
        const now = new Date()
        const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        // Fetch remaining data in parallel
        const [
            { data: performanceHistory, error: perfErr },
            { data: badges, error: badgesErr },
            { data: targets, error: targetsErr },
            { data: team, error: teamErr },
        ] = await Promise.all([
            supabase.from('broker_performance')
                .select('*')
                .eq('broker_id', brokerId)
                .order('period', { ascending: false }),
            supabase.from('broker_badges')
                .select('*')
                .eq('broker_id', brokerId),
            supabase.from('broker_targets')
                .select('*')
                .eq('broker_id', brokerId)
                .eq('period', currentPeriod)
                .maybeSingle(),
            broker.team_id
                ? supabase.from('teams')
                    .select('*')
                    .eq('id', broker.team_id)
                    .single()
                : Promise.resolve({ data: null, error: null }),
        ])

        if (perfErr) {
            console.error('[ranking/broker] performance fetch error:', perfErr.message)
        }
        if (badgesErr) {
            console.error('[ranking/broker] badges fetch error:', badgesErr.message)
        }
        if (targetsErr) {
            console.error('[ranking/broker] targets fetch error:', targetsErr.message)
        }
        if (teamErr) {
            console.error('[ranking/broker] team fetch error:', teamErr.message)
        }

        return NextResponse.json({
            broker,
            team: team || null,
            performance_history: performanceHistory || [],
            badges: badges || [],
            targets: targets || null,
        })
    } catch (err: unknown) {
        console.error('[ranking/broker] unexpected error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
