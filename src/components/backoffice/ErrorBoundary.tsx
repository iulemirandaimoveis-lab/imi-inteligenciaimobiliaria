'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AppError } from '@/lib/errors'

interface Props {
    children?: ReactNode
    fallback?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
    errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo })
        console.error('Uncaught error:', error, errorInfo)

        // Toast notification for user
        const message = error instanceof AppError ? error.message : 'Ocorreu um erro inesperado no componente.'
        toast.error('Erro na Interface', {
            description: message,
            action: {
                label: 'Recarregar',
                onClick: () => window.location.reload(),
            },
        })
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 m-4 bg-red-50/50 border border-red-100 rounded-2xl"
                >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <AlertCircle size={20} className="stroke-[2.5]" />
                            </div>
                            <div>
                                <h3 className="text-red-900 font-bold mb-1">Erro de Renderização</h3>
                                <p className="text-red-700/80 text-sm max-w-xl">
                                    {this.state.error?.message || 'Falha ao carregar este bloco. Nossos engenheiros foram notificados.'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null, errorInfo: null })
                                window.location.reload()
                            }}
                            className="px-4 py-2 bg-white flex items-center gap-2 border border-red-200 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-50 transition-colors shadow-sm w-full md:w-auto justify-center"
                        >
                            <RefreshCcw size={16} />
                            Tentar Novamente
                        </button>
                    </div>
                    {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                        <div className="mt-6 p-4 bg-white/60 rounded-xl overflow-x-auto text-[10px] sm:text-xs font-mono text-red-800 border border-red-100">
                            <summary className="font-bold cursor-pointer text-red-900 mb-2">Technical Details</summary>
                            <pre className="mt-2 whitespace-pre-wrap">{this.state.error?.stack}</pre>
                            <pre className="mt-4 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                        </div>
                    )}
                </motion.div>
            )
        }

        return this.props.children
    }
}
