'use client'

/**
 * PWAManager
 *
 * Handles all Progressive Web App lifecycle concerns for the IMI backoffice:
 *   1. Service Worker registration (/sw.js)
 *   2. Push notification permission prompt (slides down from top after 10 s)
 *   3. Install prompt / Add-to-Home-Screen banner (slides up from bottom, mobile only)
 */

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { T } from '@/app/(backoffice)/lib/theme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|Android/i.test(navigator.userAgent)
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PWAManager() {
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null)

  // Install prompt state
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBar, setShowInstallBar] = useState(false)

  // Notification banner state
  const [showNotifBanner, setShowNotifBanner] = useState(false)

  // -------------------------------------------------------------------------
  // 1. Service Worker registration
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        swRegistrationRef.current = registration
      })
      .catch(() => {
        // Silent fail — SW is an enhancement, not required for functionality
      })
  }, [])

  // -------------------------------------------------------------------------
  // 2. Push notification permission banner (after 10 s delay)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem('imi-notif-dismissed') === '1') return

    const timer = setTimeout(() => {
      setShowNotifBanner(true)
    }, 10_000)

    return () => clearTimeout(timer)
  }, [])

  async function handleEnableNotifications() {
    setShowNotifBanner(false)

    try {
      const permission = await Notification.requestPermission()

      if (permission !== 'granted') {
        toast.info('Notificações não ativadas.')
        return
      }

      const registration = swRegistrationRef.current
      if (!registration) {
        toast.error('Service worker não disponível.')
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        toast.success('Notificações ativadas!')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as BufferSource,
      })

      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })

      toast.success('Notificações ativadas! Você receberá alertas de leads e eventos.')
    } catch {
      toast.error('Erro ao ativar notificações.')
    }
  }

  function handleDismissNotif() {
    setShowNotifBanner(false)
    localStorage.setItem('imi-notif-dismissed', '1')
  }

  // -------------------------------------------------------------------------
  // 3. Install prompt (Add to Home Screen)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isStandalone()) return
    if (!isMobileUA()) return
    if (localStorage.getItem('imi-pwa-dismissed') === '1') return

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setInstallPromptEvent(e as BeforeInstallPromptEvent)
      setShowInstallBar(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    }
  }, [])

  async function handleInstall() {
    if (!installPromptEvent) return
    await installPromptEvent.prompt()
    const { outcome } = await installPromptEvent.userChoice
    if (outcome === 'accepted') {
      toast.success('IMI instalado com sucesso!')
    }
    setShowInstallBar(false)
    setInstallPromptEvent(null)
  }

  function handleDismissInstall() {
    setShowInstallBar(false)
    localStorage.setItem('imi-pwa-dismissed', '1')
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Push Notification Banner — slides down from top                     */}
      {/* ------------------------------------------------------------------ */}
      {showNotifBanner && (
        <div
          role="banner"
          aria-live="polite"
          className="fixed top-14 lg:top-16 left-0 right-0 z-50 flex items-center gap-3 px-4 py-3 lg:pl-64"
          style={{
            background: 'var(--bg-elevated)',
            borderBottom: '1px solid rgba(184,148,58,0.25)',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>
            🔔{' '}
            <span className="font-medium">Ativar notificações</span> para receber alertas de
            leads e eventos em tempo real
          </span>
          <button
            onClick={handleEnableNotifications}
            className="shrink-0 px-3 py-1.5 rounded text-xs font-semibold transition-opacity hover:opacity-80"
            style={{
              background: 'var(--imi-gold-500)',
              color: T.text,
            }}
          >
            Ativar
          </button>
          <button
            onClick={handleDismissNotif}
            aria-label="Fechar banner de notificações"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            ×
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Install Bar — slides up from bottom                                 */}
      {/* ------------------------------------------------------------------ */}
      {showInstallBar && (
        <div
          role="complementary"
          aria-label="Instalar IMI como app"
          className="fixed bottom-16 left-0 right-0 z-[55] flex items-center gap-3 px-4 py-3"
          style={{
            background: 'var(--bg-base)',
            borderTop: '2px solid rgba(184,148,58,0.25)',
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <span className="text-sm flex-1" style={{ color: '#E8E0D0' }}>
            📱 Instalar o <span className="font-semibold">IMI</span> como app
          </span>
          <button
            onClick={handleInstall}
            className="shrink-0 px-4 py-1.5 rounded text-xs font-semibold transition-opacity hover:opacity-80"
            style={{
              background: 'var(--imi-gold-500)',
              color: T.text,
            }}
          >
            Instalar
          </button>
          <button
            onClick={handleDismissInstall}
            aria-label="Fechar banner de instalação"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded transition-opacity hover:opacity-70"
            style={{ color: '#8A7A6A' }}
          >
            ×
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Keyframe animations (injected once via style tag)                   */}
      {/* ------------------------------------------------------------------ */}
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
