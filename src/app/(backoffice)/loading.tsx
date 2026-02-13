'use client';

export default function Loading() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-6">
            <div className="relative">
                <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-white/5 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-xl border-4 border-primary/20 border-t-primary animate-spin" />
                </div>
            </div>
            <div className="space-y-3 flex flex-col items-center">
                <div className="h-4 w-32 bg-gray-100 dark:bg-white/5 rounded-full animate-pulse" />
                <div className="h-3 w-48 bg-gray-50 dark:bg-white/5 rounded-full animate-pulse" />
            </div>
        </div>
    );
}
