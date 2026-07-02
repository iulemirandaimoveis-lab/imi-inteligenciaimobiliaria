'use client'

import { MotionConfig } from 'framer-motion'

/**
 * Respeita prefers-reduced-motion do sistema em TODAS as animações
 * framer-motion da árvore (transform/layout viram instantâneos para quem
 * pediu movimento reduzido). Ver docs/ACCESSIBILITY_REPORT.md A-01.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
