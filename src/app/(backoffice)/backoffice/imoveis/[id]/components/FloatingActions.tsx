'use client'

import { useState, useEffect, useRef } from 'react'
import { Edit, BarChart2, Layers, Clock, Share2, CheckSquare, QrCode, X, Download } from 'lucide-react'

export function FloatingActions({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleQrOpen = async () => {
    setQrOpen(true)
    if (qrDataUrl) return // already loaded
    setQrLoading(true)
    try {
      const pageUrl = window.location.href
      // Use the server-side qrcode library via a lightweight endpoint
      const res = await fetch('/api/qr/simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: pageUrl }),
      })
      if (res.ok) {
        const data = await res.json()
        setQrDataUrl(data.qr_data_url)
      }
    } catch {
      // Fallback: use external QR service
      const pageUrl = encodeURIComponent(window.location.href)
      setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${pageUrl}`)
    } finally {
      setQrLoading(false)
    }
  }

  const handleDownloadQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `qr-imovel-${id}.png`
    a.click()
  }

  // Close on outside click
  useEffect(() => {
    if (!qrOpen) return
    const handler = (e: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
        setQrOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [qrOpen])

  const actionBtnStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 10,
    background: 'var(--bg-elevated)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-subtle)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-secondary)', textDecoration: 'none',
    transition: 'all 0.15s', cursor: 'pointer',
  }

  return (
    <>
      <div style={{
        position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 8,
        zIndex: 50,
      }}>
        {[
          { icon: Edit, label: 'Editar', href: `/backoffice/imoveis/${id}/editar` },
          { icon: BarChart2, label: 'Analytics', href: `/backoffice/imoveis/${id}/analytics`, target: '_blank' as const },
          { icon: Layers, label: 'Timeline', href: `/backoffice/imoveis/${id}/timeline`, target: '_blank' as const },
          { icon: Clock, label: 'Unidades', href: `/backoffice/imoveis/${id}/unidades`, target: '_blank' as const },
        ].map(({ icon: Icon, label, href, target }) => (
          <a key={label} href={href} title={label} target={target}
            rel={target ? 'noopener noreferrer' : undefined}
            style={actionBtnStyle}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,111,255,0.5)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-400)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,111,255,0.18)'; (e.currentTarget as HTMLElement).style.color = '#9FAAB8' }}
          >
            <Icon size={16} />
          </a>
        ))}

        {/* QR Code button */}
        <button onClick={handleQrOpen} title="QR Code" style={{
          ...actionBtnStyle,
          background: qrOpen ? 'rgba(200,164,74,0.15)' : 'var(--bg-elevated)',
          borderColor: qrOpen ? 'rgba(200,164,74,0.3)' : 'var(--border-subtle)',
          color: qrOpen ? '#C8A44A' : 'var(--text-secondary)',
        }}
        onMouseEnter={e => { if (!qrOpen) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,164,74,0.4)'; (e.currentTarget as HTMLElement).style.color = '#C8A44A' }}}
        onMouseLeave={e => { if (!qrOpen) { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(61,111,255,0.18)'; (e.currentTarget as HTMLElement).style.color = '#9FAAB8' }}}
        >
          <QrCode size={16} />
        </button>

        {/* Share button */}
        <button onClick={handleShare} title={copied ? 'Copiado!' : 'Copiar link'} style={{
          width: 40, height: 40, borderRadius: 10,
          background: copied ? 'rgba(107,184,123,0.2)' : 'rgba(11,25,40,0.9)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${copied ? 'rgba(107,184,123,0.4)' : 'rgba(61,111,255,0.18)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: copied ? '#6BB87B' : '#9FAAB8', cursor: 'pointer',
          transition: 'all 0.2s',
        }}>
          {copied ? <CheckSquare size={16} /> : <Share2 size={16} />}
        </button>
      </div>

      {/* QR Code Dialog */}
      {qrOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div ref={dialogRef} style={{
            background: '#141420',
            border: '1px solid rgba(200,164,74,0.15)',
            borderRadius: 16,
            padding: 32,
            maxWidth: 360,
            width: '90vw',
            position: 'relative',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}>
            {/* Close */}
            <button
              onClick={() => setQrOpen(false)}
              style={{
                position: 'absolute', top: 12, right: 12,
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#9FAAB8', cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#C8A44A', marginBottom: 4 }}>
                QR Code
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                Escaneie para acessar este imóvel
              </p>
            </div>

            {/* QR */}
            <div style={{
              background: '#ffffff',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              minHeight: 220,
            }}>
              {qrLoading ? (
                <div style={{ color: '#666', fontSize: 13 }}>Gerando...</div>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" style={{ width: 200, height: 200 }} />
              ) : (
                <div style={{ color: '#999', fontSize: 13 }}>Erro ao gerar QR</div>
              )}
            </div>

            {/* Download */}
            {qrDataUrl && (
              <button
                onClick={handleDownloadQr}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: 10,
                  background: 'rgba(200,164,74,0.1)',
                  border: '1px solid rgba(200,164,74,0.2)',
                  color: '#C8A44A',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'all 0.15s',
                }}
              >
                <Download size={14} /> Baixar QR Code
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
