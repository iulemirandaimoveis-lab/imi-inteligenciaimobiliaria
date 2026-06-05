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
    floorPlanImage: '/jazz-boulevard/plants/planta-tipo-a.png',
  },
  'Planta Tipo B': {
    description: '3 dormitórios com 2 suítes, sala de jantar/estar, cozinha integrada e 2 vagas',
    bedrooms: 3, suites: 2, bathrooms: 2, parkingSpaces: 2,
    privateAreaM2: 98.0, totalAreaM2: 112.0,
    floorPlanImage: '/jazz-boulevard/plants/planta-tipo-b.png',
  },
  'Cobertura': {
    description: 'Cobertura duplex com terraço, churrasqueira, 3 suítes e 2 vagas',
    bedrooms: 3, suites: 3, bathrooms: 3, parkingSpaces: 2,
    privateAreaM2: 148.5, totalAreaM2: 178.0,
    floorPlanImage: '/jazz-boulevard/plants/cobertura.png',
  },
}

// Torre A and B use different seeds so their availability distributions differ
const SEED_STATUSES_A: Array<IMIProperty['status']> = [
  'available', 'available', 'available', 'reserved',
  'available', 'available', 'sold', 'available',
  'available', 'reserved', 'available', 'available',
]
const SEED_STATUSES_B: Array<IMIProperty['status']> = [
  'available', 'reserved', 'available', 'available',
  'sold', 'available', 'available', 'available',
  'reserved', 'available', 'sold', 'available',
]

function getPlanType(floor: number, position: number): JazzPlanType {
  if (floor === 12) return 'Cobertura'
  if (position <= 2) return 'Planta Tipo A'
  return 'Planta Tipo B'
}

function seedStatus(tower: 'A' | 'B', floor: number, pos: number): IMIProperty['status'] {
  const seeds = tower === 'A' ? SEED_STATUSES_A : SEED_STATUSES_B
  return seeds[(floor * 3 + pos) % seeds.length]
}

function buildUnitPrice(plan: JazzPlanType, floor: number, position: number): number {
  const base = plan === 'Planta Tipo A' ? 420_000 : plan === 'Planta Tipo B' ? 580_000 : 850_000
  // Each position adds a small premium (better view angle or end-unit advantage)
  const posBonus = (position - 1) * 2_500
  return base + floor * (plan === 'Cobertura' ? 0 : 3_000) + posBonus
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
        status: seedStatus(tower, floor, pos),
        price: buildUnitPrice(plan, floor, pos),
        priceVisible: true,
        sceneNodeId: `node-jazz-${code.toLowerCase()}`,
        media: {
          floorPlanImage: planDef.floorPlanImage,
          gallery: ['/jazz-boulevard/renders/living.jpg', '/jazz-boulevard/renders/kitchen.jpg'],
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
