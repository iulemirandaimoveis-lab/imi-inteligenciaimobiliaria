import { z } from 'zod'

const BLOCKED_PATTERNS = [
  /eval\s*\(/i,
  /require\s*\(/i,
  /import\s*\(/i,
  /process\./i,
  /child_process/i,
  /__dirname/i,
  /fs\./i,
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i,
]

const PRICE_LEAK_PATTERNS = [
  /preço|price|valor|custo|reais|r\$|usd|brl/i,
  /lead|cliente|comprador|vendedor|corretor|broker/i,
  /reserva|contrato|proposta|pagamento/i,
]

export function sanitizePrompt(prompt: string): { safe: boolean; reason?: string; sanitized: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(prompt)) {
      return { safe: false, reason: `Prompt contém padrão bloqueado: ${pattern}`, sanitized: '' }
    }
  }

  let sanitized = prompt
    .replace(/[<>]/g, '')
    .replace(/`/g, "'")
    .trim()

  const priceLeak = PRICE_LEAK_PATTERNS.find(p => p.test(sanitized))
  if (priceLeak) {
    sanitized = sanitized.replace(priceLeak, '[omitido]')
  }

  if (sanitized.length > 2000) {
    sanitized = sanitized.slice(0, 2000)
  }

  return { safe: true, sanitized }
}

export const CadApiRequestSchema = z.object({
  prompt: z.string().min(10).max(2000),
  projectType: z.enum(['subdivision', 'building', 'floorplan', 'unit', 'amenity']).optional(),
  templateId: z.string().max(64).optional(),
  constraints: z.object({
    width: z.number().positive().max(10000).optional(),
    depth: z.number().positive().max(10000).optional(),
    areaM2: z.number().positive().max(100000).optional(),
    floors: z.number().int().min(1).max(100).optional(),
    unitsPerFloor: z.number().int().min(1).max(50).optional(),
    lots: z.number().int().min(1).max(5000).optional(),
    streetWidth: z.number().positive().max(100).optional(),
    bedrooms: z.number().int().min(0).max(20).optional(),
    parkingSpaces: z.number().int().min(0).max(1000).optional(),
  }).optional(),
  developmentId: z.string().uuid().optional(),
})
export type CadApiRequest = z.infer<typeof CadApiRequestSchema>
