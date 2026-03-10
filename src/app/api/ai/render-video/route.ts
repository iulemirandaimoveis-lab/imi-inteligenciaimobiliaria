/**
 * POST /api/ai/render-video
 *
 * Renderiza composição Remotion via Lambda (produção) ou retorna
 * instrução de preview local (desenvolvimento).
 *
 * Requer env vars para produção:
 *   REMOTION_SERVE_URL     — URL do bundle Remotion hospedado (S3)
 *   REMOTION_AWS_REGION    — Região AWS (e.g. "us-east-1")
 *   REMOTION_FUNCTION_NAME — Nome da Lambda function do Remotion
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min timeout for render

export async function POST(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { template, format, props, tenant_id } = body

    if (!template || !format) {
        return NextResponse.json({ error: 'template e format são obrigatórios' }, { status: 400 })
    }

    const serveUrl = process.env.REMOTION_SERVE_URL
    const awsRegion = process.env.REMOTION_AWS_REGION || 'us-east-1'
    const functionName = process.env.REMOTION_FUNCTION_NAME || 'remotion-render-4-0-dev'

    // If Remotion Lambda not configured → return preview-only response
    if (!serveUrl) {
        return NextResponse.json({
            preview_only: true,
            message: 'Configure REMOTION_SERVE_URL para renderização em produção.',
            template,
            format,
        })
    }

    try {
        // Dynamic import to avoid bundling issues when Lambda not configured
        const { renderMediaOnLambda, getRenderProgress } = await import(/* webpackIgnore: true */ '@remotion/lambda')

        const FORMAT_DIMS: Record<string, { width: number; height: number; fps: number; durationInFrames: number }> = {
            tiktok:   { width: 1080, height: 1920, fps: 30, durationInFrames: 450 },
            reels:    { width: 1080, height: 1920, fps: 30, durationInFrames: 450 },
            youtube:  { width: 1080, height: 1920, fps: 30, durationInFrames: 270 },
            story:    { width: 1080, height: 1920, fps: 30, durationInFrames: 300 },
            square:   { width: 1080, height: 1080, fps: 30, durationInFrames: 300 },
        }

        const dims = FORMAT_DIMS[format] || FORMAT_DIMS.tiktok

        const { renderId, bucketName } = await renderMediaOnLambda({
            region: awsRegion as any,
            functionName,
            serveUrl,
            composition: template,
            inputProps: props || {},
            codec: 'h264',
            imageFormat: 'jpeg',
            maxRetries: 2,
            privacy: 'public',
            downloadBehavior: { type: 'download', fileName: `imi-${template.toLowerCase()}-${Date.now()}.mp4` },
        })

        // Wait for render to complete (polling)
        let progress = 0
        let videoUrl = ''
        const maxAttempts = 120 // 2 min max
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const result = await getRenderProgress({
                renderId,
                bucketName,
                functionName,
                region: awsRegion as any,
            })
            progress = result.overallProgress

            if (result.done) {
                videoUrl = result.outputFile || ''
                break
            }
            if (result.fatalErrorEncountered) {
                throw new Error(result.errors?.[0]?.message || 'Render failed')
            }
        }

        if (!videoUrl) throw new Error('Render timeout — tente novamente')

        // Log usage
        await supabase.from('ai_requests').insert({
            tenant_id: tenant_id || null,
            provider: 'remotion',
            model: template,
            prompt: `Video render: ${template} / ${format}`,
            response: videoUrl,
            cost_usd: 0.03,
            latency_ms: progress * 1000,
            status: 'success',
            request_type: 'render_video',
            requested_by: user.id,
        })

        return NextResponse.json({ video_url: videoUrl, render_id: renderId })

    } catch (err: any) {
        console.error('Remotion render error:', err)
        return NextResponse.json(
            { error: err.message || 'Render failed' },
            { status: 500 }
        )
    }
}
