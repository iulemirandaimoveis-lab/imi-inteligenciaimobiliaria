// Report Core Web Vitals to console and/or analytics
export function reportWebVitals(metric: { name: string; value: number; id: string }) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vital] ${metric.name}: ${metric.value}`)
  }
  // Send to analytics endpoint
  if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
    navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(metric))
  }
}
