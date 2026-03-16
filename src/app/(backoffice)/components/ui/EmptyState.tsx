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
            width: 52,
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--r-xl)',
            background: 'var(--bg-muted)',
            color: 'var(--text-tertiary)',
            marginBottom: '16px',
            fontSize: '24px',
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <p
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
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
            color: 'var(--text-tertiary)',
            maxWidth: '320px',
            margin: '0 auto',
            lineHeight: 1.55,
          }}
        >
          {description}
        </p>
      )}

      {action && (
        <div style={{ marginTop: '20px' }}>
          {action}
        </div>
      )}
    </div>
  )
}
