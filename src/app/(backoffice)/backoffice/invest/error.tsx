'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error for monitoring
  }, [error])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 16,
      padding: '0 24px',
      textAlign: 'center',
    }}>
      <AlertTriangle
        size={40}
        style={{ color: 'var(--warning, #F59E0B)', opacity: 0.6 }}
      />
      <h2 style={{
        color: 'var(--text-primary, #F0ECE4)',
        fontSize: 18,
        fontWeight: 600,
        fontFamily: 'var(--font-outfit, sans-serif)',
        margin: 0,
      }}>
        Algo deu errado
      </h2>
      <p style={{
        color: 'var(--text-secondary, #8A95A5)',
        fontSize: 14,
        fontFamily: 'var(--font-outfit, sans-serif)',
        margin: 0,
        maxWidth: 400,
      }}>
        Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
      </p>
      <button
        onClick={reset}
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--n, #0A1624)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 6,
          padding: '12px 22px',
          fontFamily: "var(--fu, 'Outfit', sans-serif)",
          fontWeight: 600,
          fontSize: 11,
          letterSpacing: '1px',
          textTransform: 'uppercase' as const,
          cursor: 'pointer',
        }}
      >
        Tentar Novamente
        <span style={{
          position: 'absolute', bottom: 0, left: '12%', right: '12%',
          height: 2, background: 'linear-gradient(90deg, transparent, #C8A44A, transparent)',
          opacity: 0.6, pointerEvents: 'none' as const,
        }} />
      </button>
    </div>
  )
}
