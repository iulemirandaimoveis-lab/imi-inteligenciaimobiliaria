import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateImage, uploadGeneratedImage } from '@/lib/ai/gemini';
import { GenerateImageRequest, AspectRatio } from '@/types/commercial-system';

export const runtime = 'nodejs'
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

        const body: GenerateImageRequest = await request.json();

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

        // Verifica se content item existe
        const { data: contentItem } = await supabase
            .from('content_items')
            .select('id, tenant_id, image_prompt')
            .eq('id', body.content_item_id)
            .single();

        if (!contentItem || contentItem.tenant_id !== body.tenant_id) {
            return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
        }

        // Atualiza status para "image_generating"
        await supabase
            .from('content_items')
            .update({ status: 'image_generating' })
            .eq('id', body.content_item_id);

        // Gera imagem com Gemini
        const imageResult = await generateImage({
            tenant_id: body.tenant_id,
            prompt: body.prompt,
            aspect_ratio: body.aspect_ratio as AspectRatio,
            request_type: 'generate_image',
            related_entity_id: body.content_item_id,
            requested_by: user.id,
        });

        // Upload para Supabase Storage
        const public_url = await uploadGeneratedImage(
            body.tenant_id,
            body.content_item_id,
            imageResult.image_data,
            'jpg'
        );

        // Atualiza content item com URL da imagem
        const { error: updateError } = await supabase
            .from('content_items')
            .update({
                image_url: public_url,
                status: 'image_generated',
                ai_request_ids: [...(contentItem.image_prompt ? [imageResult.ai_request_id] : [])],
                updated_at: new Date().toISOString(),
            })
            .eq('id', body.content_item_id);

        if (updateError) {
            console.error('Failed to update content item:', updateError);
        }

        return NextResponse.json({
            content_item_id: body.content_item_id,
            image_url: public_url,
            ai_request_id: imageResult.ai_request_id,
            cost_usd: imageResult.cost_usd,
        });
    } catch (error: any) {
        console.error('Error in /api/ai/generate-image:', error);

        // Tenta reverter status em caso de erro
        try {
            const body: GenerateImageRequest = await request.json();
            const supabase = await createClient();
            await supabase
                .from('content_items')
                .update({ status: 'ai_generated' })
                .eq('id', body.content_item_id);
        } catch { }

        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
