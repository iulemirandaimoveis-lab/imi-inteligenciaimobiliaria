import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { publishToSocialMedia } from '@/lib/social/publisher';
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
        const body = await request.json();
        const { content_item_id, platform, variant_id, scheduled_for } = body;
        if (!content_item_id || !platform) {
            return NextResponse.json(
                { error: 'content_item_id and platform are required' },
                { status: 400 }
            );
        }
        // Busca content item
        const { data: contentItem, error: contentError } = await supabase
            .from('content_items')
            .select('*')
            .eq('id', content_item_id)
            .single();
        if (contentError || !contentItem) {
            return NextResponse.json({ error: 'Content item not found' }, { status: 404 });
        }
        // Busca variante (se especificada) ou usa a do canal correto
        let variant;
        if (variant_id) {
            const { data: variantData } = await supabase
                .from('content_variants')
                .select('*')
                .eq('id', variant_id)
                .eq('content_item_id', content_item_id)
                .single();
            variant = variantData;
        } else {
            // Busca variante do canal adequado
            const platformToChannel: Record<string, string> = {
                facebook: 'facebook',
                instagram: 'instagram_feed',
                linkedin: 'linkedin',
                twitter: 'twitter',
                tiktok: 'tiktok',
            };
            const { data: variantData } = await supabase
                .from('content_variants')
                .select('*')
                .eq('content_item_id', content_item_id)
                .eq('channel', platformToChannel[platform])
                .single();
            variant = variantData;
        }
        if (!variant) {
            return NextResponse.json(
                { error: 'No variant found for this platform' },
                { status: 404 }
            );
        }
        // Busca conta social ativa
        const { data: account, error: accountError } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('tenant_id', contentItem.tenant_id)
            .eq('platform', platform)
            .eq('status', 'active')
            .single();
        if (accountError || !account) {
            return NextResponse.json(
                { error: `No active ${platform} account connected` },
                { status: 404 }
            );
        }
        // Cria registro de publicação
        const { data: publication, error: pubError } = await supabase
            .from('content_publications')
            .insert({
                content_item_id,
                content_variant_id: variant.id,
                social_account_id: account.id,
                tenant_id: contentItem.tenant_id,
                platform,
                published_content: variant.copy,
                published_image_urls: contentItem.image_url ? [contentItem.image_url] : [],
                status: scheduled_for ? 'scheduled' : 'publishing',
                scheduled_for: scheduled_for || null,
                published_by: user.id,
            })
            .select()
            .single();
        if (pubError || !publication) {
            return NextResponse.json(
                { error: 'Failed to create publication record' },
                { status: 500 }
            );
        }
        // Se tem scheduled_for, agenda; senão publica agora
        if (scheduled_for) {
            // O trigger auto_queue_publication vai criar o item na fila
            return NextResponse.json({
                publication_id: publication.id,
                scheduled_for,
                status: 'scheduled',
            });
        } else {
            // Publica imediatamente
            const result = await publishToSocialMedia({
                platform,
                access_token: account.access_token,
                content: variant.copy,
                image_urls: contentItem.image_url ? [contentItem.image_url] : [],
                account_id: account.account_id,
            });
            if (result.success) {
                // Atualiza registro com sucesso
                await supabase
                    .from('content_publications')
                    .update({
                        status: 'published',
                        published_at: new Date().toISOString(),
                        external_post_id: result.external_post_id,
                        external_post_url: result.external_post_url,
                    })
                    .eq('id', publication.id);
                // Atualiza content_item status
                await supabase
                    .from('content_items')
                    .update({ status: 'published' })
                    .eq('id', content_item_id);
                return NextResponse.json({
                    publication_id: publication.id,
                    external_post_id: result.external_post_id,
                    external_post_url: result.external_post_url,
                    platform,
                    published_at: new Date().toISOString(),
                    status: 'published',
                });
            } else {
                // Atualiza com erro
                await supabase
                    .from('content_publications')
                    .update({
                        status: 'failed',
                        error_code: result.error_code,
                        error_message: result.error_message,
                    })
                    .eq('id', publication.id);
                return NextResponse.json(
                    {
                        error: 'Publication failed',
                        error_code: result.error_code,
                        error_message: result.error_message,
                    },
                    { status: 500 }
                );
            }
        }
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
