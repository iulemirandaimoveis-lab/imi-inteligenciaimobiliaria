import { z } from 'zod'

export const SceneNodeKindSchema = z.enum([
  'lot',
  'unit',
  'floor',
  'building',
  'common_area',
])
export type SceneNodeKind = z.infer<typeof SceneNodeKindSchema>

export const SceneNodeMappingSchema = z.object({
  sceneNodeId: z.string(),
  propertyId: z.string().optional(),
  developmentId: z.string(),
  kind: SceneNodeKindSchema,
  label: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})
export type SceneNodeMapping = z.infer<typeof SceneNodeMappingSchema>

export interface SceneGraph {
  id: string
  developmentId: string
  version: number
  nodes: SceneNodeMapping[]
  gltfUrl?: string
  previewImageUrl?: string
  createdAt: string
  publishedAt?: string
}

export interface AdapterInput {
  cadGenerationId: string
  developmentId: string
  gltfUrl?: string
  previewSceneJson?: object
}

export interface AdapterResult {
  sceneGraph: SceneGraph
  warnings: string[]
}
