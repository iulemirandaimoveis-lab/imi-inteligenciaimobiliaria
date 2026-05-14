import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Backoffice needs force-dynamic because it uses cookies() for auth
export const dynamic = 'force-dynamic'
import { DesktopSidebar } from './components/DesktopSidebar'
import DesktopHeader from './components/DesktopHeader'
import MobileHeader from './components/MobileHeader'
import { MobileBottomNav } from './components/MobileBottomNav'
import { CommandPalette } from '@/components/backoffice/CommandPalette'
import { SwipeablePageWrapper } from '@/components/backoffice/SwipeablePageWrapper'
import { BackofficeToaster } from './components/BackofficeToaster'
import { BackofficeRealtimeProvider } from './components/BackofficeRealtimeProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import OnboardingWrapper from './components/OnboardingWrapper'
import PWAManager from './components/PWAManager'
import PresenceWrapper from './components/PresenceWrapper'

export const metadata: Metadata = {
    title: {
        default: 'IMI Backoffice',
        template: '%s | IMI Backoffice',
    },
    description: 'IMI — Inteligência Imobiliária | Backoffice',
    manifest: '/manifest-backoffice.json',
}

export default async function BackofficeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <div
            className="backoffice-root min-h-screen transition-colors duration-200"
            style={{
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)',
            }}
        >
            <OnboardingWrapper>
                <DesktopSidebar />
                <DesktopHeader />
                <MobileHeader />

                {/* Main Content — pt-16 on mobile (extra breathing room for notch/dynamic island), lg:pt-16 for DesktopHeader */}
                <main className="pt-[calc(56px+env(safe-area-inset-top,0px))] lg:pt-16 lg:pl-60 min-h-screen overflow-x-hidden" style={{ maxWidth: '100%' }}>
                    <div className="px-3 pt-3 pb-24 sm:px-4 sm:pt-4 lg:px-6 lg:pt-6 lg:pb-6">
                        <ErrorBoundary>
                            <PresenceWrapper>
                                <BackofficeRealtimeProvider>
                                    <SwipeablePageWrapper>
                                        {children}
                                    </SwipeablePageWrapper>
                                </BackofficeRealtimeProvider>
                            </PresenceWrapper>
                        </ErrorBoundary>
                    </div>
                </main>

                <MobileBottomNav />
                <PWAManager />
                <CommandPalette />
            </OnboardingWrapper>
            <BackofficeToaster />
        </div>
    )
}
