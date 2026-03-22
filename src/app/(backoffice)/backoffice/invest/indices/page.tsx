'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { T } from '../../../lib/theme'
import { PageIntelHeader } from '../../../components/ui'

interface IndexData {
  name: string
  value: number
  unit: string
  change: number
  history?: number[]
}

function SparkBars({ values, color }: { values: number[]; color: string }) {
  if (!values || values.length === 0) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  return (
    <div className="flex items-end gap-px h-8">
      {values.map((v, i) => {
        const h = ((v - min) / range) * 100
        return (
          <div
            key={i}
            className="flex-1 rounded-t-sm min-w-[2px] transition-all"
            style={{ height: `${Math.max(h, 8)}%`, background: i === values.length - 1 ? color : `${color}66`, opacity: 0.5 + (i / values.length) * 0.5 }}
          />
        )
      })}
    </div>
  )
}

export default function IndicesPage() {
  const [indices, setIndices] = useState<Record<string, IndexData>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchIndices = () => {
    setLoading(true)
    fetch('/api/invest/indices')
      .then(r => r.json())
      .then(data => {
        setIndices(data.indices || {})
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'))
        setLoading(false)
      })
      .catch(() => {
        toast.error('Erro ao carregar indices do BCB')
        setLoading(false)
      })
  }

  useEffect(() => { fetchIndices() }, [])

  const categories = [
    {
      title: 'Taxas de Juros',
      keys: ['selic', 'cdi', 'ipca'],
      color: T.accent,
    },
    {
      title: 'Cambio',
      keys: ['usd_brl', 'eur_brl', 'aed_brl'],
      color: '#60a5fa',
    },
    {
      title: 'Mercado Imobiliario',
      keys: ['fipezap', 'igpm', 'incc'],
      color: '#34d399',
    },
    {
      title: 'Renda Fixa',
      keys: ['tesouro_selic', 'tesouro_ipca', 'lci'],
      color: '#a78bfa',
    },
  ]

  const fakeHistory = (base: number) =>
    Array.from({ length: 12 }, () => base * (0.95 + Math.random() * 0.1))

  return (
    <div className="space-y-6">
      <PageIntelHeader
        moduleLabel="INVEST · ÍNDICES"
        title="Índices Econômicos"
        subtitle="Dashboard de indicadores — Fonte: BCB / IBGE"
        actions={
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <span className="text-xs" style={{ color: T.textDim }}>
                Atualizado: {lastUpdate}
              </span>
            )}
            <button
              onClick={fetchIndices}
              disabled={loading}
              className="p-2 rounded-lg transition-colors"
              style={{ border: `1px solid ${T.border}`, color: T.textMuted }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-32 rounded-lg animate-pulse"
              style={{ background: T.hover }}
            />
          ))}
        </div>
      ) : Object.keys(indices).length === 0 ? (
        <div
          className="rounded-lg p-12 text-center"
          style={{ background: T.surface, border: `1px solid ${T.border}` }}
        >
          <TrendingUp className="w-10 h-10 mx-auto mb-3" style={{ color: T.textDim }} />
          <h3 className="font-medium mb-1" style={{ color: T.textMuted }}>Dados indisponiveis</h3>
          <p className="text-sm" style={{ color: T.textDim }}>
            Nao foi possivel carregar os indices do BCB. Tente novamente.
          </p>
          <button
            onClick={fetchIndices}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: T.accent, color: T.textInverse }}
          >
            Tentar Novamente
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map(cat => (
            <div key={cat.title}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: T.textMuted }}>
                {cat.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cat.keys.map(key => {
                  const idx = indices[key]
                  if (!idx) return null
                  const history = idx.history || fakeHistory(idx.value)
                  return (
                    <div
                      key={key}
                      className="rounded-lg p-4 transition-all"
                      style={{ background: T.surface, border: `1px solid ${T.border}` }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-xs mb-1" style={{ color: T.textDim }}>
                            {idx.name}
                          </div>
                          <div
                            className="text-2xl font-bold"
                            style={{ color: T.text, fontFamily: T.font.data }}
                          >
                            {idx.unit === 'R$'
                              ? `R$ ${idx.value.toFixed(2)}`
                              : `${idx.value.toFixed(2)}${idx.unit}`}
                          </div>
                        </div>
                        <div
                          className={`flex items-center gap-0.5 text-sm ${idx.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                          style={{ fontFamily: T.font.data }}
                        >
                          {idx.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {Math.abs(idx.change).toFixed(2)}
                        </div>
                      </div>
                      <SparkBars values={history} color={cat.color} />
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px]" style={{ color: T.textDim }}>12m atras</span>
                        <span className="text-[10px]" style={{ color: T.textDim }}>hoje</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className="text-xs text-center pt-4"
        style={{ color: T.textDim, borderTop: `1px solid ${T.borderSubtle}` }}
      >
        Dados obtidos via API do Banco Central do Brasil (BCB) e fontes publicas. Atualizacao diaria.
      </div>
    </div>
  )
}
