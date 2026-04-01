// IMI Connect — Type Definitions

export type ChannelType = 'deal_room' | 'team' | 'direct' | 'group' | 'property' | 'announcement' | 'partnership'
export type MemberRole = 'admin' | 'moderator' | 'member' | 'readonly'
export type ContentType = 'text' | 'image' | 'file' | 'voice' | 'property_card' | 'lead_card' | 'proposal_card' | 'system' | 'ai_summary' | 'nudge'
export type NotifyMode = 'all' | 'mentions' | 'none'
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline'

export interface Profile {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  department: string | null
  job_title: string | null
  is_active: boolean
  last_seen_at: string | null
}

export interface ChatChannel {
  id: string
  type: ChannelType
  name: string | null
  description: string | null
  avatar_url: string | null
  development_id: string | null
  lead_id: string | null
  proposal_id: string | null
  is_archived: boolean
  is_pinned: boolean
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
  profile?: Profile
}

export interface ChatMessage {
  id: string
  channel_id: string
  sender_id: string
  content: string | null
  content_type: ContentType
  attachments: Attachment[]
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
  sender?: Profile
  // Legacy compat
  sender_name?: string
  sender_avatar?: string
}

export interface Attachment {
  url: string
  name: string
  size: number
  type: string
}

export interface UserPresence {
  user_id: string
  status: PresenceStatus
  status_message: string | null
  last_seen_at: string
  updated_at: string
  profile?: Profile
}

export interface PresenceState {
  user_id: string
  name: string
  avatar_url: string | null
  status: PresenceStatus
  status_message: string | null
  online_at: string
}

export interface TypingPayload {
  user_id: string
  name: string
  channel_id: string
}

export interface ChannelWithDetails extends ChatChannel {
  members: ChatMember[]
  my_membership?: ChatMember
  other_user?: Profile
  total_unread: number
}

export type SoundEvent = 'online' | 'offline' | 'away' | 'busy' | 'message' | 'nudge' | 'mention'

export interface PresenceUser {
  user_id: string
  name: string
  avatar_url: string | null
  online_at: string
}
