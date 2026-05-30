import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { IMI_CAD_TEMPLATES, getTemplatesByType } from '@imi/templates'
import type { CadProjectType } from '@imi/cad-generator'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const type = req.nextUrl.searchParams.get('type') as CadProjectType | null

  const templates = type
    ? getTemplatesByType(type)
    : IMI_CAD_TEMPLATES

  return NextResponse.json({ templates }, { status: 200 })
}
