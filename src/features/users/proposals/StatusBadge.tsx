'use client'

import { tokens as T } from '../ui/tokens'
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_TONE, type ProposalStatus } from '@/lib/imi-proposals/status'

const TONE_STYLE: Record<string, { fg: string; bg: string; border: string }> = {
  neutral: { fg: T.t2, bg: 'rgba(255,255,255,0.05)', border: T.glassBorder },
  blue: { fg: T.blue, bg: T.blueSoft, border: 'rgba(96,165,250,0.25)' },
  amber: { fg: T.amber, bg: T.amberSoft, border: 'rgba(251,191,36,0.25)' },
  green: { fg: T.green, bg: T.greenSoft, border: T.greenBorder },
  red: { fg: T.red, bg: T.redSoft, border: T.redBorder },
}

export function StatusBadge({ status, size = 'md' }: { status: ProposalStatus; size?: 'sm' | 'md' }) {
  const tone = TONE_STYLE[PROPOSAL_STATUS_TONE[status]] ?? TONE_STYLE.neutral
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: size === 'sm' ? '3px 8px' : '4px 10px',
        borderRadius: 99,
        fontFamily: T.fSans,
        fontSize: size === 'sm' ? 10.5 : 11.5,
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: tone.fg,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: tone.fg }} />
      {PROPOSAL_STATUS_LABELS[status]}
    </span>
  )
}
