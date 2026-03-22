'use client'

import { useState } from 'react'
import { T } from '../../../lib/theme'
import { PageIntelHeader } from '../../../components/ui'

interface MarketMetrics {
  label: string
  brasil: string | number
  eua: string | number
  dubai: string | number
  unit: string
  highlight?: 'min' | 'max'
}

function getMetrics(value: number): MarketMetrics[] {
  const brl = value
  const usd = value / 5.2
  const aed = value / 1.42

  return [
    { label: 'Preco Medio/m2', brasil: `R$ ${(12500).toLocaleString('pt-BR')}`, eua: `$ ${(3800).toLocaleString('en-US')}`, dubai: `AED ${(14200).toLocaleString('en-US')}`, unit: '', highlight: 'min' },
    { label: 'Cap Rate', brasil: '5.8%', eua: '6.2%', dubai: '7.5%', unit: '', highlight: 'max' },
    { label: 'Valorizacao 5a', brasil: '42%', eua: '28%', dubai: '55%', unit: '', highlight: 'max' },
    { label: 'Yield Aluguel', brasil: '0.45%/mes', eua: '0.52%/mes', dubai: '0.65%/mes', unit: '', highlight: 'max' },
    { label: 'Imposto Compra', brasil: '3% ITBI', eua: '~1.5%', dubai: '4% DLD', unit: '' },
    { label: 'IR Aluguel', brasil: '27.5%', eua: '10-37%', dubai: '0%', unit: '', highlight: 'min' },
    { label: 'Ganho Capital', brasil: '15-22.5%', eua: '15-20%', dubai: '0%', unit: '', highlight: 'min' },
    { label: 'Financiamento', brasil: '10.5% a.a.', eua: '7.0% a.a.', dubai: '4.5% a.a.', unit: '', highlight: 'min' },
    { label: 'Entrada Minima', brasil: '20%', eua: '25%', dubai: '20%', unit: '', highlight: 'min' },
    { label: 'Residencia', brasil: 'N/A', eua: 'EB-5 $800k+', dubai: 'Golden Visa AED 2M', unit: '' },
    { label: 'Valor Equivalente', brasil: `R$ ${brl.toLocaleString('pt-BR')}`, eua: `$ ${usd.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, dubai: `AED ${aed.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, unit: '' },
  ]
}

const markets = [
  { key: 'brasil', label: 'Brasil', flag: '🇧🇷', color: '#34d399' },
  { key: 'eua', label: 'EUA', flag: '🇺🇸', color: '#60a5fa' },
  { key: 'dubai', label: 'Dubai', flag: '🇦🇪', color: T.accent },
]

export default function ComparadorPage() {
  const [value, setValue] = useState(1000000)
  const metrics = getMetrics(value)

  return (
    <div className="space-y-6">
      <PageIntelHeader
        moduleLabel="INVEST · COMPARAÇÃO"
        title="Comparador Cross-Border"
        subtitle="Compare metricas de investimento entre mercados internacionais"
      />

      {/* Value input */}
      <div
        className="rounded-lg p-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <label className="block text-xs mb-2" style={{ color: T.textMuted }}>
          Valor do Investimento (R$)
        </label>
        <input
          type="number"
          value={value}
          onChange={e => setValue(+e.target.value || 0)}
          className="w-full px-4 py-3 rounded-[6px] text-xl focus:outline-none"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            color: T.text,
            fontFamily: T.font.data,
          }}
        />
        <div className="flex gap-2 mt-3">
          {[500000, 1000000, 2000000, 5000000].map(v => (
            <button
              key={v}
              onClick={() => setValue(v)}
              className="px-3 py-1 rounded-lg text-xs transition-colors"
              style={{
                border: `1px solid ${value === v ? T.accent : T.border}`,
                color: value === v ? T.accent : T.textDim,
                background: value === v ? T.accentBg : 'transparent',
                fontFamily: T.font.data,
              }}
            >
              R$ {(v / 1000000).toFixed(1)}M
            </button>
          ))}
        </div>
      </div>

      {/* Comparison table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        {/* Market headers */}
        <div
          className="grid grid-cols-4"
          style={{ borderBottom: `1px solid ${T.border}` }}
        >
          <div className="p-4 text-xs" style={{ color: T.textDim }}>Metrica</div>
          {markets.map(m => (
            <div
              key={m.key}
              className="p-4 text-center"
              style={{ borderLeft: `1px solid ${T.borderSubtle}` }}
            >
              <div className="text-lg mb-0.5">{m.flag}</div>
              <div className="text-sm font-semibold" style={{ color: T.text }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Rows */}
        {metrics.map((row, i) => (
          <div
            key={row.label}
            className="grid grid-cols-4"
            style={i < metrics.length - 1 ? { borderBottom: `1px solid ${T.borderSubtle}` } : undefined}
          >
            <div className="px-4 py-3 text-xs flex items-center" style={{ color: T.textMuted }}>
              {row.label}
            </div>
            {(['brasil', 'eua', 'dubai'] as const).map(mkt => {
              const val = row[mkt]
              const isHighlight = row.highlight === 'max'
                ? (typeof val === 'string' ? val : val.toString()).replace(/[^0-9.]/g, '') >= Math.max(
                    ...(['brasil', 'eua', 'dubai'] as const).map(k => parseFloat((typeof row[k] === 'string' ? row[k] : row[k].toString()).replace(/[^0-9.]/g, '') || '0'))
                  ).toString()
                : false

              return (
                <div
                  key={mkt}
                  className="px-4 py-3 text-center"
                  style={{ borderLeft: `1px solid ${T.borderSubtle}` }}
                >
                  <span
                    className="text-sm"
                    style={{ color: T.text, fontFamily: T.font.data }}
                  >
                    {val}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Visual comparison bars */}
      <div
        className="rounded-lg p-5"
        style={{ background: T.surface, border: `1px solid ${T.border}` }}
      >
        <h3 className="text-sm font-semibold mb-4" style={{ color: T.text }}>
          Atratividade por Metrica
        </h3>
        {[
          { label: 'Cap Rate', values: [5.8, 6.2, 7.5] },
          { label: 'Yield Mensal', values: [0.45, 0.52, 0.65] },
          { label: 'Valorizacao 5a', values: [42, 28, 55] },
        ].map(metric => (
          <div key={metric.label} className="mb-4">
            <div className="text-xs mb-2" style={{ color: T.textDim }}>{metric.label}</div>
            <div className="space-y-1.5">
              {markets.map((m, i) => {
                const max = Math.max(...metric.values)
                const pct = (metric.values[i] / max) * 100
                return (
                  <div key={m.key} className="flex items-center gap-3">
                    <span className="text-xs w-14" style={{ color: T.textMuted }}>{m.label}</span>
                    <div
                      className="flex-1 h-3 rounded-full overflow-hidden"
                      style={{ background: T.hover }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: m.color }}
                      />
                    </div>
                    <span
                      className="text-xs w-12 text-right"
                      style={{ color: T.textMuted, fontFamily: T.font.data }}
                    >
                      {metric.values[i]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
