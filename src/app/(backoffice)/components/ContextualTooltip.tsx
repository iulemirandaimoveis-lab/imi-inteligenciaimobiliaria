'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react'
import type { ContextualTip } from '@/app/(backoffice)/lib/onboarding-tips'

interface ContextualTooltipProps {
    tip: ContextualTip | null
    isActive: boolean
    currentIndex: number
    totalTips: number
    onNext: () => void
    onPrev: () => void
    onSkip: () => void
}

interface Position {
    top: number
    left: number
    arrowSide: 'top' | 'bottom' | 'left' | 'right'
    spotlightRect: DOMRect | null
}

const TOOLTIP_W = 300
const TOOLTIP_H = 180 // approximate
const ARROW_SIZE = 8
const GAP = 12

function calculatePosition(
    targetRect: DOMRect,
    preferred: 'top' | 'bottom' | 'left' | 'right'
): Position {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const pad = 16

    let top = 0
    let left = 0
    let arrowSide = preferred

    switch (preferred) {
        case 'bottom':
            top = targetRect.bottom + GAP + ARROW_SIZE
            left = targetRect.left + targetRect.width / 2 - TOOLTIP_W / 2
            if (top + TOOLTIP_H > vh - pad) { arrowSide = 'top'; top = targetRect.top - TOOLTIP_H - GAP - ARROW_SIZE }
            break
        case 'top':
            top = targetRect.top - TOOLTIP_H - GAP - ARROW_SIZE
            left = targetRect.left + targetRect.width / 2 - TOOLTIP_W / 2
            if (top < pad) { arrowSide = 'bottom'; top = targetRect.bottom + GAP + ARROW_SIZE }
            break
        case 'right':
            top = targetRect.top + targetRect.height / 2 - TOOLTIP_H / 2
            left = targetRect.right + GAP + ARROW_SIZE
            if (left + TOOLTIP_W > vw - pad) { arrowSide = 'left'; left = targetRect.left - TOOLTIP_W - GAP - ARROW_SIZE }
            break
        case 'left':
            top = targetRect.top + targetRect.height / 2 - TOOLTIP_H / 2
            left = targetRect.left - TOOLTIP_W - GAP - ARROW_SIZE
            if (left < pad) { arrowSide = 'right'; left = targetRect.right + GAP + ARROW_SIZE }
            break
    }

    // Clamp within viewport
    left = Math.max(pad, Math.min(left, vw - TOOLTIP_W - pad))
    top = Math.max(pad, Math.min(top, vh - TOOLTIP_H - pad))

    return { top, left, arrowSide, spotlightRect: targetRect }
}

export default function ContextualTooltip({
    tip,
    isActive,
    currentIndex,
    totalTips,
    onNext,
    onPrev,
    onSkip,
}: ContextualTooltipProps) {
    const [pos, setPos] = useState<Position | null>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)

    // Calculate position based on target element
    const updatePosition = useCallback(() => {
        if (!tip) { setPos(null); return }

        const el = document.querySelector(tip.targetSelector)
        if (!el) {
            // Target not found — show centered fallback
            setPos({
                top: window.innerHeight / 2 - TOOLTIP_H / 2,
                left: window.innerWidth / 2 - TOOLTIP_W / 2,
                arrowSide: 'bottom',
                spotlightRect: null,
            })
            return
        }

        const rect = el.getBoundingClientRect()
        setPos(calculatePosition(rect, tip.position))

        // Scroll element into view if needed
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            setTimeout(() => {
                const newRect = el.getBoundingClientRect()
                setPos(calculatePosition(newRect, tip.position))
            }, 400)
        }
    }, [tip])

    useEffect(() => {
        if (!isActive || !tip) { setPos(null); return }
        // Small delay to let DOM render
        const timer = setTimeout(updatePosition, 100)
        window.addEventListener('resize', updatePosition)
        window.addEventListener('scroll', updatePosition, true)
        return () => {
            clearTimeout(timer)
            window.removeEventListener('resize', updatePosition)
            window.removeEventListener('scroll', updatePosition, true)
        }
    }, [isActive, tip, updatePosition])

    // Keyboard shortcuts
    useEffect(() => {
        if (!isActive) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onSkip()
            if (e.key === 'ArrowRight' || e.key === 'Enter') onNext()
            if (e.key === 'ArrowLeft') onPrev()
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [isActive, onNext, onPrev, onSkip])

    if (!isActive || !tip || !pos) return null

    const isLast = currentIndex === totalTips - 1
    const isFirst = currentIndex === 0

    return (
        <>
            {/* Backdrop with spotlight cutout */}
            <div
                className="fixed inset-0 z-[9998] transition-opacity"
                style={{
                    background: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(2px)',
                }}
                onClick={onSkip}
            />

            {/* Spotlight on target */}
            {pos.spotlightRect && (
                <div
                    className="fixed z-[9999] rounded-xl pointer-events-none"
                    style={{
                        top: pos.spotlightRect.top - 4,
                        left: pos.spotlightRect.left - 4,
                        width: pos.spotlightRect.width + 8,
                        height: pos.spotlightRect.height + 8,
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.45), 0 0 20px rgba(59,130,246,0.3)',
                        border: '2px solid var(--bo-accent)',
                    }}
                />
            )}

            {/* Tooltip card */}
            <AnimatePresence mode="wait">
                <motion.div
                    ref={tooltipRef}
                    key={tip.id}
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                    className="fixed z-[10000]"
                    style={{
                        top: pos.top,
                        left: pos.left,
                        width: TOOLTIP_W,
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div
                        className="rounded-2xl overflow-hidden"
                        style={{
                            background: 'var(--bo-surface)',
                            border: '1px solid var(--bo-border)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 pt-3 pb-1">
                            <div className="flex items-center gap-1.5">
                                <Lightbulb size={11} style={{ color: 'var(--bo-accent)' }} />
                                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--bo-text-muted)' }}>
                                    Dica {currentIndex + 1}/{totalTips}
                                </span>
                            </div>
                            <button
                                onClick={onSkip}
                                className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                                style={{ color: 'var(--bo-text-muted)' }}
                            >
                                <X size={12} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="px-4 pb-3">
                            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--bo-text)' }}>
                                {tip.title}
                            </h3>
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--bo-text-muted)' }}>
                                {tip.description}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 pb-3 pt-1"
                            style={{ borderTop: '1px solid var(--bo-border)' }}>
                            {/* Dots */}
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalTips }, (_, i) => (
                                    <div
                                        key={i}
                                        className="rounded-full transition-all"
                                        style={{
                                            width: i === currentIndex ? 14 : 5,
                                            height: 5,
                                            background: i <= currentIndex ? 'var(--bo-accent)' : 'var(--bo-border)',
                                            opacity: i <= currentIndex ? 1 : 0.4,
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-1.5">
                                {!isFirst && (
                                    <button
                                        onClick={onPrev}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5"
                                        style={{ color: 'var(--bo-text-muted)' }}
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                )}
                                <button
                                    onClick={onNext}
                                    className="h-7 px-3 rounded-lg text-[11px] font-bold text-white flex items-center gap-1 transition-all hover:brightness-110"
                                    style={{ background: 'var(--bo-accent)' }}
                                >
                                    {isLast ? 'Entendi!' : 'Próximo'}
                                    {!isLast && <ChevronRight size={12} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </>
    )
}
