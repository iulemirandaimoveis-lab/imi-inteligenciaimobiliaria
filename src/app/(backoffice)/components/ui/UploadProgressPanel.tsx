'use client'

/**
 * UploadProgressPanel — IMI Design System v3
 * DS3 pattern: animated upload status list with progress bar
 */

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, ImageIcon, RotateCw } from 'lucide-react'
import type { ImageUploadFileStatus } from '@/lib/supabase-storage'

interface UploadProgressPanelProps {
    files: ImageUploadFileStatus[]
    total: number
    visible: boolean
}

const statusConfig = {
    pending:     { icon: ImageIcon,    color: 'var(--text-tertiary)',  label: 'Aguardando' },
    compressing: { icon: Loader2,      color: 'var(--info)',           label: 'Comprimindo' },
    uploading:   { icon: Loader2,      color: 'var(--imi-gold-500)',   label: 'Enviando' },
    done:        { icon: CheckCircle,  color: 'var(--success)',        label: 'Concluído' },
    error:       { icon: XCircle,      color: 'var(--error)',          label: 'Erro' },
    retrying:    { icon: RotateCw,     color: 'var(--warning)',        label: 'Tentando novamente' },
}

export default function UploadProgressPanel({ files, total, visible }: UploadProgressPanelProps) {
    if (!visible || files.length === 0) return null

    const done = files.filter(f => f.status === 'done').length
    const errors = files.filter(f => f.status === 'error').length
    const overallPercent = total > 0 ? Math.round((done / total) * 100) : 0

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--r-xl, 4px)',
                        overflow: 'hidden',
                    }}
                >
                    {/* Header with overall progress */}
                    <div className="px-4 py-3 flex items-center justify-between"
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <div className="flex items-center gap-2">
                            <Loader2
                                size={14}
                                className={done < total ? 'animate-spin' : ''}
                                style={{ color: done < total ? 'var(--imi-gold-500)' : 'var(--success)' }}
                            />
                            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                                {done < total
                                    ? `Enviando ${done} de ${total} fotos...`
                                    : errors > 0
                                        ? `${done} enviadas, ${errors} com erro`
                                        : `${total} fotos enviadas com sucesso!`
                                }
                            </span>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)' }}>
                            {overallPercent}%
                        </span>
                    </div>

                    {/* Overall progress bar */}
                    <div className="h-1 w-full" style={{ background: 'var(--bg-muted)' }}>
                        <motion.div
                            className="h-full"
                            style={{
                                background: errors > 0 && done === total
                                    ? 'var(--warning)'
                                    : done === total
                                        ? 'var(--success)'
                                        : 'var(--imi-gold-500)',
                            }}
                            animate={{ width: `${overallPercent}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* File list */}
                    <div className="max-h-48 overflow-y-auto px-3 py-2 space-y-1">
                        {files.map((file, i) => {
                            const cfg = statusConfig[file.status]
                            const Icon = cfg.icon
                            const isSpinning = file.status === 'compressing' || file.status === 'uploading' || file.status === 'retrying'

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="flex items-center gap-2 py-1"
                                >
                                    <Icon
                                        size={12}
                                        className={isSpinning ? 'animate-spin' : ''}
                                        style={{ color: cfg.color, flexShrink: 0 }}
                                    />
                                    <span
                                        style={{
                                            fontFamily: 'var(--font-sans)',
                                            fontSize: 11,
                                            color: file.status === 'error' ? 'var(--error)' : 'var(--text-secondary)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            flex: 1,
                                            minWidth: 0,
                                        }}
                                    >
                                        {file.fileName}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 11,
                                            fontWeight: 500,
                                            color: cfg.color,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {cfg.label}
                                    </span>
                                </motion.div>
                            )
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
