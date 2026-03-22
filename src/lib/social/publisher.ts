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

        const body: Record<string, unknown> = { message: content, access_token }
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
    } catch (e: unknown) {
        return { success: false, error_code: 'FB_ERROR', error_message: e instanceof Error ? e.message : 'Unknown error' }
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
    } catch (e: unknown) {
        return { success: false, error_code: 'IG_ERROR', error_message: e instanceof Error ? e.message : 'Unknown error' }
    }
}

// ── LinkedIn API v2 ───────────────────────────────────────────────────────────

async function publishToLinkedIn({ access_token, content, image_urls = [], account_id }: PublishParams): Promise<PublishResult> {
    try {
        const author = account_id.startsWith('urn:') ? account_id : `urn:li:person:${account_id}`

        const body: Record<string, unknown> = {
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
            const sc = body.specificContent as Record<string, Record<string, unknown>>
            delete sc['com.linkedin.ugc.ShareContent'].media
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
    } catch (e: unknown) {
        return { success: false, error_code: 'LI_ERROR', error_message: e instanceof Error ? e.message : 'Unknown error' }
    }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function publishToSocialMedia(params: PublishParams): Promise<PublishResult> {
    switch (params.platform) {
        case 'facebook':  return publishToFacebook(params)
        case 'instagram': return publishToInstagram(params)
        case 'linkedin':  return publishToLinkedIn(params)
        case 'tiktok':    return publishToTikTok(params)
        case 'twitter':   return publishToTwitter(params)
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

// ── Instagram DM Functions ────────────────────────────────────────────────────

// ── Read Instagram DMs ──
export async function getInstagramMessages(access_token: string, ig_user_id: string) {
    const res = await fetch(
        `https://graph.facebook.com/v19.0/${ig_user_id}/conversations?platform=instagram&fields=participants,messages{id,created_time,from,to,message}&access_token=${access_token}`
    )
    if (!res.ok) throw new Error(`Instagram DM fetch failed: ${res.status}`)
    return res.json()
}

// ── Reply to Instagram DM ──
export async function replyInstagramDM(access_token: string, ig_user_id: string, recipient_id: string, message: string) {
    const res = await fetch(
        `https://graph.facebook.com/v19.0/${ig_user_id}/messages`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipient_id },
                message: { text: message },
                access_token
            })
        }
    )
    if (!res.ok) throw new Error(`Instagram DM reply failed: ${res.status}`)
    return res.json()
}

// ── Facebook Messenger Functions ──────────────────────────────────────────────

// ── Read Facebook Messenger ──
export async function getFacebookMessages(access_token: string, page_id: string) {
    const res = await fetch(
        `https://graph.facebook.com/v19.0/${page_id}/conversations?fields=participants,messages{message,from,created_time}&access_token=${access_token}`
    )
    if (!res.ok) throw new Error(`Facebook Messenger fetch failed: ${res.status}`)
    return res.json()
}

// ── Reply via Facebook Messenger ──
export async function replyFacebookMessage(access_token: string, page_id: string, recipient_id: string, message: string) {
    const res = await fetch(
        `https://graph.facebook.com/v19.0/${page_id}/messages`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipient: { id: recipient_id },
                message: { text: message },
                messaging_type: 'RESPONSE',
                access_token
            })
        }
    )
    if (!res.ok) throw new Error(`Facebook reply failed: ${res.status}`)
    return res.json()
}

// ── Post Metrics ──────────────────────────────────────────────────────────────

// ── Fetch Post Metrics ──
export async function getPostMetrics(access_token: string, post_id: string, platform: SocialPlatform): Promise<Record<string, number>> {
    if (platform === 'facebook') {
        const res = await fetch(
            `https://graph.facebook.com/v19.0/${post_id}?fields=shares,likes.summary(true),comments.summary(true),insights.metric(post_impressions,post_engaged_users,post_clicks)&access_token=${access_token}`
        )
        if (!res.ok) return {}
        const data = await res.json()
        const insights = (data.insights?.data || []).reduce((acc: Record<string, number>, m: any) => {
            acc[m.name] = m.values?.[0]?.value || 0
            return acc
        }, {} as Record<string, number>)
        return {
            likes: data.likes?.summary?.total_count || 0,
            comments: data.comments?.summary?.total_count || 0,
            shares: data.shares?.count || 0,
            impressions: insights.post_impressions || 0,
            reach: insights.post_engaged_users || 0,
            clicks: insights.post_clicks || 0,
        }
    }
    if (platform === 'instagram') {
        const res = await fetch(
            `https://graph.facebook.com/v19.0/${post_id}/insights?metric=impressions,reach,likes,comments,shares,saved&access_token=${access_token}`
        )
        if (!res.ok) return {}
        const data = await res.json()
        return (data.data || []).reduce((acc: Record<string, number>, m: any) => {
            acc[m.name] = m.values?.[0]?.value || 0
            return acc
        }, {} as Record<string, number>)
    }
    if (platform === 'linkedin') {
        const res = await fetch(
            `https://api.linkedin.com/v2/socialActions/${post_id}?fields=likes,comments,shares`,
            { headers: { 'Authorization': `Bearer ${access_token}` } }
        )
        if (!res.ok) return {}
        const data = await res.json()
        return {
            likes: data.likes?.summary?.totalCount || 0,
            comments: data.comments?.summary?.totalCount || 0,
            shares: data.shares?.summary?.totalCount || 0,
        }
    }
    return {}
}

// ── TikTok Publishing ─────────────────────────────────────────────────────────

// ── Publish to TikTok ──
export async function publishToTikTok({ access_token, content, video_url }: PublishParams): Promise<PublishResult> {
    if (!video_url) {
        return { success: false, error_code: 'NO_VIDEO', error_message: 'TikTok requer vídeo' }
    }
    try {
        const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                post_info: {
                    title: (content || '').slice(0, 150),
                    privacy_level: 'PUBLIC_TO_EVERYONE',
                    disable_duet: false,
                    disable_stitch: false,
                    disable_comment: false,
                },
                source_info: { source: 'PULL_FROM_URL', video_url }
            })
        })
        const initData = await initRes.json()
        if (initData.error?.code) {
            return { success: false, error_code: 'TIKTOK_ERROR', error_message: initData.error.message }
        }
        return { success: true, external_post_id: initData.data?.publish_id }
    } catch (err: unknown) {
        return { success: false, error_code: 'TIKTOK_EXCEPTION', error_message: err instanceof Error ? err.message : 'Unknown error' }
    }
}

// ── Twitter/X Publishing & DMs ────────────────────────────────────────────────

// ── Publish to Twitter/X ──
export async function publishToTwitter({ access_token, content }: PublishParams): Promise<PublishResult> {
    try {
        const res = await fetch('https://api.twitter.com/2/tweets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: (content || '').slice(0, 280) })
        })
        const data = await res.json()
        if (data.errors) {
            return { success: false, error_code: 'TWITTER_ERROR', error_message: data.errors[0]?.detail || 'Unknown error' }
        }
        return {
            success: true,
            external_post_id: data.data?.id,
            external_post_url: `https://x.com/i/status/${data.data?.id}`
        }
    } catch (err: unknown) {
        return { success: false, error_code: 'TWITTER_EXCEPTION', error_message: err instanceof Error ? err.message : 'Unknown error' }
    }
}

// ── Read Twitter/X DMs ──
export async function getTwitterDMs(access_token: string) {
    const res = await fetch(
        'https://api.twitter.com/2/dm_events?dm_event.fields=id,text,created_at,dm_conversation_id,sender_id&max_results=50',
        { headers: { 'Authorization': `Bearer ${access_token}` } }
    )
    if (!res.ok) throw new Error(`Twitter DM fetch failed: ${res.status}`)
    return res.json()
}

// ── Reply Twitter/X DM ──
export async function replyTwitterDM(access_token: string, conversation_id: string, message: string) {
    const res = await fetch(
        `https://api.twitter.com/2/dm_conversations/${conversation_id}/messages`,
        {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message })
        }
    )
    if (!res.ok) throw new Error(`Twitter DM reply failed: ${res.status}`)
    return res.json()
}
