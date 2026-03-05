import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
        }

        // 1. Delete broker record first (FK constraint)
        const { error: brokerError } = await supabaseAdmin
            .from('brokers')
            .delete()
            .eq('user_id', userId)

        if (brokerError) {
            console.error('Error deleting broker record:', brokerError)
            // Continue even if broker record doesn't exist
        }

        // 2. Delete auth user via admin API
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Error in DELETE /api/brokers/delete:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
