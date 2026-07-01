import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { rateLimit, getClientIP } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/lots/proposal/documents — upload PÚBLICO (sem auth) dos documentos
 * que o CLIENTE anexa à proposta de compra (CPF/CNH, comprovante de residência,
 * certidões). Sobe para o bucket Supabase `proposal-documents` (privado) via
 * service role e devolve URLs assinadas de longa duração para a equipe acessar.
 *
 * Sendo um endpoint público, é a superfície de abuso natural — por isso:
 *  • rate limit por IP;
 *  • tipos restritos (PDF e imagens) e tamanho máximo por arquivo;
 *  • no máximo N arquivos por requisição.
 * Best-effort no resto do fluxo: se o storage falhar, a proposta ainda é enviada.
 */

const BUCKET = 'proposal-documents'
const MAX_FILES = 8
const MAX_SIZE = 15 * 1024 * 1024 // 15 MB por arquivo
const ALLOWED = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
])
// 30 dias — tempo de sobra para a equipe baixar os documentos da proposta.
const SIGNED_URL_TTL = 60 * 60 * 24 * 30

let bucketReady = false
async function ensureBucket() {
  if (bucketReady) return
  try {
    const { data } = await supabaseAdmin.storage.getBucket(BUCKET)
    if (!data) {
      await supabaseAdmin.storage.createBucket(BUCKET, {
        public: false,
        fileSizeLimit: MAX_SIZE,
        allowedMimeTypes: Array.from(ALLOWED),
      })
    }
    bucketReady = true
  } catch {
    // Se a verificação/criação falhar, tentamos o upload mesmo assim — o bucket
    // pode já existir e a chamada de getBucket falhar por permissão.
  }
}

function safeExt(name: string, type: string): string {
  const fromName = name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName
  if (type === 'application/pdf') return 'pdf'
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/heic' || type === 'image/heif') return 'heic'
  return 'jpg'
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const rl = await rateLimit(`proposal-docs:${ip}`, { limit: 12, windowMs: 60_000 })
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: 'Muitas tentativas. Aguarde um instante e tente novamente.' },
      { status: 429 },
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ success: false, error: 'Corpo inválido.' }, { status: 400 })
  }

  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) {
    return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 })
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { success: false, error: `Máximo de ${MAX_FILES} arquivos por envio.` },
      { status: 400 },
    )
  }
  for (const f of files) {
    if (!ALLOWED.has(f.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo não permitido. Envie PDF ou imagem (JPG, PNG, WEBP).' },
        { status: 400 },
      )
    }
    if (f.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 15MB por documento.' },
        { status: 400 },
      )
    }
  }

  await ensureBucket()

  const folder = nanoid(12)
  const uploaded: { name: string; url: string }[] = []
  try {
    for (const file of files) {
      const ext = safeExt(file.name, file.type)
      const path = `${folder}/${nanoid(10)}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())
      const { error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type, cacheControl: '3600', upsert: false })
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Falha ao enviar documento: ' + error.message },
          { status: 500 },
        )
      }
      const { data: signed } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(path, SIGNED_URL_TTL)
      uploaded.push({
        name: file.name || `documento.${ext}`,
        url: signed?.signedUrl ?? '',
      })
    }
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Falha no upload.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, documents: uploaded })
}
