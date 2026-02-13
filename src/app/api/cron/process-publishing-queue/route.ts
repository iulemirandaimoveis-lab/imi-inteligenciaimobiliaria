import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { processPublishingQueue } from '@/lib/social/publisher';

// Cron job: processar fila de publicações
// Executar a cada hora
export async function GET(request: NextRequest) {
    try {
        // Verifica secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await processPublishingQueue();

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in cron/process-publishing-queue:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
