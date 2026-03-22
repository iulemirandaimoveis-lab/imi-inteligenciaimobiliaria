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
import PWAManager from './components/PWAManager'

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
                <main className="pt-16 lg:pt-16 lg:pl-60 min-h-screen overflow-x-hidden" style={{ maxWidth: '100%' }}>
                    <div className="p-4 pb-32 lg:p-6 lg:pb-6">
                        <ErrorBoundary>
                            <BackofficeRealtimeProvider>
                                {children}
                            </BackofficeRealtimeProvider>
                        </ErrorBoundary>
                    </div>
                </main>

                <MobileBottomNav />
                <PWAManager />
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
                        background: 'var(--bg-elevated)',
                        border: '1px solid rgba(61,111,255,0.20)',
                        color: 'var(--text-primary)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        borderRadius: 'var(--r-lg, 4px)',
                    },
                }}
            />
        </div>
    )
}
