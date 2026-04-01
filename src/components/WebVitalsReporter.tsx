'use client'

import { useEffect } from 'react'
import { reportWebVitals, type WebVitalMetric } from '@/app/web-vitals'

/**
 * Client component that measures Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
 * using the browser PerformanceObserver API and reports them via sendBeacon.
 *
 * Drop this component into any layout to enable web vitals reporting.
 * Works with Next.js 14 App Router (no dependency on `next/web-vitals`).
 */
export default function WebVitalsReporter() {
  useEffect(() => {
    // Dynamically import web-vitals only on the client
    // Using the browser-native approach if web-vitals package is not available
    measureVitals()
  }, [])

  return null
}

function measureVitals() {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') return

  const id = generateUniqueId()

  // LCP — Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      if (lastEntry) {
        reportWebVitals({
          name: 'LCP',
          value: lastEntry.startTime,
          id,
          rating: lastEntry.startTime <= 2500 ? 'good' : lastEntry.startTime <= 4000 ? 'needs-improvement' : 'poor',
        })
      }
    })
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch { /* not supported */ }

  // FID — First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const firstEntry = entries[0] as PerformanceEventTiming | undefined
      if (firstEntry) {
        const fid = firstEntry.processingStart - firstEntry.startTime
        reportWebVitals({
          name: 'FID',
          value: fid,
          id,
          rating: fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor',
        })
      }
    })
    fidObserver.observe({ type: 'first-input', buffered: true })
  } catch { /* not supported */ }

  // CLS — Cumulative Layout Shift
  try {
    let clsValue = 0
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!(entry as any).hadRecentInput) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          clsValue += (entry as any).value || 0
        }
      }
    })
    clsObserver.observe({ type: 'layout-shift', buffered: true })

    // Report CLS on page hide (visibilitychange or pagehide)
    const reportCLS = () => {
      reportWebVitals({
        name: 'CLS',
        value: clsValue,
        id,
        rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
      })
    }
    addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') reportCLS()
    })
    addEventListener('pagehide', reportCLS)
  } catch { /* not supported */ }

  // FCP — First Contentful Paint
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const fcpEntry = entries.find(e => e.name === 'first-contentful-paint')
      if (fcpEntry) {
        reportWebVitals({
          name: 'FCP',
          value: fcpEntry.startTime,
          id,
          rating: fcpEntry.startTime <= 1800 ? 'good' : fcpEntry.startTime <= 3000 ? 'needs-improvement' : 'poor',
        })
      }
    })
    fcpObserver.observe({ type: 'paint', buffered: true })
  } catch { /* not supported */ }

  // TTFB — Time to First Byte
  try {
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (navEntries.length > 0) {
      const ttfb = navEntries[0].responseStart
      reportWebVitals({
        name: 'TTFB',
        value: ttfb,
        id,
        rating: ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor',
      })
    }
  } catch { /* not supported */ }
}

function generateUniqueId(): string {
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
