import { NextResponse } from 'next/server'

// ── DISABLED: This endpoint was a security risk (hardcoded bearer token, service role key).
// Database migrations should be run via Supabase Dashboard > SQL Editor
// or via `supabase db push` CLI.

export async function POST() {
    return NextResponse.json({
        success: false,
        error: 'Este endpoint foi desativado por segurança.',
        instrucao: 'Execute migrações via Supabase Dashboard > SQL Editor ou supabase CLI.',
        url: 'https://supabase.com/dashboard/project/zocffccwjjyelwrgunhu/sql/new',
    }, { status: 403 })
}

export async function GET() {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
