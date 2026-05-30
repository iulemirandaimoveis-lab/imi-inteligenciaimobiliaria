import { type IMIProperty } from '@/lib/imi-domain/types'

export const JAZZ_DEV_ID = 'jazz-boulevard'

export type JazzPlanType = 'Planta Tipo A' | 'Planta Tipo B' | 'Cobertura'

export const JAZZ_PLANS: Record<JazzPlanType, {
  description: string
  bedrooms: number
  suites: number
  bathrooms: number
  parkingSpaces: number
  privateAreaM2: number
  totalAreaM2: number
  floorPlanImage: string
}> = {
  'Planta Tipo A': {
    description: '2 dormitórios com suíte, sala ampla, cozinha integrada, varanda e 1 vaga',
    bedrooms: 2, suites: 1, bathrooms: 2, parkingSpaces: 1,
    privateAreaM2: 74.5, totalAreaM2: 86.5,
    floorPlanImage: '/jazz/plants/planta-tipo-a.png',
  },
  'Planta Tipo B': {
    description: '3 dormitórios com 2 suítes, sala de jantar/estar, cozinha integrada e 2 vagas',
    bedrooms: 3, suites: 2, bathrooms: 2, parkingSpaces: 2,
    privateAreaM2: 98.0, totalAreaM2: 112.0,
    floorPlanImage: '/jazz/plants/planta-tipo-b.png',
  },
  'Cobertura': {
    description: 'Cobertura duplex com terraço, churrasqueira, 3 suítes e 2 vagas',
    bedrooms: 3, suites: 3, bathrooms: 3, parkingSpaces: 2,
    privateAreaM2: 148.5, totalAreaM2: 178.0,
    floorPlanImage: '/jazz/plants/cobertura.png',
  },
}

const SEED_STATUSES: Array<IMIProperty['status']> = [
  'available', 'available', 'available', 'reserved',
  'available', 'available', 'sold', 'available',
  'available', 'reserved', 'available', 'available',
]

function getPlanType(floor: number, position: number): JazzPlanType {
  if (floor === 12) return 'Cobertura'
  if (position <= 2) return 'Planta Tipo A'
  return 'Planta Tipo B'
}

function seedStatus(floor: number, pos: number): IMIProperty['status'] {
  return SEED_STATUSES[(floor + pos) % SEED_STATUSES.length]
}

function buildUnitPrice(plan: JazzPlanType, floor: number): number {
  const base = plan === 'Planta Tipo A' ? 420_000 : plan === 'Planta Tipo B' ? 580_000 : 850_000
  return base + floor * (plan === 'Cobertura' ? 0 : 3_000)
}

export function buildJazzUnits(tower: 'A' | 'B'): IMIProperty[] {
  const units: IMIProperty[] = []
  for (let floor = 1; floor <= 12; floor++) {
    const positions = floor === 12 ? [1, 2] : [1, 2, 3, 4]
    for (const pos of positions) {
      const plan = getPlanType(floor, pos)
      const planDef = JAZZ_PLANS[plan]
      const code = `${tower}-${String(floor).padStart(2, '0')}${String(pos).padStart(2, '0')}`
      units.push({
        id: `jazz-${code.toLowerCase()}`,
        developmentId: JAZZ_DEV_ID,
        kind: 'apartment',
        code,
        title: `Apartamento ${code}`,
        tower,
        floor,
        unitNumber: `${floor}0${pos}`,
        privateAreaM2: planDef.privateAreaM2,
        totalAreaM2: planDef.totalAreaM2,
        bedrooms: planDef.bedrooms,
        suites: planDef.suites,
        bathrooms: planDef.bathrooms,
        parkingSpaces: planDef.parkingSpaces,
        status: seedStatus(floor, pos),
        price: buildUnitPrice(plan, floor),
        priceVisible: true,
        sceneNodeId: `node-jazz-${code.toLowerCase()}`,
        media: {
          floorPlanImage: planDef.floorPlanImage,
          gallery: ['/jazz/renders/living.jpg', '/jazz/renders/kitchen.jpg'],
        },
        commercial: { leadCaptureEnabled: true },
        metadata: { planType: plan },
      })
    }
  }
  return units
}

export const JAZZ_TOWERS: Array<'A' | 'B'> = ['A', 'B']
export const JAZZ_FLOORS = Array.from({ length: 12 }, (_, i) => i + 1)
