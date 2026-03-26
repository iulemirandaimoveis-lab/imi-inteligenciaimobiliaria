import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'

const PUBLIC_DOMAIN = 'iulemirandaimoveis.com.br'
const PUBLIC_BASE = `https://www.${PUBLIC_DOMAIN}`
const GOLD = '#C49D5B'

export default async function QRPrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch tracked link with development info
    const { data: link } = await supabase
        .from('tracked_links')
        .select('id, short_code, campaign_name, url, development_id, created_at, developments(name, address, neighborhood, city)')
        .eq('id', id)
        .single()

    if (!link) notFound()

    const dev = (Array.isArray(link.developments) ? link.developments[0] : link.developments) as { name: string; address?: string; neighborhood?: string; city?: string } | null
    const propertyName = dev?.name || link.campaign_name || 'Imóvel'
    const address = [dev?.address, dev?.neighborhood, dev?.city].filter(Boolean).join(', ')
    const shortCode = link.short_code
    const shortUrl = `${PUBLIC_BASE}/l/${shortCode}`
    const displayUrl = `${PUBLIC_DOMAIN}/l/${shortCode}`
    const createdAt = link.created_at
        ? new Date(link.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

    // Generate QR code server-side as data URL
    const qrDataUrl = await QRCode.toDataURL(shortUrl, {
        width: 600,
        margin: 2,
        color: { dark: GOLD, light: '#FFFFFF' },
        errorCorrectionLevel: 'H',
    })

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    html, body { background: #fff !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    @page { size: A4; margin: 20mm; }
                }
            `}</style>

            <div style={{
                minHeight: '100vh',
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
                fontFamily: "'Outfit', system-ui, -apple-system, sans-serif",
                color: '#1A1A2E',
            }}>
                {/* Print button — hidden when printing */}
                <button
                    className="no-print"
                    onClick={undefined}
                    style={{
                        position: 'fixed',
                        top: 24,
                        right: 24,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 20px',
                        borderRadius: 8,
                        background: '#1A1A2E',
                        color: '#FFFFFF',
                        fontSize: 14,
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                >
                    <PrintIcon />
                    Imprimir
                </button>

                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 48 }}>
                    <h1 style={{
                        fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
                        fontSize: 52,
                        fontWeight: 700,
                        color: '#1A1A2E',
                        letterSpacing: '0.08em',
                        margin: 0,
                        lineHeight: 1,
                    }}>
                        IMI
                    </h1>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        marginTop: 8,
                    }}>
                        <span style={{
                            display: 'inline-block',
                            width: 24,
                            height: 1,
                            background: GOLD,
                        }} />
                        <p style={{
                            fontFamily: "'Outfit', system-ui, sans-serif",
                            fontSize: 10,
                            fontWeight: 600,
                            color: '#888',
                            textTransform: 'uppercase',
                            letterSpacing: '0.22em',
                            margin: 0,
                        }}>
                            Inteligência Imobiliária
                        </p>
                        <span style={{
                            display: 'inline-block',
                            width: 24,
                            height: 1,
                            background: GOLD,
                        }} />
                    </div>
                </div>

                {/* QR Code */}
                <div style={{
                    width: 300,
                    height: 300,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 32,
                    border: `2px solid ${GOLD}`,
                    borderRadius: 12,
                    padding: 12,
                }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={qrDataUrl}
                        alt={`QR Code - ${propertyName}`}
                        width={300}
                        height={300}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                </div>

                {/* Development name */}
                <h2 style={{
                    fontFamily: "'Playfair Display', 'Cormorant Garamond', Georgia, serif",
                    fontSize: 26,
                    fontWeight: 600,
                    color: '#1A1A2E',
                    textAlign: 'center',
                    margin: '0 0 6px',
                    lineHeight: 1.3,
                    maxWidth: 420,
                }}>
                    {propertyName}
                </h2>

                {/* Address */}
                {address && (
                    <p style={{
                        fontSize: 12,
                        color: '#888',
                        textAlign: 'center',
                        margin: '0 0 20px',
                        maxWidth: 400,
                    }}>
                        {address}
                    </p>
                )}

                {/* Short URL */}
                <p style={{
                    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', Consolas, monospace",
                    fontSize: 13,
                    color: '#666',
                    textAlign: 'center',
                    margin: '0 0 28px',
                    letterSpacing: '0.02em',
                    padding: '6px 16px',
                    background: '#F5F5F5',
                    borderRadius: 6,
                }}>
                    {displayUrl}
                </p>

                {/* CTA */}
                <div style={{
                    padding: '14px 36px',
                    borderRadius: 8,
                    background: GOLD,
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textAlign: 'center',
                    fontFamily: "'Outfit', system-ui, sans-serif",
                }}>
                    Escaneie para acessar o imóvel
                </div>

                {/* Date generated */}
                <p style={{
                    fontSize: 10,
                    color: '#BBB',
                    marginTop: 48,
                    fontFamily: "'Outfit', system-ui, sans-serif",
                    letterSpacing: '0.05em',
                }}>
                    Gerado em {createdAt} &middot; {PUBLIC_DOMAIN}
                </p>
            </div>

            {/* Client-side print trigger script */}
            <PrintScript />
        </>
    )
}

/** Inline SVG printer icon to avoid importing lucide in a server component */
function PrintIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect width="12" height="8" x="6" y="14" />
        </svg>
    )
}

/** Small client script to wire up the print button */
function PrintScript() {
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `document.querySelector('.no-print')?.addEventListener('click',function(){window.print()})`,
            }}
        />
    )
}
