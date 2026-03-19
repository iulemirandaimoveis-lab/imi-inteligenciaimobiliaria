export default function Loading() {
  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            height: 140, borderRadius: 6, background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)', animation: 'pulse 1.5s ease-in-out infinite',
            opacity: 0.6,
          }} />
        ))}
      </div>
    </div>
  )
}
