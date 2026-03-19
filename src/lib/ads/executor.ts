import { createClient } from '@/lib/supabase/server';
type AdsPlatform = 'google_ads' | 'meta_ads';
type ActionType = 'pause' | 'activate' | 'adjust_bid' | 'change_budget';
interface AdActionParams {
    budget_amount?: number;
    [key: string]: unknown;
}
interface ExecuteAdActionParams {
    tenant_id: string;
    campaign_id: string;
    platform: AdsPlatform;
    action_type: ActionType;
    params: AdActionParams;
    reason: string;
    executed_by: string;
}
interface ActionResult {
    success: boolean;
    message?: string;
    error?: string;
}
/**
 * Executa ação em campanha de anúncios
 */
export async function executeAdAction(params: ExecuteAdActionParams): Promise<ActionResult> {
    const { tenant_id, campaign_id, platform, action_type, params: actionParams, reason, executed_by } = params;
    const supabase = await createClient();
    try {
        // Busca campanha e conta
        const { data: campaign } = await supabase
            .from('ads_campaigns')
            .select('*, account:ads_accounts(*)')
            .eq('id', campaign_id)
            .single();
        if (!campaign) {
            throw new Error('Campaign not found');
        }
        const account = campaign.account;
        if (!account.access_token) {
            throw new Error('Account not connected');
        }
        // Registra ação como pending
        const { data: action } = await supabase
            .from('ads_actions')
            .insert({
                tenant_id,
                campaign_id,
                action_type,
                action_params: actionParams,
                reason,
                executed_by,
                status: 'pending',
            })
            .select()
            .single();
        if (!action) {
            throw new Error('Failed to create action log');
        }
        // Executa ação na plataforma
        let result: Record<string, unknown>;
        if (platform === 'google_ads') {
            result = await executeGoogleAdsAction(campaign, account, action_type, actionParams);
        } else if (platform === 'meta_ads') {
            result = await executeMetaAdsAction(campaign, account, action_type, actionParams);
        } else {
            throw new Error('Unsupported platform');
        }
        // Atualiza ação como success
        await supabase
            .from('ads_actions')
            .update({
                status: 'success',
                result,
            })
            .eq('id', action.id);
        // Atualiza campanha localmente
        await updateCampaignAfterAction(campaign_id, action_type, actionParams);
        return {
            success: true,
            message: `Action ${action_type} executed successfully`,
        };
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        // Atualiza ação como failed
        await supabase
            .from('ads_actions')
            .update({
                status: 'failed',
                error_message: errMsg,
            })
            .eq('campaign_id', campaign_id)
            .eq('status', 'pending')
            .order('executed_at', { ascending: false })
            .limit(1);
        return {
            success: false,
            error: errMsg,
        };
    }
}
/**
 * Executa ação no Google Ads
 */
interface AdsCampaignRecord {
    external_id: string;
    budget_id?: string;
    [key: string]: unknown;
}
interface AdsAccountRecord {
    customer_id?: string;
    access_token: string | null;
    platform?: string;
    [key: string]: unknown;
}
async function executeGoogleAdsAction(
    campaign: AdsCampaignRecord,
    account: AdsAccountRecord,
    action_type: ActionType,
    params: AdActionParams
): Promise<Record<string, unknown>> {
    const customerId = account.customer_id;
    const accessToken = account.access_token;
    // Google Ads API v15
    const baseUrl = 'https://googleads.googleapis.com/v15';
    switch (action_type) {
        case 'pause':
            return await fetch(`${baseUrl}/customers/${customerId}/campaigns:mutate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
                },
                body: JSON.stringify({
                    operations: [
                        {
                            update: {
                                resourceName: campaign.external_id,
                                status: 'PAUSED',
                            },
                            updateMask: 'status',
                        },
                    ],
                }),
            }).then((r) => r.json());
        case 'activate':
            return await fetch(`${baseUrl}/customers/${customerId}/campaigns:mutate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
                },
                body: JSON.stringify({
                    operations: [
                        {
                            update: {
                                resourceName: campaign.external_id,
                                status: 'ENABLED',
                            },
                            updateMask: 'status',
                        },
                    ],
                }),
            }).then((r) => r.json());
        case 'change_budget':
            return await fetch(`${baseUrl}/customers/${customerId}/campaignBudgets:mutate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
                },
                body: JSON.stringify({
                    operations: [
                        {
                            update: {
                                resourceName: campaign.budget_id,
                                amountMicros: (params.budget_amount ?? 0) * 1000000, // Converter para micros
                            },
                            updateMask: 'amountMicros',
                        },
                    ],
                }),
            }).then((r) => r.json());
        default:
            throw new Error(`Action ${action_type} not implemented for Google Ads`);
    }
}
/**
 * Executa ação no Meta Ads
 */
async function executeMetaAdsAction(
    campaign: AdsCampaignRecord,
    account: AdsAccountRecord,
    action_type: ActionType,
    params: AdActionParams
): Promise<Record<string, unknown>> {
    const accessToken = account.access_token;
    const campaignId = campaign.external_id;
    // Meta Marketing API v18.0
    const baseUrl = 'https://graph.facebook.com/v18.0';
    switch (action_type) {
        case 'pause':
            return await fetch(`${baseUrl}/${campaignId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'PAUSED',
                }),
            }).then((r) => r.json());
        case 'activate':
            return await fetch(`${baseUrl}/${campaignId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'ACTIVE',
                }),
            }).then((r) => r.json());
        case 'change_budget':
            return await fetch(`${baseUrl}/${campaignId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    daily_budget: (params.budget_amount ?? 0) * 100, // Converter para centavos
                }),
            }).then((r) => r.json());
        default:
            throw new Error(`Action ${action_type} not implemented for Meta Ads`);
    }
}
/**
 * Atualiza campanha localmente após ação
 */
async function updateCampaignAfterAction(
    campaign_id: string,
    action_type: ActionType,
    params: AdActionParams
) {
    const supabase = await createClient();
    const updates: Record<string, unknown> = {};
    if (action_type === 'pause') {
        updates.status = 'paused';
    } else if (action_type === 'activate') {
        updates.status = 'active';
    } else if (action_type === 'change_budget') {
        updates.budget = params.budget_amount;
    }
    if (Object.keys(updates).length > 0) {
        await supabase.from('ads_campaigns').update(updates).eq('id', campaign_id);
    }
}
/**
 * Sincroniza campanhas de uma conta
 */
export async function syncCampaigns(account_id: string) {
    const supabase = await createClient();
    try {
        // Registra início do sync
        const { data: syncLog } = await supabase
            .from('ads_sync_logs')
            .insert({
                ads_account_id: account_id,
                tenant_id: '', // Buscar do account
                sync_type: 'campaigns',
                status: 'running',
            })
            .select()
            .single();
        // Busca account
        const { data: account } = await supabase
            .from('ads_accounts')
            .select('*')
            .eq('id', account_id)
            .single();
        if (!account) throw new Error('Account not found');
        let campaignsSynced = 0;
        // Sincroniza baseado na plataforma
        if (account.platform === 'google_ads') {
            // Implementar sync Google Ads
            campaignsSynced = await syncGoogleAdsCampaigns(account);
        } else if (account.platform === 'meta_ads') {
            // Implementar sync Meta Ads
            campaignsSynced = await syncMetaAdsCampaigns(account);
        }
        // Atualiza sync log
        await supabase
            .from('ads_sync_logs')
            .update({
                status: 'success',
                campaigns_synced: campaignsSynced,
                completed_at: new Date().toISOString(),
            })
            .eq('id', syncLog!.id);
        return { success: true, campaigns_synced: campaignsSynced };
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        return { success: false, error: errMsg };
    }
}
async function syncGoogleAdsCampaigns(_account: AdsAccountRecord): Promise<number> {
    // Stub: Google Ads sync not yet implemented — returns 0 synced campaigns
    return 0;
}
async function syncMetaAdsCampaigns(_account: AdsAccountRecord): Promise<number> {
    // Stub: Meta Ads sync not yet implemented — returns 0 synced campaigns
    return 0;
}
