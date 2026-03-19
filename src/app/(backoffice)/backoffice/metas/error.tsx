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
        style={{ color: 'var(--bo-warning, #F59E0B)', opacity: 0.6 }}
      />
      <h2 style={{
        color: 'var(--bo-text, #F0ECE4)',
        fontSize: 18,
        fontWeight: 600,
        fontFamily: 'var(--font-outfit, sans-serif)',
        margin: 0,
      }}>
        Algo deu errado
      </h2>
      <p style={{
        color: 'var(--bo-text-muted, #8A95A5)',
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
          background: 'var(--bo-accent, #C8A44A)',
          color: '#0B1928',
          border: 'none',
          borderRadius: 6,
          padding: '10px 20px',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'var(--font-outfit, sans-serif)',
          cursor: 'pointer',
        }}
      >
        Tentar Novamente
      </button>
    </div>
  )
}
