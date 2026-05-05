import { NextResponse } from 'next/server'

function isValidOrigin(origin: unknown) {
  return typeof origin === 'string' && origin.startsWith('http')
}

export async function POST(req: Request) {
  const body = await req.json()
  if (!isValidOrigin(body?.origin)) {
    return NextResponse.json({ error: 'invalid_origin' }, { status: 400 })
  }

  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`

  return NextResponse.json({
    token,
    proposalUrl: `${body.origin}/pt/imoveis/jazz-boulevard-garanhuns/lp?proposal=${token}`,
    pdfUrl: `${body.origin}/api/jazz/proposal/pdf/${token}`,
    generatedAt: new Date().toISOString()
  })
}
