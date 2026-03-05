'use client';

export default function Loading() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-6">
            <div className="relative">
                <div className="w-16 h-16 rounded-3xl animate-pulse" style={{ background: 'var(--bo-elevated)' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-xl border-4 border-primary/20 border-t-primary animate-spin" />
                </div>
            </div>
            <div className="space-y-3 flex flex-col items-center">
                <div className="h-4 w-32 rounded-full animate-pulse" style={{ background: 'var(--bo-elevated)' }} />
                <div className="h-3 w-48 rounded-full animate-pulse" style={{ background: 'var(--bo-elevated)' }} />
            </div>
        </div>
    );
}
