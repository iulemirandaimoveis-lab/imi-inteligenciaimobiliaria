import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildSceneGraph } from '@imi/scene-adapter'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const SceneRequestSchema = z.object({
  cadGenerationId: z.string(),
  developmentId: z.string().uuid(),
  gltfUrl: z.string().url().optional(),
  previewSceneJson: z.record(z.unknown()).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowedRoles = ['admin', 'super_admin', 'developer_admin']
  if (!profile || !allowedRoles.includes(profile.role)) {
    return NextResponse.json({ error: 'Acesso restrito à equipe IMI' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const parsed = SceneRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const result = buildSceneGraph(parsed.data)

  return NextResponse.json({ sceneGraph: result.sceneGraph, warnings: result.warnings })
}
