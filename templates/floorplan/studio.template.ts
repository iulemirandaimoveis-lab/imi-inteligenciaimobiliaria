import type { CadTemplate } from '../../packages/imi-cad-generator/src/types'

export const StudioTemplate: CadTemplate = {
  id: 'studio',
  name: 'Studio',
  type: 'floorplan',
  description: 'Planta compacta para studio — ambiente integrado, kitchenette, banheiro, espaço para home office.',
  defaults: {
    bedrooms: 0,
    areaM2: 32,
    parkingSpaces: 0,
  },
  outputTargets: ['preview', 'dxf'],
}
