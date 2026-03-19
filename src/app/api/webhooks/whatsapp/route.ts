import { NextRequest, NextResponse } from 'next/server';
import { processWhatsAppWebhook } from '@/lib/whatsapp/sender';
// GET: Verificação webhook (Meta exige)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
// POST: Recebe mensagens
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // Processa webhook assincronamente
        processWhatsAppWebhook(body).catch((error) => {
        });
        // Retorna 200 imediatamente (Meta exige resposta rápida)
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
