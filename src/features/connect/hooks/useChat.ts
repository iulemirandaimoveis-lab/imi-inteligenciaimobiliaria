'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatMessage, PresenceUser } from '../types'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function useChat(channelId: string | null, currentUser: { id: string; name: string; avatar_url?: string }) {
    const supabase = createClient()
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([])
    const [typingUsers, setTypingUsers] = useState<string[]>([])
    const channelRef = useRef<RealtimeChannel | null>(null)

    // Load messages from DB
    const loadMessages = useCallback(async () => {
        if (!channelId) return
        setLoading(true)

        const { data } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('channel_id', channelId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true })
            .limit(100)

        if (data) {
            // Enrich with sender info
            const userIds = [...new Set(data.map(m => m.sender_id))]
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .in('id', userIds)

            const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])

            setMessages(data.map(m => ({
                ...m,
                sender_name: profileMap.get(m.sender_id)?.name ?? 'Usuário',
                sender_avatar: profileMap.get(m.sender_id)?.avatar_url ?? null,
            })))
        }
        setLoading(false)
    }, [channelId, supabase])

    // Subscribe to realtime
    useEffect(() => {
        if (!channelId) return

        loadMessages()

        const realtimeChannel = supabase
            .channel(`chat:${channelId}`, { config: { private: true } })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `channel_id=eq.${channelId}`
            }, async (payload) => {
                const msg = payload.new as ChatMessage
                // Enrich with sender info
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('name, avatar_url')
                    .eq('id', msg.sender_id)
                    .single()

                setMessages(prev => [...prev, {
                    ...msg,
                    sender_name: profile?.name ?? 'Usuário',
                    sender_avatar: profile?.avatar_url ?? null,
                }])
            })
            .on('presence', { event: 'sync' }, () => {
                const state = realtimeChannel.presenceState()
                setOnlineUsers(Object.values(state).flat() as unknown as PresenceUser[])
            })
            .on('broadcast', { event: 'typing' }, ({ payload }) => {
                if (payload.user_id === currentUser.id) return
                setTypingUsers(prev => {
                    if (prev.includes(payload.name)) return prev
                    return [...prev, payload.name]
                })
                setTimeout(() => {
                    setTypingUsers(prev => prev.filter(n => n !== payload.name))
                }, 3000)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await realtimeChannel.track({
                        user_id: currentUser.id,
                        name: currentUser.name,
                        avatar_url: currentUser.avatar_url ?? null,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        channelRef.current = realtimeChannel

        return () => {
            supabase.removeChannel(realtimeChannel)
            channelRef.current = null
        }
    }, [channelId, currentUser.id])

    // Send message
    const sendMessage = useCallback(async (content: string, contentType: string = 'text') => {
        if (!channelId || !content.trim()) return null

        const { data, error } = await supabase
            .from('chat_messages')
            .insert({
                channel_id: channelId,
                sender_id: currentUser.id,
                content: content.trim(),
                content_type: contentType,
            })
            .select()
            .single()

        return { data, error }
    }, [channelId, currentUser.id, supabase])

    // Broadcast typing
    const sendTyping = useCallback(() => {
        channelRef.current?.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: currentUser.id, name: currentUser.name },
        })
    }, [currentUser.id, currentUser.name])

    // Mark as read
    const markAsRead = useCallback(async () => {
        if (!channelId || messages.length === 0) return
        const lastMsg = messages[messages.length - 1]

        await supabase.from('chat_read_receipts').upsert({
            channel_id: channelId,
            user_id: currentUser.id,
            last_read_message_id: lastMsg.id,
            last_read_at: new Date().toISOString(),
        })

        await supabase.from('chat_members').update({
            unread_count: 0,
            last_read_at: new Date().toISOString(),
        }).eq('channel_id', channelId).eq('user_id', currentUser.id)
    }, [channelId, currentUser.id, messages, supabase])

    return {
        messages,
        loading,
        onlineUsers,
        typingUsers,
        sendMessage,
        sendTyping,
        markAsRead,
        reload: loadMessages,
    }
}
