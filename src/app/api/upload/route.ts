import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { nanoid } from 'nanoid'

export const runtime = 'nodejs';

/**
 * POST /api/upload
 * Upload de imagens para Supabase Storage
 *
 * Body: FormData com campo 'file'
 * Query params:
 *   - folder: pasta no bucket (ex: 'properties', 'profiles')
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File
        const { searchParams } = new URL(request.url)
        const folder = searchParams.get('folder') || 'properties'

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'Nenhum arquivo enviado' },
                { status: 400 }
            )
        }

        // Valida tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4', 'video/quicktime']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { success: false, error: 'Tipo não permitido. Use JPG, PNG, WebP, PDF ou MP4' },
                { status: 400 }
            )
        }

        // Valida tamanho (máx 50MB)
        const maxSize = 50 * 1024 * 1024 // 50MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: 'Arquivo muito grande. Máximo 50MB' },
                { status: 400 }
            )
        }

        // Gera nome único
        const ext = file.name.split('.').pop()
        const fileName = `${folder}/${nanoid(16)}.${ext}`

        // Converte File para ArrayBuffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload para Supabase
        const { data, error } = await supabaseAdmin.storage
            .from('media')
            .upload(fileName, buffer, {
                contentType: file.type,
                cacheControl: '3600',
                upsert: false
            })

        if (error) {
            console.error('Supabase upload error:', error)
            return NextResponse.json(
                { success: false, error: 'Erro ao fazer upload' },
                { status: 500 }
            )
        }

        // Gera URL pública
        const { data: publicData } = supabaseAdmin.storage
            .from('media')
            .getPublicUrl(fileName)

        return NextResponse.json({
            success: true,
            data: {
                fileName: data.path,
                url: publicData.publicUrl,
                size: file.size,
                type: file.type
            }
        })
    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao processar upload' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/upload
 * Deleta uma imagem do Supabase Storage
 *
 * Body: { "fileName": "properties/abc123.jpg" }
 */
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
        }

        const body = await request.json()
        const { fileName } = body

        if (!fileName) {
            return NextResponse.json(
                { success: false, error: 'fileName é obrigatório' },
                { status: 400 }
            )
        }

        const { error } = await supabaseAdmin.storage
            .from('media')
            .remove([fileName])

        if (error) {
            console.error('Supabase delete error:', error)
            return NextResponse.json(
                { success: false, error: 'Erro ao deletar arquivo' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Arquivo deletado com sucesso'
        })
    } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json(
            { success: false, error: 'Erro ao processar deleção' },
            { status: 500 }
        )
    }
}
