'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Printer } from 'lucide-react'

interface TrackedLink {
    id: string
    short_code: string
    destination_url: string
    campaign_name: string | null
    developments: { name: string } | null
}

export default function QRPrintPage() {
    const { id } = useParams<{ id: string }>()
    const [link, setLink] = useState<TrackedLink | null>(null)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        const supabase = createClient()
        async function load() {
            setLoading(true)
            const { data } = await supabase
                .from('tracked_links')
                .select('*, developments(name)')
                .eq('id', id)
                .single()

            if (data) {
                setLink(data as TrackedLink)
                const trackingBaseUrl = 'https://www.iulemirandaimoveis.com.br'
                const qrUrl = `${trackingBaseUrl}/l/${data.short_code}`
                const dataUrl = await QRCode.toDataURL(qrUrl, {
                    width: 800,
                    margin: 3,
                    color: { dark: '#1A1A2E', light: '#FFFFFF' },
                    errorCorrectionLevel: 'H',
                })
                setQrDataUrl(dataUrl)
            }
            setLoading(false)
        }
        load()
    }, [id])

    const trackingBaseUrl = 'https://www.iulemirandaimoveis.com.br'
    const shortUrl = link ? `${trackingBaseUrl}/l/${link.short_code}` : ''
    const propertyName = link?.developments?.name || link?.campaign_name || 'Im\u00f3vel'

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fff' }}>
                <Loader2 size={36} className="animate-spin" style={{ color: '#1A1A2E' }} />
            </div>
        )
    }

    if (!link || !qrDataUrl) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fff' }}>
                <p style={{ color: '#666', fontFamily: 'system-ui', fontSize: 14 }}>Link n&atilde;o encontrado.</p>
            </div>
        )
    }

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0; padding: 0; }
                    @page { size: A4; margin: 20mm; }
                }
            `}</style>

            <div style={{
                minHeight: '100vh', background: '#FFFFFF',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '40px 24px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
            }}>
                {/* Print Button */}
                <button
                    className="no-print"
                    onClick={() => window.print()}
                    style={{
                        position: 'fixed', top: 24, right: 24,
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '10px 20px', borderRadius: 8,
                        background: '#1A1A2E', color: '#FFFFFF',
                        fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'opacity 150ms ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
                >
                    <Printer size={16} />
                    Imprimir
                </button>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <h1 style={{
                        fontFamily: "'Cormorant Garamond', 'Georgia', serif",
                        fontSize: 48, fontWeight: 700, color: '#1A1A2E',
                        letterSpacing: '0.08em', margin: 0, lineHeight: 1,
                    }}>
                        IMI
                    </h1>
                    <p style={{
                        fontFamily: 'system-ui, sans-serif',
                        fontSize: 11, fontWeight: 600, color: '#888',
                        textTransform: 'uppercase', letterSpacing: '0.2em',
                        margin: '6px 0 0',
                    }}>
                        Intelig&ecirc;ncia Imobili&aacute;ria
                    </p>
                </div>

                {/* QR Code */}
                <div style={{
                    width: 400, height: 400,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 32,
                }}>
                    <img
                        src={qrDataUrl}
                        alt={`QR Code - ${propertyName}`}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                </div>

                {/* Property Name */}
                <h2 style={{
                    fontFamily: "'Cormorant Garamond', 'Georgia', serif",
                    fontSize: 24, fontWeight: 600, color: '#1A1A2E',
                    textAlign: 'center', margin: '0 0 12px', lineHeight: 1.3,
                    maxWidth: 400,
                }}>
                    {propertyName}
                </h2>

                {/* Short URL */}
                <p style={{
                    fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                    fontSize: 13, color: '#666',
                    textAlign: 'center', margin: '0 0 24px',
                    letterSpacing: '0.02em',
                }}>
                    {shortUrl}
                </p>

                {/* CTA */}
                <div style={{
                    padding: '12px 32px', borderRadius: 8,
                    background: 'linear-gradient(135deg, #B8860B, #DAA520)',
                    color: '#FFFFFF', fontSize: 15, fontWeight: 700,
                    letterSpacing: '0.04em', textAlign: 'center',
                    fontFamily: 'system-ui, sans-serif',
                }}>
                    Escaneie para ver o im&oacute;vel
                </div>

                {/* Subtle footer */}
                <p style={{
                    fontSize: 10, color: '#BBB', marginTop: 40,
                    fontFamily: 'system-ui, sans-serif', letterSpacing: '0.05em',
                }}>
                    iulemirandaimoveis.com.br
                </p>
            </div>
        </>
    )
}
