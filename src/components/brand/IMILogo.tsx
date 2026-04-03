'use client'
interface IMILogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  className?: string
}
export default function IMILogo({ size = 'md', showTagline = true, className = '' }: IMILogoProps) {
  const sizes = { sm: { text: 16, tag: 9, sep: 20, gap: 8 }, md: { text: 20, tag: 11, sep: 28, gap: 10 }, lg: { text: 28, tag: 13, sep: 36, gap: 12 } }
  const s = sizes[size]
  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: s.gap }}>
      <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 700, fontSize: s.text, color: 'var(--text-primary)', letterSpacing: '2px', lineHeight: 1 }}>IMI</span>
      {showTagline && (
        <>
          <div style={{ width: 1, height: s.sep, background: 'var(--text-gold, #C8A44A)', flexShrink: 0 }} />
          <span style={{ fontSize: s.tag, fontWeight: 600, letterSpacing: '2.5px', textTransform: 'uppercase' as const, color: 'var(--text-gold, #C8A44A)', lineHeight: 1.45 }}>
            INTELIGÊNCIA<br />IMOBILIÁRIA
          </span>
        </>
      )}
    </div>
  )
}
