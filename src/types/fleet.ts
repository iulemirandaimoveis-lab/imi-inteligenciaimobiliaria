// src/types/fleet.ts
// IMI - Inteligência Imobiliária
// Tipos para o módulo de Gestão de Frota Corporativa

// ============================================================
// ENUMS / UNION TYPES
// ============================================================

export type VehicleStatus =
  | 'disponivel'
  | 'em_uso'
  | 'manutencao'
  | 'bloqueado'
  | 'sinistrado'
  | 'reserva'

export type FuelType =
  | 'flex'
  | 'gasolina'
  | 'etanol'
  | 'diesel'
  | 'eletrico'
  | 'hibrido'

export type UsageStatus =
  | 'solicitado'
  | 'aprovado'
  | 'retirado'
  | 'devolvido'
  | 'cancelado'
  | 'rejeitado'

export type UsagePurpose =
  | 'visita_cliente'
  | 'plantao'
  | 'captacao'
  | 'vistoria'
  | 'documentacao'
  | 'reuniao'
  | 'marketing'
  | 'suporte_interno'
  | 'outro'

export type FuelLevel = 'vazio' | '1/4' | '1/2' | '3/4' | 'cheio'

export type MaintenanceType =
  | 'preventiva'
  | 'corretiva'
  | 'revisao'
  | 'pneu'
  | 'freio'
  | 'outros'

export type MaintenanceStatus =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'cancelada'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export type AlertType =
  | 'insurance_expiry'
  | 'ipva_expiry'
  | 'license_expiry'
  | 'revision_km'
  | 'revision_date'
  | 'maintenance_overdue'

// ============================================================
// PHOTO METADATA
// ============================================================

export interface PhotoMetadata {
  hash?: string
  device?: string
  gps?: { lat: number; lng: number; accuracy?: number }
  timestamp?: string
  mime_type?: string
  size_bytes?: number
}

// ============================================================
// CORE ENTITIES
// ============================================================

export interface FleetVehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  renavam?: string | null
  color?: string | null
  fuel_type: FuelType
  km_current: number
  avg_consumption?: number | null
  status: VehicleStatus
  insurance_expiry?: string | null
  ipva_expiry?: string | null
  license_expiry?: string | null
  next_revision_km?: number | null
  next_revision_date?: string | null
  docs_urls: string[]
  photo_urls: string[]
  notes?: string | null
  is_active: boolean
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface FleetUsage {
  id: string
  vehicle_id: string
  broker_id: string
  status: UsageStatus
  purpose: UsagePurpose
  purpose_description?: string | null
  destination?: string | null
  estimated_return?: string | null
  // Retirada
  km_initial?: number | null
  fuel_level_initial?: FuelLevel | null
  pickup_at?: string | null
  pickup_by?: string | null
  pickup_photos: string[]
  pickup_photo_metadata: PhotoMetadata | Record<string, unknown>
  pickup_notes?: string | null
  // Devolução
  km_final?: number | null
  fuel_level_final?: FuelLevel | null
  return_at?: string | null
  return_photos: string[]
  return_photo_metadata: PhotoMetadata | Record<string, unknown>
  return_notes?: string | null
  // Calculado
  km_driven?: number | null
  // Aprovação
  approved_by?: string | null
  approved_at?: string | null
  rejected_by?: string | null
  rejected_at?: string | null
  rejection_reason?: string | null
  // Auditoria
  is_suspicious: boolean
  suspicious_reason?: string | null
  flagged_by?: string | null
  flagged_at?: string | null
  created_at: string
  updated_at: string
}

export interface FleetFueling {
  id: string
  usage_id: string
  vehicle_id: string
  broker_id: string
  fuel_type: string
  liters: number
  price_per_liter: number
  total_cost: number
  gas_station?: string | null
  km_at_fueling?: number | null
  receipt_url?: string | null
  receipt_photo_metadata: PhotoMetadata | Record<string, unknown>
  notes?: string | null
  fueled_at: string
  created_at: string
}

export interface FleetMaintenance {
  id: string
  vehicle_id: string
  maintenance_type: MaintenanceType
  description: string
  cost?: number | null
  km_at_maintenance?: number | null
  service_center?: string | null
  invoice_url?: string | null
  status: MaintenanceStatus
  started_at?: string | null
  completed_at?: string | null
  next_maintenance_km?: number | null
  next_maintenance_date?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// RELATIONS / EXTENDED TYPES
// ============================================================

export interface FleetUsageWithRelations extends FleetUsage {
  vehicle?: {
    id: string
    plate: string
    brand: string
    model: string
    year: number
    fuel_type: FuelType
    km_current: number
    color?: string | null
  }
  broker?: {
    id: string
    name: string
    email?: string | null
    phone?: string | null
    avatar_url?: string | null
  }
}

export interface FleetVehicleWithCurrentUsage extends FleetVehicle {
  current_usage?: Pick<
    FleetUsageWithRelations,
    'id' | 'status' | 'broker_id' | 'purpose' | 'pickup_at' | 'estimated_return'
  > & {
    broker?: { id: string; name: string; avatar_url?: string | null }
  } | null
}

// ============================================================
// REPORTS
// ============================================================

export interface FleetCostReport {
  vehicle_id: string
  plate: string
  brand: string
  model: string
  year: number
  total_km: number
  total_fueling_cost: number
  total_maintenance_cost: number
  total_cost: number
  cost_per_km: number | null
  usages_count: number
  avg_km_per_trip: number | null
}

export interface FleetBrokerReport {
  broker_id: string
  broker_name: string
  total_usages: number
  total_km: number
  total_fueling_cost: number
  avg_km_per_trip: number | null
}

export interface FleetVehicleHistory {
  vehicle: FleetVehicle
  usages: FleetUsageWithRelations[]
  fuelings: FleetFueling[]
  maintenances: FleetMaintenance[]
}

export interface FleetSuspiciousUsage extends FleetUsageWithRelations {
  anomaly_reason?: string
}

// ============================================================
// ALERTS
// ============================================================

export interface FleetAlert {
  type: AlertType
  severity: AlertSeverity
  vehicle_id: string
  plate: string
  message: string
  due_date?: string | null
  due_km?: number | null
}
