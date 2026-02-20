'use client'
// ============================================
// HOOK: useWhatsapp
// ⚠️ CONECTA COM AS TABELAS DO SCRIPT 010_whatsapp_email.sql
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface WhatsappConversation {
    id: string
    lead_id?: string
    phone_number: string
    contact_name: string
    status: 'active' | 'closed' | 'archived'
    last_message_at: string
    last_message_preview: string
    unread_count: number
    metadata: any
    created_at: string
    updated_at: string
}

export interface WhatsappMessage {
    id: string
    conversation_id: string
    direction: 'inbound' | 'outbound'
    message_type: 'text' | 'image' | 'video' | 'document' | 'template' | 'audio'
    content: string
    media_url?: string
    template_name?: string
    template_params?: any
    status: 'sent' | 'delivered' | 'read' | 'failed'
    external_id?: string
    error_message?: string
    sent_by?: string
    created_at: string
}

export function useWhatsapp(tenantId: string) {
    const [conversations, setConversations] = useState<WhatsappConversation[]>([])
    const [activeConversation, setActiveConversation] = useState<WhatsappConversation | null>(null)
    const [messages, setMessages] = useState<WhatsappMessage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // ── Fetch Inicial de Conversas ──────────────────────────────────────────
    const fetchConversations = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('whatsapp_conversations')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('last_message_at', { ascending: false })

            if (error) throw error
            setConversations(data || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [tenantId])

    // ── Fetch Mensagens de uma Conversa ──────────────────────────────────────
    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            const { data, error } = await supabase
                .from('whatsapp_messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setMessages(data || [])
        } catch (err: any) {
            setError(err.message)
        }
    }, [])

    // ── Enviar Mensagem ───────────────────────────────────────────────────────
    const sendMessage = async (
        conversationId: string,
        content: string,
        type: WhatsappMessage['message_type'] = 'text'
    ) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            const { data, error } = await supabase
                .from('whatsapp_messages')
                .insert({
                    conversation_id: conversationId,
                    direction: 'outbound',
                    message_type: type,
                    content,
                    sent_by: user?.id,
                    status: 'sent'
                })
                .select()
                .single()

            if (error) throw error

            // Update local state if needed (usually handled by subscription)
            return { success: true, data }
        } catch (err: any) {
            return { success: false, error: err.message }
        }
    }

    // ── Realtime Subscriptions ────────────────────────────────────────────────
    useEffect(() => {
        if (!tenantId) return

        fetchConversations()

        const channel = supabase
            .channel('whatsapp_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'whatsapp_conversations', filter: `tenant_id=eq.${tenantId}` },
                () => fetchConversations()
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
                (payload) => {
                    const newMsg = payload.new as WhatsappMessage;
                    if (activeConversation && newMsg.conversation_id === activeConversation.id) {
                        setMessages(prev => [...prev, newMsg])
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [tenantId, fetchConversations, activeConversation])

    // ── Selecionar Conversa Ativa ──────────────────────────────────────────────
    const selectConversation = (conv: WhatsappConversation) => {
        setActiveConversation(conv)
        fetchMessages(conv.id)
    }

    return {
        conversations,
        activeConversation,
        messages,
        loading,
        error,
        sendMessage,
        selectConversation,
        refresh: fetchConversations
    }
}
