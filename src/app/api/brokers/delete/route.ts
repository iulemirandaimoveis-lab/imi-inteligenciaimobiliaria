import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE(request: Request) {
    try {
        // Auth check — only authenticated users can delete brokers
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
        }

        // Prevent self-deletion
        if (userId === user.id) {
            return NextResponse.json({ error: 'Não é possível excluir o próprio usuário' }, { status: 400 })
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
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteAuthError) {
            return NextResponse.json({ error: deleteAuthError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('Error in DELETE /api/brokers/delete:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
