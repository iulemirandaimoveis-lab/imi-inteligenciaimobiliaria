// GET /api/widgets — public: returns only enabled widgets ordered by display_order
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('widgets_config')
        .select('widget_id, name, description, category, display_order, config')
        .eq('enabled', true)
        .order('display_order', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
}
