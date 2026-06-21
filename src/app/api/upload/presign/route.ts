import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs'

const hasServiceKey = !!(process.env.SUPABASE_SERVICE_ROLE_KEY)

/**
 * POST /api/upload/presign
 * Generates a Supabase Storage signed upload URL so the browser can upload
 * large files (videos) directly to Supabase, bypassing Vercel's 4.5 MB body limit.
 *
 * Body: { contentType: string, filename: string, bucket?: string, folder?: string }
 * Returns: { signedUrl, path, publicUrl }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      contentType,
      filename,
      bucket = 'media',
      folder = 'alto-bellevue-areas',
    } = body as { contentType: string; filename: string; bucket?: string; folder?: string }

    if (!contentType) {
      return NextResponse.json({ error: 'contentType é obrigatório' }, { status: 400 })
    }

    // Only video types via presigned URL (images go through the normal upload route)
    if (!contentType.startsWith('video/') && !contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 })
    }

    const ext = (filename?.split('.').pop() ?? 'bin').toLowerCase()
    const filePath = `${folder}/${nanoid(16)}.${ext}`

    const storageClient = hasServiceKey ? supabaseAdmin : supabase

    const { data, error } = await storageClient.storage
      .from(bucket)
      .createSignedUploadUrl(filePath)

    if (error || !data?.signedUrl) {
      console.error('[presign] storage error:', error?.message, '| bucket:', bucket, '| path:', filePath, '| hasServiceKey:', hasServiceKey)
      return NextResponse.json(
        { error: 'Erro ao gerar URL de upload: ' + (error?.message ?? 'desconhecido') },
        { status: 500 },
      )
    }

    const { data: { publicUrl } } = storageClient.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: filePath,
      publicUrl,
    })
  } catch {
    return NextResponse.json({ error: 'Erro interno ao gerar URL de upload' }, { status: 500 })
  }
}
