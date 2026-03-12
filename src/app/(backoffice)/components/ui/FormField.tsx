'use client'

import React from 'react'
import { T } from '@/app/(backoffice)/lib/theme'

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
        borderLeft: error ? `3px solid ${T.error}` : undefined,
        paddingLeft: error ? 12 : undefined,
      }}
    >
      <label
        htmlFor={htmlFor}
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 600,
          color: T.text,
          marginBottom: 6,
        }}
      >
        {label}
        {required && (
          <span style={{ color: T.error, marginLeft: 2 }}>*</span>
        )}
      </label>

      {children}

      {error && (
        <p style={{ fontSize: 11, color: T.error, marginTop: 4, margin: 0, marginBlockStart: 4 }}>
          {error}
        </p>
      )}

      {!error && hint && (
        <p style={{ fontSize: 11, color: T.textMuted, marginTop: 4, margin: 0, marginBlockStart: 4 }}>
          {hint}
        </p>
      )}
    </div>
  )
}
