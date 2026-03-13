'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { getTipsForRoute, getModuleForRoute } from '@/app/(backoffice)/lib/onboarding-tips'
import type { ContextualTip } from '@/app/(backoffice)/lib/onboarding-tips'

const STORAGE_PREFIX = 'imi_tips_'

function isModuleCompleted(module: string): boolean {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(`${STORAGE_PREFIX}${module}_done`) === 'true'
}

function markModuleCompleted(module: string) {
    localStorage.setItem(`${STORAGE_PREFIX}${module}_done`, 'true')
}

function clearAllModules() {
    if (typeof window === 'undefined') return
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key)
    })
}

export function useContextualOnboarding() {
    const pathname = usePathname()
    const [currentTipIndex, setCurrentTipIndex] = useState(0)
    const [isActive, setIsActive] = useState(false)
    const [tips, setTips] = useState<ContextualTip[]>([])
    const [currentModule, setCurrentModule] = useState<string | null>(null)

    // When route changes, check if there are tips for this route
    useEffect(() => {
        const module = getModuleForRoute(pathname)
        const routeTips = getTipsForRoute(pathname)

        setCurrentModule(module)
        setTips(routeTips)
        setCurrentTipIndex(0)

        if (module && routeTips.length > 0 && !isModuleCompleted(module)) {
            // Auto-trigger after brief delay on first visit
            const timer = setTimeout(() => setIsActive(true), 1200)
            return () => clearTimeout(timer)
        } else {
            setIsActive(false)
        }
    }, [pathname])

    const currentTip = tips[currentTipIndex] ?? null

    const nextTip = useCallback(() => {
        if (currentTipIndex < tips.length - 1) {
            setCurrentTipIndex(prev => prev + 1)
        } else {
            // Module complete
            if (currentModule) markModuleCompleted(currentModule)
            setIsActive(false)
        }
    }, [currentTipIndex, tips.length, currentModule])

    const prevTip = useCallback(() => {
        if (currentTipIndex > 0) setCurrentTipIndex(prev => prev - 1)
    }, [currentTipIndex])

    const skipAll = useCallback(() => {
        if (currentModule) markModuleCompleted(currentModule)
        setIsActive(false)
    }, [currentModule])

    const startModuleTour = useCallback((module?: string) => {
        const mod = module || currentModule
        if (!mod) return
        const routeTips = getTipsForRoute(pathname)
        if (routeTips.length > 0) {
            setTips(routeTips)
            setCurrentTipIndex(0)
            setIsActive(true)
            // Clear completed flag to allow re-tour
            localStorage.removeItem(`${STORAGE_PREFIX}${mod}_done`)
        }
    }, [currentModule, pathname])

    const resetAll = useCallback(() => {
        clearAllModules()
        setCurrentTipIndex(0)
        const routeTips = getTipsForRoute(pathname)
        if (routeTips.length > 0) {
            setTips(routeTips)
            setIsActive(true)
        }
    }, [pathname])

    return {
        isActive,
        currentTip,
        currentTipIndex,
        totalTips: tips.length,
        currentModule,
        nextTip,
        prevTip,
        skipAll,
        startModuleTour,
        resetAll,
    }
}
