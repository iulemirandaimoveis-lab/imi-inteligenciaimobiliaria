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
import { Toaster } from 'sonner'
import { BackofficeRealtimeProvider } from './components/BackofficeRealtimeProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import OnboardingWrapper from './components/OnboardingWrapper'
import PWAManager from './components/PWAManager'

export const metadata: Metadata = {
    title: {
        default: 'IMI Backoffice',
        template: '%s | IMI Backoffice',
    },
    description: 'IMI — Inteligência Imobiliária | Backoffice',
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
                            <BackofficeRealtimeProvider>
                                <SwipeablePageWrapper>
                                    {children}
                                </SwipeablePageWrapper>
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
                closeButton
                theme="dark"
                offset={72}
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: 'var(--imi-navy-900, #0B1120)',
                        border: '1px solid var(--imi-gold-700, #8A6820)',
                        borderLeft: '3px solid var(--imi-gold-500, #B8943A)',
                        color: 'var(--imi-gold-100, #F4EACC)',
                        fontFamily: 'var(--font-sans)',
                        fontSize: '13px',
                        borderRadius: 'var(--r-lg, 14px)',
                        boxShadow: '0 10px 25px -5px rgba(11, 17, 32, 0.5), 0 0 15px -3px rgba(200, 164, 74, 0.1)',
                    },
                    classNames: {
                        success: 'imi-toast-success',
                        error: 'imi-toast-error',
                        info: 'imi-toast-info',
                        closeButton: 'imi-toast-close',
                    },
                }}
            />
        </div>
    )
}
