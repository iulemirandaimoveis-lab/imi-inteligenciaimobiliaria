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
        <div className="flex flex-col items-center justify-center py-32 px-12 bg-white dark:bg-[#0A0B0D] rounded-[40px] border-2 border-dashed border-imi-100 dark:border-white/5 transition-all duration-500 hover:border-imi-200">
            <div className="w-20 h-20 rounded-3xl bg-imi-50 dark:bg-white/5 flex items-center justify-center mb-10 text-imi-500 shadow-inner">
                <Icon size={32} strokeWidth={1.2} />
            </div>
            <h3 className="text-2xl font-display font-bold text-imi-950 dark:text-white mb-4 tracking-tight">{title}</h3>
            <p className="text-imi-500 dark:text-gray-400 text-center max-w-sm mb-12 text-base font-medium leading-relaxed">
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
