import type { CadConstraints, CadProjectType } from './types'

const SUBDIVISION_KEYWORDS = ['loteamento', 'quadra', 'lote', 'subdivisão', 'lotes', 'rua', 'praça']
const BUILDING_KEYWORDS = ['prédio', 'edifício', 'torre', 'pavimento', 'andar', 'cobertura', 'térreo']
const FLOORPLAN_KEYWORDS = ['planta', 'apartamento', 'quarto', 'sala', 'cozinha', 'banheiro', 'suite']
const UNIT_KEYWORDS = ['unidade', 'studio', 'kitnet', 'flat', 'loft']
const AMENITY_KEYWORDS = ['área comum', 'piscina', 'academia', 'salão', 'playground', 'churrasqueira']

export function inferProjectType(prompt: string): CadProjectType {
  const lower = prompt.toLowerCase()
  if (SUBDIVISION_KEYWORDS.some(k => lower.includes(k))) return 'subdivision'
  if (BUILDING_KEYWORDS.some(k => lower.includes(k))) return 'building'
  if (FLOORPLAN_KEYWORDS.some(k => lower.includes(k))) return 'floorplan'
  if (UNIT_KEYWORDS.some(k => lower.includes(k))) return 'unit'
  if (AMENITY_KEYWORDS.some(k => lower.includes(k))) return 'amenity'
  return 'building'
}

export function extractConstraints(prompt: string): Partial<CadConstraints> {
  const constraints: Partial<CadConstraints> = {}
  const lower = prompt.toLowerCase()

  const floorsMatch = lower.match(/(\d+)\s*(pavimentos?|andares?|floors?)/i)
  if (floorsMatch) constraints.floors = parseInt(floorsMatch[1])

  const lotsMatch = lower.match(/(\d+)\s*(lotes?)/i)
  if (lotsMatch) constraints.lots = parseInt(lotsMatch[1])

  const areaMatch = lower.match(/(\d+)\s*m²?/i)
  if (areaMatch) constraints.areaM2 = parseInt(areaMatch[1])

  const streetMatch = lower.match(/ruas?\s+de\s+(\d+)\s*m/i)
  if (streetMatch) constraints.streetWidth = parseInt(streetMatch[1])

  const bedroomsMatch = lower.match(/(\d+)\s*(quartos?|suítes?|dormitórios?)/i)
  if (bedroomsMatch) constraints.bedrooms = parseInt(bedroomsMatch[1])

  const unitsMatch = lower.match(/(\d+)\s*(unidades?\s+por\s+andar|apt\s+por\s+pav)/i)
  if (unitsMatch) constraints.unitsPerFloor = parseInt(unitsMatch[1])

  const parkingMatch = lower.match(/(\d+)\s*(vagas?|estacionamentos?)/i)
  if (parkingMatch) constraints.parkingSpaces = parseInt(parkingMatch[1])

  return constraints
}

export function buildOpenSCADSystemPrompt(projectType: string): string {
  return `Você é um motor de geração CAD paramétrico especializado em projetos imobiliários brasileiros.
Gere código OpenSCAD válido para modelagem ${projectType}.
Regras obrigatórias:
- Use apenas primitivas OpenSCAD padrão (cube, cylinder, sphere, translate, rotate, union, difference)
- Inclua variáveis paramétricas no topo do código com comentários em português
- Adicione módulos reutilizáveis para elementos repetidos (lotes, pavimentos, unidades)
- Não inclua preços, leads, clientes ou dados comerciais no modelo
- Gere geometria limpa e exportável para DXF/STL/GLTF
- Escala: metros
Responda APENAS com código OpenSCAD válido, sem explicações fora do código.`
}
