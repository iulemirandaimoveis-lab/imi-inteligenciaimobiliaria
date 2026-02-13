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
        <div className="flex flex-col items-center justify-center py-16 px-6 bg-white dark:bg-card-dark rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-card-darker flex items-center justify-center mb-4 text-gray-400">
                <Icon size={32} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">{description}</p>
            {action && <div>{action}</div>}
        </div>
    )
}
