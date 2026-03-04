import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'build-placeholder'

function getAdmin() {
    return createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    })
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
        }

        const admin = getAdmin()

        // 1. Delete broker record first (FK constraint)
        const { error: brokerError } = await admin
            .from('brokers')
            .delete()
            .eq('user_id', userId)

        if (brokerError) {
            console.error('Error deleting broker record:', brokerError)
            // Continue even if broker record doesn't exist
        }

        // 2. Delete auth user via admin API
        const { error: authError } = await admin.auth.admin.deleteUser(userId)

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Error in DELETE /api/brokers/delete:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
