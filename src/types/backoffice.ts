// types/backoffice.ts — IMI Backoffice, RH & Capital Humano
// Generated from Supabase schema — keep in sync with migrations

export type PermissionScope = 'none' | 'own' | 'own_supervised' | 'team' | 'department' | 'full'

export type SystemResource =
  | 'crm_leads' | 'crm_pipeline' | 'properties' | 'valuations'
  | 'due_diligence' | 'contracts' | 'commissions' | 'financial_reports'
  | 'content' | 'analytics' | 'team_management' | 'system_config'
  | 'templates' | 'documents' | 'training' | 'recruitment'

export type MemberStatus = 'candidate' | 'training' | 'active' | 'inactive' | 'suspended' | 'terminated'
export type MemberLevel = 'trainee' | 'consultor' | 'senior' | 'lider' | 'coordenador' | 'diretor'
export type ContractType = 'associado_creci' | 'pj' | 'clt' | 'estagiario' | 'parceiro_externo'
export type Department = 'comercial' | 'tecnologia' | 'operacoes' | 'marketing' | 'rh' | 'financeiro' | 'diretoria'

export type RecruitmentStage =
  | 'applied' | 'screening' | 'screening_approved'
  | 'interview_scheduled' | 'interview_done'
  | 'technical_assessment' | 'behavioral_assessment'
  | 'immersion_day' | 'offer_sent' | 'offer_accepted'
  | 'hired' | 'rejected' | 'withdrawn'

export type RecruitmentChannel =
  | 'instagram' | 'linkedin' | 'referral_internal' | 'referral_external'
  | 'university' | 'tti_school' | 'event' | 'website' | 'job_board' | 'other'

export type DealType = 'venda' | 'locacao' | 'avaliacao' | 'consultoria' | 'estruturacao' | 'internacional'
export type DealStatus = 'prospecting' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'cancelled'
export type CommissionStatus = 'pending' | 'receivable' | 'paid' | 'disputed' | 'cancelled'

export interface Role {
  id: string
  name: string
  display_name: string
  description: string | null
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  user_id: string | null
  full_name: string
  email: string
  phone: string | null
  photo_url: string | null
  role_id: string
  department: Department
  level: MemberLevel
  contract_type: ContractType
  status: MemberStatus
  creci: string | null
  cnai: string | null
  reports_to: string | null
  team_leader_id: string | null
  specializations: string[]
  hire_date: string | null
  commission_split_pct: number
  leader_override_pct: number
  nda_signed: boolean
  created_at: string
  updated_at: string
}

export interface Candidate {
  id: string
  full_name: string
  email: string
  phone: string | null
  linkedin_url: string | null
  stage: RecruitmentStage
  target_department: Department
  target_role_id: string | null
  channel: RecruitmentChannel
  referrer_id: string | null
  has_creci: boolean
  years_experience: number
  motivation: string | null
  score_total: number | null
  team_member_id: string | null
  recruiter_id: string | null
  created_at: string
  updated_at: string
}

export interface Deal {
  id: string
  deal_type: DealType
  status: DealStatus
  deal_value: number
  commission_total: number | null
  commission_pct: number | null
  currency: 'BRL' | 'USD' | 'AED'
  primary_agent_id: string
  secondary_agent_id: string | null
  team_leader_id: string | null
  closing_date: string | null
  created_at: string
  updated_at: string
}

export interface Commission {
  id: string
  deal_id: string
  team_member_id: string
  commission_type: 'primary_agent' | 'secondary_agent' | 'leader_override' | 'referral_bonus' | 'performance_bonus'
  gross_amount: number
  deductions: number
  net_amount: number
  split_pct: number
  status: CommissionStatus
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface TrainingModule {
  id: string
  code: string
  name: string
  description: string | null
  duration_weeks: number
  is_mandatory: boolean
  target_departments: Department[]
  min_level_required: MemberLevel
  sort_order: number
  is_active: boolean
}

export interface TrainingProgress {
  id: string
  team_member_id: string
  module_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'failed'
  score: number | null
  started_at: string | null
  completed_at: string | null
}

export interface KPIDefinition {
  id: string
  code: string
  name: string
  unit: string
  direction: 'higher_is_better' | 'lower_is_better'
  target_departments: Department[]
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
}

export function hasPermission(
  userPermissions: Array<{ resource: SystemResource; scope: PermissionScope; can_read: boolean; can_create: boolean; can_update: boolean; can_delete: boolean }>,
  resource: SystemResource,
  action: 'read' | 'create' | 'update' | 'delete'
): boolean {
  const perm = userPermissions.find(p => p.resource === resource)
  if (!perm || perm.scope === 'none') return false
  switch (action) {
    case 'read': return perm.can_read
    case 'create': return perm.can_create
    case 'update': return perm.can_update
    case 'delete': return perm.can_delete
    default: return false
  }
}
