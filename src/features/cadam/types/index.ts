export type CadProjectType = 'subdivision' | 'building' | 'floorplan' | 'unit' | 'amenity'

export interface CadConstraintsForm {
  width?: number
  depth?: number
  areaM2?: number
  floors?: number
  unitsPerFloor?: number
  lots?: number
  streetWidth?: number
  bedrooms?: number
  parkingSpaces?: number
}

export interface CadGenerationState {
  status: 'idle' | 'loading' | 'success' | 'error'
  scadCode?: string
  warnings: string[]
  generationId?: string
  errorMessage?: string
}

export interface TemplateOption {
  id: string
  name: string
  type: CadProjectType
  description: string
}
