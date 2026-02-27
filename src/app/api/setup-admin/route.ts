import { NextResponse } from 'next/server'

// ── DISABLED: This endpoint was a security risk (hardcoded password, public GET).
// Admin users should be created via Supabase Dashboard > Authentication > Users.
// Keeping file to avoid 404 — returns instructional message.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({
        success: false,
        error: 'Este endpoint foi desativado por segurança.',
        instrucao: 'Para criar usuários admin, use o Supabase Dashboard > Authentication > Users.',
        url: 'https://supabase.com/dashboard/project/zocffccwjjyelwrgunhu/auth/users',
    }, { status: 403 })
}

export async function POST() {
    return NextResponse.json({
        success: false,
        error: 'Este endpoint foi desativado por segurança.',
    }, { status: 403 })
}
