import type { CadTemplate } from '../../packages/imi-cad-generator/src/types'

export const AltoBellevueTemplate: CadTemplate = {
  id: 'alto-bellevue',
  name: 'Alto Bellevue',
  type: 'subdivision',
  description: 'Loteamento fechado de alto padrão — modelo Alto Bellevue. Lotes amplos 450–800 m², ruas arborizadas de 14 m, guarita de acesso, clube e lago artificial.',
  defaults: {
    lots: 64,
    streetWidth: 14,
    areaM2: 600,
    width: 1200,
    depth: 900,
  },
  outputTargets: ['preview', 'gltf', 'dxf'],
}
