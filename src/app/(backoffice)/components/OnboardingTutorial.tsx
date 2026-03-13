'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
    GraduationCap, ChevronRight, RotateCcw,
    BarChart3, Users, Building2, Megaphone, DollarSign,
    Brain, FolderKanban, FileText, Settings, Calendar, Sparkles,
} from 'lucide-react'
import ContextualTooltip from './ContextualTooltip'
import { useContextualOnboarding } from '@/app/(backoffice)/hooks/useContextualOnboarding'
import { MODULES } from '@/app/(backoffice)/lib/onboarding-tips'

// ── Icon map for module menu ─────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
    BarChart3, Users, Building2, Megaphone, DollarSign,
    Brain, FolderKanban, FileText, Settings, Calendar, Sparkles,
}

const STORAGE_KEY = 'imi_onboarding_completed'

// ── Hook: useOnboarding (backward compat for OnboardingWrapper) ──
export function useOnboarding() {
    const [isActive, setIsActive] = useState(false)
    const [hasCompleted, setHasCompleted] = useState(true)

    useEffect(() => {
        const completed = localStorage.getItem(STORAGE_KEY) === 'true'
        setHasCompleted(completed)
    }, [])

    const startTutorial = useCallback(() => setIsActive(true), [])
    const closeTutorial = useCallback(() => {
        setIsActive(false)
        localStorage.setItem(STORAGE_KEY, 'true')
        setHasCompleted(true)
    }, [])
    const resetTutorial = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY)
        setHasCompleted(false)
        setIsActive(true)
    }, [])

    return { isActive, hasCompleted, startTutorial, closeTutorial, resetTutorial }
}

// ── Component: OnboardingTutorial ────────────────────────────
// Now renders contextual tooltips instead of a centered modal.
// The `isActive` / `onClose` props come from OnboardingWrapper
// and control the module-selection menu. The actual tooltip tour
// is driven by useContextualOnboarding.
export default function OnboardingTutorial({
    isActive: menuOpen,
    onClose: closeMenu,
}: {
    isActive: boolean
    onClose: () => void
}) {
    const pathname = usePathname()
    const ctx = useContextualOnboarding()

    // When the module menu is opened and there are tips for the current route,
    // auto-start contextual tips for the current module
    const handleStartCurrentModule = useCallback(() => {
        ctx.startModuleTour()
        closeMenu()
    }, [ctx, closeMenu])

    const handleResetAll = useCallback(() => {
        ctx.resetAll()
        closeMenu()
    }, [ctx, closeMenu])

    const handleStartModule = useCallback((mod: string) => {
        ctx.startModuleTour(mod)
        closeMenu()
    }, [ctx, closeMenu])

    return (
        <>
            {/* ── Contextual Tooltip Engine ─────────────────── */}
            <ContextualTooltip
                tip={ctx.currentTip}
                isActive={ctx.isActive}
                currentIndex={ctx.currentTipIndex}
                totalTips={ctx.totalTips}
                onNext={ctx.nextTip}
                onPrev={ctx.prevTip}
                onSkip={ctx.skipAll}
            />

            {/* ── Module Selection Menu (opens from navbar trigger) ── */}
            <AnimatePresence>
                {menuOpen && !ctx.isActive && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9997]"
                            style={{ background: 'rgba(0,0,0,0.4)' }}
                            onClick={closeMenu}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                            className="fixed z-[9998] right-4 top-16 w-80 max-h-[80vh] overflow-y-auto rounded-2xl"
                            style={{
                                background: 'var(--bo-surface)',
                                border: '1px solid var(--bo-border)',
                                boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-4 pt-4 pb-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <GraduationCap size={14} style={{ color: 'var(--bo-accent)' }} />
                                    <span className="text-xs font-bold" style={{ color: 'var(--bo-text)' }}>
                                        Tours Guiados
                                    </span>
                                </div>
                                <p className="text-[10px] leading-relaxed" style={{ color: 'var(--bo-text-muted)' }}>
                                    Selecione um módulo para ver dicas contextuais
                                </p>
                            </div>

                            {/* Current module shortcut */}
                            {ctx.currentModule && ctx.totalTips > 0 && (
                                <div className="px-3 pb-2">
                                    <button
                                        onClick={handleStartCurrentModule}
                                        className="w-full h-10 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all hover:brightness-110"
                                        style={{ background: 'var(--bo-accent)' }}
                                    >
                                        <Sparkles size={12} />
                                        Tour desta página ({ctx.totalTips} dicas)
                                    </button>
                                </div>
                            )}

                            {/* Module list */}
                            <div className="px-2 pb-2">
                                {Object.entries(MODULES).map(([key, mod]) => {
                                    const Icon = ICON_MAP[mod.icon] || FileText
                                    const isCurrent = ctx.currentModule === key
                                    const isDone = typeof window !== 'undefined' &&
                                        localStorage.getItem(`imi_tips_${key}_done`) === 'true'

                                    return (
                                        <button
                                            key={key}
                                            onClick={() => handleStartModule(key)}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/5"
                                            style={{
                                                opacity: isCurrent ? 1 : 0.7,
                                            }}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{
                                                    background: isDone ? 'var(--bo-success)' : 'var(--bo-elevated)',
                                                    color: isDone ? '#fff' : 'var(--bo-text-muted)',
                                                }}
                                            >
                                                <Icon size={14} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-semibold block" style={{ color: 'var(--bo-text)' }}>
                                                    {mod.label}
                                                </span>
                                                {isDone && (
                                                    <span className="text-[9px]" style={{ color: 'var(--bo-success)' }}>
                                                        Concluído
                                                    </span>
                                                )}
                                            </div>
                                            <ChevronRight size={12} style={{ color: 'var(--bo-text-muted)' }} />
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Footer */}
                            <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid var(--bo-border)' }}>
                                <button
                                    onClick={handleResetAll}
                                    className="w-full h-9 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-colors hover:bg-white/5"
                                    style={{ color: 'var(--bo-text-muted)' }}
                                >
                                    <RotateCcw size={10} />
                                    Resetar todos os tours
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

// ── Trigger Button (for navbar) ──────────────────────────────
export function OnboardingTrigger({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 h-9 px-3 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
            style={{
                background: 'var(--bo-elevated)',
                border: '1px solid var(--bo-border)',
                color: 'var(--bo-text-muted)',
            }}
            title="Tours Guiados"
        >
            <GraduationCap size={14} />
            <span className="hidden sm:inline">Tour</span>
        </button>
    )
}
