export interface Comparable {
  asking_price: number
  area_sqm: number
  offer_factor: number
  area_factor: number
  location_factor: number
  age_factor: number
  floor_factor: number
  parking_factor: number
  extra_factor: number
}

export interface ValuationResult {
  comparables: Array<Comparable & { homogenized_price_per_sqm: number }>
  average_price_per_sqm: number
  median_price_per_sqm: number
  std_deviation: number
  coefficient_of_variation: number
  estimated_value: number
  confidence_grade: 'I' | 'II' | 'III'
}

export function calculateHomogenization(
  comparables: Comparable[],
  subject_area_sqm: number
): ValuationResult {
  const results = comparables.map(comp => {
    const price_per_sqm = comp.asking_price / comp.area_sqm
    const total_factor = comp.offer_factor
      * comp.area_factor
      * comp.location_factor
      * comp.age_factor
      * comp.floor_factor
      * comp.parking_factor
      * comp.extra_factor
    const homogenized = price_per_sqm * total_factor
    return { ...comp, homogenized_price_per_sqm: homogenized }
  })

  const values = results.map(r => r.homogenized_price_per_sqm)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const sorted = [...values].sort((a, b) => a - b)
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)]
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / (values.length - 1)
  const std = Math.sqrt(variance)
  const cv = (std / avg) * 100

  let grade: 'I' | 'II' | 'III' = 'I'
  if (comparables.length >= 5 && cv <= 30) grade = 'II'
  if (comparables.length >= 6 && cv <= 25) grade = 'III'

  return {
    comparables: results,
    average_price_per_sqm: avg,
    median_price_per_sqm: median,
    std_deviation: std,
    coefficient_of_variation: cv,
    estimated_value: avg * subject_area_sqm,
    confidence_grade: grade
  }
}
