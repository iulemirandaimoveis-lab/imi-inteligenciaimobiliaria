import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'

const secret = process.env.JAZZ_WEBHOOK_SECRET ?? 'dev-secret'

export async function POST(req: Request) {
  const body = await req.json()
  const signature = createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex')

  return NextResponse.json({
    ok: true,
    receivedAt: new Date().toISOString(),
    signature,
    forwardedTo: ['crm', 'analytics', 'whatsapp']
  })
}
