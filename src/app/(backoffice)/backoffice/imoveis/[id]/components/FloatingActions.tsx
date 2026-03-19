'use client'

import { useState } from 'react'
import { Edit, BarChart2, Layers, Clock, Share2, CheckSquare } from 'lucide-react'

export function FloatingActions({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{
      position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8,
      zIndex: 50,
    }}>
      {[
        { icon: Edit, label: 'Editar', href: `/backoffice/imoveis/${id}/editar` },
        { icon: BarChart2, label: 'Analytics', href: `/backoffice/imoveis/${id}/analytics` },
        { icon: Layers, label: 'Timeline', href: `/backoffice/imoveis/${id}/timeline` },
        { icon: Clock, label: 'Unidades', href: `/backoffice/imoveis/${id}/unidades` },
      ].map(({ icon: Icon, label, href }) => (
        <a key={label} href={href} title={label} style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'var(--bg-elevated)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-secondary)', textDecoration: 'none',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(184,148,58,0.5)'; (e.currentTarget as HTMLElement).style.color = 'var(--imi-gold-500)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(184,148,58,0.18)'; (e.currentTarget as HTMLElement).style.color = '#9FAAB8' }}
        >
          <Icon size={16} />
        </a>
      ))}
      <button onClick={handleShare} title={copied ? 'Copiado!' : 'Copiar link'} style={{
        width: 40, height: 40, borderRadius: 10,
        background: copied ? 'rgba(107,184,123,0.2)' : 'rgba(11,25,40,0.9)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${copied ? 'rgba(107,184,123,0.4)' : 'rgba(184,148,58,0.18)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: copied ? '#6BB87B' : '#9FAAB8', cursor: 'pointer',
        transition: 'all 0.2s',
      }}>
        {copied ? <CheckSquare size={16} /> : <Share2 size={16} />}
      </button>
    </div>
  )
}
