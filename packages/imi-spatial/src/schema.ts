import { z } from 'zod'

export const SpatialProviderKindSchema = z.enum([
  'matterport',
  'luma',
  'polycam',
  'scaniverse',
  'custom',
])

export const RoomKindSchema = z.enum([
  'bedroom', 'suite', 'living', 'dining', 'kitchen',
  'bathroom', 'lavatory', 'laundry', 'garage', 'balcony',
  'office', 'closet', 'storage', 'common_area', 'other',
])

export const TwinStatusSchema = z.enum(['processing', 'ready', 'error', 'archived'])

export const InspectionKindSchema = z.enum([
  'entry', 'exit', 'periodic', 'evaluation', 'pre_delivery',
])

export const InspectionStatusSchema = z.enum([
  'open', 'in_progress', 'completed', 'signed', 'cancelled',
])

export const IssueKindSchema = z.enum([
  'damage', 'wear', 'missing', 'dirt', 'stain',
  'structural', 'electrical', 'plumbing', 'finishing', 'other',
])

export const IssueSeveritySchema = z.enum(['low', 'medium', 'high', 'critical'])

export const SpatialPointSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
})

export const ScanDataSchema = z.object({
  provider: SpatialProviderKindSchema,
  externalId: z.string().optional(),
  meshUrl: z.string().url().optional(),
  pointCloudUrl: z.string().url().optional(),
  panoramaUrls: z.array(z.string().url()),
  previewImageUrl: z.string().url().optional(),
  capturedAt: z.string().datetime().optional(),
})

export const RoomSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  kind: RoomKindSchema,
  areaM2: z.number().positive().optional(),
  ceilingHeightM: z.number().positive().optional(),
  floorLevel: z.number().int().optional(),
})

export const CreateTwinSchema = z.object({
  propertyId: z.string().uuid(),
  developmentId: z.string().uuid().optional(),
  scan: ScanDataSchema,
  rooms: z.array(RoomSchema).default([]),
  measurements: z.object({
    totalAreaM2: z.number().positive().optional(),
    builtAreaM2: z.number().positive().optional(),
    ceilingHeightM: z.number().positive().optional(),
    roomCount: z.number().int().positive().optional(),
    bathroomCount: z.number().int().positive().optional(),
    bedroomCount: z.number().int().positive().optional(),
  }).default({}),
})
export type CreateTwinInput = z.infer<typeof CreateTwinSchema>

export const CreateInspectionSchema = z.object({
  propertyId: z.string().uuid(),
  twinId: z.string().uuid().optional(),
  kind: InspectionKindSchema,
  notes: z.string().max(2000).optional(),
  participants: z.array(z.string()).default([]),
})
export type CreateInspectionInput = z.infer<typeof CreateInspectionSchema>

export const AddIssueSchema = z.object({
  kind: IssueKindSchema,
  severity: IssueSeveritySchema,
  description: z.string().min(1).max(1000),
  roomId: z.string().uuid().optional(),
  photoUrls: z.array(z.string().url()).default([]),
  position: SpatialPointSchema.optional(),
  notes: z.string().max(500).optional(),
})
export type AddIssueInput = z.infer<typeof AddIssueSchema>
