'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChannelWithDetails, ChannelType, ChatChannel, ChatMember, Profile } from '../types'

interface UseChannelsOptions {
  userId: string
}

export function useChannels({ userId }: UseChannelsOptions) {
  const supabase = createClient()
  const [channels, setChannels] = useState<ChannelWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const loadChannels = useCallback(async () => {
    const { data, error } = await supabase
      .from('chat_members')
      .select(`
        *,
        channel:chat_channels(*)
      `)
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('[useChannels] Load error:', error)
      setLoading(false)
      return
    }

    const channelsWithDetails: ChannelWithDetails[] = await Promise.all(
      (data || []).map(async (membership) => {
        const ch = membership.channel as ChatChannel

        const { data: members } = await supabase
          .from('chat_members')
          .select(`
            *,
            profile:profiles(id, name, email, avatar_url, role, department)
          `)
          .eq('channel_id', ch.id)

        let otherUser: Profile | undefined
        if (ch.type === 'direct' && members) {
          const other = members.find((m) => m.user_id !== userId)
          otherUser = other?.profile as Profile | undefined
        }

        return {
          ...ch,
          members: (members as ChatMember[]) || [],
          my_membership: membership as ChatMember,
          other_user: otherUser,
          total_unread: membership.unread_count || 0,
        }
      })
    )

    channelsWithDetails.sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1
      if (!a.is_pinned && b.is_pinned) return 1
      const aTime = a.last_message_at || a.created_at
      const bTime = b.last_message_at || b.created_at
      return new Date(bTime).getTime() - new Date(aTime).getTime()
    })

    setChannels(channelsWithDetails)
    setLoading(false)
  }, [userId, supabase])

  const createChannel = useCallback(async (
    type: ChannelType,
    name: string,
    memberIds: string[],
    options?: { description?: string; developmentId?: string; leadId?: string }
  ) => {
    const { data: channel, error } = await supabase
      .from('chat_channels')
      .insert({
        type,
        name,
        description: options?.description || null,
        development_id: options?.developmentId || null,
        lead_id: options?.leadId || null,
        created_by: userId,
      })
      .select()
      .single()

    if (error || !channel) {
      console.error('[useChannels] Create error:', error)
      return { error }
    }

    const allMembers = [userId, ...memberIds.filter((id) => id !== userId)]
    await supabase.from('chat_members').insert(
      allMembers.map((uid, i) => ({
        channel_id: channel.id,
        user_id: uid,
        role: i === 0 ? 'admin' : 'member',
      }))
    )

    await supabase.from('chat_messages').insert({
      channel_id: channel.id,
      sender_id: userId,
      content: `Canal "${name}" criado`,
      content_type: 'system',
    })

    await loadChannels()
    return { data: channel }
  }, [userId, supabase, loadChannels])

  const openDM = useCallback(async (otherUserId: string) => {
    const { data, error } = await supabase.rpc('get_or_create_dm', {
      user_a: userId,
      user_b: otherUserId,
    })

    if (error) {
      console.error('[useChannels] DM error:', error)
      return { error }
    }

    await loadChannels()
    return { channelId: data as string }
  }, [userId, supabase, loadChannels])

  const joinChannel = useCallback(async (channelId: string) => {
    const { error } = await supabase
      .from('chat_members')
      .insert({ channel_id: channelId, user_id: userId, role: 'member' })
    if (!error) await loadChannels()
    return { error }
  }, [userId, supabase, loadChannels])

  const leaveChannel = useCallback(async (channelId: string) => {
    const { error } = await supabase
      .from('chat_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId)
    if (!error) setChannels((prev) => prev.filter((c) => c.id !== channelId))
    return { error }
  }, [userId, supabase])

  const archiveChannel = useCallback(async (channelId: string) => {
    const { error } = await supabase
      .from('chat_channels')
      .update({ is_archived: true })
      .eq('id', channelId)
    if (!error) await loadChannels()
    return { error }
  }, [supabase, loadChannels])

  const togglePin = useCallback(async (channelId: string) => {
    const ch = channels.find((c) => c.id === channelId)
    if (!ch?.my_membership) return
    const { error } = await supabase
      .from('chat_members')
      .update({ is_pinned: !ch.my_membership.is_pinned })
      .eq('channel_id', channelId)
      .eq('user_id', userId)
    if (!error) await loadChannels()
    return { error }
  }, [channels, userId, supabase, loadChannels])

  const totalUnread = channels.reduce((sum, c) => sum + c.total_unread, 0)

  useEffect(() => {
    if (!userId) return

    loadChannels()

    const channel = supabase
      .channel('channel-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_channels' }, () => loadChannels())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_members', filter: `user_id=eq.${userId}` }, () => loadChannels())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    channels,
    loading,
    totalUnread,
    createChannel,
    openDM,
    joinChannel,
    leaveChannel,
    archiveChannel,
    togglePin,
    reload: loadChannels,
    teamChannels: channels.filter((c) => c.type === 'team'),
    directMessages: channels.filter((c) => c.type === 'direct'),
    dealRooms: channels.filter((c) => c.type === 'deal_room'),
  }
}

export default useChannels
