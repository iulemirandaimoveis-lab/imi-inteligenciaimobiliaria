'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { T } from '@/app/(backoffice)/lib/theme'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          className="flex flex-col items-center justify-center py-20 px-8 rounded-2xl text-center"
          style={{ background: T.elevated, border: `1px solid ${T.border}` }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: '#EF444415', border: '1px solid #EF444430' }}
          >
            <AlertTriangle size={24} style={{ color: '#EF4444' }} />
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: T.text }}>
            Algo deu errado
          </h3>
          <p className="text-sm mb-6 max-w-xs" style={{ color: T.textMuted }}>
            {this.state.error?.message || 'Ocorreu um erro inesperado nesta seção.'}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 h-9 px-5 rounded-xl text-sm font-medium transition-all"
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
