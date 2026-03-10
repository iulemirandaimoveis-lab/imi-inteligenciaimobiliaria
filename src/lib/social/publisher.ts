/**
 * Social Publisher — Real API implementations
 * Meta Graph API v19 (Facebook + Instagram)
 * LinkedIn API v2
 * WhatsApp Business Cloud API
 */
import { createClient } from '@/lib/supabase/server'

export type SocialPlatform = 'facebook' | 'instagram' | 'linkedin' | 'whatsapp' | 'twitter' | 'tiktok'

interface PublishParams {
    platform: SocialPlatform
    access_token: string
    content: string
    image_urls?: string[]
    video_url?: string
    account_id: string // page_id / ig_user_id / li_urn
}

interface PublishResult {
    success: boolean
    external_post_id?: string
    external_post_url?: string
    error_code?: string
    error_message?: string
}

// ── Meta Graph API v19 ────────────────────────────────────────────────────────

async function publishToFacebook({ access_token, content, image_urls = [], account_id }: PublishParams): Promise<PublishResult> {
    const base = `https://graph.facebook.com/v19.0/${account_id}`

    try {
        let photo_ids: string[] = []

        // Upload images as unpublished photos first
        for (const url of image_urls.slice(0, 10)) {
            const res = await fetch(`${base}/photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, published: false, access_token }),
            })
            const data = await res.json()
            if (data.id) photo_ids.push(data.id)
        }

        const body: any = { message: content, access_token }
        if (photo_ids.length === 1) {
            body.object_attachment = photo_ids[0]
        } else if (photo_ids.length > 1) {
            body.attached_media = photo_ids.map(id => ({ media_fbid: id }))
        }

        const res = await fetch(`${base}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
        const data = await res.json()

        if (data.error) return { success: false, error_code: data.error.code?.toString(), error_message: data.error.message }

        return {
            success: true,
            external_post_id: data.id,
            external_post_url: `https://facebook.com/${data.id}`,
        }
    } catch (e: any) {
        return { success: false, error_code: 'FB_ERROR', error_message: e.message }
    }
}

async function publishToInstagram({ access_token, content, image_urls = [], video_url, account_id }: PublishParams): Promise<PublishResult> {
    const base = `https://graph.facebook.com/v19.0/${account_id}`

    try {
        let container_id: string

        if (image_urls.length > 1) {
            // Carousel
            const children: string[] = []
            for (const url of image_urls.slice(0, 10)) {
                const r = await fetch(`${base}/media`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token }),
                })
                const d = await r.json()
                if (d.id) children.push(d.id)
            }
            const carousel = await fetch(`${base}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ media_type: 'CAROUSEL', children: children.join(','), caption: content, access_token }),
            })
            const cd = await carousel.json()
            container_id = cd.id
        } else if (video_url) {
            const r = await fetch(`${base}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ media_type: 'REELS', video_url, caption: content, share_to_feed: true, access_token }),
            })
            const d = await r.json()
            container_id = d.id
        } else {
            const imageUrl = image_urls[0]
            if (!imageUrl) return { success: false, error_code: 'IG_NO_MEDIA', error_message: 'Instagram requer imagem ou vídeo' }
            const r = await fetch(`${base}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_url: imageUrl, caption: content, access_token }),
            })
            const d = await r.json()
            container_id = d.id
        }

        if (!container_id) return { success: false, error_code: 'IG_CONTAINER_FAIL', error_message: 'Falha ao criar container de mídia' }

        // Poll until ready (up to 30s for videos)
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 3000))
            const statusRes = await fetch(`https://graph.facebook.com/v19.0/${container_id}?fields=status_code&access_token=${access_token}`)
            const statusData = await statusRes.json()
            if (statusData.status_code === 'FINISHED') break
            if (statusData.status_code === 'ERROR') return { success: false, error_code: 'IG_PROCESSING_ERROR', error_message: 'Erro ao processar mídia' }
        }

        // Publish
        const pub = await fetch(`${base}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ creation_id: container_id, access_token }),
        })
        const pubData = await pub.json()

        if (pubData.error) return { success: false, error_code: pubData.error.code?.toString(), error_message: pubData.error.message }

        return {
            success: true,
            external_post_id: pubData.id,
            external_post_url: `https://instagram.com/p/${pubData.id}`,
        }
    } catch (e: any) {
        return { success: false, error_code: 'IG_ERROR', error_message: e.message }
    }
}

// ── LinkedIn API v2 ───────────────────────────────────────────────────────────

async function publishToLinkedIn({ access_token, content, image_urls = [], account_id }: PublishParams): Promise<PublishResult> {
    try {
        const author = account_id.startsWith('urn:') ? account_id : `urn:li:person:${account_id}`

        const body: any = {
            author,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: { text: content },
                    shareMediaCategory: image_urls.length > 0 ? 'IMAGE' : 'NONE',
                    media: image_urls.slice(0, 9).map(url => ({
                        status: 'READY',
                        originalUrl: url,
                    })),
                },
            },
            visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
        }

        if (image_urls.length === 0) {
            delete body.specificContent['com.linkedin.ugc.ShareContent'].media
        }

        const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${access_token}`,
                'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify(body),
        })
        const data = await res.json()

        if (!res.ok) return { success: false, error_code: 'LI_ERROR', error_message: data.message || JSON.stringify(data) }

        const postId = data.id?.split(':').pop() || data.id
        return {
            success: true,
            external_post_id: data.id,
            external_post_url: `https://linkedin.com/feed/update/${data.id}`,
        }
    } catch (e: any) {
        return { success: false, error_code: 'LI_ERROR', error_message: e.message }
    }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function publishToSocialMedia(params: PublishParams): Promise<PublishResult> {
    switch (params.platform) {
        case 'facebook':  return publishToFacebook(params)
        case 'instagram': return publishToInstagram(params)
        case 'linkedin':  return publishToLinkedIn(params)
        default:
            return { success: false, error_code: 'UNSUPPORTED', error_message: `Plataforma ${params.platform} ainda não suportada` }
    }
}

// ── Queue processor ───────────────────────────────────────────────────────────

export async function processPublishingQueue() {
    const supabase = await createClient()

    const { data: queueItems } = await supabase
        .from('publishing_queue')
        .select('*, content_publications(*)')
        .eq('status', 'queued')
        .lte('scheduled_for', new Date().toISOString())
        .limit(10)

    if (!queueItems?.length) return { processed: 0, success: 0, failed: 0 }

    let successCount = 0, failedCount = 0

    for (const item of queueItems) {
        await supabase.from('publishing_queue').update({ status: 'processing', processing_started_at: new Date().toISOString() }).eq('id', item.id)

        const publication = item.content_publications
        const { data: account } = await supabase.from('social_accounts').select('*').eq('id', publication.social_account_id).single()
        if (!account) { failedCount++; continue }

        const result = await publishToSocialMedia({
            platform: publication.platform,
            access_token: account.access_token,
            content: publication.published_content || '',
            image_urls: publication.published_image_urls || [],
            account_id: account.account_id,
        })

        if (result.success) {
            await supabase.from('content_publications').update({ status: 'published', published_at: new Date().toISOString(), external_post_id: result.external_post_id, external_post_url: result.external_post_url }).eq('id', publication.id)
            await supabase.from('publishing_queue').update({ status: 'completed', processing_completed_at: new Date().toISOString() }).eq('id', item.id)
            successCount++
        } else {
            const retryCount = item.retry_count + 1
            const shouldRetry = retryCount < item.max_retries
            await supabase.from('content_publications').update({ status: 'failed', error_code: result.error_code, error_message: result.error_message }).eq('id', publication.id)
            await supabase.from('publishing_queue').update({ status: shouldRetry ? 'queued' : 'failed', retry_count: retryCount, next_retry_at: shouldRetry ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null }).eq('id', item.id)
            failedCount++
        }
    }

    return { processed: queueItems.length, success: successCount, failed: failedCount }
}
