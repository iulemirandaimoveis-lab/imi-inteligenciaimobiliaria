import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 12,
    }}>
      <Loader2
        size={24}
        style={{
          color: 'var(--bo-accent, #C8A44A)',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span style={{
        color: 'var(--bo-text-muted, #8A95A5)',
        fontSize: 14,
        fontFamily: 'var(--font-outfit, sans-serif)',
      }}>
        Carregando...
      </span>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
