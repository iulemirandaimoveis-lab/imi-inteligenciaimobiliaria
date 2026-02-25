export function LoadingSkeleton({ count = 1 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="animate-pulse rounded-xl h-32 w-full"
                    style={{
                        background: 'linear-gradient(90deg, var(--bo-elevated) 0%, var(--bo-surface) 50%, var(--bo-elevated) 100%)',
                    }}
                />
            ))}
        </>
    );
}
