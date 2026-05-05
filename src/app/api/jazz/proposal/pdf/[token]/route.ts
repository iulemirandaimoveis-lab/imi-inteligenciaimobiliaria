import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const content = `Proposta Jazz Boulevard\nToken: ${params.token}\nGerado em: ${new Date().toISOString()}\n\nResumo:\n- Simulação registrada\n- Atendimento especializado disponível no WhatsApp\n`

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="proposta-${params.token}.pdf"`
    }
  })
}
