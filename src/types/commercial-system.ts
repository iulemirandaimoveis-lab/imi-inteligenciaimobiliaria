// Types for Multi-Tenant Core
export type TenantRole = 'owner' | 'admin' | 'operator' | 'viewer';
export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';
export type AIProvider = 'anthropic' | 'google' | 'openai';

export interface Tenant {
    id: string;
    slug: string;
    name: string;
    niche: string;
    playbook_id: string | null;
    brand_colors: {
        primary: string;
        secondary: string;
        accent: string;
        background?: string;
    };
    brand_fonts: {
        heading: string;
        body: string;
    };
    brand_logo_url: string | null;
    tone_of_voice: string;
    target_audience: string[];
    ai_provider: AIProvider;
    ai_model: string;
    ai_temperature: number;
    ai_max_tokens: number;
    is_active: boolean;
    subscription_tier: SubscriptionTier;
    created_at: string;
    updated_at: string;
}

export interface NichePlaybook {
    id: string;
    slug: string;
    name: string;
    niche: string;
    default_language: {
        greetings?: string[];
        objections_handling?: Record<string, string>;
        CTAs?: string[];
        tone_modifiers?: string[];
    };
    content_guidelines: {
        forbidden_terms: string[];
        required_disclaimers: string[];
        hashtag_strategy: string;
        post_length_limits: Record<string, number>;
        image_style: string;
    };
    crm_scripts: {
        qualification_questions: string[];
        objection_responses: Record<string, string>;
        follow_up_sequences: FollowUpSequence[];
    };
    whatsapp_templates: WhatsAppTemplate[];
    email_templates: EmailTemplate[];
    typical_audiences: string[];
    legal_restrictions: string | null;
    campaign_templates: CampaignTemplate[];
    version: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface FollowUpSequence {
    trigger: string;
    channel: 'whatsapp' | 'email' | 'call';
    message?: string;
    subject?: string;
}

export interface WhatsAppTemplate {
    name: string;
    category: string;
    message: string;
}

export interface EmailTemplate {
    name: string;
    subject: string;
    category: string;
    body_html: string;
}

export interface PlaybookVersion {
    id: string;
    playbook_id: string;
    version: number;
    changes_summary: string | null;
    snapshot: Record<string, unknown>;
    changed_by: string | null;
    created_at: string;
}


export interface CampaignTemplate {
    type: string;
    objective: string;
    platforms: string[];
    budget_range: {
        min: number;
        max: number;
    };
    duration_days: number;
    suggested_audiences?: string[];
}

export interface TenantUser {
    id: string;
    tenant_id: string;
    user_id: string;
    role: TenantRole;
    created_at: string;
}

export type AIRequestStatus = 'success' | 'error' | 'timeout';

export interface AIRequest {
    id: string;
    tenant_id: string;
    provider: AIProvider;
    model: string;
    prompt: string;
    system_prompt: string | null;
    temperature: number | null;
    max_tokens: number | null;
    response: string | null;
    raw_response: Record<string, unknown> | null;
    tokens_input: number | null;
    tokens_output: number | null;
    tokens_total: number | null;
    cost_usd: number | null;
    latency_ms: number | null;
    status: AIRequestStatus;
    error_message: string | null;
    request_type: string | null;
    related_entity_type: string | null;
    related_entity_id: string | null;
    requested_by: string | null;
    created_at: string;
}

// Types for Content Management
export type ContentCalendarStatus = 'draft' | 'ai_generated' | 'approved' | 'active' | 'archived';
export type ContentItemStatus = 'draft' | 'ai_generated' | 'image_generating' | 'image_generated' | 'approved' | 'scheduled' | 'published' | 'failed' | 'archived';
export type ContentType = 'post' | 'story' | 'video_script' | 'carousel' | 'reel';
export type SocialPlatform = 'instagram_feed' | 'instagram_story' | 'instagram_reel' | 'facebook' | 'linkedin' | 'tiktok' | 'whatsapp' | 'twitter';
export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9';

export interface ContentCalendar {
    id: string;
    tenant_id: string;
    month: number;
    year: number;
    objectives: string[];
    offers: Offer[];
    strategic_dates: StrategicDate[];
    legal_restrictions: string | null;
    custom_instructions: string | null;
    ai_plan: AIPlan | null;
    ai_request_id: string | null;
    status: ContentCalendarStatus;
    approved_by: string | null;
    approved_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Offer {
    title: string;
    date: string;
    description?: string;
}

export interface StrategicDate {
    date: string;
    event: string;
    type?: 'holiday' | 'company_milestone' | 'seasonal' | 'industry_event';
}

export interface AIPlan {
    summary: string;
    content_pillars: string[];
    weekly_themes: WeeklyTheme[];
    suggested_posts: SuggestedPost[];
}

export interface WeeklyTheme {
    week: number;
    theme: string;
    focus: string[];
}

export interface SuggestedPost {
    date: string;
    topic: string;
    content_type: ContentType;
    platforms: SocialPlatform[];
    priority: 'low' | 'medium' | 'high';
}

export interface ContentItem {
    id: string;
    tenant_id: string;
    calendar_id: string;
    title: string;
    topic: string;
    content_type: ContentType;
    base_copy: string | null;
    base_cta: string | null;
    hashtags: string[];
    tone: string | null;
    image_prompt: string | null;
    image_url: string | null;
    media_urls: string[];
    scheduled_date: string | null;
    scheduled_time: string | null;
    timezone: string;
    status: ContentItemStatus;
    approved_by: string | null;
    approved_at: string | null;
    approval_notes: string | null;
    ai_request_ids: string[];
    performance_metrics: PerformanceMetrics | null;
    created_at: string;
    updated_at: string;
}

export interface PerformanceMetrics {
    impressions?: number;
    reach?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saves?: number;
    clicks?: number;
    engagement_rate?: number;
}

export interface ContentVariant {
    id: string;
    content_item_id: string;
    platform: SocialPlatform;
    adapted_copy: string | null;
    adapted_cta: string | null;
    adapted_hashtags: string[];
    character_count: number | null;
    media_url: string | null;
    aspect_ratio: AspectRatio | null;
    ai_request_id: string | null;
    created_at: string;
    updated_at: string;
}

// API Request/Response Types
export interface GenerateCalendarRequest {
    tenant_id: string;
    month: number;
    year: number;
    objectives: string[];
    offers?: Offer[];
    strategic_dates?: StrategicDate[];
    custom_instructions?: string;
}

export interface GenerateCalendarResponse {
    calendar_id: string;
    ai_plan: AIPlan;
    ai_request_id: string;
}

export interface GenerateContentRequest {
    tenant_id: string;
    calendar_id: string;
    topic: string;
    content_type: ContentType;
    platforms: SocialPlatform[];
    additional_context?: string;
}

export interface GenerateContentResponse {
    content_item_id: string;
    base_copy: string;
    base_cta: string;
    hashtags: string[];
    image_prompt: string;
    variants: ContentVariant[];
    ai_request_ids: string[];
}

export interface GenerateImageRequest {
    tenant_id: string;
    content_item_id: string;
    prompt: string;
    aspect_ratio: AspectRatio;
}

export interface GenerateImageResponse {
    content_item_id: string;
    image_url: string;
    ai_request_id: string;
}

// Types for Ads Management & Analytics
export type AdsPlatform = 'google_ads' | 'meta_ads' | 'linkedin_ads' | 'tiktok_ads';
export type AdsAccountStatus = 'active' | 'inactive' | 'error' | 'expired';
export type CampaignStatus = 'active' | 'paused' | 'ended' | 'deleted';
export type InsightType =
    | 'high_cpa'
    | 'low_conversion'
    | 'budget_waste'
    | 'opportunity'
    | 'audience_fatigue'
    | 'creative_decline'
    | 'bid_optimization'
    | 'targeting_improvement'
    | 'budget_reallocation';
export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type InsightStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';

export interface AdsAccount {
    id: string;
    tenant_id: string;
    platform: AdsPlatform;
    account_id: string;
    account_name: string;
    currency: string;
    timezone: string;
    access_token: string | null;
    refresh_token: string | null;
    token_expires_at: string | null;
    account_metadata: Record<string, unknown> | null;
    status: AdsAccountStatus;
    last_sync_at: string | null;
    sync_frequency_hours: number;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface AdsCampaign {
    id: string;
    ads_account_id: string;
    tenant_id: string;
    campaign_id: string;
    campaign_name: string;
    platform: AdsPlatform;
    status: CampaignStatus;
    objective: string | null;
    budget_type: string | null;
    budget_amount: number | null;
    currency: string;
    start_date: string | null;
    end_date: string | null;
    campaign_metadata: Record<string, unknown> | null;
    ai_analysis: Record<string, unknown> | null;
    ai_recommendations: string[];
    last_analyzed_at: string | null;
    created_at: string;
    updated_at: string;
    synced_at: string;
}

export interface AdsMetrics {
    id: string;
    campaign_id: string;
    ads_account_id: string;
    tenant_id: string;
    date: string;
    impressions: number;
    reach: number;
    frequency: number;
    clicks: number;
    ctr: number;
    engagements: number;
    conversions: number;
    conversion_rate: number;
    leads: number;
    sales: number;
    spend: number;
    cpc: number;
    cpm: number;
    cpa: number;
    roas: number;
    revenue: number;
    raw_data: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
}

export interface AdsInsight {
    id: string;
    tenant_id: string;
    ads_account_id: string | null;
    campaign_id: string | null;
    insight_type: InsightType;
    severity: InsightSeverity;
    title: string;
    description: string;
    ai_analysis: string | null;
    recommendations: string[];
    estimated_impact: number | null;
    current_metric_value: number | null;
    benchmark_metric_value: number | null;
    metric_name: string | null;
    status: InsightStatus;
    resolved_at: string | null;
    resolved_by: string | null;
    resolution_notes: string | null;
    analysis_start_date: string | null;
    analysis_end_date: string | null;
    created_at: string;
    updated_at: string;
    ai_request_id: string | null;
}

export interface AdsCampaignSummary {
    campaign_id: string;
    campaign_name: string;
    platform: AdsPlatform;
    status: CampaignStatus;
    tenant_id: string;
    days_active: number;
    total_impressions: number;
    total_clicks: number;
    avg_ctr: number;
    total_conversions: number;
    total_spend: number;
    avg_cpc: number;
    avg_cpa: number;
    avg_roas: number;
    total_revenue: number;
    profit: number;
}

// API Request/Response Types for Ads
export interface AnalyzeCampaignRequest {
    tenant_id: string;
    campaign_id: string;
    start_date: string;
    end_date: string;
}

export interface AnalyzeCampaignResponse {
    campaign_id: string;
    insights: AdsInsight[];
    ai_analysis: Record<string, unknown>;
    recommendations: string[];
    ai_request_id: string;
    cost_usd: number;
}

export interface SyncAdsAccountRequest {
    tenant_id: string;
    ads_account_id: string;
    force_full_sync?: boolean;
}

export interface SyncAdsAccountResponse {
    ads_account_id: string;
    campaigns_synced: number;
    metrics_synced: number;
    insights_generated: number;
    last_sync_at: string;
}

// Types for CRM Prescriptive
export type LeadPriority = 'critical' | 'high' | 'medium' | 'low';
export type InteractionType =
    | 'call'
    | 'email'
    | 'whatsapp'
    | 'meeting'
    | 'site_visit'
    | 'proposal_sent'
    | 'contract_signed'
    | 'objection'
    | 'follow_up'
    | 'other';
export type InteractionDirection = 'inbound' | 'outbound';
export type SentimentType = 'positive' | 'neutral' | 'negative' | 'mixed';
export type FollowUpChannel = 'call' | 'email' | 'whatsapp' | 'meeting';
export type FollowUpStatus = 'pending' | 'completed' | 'skipped' | 'cancelled';

export interface LeadQualification {
    score: number; // 0-100
    priority: LeadPriority;
    summary: string;
    strengths: string[];
    concerns: string[];
    recommendations: string[];
    next_action: string;
    next_action_deadline: string;
    confidence: number; // 0.0-1.0
}

export interface LeadInteraction {
    id: string;
    lead_id: string;
    interaction_type: InteractionType;
    direction: InteractionDirection;
    subject: string | null;
    notes: string | null;
    outcome: string | null;
    duration_seconds: number | null;
    attachments: Record<string, unknown>[];
    metadata: Record<string, unknown> | null;
    ai_sentiment: SentimentType | null;
    ai_summary: string | null;
    ai_extracted_intent: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface LeadFollowUp {
    id: string;
    lead_id: string;
    suggested_action: string;
    suggested_message: string | null;
    suggested_channel: FollowUpChannel | null;
    scheduled_for: string;
    status: FollowUpStatus;
    completed_at: string | null;
    completed_by: string | null;
    completion_notes: string | null;
    ai_rationale: string | null;
    ai_confidence: number | null;
    ai_request_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface LeadScoringHistory {
    id: string;
    lead_id: string;
    previous_score: number | null;
    new_score: number;
    score_change: number | null;
    change_reason: string | null;
    change_factors: Record<string, unknown> | null;
    ai_analysis: string | null;
    ai_request_id: string | null;
    created_at: string;
}

export interface EnrichedLead {
    id: string;
    name: string;
    email: string;
    phone: string;
    ai_qualification: LeadQualification | null;
    ai_score: number;
    ai_priority: LeadPriority;
    ai_recommendations: string[];
    ai_next_action: string | null;
    ai_next_action_deadline: string | null;
    last_ai_analysis_at: string | null;
    ai_request_id: string | null;
    interaction_count: number;
    last_interaction_at: string | null;
    pending_follow_ups: number;
    next_follow_up_at: string | null;
    created_at: string;
    updated_at: string;
}

// API Request/Response Types for CRM
export interface QualifyLeadRequest {
    lead_id: string;
    include_interactions?: boolean;
}

export interface QualifyLeadResponse {
    lead_id: string;
    qualification: LeadQualification;
    follow_ups: LeadFollowUp[];
    ai_request_id: string;
    cost_usd: number;
}

export interface GenerateFollowUpRequest {
    lead_id: string;
    interaction_history?: LeadInteraction[];
}

export interface GenerateFollowUpResponse {
    lead_id: string;
    follow_ups: LeadFollowUp[];
    ai_request_id: string;
    cost_usd: number;
}

// Types for Social Media Publishing
export type SocialMediaPlatform = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';
export type SocialAccountStatus = 'active' | 'inactive' | 'expired' | 'error';
export type PublicationStatus =
    | 'pending'
    | 'scheduled'
    | 'publishing'
    | 'published'
    | 'failed'
    | 'cancelled';
export type QueueStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface SocialAccount {
    id: string;
    tenant_id: string;
    platform: SocialMediaPlatform;
    account_id: string;
    account_name: string;
    username: string | null;
    profile_url: string | null;
    profile_image_url: string | null;
    access_token: string;
    refresh_token: string | null;
    token_expires_at: string | null;
    granted_permissions: string[];
    status: SocialAccountStatus;
    last_used_at: string | null;
    error_message: string | null;
    account_metadata: Record<string, unknown> | null;
    connected_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface ContentPublication {
    id: string;
    content_item_id: string;
    content_variant_id: string | null;
    social_account_id: string;
    tenant_id: string;
    platform: SocialMediaPlatform;
    scheduled_for: string | null;
    published_at: string | null;
    status: PublicationStatus;
    external_post_id: string | null;
    external_post_url: string | null;
    error_code: string | null;
    error_message: string | null;
    published_content: string | null;
    published_image_urls: string[];
    published_video_url: string | null;
    impressions: number;
    reach: number;
    engagement: number;
    clicks: number;
    shares: number;
    comments: number;
    likes: number;
    publication_metadata: Record<string, unknown> | null;
    published_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface PublishingQueueItem {
    id: string;
    content_publication_id: string;
    scheduled_for: string;
    retry_count: number;
    max_retries: number;
    next_retry_at: string | null;
    status: QueueStatus;
    processing_started_at: string | null;
    processing_completed_at: string | null;
    error_logs: Record<string, unknown>[];
    created_at: string;
    updated_at: string;
}

export interface ContentAnalytics {
    content_item_id: string;
    title: string;
    content_created_at: string;
    total_publications: number;
    published_count: number;
    total_impressions: number;
    total_reach: number;
    total_engagement: number;
    total_clicks: number;
    total_likes: number;
    total_comments: number;
    total_shares: number;
    engagement_rate: number;
}

// API Request/Response Types for Publishing
export interface PublishNowRequest {
    content_item_id: string;
    platform: SocialMediaPlatform;
    variant_id?: string;
}

export interface PublishNowResponse {
    publication_id: string;
    external_post_id: string;
    external_post_url: string;
    platform: SocialMediaPlatform;
    published_at: string;
}

export interface SchedulePublicationRequest {
    content_item_id: string;
    platform: SocialMediaPlatform;
    scheduled_for: string;
    variant_id?: string;
}

export interface SchedulePublicationResponse {
    publication_id: string;
    scheduled_for: string;
    queue_id: string;
}


