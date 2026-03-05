'use client'
// Error Boundary for backoffice pages — catches render errors gracefully
import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

interface Props {
    children: ReactNode
    fallback?: ReactNode
    resetLabel?: string
}

interface State {
    hasError: boolean
    error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: undefined }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
        // Log to console in development; could send to Sentry/Datadog here
        console.error('[ErrorBoundary] Caught error:', error, info.componentStack)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined })
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback

            return (
                <div
                    className="flex flex-col items-center justify-center min-h-[400px] gap-4 rounded-2xl p-8"
                    style={{
                        background: 'var(--bo-surface)',
                        border: '1px solid var(--bo-border)',
                    }}
                >
                    <div
                        className="flex items-center justify-center w-14 h-14 rounded-full"
                        style={{ background: 'rgba(239,68,68,0.1)' }}
                    >
                        <AlertTriangle size={28} style={{ color: '#ef4444' }} />
                    </div>

                    <div className="text-center max-w-md">
                        <p
                            className="text-lg font-bold mb-1"
                            style={{ color: 'var(--bo-text)' }}
                        >
                            Algo deu errado
                        </p>
                        <p
                            className="text-sm"
                            style={{ color: 'var(--bo-text-muted)' }}
                        >
                            {this.state.error?.message || 'Erro inesperado no componente.'}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ background: '#486581' }}
                        >
                            <RefreshCcw size={14} />
                            Tentar novamente
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 px-5 h-10 rounded-xl text-sm font-semibold transition-colors"
                            style={{
                                background: 'var(--bo-elevated)',
                                border: '1px solid var(--bo-border)',
                                color: 'var(--bo-text)',
                            }}
                        >
                            Recarregar página
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

// Lightweight functional wrapper for async components
export function withErrorBoundary<T extends object>(
    Component: React.ComponentType<T>,
    fallback?: ReactNode
) {
    return function WrappedWithErrorBoundary(props: T) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        )
    }
}
