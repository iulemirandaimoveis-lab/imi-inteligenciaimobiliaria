'use client'

import { X } from 'lucide-react'

interface FloatingCloseButtonProps {
  onClose: () => void
  label?: string
}

/**
 * FloatingCloseButton — DS v6
 * Fixed position above the bottom navigation bar.
 * bottom-[88px] = navbar height (64px) + safe margin (24px)
 */
export function FloatingCloseButton({ onClose, label = 'Fechar' }: FloatingCloseButtonProps) {
  return (
    <div className="fixed bottom-[88px] left-0 right-0 z-50 flex justify-center pointer-events-none">
      <button
        onClick={onClose}
        className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full shadow-lg backdrop-blur-lg transition-all duration-150"
        style={{
          background: 'var(--bg-overlay)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-strong)',
        }}
      >
        <X size={14} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
      </button>
    </div>
  )
}
