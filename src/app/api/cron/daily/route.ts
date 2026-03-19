export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
// Cron job unificado: executa todos os jobs diários em sequência
// Schedule: 0 1 * * * (diário às 1h)
// Combina: publishing-queue, email-sequences, weekly-reports, follow-ups
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const headers = { authorization: `Bearer ${process.env.CRON_SECRET}` }
        const jobs = [
            '/api/cron/process-follow-ups',
            '/api/cron/process-publishing-queue',
            '/api/cron/process-email-sequences',
            '/api/cron/generate-weekly-reports',
        ]
        const results: Record<string, unknown> = {}
        for (const job of jobs) {
            try {
                const res = await fetch(`${baseUrl}${job}`, { headers })
                results[job] = res.ok
                    ? await res.json()
                    : { error: `HTTP ${res.status}` }
            } catch (err) {
                results[job] = { error: err instanceof Error ? err.message : 'Failed' }
            }
        }
        return NextResponse.json({ success: true, results })
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        )
    }
}
