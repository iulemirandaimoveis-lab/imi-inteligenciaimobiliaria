import { NextRequest, NextResponse } from 'next/server'

// DEPRECATED: Esta rota usa Prisma e será reimplementada com Supabase
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return NextResponse.json(
        { error: 'Esta API está sendo migrada para Supabase. Use o Supabase client diretamente no componente.' },
        { status: 503 }
    )
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return NextResponse.json(
        { error: 'Esta API está sendo migrada para Supabase. Use o Supabase client diretamente no componente.' },
        { status: 503 }
    )
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return NextResponse.json(
        { error: 'Esta API está sendo migrada para Supabase. Use o Supabase client diretamente no componente.' },
        { status: 503 }
    )
}
