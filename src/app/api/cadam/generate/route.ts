import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateCadModel, inferProjectType } from '@imi/cad-generator'
import { sanitizePrompt, CadApiRequestSchema } from '@/lib/cadam/prompt-sanitizer'
import { logCadGeneration } from '@/lib/cadam/generation-log'
import { getTemplateById } from '@imi/templates'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

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

  const parsed = CadApiRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parâmetros inválidos', details: parsed.error.flatten() },
      { status: 422 },
    )
  }

  const { prompt, projectType, templateId, constraints, developmentId } = parsed.data

  const { safe, reason, sanitized } = sanitizePrompt(prompt)
  if (!safe) {
    return NextResponse.json({ error: `Prompt bloqueado: ${reason}` }, { status: 400 })
  }

  const template = templateId ? getTemplateById(templateId) : undefined
  const resolvedType = projectType ?? template?.type ?? inferProjectType(sanitized)
  const resolvedConstraints = constraints ?? template?.defaults

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Configuração de IA ausente' }, { status: 500 })
  }

  await logCadGeneration({
    generation_id: 'pending',
    requested_by: user.id,
    project_type: resolvedType,
    prompt_length: sanitized.length,
    template_id: templateId,
    development_id: developmentId,
    status: 'started',
  })

  try {
    const result = await generateCadModel(
      {
        prompt: sanitized,
        projectType: resolvedType,
        constraints: resolvedConstraints,
      },
      apiKey,
    )

    await logCadGeneration({
      generation_id: result.generationId,
      requested_by: user.id,
      project_type: resolvedType,
      prompt_length: sanitized.length,
      template_id: templateId,
      development_id: developmentId,
      status: 'completed',
      warnings: result.warnings,
    })

    return NextResponse.json({ result }, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'

    await logCadGeneration({
      generation_id: 'failed',
      requested_by: user.id,
      project_type: resolvedType,
      prompt_length: sanitized.length,
      template_id: templateId,
      development_id: developmentId,
      status: 'failed',
      error_message: message,
    })

    return NextResponse.json({ error: `Falha na geração: ${message}` }, { status: 500 })
  }
}
