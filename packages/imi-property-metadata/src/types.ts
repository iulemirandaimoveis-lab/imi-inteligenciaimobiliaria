import { z } from 'zod'

export const PropertyCadStatusSchema = z.enum([
  'no_model',
  'draft',
  'review',
  'approved',
  'published',
])
export type PropertyCadStatus = z.infer<typeof PropertyCadStatusSchema>

export const PropertyCadMetadataSchema = z.object({
  propertyId: z.string(),
  developmentId: z.string(),
  sceneNodeId: z.string().optional(),
  cadStatus: PropertyCadStatusSchema,
  cadGenerationId: z.string().optional(),
  gltfUrl: z.string().url().optional(),
  dxfUrl: z.string().url().optional(),
  previewImageUrl: z.string().url().optional(),
  floorNumber: z.number().int().nonnegative().optional(),
  lotNumber: z.string().optional(),
  unitCode: z.string().optional(),
  areaM2: z.number().positive().optional(),
  updatedAt: z.string(),
})
export type PropertyCadMetadata = z.infer<typeof PropertyCadMetadataSchema>

export interface DevelopmentCadProfile {
  developmentId: z.ZodString
  projectType: 'subdivision' | 'building' | 'mixed'
  templateId?: string
  cadVersions: CadVersion[]
  publishedVersion?: number
}

export interface CadVersion {
  version: number
  generationId: string
  notes?: string
  approvedBy?: string
  createdAt: string
}
