import type { CadTemplate } from '../../packages/imi-cad-generator/src/types'

export const MiguelMarquesTemplate: CadTemplate = {
  id: 'miguel-marques',
  name: 'Miguel Marques',
  type: 'subdivision',
  description: 'Loteamento horizontal residencial — modelo Miguel Marques. Quadras regulares, ruas de 12 m, lotes de 250–360 m², praça central e área institucional.',
  defaults: {
    lots: 120,
    streetWidth: 12,
    areaM2: 300,
    width: 800,
    depth: 600,
  },
  outputTargets: ['preview', 'gltf', 'dxf'],
}
