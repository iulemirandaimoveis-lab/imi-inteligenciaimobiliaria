const STATS = [
  { value: '17+', label: 'Imóveis Premium' },
  { value: '5+', label: 'Anos de Mercado' },
  { value: '98%', label: 'Satisfação' },
  { value: 'R$ 50M+', label: 'Em Avaliações' },
]

export default function Stats() {
  return (
    <section style={{ padding: '48px 24px', background: 'var(--imi-navy-800)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            padding: '32px 24px',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--r-xl)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {STATS.map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 28,
                  fontWeight: 700,
                  color: 'var(--imi-gold-500)',
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  marginTop: 4,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
