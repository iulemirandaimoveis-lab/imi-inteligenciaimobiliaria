import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeAdAction } from '@/lib/ads/executor';
// POST /api/ads/pause-campaign
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
        const { campaign_id, reason } = body;
        if (!campaign_id) {
            return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 });
        }
        // Busca campanha
        const { data: campaign } = await supabase
            .from('ads_campaigns')
            .select('*, account:ads_accounts(*)')
            .eq('id', campaign_id)
            .single();
        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
        // Executa ação
        const result = await executeAdAction({
            tenant_id: campaign.tenant_id,
            campaign_id,
            platform: campaign.account.platform as string,
            action_type: 'pause',
            params: {},
            reason: reason || 'Manual pause',
            executed_by: user.id,
        });
        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }
        return NextResponse.json({ success: true, message: result.message });
    } catch (error: unknown) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal Server Error' },
            { status: 500 }
        );
    }
}
