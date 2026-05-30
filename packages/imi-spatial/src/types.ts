// IMI Spatial Layer — canonical types for real estate digital twins.
// NEVER put pricing, lead, or CRM data here — those belong in @imi/domain.

// ─── Scan Providers ──────────────────────────────────────────────────────────

export type SpatialProviderKind =
  | 'matterport'
  | 'luma'
  | 'polycam'
  | 'scaniverse'
  | 'custom'

// ─── Spatial primitives ───────────────────────────────────────────────────────

export interface BoundingBox {
  minX: number
  minY: number
  minZ: number
  maxX: number
  maxY: number
  maxZ: number
}

export interface SpatialPoint {
  x: number
  y: number
  z: number
}

// ─── Scan data ────────────────────────────────────────────────────────────────

export interface ScanData {
  provider: SpatialProviderKind
  externalId?: string
  meshUrl?: string
  pointCloudUrl?: string
  panoramaUrls: string[]
  previewImageUrl?: string
  capturedAt?: string
}

// ─── Rooms ───────────────────────────────────────────────────────────────────

export type RoomKind =
  | 'bedroom'
  | 'suite'
  | 'living'
  | 'dining'
  | 'kitchen'
  | 'bathroom'
  | 'lavatory'
  | 'laundry'
  | 'garage'
  | 'balcony'
  | 'office'
  | 'closet'
  | 'storage'
  | 'common_area'
  | 'other'

export interface Room {
  id: string
  name: string
  kind: RoomKind
  areaM2?: number
  ceilingHeightM?: number
  boundingBox?: BoundingBox
  floorLevel?: number
}

// ─── Floor plan ───────────────────────────────────────────────────────────────

export interface FloorPlan {
  svgUrl?: string
  imageUrl?: string
  scale?: number
  floors: FloorLevel[]
}

export interface FloorLevel {
  level: number
  label: string
  planUrl?: string
  areaM2?: number
}

// ─── Measurements ────────────────────────────────────────────────────────────

export interface SpatialMeasurements {
  totalAreaM2?: number
  builtAreaM2?: number
  terrainAreaM2?: number
  ceilingHeightM?: number
  roomCount?: number
  bathroomCount?: number
  bedroomCount?: number
}

// ─── Property Twin ────────────────────────────────────────────────────────────

export type TwinStatus = 'processing' | 'ready' | 'error' | 'archived'

export interface PropertyTwin {
  id: string
  propertyId: string
  developmentId?: string
  status: TwinStatus

  scan: ScanData
  rooms: Room[]
  floorPlan?: FloorPlan
  measurements: SpatialMeasurements

  publishedAt?: string
  createdAt: string
  updatedAt: string
}

// ─── Inspection ───────────────────────────────────────────────────────────────

export type InspectionKind = 'entry' | 'exit' | 'periodic' | 'evaluation' | 'pre_delivery'
export type InspectionStatus = 'open' | 'in_progress' | 'completed' | 'signed' | 'cancelled'

export type IssueKind =
  | 'damage'
  | 'wear'
  | 'missing'
  | 'dirt'
  | 'stain'
  | 'structural'
  | 'electrical'
  | 'plumbing'
  | 'finishing'
  | 'other'

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface InspectionIssue {
  id: string
  sessionId: string
  kind: IssueKind
  severity: IssueSeverity
  description: string
  roomId?: string
  photoUrls: string[]
  position?: SpatialPoint
  resolvedAt?: string
  notes?: string
}

export interface CapturePoint {
  id: string
  panoramaUrl: string
  thumbnailUrl?: string
  position?: SpatialPoint
  roomId?: string
  capturedAt: string
}

export interface InspectionSession {
  id: string
  twinId?: string
  propertyId: string

  kind: InspectionKind
  status: InspectionStatus

  captures: CapturePoint[]
  issues: InspectionIssue[]

  inspectorUserId: string
  participants?: string[]

  notes?: string
  reportUrl?: string
  signedAt?: string

  createdAt: string
  completedAt?: string
}

// ─── Valuation ────────────────────────────────────────────────────────────────

export type ValuationMethod = 'ai_spatial' | 'ptam' | 'comparison' | 'income'

export interface PropertyValuation {
  id: string
  propertyId: string
  twinId?: string

  marketValue: number
  rentalValue?: number
  confidence: number

  detectedFeatures: string[]
  comparablePropertyIds: string[]

  method: ValuationMethod
  currency: 'BRL' | 'USD' | 'EUR'
  generatedAt: string
  validUntil?: string
  notes?: string
}
