'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ChatMessage, TypingPayload, ContentType } from '../types'

const PAGE_SIZE = 50

interface UseChatOptions {
  channelId: string
  userId: string
  userName: string
}

export function useChat({ channelId, userId, userName }: UseChatOptions) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const loadMessages = useCallback(async (before?: string) => {
    let query = supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles!chat_messages_sender_profile_fkey(id, name, email, avatar_url, role, department)
      `)
      .eq('channel_id', channelId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (before) {
      query = query.lt('created_at', before)
    }

    const { data, error } = await query

    if (error) {
      console.error('[useChat] Load error:', error)
      // Fallback: load without FK join
      const { data: fallbackData } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE)

      if (fallbackData) {
        const userIds = [...new Set(fallbackData.map(m => m.sender_id))]
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar_url')
          .in('id', userIds)
        const profileMap = new Map(profiles?.map(p => [p.id, p]) ?? [])

        const enriched = fallbackData.map(m => ({
          ...m,
          sender: profileMap.get(m.sender_id) || null,
          sender_name: profileMap.get(m.sender_id)?.name ?? 'Usuário',
          sender_avatar: profileMap.get(m.sender_id)?.avatar_url ?? null,
        }))

        const reversed = enriched.reverse()
        if (before) {
          setMessages((prev) => [...reversed, ...prev])
        } else {
          setMessages(reversed as ChatMessage[])
        }
        setHasMore((fallbackData?.length || 0) === PAGE_SIZE)
        setLoading(false)
      }
      return
    }

    const reversed = (data || []).reverse()
    if (before) {
      setMessages((prev) => [...reversed, ...prev])
    } else {
      setMessages(reversed as ChatMessage[])
    }
    setHasMore((data?.length || 0) === PAGE_SIZE)
    setLoading(false)
  }, [channelId, supabase])

  const loadMore = useCallback(async () => {
    if (!hasMore || messages.length === 0) return
    await loadMessages(messages[0].created_at)
  }, [hasMore, messages, loadMessages])

  const sendMessage = useCallback(async (
    content: string,
    contentType: ContentType = 'text',
    options?: {
      replyTo?: string
      attachments?: unknown[]
      entityType?: string
      entityId?: string
      mentions?: string[]
    }
  ) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        sender_id: userId,
        content,
        content_type: contentType,
        reply_to: options?.replyTo || null,
        attachments: options?.attachments || [],
        entity_type: options?.entityType || null,
        entity_id: options?.entityId || null,
        mentions: options?.mentions || [],
      })
      .select()
      .single()

    if (error) {
      console.error('[useChat] Send error:', error)
      return { error }
    }

    return { data }
  }, [channelId, userId, supabase])

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ content: newContent, is_edited: true, edited_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('sender_id', userId)

    if (!error) {
      setMessages((prev) =>
        prev.map((m) => m.id === messageId ? { ...m, content: newContent, is_edited: true } : m)
      )
    }
    return { error }
  }, [userId, supabase])

  const deleteMessage = useCallback(async (messageId: string) => {
    const { error } = await supabase
      .from('chat_messages')
      .update({ is_deleted: true })
      .eq('id', messageId)
      .eq('sender_id', userId)

    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }
    return { error }
  }, [userId, supabase])

  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    const msg = messages.find((m) => m.id === messageId)
    if (!msg) return

    const reactions = { ...msg.reactions }
    if (reactions[emoji]?.includes(userId)) {
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId)
      if (reactions[emoji].length === 0) delete reactions[emoji]
    } else {
      reactions[emoji] = [...(reactions[emoji] || []), userId]
    }

    await supabase.from('chat_messages').update({ reactions }).eq('id', messageId)
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)))
  }, [messages, userId, supabase])

  const sendTyping = useCallback(() => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: userId, name: userName, channel_id: channelId },
    })
  }, [channelId, userId, userName])

  const markAsRead = useCallback(async () => {
    await supabase.rpc('mark_channel_read', {
      p_channel_id: channelId,
      p_user_id: userId,
    })
  }, [channelId, userId, supabase])

  useEffect(() => {
    if (!channelId) return

    loadMessages()

    const channel = supabase
      .channel(`chat:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`,
      }, async (payload) => {
        const { data } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('id', payload.new.id)
          .single()

        if (data) {
          // Enrich with profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_url, role, department')
            .eq('id', data.sender_id)
            .single()

          // Clear typing indicator for the sender (they sent a message, so they're no longer typing)
          setTypingUsers((prev) => {
            if (!prev.has(data.sender_id)) return prev
            const next = new Map(prev)
            next.delete(data.sender_id)
            return next
          })
          const existingTimer = typingTimersRef.current.get(data.sender_id)
          if (existingTimer) {
            clearTimeout(existingTimer)
            typingTimersRef.current.delete(data.sender_id)
          }

          const enriched = { ...data, sender: profile || null }
          setMessages((prev) => {
            if (prev.some((m) => m.id === enriched.id)) return prev
            return [...prev, enriched as ChatMessage]
          })
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === payload.new.id ? { ...m, ...payload.new } : m))
        )
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: TypingPayload }) => {
        if (payload.user_id === userId) return
        setTypingUsers((prev) => {
          const next = new Map(prev)
          next.set(payload.user_id, payload.name)
          return next
        })
        const existing = typingTimersRef.current.get(payload.user_id)
        if (existing) clearTimeout(existing)
        typingTimersRef.current.set(
          payload.user_id,
          setTimeout(() => {
            setTypingUsers((prev) => {
              const next = new Map(prev)
              next.delete(payload.user_id)
              return next
            })
          }, 3000)
        )
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      typingTimersRef.current.forEach((t) => clearTimeout(t))
      typingTimersRef.current.clear()
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [channelId, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    messages,
    typingUsers: Array.from(typingUsers.values()),
    loading,
    hasMore,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    sendTyping,
    markAsRead,
  }
}

export default useChat
