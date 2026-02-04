import { NextResponse } from 'next/server'

// Esta rota foi desabilitada por segurança.
// Para criar um admin, use o Supabase Dashboard ou um script local seguro.

export const runtime = 'nodejs';

export async function GET() {
    return NextResponse.json({
        error: 'Esta rota foi desabilitada por segurança.',
        message: 'Para configurar um administrador, entre em contato com o suporte técnico.'
    }, { status: 403 })
}

export async function POST() {
    return NextResponse.json({
        error: 'Esta rota foi desabilitada por segurança.',
        message: 'Para configurar um administrador, entre em contato com o suporte técnico.'
    }, { status: 403 })
}
