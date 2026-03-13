'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, ImageIcon, RotateCw } from 'lucide-react'
import type { ImageUploadFileStatus } from '@/lib/supabase-storage'

interface UploadProgressPanelProps {
    files: ImageUploadFileStatus[]
    total: number
    visible: boolean
}

const statusConfig = {
    pending:     { icon: ImageIcon,    color: 'var(--bo-text-muted)', label: 'Aguardando' },
    compressing: { icon: Loader2,      color: 'var(--bo-info)',       label: 'Comprimindo' },
    uploading:   { icon: Loader2,      color: 'var(--bo-accent)',     label: 'Enviando' },
    done:        { icon: CheckCircle,  color: 'var(--bo-success)',    label: 'Concluído' },
    error:       { icon: XCircle,      color: 'var(--bo-error)',      label: 'Erro' },
    retrying:    { icon: RotateCw,     color: 'var(--bo-warning)',    label: 'Tentando novamente' },
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
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: 'var(--bo-surface)',
                        border: '1px solid var(--bo-border)',
                    }}
                >
                    {/* Header with overall progress */}
                    <div className="px-4 py-3 flex items-center justify-between"
                        style={{ borderBottom: '1px solid var(--bo-border)' }}>
                        <div className="flex items-center gap-2">
                            <Loader2
                                size={14}
                                className={done < total ? 'animate-spin' : ''}
                                style={{ color: done < total ? 'var(--bo-accent)' : 'var(--bo-success)' }}
                            />
                            <span className="text-xs font-bold" style={{ color: 'var(--bo-text)' }}>
                                {done < total
                                    ? `Enviando ${done} de ${total} fotos...`
                                    : errors > 0
                                        ? `${done} enviadas, ${errors} com erro`
                                        : `${total} fotos enviadas com sucesso!`
                                }
                            </span>
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: 'var(--bo-text-muted)' }}>
                            {overallPercent}%
                        </span>
                    </div>

                    {/* Overall progress bar */}
                    <div className="h-1 w-full" style={{ background: 'var(--bo-elevated)' }}>
                        <motion.div
                            className="h-full"
                            style={{
                                background: errors > 0 && done === total
                                    ? 'var(--bo-warning)'
                                    : done === total
                                        ? 'var(--bo-success)'
                                        : 'var(--bo-accent)',
                            }}
                            animate={{ width: `${overallPercent}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* File list (max height scrollable) */}
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
                                        className="text-[10px] truncate flex-1 min-w-0"
                                        style={{ color: file.status === 'error' ? 'var(--bo-error)' : 'var(--bo-text-muted)' }}
                                    >
                                        {file.fileName}
                                    </span>
                                    <span
                                        className="text-[9px] font-medium flex-shrink-0"
                                        style={{ color: cfg.color }}
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
