import { MiguelMarquesTemplate } from './subdivision/miguel-marques.template'
import { AltoBellevueTemplate } from './subdivision/alto-bellevue.template'
import { JazzBoulevardTemplate } from './building/jazz-boulevard.template'
import { Apartment2BedroomsTemplate } from './floorplan/apartment-2-bedrooms.template'
import { Apartment3BedroomsTemplate } from './floorplan/apartment-3-bedrooms.template'
import { StudioTemplate } from './floorplan/studio.template'
import type { CadTemplate } from '../packages/imi-cad-generator/src/types'

export const IMI_CAD_TEMPLATES: CadTemplate[] = [
  MiguelMarquesTemplate,
  AltoBellevueTemplate,
  JazzBoulevardTemplate,
  Apartment2BedroomsTemplate,
  Apartment3BedroomsTemplate,
  StudioTemplate,
]

export function getTemplateById(id: string): CadTemplate | undefined {
  return IMI_CAD_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesByType(type: CadTemplate['type']): CadTemplate[] {
  return IMI_CAD_TEMPLATES.filter(t => t.type === type)
}

export {
  MiguelMarquesTemplate,
  AltoBellevueTemplate,
  JazzBoulevardTemplate,
  Apartment2BedroomsTemplate,
  Apartment3BedroomsTemplate,
  StudioTemplate,
}
