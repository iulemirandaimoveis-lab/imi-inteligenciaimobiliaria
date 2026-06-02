import type { CadTemplate } from '../../packages/imi-cad-generator/src/types'

export const Apartment3BedroomsTemplate: CadTemplate = {
  id: 'apartment-3br',
  name: 'Apartamento 3 Quartos',
  type: 'floorplan',
  description: 'Planta padrão para apartamento de 3 quartos — 2 suítes, 1 quarto simples, sala ampla, varanda gourmet, lavabo, dependência de serviço.',
  defaults: {
    bedrooms: 3,
    areaM2: 112,
    parkingSpaces: 2,
  },
  outputTargets: ['preview', 'dxf'],
}
