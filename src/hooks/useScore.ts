/**
 * IMI Score System — DS v6 Unified
 * Single source of truth for score colors, labels, tiers.
 */
export type ScoreTier = 'hot' | 'warm' | 'neutral' | 'cold' | 'inactive'

export interface ScoreStyle {
  color: string
  bg: string
  label: string
  tier: ScoreTier
}

/** Pure function — use anywhere (components and utilities) */
export function getScoreStyle(score: number): ScoreStyle {
  if (score >= 80) return { color: '#FF4D6A', bg: 'rgba(255,77,106,0.15)',  label: 'HOT',     tier: 'hot'      }
  if (score >= 65) return { color: '#F0B429', bg: 'rgba(240,180,41,0.15)',  label: 'QUENTE',  tier: 'warm'     }
  if (score >= 50) return { color: '#5B9BD5', bg: 'rgba(91,155,213,0.15)', label: 'NEUTRO',  tier: 'neutral'  }
  if (score >= 35) return { color: '#8899BB', bg: 'rgba(136,153,187,0.15)', label: 'FRIO',    tier: 'cold'     }
  return               { color: '#4A5A7A', bg: 'rgba(74,90,122,0.15)',   label: 'INATIVO', tier: 'inactive' }
}

/** React hook alias */
export function useScore(score: number): ScoreStyle {
  return getScoreStyle(score)
}
