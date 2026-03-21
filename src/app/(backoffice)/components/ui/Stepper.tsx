'use client'

/**
 * Stepper — IMI Design System v3
 * DS3 pattern: multi-step workflow indicator.
 * Horizontal layout for desktop, vertical for mobile/compact usage.
 * Framer-motion pulse on active step.
 */

import React from 'react'
import { Check, X } from 'lucide-react'
import { motion } from 'framer-motion'

export type StepStatus = 'done' | 'active' | 'pending' | 'error'

export interface Step {
  id: string | number
  label: string
  description?: string
  status?: StepStatus
}

export interface StepperProps {
  steps: Step[]
  /** 0-indexed index of the current active step */
  currentStep: number
  /** Layout orientation — default 'horizontal' */
  orientation?: 'horizontal' | 'vertical'
  /** Circle size preset — default 'md' */
  size?: 'sm' | 'md'
  /** Optional click handler — only called for completed (done) steps */
  onStepClick?: (index: number) => void
}

/* ── Size config ─────────────────────────────────────────── */

interface SizeCfg {
  circle: number
  icon: number
  labelSize: number
  descSize: number
  connectorH: number
}

const SIZE_CFG: Record<'sm' | 'md', SizeCfg> = {
  sm: { circle: 24, icon: 12, labelSize: 11, descSize: 10, connectorH: 1 },
  md: { circle: 32, icon: 16, labelSize: 12, descSize: 11, connectorH: 1 },
}

/* ── Step status config ───────────────────────────────────── */

interface StepCfg {
  circleBg: string
  circleColor: string
  circleBorder: string
  labelColor: string
}

function resolveStatus(step: Step, index: number, currentStep: number): StepStatus {
  if (step.status) return step.status
  if (index < currentStep) return 'done'
  if (index === currentStep) return 'active'
  return 'pending'
}

function stepCfg(status: StepStatus): StepCfg {
  switch (status) {
    case 'done':
      return {
        circleBg: 'var(--success)',
        circleColor: '#ffffff',
        circleBorder: 'var(--success)',
        labelColor: 'var(--text-secondary)',
      }
    case 'active':
      return {
        circleBg: 'var(--accent-400)',
        circleColor: '#ffffff',
        circleBorder: 'var(--accent-400)',
        labelColor: 'var(--text-primary)',
      }
    case 'error':
      return {
        circleBg: 'var(--error)',
        circleColor: '#ffffff',
        circleBorder: 'var(--error)',
        labelColor: 'var(--error)',
      }
    case 'pending':
    default:
      return {
        circleBg: 'var(--bg-muted)',
        circleColor: 'var(--text-tertiary)',
        circleBorder: 'var(--border-default)',
        labelColor: 'var(--text-tertiary)',
      }
  }
}

/* ── Step circle ─────────────────────────────────────────── */

interface StepCircleProps {
  stepNumber: number
  status: StepStatus
  sizeCfg: SizeCfg
}

function StepCircle({ stepNumber, status, sizeCfg }: StepCircleProps) {
  const cfg = stepCfg(status)
  const isActive = status === 'active'

  const circle = (
    <div
      style={{
        width: sizeCfg.circle,
        height: sizeCfg.circle,
        borderRadius: 'var(--r-full, 9999px)',
        background: cfg.circleBg,
        border: `2px solid ${cfg.circleBorder}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        zIndex: 1,
        transition: 'all var(--dur-2, 200ms) var(--ease)',
      }}
    >
      {status === 'done' && (
        <Check size={sizeCfg.icon} color={cfg.circleColor} strokeWidth={2.5} />
      )}
      {status === 'error' && (
        <X size={sizeCfg.icon} color={cfg.circleColor} strokeWidth={2.5} />
      )}
      {(status === 'active' || status === 'pending') && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: sizeCfg.icon - 2,
            fontWeight: 600,
            color: cfg.circleColor,
            lineHeight: 1,
          }}
        >
          {stepNumber}
        </span>
      )}
    </div>
  )

  if (isActive) {
    return (
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        {circle}
      </motion.div>
    )
  }

  return circle
}

/* ── Connector line ───────────────────────────────────────── */

interface ConnectorProps {
  done: boolean
  orientation: 'horizontal' | 'vertical'
  circleSize: number
}

function Connector({ done, orientation, circleSize }: ConnectorProps) {
  const color = done ? 'var(--accent-400)' : 'var(--border-subtle)'

  if (orientation === 'horizontal') {
    return (
      <div
        aria-hidden="true"
        style={{
          flex: 1,
          height: 1,
          background: color,
          transition: 'background var(--dur-3, 300ms) var(--ease)',
          alignSelf: 'center',
          marginInline: 4,
        }}
      />
    )
  }

  // Vertical connector
  return (
    <div
      aria-hidden="true"
      style={{
        width: 2,
        height: circleSize + 8,
        background: color,
        transition: 'background var(--dur-3, 300ms) var(--ease)',
        marginLeft: (circleSize / 2) - 1,
        flexShrink: 0,
      }}
    />
  )
}

/* ── Horizontal layout ────────────────────────────────────── */

function HorizontalStepper({
  steps,
  currentStep,
  size,
  onStepClick,
}: {
  steps: Step[]
  currentStep: number
  size: 'sm' | 'md'
  onStepClick?: (index: number) => void
}) {
  const sc = SIZE_CFG[size]

  return (
    <div
      role="list"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        width: '100%',
      }}
    >
      {steps.map((step, idx) => {
        const status = resolveStatus(step, idx, currentStep)
        const cfg = stepCfg(status)
        const isLast = idx === steps.length - 1
        const isDone = status === 'done'
        const isClickable = isDone && !!onStepClick

        return (
          <React.Fragment key={step.id}>
            {/* Step item */}
            <div
              role={isClickable ? 'button' : 'listitem'}
              {...(!isClickable && { 'aria-current': status === 'active' ? 'step' as const : undefined })}
              tabIndex={isClickable ? 0 : undefined}
              onClick={isClickable ? () => onStepClick(idx) : undefined}
              onKeyDown={isClickable ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStepClick(idx) } } : undefined}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                cursor: isClickable ? 'pointer' : 'default',
                minWidth: sc.circle + 8,
              }}
            >
              <StepCircle stepNumber={idx + 1} status={status} sizeCfg={sc} />

              {/* Labels below circle */}
              <div style={{ textAlign: 'center', maxWidth: 88 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: sc.labelSize,
                    fontWeight: 500,
                    color: cfg.labelColor,
                    lineHeight: 1.3,
                    transition: 'color var(--dur-2, 200ms) var(--ease)',
                  }}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: sc.descSize,
                      color: 'var(--text-tertiary)',
                      lineHeight: 1.3,
                      marginTop: 2,
                    }}
                  >
                    {step.description}
                  </div>
                )}
              </div>
            </div>

            {/* Connector between steps */}
            {!isLast && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingTop: sc.circle / 2 }}>
                <Connector done={isDone} orientation="horizontal" circleSize={sc.circle} />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ── Vertical layout ──────────────────────────────────────── */

function VerticalStepper({
  steps,
  currentStep,
  size,
  onStepClick,
}: {
  steps: Step[]
  currentStep: number
  size: 'sm' | 'md'
  onStepClick?: (index: number) => void
}) {
  const sc = SIZE_CFG[size]

  return (
    <div role="list" style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((step, idx) => {
        const status = resolveStatus(step, idx, currentStep)
        const cfg = stepCfg(status)
        const isLast = idx === steps.length - 1
        const isDone = status === 'done'
        const isClickable = isDone && !!onStepClick

        return (
          <div
            key={step.id}
            role="listitem"
            aria-current={status === 'active' ? 'step' : undefined}
            style={{ display: 'flex', gap: 16 }}
          >
            {/* Left: circle + connector */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div
                role={isClickable ? 'button' : undefined}
                tabIndex={isClickable ? 0 : undefined}
                onClick={isClickable ? () => onStepClick(idx) : undefined}
                onKeyDown={isClickable ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStepClick(idx) } } : undefined}
                style={{ cursor: isClickable ? 'pointer' : 'default' }}
              >
                <StepCircle stepNumber={idx + 1} status={status} sizeCfg={sc} />
              </div>
              {!isLast && (
                <Connector done={isDone} orientation="vertical" circleSize={sc.circle} />
              )}
            </div>

            {/* Right: label + description */}
            <div
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              style={{
                paddingTop: 6,
                paddingBottom: isLast ? 0 : sc.circle + 8,
                cursor: isClickable ? 'pointer' : 'default',
                flex: 1,
                minWidth: 0,
              }}
              onClick={isClickable ? () => onStepClick(idx) : undefined}
              onKeyDown={isClickable ? (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStepClick(idx) } } : undefined}
            >
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: sc.labelSize + 1,
                  fontWeight: 500,
                  color: cfg.labelColor,
                  lineHeight: 1.3,
                  transition: 'color var(--dur-2, 200ms) var(--ease)',
                }}
              >
                {step.label}
              </div>
              {step.description && (
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: sc.descSize,
                    color: 'var(--text-tertiary)',
                    lineHeight: 1.5,
                    marginTop: 3,
                  }}
                >
                  {step.description}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Main component ───────────────────────────────────────── */

export function Stepper({
  steps,
  currentStep,
  orientation = 'horizontal',
  size = 'md',
  onStepClick,
}: StepperProps) {
  if (!steps || steps.length === 0) return null

  if (orientation === 'vertical') {
    return (
      <VerticalStepper
        steps={steps}
        currentStep={currentStep}
        size={size}
        onStepClick={onStepClick}
      />
    )
  }

  return (
    <HorizontalStepper
      steps={steps}
      currentStep={currentStep}
      size={size}
      onStepClick={onStepClick}
    />
  )
}
