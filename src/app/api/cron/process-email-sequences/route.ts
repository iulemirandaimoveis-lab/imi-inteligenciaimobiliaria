export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server';
import { processEmailSequences } from '@/lib/email/sequences';

// Cron job: processar sequências de email
// Executar a cada hora
export async function GET(request: NextRequest) {
    try {
        // Verifica secret para segurança
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await processEmailSequences();

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error: any) {
        console.error('Error in cron/process-email-sequences:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
