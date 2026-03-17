// IMI Connect — Types

export type ChannelType = 'deal_room' | 'team' | 'direct' | 'group' | 'property' | 'announcement'
export type ContentType = 'text' | 'image' | 'file' | 'property_card' | 'lead_card' | 'proposal_card' | 'system' | 'ai_summary'
export type MemberRole = 'admin' | 'moderator' | 'member' | 'readonly'
export type NotifyMode = 'all' | 'mentions' | 'none'

export interface ChatChannel {
    id: string
    type: ChannelType
    name: string | null
    description: string | null
    avatar_url: string | null
    development_id: string | null
    lead_id: string | null
    proposal_id: string | null
    contrato_id: string | null
    is_archived: boolean
    is_pinned: boolean
    is_muted: boolean
    auto_created: boolean
    last_message_at: string | null
    last_message_preview: string | null
    message_count: number
    created_by: string | null
    created_at: string
    updated_at: string
}

export interface ChatMember {
    id: string
    channel_id: string
    user_id: string
    role: MemberRole
    is_muted: boolean
    is_pinned: boolean
    last_read_at: string
    unread_count: number
    notify_mode: NotifyMode
    joined_at: string
    // Joined from profiles
    name?: string
    avatar_url?: string
    email?: string
}

export interface ChatMessage {
    id: string
    channel_id: string
    sender_id: string
    content: string | null
    content_type: ContentType
    attachments: Array<{ url: string; name: string; size: number; type: string }>
    entity_type: string | null
    entity_id: string | null
    reply_to: string | null
    thread_count: number
    mentions: string[]
    is_edited: boolean
    is_deleted: boolean
    edited_at: string | null
    reactions: Record<string, string[]>
    created_at: string
    // Joined from profiles
    sender_name?: string
    sender_avatar?: string
}

export interface PresenceUser {
    user_id: string
    name: string
    avatar_url: string | null
    online_at: string
}
