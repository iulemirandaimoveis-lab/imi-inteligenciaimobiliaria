// src/types/crm.ts
// IMI - Inteligência Imobiliária
// Tipos centrais para o módulo WhatsApp + CRM + Qualificação IA

// ============================================================
// ENUMS
// ============================================================

export type LeadPipelineStage =
  | "novo"
  | "contato_inicial"
  | "qualificado"
  | "apresentacao"
  | "proposta"
  | "negociacao"
  | "fechado_ganho"
  | "fechado_perdido"
  | "nurturing"

export type LeadSource =
  | "whatsapp_organico"
  | "whatsapp_ads"
  | "site_formulario"
  | "site_tracking"
  | "instagram"
  | "facebook"
  | "linkedin"
  | "indicacao"
  | "portais"
  | "telefone"
  | "email"
  | "evento"
  | "qr_code"
  | "outro"

export type LeadTemperature = "frio" | "morno" | "quente" | "urgente"

export type MessageDirection = "inbound" | "outbound"

export type MessageContentType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "location"
  | "contact"
  | "sticker"
  | "reaction"
  | "template"

export type WhatsAppMessageStatus =
  | "sent"
  | "delivered"
  | "read"
  | "received"
  | "failed"

export type WhatsAppInstanceStatus =
  | "connected"
  | "disconnected"
  | "qr_pending"

// ============================================================
// DATABASE MODELS
// ============================================================

export interface Lead {
  id: string
  name: string | null
  email: string | null
  phone: string
  phone_normalized: string | null
  avatar_url: string | null

  // Classificação
  source: LeadSource
  pipeline_stage: LeadPipelineStage
  temperature: LeadTemperature

  // Score IA
  score: number
  score_breakdown: ScoreBreakdown
  last_scored_at: string | null

  // Qualificação IA
  ai_qualification_summary: string | null
  ai_suggested_action: string | null
  ai_profile_type: string | null
  ai_budget_range: string | null
  ai_regions_interest: string[]
  ai_property_types: string[]
  ai_urgency_level: number
  ai_objections: string[]
  ai_sentiment: string | null

  // Comercial
  assigned_to: string | null
  tags: string[]
  custom_fields: Record<string, any>
  interested_properties: string[]

  // Tracking
  first_contact_at: string | null
  last_contact_at: string | null
  last_message_at: string | null
  total_messages: number
  total_inbound_messages: number
  total_outbound_messages: number
  response_time_avg_seconds: number | null
  days_in_pipeline: number

  // Follow-up
  next_followup_at: string | null
  followup_count: number
  last_followup_at: string | null

  // WhatsApp
  whatsapp_jid: string | null
  whatsapp_instance_id: string | null

  // Conversão
  converted_at: string | null
  conversion_value: number | null
  lost_reason: string | null

  // Metadata
  notes: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface WhatsAppInstance {
  id: string
  instance_name: string
  instance_id: string | null
  phone_number: string | null
  status: WhatsAppInstanceStatus
  qr_code: string | null
  evolution_api_url: string
  evolution_api_key: string
  webhook_url: string | null
  is_default: boolean
  session_data: Record<string, any>
  created_at: string
  updated_at: string
  // Virtual
  live_status?: string
}

export interface WhatsAppMessage {
  id: string
  lead_id: string
  instance_id: string | null
  remote_jid: string
  message_id: string | null
  direction: MessageDirection
  content_type: MessageContentType
  body: string | null
  media_url: string | null
  media_mimetype: string | null
  media_caption: string | null
  status: WhatsAppMessageStatus
  is_ai_generated: boolean
  ai_model_used: string | null
  ai_intent_detected: string | null
  ai_entities_extracted: Record<string, any>
  quoted_message_id: string | null
  context: Record<string, any>
  created_at: string
  updated_at: string
}

export interface LeadActivity {
  id: string
  lead_id: string
  activity_type: string
  title: string
  description: string | null
  metadata: Record<string, any>
  performed_by: string
  created_at: string
}

export interface LeadScoreHistory {
  id: string
  lead_id: string
  score: number
  previous_score: number | null
  breakdown: ScoreBreakdown
  trigger_event: string
  ai_reasoning: string | null
  created_at: string
}

export interface PipelineStageHistory {
  id: string
  lead_id: string
  from_stage: LeadPipelineStage | null
  to_stage: LeadPipelineStage
  moved_by: string
  reason: string | null
  created_at: string
}

export interface WhatsAppTemplate {
  id: string
  name: string
  category: string
  body: string
  variables: string[]
  language: string
  is_ai_enabled: boolean
  usage_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AutomationRule {
  id: string
  name: string
  description: string | null
  trigger_type: string
  trigger_conditions: Record<string, any>
  action_type: string
  action_config: Record<string, any>
  is_active: boolean
  priority: number
  execution_count: number
  last_executed_at: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// SCORE BREAKDOWN
// ============================================================

export interface ScoreVariable {
  score: number
  max: number
  reason: string
}

export interface ScoreBreakdown {
  message_volume?: ScoreVariable
  response_frequency?: ScoreVariable
  response_speed?: ScoreVariable
  engagement_duration?: ScoreVariable
  profile_completeness?: ScoreVariable
  budget_compatibility?: ScoreVariable
  decision_timeline?: ScoreVariable
  profile_type?: ScoreVariable
  site_visits?: ScoreVariable
  meeting_request?: ScoreVariable
  media_interaction?: ScoreVariable
  [key: string]: ScoreVariable | undefined
}

// ============================================================
// PIPELINE VIEW
// ============================================================

export interface PipelineColumn {
  stage: LeadPipelineStage
  leads: Lead[]
  count: number
  total_value: number
}

export interface PipelineView {
  pipeline: Record<LeadPipelineStage, PipelineColumn>
  total_leads: number
}

// ============================================================
// STAGE CONFIGURATION
// ============================================================

export const PIPELINE_STAGES: {
  key: LeadPipelineStage
  label: string
  color: string
  emoji: string
  description: string
}[] = [
  {
    key: "novo",
    label: "Novo",
    color: "#6B7280",
    emoji: "🆕",
    description: "Lead acabou de entrar",
  },
  {
    key: "contato_inicial",
    label: "Contato Inicial",
    color: "#3B82F6",
    emoji: "💬",
    description: "Primeiro contato realizado",
  },
  {
    key: "qualificado",
    label: "Qualificado",
    color: "#8B5CF6",
    emoji: "✅",
    description: "Lead qualificado pela IA ou manualmente",
  },
  {
    key: "apresentacao",
    label: "Apresentação",
    color: "#F59E0B",
    emoji: "🏠",
    description: "Imóvel apresentado / visita realizada",
  },
  {
    key: "proposta",
    label: "Proposta",
    color: "#F97316",
    emoji: "📋",
    description: "Proposta enviada",
  },
  {
    key: "negociacao",
    label: "Negociação",
    color: "#EF4444",
    emoji: "🤝",
    description: "Em negociação de valores/condições",
  },
  {
    key: "fechado_ganho",
    label: "Fechado ✓",
    color: "#10B981",
    emoji: "🎉",
    description: "Venda concretizada",
  },
  {
    key: "fechado_perdido",
    label: "Perdido",
    color: "#6B7280",
    emoji: "❌",
    description: "Lead perdido",
  },
  {
    key: "nurturing",
    label: "Nurturing",
    color: "#06B6D4",
    emoji: "🌱",
    description: "Em nutrição de longo prazo",
  },
]

export const TEMPERATURE_CONFIG: Record<
  LeadTemperature,
  { label: string; color: string; emoji: string; min_score: number }
> = {
  frio: { label: "Frio", color: "#94A3B8", emoji: "🧊", min_score: 0 },
  morno: { label: "Morno", color: "#F59E0B", emoji: "🌤️", min_score: 26 },
  quente: { label: "Quente", color: "#F97316", emoji: "🔥", min_score: 51 },
  urgente: { label: "Urgente", color: "#EF4444", emoji: "🚨", min_score: 76 },
}

export const SOURCE_CONFIG: Record<
  LeadSource,
  { label: string; icon: string }
> = {
  whatsapp_organico: { label: "WhatsApp Orgânico", icon: "MessageCircle" },
  whatsapp_ads: { label: "WhatsApp Ads", icon: "Megaphone" },
  site_formulario: { label: "Formulário do Site", icon: "Globe" },
  site_tracking: { label: "Tracking do Site", icon: "Eye" },
  instagram: { label: "Instagram", icon: "Instagram" },
  facebook: { label: "Facebook", icon: "Facebook" },
  linkedin: { label: "LinkedIn", icon: "Linkedin" },
  indicacao: { label: "Indicação", icon: "Users" },
  portais: { label: "Portais (OLX, Zap)", icon: "Building" },
  telefone: { label: "Telefone", icon: "Phone" },
  email: { label: "Email", icon: "Mail" },
  evento: { label: "Evento", icon: "Calendar" },
  qr_code: { label: "QR Code", icon: "QrCode" },
  outro: { label: "Outro", icon: "MoreHorizontal" },
}
