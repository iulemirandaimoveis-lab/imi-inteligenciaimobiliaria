'use client'

// EmptyState — used when lists have no data
// Usage:
//   <EmptyState
//     icon={<Building2 />}
//     title="Nenhum imóvel"
//     description="Adicione seu primeiro imóvel para começar."
//     action={<button>Novo Imóvel</button>}
//   />

import React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        width: '100%',
      }}
    >
      {icon && (
        <div
          style={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.15,
            color: 'var(--bo-text)',
            marginBottom: '16px',
            // Scale child SVG to 48px
            fontSize: '48px',
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <p
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--bo-text)',
          marginBottom: description ? '8px' : 0,
          lineHeight: 1.3,
        }}
      >
        {title}
      </p>

      {description && (
        <p
          style={{
            fontSize: '14px',
            color: 'var(--bo-text-muted)',
            maxWidth: '384px',
            margin: '0 auto',
            lineHeight: 1.55,
            marginBottom: action ? '20px' : 0,
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <div style={{ marginTop: description ? 0 : '20px' }}>
          {action}
        </div>
      )}
    </div>
  )
}
