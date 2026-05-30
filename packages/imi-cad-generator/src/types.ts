import { z } from 'zod'

export const CadProjectTypeSchema = z.enum([
  'subdivision',
  'building',
  'floorplan',
  'unit',
  'amenity',
])
export type CadProjectType = z.infer<typeof CadProjectTypeSchema>

export const CadConstraintsSchema = z.object({
  width: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  areaM2: z.number().positive().optional(),
  floors: z.number().int().positive().optional(),
  unitsPerFloor: z.number().int().positive().optional(),
  lots: z.number().int().positive().optional(),
  streetWidth: z.number().positive().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  parkingSpaces: z.number().int().nonnegative().optional(),
}).optional()

export const CadGenerationInputSchema = z.object({
  prompt: z.string().min(10).max(2000),
  projectType: CadProjectTypeSchema,
  constraints: CadConstraintsSchema,
  referenceImages: z.array(z.string().url()).max(4).optional(),
})
export type CadGenerationInput = z.infer<typeof CadGenerationInputSchema>

export interface CadGenerationResult {
  scadCode?: string
  dxfUrl?: string
  stlUrl?: string
  gltfUrl?: string
  previewSceneJson?: object
  warnings: string[]
  generationId: string
  createdAt: string
}

export type CadOutputTarget = 'preview' | 'gltf' | 'dxf' | 'stl' | 'scad'

export interface CadTemplate {
  id: string
  name: string
  type: CadProjectType
  description: string
  defaults: CadConstraints
  outputTargets: CadOutputTarget[]
  previewImageUrl?: string
}

export type CadConstraints = NonNullable<CadGenerationInput['constraints']>

export interface CadGenerationJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  input: CadGenerationInput
  result?: CadGenerationResult
  errorMessage?: string
  requestedBy: string
  createdAt: string
  completedAt?: string
}
