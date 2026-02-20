import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DesktopSidebar from './components/DesktopSidebar'
import DesktopHeader from './components/DesktopHeader'
import { MobileBottomNav } from './components/MobileBottomNav'
import { CommandPalette } from '@/components/backoffice/CommandPalette'
import { Toaster } from 'sonner'

export default async function BackofficeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Auth check
    const supabase = await createClient()
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-imi-50">
            {/* Material Symbols Outlined Font (Backup for legacy components) */}
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
            />

            {/* Desktop Sidebar */}
            <DesktopSidebar />

            {/* Desktop Header */}
            <DesktopHeader />

            {/* Main Content Area */}
            <main className="lg:pl-64 lg:pt-16">
                <div className="p-6 pb-24 lg:pb-6">
                    {children}
                </div>
            </main>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />

            {/* System UI Infrastructure */}
            <CommandPalette />
            <Toaster position="top-right" richColors theme="system" closeButton />
        </div>
    )
}
