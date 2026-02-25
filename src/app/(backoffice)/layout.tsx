import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DesktopSidebar } from './components/DesktopSidebar'
import DesktopHeader from './components/DesktopHeader'
import { MobileBottomNav } from './components/MobileBottomNav'
import { CommandPalette } from '@/components/backoffice/CommandPalette'
import { Toaster } from 'sonner'

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
            <DesktopSidebar />
            <DesktopHeader />

            {/* Main Content — mobile padding handled by globals-b11-additions.css */}
            <main className="lg:pl-60 lg:pt-16 min-h-screen">
                <div className="p-4 lg:p-6">
                    {children}
                </div>
            </main>

            <MobileBottomNav />
            <CommandPalette />
            <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                    style: {
                        background: 'var(--bo-elevated)',
                        border: '1px solid var(--bo-border-gold)',
                        color: 'var(--bo-text)',
                    },
                }}
            />
        </div>
    )
}
