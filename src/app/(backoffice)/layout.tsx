'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/backoffice/Sidebar';
import MobileHeader from '@/components/backoffice/MobileHeader';
import MobileBottomNav from '@/components/backoffice/MobileBottomNav';
import DesktopHeader from '@/components/backoffice/DesktopHeader';
import { CommandPalette } from '@/components/backoffice/CommandPalette';
import { Toaster } from 'sonner';

export default function BackofficeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const supabase = createClient();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Verificar autenticação
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            }
        };
        checkAuth();

        // Listener para mudanças de auth
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                router.push('/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [router, supabase]);

    if (!mounted) {
        return null; // or a loading skeleton
    }

    return (
        <>
            {/* Material Symbols Outlined Font */}
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
            />

            <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans text-text-body-light dark:text-text-body-dark transition-colors duration-500 selection:bg-primary/20 selection:text-primary-dark">
                {/* Desktop Sidebar & Background Pattern */}
                <div className="fixed inset-0 z-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>

                <Sidebar />

                <div className="lg:pl-72 flex flex-col min-h-screen transition-all duration-300 relative z-10 w-full">
                    {/* Mobile Header (Hidden on LG) */}
                    <div className="lg:hidden">
                        <MobileHeader />
                    </div>

                    {/* Desktop Header */}
                    <DesktopHeader />

                    {/* Main Content */}
                    <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-32 max-w-8xl mx-auto w-full animate-fade-in">
                        {children}
                    </main>

                    {/* Mobile Bottom Navigation (Hidden on LG) */}
                    <div className="lg:hidden">
                        <MobileBottomNav />
                    </div>
                </div>

                <CommandPalette />
                <Toaster position="top-right" richColors theme="system" closeButton />
            </div>
        </>
    );
}
