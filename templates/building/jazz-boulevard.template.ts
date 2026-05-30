import type { CadTemplate } from '../../packages/imi-cad-generator/src/types'

export const JazzBoulevardTemplate: CadTemplate = {
  id: 'jazz-boulevard',
  name: 'Jazz Boulevard',
  type: 'building',
  description: 'Edifício residencial de alto padrão — modelo Jazz Boulevard. Térreo comercial, torre com 12 pavimentos, 4 unidades por andar, sacadas frontais, cobertura técnica.',
  defaults: {
    floors: 12,
    unitsPerFloor: 4,
    parkingSpaces: 60,
    width: 30,
    depth: 20,
  },
  outputTargets: ['preview', 'gltf', 'dxf'],
}
