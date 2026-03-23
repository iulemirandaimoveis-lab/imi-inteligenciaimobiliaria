import { SupabaseClient } from '@supabase/supabase-js'

export interface AIPermissions {
    chatEnabled: boolean
    allowedModels: string[]
    dailyTokenLimit: number
    maxConversationsPerDay: number
    canUseToolActions: boolean
    canViewHistory: boolean
    canExportConversations: boolean
}

export async function resolveUserPermissions(
    userId: string,
    userRole: string,
    supabase: SupabaseClient
): Promise<AIPermissions> {
    // 1. Global config — gracefully handle missing table (migration not applied)
    let globalConfig: Record<string, unknown> | null = null
    try {
        const { data } = await supabase
            .from('ai_chat_config')
            .select('*')
            .single()
        globalConfig = data
    } catch {
        // Table doesn't exist yet — default to enabled
    }

    // If table exists but feature is explicitly disabled
    if (globalConfig && globalConfig.feature_enabled === false) {
        return { chatEnabled: false, allowedModels: [], dailyTokenLimit: 0, maxConversationsPerDay: 0, canUseToolActions: false, canViewHistory: false, canExportConversations: false }
    }

    // 2. Role permissions — gracefully handle missing table
    let rolePerms: Record<string, unknown> | null = null
    try {
        const { data } = await supabase
            .from('ai_chat_role_permissions')
            .select('*')
            .eq('role', userRole)
            .single()
        rolePerms = data
    } catch {
        // Table doesn't exist yet — use defaults
    }

    // 3. User overrides — gracefully handle missing table
    let userOverride: Record<string, unknown> | null = null
    try {
        const { data } = await supabase
            .from('ai_chat_user_overrides')
            .select('*')
            .eq('user_id', userId)
            .single()
        userOverride = data
    } catch {
        // No overrides
    }

    // Resolve cascade: override > role > default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rp = rolePerms as any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uo = userOverride as any
    const base: AIPermissions = {
        chatEnabled: rp?.chat_enabled ?? true,  // Default to enabled when no role config exists
        allowedModels: rp?.allowed_models ?? ['claude-haiku-4-5-20251001'],
        dailyTokenLimit: rp?.daily_token_limit ?? 50000,
        maxConversationsPerDay: rp?.max_conversations_per_day ?? 20,
        canUseToolActions: rp?.can_use_tool_actions ?? false,
        canViewHistory: rp?.can_view_history ?? true,
        canExportConversations: rp?.can_export_conversations ?? false,
    }

    if (uo) {
        if (uo.chat_enabled !== null) base.chatEnabled = uo.chat_enabled
        if (uo.allowed_models !== null) base.allowedModels = uo.allowed_models
        if (uo.daily_token_limit !== null) base.dailyTokenLimit = uo.daily_token_limit
        if (uo.max_conversations_per_day !== null) base.maxConversationsPerDay = uo.max_conversations_per_day
        if (uo.can_use_tool_actions !== null) base.canUseToolActions = uo.can_use_tool_actions
    }

    // Filter by global allowed models
    const gc = globalConfig as any // eslint-disable-line @typescript-eslint/no-explicit-any
    if (gc?.allowed_models && Array.isArray(gc.allowed_models)) {
        base.allowedModels = base.allowedModels.filter((m: string) => gc.allowed_models.includes(m))
    }

    return base
}
