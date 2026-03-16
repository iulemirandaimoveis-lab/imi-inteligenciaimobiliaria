'use client'

import React from 'react'

interface FormFieldProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  htmlFor?: string
}

export function FormField({
  label,
  error,
  hint,
  required,
  children,
  className,
  htmlFor,
}: FormFieldProps) {
  return (
    <div
      className={className}
      style={{
        borderLeft: error ? '3px solid var(--error)' : undefined,
        paddingLeft: error ? 12 : undefined,
      }}
    >
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          marginBottom: 6,
        }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--error)', marginLeft: 2 }}>*</span>
        )}
      </label>

      {children}

      {error && (
        <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--error)', margin: 0, marginBlockStart: 4 }}>
          {error}
        </p>
      )}

      {!error && hint && (
        <p style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', margin: 0, marginBlockStart: 4 }}>
          {hint}
        </p>
      )}
    </div>
  )
}
