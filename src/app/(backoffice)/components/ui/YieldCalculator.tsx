'use client'

/**
 * YieldCalculator — IMI Design System v3
 * DS3 pattern: interactive property yield calculator with animated results
 */

import React, { useState, useCallback, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calculator, TrendingUp, TrendingDown } from 'lucide-react'

export interface YieldResults {
  grossYield: number
  netYield: number
  monthlyNOI: number
  annualNOI: number
  paybackYears: number
  capRate: number
}

export interface YieldCalculatorProps {
  propertyValue?: number
  monthlyRent?: number
  annualExpenses?: number
  onCalculate?: (results: YieldResults) => void
}

// CDI reference rate (a.a.)
const CDI_RATE = 10.5

function computeYield(
  propertyValue: number,
  monthlyRent: number,
  annualExpenses: number,
): YieldResults {
  const annualRent = monthlyRent * 12
  const grossYield = propertyValue > 0 ? (annualRent / propertyValue) * 100 : 0
  const annualNOI = annualRent - annualExpenses
  const monthlyNOI = annualNOI / 12
  const netYield = propertyValue > 0 ? (annualNOI / propertyValue) * 100 : 0
  const capRate = netYield
  const paybackYears = netYield > 0 ? 100 / netYield : 0
  return { grossYield, netYield, monthlyNOI, annualNOI, paybackYears, capRate }
}

function parseBRL(raw: string): number {
  const clean = raw.replace(/\D/g, '')
  return clean ? parseInt(clean, 10) : 0
}

function formatBRL(value: number): string {
  if (!value) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function yieldColor(y: number): string {
  if (y >= 8) return 'var(--success)'
  if (y >= 5) return 'var(--warning)'
  return 'var(--error)'
}

function yieldBg(y: number): string {
  if (y >= 8) return 'var(--success-bg)'
  if (y >= 5) return 'var(--warning-bg)'
  return 'var(--error-bg)'
}

interface CurrencyInputProps {
  id: string
  label: string
  hint?: string
  value: string
  onChange: (raw: string) => void
  onBlur?: () => void
}

function CurrencyInput({ id, label, hint, value, onChange, onBlur }: CurrencyInputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label
        htmlFor={id}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}
      >
        {label}
        {hint && (
          <span style={{ color: 'var(--text-disabled)', marginLeft: 5, textTransform: 'none', letterSpacing: 0 }}>
            ({hint})
          </span>
        )}
      </label>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          height: 40,
          background: 'var(--bg-muted)',
          border: `1px solid ${focused ? 'var(--border-focus)' : 'var(--border-subtle)'}`,
          borderRadius: 'var(--r-md, 4px)',
          overflow: 'hidden',
          transition: 'border-color 160ms ease',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            paddingLeft: 12,
            paddingRight: 4,
            flexShrink: 0,
            userSelect: 'none',
          }}
        >
          R$
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={value}
          placeholder="0"
          onChange={e => {
            const digits = e.target.value.replace(/\D/g, '')
            const num = digits ? parseInt(digits, 10) : 0
            onChange(num ? formatBRL(num) : '')
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            onBlur?.()
          }}
          style={{
            flex: 1,
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
            paddingRight: 12,
          }}
        />
      </div>
    </div>
  )
}

interface ResultTileProps {
  label: string
  value: string
  sub?: string
  highlight?: string
  highlightBg?: string
}

function ResultTile({ label, value, sub, highlight, highlightBg }: ResultTileProps) {
  return (
    <div
      style={{
        padding: '12px 14px',
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-md, 4px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
        }}
      >
        {label}
      </span>

      <span
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          color: highlight ?? 'var(--text-primary)',
        }}
      >
        {value}
      </span>

      {sub && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-tertiary)',
            marginTop: 2,
            padding: '2px 8px',
            borderRadius: 6,
            background: highlightBg ?? 'var(--bg-muted)',
            alignSelf: 'flex-start',
          }}
        >
          {sub}
        </span>
      )}
    </div>
  )
}

export function YieldCalculator({
  propertyValue: initPropertyValue,
  monthlyRent: initMonthlyRent,
  annualExpenses: initAnnualExpenses,
  onCalculate,
}: YieldCalculatorProps) {
  const uid = useId()

  const [propertyVal, setPropertyVal] = useState(
    initPropertyValue ? formatBRL(initPropertyValue) : '',
  )
  const [rentVal, setRentVal] = useState(
    initMonthlyRent ? formatBRL(initMonthlyRent) : '',
  )
  const [expensesVal, setExpensesVal] = useState(
    initAnnualExpenses ? formatBRL(initAnnualExpenses) : '',
  )
  const [results, setResults] = useState<YieldResults | null>(() => {
    if (initPropertyValue && initMonthlyRent) {
      return computeYield(initPropertyValue, initMonthlyRent, initAnnualExpenses ?? 0)
    }
    return null
  })

  const calculate = useCallback(() => {
    const pv = parseBRL(propertyVal)
    const mr = parseBRL(rentVal)
    const ae = parseBRL(expensesVal)
    if (pv > 0 && mr > 0) {
      const r = computeYield(pv, mr, ae)
      setResults(r)
      onCalculate?.(r)
    }
  }, [propertyVal, rentVal, expensesVal, onCalculate])

  const spread = results ? results.netYield - CDI_RATE : null
  const spreadPositive = spread !== null && spread > 0

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--r-xl, 4px)',
        boxShadow: 'var(--shadow-sm)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
          }}
        >
          Calculadora de Yield
        </span>
        <Calculator size={16} style={{ color: 'var(--accent-400)' }} />
      </div>

      {/* Inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CurrencyInput
          id={`${uid}-property`}
          label="Valor do Imóvel"
          value={propertyVal}
          onChange={setPropertyVal}
          onBlur={calculate}
        />
        <CurrencyInput
          id={`${uid}-rent`}
          label="Aluguel Mensal"
          value={rentVal}
          onChange={setRentVal}
          onBlur={calculate}
        />
        <CurrencyInput
          id={`${uid}-expenses`}
          label="Despesas Anuais"
          hint="IPTU + cond. + manutenção"
          value={expensesVal}
          onChange={setExpensesVal}
          onBlur={calculate}
        />
      </div>

      {/* Calculate button */}
      <button
        type="button"
        onClick={calculate}
        style={{
          width: '100%',
          height: 40,
          background: 'var(--accent-400)',
          color: 'var(--bg-void)',
          border: 'none',
          borderRadius: 'var(--r-md, 4px)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.10em',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'opacity 150ms ease, transform 150ms ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.opacity = '0.9'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        <Calculator size={14} />
        Calcular
      </button>

      {/* Results */}
      <AnimatePresence mode="wait">
        {results && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* 2x2 grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <ResultTile
                label="Yield Bruto"
                value={`${results.grossYield.toFixed(2)}%`}
                sub="a.a."
                highlight={yieldColor(results.grossYield)}
                highlightBg={yieldBg(results.grossYield)}
              />
              <ResultTile
                label="Yield Líquido"
                value={`${results.netYield.toFixed(2)}%`}
                sub="a.a. c/ desp."
                highlight={yieldColor(results.netYield)}
                highlightBg={yieldBg(results.netYield)}
              />
              <ResultTile
                label="NOI Mensal"
                value={`R$ ${formatBRL(results.monthlyNOI)}`}
                sub="receita líquida"
              />
              <ResultTile
                label="Payback"
                value={`${results.paybackYears.toFixed(1)} anos`}
                sub="retorno do capital"
              />
            </div>

            {/* CDI Spread comparison */}
            {spread !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                style={{
                  padding: '10px 14px',
                  background: spreadPositive ? 'rgba(0,178,127,0.06)' : 'rgba(229,62,62,0.06)',
                  border: `1px solid ${spreadPositive ? 'rgba(0,178,127,0.18)' : 'rgba(229,62,62,0.18)'}`,
                  borderRadius: 'var(--r-md, 4px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {spreadPositive
                  ? <TrendingUp size={13} style={{ color: 'var(--success)', flexShrink: 0 }} />
                  : <TrendingDown size={13} style={{ color: 'var(--error)', flexShrink: 0 }} />
                }
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    flex: 1,
                  }}
                >
                  vs. CDI {CDI_RATE}% a.a.
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: spreadPositive ? 'var(--success)' : 'var(--error)',
                  }}
                >
                  {spreadPositive ? '+' : ''}
                  {spread.toFixed(2)} p.p.
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
