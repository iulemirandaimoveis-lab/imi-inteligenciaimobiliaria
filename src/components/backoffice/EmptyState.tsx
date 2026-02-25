'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: ReactNode
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-32 px-12 rounded-[40px] border-2 border-dashed transition-all duration-500"
            style={{ background: 'var(--bo-elevated)', borderColor: 'var(--bo-border)' }}>
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-10 shadow-inner"
                style={{ background: 'var(--bo-active-bg)', color: 'var(--accent-500)' }}>
                <Icon size={32} strokeWidth={1.2} />
            </div>
            <h3 className="text-2xl font-display font-bold mb-4 tracking-tight" style={{ color: 'var(--bo-text)' }}>{title}</h3>
            <p className="text-center max-w-sm mb-12 text-base font-medium leading-relaxed" style={{ color: 'var(--bo-text-muted)' }}>
                {description}
            </p>
            {action && (
                <div className="flex justify-center">
                    {action}
                </div>
            )}
        </div>
    )
}
