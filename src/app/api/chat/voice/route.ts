import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })

        const formData = await req.formData()
        const audioFile = formData.get('audio') as File
        const channelId = formData.get('channel_id') as string
        const duration = parseFloat(formData.get('duration') as string || '0')
        const waveform = formData.get('waveform') as string

        if (!audioFile || !channelId) {
            return NextResponse.json({ error: 'Audio e channel_id obrigatorios' }, { status: 400 })
        }

        // Upload to Supabase Storage
        const ext = audioFile.type.includes('webm') ? 'webm' : 'm4a'
        const key = `voice/${channelId}/${crypto.randomUUID()}.${ext}`

        const buffer = Buffer.from(await audioFile.arrayBuffer())
        const { error: uploadError } = await supabaseAdmin.storage
            .from('chat-voice')
            .upload(key, buffer, { contentType: audioFile.type, cacheControl: '31536000' })

        if (uploadError) {
            // Try creating bucket if it doesn't exist
            await supabaseAdmin.storage.createBucket('chat-voice', { public: true })
            await supabaseAdmin.storage.from('chat-voice').upload(key, buffer, { contentType: audioFile.type })
        }

        const { data: urlData } = supabaseAdmin.storage.from('chat-voice').getPublicUrl(key)

        // Create chat message
        const { data: msg, error: msgError } = await supabaseAdmin
            .from('chat_messages')
            .insert({
                channel_id: channelId,
                sender_id: user.id,
                content: '🎤 Mensagem de audio',
                content_type: 'voice',
                metadata: {
                    voice_url: urlData.publicUrl,
                    duration_seconds: duration,
                    waveform: waveform ? JSON.parse(waveform) : [],
                    storage_key: key,
                },
            })
            .select()
            .single()

        if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

        return NextResponse.json({ success: true, message: msg })
    } catch {
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}
