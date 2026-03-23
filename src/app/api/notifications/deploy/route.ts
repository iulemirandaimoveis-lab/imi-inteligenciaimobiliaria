import { NextResponse } from 'next/server'
import { sendNotification } from '@/lib/send-notification'

export async function POST(req: Request) {
    try {
        const { message, version } = await req.json()

        // Broadcast to all users (user_id = null)
        await sendNotification({
            title: '\uD83D\uDE80 Nova Atualiza\u00E7\u00E3o',
            message: message || `O backoffice foi atualizado${version ? ` (v${version})` : ''}. Recarregue para ver as novidades.`,
            type: 'deploy',
            userId: null, // broadcast
            data: { version, deployed_at: new Date().toISOString() },
        })

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : String(err) },
            { status: 500 },
        )
    }
}
