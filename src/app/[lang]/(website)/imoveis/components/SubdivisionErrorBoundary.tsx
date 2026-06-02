'use client';

import React from 'react';
import { MapPin, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class SubdivisionErrorBoundary extends React.Component<
  { children: React.ReactNode; developmentName?: string },
  State
> {
  constructor(props: { children: React.ReactNode; developmentName?: string }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[SubdivisionMap] Error in loteamento map:', error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl"
          style={{ background: '#F8F6F2', border: '1px solid rgba(184,179,168,0.3)' }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(200,164,74,0.12)' }}
          >
            <MapPin size={22} style={{ color: '#C8A44A' }} />
          </div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#0B1928',
              margin: '0 0 6px',
              fontFamily: "var(--fu, 'Outfit', sans-serif)",
            }}
          >
            Mapa temporariamente indisponível
          </h3>
          <p style={{ fontSize: 13, color: '#948F84', margin: '0 0 20px', maxWidth: 300, lineHeight: 1.6 }}>
            Recarregue a página para tentar novamente ou entre em contato para obter informações sobre os lotes.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 h-10 px-5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: '#0B1928', color: '#fff', fontFamily: "var(--fu, 'Outfit', sans-serif)" }}
          >
            <RefreshCw size={14} />
            Tentar novamente
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
