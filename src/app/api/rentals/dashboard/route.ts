import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

async function getAuthenticatedSupabase() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase: null, user: null }
    return { supabase, user }
}

export async function GET() {
    try {
        const { supabase, user } = await getAuthenticatedSupabase()
        if (!supabase || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        // Parallel fetch: properties + bookings (Musk: eliminate sequential latency)
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

        const [propResult, bookResult] = await Promise.all([
            supabase
                .from('rental_properties')
                .select('id, name, status, daily_rate, listing_mode, bedrooms, address'),
            supabase
                .from('rental_bookings')
                .select('*')
                .gte('check_out', monthStart)
                .lte('check_in', monthEnd)
                .neq('status', 'cancelled'),
        ])

        if (propResult.error) {
            return NextResponse.json({ error: propResult.error.message }, { status: 500 })
        }
        if (bookResult.error) {
            return NextResponse.json({ error: bookResult.error.message }, { status: 500 })
        }

        const properties = propResult.data
        const bookings = bookResult.data

        // Calculate stats
        const totalProperties = properties?.length ?? 0
        const activeProperties = properties?.filter(p => p.status === 'active').length ?? 0
        const monthBookings = bookings ?? []

        const totalRevenue = monthBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0)
        const avgDailyRate = monthBookings.length > 0
            ? monthBookings.reduce((sum, b) => {
                const nights = Math.max(1, Math.ceil(
                    (new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / 86400000
                ))
                return sum + (Number(b.total_amount) / nights)
            }, 0) / monthBookings.length
            : 0

        // Occupancy: total booked nights / (active properties * days in month)
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const totalBookedNights = monthBookings.reduce((sum, b) => {
            const cin = new Date(Math.max(new Date(b.check_in).getTime(), new Date(monthStart).getTime()))
            const cout = new Date(Math.min(new Date(b.check_out).getTime(), new Date(monthEnd).getTime()))
            return sum + Math.max(0, Math.ceil((cout.getTime() - cin.getTime()) / 86400000))
        }, 0)
        const totalAvailableNights = activeProperties * daysInMonth
        const occupancyRate = totalAvailableNights > 0
            ? Math.round((totalBookedNights / totalAvailableNights) * 100)
            : 0

        // Recent bookings
        const { data: recentBookings } = await supabase
            .from('rental_bookings')
            .select('*, rental_properties(name)')
            .order('created_at', { ascending: false })
            .limit(10)

        return NextResponse.json({
            stats: {
                totalProperties,
                activeProperties,
                totalRevenue,
                avgDailyRate: Math.round(avgDailyRate * 100) / 100,
                occupancyRate,
                bookingsCount: monthBookings.length,
            },
            properties: properties ?? [],
            recentBookings: recentBookings ?? [],
        }, {
            headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
        })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 },
        )
    }
}
