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
            className="backoffice-root min-h-screen transition-colors duration-200 bg-slate-50 dark:bg-[#0D0F14] text-slate-900 dark:text-slate-50"
        >
            <DesktopSidebar />
            <DesktopHeader />

            {/* Main Content */}
            <main className="lg:pl-60 lg:pt-16">
                <div
                    className="p-4 pb-28 lg:p-6 lg:pb-8"
                    style={{ minHeight: '100vh' }}
                >
                    {children}
                </div>
            </main>

            <MobileBottomNav />
            <CommandPalette />
            <Toaster
                position="top-right"
                richColors
                theme="dark"
                closeButton
                toastOptions={{
                    style: {
                        background: '#1A1E2A',
                        border: '1px solid rgba(196,157,91,0.25)',
                        color: '#F0F2F5',
                    },
                }}
            />
        </div>
    )
}
