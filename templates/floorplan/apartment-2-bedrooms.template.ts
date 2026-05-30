import type { CadTemplate } from '../../packages/imi-cad-generator/src/types'

export const Apartment2BedroomsTemplate: CadTemplate = {
  id: 'apartment-2br',
  name: 'Apartamento 2 Quartos',
  type: 'floorplan',
  description: 'Planta padrão para apartamento de 2 quartos — sala integrada, varanda, 1 banheiro social, 1 suíte, cozinha americana.',
  defaults: {
    bedrooms: 2,
    areaM2: 72,
    parkingSpaces: 1,
  },
  outputTargets: ['preview', 'dxf'],
}
