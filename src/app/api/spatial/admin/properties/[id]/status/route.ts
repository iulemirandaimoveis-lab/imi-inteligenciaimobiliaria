import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiHandler, ApiContext } from '@/lib/api-helpers'

export const runtime = 'nodejs'

const statusSchema = z.object({
  status: z.enum(['available', 'reserved', 'sold', 'blocked', 'launching', 'hidden']),
})

export const PATCH = apiHandler(
  statusSchema,
  async (req: NextRequest, body: z.infer<typeof statusSchema>, ctx: ApiContext) => {
    const { supabase } = ctx
    const id = req.nextUrl.pathname.split('/').at(-2)!

    const { error } = await supabase
      .from('imi_properties')
      .update({ status: body.status })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Falha ao atualizar status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  },
  { auth: true }
)
