// src/app/api/contratos/salvar/route.ts
// ── Salva contrato: Supabase Storage + Google Drive (se config) ──

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

// Converte Markdown para HTML com template IMI
function markdownToHtmlDoc(md: string, idioma = 'pt', numero: string, criadoPorNome: string): string {
  const isRtl = idioma === 'ar'
  const dir = isRtl ? 'rtl' : 'ltr'
  const dataFmt = new Date().toLocaleDateString('pt-BR')

  let html = md
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^═+$/gm, '<hr/>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')

  return `<!DOCTYPE html><html lang="${idioma}" dir="${dir}">
<head><meta charset="UTF-8"><title>${numero}</title>
<style>
  body{font-family:'Georgia',serif;font-size:11pt;line-height:1.8;color:#1A1A1A;padding:48px;max-width:780px;margin:0 auto;direction:${dir}}
  .header{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px;padding-bottom:16px;border-bottom:2px solid #334E68}
  .logo{font-size:24px;font-weight:900;color:#1A1A1A;letter-spacing:-1px}
  .meta{font-size:9pt;color:#888;text-align:right}
  h1{font-size:16pt;text-align:center;margin:32px 0 24px;color:#1A1A1A}
  h2{font-size:13pt;color:#334E68;margin:28px 0 10px;border-bottom:1px solid #E8D5B0;padding-bottom:4px}
  h3{font-size:11pt;font-weight:bold;margin:16px 0 6px}
  p{margin:8px 0;text-align:justify}
  hr{border:none;border-top:1px solid #ddd;margin:20px 0}
  .footer{margin-top:48px;padding-top:14px;border-top:1px solid #E5E7EB;font-size:8pt;color:#AAA;text-align:center}
  @media print{body{padding:20mm}}
</style></head>
<body>
<div class="header">
  <div><div class="logo">IMI</div><div style="font-size:9pt;color:#888">Inteligência Imobiliária · CRECI 17933</div></div>
  <div class="meta"><div>Contrato: ${numero}</div><div>Emitido em: ${dataFmt}</div><div>Por: ${criadoPorNome}</div></div>
</div>
<div class="content"><p>${html}</p></div>
<div class="footer">IMI – Inteligência Imobiliária · Documento gerado eletronicamente em ${new Date().toISOString()}</div>
</body></html>`
}

// Upload para Google Drive via Service Account
async function uploadGoogleDrive(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string,
  folderId: string,
  serviceAccountJson: string
): Promise<string | null> {
  try {
    // Dynamic import para evitar bundle em edge
    const { google } = await import('googleapis')

    const serviceAccount = JSON.parse(serviceAccountJson)
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })

    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
        mimeType,
      },
      media: {
        mimeType,
        body: require('stream').Readable.from(fileBuffer),
      },
      fields: 'id,webViewLink',
    })

    return response.data.webViewLink || null
  } catch (err) {
    console.warn('Google Drive upload failed (não crítico):', err)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const {
      numero,
      modelo_id,
      modelo_nome,
      categoria,
      status,
      idioma_primario,
      idiomas_adicionais,
      contratante,
      contratado,
      dados_contrato,
      conteudo_markdown,
      conteudo_adicional,
      criado_por,
      criado_por_nome,
      notas,
    } = await req.json()

    const gdriveFolder    = process.env.GDRIVE_FOLDER_ID
    const gdriveJson      = process.env.GDRIVE_SERVICE_ACCOUNT_JSON
    const ano             = new Date().getFullYear()

    // ── Gera HTML do contrato principal ────────────────────
    const htmlContent = markdownToHtmlDoc(conteudo_markdown, idioma_primario, numero, criado_por_nome)
    const htmlBuffer  = Buffer.from(htmlContent, 'utf-8')
    const mdBuffer    = Buffer.from(conteudo_markdown, 'utf-8')

    const results: Record<string, any> = {}

    // ── Upload Supabase Storage ────────────────────────────
    const htmlPath = `${ano}/${numero}.html`
    const mdPath   = `${ano}/${numero}.md`

    await supabaseAdmin.storage.from('contratos').upload(htmlPath, htmlBuffer, { contentType: 'text/html', upsert: true })
    await supabaseAdmin.storage.from('contratos').upload(mdPath, mdBuffer, { contentType: 'text/markdown', upsert: true })

    const { data: { publicUrl: htmlUrl } } = supabaseAdmin.storage.from('contratos').getPublicUrl(htmlPath)
    const { data: { publicUrl: mdUrl   } } = supabaseAdmin.storage.from('contratos').getPublicUrl(mdPath)

    results.supabase = { html_url: htmlUrl, md_url: mdUrl }

    // ── Upload Google Drive (se configurado) ───────────────
    let gdriveUrl: string | null = null
    if (gdriveFolder && gdriveJson) {
      gdriveUrl = await uploadGoogleDrive(
        htmlBuffer,
        `${numero}.html`,
        'text/html',
        gdriveFolder,
        gdriveJson
      )
      results.google_drive = gdriveUrl ? { url: gdriveUrl } : { error: 'Upload falhou' }
    } else {
      results.google_drive = { status: 'nao_configurado', instrucao: 'Configure Google Drive em Integrações → Armazenamento' }
    }

    // ── Upload versões adicionais (outros idiomas) ─────────
    if (conteudo_adicional && typeof conteudo_adicional === 'object') {
      for (const [lang, conteudo] of Object.entries(conteudo_adicional)) {
        if (!conteudo) continue
        const langBuffer = Buffer.from(conteudo as string, 'utf-8')
        const langPath   = `${ano}/${numero}_${lang}.md`
        await supabaseAdmin.storage.from('contratos').upload(langPath, langBuffer, { contentType: 'text/markdown', upsert: true })
      }
    }

    // ── Salva no banco ────────────────────────────────────
    const { data: contrato, error: dbError } = await supabaseAdmin
      .from('contratos')
      .insert({
        numero,
        modelo_id,
        modelo_nome,
        categoria,
        status: status || 'gerado',
        idioma_primario: idioma_primario || 'pt',
        idiomas_adicionais: idiomas_adicionais || [],
        contratante,
        contratado,
        dados_contrato,
        conteudo_markdown,
        conteudo_adicional: conteudo_adicional || {},
        pdf_url: htmlUrl,
        docx_url: mdUrl,
        gdrive_url: gdriveUrl,
        criado_por,
        criado_por_nome,
        notas,
      })
      .select()
      .single()

    if (dbError) {
      console.warn('DB insert error (não crítico se storage OK):', dbError.message)
      return NextResponse.json({
        success: true,
        partial: true,
        numero,
        pdf_url: htmlUrl,
        docx_url: mdUrl,
        gdrive_url: gdriveUrl,
        results,
        warning: 'Arquivos salvos, mas inserção no banco falhou. Execute a migration SQL do B12.',
        db_error: dbError.message,
      })
    }

    return NextResponse.json({
      success: true,
      contrato_id: contrato.id,
      numero,
      pdf_url: htmlUrl,
      docx_url: mdUrl,
      gdrive_url: gdriveUrl,
      results,
    })

  } catch (error: any) {
    console.error('salvar-contrato error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao salvar' }, { status: 500 })
  }
}
