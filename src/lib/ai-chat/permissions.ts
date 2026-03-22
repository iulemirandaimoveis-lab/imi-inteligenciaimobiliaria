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
    // 1. Global config
    const { data: globalConfig } = await supabase
        .from('ai_chat_config')
        .select('*')
        .single()

    if (!globalConfig?.feature_enabled) {
        return { chatEnabled: false, allowedModels: [], dailyTokenLimit: 0, maxConversationsPerDay: 0, canUseToolActions: false, canViewHistory: false, canExportConversations: false }
    }

    // 2. Role permissions
    const { data: rolePerms } = await supabase
        .from('ai_chat_role_permissions')
        .select('*')
        .eq('role', userRole)
        .single()

    // 3. User overrides
    const { data: userOverride } = await supabase
        .from('ai_chat_user_overrides')
        .select('*')
        .eq('user_id', userId)
        .single()

    // Resolve cascade: override > role > default
    const base: AIPermissions = {
        chatEnabled: rolePerms?.chat_enabled ?? false,
        allowedModels: rolePerms?.allowed_models ?? ['claude-haiku-4-5-20251001'],
        dailyTokenLimit: rolePerms?.daily_token_limit ?? 50000,
        maxConversationsPerDay: rolePerms?.max_conversations_per_day ?? 20,
        canUseToolActions: rolePerms?.can_use_tool_actions ?? false,
        canViewHistory: rolePerms?.can_view_history ?? true,
        canExportConversations: rolePerms?.can_export_conversations ?? false,
    }

    if (userOverride) {
        if (userOverride.chat_enabled !== null) base.chatEnabled = userOverride.chat_enabled
        if (userOverride.allowed_models !== null) base.allowedModels = userOverride.allowed_models
        if (userOverride.daily_token_limit !== null) base.dailyTokenLimit = userOverride.daily_token_limit
        if (userOverride.max_conversations_per_day !== null) base.maxConversationsPerDay = userOverride.max_conversations_per_day
        if (userOverride.can_use_tool_actions !== null) base.canUseToolActions = userOverride.can_use_tool_actions
    }

    // Filter by global allowed models
    if (globalConfig.allowed_models) {
        base.allowedModels = base.allowedModels.filter((m: string) => globalConfig.allowed_models.includes(m))
    }

    return base
}
