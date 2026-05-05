import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json()
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`

  const response = {
    token,
    proposalUrl: `${body?.origin ?? ''}/pt/imoveis/jazz-boulevard-garanhuns/lp?proposal=${token}`,
    pdfUrl: `${body?.origin ?? ''}/api/jazz/proposal/pdf/${token}`,
    generatedAt: new Date().toISOString()
  }

  return NextResponse.json(response)
}
