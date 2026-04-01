// Report Core Web Vitals to console and/or analytics
// NOTE: In Next.js App Router, this export is NOT auto-called.
// Use the <WebVitalsReporter /> client component instead (see below).

export type WebVitalMetric = {
  name: string
  value: number
  id: string
  rating?: 'good' | 'needs-improvement' | 'poor'
}

/**
 * Send a single metric to the analytics endpoint.
 * Uses `sendBeacon` for reliability (fires even on page unload).
 * Falls back to `fetch` if sendBeacon is unavailable.
 */
export function reportWebVitals(metric: WebVitalMetric): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const color = metric.rating === 'good' ? '\x1b[32m'
      : metric.rating === 'poor' ? '\x1b[31m' : '\x1b[33m'
    console.log(`${color}[Web Vital] ${metric.name}: ${Math.round(metric.value)}ms (${metric.rating || 'n/a'})\x1b[0m`)
  }

  const payload = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    timestamp: Date.now(),
  })

  // Send to analytics endpoint
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    navigator.sendBeacon('/api/analytics/vitals', payload)
  } else if (typeof fetch !== 'undefined') {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      body: payload,
      keepalive: true,
    }).catch(() => { /* silently fail */ })
  }
}
