'use client'

import { useState, useEffect } from 'react'

const CONSENT_KEY = 'imi-cookie-consent'

export default function CookieConsent() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const consent = localStorage.getItem(CONSENT_KEY)
        if (!consent) {
            const timer = setTimeout(() => setVisible(true), 1500)
            return () => clearTimeout(timer)
        }
    }, [])

    const accept = () => {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }))
        setVisible(false)
    }

    const decline = () => {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }))
        setVisible(false)
    }

    if (!visible) return null

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 9999,
                padding: '0 16px 16px',
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    maxWidth: 520,
                    margin: '0 auto',
                    background: 'var(--bg-elevated, #101830)',
                    border: '1px solid var(--border-default, rgba(200,164,74,.15))',
                    borderRadius: 12,
                    padding: '16px 20px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    pointerEvents: 'auto',
                    fontFamily: 'var(--font-sans, system-ui)',
                }}
            >
                <p style={{ color: 'var(--text-primary, #E8E4DC)', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    Utilizamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa{' '}
                    <a
                        href="/pt/privacidade"
                        style={{ color: 'var(--accent-400, #C8A44A)', textDecoration: 'underline' }}
                    >
                        Política de Privacidade
                    </a>{' '}
                    e com o uso de cookies conforme a LGPD.
                </p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                        onClick={decline}
                        style={{
                            flex: 1,
                            height: 36,
                            borderRadius: 6,
                            border: '1px solid var(--border-default, rgba(200,164,74,.20))',
                            background: 'transparent',
                            color: 'var(--text-secondary, #8CA4B8)',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Recusar
                    </button>
                    <button
                        onClick={accept}
                        style={{
                            flex: 1,
                            height: 36,
                            borderRadius: 6,
                            background: 'var(--accent-400, #C8A44A)',
                            color: 'white',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Aceitar Cookies
                    </button>
                </div>
            </div>
        </div>
    )
}
