'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FileText, Clock, Bell, ArrowLeft } from 'lucide-react'

export default function ConteudosPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link href="/backoffice/hoje" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Voltar ao início
      </Link>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--r-xl)',
          padding: '40px 32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(184,148,58,0.06)', filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        {/* "Em Breve" tag */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 'var(--r-full)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            fontSize: 10, fontWeight: 700,
            color: 'var(--text-secondary)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            <Clock size={11} />
            EM BREVE
          </span>
        </div>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--r-xl)',
          background: 'rgba(184,148,58,0.08)',
          border: '1px solid rgba(184,148,58,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <FileText size={32} style={{ color: 'var(--imi-gold-500)' }} />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28, fontWeight: 600, color: 'var(--text-primary)',
          marginBottom: 12, lineHeight: 1.2,
        }}>
          Central de Publicações
        </h1>
        <p style={{
          fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65,
          maxWidth: 420, margin: '0 auto 28px',
        }}>
          Gerencie e publique conteúdo nos portais imobiliários, redes sociais e site institucional de forma centralizada.
        </p>

        {/* Features list */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          maxWidth: 360, margin: '0 auto 28px', textAlign: 'left',
        }}>
          {[
            'Publicação automática em portais (ZAP, VivaReal)',
            'Integração com redes sociais',
            'Calendário editorial de conteúdo',
          ].map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                background: 'rgba(184,148,58,0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--imi-gold-500)' }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{feat}</span>
            </div>
          ))}
        </div>

        {/* Notify CTA */}
        <button
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 44, padding: '0 24px',
            borderRadius: 'var(--r-md)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
          onClick={() => {
            const btn = document.getElementById('notify-btn') as HTMLButtonElement | null
            if (btn) { btn.textContent = '✓ Você será notificado!'; btn.style.color = 'var(--success)'; btn.disabled = true }
          }}
          id="notify-btn"
        >
          <Bell size={15} />
          Me avise quando lançar
        </button>
      </motion.div>
    </div>
  )
}
