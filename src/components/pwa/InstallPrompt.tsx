'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [showPrompt, setShowPrompt] = useState(false)
    const [isInstalled, setIsInstalled] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true)
            return
        }
        // Check dismissal
        const dismissed = localStorage.getItem('pwa-dismiss-date')
        if (dismissed) {
            const daysSince = (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24)
            if (daysSince < 7) return
        }
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
            setShowPrompt(true)
        }
        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        await deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') setIsInstalled(true)
        setDeferredPrompt(null)
        setShowPrompt(false)
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('pwa-dismiss-date', new Date().toISOString())
    }

    if (isInstalled || !showPrompt) return null

    return (
        <div style={{
            position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9999,
            maxWidth: 400, margin: '0 auto',
            background: '#0A1624', borderRadius: 16,
            border: '1px solid rgba(200,164,74,0.2)',
            padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                    background: 'rgba(200,164,74,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: 16, fontWeight: 700, color: '#C8A44A',
                }}>IMI</div>
                <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#E8E4DC' }}>Instalar IMI</p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#8E99AB' }}>Acesse mais rápido direto da tela inicial</p>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button onClick={handleInstall} style={{
                            background: '#0A1624', color: '#E8E4DC', border: '1px solid rgba(200,164,74,0.3)',
                            borderRadius: 6, padding: '8px 16px', fontSize: 11, fontWeight: 600,
                            letterSpacing: '0.5px', cursor: 'pointer',
                        }}>INSTALAR</button>
                        <button onClick={handleDismiss} style={{
                            background: 'transparent', color: '#8E99AB', border: 'none',
                            padding: '8px 16px', fontSize: 11, cursor: 'pointer',
                        }}>Agora não</button>
                    </div>
                </div>
            </div>
        </div>
    )
}
