'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChatChannel } from '../types'

export function useChannels(userId: string | null) {
    const supabase = createClient()
    const [channels, setChannels] = useState<(ChatChannel & { unread_count: number })[]>([])
    const [loading, setLoading] = useState(true)
    const [totalUnread, setTotalUnread] = useState(0)

    const loadChannels = useCallback(async () => {
        if (!userId) return
        setLoading(true)

        // Get channels where user is a member
        const { data: memberships } = await supabase
            .from('chat_members')
            .select('channel_id, unread_count')
            .eq('user_id', userId)

        if (!memberships?.length) {
            setChannels([])
            setLoading(false)
            return
        }

        const channelIds = memberships.map(m => m.channel_id)
        const unreadMap = new Map(memberships.map(m => [m.channel_id, m.unread_count]))

        const { data: channelData } = await supabase
            .from('chat_channels')
            .select('*')
            .in('id', channelIds)
            .eq('is_archived', false)
            .order('last_message_at', { ascending: false, nullsFirst: false })

        if (channelData) {
            const enriched = channelData.map(ch => ({
                ...ch,
                unread_count: unreadMap.get(ch.id) ?? 0,
            }))
            setChannels(enriched)
            setTotalUnread(enriched.reduce((sum, ch) => sum + ch.unread_count, 0))
        }

        setLoading(false)
    }, [userId, supabase])

    useEffect(() => {
        loadChannels()
    }, [loadChannels])

    // Create a new channel
    const createChannel = useCallback(async (opts: {
        type: string
        name: string
        description?: string
        memberIds?: string[]
    }) => {
        if (!userId) return null

        const { data: channel, error } = await supabase
            .from('chat_channels')
            .insert({
                type: opts.type,
                name: opts.name,
                description: opts.description ?? null,
                created_by: userId,
            })
            .select()
            .single()

        if (error || !channel) return null

        // Add creator as admin
        await supabase.from('chat_members').insert({
            channel_id: channel.id,
            user_id: userId,
            role: 'admin',
        })

        // Add other members
        if (opts.memberIds?.length) {
            await supabase.from('chat_members').insert(
                opts.memberIds.map(uid => ({
                    channel_id: channel.id,
                    user_id: uid,
                    role: 'member' as const,
                }))
            )
        }

        // System message
        await supabase.from('chat_messages').insert({
            channel_id: channel.id,
            sender_id: userId,
            content: `Canal "${opts.name}" criado`,
            content_type: 'system',
        })

        await loadChannels()
        return channel
    }, [userId, supabase, loadChannels])

    return { channels, loading, totalUnread, reload: loadChannels, createChannel }
}
