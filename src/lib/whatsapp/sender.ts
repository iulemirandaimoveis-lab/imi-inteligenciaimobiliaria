import { createClient } from '@/lib/supabase/server';
interface SendWhatsAppParams {
    tenant_id: string;
    phone_number: string;
    message: string;
    template_name?: string;
    template_params?: Record<string, string>;
    lead_id?: string;
}
interface WhatsAppResult {
    success: boolean;
    message_id?: string;
    error?: string;
}
/**
 * Envia mensagem WhatsApp via Cloud API (Meta)
 * Requer WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<WhatsAppResult> {
    const { tenant_id, phone_number, message, template_name, template_params, lead_id } = params;
    const supabase = await createClient();
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    if (!phoneNumberId || !accessToken) {
        return {
            success: false,
            error: 'WhatsApp credentials not configured',
        };
    }
    try {
        // Busca ou cria conversa
        let { data: conversation } = await supabase
            .from('whatsapp_conversations')
            .select('id')
            .eq('tenant_id', tenant_id)
            .eq('phone_number', phone_number)
            .single();
        if (!conversation) {
            const { data: newConversation } = await supabase
                .from('whatsapp_conversations')
                .insert({
                    tenant_id,
                    phone_number,
                    lead_id,
                    status: 'active',
                })
                .select('id')
                .single();
            conversation = newConversation;
        }
        if (!conversation) {
            throw new Error('Failed to create conversation');
        }
        // Prepara payload
        const payload: any = {
            messaging_product: 'whatsapp',
            to: phone_number.replace(/\D/g, ''), // Remove caracteres não numéricos
        };
        if (template_name) {
            // Mensagem template
            payload.type = 'template';
            payload.template = {
                name: template_name,
                language: { code: 'pt_BR' },
                components: template_params
                    ? [
                        {
                            type: 'body',
                            parameters: Object.values(template_params).map((value) => ({
                                type: 'text',
                                text: value,
                            })),
                        },
                    ]
                    : [],
            };
        } else {
            // Mensagem texto simples
            payload.type = 'text';
            payload.text = { body: message };
        }
        // Envia via API
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            }
        );
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error?.message || 'WhatsApp API error');
        }
        // Salva mensagem no banco
        await supabase.from('whatsapp_messages').insert({
            conversation_id: conversation.id,
            direction: 'outbound',
            message_type: template_name ? 'template' : 'text',
            content: message,
            template_name,
            template_params,
            status: 'sent',
            external_id: result.messages?.[0]?.id,
        });
        // Atualiza conversa
        await supabase
            .from('whatsapp_conversations')
            .update({
                last_message_at: new Date().toISOString(),
                last_message_preview: message.substring(0, 100),
            })
            .eq('id', conversation.id);
        return {
            success: true,
            message_id: result.messages?.[0]?.id,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Processa webhook do WhatsApp (mensagens recebidas)
 */
export async function processWhatsAppWebhook(payload: any) {
    const supabase = await createClient();
    try {
        const entry = payload.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        if (!value?.messages) return;
        for (const message of value.messages) {
            const from = message.from;
            const messageType = message.type;
            const content = message.text?.body || message.caption || '';
            // Busca conversa
            const { data: conversation } = await supabase
                .from('whatsapp_conversations')
                .select('id, tenant_id')
                .eq('phone_number', from)
                .single();
            if (!conversation) continue;
            // Salva mensagem
            await supabase.from('whatsapp_messages').insert({
                conversation_id: conversation.id,
                direction: 'inbound',
                message_type: messageType,
                content,
                external_id: message.id,
                status: 'delivered',
            });
            // Atualiza conversa
            // Primeiro busca contador atual
            const { data: currentConv } = await supabase
                .from('whatsapp_conversations')
                .select('unread_count')
                .eq('id', conversation.id)
                .single();
            await supabase
                .from('whatsapp_conversations')
                .update({
                    last_message_at: new Date().toISOString(),
                    last_message_preview: content.substring(0, 100),
                    unread_count: (currentConv?.unread_count || 0) + 1,
                })
                .eq('id', conversation.id);
            // Verifica auto-responses
            await checkAutoResponses(conversation.tenant_id, conversation.id, content);
        }
    } catch (error) {
    }
}
/**
 * Verifica e envia auto-responses
 */
async function checkAutoResponses(
    tenant_id: string,
    conversation_id: string,
    message: string
) {
    const supabase = await createClient();
    const { data: autoResponses } = await supabase
        .from('whatsapp_auto_responses')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('is_active', true)
        .order('priority', { ascending: false });
    if (!autoResponses) return;
    const messageLower = message.toLowerCase();
    for (const autoResponse of autoResponses) {
        if (messageLower.includes(autoResponse.trigger_keyword.toLowerCase())) {
            // Envia resposta automática
            await supabase.from('whatsapp_messages').insert({
                conversation_id,
                direction: 'outbound',
                message_type: 'text',
                content: autoResponse.response_template,
                status: 'sent',
            });
            break; // Apenas primeira resposta
        }
    }
}
