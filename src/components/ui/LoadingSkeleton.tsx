export function LoadingSkeleton({ count = 1 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-xl h-32 w-full"
                    style={{
                        background: 'linear-gradient(90deg, var(--bg-elevated) 0%, var(--bg-surface) 50%, var(--bg-elevated) 100%)',
                    }}
                />
            ))}
        </>
    );
}
