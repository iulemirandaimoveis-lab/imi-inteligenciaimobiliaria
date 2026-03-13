import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DesktopSidebar } from './components/DesktopSidebar'
import DesktopHeader from './components/DesktopHeader'
import MobileHeader from './components/MobileHeader'
import { MobileBottomNav } from './components/MobileBottomNav'
import { CommandPalette } from '@/components/backoffice/CommandPalette'
import { Toaster } from 'sonner'
import { BackofficeRealtimeProvider } from './components/BackofficeRealtimeProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import OnboardingWrapper from './components/OnboardingWrapper'

export default async function BackofficeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) redirect('/login')

    return (
        <div
            className="backoffice-root min-h-screen transition-colors duration-200"
            style={{
                background: 'var(--bo-surface)',
                color: 'var(--bo-text)',
            }}
        >
            <OnboardingWrapper>
                <DesktopSidebar />
                <DesktopHeader />
                <MobileHeader />

                {/* Main Content — pt-14 on mobile for MobileHeader, lg:pt-16 for DesktopHeader */}
                <main className="pt-14 lg:pt-16 lg:pl-60 min-h-screen overflow-x-hidden" style={{ maxWidth: '100vw' }}>
                    <div className="p-4 pb-28 lg:p-6 lg:pb-6">
                        <ErrorBoundary>
                            <BackofficeRealtimeProvider>
                                {children}
                            </BackofficeRealtimeProvider>
                        </ErrorBoundary>
                    </div>
                </main>

                <MobileBottomNav />
                <CommandPalette />
            </OnboardingWrapper>
            <Toaster
                position="top-right"
                richColors
                closeButton
                theme="dark"
                offset={72}
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'var(--bo-elevated)',
                        border: '1px solid var(--bo-border-gold)',
                        color: 'var(--bo-text)',
                        fontSize: '13px',
                    },
                }}
            />
        </div>
    )
}
