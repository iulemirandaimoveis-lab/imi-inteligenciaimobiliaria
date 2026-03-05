import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePostContent } from '@/lib/ai/claude';
import { ContentType, SocialPlatform } from '@/types/commercial-system';

export const runtime = 'nodejs'
interface GenerateFromSuggestionRequest {
    tenant_id: string;
    calendar_id: string;
    topic: string;
    content_pillar?: string;
    objective?: string;
    suggested_date?: string;
    platforms?: SocialPlatform[];
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Verifica autenticação
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: GenerateFromSuggestionRequest = await request.json();

        // Verifica se user tem acesso ao tenant
        const { data: tenantUser } = await supabase
            .from('tenant_users')
            .select('role')
            .eq('tenant_id', body.tenant_id)
            .eq('user_id', user.id)
            .single();

        if (!tenantUser) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Verifica se já existe post com esse tópico neste calendário
        const { data: existingPost } = await supabase
            .from('content_items')
            .select('id')
            .eq('calendar_id', body.calendar_id)
            .eq('topic', body.topic)
            .single();

        if (existingPost) {
            return NextResponse.json(
                { error: 'Post já criado para este tópico', post_id: existingPost.id },
                { status: 400 }
            );
        }

        // Contexto adicional baseado no plano do calendário
        let additional_context = '';
        if (body.content_pillar) {
            additional_context += `Pilar de conteúdo: ${body.content_pillar}. `;
        }
        if (body.objective) {
            additional_context += `Objetivo: ${body.objective}. `;
        }
        if (body.suggested_date) {
            additional_context += `Data sugerida: ${body.suggested_date}. `;
        }

        // Gera conteúdo com Claude
        const aiResult = await generatePostContent({
            tenant_id: body.tenant_id,
            topic: body.topic,
            content_type: 'post' as ContentType,
            platforms: body.platforms || ['instagram_feed', 'facebook'],
            additional_context,
            requested_by: user.id,
        });

        // Cria content item
        const { data: contentItem, error: createError } = await supabase
            .from('content_items')
            .insert({
                tenant_id: body.tenant_id,
                calendar_id: body.calendar_id,
                title: body.topic,
                topic: body.topic,
                content_type: 'post' as ContentType,
                base_copy: aiResult.base_copy,
                base_cta: aiResult.base_cta,
                hashtags: aiResult.hashtags,
                tone: aiResult.tone,
                image_prompt: aiResult.image_prompt,
                status: 'ai_generated',
                ai_request_ids: [aiResult.ai_request_id],
            })
            .select('id')
            .single();

        if (createError) {
            throw new Error(`Failed to create content item: ${createError.message}`);
        }

        // Cria variants para cada plataforma
        const variants = [];
        for (const platform of body.platforms || ['instagram_feed', 'facebook']) {
            const { data: variant } = await supabase
                .from('content_variants')
                .insert({
                    content_item_id: contentItem.id,
                    platform: platform as SocialPlatform,
                    adapted_copy: aiResult.base_copy,
                    adapted_cta: aiResult.base_cta,
                    adapted_hashtags: aiResult.hashtags,
                    character_count: aiResult.base_copy.length,
                })
                .select()
                .single();

            if (variant) {
                variants.push(variant);
            }
        }

        return NextResponse.json({
            content_item_id: contentItem.id,
            base_copy: aiResult.base_copy,
            base_cta: aiResult.base_cta,
            hashtags: aiResult.hashtags,
            image_prompt: aiResult.image_prompt,
            variants,
            ai_request_id: aiResult.ai_request_id,
            cost_usd: aiResult.cost_usd,
        });
    } catch (error: any) {
        console.error('Error in /api/ai/generate-from-suggestion:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
