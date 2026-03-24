-- ============================================================================
-- Migration 010: WhatsApp Business + Email Sequences
-- Descrição: Automação completa de comunicação
-- Data: 2026-02-08
-- ============================================================================

-- ============================================================================
-- TABELA: whatsapp_conversations
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    
    phone_number TEXT NOT NULL,
    contact_name TEXT,
    
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    unread_count INT DEFAULT 0,
    
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_conversations_tenant ON whatsapp_conversations(tenant_id);
CREATE INDEX idx_whatsapp_conversations_lead ON whatsapp_conversations(lead_id);
CREATE INDEX idx_whatsapp_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX idx_whatsapp_conversations_status ON whatsapp_conversations(status);

-- ============================================================================
-- TABELA: whatsapp_messages
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'document', 'template', 'audio')),
    
    content TEXT,
    media_url TEXT,
    template_name TEXT,
    template_params JSONB,
    
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    external_id TEXT,
    error_message TEXT,
    
    sent_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX idx_whatsapp_messages_direction ON whatsapp_messages(direction);

-- ============================================================================
-- TABELA: whatsapp_auto_responses
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_auto_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    trigger_keyword TEXT NOT NULL,
    response_template TEXT NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    priority INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_auto_responses_tenant ON whatsapp_auto_responses(tenant_id);

-- ============================================================================
-- TABELA: email_sequences
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    trigger_condition TEXT NOT NULL, -- lead_created, lead_qualified, no_response_7days
    
    emails JSONB NOT NULL, -- Array de {subject, body_html, delay_hours}
    
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_sequences_tenant ON email_sequences(tenant_id);
CREATE INDEX idx_email_sequences_active ON email_sequences(is_active);

-- ============================================================================
-- TABELA: email_sequence_enrollments
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_sequence_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    
    current_step INT DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_email_sent_at TIMESTAMPTZ,
    
    UNIQUE(sequence_id, lead_id)
);

CREATE INDEX idx_email_enrollments_sequence ON email_sequence_enrollments(sequence_id);
CREATE INDEX idx_email_enrollments_lead ON email_sequence_enrollments(lead_id);
CREATE INDEX idx_email_enrollments_status ON email_sequence_enrollments(status);

-- ============================================================================
-- TABELA: email_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    enrollment_id UUID REFERENCES email_sequence_enrollments(id) ON DELETE SET NULL,
    
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body_html TEXT,
    
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
    external_id TEXT,
    error_message TEXT,
    
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ
);

CREATE INDEX idx_email_logs_tenant ON email_logs(tenant_id);
CREATE INDEX idx_email_logs_lead ON email_logs(lead_id);
CREATE INDEX idx_email_logs_enrollment ON email_logs(enrollment_id);
CREATE INDEX idx_email_logs_sent ON email_logs(sent_at DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_auto_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- WhatsApp
CREATE POLICY "Users can view whatsapp_conversations from their tenants"
    ON whatsapp_conversations FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage whatsapp_conversations from their tenants"
    ON whatsapp_conversations FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can view whatsapp_messages from their conversations"
    ON whatsapp_messages FOR SELECT
    USING (conversation_id IN (
        SELECT id FROM whatsapp_conversations WHERE tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage whatsapp_messages from their conversations"
    ON whatsapp_messages FOR ALL
    USING (conversation_id IN (
        SELECT id FROM whatsapp_conversations WHERE tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    ));

-- Auto Responses
CREATE POLICY "Users can view whatsapp_auto_responses from their tenants"
    ON whatsapp_auto_responses FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage whatsapp_auto_responses from their tenants"
    ON whatsapp_auto_responses FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- Email Sequences
CREATE POLICY "Users can view email_sequences from their tenants"
    ON email_sequences FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage email_sequences from their tenants"
    ON email_sequences FOR ALL
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can view email_sequence_enrollments from their sequences"
    ON email_sequence_enrollments FOR SELECT
    USING (sequence_id IN (
        SELECT id FROM email_sequences WHERE tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    ));

CREATE POLICY "Users can manage email_sequence_enrollments from their sequences"
    ON email_sequence_enrollments FOR ALL
    USING (sequence_id IN (
        SELECT id FROM email_sequences WHERE tenant_id IN (
            SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()
        )
    ));

-- Email Logs
CREATE POLICY "Users can view email_logs from their tenants"
    ON email_logs FOR SELECT
    USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER whatsapp_conversations_updated_at BEFORE UPDATE ON whatsapp_conversations
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

CREATE TRIGGER whatsapp_auto_responses_updated_at BEFORE UPDATE ON whatsapp_auto_responses
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

CREATE TRIGGER email_sequences_updated_at BEFORE UPDATE ON email_sequences
    FOR EACH ROW EXECUTE FUNCTION update_ads_updated_at();

-- ============================================================================
-- FIM DA MIGRATION 010
-- ============================================================================
