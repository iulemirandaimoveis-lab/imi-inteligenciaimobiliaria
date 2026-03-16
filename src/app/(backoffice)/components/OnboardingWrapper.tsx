'use client'

import OnboardingTutorial, { useOnboarding, OnboardingTrigger } from './OnboardingTutorial'
import { createContext, useContext } from 'react'

interface OnboardingContextValue {
    startTutorial: () => void
    hasCompleted: boolean
}

const OnboardingContext = createContext<OnboardingContextValue>({
    startTutorial: () => {},
    hasCompleted: true,
})

export function useOnboardingContext() {
    return useContext(OnboardingContext)
}

export default function OnboardingWrapper({ children }: { children: React.ReactNode }) {
    const { isActive, hasCompleted, startTutorial, closeTutorial } = useOnboarding()

    return (
        <OnboardingContext.Provider value={{ startTutorial, hasCompleted }}>
            {children}
            <OnboardingTutorial isActive={isActive} onClose={closeTutorial} />
        </OnboardingContext.Provider>
    )
}

export { OnboardingTrigger }
