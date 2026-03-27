/**
 * WhatsApp Click Tracking — fire-and-forget analytics
 */

export async function trackWhatsAppClick(params: {
  development_id?: string
  development_name?: string
  broker_id?: string
  broker_name?: string
  source_page: string
  unit_id?: string
}) {
  try {
    await fetch('/api/tracking/whatsapp-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        url: window.location.href,
      }),
    })
  } catch {
    // fire-and-forget — never fail the UI
  }
}

export function openWhatsAppTracked(params: {
  phone: string
  message: string
  development_id?: string
  development_name?: string
  broker_id?: string
  broker_name?: string
  source_page: string
  unit_id?: string
}) {
  const { phone, message, ...trackData } = params
  trackWhatsAppClick(trackData)
  const cleanPhone = phone.replace(/\D/g, '')
  window.open(
    `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`,
    '_blank'
  )
}
